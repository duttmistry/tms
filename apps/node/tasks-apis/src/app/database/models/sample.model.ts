
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iSample } from '../interface/sample.interface';

// const DB = {
//   Holiday: new SampleModel(sequelizeObj),
//   sequelizeObj, // connection instance (RAW queries)
//   Sequelize, // library
// };


export type SampleCreationAttributes = Optional<
  iSample,
  'id' | 'title' | 'from_date' | 'to_date' | 'month' | 'year'
>;

export class SampleModel
  extends Model<iSample, SampleCreationAttributes>
  implements iSample
{
  public id: number;
  public title: string;
  public from_date: Date;
  public to_date: Date;
  public month: string;
  public year: number;

  public readonly created_data!: Date;
  public readonly updated_data!: Date;
  public readonly deleted_data!: Date;
}

export default function (sequelize: Sequelize): typeof SampleModel {
  SampleModel.init(
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
      from_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      to_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      month: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'samples',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return SampleModel;
}
