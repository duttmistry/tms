import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iLeaveOpeningBalance } from '../interface/leave.interface';
import {  Leave_Type } from '@tms-workspace/enum-data';

export type LeaveBalanceAttributes = Optional<
  iLeaveOpeningBalance,
  'id' | 'user_id' | 'leave_type' | 'opening_balance' | 'closing_balance' | 'month' | 'year'
>;

export class LeaveOpeningBalanceModel extends Model<iLeaveOpeningBalance, LeaveBalanceAttributes> implements iLeaveOpeningBalance {
  public user_id: number;
  public leave_type: Leave_Type;
  public opening_balance: number;
  public closing_balance: number;
  public month: string;
  public year: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveOpeningBalanceModel {
  LeaveOpeningBalanceModel.init(
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
      opening_balance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      closing_balance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      month: {
        type: DataTypes.STRING(9),
        allowNull: true,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'tm_leave_opening_balance',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveOpeningBalanceModel;
}
