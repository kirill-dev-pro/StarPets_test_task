import { Sequelize } from 'sequelize'
import { env } from './env.ts'

export const db = new Sequelize(env.DB_CONNECTION_STRING, {
  logging: false,
  pool: {
    max: 100,
    min: 10,
    acquire: 60000,
    idle: 10000,
  },
})
