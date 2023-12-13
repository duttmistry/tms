import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iLeaveBalance } from '../interface/leave.interface';
import { Leave_Type } from '@tms-workspace/enum-data';

export type LeaveBalanceAttributes = Optional<
  iLeaveBalance,
  'id' | 'user_id' | 'leave_type' | 'current_balance' | 'applied_balance' | 'reserved_balance'
>;

export class LeaveBalanceModel extends Model<iLeaveBalance, LeaveBalanceAttributes> implements iLeaveBalance {
  public user_id: number;
  public leave_type: Leave_Type;
  public current_balance: number;
  public applied_balance: number;
  public reserved_balance: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveBalanceModel {
  LeaveBalanceModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      leave_type: {
        type: DataTypes.ENUM('CL', 'PL', 'LWP'),
        allowNull: true,
      },
      current_balance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      applied_balance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reserved_balance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'tm_leave_balance',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveBalanceModel;
}
