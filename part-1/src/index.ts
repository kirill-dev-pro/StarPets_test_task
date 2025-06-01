import express from 'express'
import { env } from './env.ts'
import { rollbackMigrations, runMigrations } from './migrations/runner.ts'
import usersApiRouter from './routes/api/users.ts'
import rootRouter from './routes/index.ts'

await rollbackMigrations()
await runMigrations()

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', usersApiRouter)
app.use('/', rootRouter)

app.listen(env.PORT, () => {
  console.log('')
  console.log(`Running at http://localhost:${env.PORT}/`)
  console.log('')
})
