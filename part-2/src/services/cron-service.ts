import { randomUUID } from 'node:crypto'
import { Op, Transaction } from 'sequelize'
import { db } from '../db.ts'
import { Task, type TaskInstance } from '../models/Task.ts'
import { TaskHistory } from '../models/TaskHistory.ts'
import { taskFunctions } from './task-functions.ts'

export class CronService {
  private serverId: string
  private isRunning: boolean = false
  private isExecutingTask: boolean = false
  private checkInterval: number = 1000 // Check every 1 second
  private cleanupInterval: number = 60000 // Cleanup every minute
  private intervalId: NodeJS.Timeout | null = null
  private cleanupIntervalId: NodeJS.Timeout | null = null

  constructor() {
    this.serverId = randomUUID()
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true

    this.intervalId = setInterval(() => {
      // Only check for tasks if we're not currently executing one
      if (!this.isExecutingTask) {
        this.processReadyTasks()
      }
    }, this.checkInterval)

    this.cleanupIntervalId = setInterval(() => this.cleanupStuckTasks(), this.cleanupInterval)
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }

    await Task.update(
      {
        isRunning: false,
        serverId: null,
        startedAt: null,
      },
      {
        where: {
          serverId: this.serverId,
          isRunning: true,
        },
      },
    )
  }

  private async processReadyTasks(): Promise<void> {
    try {
      const transaction = await db.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      })

      const foundTask = await Task.findOne({
        where: {
          isRunning: false,
          nextRunAt: {
            [Op.lte]: new Date(),
          },
        },
        lock: Transaction.LOCK.UPDATE,
        skipLocked: true,
        transaction,
      })

      if (!foundTask) {
        await transaction.commit()
        return
      }

      // // find and claim in single query
      const [_, [task]] = await Task.update(
        {
          isRunning: true,
          serverId: this.serverId,
          startedAt: new Date(),
        },
        {
          where: {
            id: foundTask.id,
            isRunning: false,
            nextRunAt: {
              [Op.lte]: new Date(),
            },
          },
          returning: true,
          transaction,
        },
      )

      await transaction.commit()
      await this.executeTask(task)
    } catch (error) {
      console.error('Error in processReadyTasks:', error)
    }
  }

  private async executeTask(task: TaskInstance): Promise<void> {
    this.isExecutingTask = true
    const startTime = Date.now()
    console.log(`Starting execution of task: ${task.name}`)

    try {
      const taskFunction = taskFunctions[task.functionName]
      if (!taskFunction) {
        throw new Error(`Task function '${task.functionName}' not found`)
      }

      await taskFunction()

      const endTime = Date.now()
      const duration = endTime - startTime

      await TaskHistory.create({
        taskId: task.id,
        taskName: task.name,
        serverId: this.serverId,
        startedAt: new Date(startTime),
        completedAt: new Date(endTime),
        duration,
        status: 'completed',
        error: null,
      })

      console.log(`Task ${task.name} completed successfully in ${duration}ms`)
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      await TaskHistory.create({
        taskId: task.id,
        taskName: task.name,
        serverId: this.serverId,
        startedAt: new Date(startTime),
        completedAt: new Date(endTime),
        duration,
        status: 'failed',
        error: errorMessage,
      })

      console.error(`Task ${task.name} failed after ${duration}ms:`, errorMessage)
    } finally {
      const nextRunAt = new Date(Date.now() + task.interval * 1000)

      await Task.update(
        {
          isRunning: false,
          serverId: null,
          startedAt: null,
          lastRunAt: new Date(),
          nextRunAt,
        },
        {
          where: { id: task.id },
        },
      )

      this.isExecutingTask = false
    }
  }

  private async cleanupStuckTasks(): Promise<void> {
    try {
      // 5 min
      const stuckThreshold = new Date(Date.now() - 5 * 60 * 1000)

      const stuckTasks = await Task.findAll({
        where: {
          isRunning: true,
          startedAt: {
            [Op.lt]: stuckThreshold,
          },
        },
      })

      for (const task of stuckTasks) {
        console.log(`Cleaning up stuck task: ${task.name} (stuck since ${task.startedAt})`)

        const nextRunAt = new Date(Date.now() + task.interval * 1000)

        await Task.update(
          {
            isRunning: false,
            serverId: null,
            startedAt: null,
            nextRunAt,
          },
          {
            where: { id: task.id },
          },
        )
      }
    } catch (error) {
      console.error('Error in cleanupStuckTasks:', error)
    }
  }

  public getServerId(): string {
    return this.serverId
  }

  public isServiceRunning(): boolean {
    return this.isRunning
  }
}
