import { DataTypes, Model, type Optional } from 'sequelize'
import { db } from '../db.ts'

interface UserAttributes {
  id: number
  balance: number
  createdAt?: Date
  updatedAt?: Date
}

interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number
  public balance!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    balance: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize: db,
    tableName: 'users',
    timestamps: true,
  },
)

export default User
