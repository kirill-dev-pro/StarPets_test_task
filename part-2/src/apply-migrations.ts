import { runMigrations } from './migrations/runner.ts'

await runMigrations()

process.exit(0)
