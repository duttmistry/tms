import { APIResponseFormat } from '@tms-workspace/apis-core';
import { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import { MyEnum } from '../../database/interface/leave.interface';
import * as Preference from '@tms-workspace/preference';
import _DB from '../../database/models';
import { eventEmitterTask } from '@tms-workspace/preference';

const user = _DB.User;
const user_log = _DB.UserLog;

class AutoLogoutCrons {
  public systemAutoLogout = async () => {
    try {
      const userData = await user_log
        .findAll({
          where: {
            action_end_date: null,
            // user_id: 222,
          },
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });

      const loginLogUpdate = await Promise.all(
        userData.map((userLog) => {
          return { ...userLog, action_end_date: new Date(), logout_capture_data: userLog.login_capture_data };
        })
      );

      console.log('loginLogUpdate', loginLogUpdate);

      // const LogoutLogCreate = loginLogUpdate.map((newUserlog) => {
      //   const temp = Object.assign({}, newUserlog);

      //   delete temp.id;
      //   return {
      //     ...temp,
      //     action: 'LOGOUT',
      //     action_start_date: new Date(),
      //     action_end_date: new Date(),
      //   };
      // });

      const logoutResponse = await user_log.bulkCreate(loginLogUpdate, {
        updateOnDuplicate: ['id', 'action', 'action_start_date', 'action_end_date', 'user_id', 'login_capture_data', 'logout_capture_data'],
      });

      if (logoutResponse) {
        userData.forEach(async (userdata) => {
          await user.update(
            { active_sessionid: '' },
            {
              where: { id: userdata.user_id },
            }
          );
          const body = {
            action: 'LOGOUT',
            action_start_date: new Date(),
            action_end_date: new Date(),
            user_id:userdata.user_id,
            action_by: null,
          };
          user_log.create(body);
          // await this.UserService._updateUserSession("", Number(id));
          eventEmitterTask.default.emit('log_Out_task_time_stop', userdata.user_id);
          const userDetails = await Preference._GetUserDetails(userdata.id);

          // remove the deviceToken from userDetails and update the deviceTokenarray
          if (userDetails) {
            userDetails.userDeviceToken = [];
            await Preference._UpdateUser(userdata.id, userDetails);
          }
        });
      }
    } catch (error) {
      console.log('🚀 ~ file: auth.controller.ts:281 ~ AuthController ~ systemAutoLogout= ~ error:', error);
    }
  };
}
export default AutoLogoutCrons;
