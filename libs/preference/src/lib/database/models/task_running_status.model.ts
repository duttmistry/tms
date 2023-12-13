import { Task_Running_Status_Enum } from '@tms-workspace/enum-data';
import { Sequelize, DataTypes, Model } from 'sequelize';
import { iTaskRunningStatus } from '../interface/task.interface';

export class TaskRunningStatusModel extends Model<iTaskRunningStatus> implements iTaskRunningStatus {
    public running_status: Task_Running_Status_Enum;
    public user_id: number;
    public task_id: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof TaskRunningStatusModel {
    TaskRunningStatusModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tm_tasks',
          },
          key: 'id',
        },
      },
      running_status: {
        type: DataTypes.ENUM('Ongoing', 'Stop', 'Not Started Yet'),
        allowNull: false,
      },
    },
    {
      tableName: 'tm_tasks_running_status_mapping',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return TaskRunningStatusModel;
}
