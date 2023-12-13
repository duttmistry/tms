import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iLeaveSubjects } from '../interface/leave.interface';

export type LeaveSubjectCreationAttributes = Optional<iLeaveSubjects, 'title'>;

export class LeaveSubjectModel extends Model<iLeaveSubjects, LeaveSubjectCreationAttributes> implements iLeaveSubjects {
  public title: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

export default function (sequelize: Sequelize): typeof LeaveSubjectModel {
  LeaveSubjectModel.init(
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
      tableName: 'tm_leave_subjects',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return LeaveSubjectModel;
}
