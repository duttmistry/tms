import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iUserRoles } from '../interface/user.interface';

export type UserRolesAttributes = Optional<
  iUserRoles,
  'id' | 'title' | 'permission'
>;

export class UserRolesModel
  extends Model<iUserRoles, UserRolesAttributes>
  implements iUserRoles
{
  public title: string;
  public permission: object;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export default function (sequelize: Sequelize): typeof UserRolesModel {
  UserRolesModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      permission: {
        type: DataTypes.JSON
      },
    },
    {
      tableName: 'tm_user_roles',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    }
  );

  return UserRolesModel;
}
