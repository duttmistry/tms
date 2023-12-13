import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iCeo } from '../interface/ceo.interface';

export type iCeoAttributes = Optional<iCeo, 'id' | 'name' | 'profile' | 'user_id' >;

export class CeoModel extends Model<iCeo, iCeoAttributes> implements iCeo {
  public id: number;
  public name: string;
  public profile: string;
  public user_id : number;
  public readonly created_data!: Date;
  public readonly updated_data!: Date;
}

export default function (sequelize: Sequelize): typeof CeoModel {
  CeoModel.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING(64),
        // allowNull: false,
      },
      profile: {
        type: DataTypes.STRING(64),
        // allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tm_users',
          },
          key: 'id',
        }
      }
    },
    {
      tableName: 'tm_ceos',
      sequelize,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return CeoModel;
}


