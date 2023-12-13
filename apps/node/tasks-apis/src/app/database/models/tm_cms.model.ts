
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iCms } from '../interface/cms.interface';

export type CmsCreationAttributes = Optional<
  iCms,
  'id' | 'name' | 'slug' | 'page_title' | 'page_content'
>;

export class CmsModel
  extends Model<iCms, CmsCreationAttributes>
  implements iCms
{
  public id: number;
  public name: string;
  public slug: string;
  public page_title: string;
  public page_content: Text;

  public readonly created_data!: Date;
  public readonly updated_data!: Date;
  public readonly deleted_data!: Date;
}

export default function (sequelize: Sequelize): typeof CmsModel {
  CmsModel.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      page_title: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      page_content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
    },
    {
      tableName: 'tm_cms',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );
  return CmsModel;
}
