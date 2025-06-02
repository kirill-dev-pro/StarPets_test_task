import express from 'express'
import { env } from './env.ts'
import { rollbackMigrations, runMigrations } from './migrations/runner.ts'
import tasksApiRouter from './routes/api/tasks.ts'
import usersApiRouter from './routes/api/users.ts'
import rootRouter from './routes/index.ts'
import { CronService } from './services/cron-service.ts'

await rollbackMigrations()
await runMigrations()

const app = express()
const cronService = new CronService()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', usersApiRouter)
app.use('/api/tasks', tasksApiRouter)
app.use('/', rootRouter)

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

app.listen(env.PORT, async () => {
  console.log('')
  console.log(`Server started at http://localhost:${env.PORT}/`)
  console.log(`CronService Server ID: ${cronService.getServerId()}`)
  console.log('')

  // Start the cron service after the server is running
  try {
    await cronService.start()
    console.log('CronService started successfully')
  } catch (error) {
    console.error('Failed to start CronService:', error)
  }
})
