import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iTaskLabel } from '../interface/task.interface';

export type TaskLabelCreationAttributes = Optional<iTaskLabel, 'title'>;

export class TaskLabelModel extends Model<iTaskLabel, TaskLabelCreationAttributes> implements iTaskLabel {
  public project_id: number;
  public title: string;
  public color: object;
  public created_by?: number;
  public updated_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof TaskLabelModel {
  TaskLabelModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tm_projects',
          },
          key: 'id',
        },
      },

      title: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      color: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
    },
    {
      tableName: 'tm_task_labels',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return TaskLabelModel;
}
