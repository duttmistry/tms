import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iHoliday } from '../interface/holiday.interface';

export type HolidayAttributes = Optional<iHoliday, 'id' | 'title' | 'holiday_date'>;

export class HolidayModel extends Model<iHoliday, HolidayAttributes> implements iHoliday {
  public id: number;
  public title: string;
  public holiday_date: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof HolidayModel {
  HolidayModel.init(
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
      holiday_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      // short_description: {
      //   type: DataTypes.STRING(64),
      //   allowNull: true,
      // },
      // from_date: {
      //   type: DataTypes.DATE,
      //   allowNull: false,
      // },
      // to_date: {
      //   type: DataTypes.DATE,
      //   allowNull: false,
      // },
    },
    {
      tableName: 'tm_holidays',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return HolidayModel;
}
