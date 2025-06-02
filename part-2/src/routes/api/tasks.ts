import { Router } from 'express'
import { Op } from 'sequelize'
import { Task } from '../../models/Task.ts'
import { TaskHistory } from '../../models/TaskHistory.ts'

const router = Router()

// Get all tasks with their current status
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['name', 'ASC']],
    })

    const tasksWithStatus = tasks.map((task) => {
      const now = new Date()
      let status = 'waiting'
      let runningTimeMs: number | null = null

      if (task.isRunning && task.startedAt) {
        status = 'running'
        runningTimeMs = now.getTime() - task.startedAt.getTime()
      } else if (task.nextRunAt > now) {
        status = 'scheduled'
      }

      return {
        id: task.id,
        name: task.name,
        interval: task.interval,
        functionName: task.functionName,
        status,
        serverId: task.serverId,
        startedAt: task.startedAt,
        lastRunAt: task.lastRunAt,
        nextRunAt: task.nextRunAt,
        runningTimeMs,
        runningTimeFormatted: runningTimeMs ? formatDuration(runningTimeMs) : null,
        timeUntilNextRun: status === 'scheduled' ? task.nextRunAt.getTime() - now.getTime() : null,
        timeUntilNextRunFormatted:
          status === 'scheduled' ? formatDuration(task.nextRunAt.getTime() - now.getTime()) : null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }
    })

    res.json({
      success: true,
      data: tasksWithStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: error instanceof Error ? error.message : String(error),
    })
  }
})

// Get task history
router.get('/history', async (req, res) => {
  try {
    const { limit = 100, offset = 0, taskName, serverId, status } = req.query

    const whereClause: any = {}
    if (taskName) whereClause.taskName = taskName
    if (serverId) whereClause.serverId = serverId
    if (status) whereClause.status = status

    const history = await TaskHistory.findAndCountAll({
      where: whereClause,
      order: [['completedAt', 'DESC']],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    })

    res.json({
      success: true,
      data: {
        history: history.rows,
        pagination: {
          total: history.count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + parseInt(limit as string) < history.count,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching task history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task history',
      message: error instanceof Error ? error.message : String(error),
    })
  }
})

// Get task statistics
router.get('/stats', async (req, res) => {
  try {
    const totalTasks = await Task.count()
    const runningTasks = await Task.count({ where: { isRunning: true } })
    const waitingTasks = await Task.count({ where: { isRunning: false } })

    // Get recent executions (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentExecutions = await TaskHistory.count({
      where: {
        completedAt: {
          [Op.gte]: last24Hours,
        },
      },
    })

    const successfulExecutions = await TaskHistory.count({
      where: {
        completedAt: {
          [Op.gte]: last24Hours,
        },
        status: 'completed',
      },
    })

    const failedExecutions = await TaskHistory.count({
      where: {
        completedAt: {
          [Op.gte]: last24Hours,
        },
        status: 'failed',
      },
    })

    if (!TaskHistory.sequelize) {
      throw new Error('Sequelize is not initialized')
    }

    // Get average execution time for each task (last 24 hours)
    const avgExecutionTimes = await TaskHistory.findAll({
      attributes: [
        'taskName',
        [TaskHistory.sequelize.fn('AVG', TaskHistory.sequelize.col('duration')), 'avgDuration'],
        [TaskHistory.sequelize.fn('COUNT', TaskHistory.sequelize.col('id')), 'executionCount'],
      ],
      where: {
        completedAt: {
          [Op.gte]: last24Hours,
        },
        status: 'completed',
      },
      group: ['taskName'],
    })

    // Get unique servers that have executed tasks
    const activeServers = await TaskHistory.findAll({
      attributes: [
        [TaskHistory.sequelize.fn('DISTINCT', TaskHistory.sequelize.col('serverId')), 'serverId'],
      ],
      where: {
        completedAt: {
          [Op.gte]: last24Hours,
        },
      },
    })

    res.json({
      success: true,
      data: {
        overview: {
          totalTasks,
          runningTasks,
          waitingTasks,
          recentExecutions,
          successfulExecutions,
          failedExecutions,
          successRate:
            recentExecutions > 0
              ? `${((successfulExecutions / recentExecutions) * 100).toFixed(2)}%`
              : '0%',
        },
        taskPerformance: avgExecutionTimes.map((item: any) => ({
          taskName: item.taskName,
          avgDurationMs: Math.round(item.dataValues.avgDuration),
          avgDurationFormatted: formatDuration(item.dataValues.avgDuration),
          executionCount: parseInt(item.dataValues.executionCount),
        })),
        activeServers: activeServers.map((item: any) => item.dataValues.serverId),
        period: '24 hours',
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching task statistics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task statistics',
      message: error instanceof Error ? error.message : String(error),
    })
  }
})

// Get specific task details
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await Task.findByPk(taskId)
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      })
    }

    // Get recent history for this task
    const recentHistory = await TaskHistory.findAll({
      where: { taskId: task.id },
      order: [['completedAt', 'DESC']],
      limit: 10,
    })

    const now = new Date()
    let status = 'waiting'
    let runningTimeMs: number | null = null

    if (task.isRunning && task.startedAt) {
      status = 'running'
      runningTimeMs = now.getTime() - task.startedAt.getTime()
    } else if (task.nextRunAt > now) {
      status = 'scheduled'
    }

    const taskWithDetails = {
      id: task.id,
      name: task.name,
      interval: task.interval,
      functionName: task.functionName,
      status,
      serverId: task.serverId,
      startedAt: task.startedAt,
      lastRunAt: task.lastRunAt,
      nextRunAt: task.nextRunAt,
      runningTimeMs,
      runningTimeFormatted: runningTimeMs ? formatDuration(runningTimeMs) : null,
      timeUntilNextRun: status === 'scheduled' ? task.nextRunAt.getTime() - now.getTime() : null,
      timeUntilNextRunFormatted:
        status === 'scheduled' ? formatDuration(task.nextRunAt.getTime() - now.getTime()) : null,
      recentHistory,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }

    res.json({
      success: true,
      data: taskWithDetails,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching task details:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task details',
      message: error instanceof Error ? error.message : String(error),
    })
  }
})

// Utility function to format duration
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export default router
