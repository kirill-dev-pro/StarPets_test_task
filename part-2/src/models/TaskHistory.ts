import { DataTypes, type Model, type Optional } from 'sequelize'
import { db } from '../db.ts'

interface TaskHistoryAttributes {
  id: number
  taskId: number
  taskName: string
  serverId: string
  startedAt: Date
  completedAt: Date
  duration: number // ms
  status: 'completed' | 'failed'
  error: string | null
  createdAt: Date
  updatedAt: Date
}

interface TaskHistoryCreationAttributes
  extends Optional<TaskHistoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface TaskHistoryInstance
  extends Model<TaskHistoryAttributes, TaskHistoryCreationAttributes>,
    TaskHistoryAttributes {}

export const TaskHistory = db.define<TaskHistoryInstance>(
  'TaskHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    taskName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serverId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('completed', 'failed'),
      allowNull: false,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'task_history',
    timestamps: true,
  },
)
