import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { MyEnum, iProjectSection } from '../interface/projects.interface';

export type ProjectSectionAttributes = Optional<iProjectSection, 'id' | 'project_id' | 'title'>;

export class ProjectTaskSectionModel extends Model<iProjectSection, ProjectSectionAttributes> implements iProjectSection {
  public title: string;
  public project_id: number;
  public created_by: number;
  public updated_by: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectTaskSectionModel {
  ProjectTaskSectionModel.init(
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
      },
      title: {
        type: DataTypes.STRING,
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
      tableName: 'tm_tasks_sections',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return ProjectTaskSectionModel;
}
