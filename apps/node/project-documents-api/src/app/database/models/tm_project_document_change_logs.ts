import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iProjectDocumentChangeLogs } from '../interface/project_documents.interface';

export type projectDocumentChangeLogsCreationAttributes = Optional<
iProjectDocumentChangeLogs,
  'document_id' | 'previous_content' | 'updated_content' | 'updated_by'
>;

export class ProjectDocumentChangeLogs
  extends Model<iProjectDocumentChangeLogs, projectDocumentChangeLogsCreationAttributes>
  implements iProjectDocumentChangeLogs
{
  public document_id: number;
  public previous_content: string;
  public updated_content: Text;
  public updated_by: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectDocumentChangeLogs {
  ProjectDocumentChangeLogs.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      document_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      previous_content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      updated_content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
    },
    {
      tableName: 'tm_project_document_change_logs',
      sequelize,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return ProjectDocumentChangeLogs;
}
