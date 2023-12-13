import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iLeaveTransectionHistory } from '../interface/leave.interface';
import {  Leave_Type } from '@tms-workspace/enum-data';

export type LeaveTransectionHistoryCreationAttributes = Optional<
  iLeaveTransectionHistory,
  'user_id' | 'leave_type' | 'credit' | 'debit' | 'after_balance' | 'remarks' | 'created_by' | 'created_date'
>;

export class LeaveTransectionHistoryModel
  extends Model<iLeaveTransectionHistory, LeaveTransectionHistoryCreationAttributes>
  implements iLeaveTransectionHistory
{
  public user_id: number;
  public leave_type: Leave_Type;
  public credit: number;
  public debit: number;
  public after_balance: number;
  public remarks: string;
  public created_by: number;
  public created_date: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveTransectionHistoryModel {
  LeaveTransectionHistoryModel.init(
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
      credit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      debit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      after_balance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'tm_leave_transection_history',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveTransectionHistoryModel;
}
