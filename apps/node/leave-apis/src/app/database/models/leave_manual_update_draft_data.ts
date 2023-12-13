import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { iLeaveManualUpdateDraftData } from '../interface/leave.interface';
import { Leave_Manual_Enum, Leave_Type } from '@tms-workspace/enum-data';

export type LeaveManualUpdateDraftDataCreationAttributes = Optional<
  iLeaveManualUpdateDraftData,
  | 'id'
  | 'leave_manual_log_id'
  | 'year'
  | 'month'
  | 'user_id'
  | 'leave_type'
  | 'leave_opening'
  | 'leave_used'
  | 'leave_added'
  | 'leave_current'
  | 'comments'
  | 'created_by'
  | 'updated_by'
>;

export class LeaveManualUpdatesDraftDataModel
  extends Model<iLeaveManualUpdateDraftData, LeaveManualUpdateDraftDataCreationAttributes>
  implements iLeaveManualUpdateDraftData
{
  // public id: number;
  public leave_manual_log_id: number;
  public year: number;
  public month: string;
  public user_id: number;
  public leave_type: Leave_Type;
  public leave_opening: number;
  public leave_used: number;
  public leave_added: number;
  public leave_current: number;
  public comments: string;
  public created_by: number;
  public updated_by: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveManualUpdatesDraftDataModel {
  LeaveManualUpdatesDraftDataModel.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      leave_manual_log_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tms_leave_manual_updates_log',
          },
          key: 'id',
        },
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: {
        type: DataTypes.STRING,
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
        allowNull: false,
      },

      leave_opening: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_used: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_added: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leave_current: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      comments: {
        type: DataTypes.STRING(256),
        allowNull: false,
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
      updated_by: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
    },
    {
      tableName: 'tm_leave_manual_update_draft_data',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveManualUpdatesDraftDataModel;
}
