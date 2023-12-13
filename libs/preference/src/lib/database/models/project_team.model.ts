import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iProjectTeam } from '../interface/projects.interface';

export type projectTeamCreationAttributes = Optional<iProjectTeam, 'user_id' | 'project_id'>;

export class ProjectTeamModel extends Model<iProjectTeam, projectTeamCreationAttributes> implements ProjectTeamModel {
  public user_id: number;
  public project_id: number;
  public report_to: Array<number>;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectTeamModel {
  ProjectTeamModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        allowNull: true,
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        },
      },
      project_id: {
        allowNull: true,
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_projects',
          },
          key: 'id',
        },
      },
      report_to: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      tableName: 'tm_project_team',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return ProjectTeamModel;
}
