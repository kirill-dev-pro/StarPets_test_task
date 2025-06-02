import { rollbackMigrations } from './migrations/runner.ts'

await rollbackMigrations()

console.log('Database reset complete.')

process.exit(0)
