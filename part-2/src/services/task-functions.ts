export type TaskFunction = () => Promise<void>

// Sleep utility function
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Generate random processing time between 2-3 minutes
const getProcessingTime = (): number => {
  return Math.floor(Math.random() * 60000) + 120000 // 2-3 minutes
}

export const processData: TaskFunction = async () => {
  console.log('Starting data processing...')
  const processingTime = getProcessingTime()

  // Simulate data processing work
  const chunks = 10
  const chunkTime = processingTime / chunks

  for (let i = 0; i < chunks; i++) {
    await sleep(chunkTime)
  }

  console.log('Data processing completed!')
}

export const cleanCache: TaskFunction = async () => {
  console.log('Starting cache cleaning...')
  const processingTime = getProcessingTime()

  // Simulate cache cleaning work
  const cacheTypes = ['user-cache', 'session-cache', 'temp-cache', 'api-cache', 'db-cache']
  const timePerCache = processingTime / cacheTypes.length

  for (const cacheType of cacheTypes) {
    await sleep(timePerCache)
  }

  console.log('Cache cleaning completed!')
}

export const generateReports: TaskFunction = async () => {
  console.log('Starting report generation...')
  const processingTime = getProcessingTime()

  // Simulate report generation work
  const reports = ['user-activity', 'performance', 'errors', 'analytics', 'financial']
  const timePerReport = processingTime / reports.length

  for (const report of reports) {
    await sleep(timePerReport)
  }

  console.log('Report generation completed!')
}

export const analyzeLogs: TaskFunction = async () => {
  console.log('Starting log analysis...')
  const processingTime = getProcessingTime()

  // Simulate log analysis work
  const logFiles = ['access.log', 'error.log', 'app.log', 'db.log', 'security.log']
  const timePerLog = processingTime / logFiles.length

  for (const logFile of logFiles) {
    await sleep(timePerLog)
  }

  console.log('Log analysis completed!')
}

export const manageBackups: TaskFunction = async () => {
  console.log('Starting backup management...')
  const processingTime = getProcessingTime()

  // Simulate backup management work
  const backupTasks = [
    'cleanup-old-backups',
    'verify-integrity',
    'compress-archives',
    'sync-to-remote',
    'update-manifest',
  ]
  const timePerTask = processingTime / backupTasks.length

  for (const task of backupTasks) {
    await sleep(timePerTask)
  }

  console.log('Backup management completed!')
}

// Registry of all available task functions
export const taskFunctions: Record<string, TaskFunction> = {
  processData,
  cleanCache,
  generateReports,
  analyzeLogs,
  manageBackups,
}
