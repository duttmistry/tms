'use strict';
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import {iProjectBillingConfigration,billingEnum} from '../interface/projects.interface';

export type ProjectWorkspaceCreationAttributes = Optional<
iProjectBillingConfigration,
  'id' | 'project_id' | 'project_status'|'is_billable'
>;


export class ProjectBillingConfigrationModel extends Model<iProjectBillingConfigration, ProjectWorkspaceCreationAttributes> implements iProjectBillingConfigration {
  public project_id: number;
  public project_status:billingEnum;
  public is_billable: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof ProjectBillingConfigrationModel {
  ProjectBillingConfigrationModel.init(
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
      project_status:{
        type:DataTypes.ENUM('ongoing', 'undermaintenance', 'closed'),
      },
      is_billable:{
        type:DataTypes.BOOLEAN
      }
    },
    {
      tableName: 'tm_biling_configurations',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );
  return ProjectBillingConfigrationModel;
}