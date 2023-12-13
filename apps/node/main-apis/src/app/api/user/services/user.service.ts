import axios from 'axios';
import { Op, WhereOptions, QueryTypes } from 'sequelize';
import { iUser, iUserWithRole, iUserLog } from '../../../database/interface/user.interface';

import { developmentConstant, stagingConstant, productionConstant } from '@tms-workspace/configurations';
import _DB from '../../../database/models';
import { Query } from '@tms-workspace/apis-core';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import * as Enviornment from '../../../../enviornment';
import { iSiteSetting } from '../../../database/interface/site_setting.interface';
import { async } from 'rxjs';

// Third Party Auth's Username & Password
// global variables
const _NODE_ENV = Enviornment.default.state || 'development';
// const _NODE_ENV = 'staging';
const _USERNAME =
  _NODE_ENV == 'development'
    ? developmentConstant.default.USERNAME
    : _NODE_ENV == 'staging'
      ? stagingConstant.default.USERNAME
      : productionConstant.default.USERNAME;
const _PASSWORD =
  _NODE_ENV == 'development'
    ? developmentConstant.default.PASSWORD
    : _NODE_ENV == 'staging'
      ? stagingConstant.default.PASSWORD
      : productionConstant.default.PASSWORD;

const _HRMSBASEURL =
  _NODE_ENV == 'development'
    ? developmentConstant.default.HRMSBASEURL
    : _NODE_ENV == 'staging'
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
const siteSetting = _DB.SiteSetting;
const _timeLog = _DB.UserLog;
const _holiday = _DB.Holiday;
const _leave = _DB.Leave;

const _sequelize = _DB.sequelize;

class UserService {
  // GET ALL USERS COUNT
  public _count = async (query: WhereOptions, role_id = undefined) => {
    return new Promise<number>((resolve, reject) => {
      const data = user.count({
        where: query,
        include: {
          model: userWithRole,
          as: 'user_with_role',
          where: role_id ? { role_id: role_id } : {},
          attributes: ['role_id'],
        },
      });
      resolve(data);
    });
  };

  //GET REPORTED PERSONS
  public _getReportingPersons = async (userId: number) => {
    return new Promise<iProjectTeam[]>((resolve, reject) => {
      const data = projectTeam.findAll({
        where: {
          [Op.or]: [_sequelize.fn('JSON_CONTAINS', _sequelize.col('report_to'), `${userId}`), { user_id: userId }],
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
    return new Promise<iUser>((resolve) => {
      const data = user
        .findOne({
          include: [
            {
              model: user,
              as: 'team_lead_name',
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
            {
              model: user,
              as: 'project_manager_name',
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
          ],
          where: {
            id: userId,
          },
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getLeaveResponsiblePersons = async () => {
    return new Promise<iUser[]>((resolve, reject) => {
      const leaveResponsiblePerson = siteSetting
        .findOne({
          where: {
            identifier: 'leave_reponsible_person',
          },
        })
        .then((res) => {
          const pArray = JSON.parse(JSON.stringify(res));

          const leaveResponsibleUser = user
            .findAll({
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
              where: {
                id: {
                  [Op.in]: pArray.value,
                },
              },
            })
            .then((res2) => {
              return JSON.parse(JSON.stringify(res2));
            });

          return leaveResponsibleUser;
        });
      resolve(leaveResponsiblePerson);
    });
  };

  // GET ALL USERS
  public _getAllUsers = async (query: WhereOptions = {}, role_id = undefined, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });

    return new Promise<iUser[]>((resolve, reject) => {
      const data = user.findAll({
        where: {
          ...query,
          is_active: true,
        },
        include: [
          {
            model: userWithRole,
            as: 'user_with_role',
            where: role_id ? { role_id: role_id } : {},
            attributes: ['role_id'],
          },
          {
            model: user,
            as: 'team_lead_name',
            attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
          },
          {
            model: user,
            as: 'project_manager_name',
            attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
          },
        ],
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
    return new Promise<iUser>((resolve, reject) => {
      const userData = user
        .findByPk(id, {
          include: [
            {
              model: user,
              as: 'team_lead_name',
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image', 'team_lead', 'project_manager'],
            },
            {
              model: user,
              as: 'project_manager_name',
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image', 'team_lead', 'project_manager'],
            },
          ],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(userData);
    });
  };

  public _getUsersDatabyIds = async (ids: number[]) => {
    return new Promise((resolve, reject) => {
      const userData: Promise<iUser[]> = user.findAll({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
        attributes: ['first_name', 'last_name'],
      });
      resolve(userData);
    });
  };

  public _getUserDataByEmployeeCode = async (employeeCode: string) => {
    return new Promise<iUser>((resolve, reject) => {
      const userData = user
        .findOne({
          include: [
            {
              model: user,
              as: 'team_lead_name',
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image', 'team_lead', 'project_manager'],
            },
            {
              model: user,
              as: 'project_manager_name',
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image', 'team_lead', 'project_manager'],
            },
          ],
          where: {
            employee_id: employeeCode,
          },
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
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

  // Get User Role By Roll Id
  public _getUserRoleByRoleId = async (id: number) => {
    return new Promise<iUserWithRole>((resolve, reject) => {
      const res = userWithRole.findOne({
        where: { role_id: id },
        include: {
          as: 'user_role',
          model: userRole,
          attributes: ['title', 'permission'],
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
      console.log('_HRMSBASEURL', _HRMSBASEURL);

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
          'cybercom_email',
          'workdetails',
          'experience',
        ],
        include: ['user_with_role', 'leaveBalance'],
      });

      resolve(SyncData);
    });
  };

  // Update User
  public _updateHrmsUser = async (data: iUser) => {
    return new Promise((resolve, reject) => {
      // data.password = '660dd0298bd4ea6feadbd655a89c7b34';
      // data.is_active = true;

      const res = user.update(data, {
        where: { employee_id: data.employee_id },
      });
      resolve(res);
    });
  };

  // Login User
  public _login = async (employee_id: string) => {
    return new Promise<object>((resolve, reject) => {
      // const data = user.findOne({
      //   where: {
      //     [Op.or]: [
      //       {
      //         employee_id: employee_id,
      //       },
      //       {
      //         cybercom_email: employee_id,
      //       },
      //     ],
      //     employee_id: employee_id,
      //     status: { [Op.like]: 'employee' },
      //   },
      //   include: {
      //     as: 'user_with_role',
      //     model: userWithRole,
      //     attributes: ['id'],
      //     include: [
      //       {
      //         as: 'user_role',
      //         model: userRole,
      //         attributes: ['title', 'permission'],
      //       },
      //     ],
      //   },
      // });
      const data = _DB.sequelize.query(
        `SELECT
        u.*,
        ur.id AS user_role_id,
        ur.title AS user_role_title,
        ur.permission AS user_role_permission,
        tpt.id AS reporter
    FROM
        tm_users AS u
    LEFT JOIN
        tm_project_team AS tpt ON JSON_CONTAINS(tpt.report_to, CAST(u.id AS JSON))
    LEFT JOIN
        tm_user_with_roles AS uwr ON u.id = uwr.user_id
    LEFT JOIN
        tm_user_roles AS ur ON uwr.role_id = ur.id
    WHERE (u.employee_id = '${employee_id}' OR u.cybercom_email = '${employee_id}')
    AND u.status LIKE 'employee'`,
        { type: QueryTypes.SELECT }
      );
      resolve(data);
    });
  };

  public _ReporterTeam = async (userId: number) => {
    return new Promise<iProjectTeam[]>((resolve, reject) => {
      const data = projectTeam.findAll({
        where: {
          [Op.or]: [_sequelize.fn('JSON_CONTAINS', _sequelize.col('report_to'), `${userId}`)],
        },
      });
      resolve(data);
    });
  };
  // Update User
  public _updateUserSession = async (sessionid: string, employee_id: number) => {
    return new Promise((resolve, reject) => {
      const res = user.update(
        { active_sessionid: sessionid },
        {
          where: { id: employee_id },
        }
      );
      resolve(res);
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

  public _getTimeHistoryCount = async (query: WhereOptions) => {
    return new Promise<number>((resolve, reject) => {
      const data = _timeLog.count({
        where: query,
      });
      resolve(data);
    });
  };

  public _TimeHistoryCount = async (query: WhereOptions = {}) => {
    return new Promise((resolve) => {
      const data = _timeLog.count({
        where: query,
      });
      resolve(data);
    });
  };

  public _getAllTimeHistory = async (query: WhereOptions = {}, user_id: number) => {
    return new Promise<iUserLog[]>((resolve, reject) => {
      const data = _timeLog
        .findAll({
          where: query,
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  public _getTimeHistory = async (query: WhereOptions = {}, user_id: number, p = 0, l = 0, sortBy = 'created_at', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });
    return new Promise<iUserLog[]>((resolve, reject) => {
      
      const data = _timeLog.findAll({
        where: query,
        order,
        limit: limit > 0 ? limit : null,
        offset: offset > 0 ? offset : null,
      });
      resolve(data);
    });
  };

  // GET BIRTHDAY & WORK ANIVERSARRY COUNT
  public _countBirthdayWorkAnniversary = async (where: any = {}) => {
    return new Promise<number>((resolve, reject) => {
      const query = `SELECT COUNT(*) AS total
  FROM (
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`name\`, \`dob\` as \`eventDate\`, '1' AS \`isBirthday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      AND (MONTH(\`tm_users\`.\`dob\`) = ${where.month})AND (DAY(\`tm_users\`.\`dob\`) = ${where.day})
    )
    UNION ALL
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`name\`, \`production_date\` as \`eventDate\`, '0' AS \`isBirthday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      AND (MONTH(\`tm_users\`.\`production_date\`) = ${where.month})
      AND (DAY(\`tm_users\`.\`production_date\`) = ${where.day})
    )
  ) AS results;`;

      const data = _sequelize.query(query, { type: QueryTypes.SELECT }).then((res: any) => {
        return res[0].total;
      });

      resolve(data);
    });
  };

  // get users email address using user id
  public _getUserEmail = async (id: number) => {
    const user = await _DB.User.findOne({
      where: { id: id },
    });
    return user;
  };
  // GET ALL USERS BASE ON GET BIRTHDAY & WORK ANIVERSARRY
  public _getAllUsersBirthdayWorkAnniversary = async (where: any = {}, p = 0, l = 0, sortBy = 'eventDate', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });

    // return new Promise<iUser[]>((resolve, reject) => {
    //   const data = user
    //     .findAll({
    //       where: query,

    //       limit: limit > 0 ? limit : null,
    //       offset: offset > 0 ? offset : null,
    //       order,
    //     })
    //     .then(async (res) => {
    //       const result = JSON.parse(JSON.stringify(res));

    //       return await Promise.all(
    //         result.map((user) => {
    //           return {
    //             id: user.id,
    //             first_name: user.first_name,
    //             last_name: user.last_name,
    //             dob: user.dob,
    //             designation: user.designation,
    //             production_date: user.production_date,
    //             employee_image: user.employee_image,
    //           };
    //         })
    //       );
    //     });
    //   resolve(data);
    // });
    return new Promise<object[]>((resolve, reject) => {
      // Create Custom Query for Get Holiday = 0, Special Day = 1, Birth Day = 2 & Work Aniversary = 3  DAY(\`eventDate\`) MONTH(\`eventDate\`)

      const query = `SELECT \`title\` as \`title\`,  CONCAT(${
        where.year
      }, '-', DATE_FORMAT(\`eventDate\`, '%m') , '-',DATE_FORMAT(\`eventDate\`, '%d')) AS \`eventDate\`, \`isBirthday\`, \`production_date\`,\`employee_image\`,\`designation\` FROM (

    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`dob\` as \`eventDate\`, '1' AS \`isBirthday\`, \`production_date\`,\`employee_image\`,\`designation\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      AND (MONTH(\`tm_users\`.\`dob\`) = ${where.month}) 
      AND (DAY(\`tm_users\`.\`dob\`) = ${where.day})
    )

    UNION ALL 

    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`production_date\` as \`eventDate\`, '0' AS \`isBirthday\`, \`production_date\`,\`employee_image\`,\`designation\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      AND (MONTH(\`tm_users\`.\`production_date\`) = ${where.month}) 
      AND (DAY(\`tm_users\`.\`production_date\`) = ${where.day})
    ) 
  ) AS results 
    WHERE \`eventDate\` != \`production_date\`
    ${sortBy && orderBy ? `ORDER BY ${sortBy} ${orderBy}` : ``}
    ${limit > 0 ? `LIMIT` + limit : ``}
    ${offset > 0 ? `OFFSET` + offset : ``}
  ;
`;
      const data = _sequelize.query(query, { type: QueryTypes.SELECT }).then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  public _areIPsEqual = (ip1, ip2) => {
    const ip1WithoutPrefix = ip1?.replace('::ffff:', '') || '';
    const ip2WithoutPrefix = ip2?.replace('::ffff:', '') || '';

    const ip1Components = ip1WithoutPrefix?.toLowerCase()?.split('.') || [];
    const ip2Components = ip2WithoutPrefix?.toLowerCase()?.split('.') || [];
    let isOffice = true;
    let index = 0;
    for (const ip of ip1Components) {
      if (ip !== 'x') {
        if (ip !== ip2Components[index]) {
          isOffice = false;
        }
      }
      index = index + 1;
    }
    // if (ip1Components.length !== 4 || ip2Components.length !== 4) {
    //   return false; // IP addresses must have four components
    // }

    // for (let i = 0; i < 4; i++) {
    //   if (ip1Components[i] !== ip2Components[i] && ip2Components[i] !== 'x') {
    //     return false; // IP components don't match
    //   }
    // }

    return isOffice; // IP addresses are the same
  };
  public _getWeeklyHoliday = async (query: WhereOptions) => {
    return new Promise<any>((resolve, reject) => {
      const data = _holiday.findAll({ where: query }).then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  public _getWeeklyLeaveOfUser = async (query: WhereOptions) => {
    return new Promise<any>((resolve, reject) => {
      const data = _leave.findAll({ where: query }).then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  public _getLeaveResponsiblePersonsId = async () => {
    return new Promise<number[]>((resolve, reject) => {
      const leaveResponsiblePerson = siteSetting
        .findOne({
          where: {
            identifier: 'leave_reponsible_person',
          },
        })
        .then((res) => {
          const pArray = JSON.parse(JSON.stringify(res));
          console.log('pArray', pArray);

          return pArray.value;
        });
      resolve(leaveResponsiblePerson);
    });
  };

  public _updateManualTimeUpdate = async (timeData: any) => {
    return new Promise<any>((resolve, reject) => {
      const data = _timeLog.create(timeData);
      resolve(data);
    });
  };
}

export default UserService;
