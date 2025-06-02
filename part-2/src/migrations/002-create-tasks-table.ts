import { DataTypes } from 'sequelize'
import type { Migration } from '../migrations/runner.ts'

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('tasks', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    interval: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    functionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isRunning: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    serverId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextRunAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  })
}

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('tasks')
}
