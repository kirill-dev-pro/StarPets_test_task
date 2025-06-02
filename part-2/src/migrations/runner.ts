import path from 'node:path'
import { SequelizeStorage, Umzug } from 'umzug'
import { db } from '../db.ts'

export const migrator = new Umzug({
  migrations: {
    glob: path.join(process.cwd(), 'src', 'migrations', '[0-9]*.ts'),
  },
  context: db.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: db }),
  logger: console,
})

export type Migration = typeof migrator._types.migration

export const runMigrations = async (): Promise<void> => {
  try {
    const migrations = await migrator.up()

    if (migrations.length === 0) {
      console.log('No migrations to run.')
    } else {
      console.log(
        `Successfully ran ${migrations.length} migrations:`,
        migrations.map((m) => m.name),
      )
    }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

export const rollbackMigrations = async (): Promise<void> => {
  try {
    const migrations = await migrator.down()

    if (migrations.length === 0) {
      console.log('No migrations to rollback.')
    } else {
      console.log(
        `Successfully rolled back ${migrations.length} migrations:`,
        migrations.map((m) => m.name),
      )
    }
  } catch (error) {
    console.error('Rollback failed:', error)
    throw error
  }
}
