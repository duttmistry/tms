import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { iLeaveHistoryLog, iLeaveHistoryLogUpdatedValue } from '../interface/leave.interface';

export type LeaveHistoryLogCreationAttributes = Optional<
  iLeaveHistoryLog,
  'id' | 'user_id' | 'leave_history_id' | 'action' | 'action_by' | 'updated_values'
>;

export class LeaveHistoryLogModel extends Model<iLeaveHistoryLog, LeaveHistoryLogCreationAttributes> implements iLeaveHistoryLog {
  // public id: number;
  public user_id: number;
  public leave_history_id: number;
  public action: string;
  public action_by: number;
  public updated_values: Array<iLeaveHistoryLogUpdatedValue>;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveHistoryLogModel {
  LeaveHistoryLogModel.init(
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
      leave_history_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_leave_history',
          },
          key: 'id',
        },
      },
      action: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      updated_values: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      action_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'tm_leave_history_log',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveHistoryLogModel;
}
