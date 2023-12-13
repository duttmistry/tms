import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iWorkspaceTeamMember } from '../interface/workspace.interface';

export type OptionalAttributes = Optional<iWorkspaceTeamMember, 'id' | 'user_id' | 'workspace_id'>;

export class WorkspaceTeamModel
  extends Model<iWorkspaceTeamMember, OptionalAttributes>
  implements iWorkspaceTeamMember
{
  public user_id: number;
  public workspace_id: number;
  public report_to: Array<number>;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof WorkspaceTeamModel {
  WorkspaceTeamModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
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
      workspace_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_workspace',
          },
          key: 'id',
        },
      },
      report_to: {
        type: DataTypes.JSON
      },
    },
    {
      tableName: 'tm_workspace_team',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  return WorkspaceTeamModel;
}
