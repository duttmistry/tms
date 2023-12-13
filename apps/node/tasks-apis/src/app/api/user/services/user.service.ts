import axios from 'axios';
import { Op, WhereOptions } from 'sequelize';
import { iUser, iUserWithRole } from '../../../database/interface/user.interface';

import { developmentConstant, stagingConstant, productionConstant } from '@tms-workspace/configurations';
import _DB from '../../../database/models';
import { Query } from '@tms-workspace/apis-core';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import * as Enviornment from '../../../../enviornment';
// Third Party Auth's Username & Password
// global variables
 const _NODE_ENV = Enviornment.default.state || "development";
//const _NODE_ENV = 'DEVELOPMENT';
const _USERNAME =
  _NODE_ENV == 'DEVELOPMENT'
    ? developmentConstant.default.USERNAME
    : _NODE_ENV == 'STAGING'
    ? stagingConstant.default.USERNAME
    : productionConstant.default.USERNAME;
const _PASSWORD =
  _NODE_ENV == 'DEVELOPMENT'
    ? developmentConstant.default.PASSWORD
    : _NODE_ENV == 'STAGING'
    ? stagingConstant.default.PASSWORD
    : productionConstant.default.PASSWORD;

const _HRMSBASEURL =
  _NODE_ENV == 'DEVELOPMENT'
    ? developmentConstant.default.HRMSBASEURL
    : _NODE_ENV == 'STAGING'
    ? stagingConstant.default.HRMSBASEURL
    : productionConstant.default.HRMSBASEURL;

const auth = {
  username: _USERNAME,
  password: _PASSWORD,
};

const user = _DB.User;
const userWithRole = _DB.UserWithRole;
const projectTeam = _DB.ProjectTeam;
const userRole = _DB.UserRoles;
const leave = _DB.Leave;
const _sequelize = _DB.sequelize;

class UserService {
  // GET ALL USERS COUNT
  public _count = async (query: WhereOptions) => {
    return new Promise<number>((resolve, reject) => {
      const data = user.count({
        where: query,
      });
      resolve(data);
    });
  };

  //GET REPORTED PERSONS
  public _getReportingPersons = async (userId: number) => {
    return new Promise<iProjectTeam[]>((resolve, reject) => {
      const data = projectTeam.findAll({
        where: {
          [Op.or]: [_sequelize.fn('JSON_CONTAINS', _sequelize.col('report_to'), `${userId}`)],
        },
        include: [
          {
            model: user,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      });
      resolve(data);
    });
  };

  //GET REPORTED PERSONS LEAVES
  public _getReportingPersonsLeaves = async (userId: number, month: number, year: number) => {
    return new Promise<iProjectTeam[]>((resolve, reject) => {
      const data = projectTeam.findAll({
        where: {
          [Op.or]: [_sequelize.fn('JSON_CONTAINS', _sequelize.col('report_to'), `${userId}`)],
        },
        include: [
          {
            model: leave,
            as: 'leave',
            attributes: {
              exclude: ['id', 'user_id', 'created_at', 'updated_at', 'deleted_at'],
            },
            where: {
              [Op.and]: [
                {
                  [Op.or]: [
                    _sequelize.where(_sequelize.fn('YEAR', _sequelize.col('from_date')), year),
                    _sequelize.where(_sequelize.fn('YEAR', _sequelize.col('to_date')), year),
                  ],
                },
                {
                  [Op.or]: [
                    _sequelize.where(_sequelize.fn('MONTH', _sequelize.col('from_date')), month),
                    _sequelize.where(_sequelize.fn('MONTH', _sequelize.col('to_date')), month),
                  ],
                },
              ],
              status: 'APPROVED',
            },
          },
        ],
      });
      resolve(data);
    });
  };

  //GET LEAVE APPROVER PERSONS
  public _getLeaveApproverPersons = async (userId: number) => {
    return new Promise<iProjectTeam[]>((resolve) => {
      const data = projectTeam
        .findAll({
          where: {
            user_id: userId,
          },
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  // GET ALL USERS
  public _getAllUsers = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });

    return new Promise<iUser[]>((resolve, reject) => {
      const data = user.findAll({
        where: query,
        include: {
          model: userWithRole,
          as: 'user_with_role',
          attributes: ['role_id'],
        },
        limit: limit > 0 ? limit : null,
        offset: offset > 0 ? offset : null,
        order,
      });
      resolve(data);
    });
  };

  // Get All User Data
  public _getUserData = async () => {
    return new Promise((resolve, reject) => {
      const users: Promise<iUser[]> = user.findAll({});

      resolve(users);
    });
  };

  // Get User Data By Id
  public _getUserDataById = async (id: number) => {
    return new Promise((resolve, reject) => {
      const userData: Promise<iUser> = user.findByPk(id, {
        include: [
          {
            model: user,
            as: 'team_lead_name',
            attributes: ['first_name', 'last_name', 'designation', 'employee_image'],
          },
          {
            model: user,
            as: 'project_manager_name',
            attributes: ['first_name', 'last_name', 'designation', 'employee_image'],
          },
        ],
      });
      resolve(userData);
    });
  };

  // Get User Role
  public _getUserRole = async (id: number) => {
    return new Promise<iUserWithRole>((resolve, reject) => {
      const res = userWithRole.findOne({
        where: { user_id: id },
        include: {
          as: 'user_role',
          model: userRole,
          attributes: ['permission'],
        },
      });
      resolve(res);
    });
  };

  // Create User Role
  public _createUserRole = async (data) => {
    return new Promise<iUserWithRole>((resolve, reject) => {
      const res = userWithRole.create(data);
      resolve(res);
    });
  };

  // Update User Role
  public _updateUserRole = async (role_id: number, id: number) => {
    return new Promise((resolve, reject) => {
      const res = userWithRole.update(
        { role_id },
        {
          where: { user_id: id },
        }
      );
      resolve(res);
    });
  };
  // Update User Role Multiple
  public _updateUserRoleMultiple = async (role_id: number, id: number[]) => {
    return new Promise((resolve, reject) => {
      const res = userWithRole.update(
        { role_id },
        {
          where: { user_id: { [Op.in]: id } },
        }
      );
      resolve(res);
    });
  };

  //Get SyncUser Data
  public _getSyncUser = async () => {
    return new Promise((resolve, reject) => {
      const response: Promise<any[]> = axios.get(
        `${_HRMSBASEURL}/EmployeeSyncToTMS`,
        /* 'http://localhost:3007/EmployeeSyncToTMS' */ {
          auth,
        }
      );
      resolve(response);
    });
  };

  // Sync User
  public _syncUser = async (newUserData: iUser[]) => {
    return new Promise((resolve, reject) => {
      const SyncData: any = user.bulkCreate(newUserData, {
        updateOnDuplicate: [
          'id',
          'first_name',
          'last_name',
          'emails',
          'contact_number',
          'dob',
          'designation',
          'team_lead',
          'project_manager',
          'production_date',
          'departments',
          'technologies',
          'employee_image',
          'status',
          'is_active',
          'present_address',
          'education',
          'certificates',
          'gender',
          'marital_status',
          'blood_group',
          'employee_id',
          'skype',
          'linkedin',
          'password',
          'role',
        ],
      });

      resolve(SyncData);
    });
  };

  // Update User
  public _updateHrmsUser = async (data: iUser) => {
    return new Promise((resolve, reject) => {
      const res = user.update(data, {
        where: { employee_id: data.employee_id },
      });
      resolve(res);
    });
  };

  // Login User
  public _login = async (employee_id: string) => {
    return new Promise<iUser>((resolve, reject) => {
      const data = user.findOne({
        where: {
          employee_id,
          status: { [Op.like]: 'employee' },
        },
        include: {
          as: 'user_with_role',
          model: userWithRole,
          attributes: ['id'],
          include: [
            {
              as: 'user_role',
              model: userRole,
              attributes: ['title', 'permission'],
            },
          ],
        },
      });
      resolve(data);
    });
  };

  // Update User Skill description
  public _updateUserSkillDescription = async (skill_description: string, employee_id: number) => {
    return new Promise((resolve, reject) => {
      const res = user.update(
        { skill_description: skill_description },
        {
          where: { id: employee_id },
        }
      );
      resolve(res);
    });
  };
}

export default UserService;
