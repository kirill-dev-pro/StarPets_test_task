import express from 'express'
import { env } from './env.ts'
import tasksApiRouter from './routes/api/tasks.ts'
import usersApiRouter from './routes/api/users.ts'
import rootRouter from './routes/index.ts'

// Full mode: API + Worker
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', usersApiRouter)
app.use('/api/tasks', tasksApiRouter)
app.use('/', rootRouter)

app.listen(env.PORT, async () => {
  console.log('')
  console.log(`Server started at http://localhost:${env.PORT}/`)
  console.log('')
})
