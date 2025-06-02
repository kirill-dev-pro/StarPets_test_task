import { DataTypes, type Model, type Optional } from 'sequelize'
import { db } from '../db.ts'

interface TaskAttributes {
  id: number
  name: string
  interval: number // in seconds
  functionName: string
  isRunning: boolean
  serverId: string | null
  startedAt: Date | null
  lastRunAt: Date | null
  nextRunAt: Date
  createdAt: Date
  updatedAt: Date
}

interface TaskCreationAttributes
  extends Optional<
    TaskAttributes,
    'id' | 'isRunning' | 'serverId' | 'startedAt' | 'lastRunAt' | 'createdAt' | 'updatedAt'
  > {}

export interface TaskInstance
  extends Model<TaskAttributes, TaskCreationAttributes>,
    TaskAttributes {}

export const Task = db.define<TaskInstance>(
  'Task',
  {
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
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'tasks',
    timestamps: true,
  },
)
