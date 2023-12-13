import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iTaskCustomFieldValue } from '../interface/task.interface';

export type TaskCustomFieldValueCreationAttributes = Optional<iTaskCustomFieldValue, 'value'>;

export class TaskCustomFieldValueModel extends Model<iTaskCustomFieldValue, TaskCustomFieldValueCreationAttributes> implements iTaskCustomFieldValue {
  public task_custom_field_id: number;
  public task_id: number;
  public value: string;
  public created_by?: number;
  public updated_by?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof TaskCustomFieldValueModel {
  TaskCustomFieldValueModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      task_custom_field_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tm_custom_fields',
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
      value: {
        type: DataTypes.STRING(256),
        allowNull: false,
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
      tableName: 'tasks_custom_fields_values',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return TaskCustomFieldValueModel;
}
