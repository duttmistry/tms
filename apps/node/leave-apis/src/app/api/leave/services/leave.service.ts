          import { iLeaveHistory, iLeaveHistoryLog, iLeaveBalance, iLeaveApproval, iLeaveOpeningBalance } from '../../../database/interface/leave.interface';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import { iHoliday } from '../../../database/interface/holiday.interface';
import { iUser } from '../../../database/interface/user.interface';
import { iSiteSetting } from '../../../database/interface/site_settings.interface';
import { Op, QueryTypes, WhereOptions } from 'sequelize';
import db from '../../../database/models';
import { Query } from '@tms-workspace/apis-core';
import { query } from 'express';
import _DB from '../../../database/models';
import moment from 'moment';

const _user = db.User;
const _leaveBalance = db.LeaveBalance;
const _leaveHistory = db.LeaveHistory;
const _leaveHistoryLeaveType = db.LeaveHistoryLeaveType;
const _leaveHistoryLog = db.LeaveHistoryLog;
const _leaveSubject = db.LeaveSubject;
const _leaveApproval = db.LeaveApproval;
const _projectTeam = db.ProjectTeam;
const _leaveHistoryTransection = db.LeaveTransectionHistory;
const _holiday = db.Holiday;
const _siteSetting = db.SiteSetting;
const _leaveOpeningBalance = db.LeaveOpeningBalance;

class LeaveService {
  public _arraysEqual = <T>(arr1: T[], arr2: T[]): boolean => {
    if (arr1.length !== arr2.length) {
      return false;
    }

    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }

    return true;
  };
  // Get Holiday List

  public _getUsersDetails = async (query) => {
    try {
      const userDetails = await _DB.User.findAll({
        where: {
          id: {
            [Op.in]: query, // Assuming 'query.id' is an array of user IDs
          },
        },
      });
      return userDetails;
    } catch (err) {
      console.log('Error in get user details', err);
      throw err;
    }
  };

  public _getHolidayList = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: Number(l),
      sortBy,
      orderBy,
    });

    return new Promise<iHoliday[]>((resolve, reject) => {
      const data = _holiday
        .findAll({
          where: query,
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          order,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  // GET LEAVE Balance
  public _getleaveBalance = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    return new Promise<iLeaveBalance[]>((resolve) => {
      const { offset, limit, order } = Query.getQuery({
        page: p,
        limit: l,
        sortBy,
        orderBy,
      });
      const data = _leaveBalance
        .findAll({
          include: [
            {
              as: 'user',
              model: _user,
            },
          ],
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          order,
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });

      resolve(data);
    });
  };

  // UPDATE LEAVE Balance
  public _updateleaveBalance = async (leaveBalance, query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _leaveBalance.update(leaveBalance, {
        where: query,
      });

      resolve(data);
    });
  };

  // UPDATE LEAVE Balance v2
  public _updateleaveBalanceNew = async (leaveBalance) => {
    return new Promise((resolve) => {
      const data = _leaveBalance.bulkCreate(leaveBalance, {
        updateOnDuplicate: ['id', 'user_id', 'leave_type', 'current_balance', 'applied_balance', 'reserved_balance'],
      });

      resolve(data);
    });
  };

  // GET ALL LEAVE DATA
  public _getAllLeaves = async (query1: WhereOptions = {}, query2: WhereOptions = {}, p = 0, l = 0, sortBy = 'from_date', orderBy = 'desc') => {
    return new Promise<iLeaveHistory[]>((resolve) => {
      const { offset, limit, order } = Query.getQuery({
        page: p,
        limit: l,
        sortBy,
        orderBy,
      });

      let include;
      const OrderBy = order as any[];

      if (Object.keys(query2).length !== 0) {
        include = [
          {
            as: 'leaveHistoryLog',
            model: _leaveHistoryLog,
            attributes: ['id', 'user_id', 'leave_history_id', 'action', 'action_by', 'created_at', 'updated_at', 'updated_values'],
            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
              },
              { as: 'actionBy', model: _user, attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'] },
            ],
          },
          {
            as: 'leaveSubject',
            model: _leaveSubject,
            attributes: ['id', 'title'],
          },
          {
            as: 'leaveTypes',
            model: _leaveHistoryLeaveType,
            attributes: ['id', 'leave_history_id', 'user_id', 'leave_type', 'leave_days'],
          },
          {
            as: 'leaveApproval',
            model: _leaveApproval,
            attributes: ['id', 'status', 'user_id', 'created_at', 'updated_at', 'action_comment', 'type'],
            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
              },
            ],
            // required: true,
            where: query2,
          },
          {
            as: 'leaveApprovalData',
            model: _leaveApproval,
            attributes: ['id', 'status', 'user_id', 'created_at', 'updated_at', 'action_comment', 'type'],
            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
              },
            ],
          },
          {
            as: 'user',
            model: _user,
            attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
          },
        ];
      } else {
        include = [
          {
            as: 'leaveHistoryLog',
            model: _leaveHistoryLog,
            attributes: ['id', 'user_id', 'leave_history_id', 'action', 'action_by', 'created_at', 'updated_at', 'updated_values'],
            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
              },
              { as: 'actionBy', model: _user, attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'] },
            ],
          },
          {
            as: 'leaveSubject',
            model: _leaveSubject,
            attributes: ['id', 'title'],
          },
          {
            as: 'leaveTypes',
            model: _leaveHistoryLeaveType,
            attributes: ['id', 'leave_history_id', 'user_id', 'leave_type', 'leave_days'],
          },
          {
            as: 'leaveApproval',
            model: _leaveApproval,
            attributes: ['id', 'status', 'user_id', 'created_at', 'updated_at', 'action_comment', 'type'],
            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
              },
            ],
          },
          {
            as: 'user',
            model: _user,
            attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
          },
        ];
      }

      //console.log('order', OrderBy);

      OrderBy.push(['to_date', 'desc']);
      OrderBy.push(['requested_date', 'desc']);

      const data = _leaveHistory
        .findAll({
          where: query1,
          include: include,
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          order: OrderBy,
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  // get the most 3 recent leave of user

  public _getUserMost3Leave = async (query: WhereOptions = {}) => {
    try {
      const data = await _DB.LeaveHistory.findAll({
        where: query,
        limit: 3,
        order: [['requested_date', 'desc']],
      });
      return data;
    } catch (err) {
      console.log(err);
      return err;
    }
  };

  public _validateLeave = async (query: WhereOptions = {}) => {
    return new Promise<iLeaveHistory[]>((resolve) => {
      const include = [
        {
          as: 'leaveHistoryLog',
          model: _leaveHistoryLog,
          attributes: ['id', 'user_id', 'leave_history_id', 'action', 'action_by', 'created_at', 'updated_at', 'updated_values'],
          include: [
            {
              as: 'user',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
            },
          ],
        },
        {
          as: 'leaveSubject',
          model: _leaveSubject,
          attributes: ['id', 'title'],
        },
        {
          as: 'leaveApproval',
          model: _leaveApproval,
          attributes: ['id', 'status', 'user_id', 'created_at', 'updated_at', 'action_comment'],
          include: [
            {
              as: 'user',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
            },
          ],
        },
        {
          as: 'user',
          model: _user,
          attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
        },
      ];
      const data = _leaveHistory
        .findAll({
          where: query,
          include,
          order: [
            ['from_date', 'asc'],
            ['to_date', 'asc'],
          ],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  // GET TOTAL LEAVE HISTORY COUNT
  public _getLeavesCount = async (query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _leaveHistory.count({
        where: query,
      });
      resolve(count);
    });
  };

  // CREATE LEAVE
  public _createLeave = async (leave: object) => {
    return new Promise((resolve) => {
      const data: Promise<iLeaveHistory> = _leaveHistory.create(leave, {
        include: ['leaveHistoryLog', 'leaveApproval', 'leaveTypes'],
      });
      resolve(data);
    });
  };

  // GET LEAVE BY ID
  public _getLeaveById = async (id: number) => {
    return new Promise<iLeaveHistory>((resolve) => {
      const data = _leaveHistory
        .findByPk(id, {
          include: [
            {
              as: 'leaveHistoryLog',
              model: _leaveHistoryLog,
              attributes: ['id', 'user_id', 'leave_history_id', 'action', 'action_by', 'created_at', 'updated_at', 'updated_values'],
              include: [
                {
                  as: 'user',
                  model: _user,
                  attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
                },
                { as: 'actionBy', model: _user, attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'] },
              ],
            },
            {
              as: 'leaveSubject',
              model: _leaveSubject,
              attributes: ['id', 'title'],
            },
            {
              as: 'leaveTypes',
              model: _leaveHistoryLeaveType,
              attributes: ['id', 'leave_history_id', 'user_id', 'leave_type', 'leave_days'],
            },
            {
              as: 'leaveApproval',
              model: _leaveApproval,
              attributes: ['id', 'status', 'user_id', 'created_at', 'updated_at', 'action_comment', 'type'],
              include: [
                {
                  as: 'user',
                  model: _user,
                  attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
                },
              ],
            },
            {
              as: 'user',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
            },
          ],
        })
        .then((data) => JSON.parse(JSON.stringify(data)));
      resolve(data);
    });
  };

  // UPDATE LEAVE
  public _updateLeave = async (leave: object, id: number) => {
    return new Promise((resolve) => {
      _leaveHistory.update(leave, {
        where: {
          id: id,
        },
      });
      resolve(true);
    });
  };

  public _updateLeaveType = async (leaveTypes: Array<object>) => {
    return new Promise((resolve) => {
      _leaveHistoryLeaveType.bulkCreate(leaveTypes, {
        updateOnDuplicate: ['id', 'leave_history_id', 'user_id', 'leave_type', 'leave_days'],
      });
      resolve(true);
    });
  };

  public _deleteLeaveTypes = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _leaveHistoryLeaveType.destroy({
        where: query,
      });
      resolve(data);
    });
  };

  // DELETE LEAVE
  public _deleteLeave = async (id: number) => {
    return new Promise((resolve) => {
      _leaveHistory
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => {
          _leaveHistoryLog.destroy({
            where: {
              leave_history_id: id,
            },
          });

          _leaveHistoryLeaveType.destroy({
            where: {
              leave_history_id: id,
            },
          });
        });

      resolve(true);
    });
  };

  // CREATE LEAVE LOG
  public _createLeaveLog = async (leaveLog: object) => {
    return new Promise((resolve) => {
      const data: Promise<iLeaveHistoryLog> = _leaveHistoryLog.create(leaveLog);
      resolve(data);
    });
  };

  // GET LEAVE APPROVAL
  public _getApprovalOfLeave = async (query: WhereOptions) => {
    return new Promise<iLeaveApproval[]>((resolve) => {
      const data = _leaveApproval
        .findAll({
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  // UPDATE LEAVE APPROVAL
  public _updateApprovalOfLeave = async (leaveApproval: object, query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _leaveApproval.update(leaveApproval, {
        where: query,
      });
      resolve(data);
    });
  };

  // UPDATE LEAVE APPROVAL
  public _createApprovalOfLeave = async (leaveApproval: object[]) => {
    return new Promise((resolve) => {
      const data = _leaveApproval.bulkCreate(leaveApproval);
      resolve(data);
    });
  };

  // UPDATE LEAVE APPROVAL
  public _deleteApprovalOfLeave = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _leaveApproval.destroy({
        where: query,
      });
      resolve(data);
    });
  };

  public _getAllUser = async () => {
    return new Promise<{ user_id: number }[]>((resolve) => {
      const data = _user
        .findAll({
          attributes: {
            include: ['id'],
            exclude: ['first_name'],
          },
        })
        .then((res) => {
          return res.map((d) => {
            return { user_id: d.id };
          });

          // return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  //Get Leave Approver list
  public _getApproverEmployee = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _user
        .findAll({
          attributes: {
            include: ['id'],
            exclude: ['first_name'],
          },
        })
        .then((res) => {
          return res.map((d) => {
            return { user_id: d.id };
          });

          // return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getProjectTeam = async (query: WhereOptions) => {
    return new Promise<iProjectTeam[]>((resolve) => {
      const data = _projectTeam
        .findAll({
          where: query,
        })
        .then((res) => {
          // return res.map((d) => {
          //   return d.project_id;
          // });

          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getLeaveReport = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    return new Promise<iUser[]>((resolve) => {
      const { offset, limit, order } = Query.getQuery({
        page: p,
        limit: l,
        sortBy,
        orderBy,
      });
      const data = _user
        .findAll({
          include: [
            {
              as: 'leaveBalance',
              model: _leaveBalance,
            },
          ],
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          order,
          where: query,
          attributes: ['id', 'first_name'],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });

      resolve(data);
    });
  };

  // GET TOTAL LEAVE HISTORY COUNT
  public _getLeaveReportCount = async (query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _user.count({
        where: query,
      });
      resolve(count);
    });
  };

  public _getTeamLeavesCount = async (query1: WhereOptions, query2: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _leaveHistory.count({
        where: query1,
        include: [
          {
            as: 'leaveApproval',
            model: _leaveApproval,
            attributes: ['id', 'status', 'user_id', 'created_at', 'updated_at', 'action_comment'],
            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
              },
            ],
            // required: true,
            // where: query2,
          },
        ],
      });

      resolve(count);
    });
  };

  public _getTeamLeavesCount_v2 = async (query1: WhereOptions, query2: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _leaveHistory.count({
        where: query1,
      });

      resolve(count);
    });
  };

  public _getTeamLeavesEmployeeList = async (status) => {
    return new Promise<object[]>((resolve) => {
      const result = _DB.sequelize.query(
        `SELECT tu.id,tu.first_name,tu.last_name,tu.employee_image
        FROM tm_leave_history tlh
        LEFT JOIN tm_users tu ON (tlh.user_id = tu.id AND tu.deleted_at IS NULL) WHERE
        ${status === 'ALL' ? 'tu.id IS NOT NULL' : `LOWER(tlh.status) = '${status}' AND tu.id IS NOT NULL`}
        GROUP BY tu.id ORDER BY tu.first_name;`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getLeavesTxnHistoryCount = async (query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _leaveHistoryTransection.count({
        where: query,
      });
      resolve(count);
    });
  };

  public _getAllLeavesTxnHistory = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'created_date', orderBy = 'desc') => {
    return new Promise((resolve) => {
      const { offset, limit, order } = Query.getQuery({
        page: p,
        limit: l,
        sortBy,
        orderBy,
      });

      const include = [
        {
          as: 'user',
          model: _user,
          attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
        },

        {
          as: 'CreatedByUser',
          model: _user,
          attributes: ['id', 'first_name', 'last_name', 'employee_image', 'designation'],
        },
      ];
      const data = _leaveHistoryTransection.findAll({
        where: query,
        limit: limit > 0 ? limit : null,
        offset: offset > 0 ? offset : null,
        order,
        include,
      });
      resolve(data);
    });
  };

  public _getLeavesTxnHistoryUserDetails = async (query: WhereOptions) => {
    return new Promise<iUser>((resolve) => {
      const data = _user
        .findOne({
          where: query,
          include: [
            {
              as: 'leaveBalance',
              model: _leaveBalance,
            },
            {
              model: _user,
              as: 'team_lead_name',
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
            {
              model: _user,
              as: 'project_manager_name',
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
          ],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _addLeaveBalance = async (leaveBalance: iLeaveBalance[]) => {
    return new Promise((resolve) => {
      const data = _leaveBalance.bulkCreate(leaveBalance);
      resolve(data);
    });
  };

  public _getUserDetails = async (query: WhereOptions) => {
    return new Promise<iUser>((resolve) => {
      const data = _user.findOne({
        where: query,
      });
      resolve(data);
    });
  };

  public _checkIsReponsiblePerson = async (query: WhereOptions) => {
    return new Promise<number[]>((resolve) => {
      const data = _siteSetting
        .findOne({
          where: query,
        })
        .then((res) => {
          const r = JSON.parse(JSON.stringify(res));
          return r.value;
        });
      resolve(data);
    });
  };

  public _getAllUserDetails = async () => {
    return new Promise<iUser[]>((resolve) => {
      const data = _user.findAll({});
      resolve(data);
    });
  };

  public _importleaveData = async (leaveData: iLeaveHistory[]) => {
    return new Promise((resolve) => {
      const data = _leaveHistory.bulkCreate(leaveData, {
        include: ['leaveHistoryLog', 'leaveApproval', 'leaveTypes'],
      });
      resolve(data);
    });
  };

  public _importleaveBalance = async (leaveBalance: iLeaveBalance[]) => {
    return new Promise((resolve) => {
      //console.log('leaveBalance', leaveBalance);

      const data = _leaveBalance.bulkCreate(leaveBalance, {
        updateOnDuplicate: ['id', 'user_id', 'leave_type', 'current_balance', 'applied_balance', 'reserved_balance'],
      });
      resolve(data);
    });
  };

  public _importleaveOpeningBalance = async (leaveOpeningBalance: iLeaveOpeningBalance[]) => {
    return new Promise((resolve) => {
      const data = _leaveOpeningBalance.bulkCreate(leaveOpeningBalance, {
        updateOnDuplicate: ['id', 'user_id', 'leave_type', 'opening_balance', 'closing_balance', 'month', 'year'],
      });
      resolve(data);
    });
  };

  public _updateLeaveOpeningData = async (LeaveClosingData: object, query: WhereOptions) => {
    //console.log('_updateLeaveOpeningData', LeaveClosingData);
    return new Promise((resolve) => {
      const data = _leaveOpeningBalance.update(LeaveClosingData, {
        where: query,
      });

      resolve(data);
    });
  };

  public _getLeaveHistoryCount = async (query: WhereOptions) => {
    return new Promise<iLeaveHistory[]>((resolve) => {
      const data = _leaveHistory
        .findAll({
          where: query,
          include: [
            {
              as: 'leaveTypes',
              model: _leaveHistoryLeaveType,
              attributes: ['id', 'leave_history_id', 'user_id', 'leave_type', 'leave_days'],
            },
          ],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });

      resolve(data);
    });
  };

  public _pushInData = async (key, value1, value2) => {
    let description = null;

    switch (key) {
      case 'from_date':
        description = 'From date';

        break;

      case 'leave_from_slot':
        description = 'From date slot';
        break;

      case 'to_date':
        description = 'To date';
        break;
      case 'leave_to_slot':
        description = 'To date slot';
        break;
      case 'no_of_days':
        description = 'No. days';
        break;
      case 'leave_subject':
        description = 'Leave subject';
        break;
      case 'leave_subject_text':
        description = 'Leave subject';
        break;
      case 'description':
        description = 'Description';
        break;
      case 'requested_date':
        description = 'Leave request date';
        break;
      case 'attachments':
        description = 'Attachments';
        break;

      default:
        description = key;
        break;
    }

    return { key, oldValue: value1, newValue: value2, description: description };
  };

  public deepEqual = (obj1, obj2) => {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  };

  public _compareObjects = async <T extends Record<string, unknown>>(
    obj1: T,
    obj2: T = {} as T
  ): Promise<Array<{ key: keyof T; oldValue: unknown; newValue: unknown }>> => {
    let differentFields: Array<{ key: keyof T; oldValue: unknown; newValue: unknown }> = [];
    for (const key in obj2) {
      if (Object.prototype.hasOwnProperty.call(obj1, key)) {
        const value1 = obj1[key];
        const value2 = obj2[key];

        if (key != 'attachments') {
          if (key === 'from_date' || key === 'to_date' || key === 'leave_from_slot' || key === 'leave_to_slot') {
            if (key === 'leave_from_slot') {
              if (value1 !== value2) {
                differentFields.push(
                  await this._pushInData(
                    key,
                    `${moment(obj1['from_date']).format('DD/MM/YYYY')} ( ${obj1[key]} )`,
                    `${moment(obj2['from_date']).format('DD/MM/YYYY')} ( ${obj2[key]} )`
                  )
                );
              }
            } else if (key === 'leave_to_slot') {
              if (value1 !== value2) {
                differentFields.push(
                  await this._pushInData(
                    key,
                    `${moment(obj1['to_date']).format('DD/MM/YYYY')} ( ${obj1[key]} )`,
                    `${moment(obj2['to_date']).format('DD/MM/YYYY')} ( ${obj2[key]} )`
                  )
                );
              }
            } else {
              if (!moment(value1).isSame(moment(value2), 'day')) {
                differentFields.push(
                  await this._pushInData(
                    key,
                    `${moment(obj1[key]).format('DD/MM/YYYY')} ( ${obj1['leave_from_slot']} )`,
                    `${moment(obj2[key]).format('DD/MM/YYYY')} ( ${obj2['leave_to_slot']} )`
                  )
                );
              }
            }
          } else if (key === 'requested_date') {
            if (!moment(value1).isSame(moment(value2), 'day')) {
              differentFields.push(await this._pushInData(key, `${moment(value1).format('DD/MM/YYYY')}`, `${moment(value2).format('DD-MM-YYYY')}`));
            }
          } else if (key === 'leave_subject') {
            const v1Subject = await _leaveSubject.findByPk(value1 as number).then((res) => {
              return JSON.parse(JSON.stringify(res));
            });
            const v2Subject = await _leaveSubject.findByPk(value2 as number).then((res) => {
              return JSON.parse(JSON.stringify(res));
            });

            if (v1Subject !== null && v2Subject !== null && value1 !== value2) {
              differentFields.push(await this._pushInData(key, v1Subject.title, v2Subject.title));
            }
          } else {
            if (value1 !== value2) {

              differentFields.push(await this._pushInData(key, value1 ? value1 : '-', value2 ? value2 : '-'));
            }
          }
        } else {
          if (Array.isArray(value1) && Array.isArray(value2)) {
            if (!value1.length && value2.length) {
              differentFields.push(await this._pushInData(key, value1, value2));
            }
            if (!value1.every((obj, index) => this.deepEqual(obj, value2[index]))) {
              differentFields.push(await this._pushInData(key, value1, value2));
            }
          }
        }
      }
    }

    const isLeaveFromDate = differentFields.some((obj) => Object.values(obj).includes('from_date'));
    const isLeaveFromSlot = differentFields.some((obj) => Object.values(obj).includes('leave_from_slot'));


    const isLeaveToDate = differentFields.some((obj) => Object.values(obj).includes('to_date'));
    const isLeaveToSlot = differentFields.some((obj) => Object.values(obj).includes('leave_to_slot'));

    if (isLeaveFromDate && isLeaveFromSlot) {
      differentFields = differentFields.filter((obj) => !Object.values(obj).includes('leave_from_slot'));
    }

    if (isLeaveToDate && isLeaveToSlot) {
      differentFields = differentFields.filter((obj) => !Object.values(obj).includes('leave_to_slot'));
    }

    


    
    return differentFields;
  };
}

export default LeaveService;
