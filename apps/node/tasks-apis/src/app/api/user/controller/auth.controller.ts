import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import * as CryptoJS from 'crypto-js';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import { developmentConfig } from '@tms-workspace/configurations';
import { Encryption } from '@tms-workspace/encryption';
import { iRequestWithUser, iUser, iUserLog } from '../../../database/interface/user.interface';
import UserService from '../services/user.service';
import UserLogService from '../services/user_log.service';

class AuthController {
  public UserService = new UserService();
  public UserLogService = new UserLogService();

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employee_id, password, ip } = req.headers;
      console.log("req >>>>>>>>>>", req);
      console.log("employee_id >>>>>>>>>>", employee_id);
      console.log("password >>>>>>>>>>", password);
      console.log("ip >>>>>>>>>>", ip);


      if (!employee_id || !password) {
        return res.status(404).json(APIResponseFormat._ResMissingRequiredField());
      }

      const employee_id_decrypt = Encryption._doDecrypt(employee_id as string);
      const password_decrypt = Encryption._doDecrypt(password as string);
      const hasPassword = CryptoJS.MD5(password_decrypt);

      // Check user exits or not
      let data: iUser = await this.UserService._login(employee_id_decrypt as string);

      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      if (hasPassword.toString() !== data.password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: 'The username or password you provided is incorrect.',
        });
      }

      data = JSON.parse(JSON.stringify(data));

      // User should be logged out to do login
      const previousSession = await this.UserLogService._getSingleLog({
        user_id: data.id,
        action_end_date: { [Op.eq]: null },
        action: 'LOGIN',
      });

      if (previousSession) {
        return res.status(400).json(APIResponseFormat._ResBadRequest('User already loggedIn'));
      }

      // Generate Access Token
      const payload = {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        isAdmin: data?.user_with_role?.user_role?.title == 'Super Admin' ? true : false,
      };

      const accessToken: string = jwt.sign(payload, developmentConfig.default.SECRET_KEY, {
        expiresIn: developmentConfig.default.ACCESS_TOKEN_EXPIRES_IN,
        algorithm: developmentConfig.default.JWT_ALGORITHM,
      });

      // Get Today's Remaining Hours = Login Time - Break Time
      const today = moment().format('YYYY-MM-DD');
      let todayRemainingTime = developmentConfig.default.DAILY_WORKING_MINUTES;
      const tQuery = {
        user_id: data.id,
        action_start_date: { [Op.gte]: `${today} 00:00:00` },
        action_end_date: { [Op.lte]: `${today} 23:59:59` },
      };
      let todaysLoginLog: iUserLog[] = await this.UserLogService._getAllLog(tQuery);
      todaysLoginLog = JSON.parse(JSON.stringify(todaysLoginLog));
      todaysLoginLog.forEach((el) => {
        if (el.action === 'BREAK_TIME') {
          todayRemainingTime += moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        } else {
          todayRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        }
        todayRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
      });

      const breakQuery = {
        user_id: data.id,
        action: { [Op.like]: 'BREAK_TIME' },
        action_start_date: { [Op.gte]: `${today} 00:00:00` },
        action_end_date: { [Op.lte]: `${today} 23:59:59` },
      };
      let todaysBreakLog: iUserLog[] = await this.UserLogService._getAllLog(breakQuery);
      todaysBreakLog = JSON.parse(JSON.stringify(todaysBreakLog));
      todaysBreakLog.forEach((el) => {
        todayRemainingTime += moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
      });

      // Get Weekly Remaining Hours = Login Time - Break Time
      const startWeek = moment().weekday(1).format('YYYY-MM-DD');
      const endWeek = moment().weekday(5).format('YYYY-MM-DD');
      let weeklyRemainingTime = developmentConfig.default.WEEKLY_WORKING_MINUTES;
      const wQuery = {
        user_id: data.id,
        action_start_date: { [Op.gte]: `${startWeek} 00:00:00` },
        action_end_date: { [Op.lte]: `${endWeek} 23:59:00` },
      };
      let weeklyLoginLog: iUserLog[] = await this.UserLogService._getAllLog(wQuery);
      weeklyLoginLog = JSON.parse(JSON.stringify(weeklyLoginLog));
      weeklyLoginLog.forEach((el) => {
        if (el.action === 'BREAK_TIME') {
          weeklyRemainingTime += moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        } else {
          weeklyRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        }
        weeklyRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
      });

      const weeklyBreakQuery = {
        user_id: data.id,
        action: { [Op.like]: 'BREAK_TIME' },
        action_start_date: { [Op.gte]: `${startWeek} 00:00:00` },
        action_end_date: { [Op.lte]: `${endWeek} 23:59:59` },
      };
      let weeklyBreakLog: iUserLog[] = await this.UserLogService._getAllLog(weeklyBreakQuery);
      weeklyBreakLog = JSON.parse(JSON.stringify(weeklyBreakLog));
      weeklyBreakLog.forEach((el) => {
        weeklyRemainingTime += moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
      });

      // Add new Login Log
      const logData = await this.UserLogService._createLog({
        action: 'LOGIN',
        action_start_date: new Date(),
        user_id: data.id,
        login_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
      });

      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Login Log'));
      }

      return res.status(200).json(
        APIResponseFormat._ResDataFound({
          accessToken,
          userData: {
            user_id: data.id,
            user_firstname: data.first_name,
            user_lastname: data.last_name,
            user_designation: data.designation,
            user_image: data.employee_image,
            todayRemainingTime,
            weeklyRemainingTime,
          },
          permission: data.user_with_role?.user_role?.permission || null,
        })
      );
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public logout = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { ip } = req.headers;

      if (!req.user.id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('User Id'));
      }

      const data = {
        action_end_date: new Date(),
        logout_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
      };
      const query = {
        user_id: req.user.id,
        action_end_date: null,
      };
      const updateUserLog = await this.UserLogService._updateLog(data, query);

      if (!updateUserLog) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Logout Data'));
      }

      // Add new Logout Log
      const logData = await this.UserLogService._createLog({
        action: 'LOGOUT',
        action_start_date: new Date(),
        action_end_date: new Date(),
        user_id: req.user.id,
        login_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
        logout_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
      });

      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Logout Log'));
      }

      return res.status(200).json(APIResponseFormat._ResLogoutSuccess());
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public systemLogout = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { ip } = req.headers;

      if (!req.user.id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('User Id'));
      }

      const data = {
        action_end_date: new Date(),
        logout_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
      };
      const query = {
        user_id: req.user.id,
        action_end_date: null,
      };
      const updateUserLog = await this.UserLogService._updateLog(data, query);

      if (!updateUserLog) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Logout Data'));
      }

      // Add new Logout Log
      const logData = await this.UserLogService._createLog({
        action: 'SYSTEM_LOGOUT',
        action_start_date: new Date(),
        action_end_date: new Date(),
        user_id: req.user.id,
        login_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
        logout_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
      });

      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Logout Log'));
      }

      return res.status(200).json(APIResponseFormat._ResLogoutSuccess());
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public systemAutoLogout = async () => {
    try {
      const query = {
        action_end_date: null,
      };
      const userData = await this.UserLogService._getNotLogoutUser(query);

      const loginLogUpdate = userData.map((userLog) => {
        return { ...userLog, action_end_date: new Date(), logout_capture_data: userLog.login_capture_data };
      });

      const LogoutLogCreate = loginLogUpdate.map((newUserlog) => {
        const temp = Object.assign({}, newUserlog);

        delete temp.id;
        return {
          ...temp,
          action: 'LOGOUT',
          action_start_date: new Date(),
          action_end_date: new Date(),
        };
      });

      const LogData = [...loginLogUpdate, ...LogoutLogCreate];

      const UpdateNotLogoutLogData = await this.UserLogService._updateNotLogoutLog(LogData);
    } catch (error) {
      console.log('🚀 ~ file: auth.controller.ts:281 ~ AuthController ~ systemAutoLogout= ~ error:', error);
    }
  };

  public break = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { action, ip } = req.headers;
      if (!req.user.id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('User Id'));
      }

      if (!['BREAK_TIME', 'BACK_FROM_BREAK'].includes(action as string)) {
        return res.status(400).json(APIResponseFormat._ResBadRequest('Invalid action detected. Please try again or contact the administrator.'));
      }

      // Update Last Log
      const data = {
        action_end_date: new Date(),
        logout_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
      };
      const query = {
        user_id: req.user.id,
        action_end_date: null,
      };
      const updateUserLog = await this.UserLogService._updateLog(data, query);

      if (!updateUserLog) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Logout Data'));
      }

      // Add new Break Log
      const logData = await this.UserLogService._createLog({
        action,
        action_start_date: new Date(),
        user_id: req.user.id,
        login_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
      });

      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Break Log'));
      }

      return res.status(200).json(APIResponseFormat._ResDataFound());
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default AuthController;
