import _DB from '../../../database/models';
import {
  iLeaveHistory,
  iLeaveHistoryLog,
  iLeaveBalance,
  iLeaveApproval,
  iLeaveOpeningBalance,
  iLeaveManualUpdatelog,
  iLeaveManualUpdateDraftData,
} from '../../../database/interface/leave.interface';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import { iUser } from '../../../database/interface/user.interface';

import { WhereOptions, Sequelize } from 'sequelize';
import { Query } from '@tms-workspace/apis-core';

const _user = _DB.User;
const _leaveBalance = _DB.LeaveBalance;
const _leaveHistory = _DB.LeaveHistory;
const _leaveHistoryLog = _DB.LeaveHistoryLog;
const _leaveSubject = _DB.LeaveSubject;
const _leaveApproval = _DB.LeaveApproval;
const _projectTeam = _DB.ProjectTeam;
const _leaveHistoryTransection = _DB.LeaveTransectionHistory;
const _leaveOpeningBalance = _DB.LeaveOpeningBalance;
const _leaveManualUpdateLog = _DB.LeaveManualUpdateLog;
const _leaveManualUpdateDraftData = _DB.LeaveManualUpdatesDraftData;
const _leaveHistoryLeaveType = _DB.LeaveHistoryLeaveType;

class LeaveManualUpdateService {
  public _getUserDataCount = async (query1: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const data = _user.count({
        where: query1,
      });

      resolve(data);
    });
  };

  public _getUserData = async (query: WhereOptions, query2: WhereOptions = {}, p = 0, l = 0, sortBy = 'first_name', orderBy = 'asc') => {
    return new Promise<iUser[]>((resolve) => {
      const { offset, limit, order } = Query.getQuery({
        page: p,
        limit: l,
        sortBy,
        orderBy,
      });

      const data = _user
        .findAll({
          where: query,
          attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
          include: [
            {
              as: 'leaveBalance',
              model: _leaveBalance,
            },
            {
              as: 'leaveOpeningClosingBalance',
              model: _leaveOpeningBalance,
            },
          ],
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          order,
          // group: ['leaveHistory.month'],
        })
        .then(async (res) => {
          return JSON.parse(JSON.stringify(res));
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

  public _getleaveBalance = async () => {
    return new Promise<iLeaveBalance[]>((resolve) => {
      const data = _leaveBalance
        .findAll({
          include: [
            {
              as: 'user',
              model: _user,
            },
          ],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });

      resolve(data);
    });
  };

  public _getleaveOpeningBalance = async () => {
    return new Promise<iLeaveBalance[]>((resolve) => {
      const data = _leaveOpeningBalance
        .findAll({
          include: [
            {
              as: 'user',
              model: _user,
            },
          ],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });

      resolve(data);
    });
  };

  public _getLeaveManualUpdateLogCount = async (query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const data = _leaveManualUpdateLog.count({ where: query });
      resolve(data);
    });
  };
  public _getLeaveManualUpdateLogList = async (query: WhereOptions, p = 0, l = 0, sortBy = 'month', orderBy = 'asc') => {
    return new Promise<iLeaveManualUpdatelog>((resolve) => {
      const { offset, limit, order } = Query.getQuery({
        page: p,
        limit: l,
        sortBy,
        orderBy,
      });

      const data = _leaveManualUpdateLog
        .findAll({
          where: query,
          include: [
            {
              as: 'createdBy',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
            {
              as: 'updatedBy',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
          ],
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

  public _getLeaveManualUpdateLog = async (query: WhereOptions) => {
    return new Promise<iLeaveManualUpdatelog>((resolve) => {
      const data = _leaveManualUpdateLog
        .findOne({
          where: query,
          include: [
            {
              as: 'createdBy',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
            {
              as: 'updatedBy',
              model: _user,
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

  public _getLeaveManualUpdateDraft = async (query: WhereOptions, p = 0, l = 0, sortBy = 'userDetails.first_name', orderBy = 'asc') => {
    return new Promise<iLeaveManualUpdateDraftData[]>((resolve) => {
      const { offset, limit, order } = Query.getQuery({
        page: p,
        limit: l,
        sortBy,
        orderBy,
      });

      const data = _leaveManualUpdateDraftData
        .findAll({
          where: query,
          include: [
            {
              as: 'userDetails',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
            {
              as: 'createdBy',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
            {
              as: 'updatedBy',
              model: _user,
              attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
            },
          ],
          // limit: limit > 0 ? limit : null,
          // offset: offset > 0 ? offset : null,
          // order,
          order: [['userDetails', 'first_name', `${orderBy}`]],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _createLeaveManualUpdateLog = async (leaveManualUpdatelogData: iLeaveManualUpdatelog) => {
    return new Promise<iLeaveManualUpdatelog>((resolve) => {
      const data = _leaveManualUpdateLog.create(leaveManualUpdatelogData).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });
      resolve(data);
    });
  };

  public _createLeaveManualUpdateDraftData = async (leaveManualUpdateDraftData: iLeaveManualUpdateDraftData[]) => {
    return new Promise<iLeaveManualUpdateDraftData[]>((resolve) => {
      const data = _leaveManualUpdateDraftData.bulkCreate(leaveManualUpdateDraftData).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });
      resolve(data);
    });
  };

  public _updateLeaveManualUpdateLog = async (leaveManualUpdatelogData: object, query: WhereOptions) => {
    return new Promise<iLeaveManualUpdatelog>((resolve) => {
      const data = _leaveManualUpdateLog
        .update(leaveManualUpdatelogData, {
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _updateLeaveManualUpdateDraftData = async (leaveManualUpdateDraftData: object[]) => {
    return new Promise<iLeaveManualUpdateDraftData>((resolve) => {
      const data = _leaveManualUpdateDraftData
        .bulkCreate(leaveManualUpdateDraftData, {
          updateOnDuplicate: [
            'id',
            'leave_manual_log_id',
            'year',
            'month',
            'user_id',
            'leave_type',
            'leave_opening',
            'leave_used',
            'leave_added',
            'leave_current',
            'comments',
            'created_by',
            'updated_by',
          ],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _updateLeaveOpeningData = async (LeaveClosingData: object, query: WhereOptions) => {
    console.log('_updateLeaveOpeningData', LeaveClosingData);
    return new Promise((resolve) => {
      const data = _leaveOpeningBalance.update(LeaveClosingData, {
        where: query,
      });

      resolve(data);
    });
  };

  public _createLeaveOpeningData = async (LeaveOpeningData: object) => {
    console.log('_updateLeaveOpeningData', LeaveOpeningData);
    return new Promise((resolve) => {
      const data = _leaveOpeningBalance.create(LeaveOpeningData);
      resolve(data);
    });
  };
}
export default LeaveManualUpdateService;
