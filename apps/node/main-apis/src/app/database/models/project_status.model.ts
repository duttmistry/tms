import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { MyEnum, iProjectStatus } from '../interface/projects.interface';

export type ProjectStatusAttributes = Optional<iProjectStatus, 'id' | 'project_id' | 'state' | 'color' | 'title'>;

export class ProjectStatusModel extends Model<iProjectStatus, ProjectStatusAttributes> implements iProjectStatus {
  public title: string;
  public project_id: number;
  public state: MyEnum;
  public color: string;
  public created_by: number;
  public updated_by: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectStatusModel {
  ProjectStatusModel.init(
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
      state: {
        type: DataTypes.ENUM('todo', 'inprogress', 'onhold', 'completed'),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      color: {
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
      tableName: 'tm_project_status',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return ProjectStatusModel;
}
