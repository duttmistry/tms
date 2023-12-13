import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iLeaveApproval } from '../interface/leave.interface';

export type LeaveApprovalCreationAttributes = Optional<iLeaveApproval, 'leave_history_id'>;

export class LeaveApprovalModel extends Model<iLeaveApproval, LeaveApprovalCreationAttributes> implements iLeaveApproval {
  public leave_history_id: number;
  public status: string;
  public user_id: number;
  public action_comment: string;
  public type: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveApprovalModel {
  LeaveApprovalModel.init(
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
      status: {
        type: DataTypes.STRING(16),
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
      action_comment: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'tm_leave_approval',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveApprovalModel;
}
