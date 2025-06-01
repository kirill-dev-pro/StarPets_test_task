import { DataTypes } from 'sequelize'
import { db } from '../db.ts'
import type { Migration } from './runner.ts'

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.createTable('users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  })

  await db.query(
    `ALTER TABLE users ADD CONSTRAINT check_balance_non_negative CHECK (balance >= 0);`,
  )

  await sequelize.bulkInsert('users', [
    {
      id: 1,
      balance: 10000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.dropTable('users')
}
