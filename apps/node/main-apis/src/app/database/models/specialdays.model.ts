import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iSpecialDays } from '../interface/specialdays.interface';

export type SpecialdaysAttributes = Optional<iSpecialDays, 'id' | 'title' | 'short_description' | 'from_date' | 'to_date'>;

export class SpecialdaysModel extends Model<iSpecialDays, SpecialdaysAttributes> implements iSpecialDays {
  public id: number;
  public title: string;
  public short_description: string;
  public from_date: Date;
  public to_date: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof SpecialdaysModel {
  SpecialdaysModel.init(
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
      short_description: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      from_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      to_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'tm_specialdays',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return SpecialdaysModel;
}
