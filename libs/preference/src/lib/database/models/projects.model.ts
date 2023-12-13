import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iProject } from '../interface/projects.interface';

export type ProjectCreationAttributes = Optional<iProject, 'project_key' | 'name' | 'description' | 'start_date' | 'estimated_end_date'>;

export class ProjectModel extends Model<iProject, ProjectCreationAttributes> implements iProject {
  public project_key: string;
  public name: string;
  public description: string;
  public responsible_person: number;
  public start_date: Date;
  public estimated_end_date: Date;
  public avatar: string;
  public created_by: number;
  public updated_by: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectModel {
  ProjectModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      project_key: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(64),
      },
      description: {
        type: DataTypes.TEXT,
      },
      start_date: {
        type: DataTypes.DATE,
      },
      estimated_end_date: {
        type: DataTypes.DATE,
      },
      responsible_person: {
        type: DataTypes.INTEGER,
      },
      avatar: {
        type: DataTypes.STRING(256),
      },
      created_by: {
        type: DataTypes.INTEGER,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'tm_projects',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      indexes: [
        {
          unique: true,
          fields: ['project_key'],
        },
      ],
    }
  );
  return ProjectModel;
}
