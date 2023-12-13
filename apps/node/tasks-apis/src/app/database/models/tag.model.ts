import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iTag } from '../interface/tag.interface';

export type TagCreationAttributes = Optional<iTag, 'title'>;

export class TagModel extends Model<iTag, TagCreationAttributes> implements iTag {
  public title: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof TagModel {
  TagModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
    },
    {
      tableName: 'tm_tag',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return TagModel;
}
