import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { iLeaveHistoryLeaveType } from '../interface/leave.interface';
import { Leave_Type } from '@tms-workspace/enum-data';

export type LeaveHistoryLeaveTypeCreationAttributes = Optional<
  iLeaveHistoryLeaveType,
  'id' | 'leave_history_id' | 'user_id' | 'leave_type' | 'leave_days'
>;

export class LeaveHistoryLeaveTypeModel
  extends Model<iLeaveHistoryLeaveType, LeaveHistoryLeaveTypeCreationAttributes>
  implements iLeaveHistoryLeaveType
{
  // public id: number;
  public leave_history_id: number;
  public user_id: number;
  public leave_type: Leave_Type;
  public leave_days: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveHistoryLeaveTypeModel {
  LeaveHistoryLeaveTypeModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_history_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_leave_history',
          },
          key: 'id',
        },
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
      leave_days: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'tm_leave_history_leave_types',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveHistoryLeaveTypeModel;
}
