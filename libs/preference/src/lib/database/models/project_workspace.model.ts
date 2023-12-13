import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iProjectWorkspace } from '../interface/projects.interface';

export type ProjectWorkspaceCreationAttributes = Optional<
  iProjectWorkspace,
  'id' | 'project_id' | 'workspace_id'
>;

export class ProjectWorkspaceModel
  extends Model<iProjectWorkspace, ProjectWorkspaceCreationAttributes>
  implements iProjectWorkspace
{
  public project_id: number;
  public workspace_id: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectWorkspaceModel {
  ProjectWorkspaceModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_projects',
          },
          key: 'id',
        },
      },
      workspace_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_workspace',
          },
          key: 'id',
        },
      },
    },
    {
      tableName: 'tm_project_workspace',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return ProjectWorkspaceModel;
}
