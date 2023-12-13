import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iHelps } from '../interface/helps.interface';

export type iHelpsAttributes = Optional<iHelps, 'id' | 'category' | 'videos'>;

export class HelpsModel extends Model<iHelps, iHelpsAttributes> implements iHelps {
  public id: number;
  public category: string;
  public videos: JSON;
  // public title: string;
  // public description : string;
  // public url : string;
  public readonly created_data!: Date;
  public readonly updated_data!: Date;
}

export default function (sequelize: Sequelize): typeof HelpsModel
 {
  HelpsModel.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      category: {
        type: DataTypes.ENUM('HR', 'DEVELOPERS', 'ADMIN'),
        allowNull: false,
        defaultValue: 'DEVELOPERS', // You can set the default value to 'HR' or any other category you prefer.
        // allowNull: false,
      },
      videos: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [] // Set the default value as an empty array.
      }
    },
    {
      tableName: 'tm_helps',
      sequelize,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return HelpsModel;
}


