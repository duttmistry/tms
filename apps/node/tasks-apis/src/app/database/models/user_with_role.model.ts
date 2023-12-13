import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iUserWithRole } from '../interface/user.interface';

export type OptionalAttributes = Optional<
  iUserWithRole,
  'id' | 'user_id' | 'role_id'
>;

export class UserRoleModel
  extends Model<iUserWithRole, OptionalAttributes>
  implements iUserWithRole
{
  public id: number;
  public user_id: number;
  public role_id: number;

  public readonly created_date!: Date;
  public readonly updated_date!: Date;
  public readonly deleted_date!: Date;
}

export default function (sequelize: Sequelize): typeof UserRoleModel {
  UserRoleModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
      },
      role_id: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'tm_user_with_roles',
      sequelize,
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return UserRoleModel;
}
