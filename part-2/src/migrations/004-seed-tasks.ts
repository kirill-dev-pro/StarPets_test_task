import type { Migration } from '../migrations/runner.ts'

export const up: Migration = async ({ context: queryInterface }) => {
  const now = new Date()

  await queryInterface.bulkInsert('tasks', [
    {
      name: 'data-processor',
      interval: 60, // 1 minute
      functionName: 'processData',
      isRunning: false,
      serverId: null,
      startedAt: null,
      lastRunAt: null,
      nextRunAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'cache-cleaner',
      interval: 75, // 1.25 minutes
      functionName: 'cleanCache',
      isRunning: false,
      serverId: null,
      startedAt: null,
      lastRunAt: null,
      nextRunAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'report-generator',
      interval: 90, // 1.5 minutes
      functionName: 'generateReports',
      isRunning: false,
      serverId: null,
      startedAt: null,
      lastRunAt: null,
      nextRunAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'log-analyzer',
      interval: 105, // 1.75 minutes
      functionName: 'analyzeLogs',
      isRunning: false,
      serverId: null,
      startedAt: null,
      lastRunAt: null,
      nextRunAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'backup-manager',
      interval: 120, // 2 minutes
      functionName: 'manageBackups',
      isRunning: false,
      serverId: null,
      startedAt: null,
      lastRunAt: null,
      nextRunAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ])
}

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.bulkDelete('tasks', {})
}
