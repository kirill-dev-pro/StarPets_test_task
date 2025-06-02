import 'dotenv/config'

export const env = {
  DB_CONNECTION_STRING:
    process.env.DB_CONNECTION_STRING || 'postgresql://postgres:postgres@localhost:5432/postgres',
  PORT: parseInt(process.env.PORT || '3000', 10),
}
