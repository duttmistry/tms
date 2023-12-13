import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iUserLog } from '../interface/user.interface';

export type OptionalAttributes = Optional<
  iUserLog,
  | 'id'
  | 'action'
  | 'action_by'
  | 'action_start_date'
  | 'action_end_date'
  | 'user_id'
  | 'login_capture_data'
  | 'login_capture_data'
  | 'sessionid'
  | 'reason'
  | 'time'
>;

export class UserLogModel extends Model<iUserLog, OptionalAttributes> implements iUserLog {
  public id: number;
  public action: string;
  public action_by: number;
  public action_start_date: Date;
  public action_end_date: Date;
  public user_id: number;
  public login_capture_data: string;
  public logout_capture_data: string;
  public sessionid: string;
  public reason: string;
  public time: string;

  public readonly created_date!: Date;
  public readonly updated_date!: Date;
  public readonly deleted_date!: Date;
}

export default function (sequelize: Sequelize): typeof UserLogModel {
  UserLogModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      action_by: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      action_start_date: {
        type: DataTypes.DATE,
      },
      action_end_date: {
        type: DataTypes.DATE,
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
      login_capture_data: {
        type: DataTypes.JSON,
      },
      logout_capture_data: {
        type: DataTypes.JSON,
      },
      sessionid: {
        type: DataTypes.TEXT,
      },
      reason: {
        type: DataTypes.STRING,
      },
      time: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: 'tm_user_logs',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return UserLogModel;
}
