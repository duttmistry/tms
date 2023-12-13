import { iLeaveHistory, iLeaveHistoryLog, iLeaveBalance, iLeaveApproval, iLeaveOpeningBalance } from '../../../database/interface/leave.interface';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import { iUser } from '../../../database/interface/user.interface';
import { WhereOptions } from 'sequelize';
import db from '../../../database/models';
import { Query } from '@tms-workspace/apis-core';

const _user = db.User;
const _leaveBalance = db.LeaveBalance;
const _leaveHistory = db.LeaveHistory;
const _leaveHistoryLog = db.LeaveHistoryLog;
const _leaveSubject = db.LeaveSubject;
const _leaveApproval = db.LeaveApproval;
const _projectTeam = db.ProjectTeam;
const _leaveHistoryTransection = db.LeaveTransectionHistory;
const _leaveOpeningBalance = db.LeaveOpeningBalance;
const _leaveHistoryLeaveType = db.LeaveHistoryLeaveType;
const _siteSetting = db.SiteSetting;

class LeaveBalanceService {
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

  public _getleaveOpeningBalance = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    return new Promise<iLeaveBalance[]>((resolve) => {
      const { offset, limit, order } = Query.getQuery({
        page: p,
        limit: l,
        sortBy,
        orderBy,
      });
      const data = _leaveOpeningBalance
        .findAll({
          // include: [
          //   {
          //     as: 'user',
          //     model: _user,
          //   },
          // ],
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

  // UPDATE LEAVE Balance
  public _updateIncreaseLeaveBalance = async (leaveBalance, query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _leaveBalance.increment(leaveBalance, {
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
          include: [
            {
              as: 'leaveBalance',
              model: _leaveBalance,
              attributes: ['id', 'user_id', 'leave_type', 'current_balance', 'applied_balance', 'reserved_balance'],
            },
          ],
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

  public _getAllUserWithLeaveBalance = async () => {
    return new Promise<iUser[]>((resolve) => {
      const data = _user
        .findAll({
          include: [
            {
              as: 'leaveBalance',
              model: _leaveBalance,
              attributes: ['id', 'user_id', 'leave_type', 'current_balance', 'applied_balance', 'reserved_balance'],
            },
          ],
          order: [['first_name', 'asc']],
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
        updateOnDuplicate: ['id', 'user_id', 'leave_type', 'opening_balance', 'closing_balance', 'month'],
      });
      resolve(data);
    });
  };

  public _getLeaveHistoryMonthCount = async (query: WhereOptions) => {
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

  public _getLeaveResponsiblePersons = async () => {
    return new Promise<number[]>((resolve, reject) => {
      const leaveResponsiblePerson = _siteSetting
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
}

export default LeaveBalanceService;
