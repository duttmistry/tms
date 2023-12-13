import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iProjectCustomFieldsMapping } from '../interface/projects.interface';

export type CustomFieldsCreationAttributes = Optional<
iProjectCustomFieldsMapping,
  'id' | 'project_id' | 'custom_field_id' | 'created_by'
>;

export class ProjectCustomFieldsMappingModel extends Model<iProjectCustomFieldsMapping, CustomFieldsCreationAttributes> implements iProjectCustomFieldsMapping {
  public project_id: number;
  public custom_field_id: number;
  public created_by: number;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectCustomFieldsMappingModel {
  ProjectCustomFieldsMappingModel.init(
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
      custom_field_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_custom_fields',
          },
          key: 'id',
        },
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
    },
    {
      tableName: 'tm_project_custom_fields_mappings',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );
  return ProjectCustomFieldsMappingModel;
}
