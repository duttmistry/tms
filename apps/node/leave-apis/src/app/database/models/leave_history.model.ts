import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { iLeaveHistory, iLeaveDocuments } from '../interface/leave.interface';
import { Leave_Type } from '@tms-workspace/enum-data';

export type LeaveHistoryCreationAttributes = Optional<
  iLeaveHistory,
  | 'id'
  | 'user_id'
  | 'requested_date'
  | 'from_date'
  | 'leave_from_slot'
  | 'to_date'
  | 'leave_to_slot'
  | 'no_of_days'
  | 'leave_subject'
  | 'leave_subject_text'
  | 'description'
  | 'attachments'
  | 'status'
  | 'approved_required_from'
  | 'approved_by'
  | 'leave_type'
  | 'comments'
  | 'isSandwichLeave'
  | 'sandwich_from_date'
  | 'sandwich_to_date'
>;

export class LeaveHistoryModel extends Model<iLeaveHistory, LeaveHistoryCreationAttributes> implements iLeaveHistory {
  // public id: number;
  public user_id: number;
  public requested_date: Date;
  public from_date: Date;
  public leave_from_slot: string;
  public to_date: Date;
  public leave_to_slot: string;
  public no_of_days: number;
  public leave_subject: number;
  public leave_subject_text: string;
  public description: string;
  public attachments: Array<iLeaveDocuments>;
  public status: string;
  public approved_required_from: Array<number>;
  public approved_by: Array<number>;
  public leave_type: Leave_Type;
  public comments: string;
  public isSandwichLeave: boolean;
  public sandwich_from_date: Date;
  public sandwich_to_date: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveHistoryModel {
  LeaveHistoryModel.init(
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
      requested_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      from_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      leave_from_slot: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      to_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      leave_to_slot: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      no_of_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_subject: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      leave_subject_text: {
        type: DataTypes.STRING(256),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      approved_required_from: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      approved_by: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      leave_type: {
        type: DataTypes.ENUM('CL', 'PL', 'LWP'),
        allowNull: true,
      },
      comments: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isSandwichLeave: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      sandwich_from_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sandwich_to_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'tm_leave_history',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveHistoryModel;
}
