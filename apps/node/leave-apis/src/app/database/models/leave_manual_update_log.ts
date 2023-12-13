import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { iLeaveManualUpdatelog } from '../interface/leave.interface';
import { Leave_Manual_Enum } from '@tms-workspace/enum-data';

export type LeaveManualUpdateLogCreationAttributes = Optional<iLeaveManualUpdatelog, 'id'>;

export class LeaveManualUpdatesLogModel
  extends Model<iLeaveManualUpdatelog, LeaveManualUpdateLogCreationAttributes>
  implements iLeaveManualUpdatelog
{
  // public id: number;
  public year: number;
  public month: string;
  public status: Leave_Manual_Enum;
  public draft_date: Date;
  public final_save_date: Date;
  public created_by: number;
  public updated_by: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveManualUpdatesLogModel {
  LeaveManualUpdatesLogModel.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('In Process', 'Draft', 'Saved'),
        allowNull: true,
      },
      draft_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      final_save_date: {
        type: DataTypes.DATE,
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
      tableName: 'tm_leave_manual_updates_log',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveManualUpdatesLogModel;
}
