import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iProjectDocuments } from '../interface/project_documents.interface';

export type ProjectDocumentsCreationAttributes = Optional<
  iProjectDocuments,
  'workspace_id' | 'project_id' | 'doc_title' | 'doc_content' | 'doc_url' | 'authorized_users' | 'created_by' | 'last_edited_by'
>;

export class ProjectDocumentsModel
  extends Model<iProjectDocuments, ProjectDocumentsCreationAttributes>
  implements iProjectDocuments
{
  public workspace_id: number;
  public project_id: number;
  public doc_title: string;
  public doc_content: Text;
  public doc_url: string;
  public authorized_users: Array<number>;
  public created_by: number;
  public last_edited_by: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectDocumentsModel {
  ProjectDocumentsModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      workspace_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      doc_title: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      doc_content: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      doc_url: {
        type: DataTypes.STRING(256),
        allowNull: true
      },
      authorized_users: {
        type: DataTypes.JSON,
        allowNull: true
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      last_edited_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
    },
    {
      tableName: 'tm_project_documents',
      sequelize,
      paranoid: true,
      timestamps: true,
      hooks:{
        beforeFind: (model) => {
        model.attributes = {
          exclude: [],
        };
      },},
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return ProjectDocumentsModel;
}
