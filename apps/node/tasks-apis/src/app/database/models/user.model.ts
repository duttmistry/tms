import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { iUser, iUserEmail, iUserAddress, iUserEducation, iUserCertificates } from '../interface/user.interface';

export type OptionalAttributes = Optional<
  iUser,
  | 'id'
  | 'first_name'
  | 'last_name'
  | 'emails'
  | 'contact_number'
  | 'dob'
  | 'designation'
  | 'team_lead'
  | 'project_manager'
  | 'production_date'
  | 'departments'
  | 'technologies'
  | 'employee_image'
  | 'status'
  | 'is_active'
  | 'present_address'
  | 'education'
  | 'certificates'
  | 'gender'
  | 'marital_status'
  | 'blood_group'
  | 'employee_id'
  | 'skype'
  | 'linkedin'
  | 'password'
  | 'role'
  | 'skill_description'
  | 'active_sessionid'
>;

export class UserModel extends Model<iUser, OptionalAttributes> implements iUser {
  declare id: number;
  declare first_name: string;
  declare last_name: string;
  declare emails: Array<iUserEmail>;
  declare contact_number: string;
  declare dob: Date;
  declare designation: string;
  declare team_lead: string;
  declare project_manager: string;
  declare production_date: Date;
  declare departments: string;
  declare technologies: string;
  declare employee_image: string;
  declare status: string;
  declare is_active: boolean;
  declare present_address: iUserAddress;
  declare education: Array<iUserEducation>;
  declare certificates: Array<iUserCertificates>;
  declare gender: string;
  declare marital_status: string;
  declare blood_group: string;
  declare employee_id: string;
  declare skype: string;
  declare linkedin: string;
  declare password: string;
  declare role: string;
  declare skill_description: string;
  declare active_sessionid: string;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date;
}

export default function (sequelize: Sequelize): typeof UserModel {
  UserModel.init(
    {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(64),
      },
      last_name: {
        type: DataTypes.STRING(64),
      },
      emails: {
        type: DataTypes.JSON,
      },
      contact_number: {
        type: DataTypes.STRING(64),
      },
      dob: {
        type: DataTypes.DATE,
      },
      designation: {
        type: DataTypes.STRING(64),
      },
      team_lead: {
        type: DataTypes.STRING(64),
      },
      project_manager: {
        type: DataTypes.STRING(64),
      },
      production_date: {
        type: DataTypes.DATE,
      },
      departments: {
        type: DataTypes.JSON,
      },
      technologies: {
        type: DataTypes.JSON,
      },
      employee_image: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING(16),
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      present_address: {
        type: DataTypes.JSON,
      },
      education: {
        type: DataTypes.JSON,
      },
      certificates: {
        type: DataTypes.JSON,
      },
      gender: {
        type: DataTypes.STRING(4),
      },
      marital_status: {
        type: DataTypes.STRING(16),
      },
      blood_group: {
        type: DataTypes.STRING(4),
      },
      employee_id: {
        type: DataTypes.STRING(64),
      },
      skype: {
        type: DataTypes.STRING(256),
      },
      linkedin: {
        type: DataTypes.STRING(256),
      },
      password: {
        type: DataTypes.STRING(256),
      },
      role: {
        type: DataTypes.STRING(16),
      },
      skill_description: {
        type: DataTypes.STRING(256),
      },
      active_sessionid: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'tm_users',
      sequelize,
      paranoid: true,
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return UserModel;
}

// ('use strict');
// const { Model } = require('sequelize');
// module.exports = (sequelize, DataTypes) => {
//   class user extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
//   user.init(
//     {
//       title: DataTypes.STRING,
//       from_date: DataTypes.DATE,
//       to_date: DataTypes.DATE,
//       month: DataTypes.STRING,
//       year: DataTypes.INTEGER,
//       deleted_at: DataTypes.DATE,
//     },
//     {
//       sequelize,
//       modelName: 'user',
//       underscored: true,
//     }
//   );
//   return user;
// };
