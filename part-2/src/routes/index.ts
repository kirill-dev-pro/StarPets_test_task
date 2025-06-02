import express from 'express'
import { Op } from 'sequelize'
import { Task } from '../models/Task.ts'
import { TaskHistory } from '../models/TaskHistory.ts'

const rootRouter = express.Router()

rootRouter.get('/health', (_, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

rootRouter.get('/', async (_, res) => {
  try {
    // Fetch all tasks with their current status
    const tasks = await Task.findAll({
      order: [['name', 'ASC']],
    })

    // Get recent executions (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentHistory = await TaskHistory.findAll({
      where: {
        completedAt: {
          [Op.gte]: last24Hours,
        },
      },
      order: [['completedAt', 'DESC']],
      limit: 10,
    })

    // Calculate statistics
    const totalTasks = tasks.length
    const runningTasks = tasks.filter((task) => task.isRunning).length
    const waitingTasks = totalTasks - runningTasks
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

    const successRate =
      recentExecutions > 0 ? ((successfulExecutions / recentExecutions) * 100).toFixed(1) : '0'

    // Format task data for display
    const now = new Date()
    const tasksWithStatus = tasks.map((task) => {
      let status = 'waiting'
      let statusColor = 'bg-yellow-600'
      let runningTimeMs: number | null = null

      if (task.isRunning && task.startedAt) {
        status = 'running'
        statusColor = 'bg-green-600'
        runningTimeMs = now.getTime() - task.startedAt.getTime()
      } else if (task.nextRunAt > now) {
        status = 'scheduled'
        statusColor = 'bg-blue-600'
      }

      return {
        ...task.toJSON(),
        status,
        statusColor,
        runningTimeMs,
        runningTimeFormatted: runningTimeMs ? formatDuration(runningTimeMs) : null,
        timeUntilNextRun: status === 'scheduled' ? task.nextRunAt.getTime() - now.getTime() : null,
        timeUntilNextRunFormatted:
          status === 'scheduled' ? formatDuration(task.nextRunAt.getTime() - now.getTime()) : null,
      }
    })

    res.send(`
      <!DOCTYPE html>
      <html class="dark">
        <head>
          <title>StarPets - Distributed Cron Service</title>
          <script src="https://unpkg.com/htmx.org@1.9.10"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <meta http-equiv="refresh" content="10">
        </head>
        <body class="bg-gray-900 text-gray-100 min-h-screen p-6">
          <div class="max-w-7xl mx-auto">
            <h1 class="text-4xl font-bold mb-8 text-center">StarPets Distributed Cron Service</h1>
            
            <!-- Statistics Overview -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold text-blue-400 mb-2">Total Tasks</h3>
                <p class="text-3xl font-bold">${totalTasks}</p>
              </div>
              <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold text-green-400 mb-2">Running Tasks</h3>
                <p class="text-3xl font-bold text-green-400">${runningTasks}</p>
              </div>
              <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold text-yellow-400 mb-2">Waiting Tasks</h3>
                <p class="text-3xl font-bold text-yellow-400">${waitingTasks}</p>
              </div>
              <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold text-purple-400 mb-2">Success Rate (24h)</h3>
                <p class="text-3xl font-bold text-purple-400">${successRate}%</p>
                <p class="text-sm text-gray-400">${successfulExecutions}/${recentExecutions} executions</p>
              </div>
            </div>

            <!-- Tasks Status -->
            <div class="mb-8">
              <h2 class="text-2xl font-bold mb-6">Background Tasks Status</h2>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${tasksWithStatus
                  .map(
                    (task) => `
                  <div class="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <div class="flex justify-between items-start mb-4">
                      <h3 class="text-xl font-semibold">${task.name}</h3>
                      <span class="px-3 py-1 rounded-full text-sm font-medium text-white ${task.statusColor}">
                        ${task.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p class="text-gray-400">Function:</p>
                        <p class="font-medium">${task.functionName}</p>
                      </div>
                      <div>
                        <p class="text-gray-400">Interval:</p>
                        <p class="font-medium">${task.interval}s (${Math.round(task.interval / 60)}min)</p>
                      </div>
                      ${
                        task.serverId
                          ? `
                        <div>
                          <p class="text-gray-400">Server ID:</p>
                          <p class="font-medium text-xs">${task.serverId.substring(0, 8)}...</p>
                        </div>
                      `
                          : ''
                      }
                      ${
                        task.runningTimeFormatted
                          ? `
                        <div>
                          <p class="text-gray-400">Running Time:</p>
                          <p class="font-medium text-green-400">${task.runningTimeFormatted}</p>
                        </div>
                      `
                          : ''
                      }
                      ${
                        task.timeUntilNextRunFormatted
                          ? `
                        <div>
                          <p class="text-gray-400">Next Run In:</p>
                          <p class="font-medium text-blue-400">${task.timeUntilNextRunFormatted}</p>
                        </div>
                      `
                          : ''
                      }
                      ${
                        task.lastRunAt
                          ? `
                        <div>
                          <p class="text-gray-400">Last Run:</p>
                          <p class="font-medium">${new Date(task.lastRunAt).toLocaleString()}</p>
                        </div>
                      `
                          : ''
                      }
                    </div>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            </div>

            <!-- Recent Execution History -->
            <div class="mb-8">
              <h2 class="text-2xl font-bold mb-6">Recent Execution History (Last 24h)</h2>
              <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-gray-700">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Task</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Server</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Completed</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                      ${
                        recentHistory.length > 0
                          ? recentHistory
                              .map(
                                (execution) => `
                        <tr class="hover:bg-gray-750">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium">${execution.taskName}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-300">${execution.serverId.substring(0, 8)}...</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-300">${formatDuration(execution.duration)}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              execution.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }">
                              ${execution.status}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            ${new Date(execution.completedAt).toLocaleString()}
                          </td>
                        </tr>
                      `,
                              )
                              .join('')
                          : `
                        <tr>
                          <td colspan="5" class="px-6 py-4 text-center text-gray-400">
                            No recent executions found
                          </td>
                        </tr>
                      `
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Server List -->
            <div class="mb-8">
              <h2 class="text-2xl font-bold mb-6">Server List</h2>
              <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-gray-700">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Server ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Assigned Tasks</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                      ${(() => {
                        const serverMap = new Map()
                        tasksWithStatus.forEach((task) => {
                          if (task.serverId) {
                            if (!serverMap.has(task.serverId)) {
                              serverMap.set(task.serverId, [])
                            }
                            serverMap.get(task.serverId).push(task.name)
                          }
                        })
                        return Array.from(serverMap.entries())
                          .map(
                            ([serverId, tasks]) => `
                          <tr class="hover:bg-gray-750">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm font-medium">${serverId.substring(0, 8)}...</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-300">${tasks.join(', ')}</div>
                            </td>
                          </tr>
                        `,
                          )
                          .join('')
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- API Information -->
            <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 class="text-xl font-semibold mb-4">API Endpoints</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="font-medium text-blue-400">Task Monitoring:</p>
                  <ul class="list-disc pl-5 mt-2 space-y-1">
                    <li><code class="bg-gray-700 px-2 py-1 rounded">GET /api/tasks</code> - Current task status</li>
                    <li><code class="bg-gray-700 px-2 py-1 rounded">GET /api/tasks/stats</code> - Performance statistics</li>
                    <li><code class="bg-gray-700 px-2 py-1 rounded">GET /api/tasks/history</code> - Execution history</li>
                  </ul>
                </div>
                <div>
                  <p class="font-medium text-green-400">User Management:</p>
                  <ul class="list-disc pl-5 mt-2 space-y-1">
                    <li><code class="bg-gray-700 px-2 py-1 rounded">PATCH /api/users/:id/balance</code> - Update balance</li>
                    <li><code class="bg-gray-700 px-2 py-1 rounded">GET /api/users/:id/balance</code> - Get balance</li>
                    <li><code class="bg-gray-700 px-2 py-1 rounded">GET /health</code> - Health check</li>
                  </ul>
                </div>
              </div>
              <div class="mt-4 text-xs text-gray-400">
                Page auto-refreshes every 10 seconds to show real-time task status
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
  } catch (error) {
    console.error('Error loading dashboard:', error)
    res.status(500).send(`
      <!DOCTYPE html>
      <html class="dark">
        <head>
          <title>StarPets - Error</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100 min-h-screen p-6 flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-red-400 mb-4">Error Loading Dashboard</h1>
            <p class="text-gray-300 mb-4">Failed to load task information</p>
            <p class="text-sm text-gray-500">${error instanceof Error ? error.message : String(error)}</p>
          </div>
        </body>
      </html>
    `)
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

export default rootRouter
