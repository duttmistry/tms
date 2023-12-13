import { Op, WhereOptions } from 'sequelize';

import { iUser, iUserLog } from '../database/interface/user.interface';
import moment from 'moment';
import _DB from '../database/models';

const _user = _DB.User;
const _userLog = _DB.UserLog;

class AuthMiddlewareService {
  // GET SINGLE Site Setting
  public checkIsLogout = async (user_id: number) => {
    const today = moment().format('YYYY-MM-DD');

    return new Promise((resolve, reject) => {
      const data = _userLog
        .findOne({
          where: {
            user_id,
          },
          order: [['created_at', 'DESC']],
        })
        .then((res) => {
          console.log('res');
          const result = JSON.parse(JSON.stringify(res));

          if (result.action === 'LOGOUT') {
            return true;
          } else {
            return false;
          }
          //  action: 'LOGOUT',
          //   action_start_date: { [Op.gte]: `${today} 00:00:00` },
          //   action_end_date: {
          //     [Op.or]: [{ [Op.lte]: `${today} 23:59:59` }],
          //   },
        });
      resolve(data);
    });
  };

  // GET SINGLE Site Setting
  public checkActiveSession = async (user_id: number, sessionId: string) => {
    return new Promise((resolve, reject) => {
      const data = _user
        .findOne({
          where: {
            id: user_id,
          },
        })
        .then((res) => {
          const result = JSON.parse(JSON.stringify(res));

          // console.log(result);

          // console.log('sessionId', sessionId);
          // console.log('result.active_sessionid', result.active_sessionid);

          if (result.active_sessionid === sessionId || sessionId === undefined) {
            return true;
          } else {
            return false;
          }
        });
      resolve(data);
    });
  };

  public _createLog = async (body) => {
    return new Promise<iUserLog>((resolve, reject) => {
      const data = _userLog.create(body);
      resolve(data);
    });
  };

  // Update Logs
  public _updateLog = async (body, query: WhereOptions) => {
    return new Promise((resolve, reject) => {
      const data = _userLog.update(body, { where: query });
      resolve(data);
    });
  };

  public _getSingleLog = async (query: WhereOptions) => {
    return new Promise<iUserLog>((resolve, reject) => {
      const data = _userLog
        .findOne({
          where: query,
          attributes: ['action', 'action_start_date', 'action_end_date', 'sessionid'],
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };
}

export default AuthMiddlewareService;
