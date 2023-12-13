import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iSiteSetting } from '../interface/site_setting.interface';

export type SiteSettingAttributes = Optional<iSiteSetting, 'id' | 'name' | 'value' | 'identifier' | 'module'>;

export class SiteSettingModel extends Model<iSiteSetting, SiteSettingAttributes> implements iSiteSetting {
  public id: number;
  public name: string;
  public value: string;
  public identifier: string;
  public module: string;

  public readonly created_data!: Date;
  public readonly updated_data!: Date;
  public readonly deleted_data!: Date;
}

export default function (sequelize: Sequelize): typeof SiteSettingModel {
  SiteSettingModel.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      value: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      identifier: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
      },
      module: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
    },
    {
      tableName: 'tm_site_settings',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );
  return SiteSettingModel;
}
