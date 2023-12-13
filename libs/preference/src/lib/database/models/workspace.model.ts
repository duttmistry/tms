import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iWorkspace } from '../interface/workspace.interface';

export type WorkspaceCreationAttributes = Optional<
  iWorkspace,
  'id' | 'title' | 'responsible_person' | 'description' | 'avatar' | 'documents' | 'notes' | 'is_active' | 'created_by' | 'updated_by'
>;

export class WorkspaceModel extends Model<iWorkspace, WorkspaceCreationAttributes> implements iWorkspace {
  public title: string;
  public responsible_person: number;
  public description: string;
  public avatar: string;
  public documents: string;
  public notes: string;
  public is_active: boolean;
  public created_by: number;
  public updated_by: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof WorkspaceModel {
  WorkspaceModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(128),
      },
      responsible_person: {
        type: DataTypes.INTEGER,
      },
      description: {
        type: DataTypes.STRING(512),
      },
      avatar: {
        type: DataTypes.STRING(128),
      },
      documents: {
        type: DataTypes.JSON,
      },
      notes: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'tm_workspace',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return WorkspaceModel;
}
