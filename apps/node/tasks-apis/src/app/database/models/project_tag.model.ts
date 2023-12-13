import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iProjectTag } from '../interface/projects.interface';

export type ProjectTagCreationAttributes = Optional<iProjectTag, 'tag_id' | 'project_id'>;

export class ProjectTagModel extends Model<iProjectTag, ProjectTagCreationAttributes> implements iProjectTag {
  public tag_id: number;
  public project_id: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectTagModel {
  ProjectTagModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tag_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'tm_tag',
          },
          key: 'id',
        },
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
    },
    {
      tableName: 'tm_project_tag',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return ProjectTagModel;
}
