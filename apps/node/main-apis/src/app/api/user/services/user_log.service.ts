import db from '../../../database/models';
import UserLogModel from '../../../database/models/user_log.model';
import { Sequelize, WhereOptions } from 'sequelize';
import { iUserLog } from '../../../database/interface/user.interface';

// initialize model & db connection
const _DB = {
  UserLog: UserLogModel(db.sequelize),
  sequelize: db.sequelize,
  Sequelize: db.Sequelize,
};

const user_log = _DB.UserLog;

class UserLogService {
  // Create Logs
  public _createLog = async (body) => {
    return new Promise<iUserLog>((resolve, reject) => {
      const data = user_log.create(body);
      resolve(data);
    });
  };

  // Update Logs
  public _updateLog = async (body, query: WhereOptions) => {
    return new Promise((resolve, reject) => {
      const data = user_log.update(body, { where: query });
      resolve(data);
    });
  };

  // Get All Logs
  public _getAllLog = async (query: WhereOptions, sortBy = 'id', orderBy = 'asc') => {
    return new Promise<iUserLog[]>((resolve, reject) => {
      const data = user_log.findAll({
        where: query,
        attributes: ['action', 'action_start_date', 'action_end_date', 'sessionid'],
        order: [[sortBy, orderBy]],
      });
      resolve(data);
    });
  };

  // Get Single Logs
  public _getSingleLog = async (query: WhereOptions) => {
    return new Promise<iUserLog>((resolve, reject) => {
      const data = user_log
        .findOne({
          where: query,
          attributes: ['action', 'action_start_date', 'action_end_date', 'sessionid'],
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  public _getNotLogoutUser = async (query: WhereOptions) => {
    return new Promise<iUserLog[]>((resolve, reject) => {
      const data = user_log
        .findAll({
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _updateNotLogoutLog = async (logData: iUserLog[]) => {
    return new Promise<iUserLog[]>((resolve, reject) => {
      const data = user_log.bulkCreate(logData, {
        updateOnDuplicate: ['id', 'action', 'action_start_date', 'action_end_date', 'user_id', 'login_capture_data', 'logout_capture_data'],
      });
      resolve(data);
    });
  };
}

export default UserLogService;
