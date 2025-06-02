import { CronService } from './services/cron-service.ts'

const cronService = new CronService()

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('\nReceived shutdown signal. Gracefully shutting down...')

  try {
    await cronService.stop()
    console.log('CronService stopped successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error during graceful shutdown:', error)
    process.exit(1)
  }
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Worker-only mode: just run the cron service
console.log('')
console.log(`Worker instance started (Server ID: ${cronService.getServerId()})`)
console.log('')

try {
  await cronService.start()
  console.log('CronService started successfully')
} catch (error) {
  console.error('Failed to start CronService:', error)
  process.exit(1)
}
