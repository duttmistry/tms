import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Op, Sequelize, literal } from 'sequelize';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import * as CryptoJS from 'crypto-js';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import { developmentConfig } from '@tms-workspace/configurations';
import { Encryption } from '@tms-workspace/encryption';
import { iRequestWithUser, iUser, iUserLog } from '../../../database/interface/user.interface';
import UserService from '../services/user.service';
import UserLogService from '../services/user_log.service';
import SiteSettingService from '../../site_setting/services/site_setting.service';
import { eventEmitterTask } from '@tms-workspace/preference';
import * as config from '@uss/site-settings';
import * as Preference from '@tms-workspace/preference';
import { log } from 'console';

class AuthController {
  public UserService = new UserService();
  public UserLogService = new UserLogService();
  public SiteSettingService = new SiteSettingService();

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employee_id, password } = req.headers;
      const { reason, deviceInformation } = req.body;
      let remortIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress?.replace('::ffff:', '') || '';
      console.log('Remote Addr: ' + remortIp, 'XFWD :' + req.headers['x-forwarded-for']);
      remortIp = JSON.parse(JSON.stringify(remortIp));
      //console.log(req.connection, 'ip >>>>>>>>>>', remortIp);

      const currentDateTime = moment().format('h:mm A') as string;
      const currentDate = moment().format('YYYY-MM-DD');
      if (!employee_id || !password) {
        return res.status(404).json(APIResponseFormat._ResMissingRequiredField());
      }
      let ipData = await config._GetByName(`Office Ip`);
      ipData = JSON.parse(JSON.stringify(ipData));

      let whitelistedIPData = await config._GetByName(`Whitelisted IP`);
      whitelistedIPData = JSON.parse(JSON.stringify(whitelistedIPData));

      const isWfo = await this.UserService._areIPsEqual(ipData?.data?.value, remortIp);
      const isvaildIp = whitelistedIPData?.data?.value?.fixed?.indexOf(`${remortIp}`) !== -1 || false;
      console.log(
        remortIp,
        'remortIp',
        whitelistedIPData?.data?.value,
        'whitelistedIPData?.data?.value',
        whitelistedIPData?.data?.value?.fixed,
        'whitelistedIPData?.data?.value?.fixed'
      );

      if (!isvaildIp) {
        let validPattern = false;
        const patterns = whitelistedIPData?.data?.value?.pattern;
        if (patterns) {
          for (const element of patterns) {
            if (element === 'X.X.X.X') {
              validPattern = true;
              break;
            }
            validPattern = await this.UserService._areIPsEqual(element, remortIp);
            if (validPattern) {
              break; // Exit the loop if a valid pattern is found
            }
          }
        }
        if (!validPattern) {
          return res.status(400).json({
            success: false,
            status: 400,
            message: 'Not login with proper ip',
          });
        }
      }

      const connectionOldIp = req.connection.remoteAddress;
      const connectionIp = req.connection.remoteAddress?.replace('::ffff:', '') || '';
      const employee_id_decrypt = Encryption._doDecrypt(employee_id as string);
      const password_decrypt = Encryption._doDecrypt(password as string);
      const hasPassword = CryptoJS.MD5(password_decrypt);

      // Check user exits or not
      let user_data = (await this.UserService._login(employee_id_decrypt as string)) as iUser;
      user_data = JSON.parse(JSON.stringify(user_data));
      const data = user_data && user_data[0];
      if (!data) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: 'The username or password you provided is incorrect.',
        });
      }

      if (hasPassword.toString() !== data.password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: 'The username or password you provided is incorrect.',
        });
      }

      // Check Late login case

      const getLateArrivalTimeValue = await this.SiteSettingService._getSingleData({ name: { [Op.like]: 'Late Arrival Threshold' } });
      const lateArrivalTime = moment(getLateArrivalTimeValue.value, 'HH:mm A');
      const currentTime = moment(currentDateTime, 'HH:mm A');

      const getTodayLoginLog: iUserLog[] = await this.UserLogService._getAllLog({
        user_id: data.id,
        action_start_date: { [Op.gte]: `${currentDate} 00:00:00` },
        action_end_date: {
          [Op.or]: [{ [Op.lte]: `${currentDate} 23:59:59` }, { [Op.eq]: null }],
        },
        action: 'LOGIN',
      });

      // Compare if currentTime is after otherTime
      if (currentTime.isAfter(lateArrivalTime) && getTodayLoginLog.length == 0 && reason === '') {
        //console.log('Current time is after other time');

        return res.status(200).json(
          APIResponseFormat._ResLateLogin({
            lateArrival: true,
          })
        );
      }

      //console.log('currentTime', currentTime);
      //console.log('lateArrivalTime', lateArrivalTime);

      // data = JSON.parse(JSON.stringify(data));

      // User should be logged out to do login

      // Disable in Development Phase : 25/04/2023

      const previousSession = await this.UserLogService._getSingleLog({
        user_id: data.id,
        action_end_date: { [Op.eq]: null },
        sessionid: { [Op.eq]: data.active_sessionid },
      });

      if (previousSession) {
        const updateLogData = {
          action_end_date: new Date(),
          logout_capture_data: {
            ip: remortIp || null,
            connectionOldIp,
            isWfo,
            browser_client: deviceInformation,
          },
          action_by: data.id,
          reason: null,
        };
        const query = {
          user_id: data.id,
          action_end_date: null,
          sessionid: previousSession.sessionid,
        };
        const updateUserLog = await this.UserLogService._updateLog(updateLogData, query);

        if (!updateUserLog) {
          return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Logout Data'));
        }

        // Add new Logout Log
        const logData = await this.UserLogService._createLog({
          action: 'LOGOUT',
          action_start_date: new Date(),
          action_end_date: new Date(),
          user_id: data.id,
          login_capture_data: {
            ip: remortIp || null,
            connectionOldIp,
            isWfo,
            browser_client: deviceInformation,
          },
          logout_capture_data: {
            ip: remortIp || null,
            connectionOldIp,
            isWfo,
            browser_client: deviceInformation,
          },
          sessionid: previousSession.sessionid,
          action_by: data.id,
          reason: null,
        });

        if (!logData) {
          return res.status(500).json(APIResponseFormat._ResDataNotCreated('Logout Log'));
        }

        eventEmitterTask.default.emit('log_Out_task_time_stop', data.id);

        // remove the deviceToken from userDetails and update the deviceTokenarray
        // if (userDetails) {
        //   userDetails.userDeviceToken = [];
        //   const updateUser = await Preference._UpdateUser(data.id, userDetails);
        //   if (!updateUser) {
        //     return res.status(500).json(APIResponseFormat._ResDataFound('Logout Data , and not updated'));
        //   }
        // } else {
        //   return res.status(200).json(APIResponseFormat._ResDataFound('Logout Data'));
        // }

        // return res.status(400).json(APIResponseFormat._ResBadRequest('User already loggedIn'));
      }

      // Create Unique Session ID

      const sessionId = uuidv4() as string;
      const updateUserActiveSession = await this.UserService._updateUserSession(sessionId, data.id);

      if (!updateUserActiveSession) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Not Update Active Session Id '));
      }

      // Generate Access Token
      const payload = {
        id: data.id,
        first_name: data.first_name,
        user_image: data.employee_image,
        last_name: data.last_name,
        isAdmin: data?.user_role_title == 'Super Admin' ? true : false,
      };

      const accessToken: string = jwt.sign(payload, developmentConfig.default.SECRET_KEY, {
        expiresIn: developmentConfig.default.ACCESS_TOKEN_EXPIRES_IN,
        algorithm: developmentConfig.default.JWT_ALGORITHM,
      });

      // Get Today's Remaining Hours = Login Time - Break Time
      const today = moment().format('YYYY-MM-DD');

      // Get Weekly Remaining Hours = Login Time - Break Time
      const startWeek = moment().weekday(1).format('YYYY-MM-DD');
      const endWeek = moment().weekday(5).format('YYYY-MM-DD');

      const getWeeklyHoliday = await this.UserService._getWeeklyHoliday({
        [Op.and]: [literal(`DATE(holiday_date) BETWEEN '${startWeek}' AND '${endWeek}'`), { isHoliday: true }],
      });

      const WeeklyHolidayHour = getWeeklyHoliday.length * developmentConfig.default.DAILY_WORKING_MINUTES;

      const getWeeklyUserLeave = await this.UserService._getWeeklyLeaveOfUser({
        [Op.and]: [
          {
            [Op.or]: [
              {
                [Op.or]: [
                  {
                    [Op.and]: [
                      {
                        [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                          [Op.gte]: new Date(startWeek).toISOString().slice(0, 10),
                          // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                        }),
                      },
                      {
                        [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                          [Op.lte]: new Date(endWeek).toISOString().slice(0, 10),
                          // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                        }),
                      },
                    ],
                  },
                  {
                    [Op.and]: [
                      {
                        [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                          [Op.lte]: new Date(endWeek).toISOString().slice(0, 10),
                          // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                        }),
                      },
                      {
                        [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                          [Op.gte]: new Date(startWeek).toISOString().slice(0, 10),
                          // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                        }),
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            status: 'APPROVED',
          },
          {
            user_id: data.id,
          },
        ],
      });

      const isLeaveAvailableToday = getWeeklyUserLeave.filter((leave) => {
        const fromDate = moment(leave.from_date).format('YYYY-MM-DD');
        const toDate = moment(leave.to_date).format('YYYY-MM-DD');

        return today >= fromDate && today <= toDate;
      });

      const DailyLeaveHours = await isLeaveAvailableToday.reduce((acc, el) => {
        const fromDate = moment(el.from_date).format('YYYY-MM-DD');
        const toDate = moment(el.to_date).format('YYYY-MM-DD');
        let betweenDateinc = null;

        if (!moment(el.from_date).isSame(moment(el.to_date))) {
          do {
            betweenDateinc = betweenDateinc ? betweenDateinc : moment(el.from_date);
            betweenDateinc = betweenDateinc.clone().add(1, 'days');
            betweenDateinc = betweenDateinc.startOf('day');

            if (betweenDateinc.isBetween(moment(startWeek).startOf('day'), moment(endWeek).startOf('day'), undefined, '[]')) {
              if (betweenDateinc.isSame(moment(el.from_date)) && el.leave_from_slot === 'FD') {
                console.log('elFD NOT SAME DAY FROM DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }

              if (betweenDateinc.isSame(moment(el.from_date)) && el.leave_from_slot !== 'FD') {
                console.log('el HD NOT SAME DAY FROM DATE HF', el);
                acc += developmentConfig.default.HALF_WORKING_MINITES;
              }

              if (betweenDateinc.isSame(moment(el.to_date)) && el.leave_to_slot === 'FD') {
                console.log('elFD NOT SAME DAY TO DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }

              if (betweenDateinc.isSame(moment(el.to_date)) && el.leave_to_slot !== 'FD') {
                console.log('el HD NOT SAME DAY TO DATE HF', el);
                acc += developmentConfig.default.HALF_WORKING_MINITES;
              }

              if (betweenDateinc.isBetween(moment(el.from_date), moment(el.to_date))) {
                console.log('elFD NOT SAME DAY BETWEEN DATE FD', el);
                acc;
              }
            }
          } while (!betweenDateinc.isSame(moment(el.to_date).startOf('day')));
        } else {
          if (fromDate === toDate && fromDate === today && el.leave_from_slot === 'FD') {
            acc += developmentConfig.default.DAILY_WORKING_MINUTES;
          }

          if (fromDate === toDate && fromDate === today && el.leave_from_slot !== 'FD') {
            acc += developmentConfig.default.HALF_WORKING_MINITES;
          }
        }

        // if (today > fromDate && today < toDate) {
        //   acc += developmentConfig.default.DAILY_WORKING_MINUTES;
        // }

        return acc;
      }, 0);

      let todayRemainingTime = developmentConfig.default.DAILY_WORKING_MINUTES - DailyLeaveHours;
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

      //console.log('getWeeklyUserLeave', getWeeklyUserLeave);

      const LeaveHours = await getWeeklyUserLeave.reduce((acc, el) => {
        //console.log('el', el);
        const fromDate = moment(el.from_date).format('YYYY-MM-DD');
        const toDate = moment(el.to_date).format('YYYY-MM-DD');
        let betweenDateinc = null;

        if (!moment(el.from_date).isSame(moment(el.to_date))) {
          do {
            betweenDateinc = betweenDateinc ? betweenDateinc : moment(el.from_date);
            betweenDateinc = betweenDateinc.clone().add(1, 'days');
            betweenDateinc = betweenDateinc.startOf('day');

            if (betweenDateinc.isBetween(moment(startWeek).startOf('day'), moment(endWeek).startOf('day'), undefined, '[]')) {
              if (
                betweenDateinc.isSame(moment(el.from_date)) &&
                el.leave_from_slot === 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY FROM DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }

              if (
                betweenDateinc.isSame(moment(el.from_date)) &&
                el.leave_from_slot !== 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('el HD NOT SAME DAY FROM DATE HF', el);
                acc += developmentConfig.default.HALF_WORKING_MINITES;
              }

              if (
                betweenDateinc.isSame(moment(el.to_date)) &&
                el.leave_to_slot === 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY TO DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }

              if (
                betweenDateinc.isSame(moment(el.to_date)) &&
                el.leave_to_slot !== 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('el HD NOT SAME DAY TO DATE HF', el);
                acc += developmentConfig.default.HALF_WORKING_MINITES;
              }

              if (
                betweenDateinc.isBetween(moment(el.from_date), moment(el.to_date)) &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY BETWEEN DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }
            }
          } while (!betweenDateinc.isSame(moment(el.to_date).startOf('day')));
        } else {
          if (fromDate === toDate && fromDate === today && el.leave_from_slot === 'FD') {
            acc += developmentConfig.default.DAILY_WORKING_MINUTES;
          }

          if (fromDate === toDate && fromDate === today && el.leave_from_slot !== 'FD') {
            acc += developmentConfig.default.HALF_WORKING_MINITES;
          }
          if (fromDate === toDate && fromDate != today && el.leave_from_slot === 'FD') {
            //console.log('el FD SAME DAY', el);
            acc += developmentConfig.default.DAILY_WORKING_MINUTES;
          }

          if (fromDate === toDate && fromDate != today && el.leave_from_slot !== 'FD') {
            //console.log('el HD SAME DAY', el);
            acc += developmentConfig.default.HALF_WORKING_MINITES;
          }
        }

        // if (today > fromDate && today < toDate) {
        //   acc += developmentConfig.default.DAILY_WORKING_MINUTES;
        // }
        return acc;
      }, 0);

      //console.log('LeaveHours', LeaveHours);

      let weeklyRemainingTime = developmentConfig.default.WEEKLY_WORKING_MINUTES - LeaveHours - WeeklyHolidayHour;
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
          ip: remortIp || null,
          connectionOldIp,
          isWfo,
          browser_client: deviceInformation,
        },
        sessionid: sessionId,
        action_by: data.id,
        reason: reason ? reason : null,
      });

      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Login Log'));
      }

      let preference = true;
      const userDetails = await Preference._GetUserDetails(data.id);

      if(!userDetails){
        preference = false;
      }

      return res.status(200).json(
        APIResponseFormat._ResDataFound({
          preference,
          sessionId,
          accessToken,
          isWfo,
          userData: {
            user_id: data.id,
            user_firstname: data.first_name,
            user_lastname: data.last_name,
            user_designation: data.designation,
            user_image: data.employee_image,
            user_role: data?.user_role_title,
            todayRemainingTime,
            weeklyRemainingTime,
          },
          reporer: data.reporter ? true : false,
          permission: data.user_role_permission || null,
          previousSession: previousSession ? 'User already loggedIn' : null,
        })
      );
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public logout = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { ip, sessionid } = req.headers;

      if (!req.user.id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('User Id'));
      }

      const data = {
        action_end_date: new Date(),
        logout_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
        action_by: req.user.id,
        reason: null,
      };
      const query = {
        user_id: req.user.id,
        action_end_date: null,
        sessionid,
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
        sessionid,
        action_by: req.user.id,
        reason: null,
      });

      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Logout Log'));
      }

      const userDetails = await Preference._GetUserDetails(req.user.id);
      eventEmitterTask.default.emit('log_Out_task_time_stop', req.user.id);
      // remove the deviceToken from userDetails and update the deviceTokenarray
      if (userDetails) {
        userDetails.userDeviceToken = [];
        const updateUser = await Preference._UpdateUser(req.user.id, userDetails);
        if (updateUser) {
          return res.status(200).json(APIResponseFormat._ResDataFound('Logout Data'));
        } else {
          return res.status(500).json(APIResponseFormat._ResDataFound('Logout Data , and not updated'));
        }
      } else {
        return res.status(200).json(APIResponseFormat._ResDataFound('Logout Data'));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public memberLogout = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { ip, id, active_sessionid } = req.headers;
      if (!id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('User Id'));
      }

      const data = {
        action_end_date: new Date(),
        logout_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
        action_by: req.user.id,
        reason: null,
      };

      const query = {
        user_id: id,
        action_end_date: null,
        sessionid: active_sessionid,
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
        user_id: id,
        login_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
        logout_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
        sessionid: active_sessionid,
        action_by: req.user.id,
        reason: null,
      });

      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Logout Log'));
      }

      const userDetails = await Preference._GetUserDetails(id);
      eventEmitterTask.default.emit('log_Out_task_time_stop', id);
      // remove the deviceToken from userDetails and update the deviceTokenarray
      if (userDetails) {
        await this.UserService._updateUserSession('', Number(id));
        userDetails.userDeviceToken = [];
        const updateUser = await Preference._UpdateUser(id, userDetails);
        if (updateUser) {
          return res.status(200).json(APIResponseFormat._ResDataFound('Logout Data'));
        } else {
          return res.status(500).json(APIResponseFormat._ResDataFound('Logout Data , and not updated'));
        }
      } else {
        return res.status(200).json(APIResponseFormat._ResDataFound('Logout Data'));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getDeviceToken = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const { userDeviceToken } = req.body;

      // if (!userDeviceToken) {
      //   return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Device Token'));
      // }

      // get email of user from user id
      const userEmail = await this.UserService._getUserEmail(user.id);

      const userNotificationLog = await Preference._createUserNotificationLog('' + user.id);

      const userDetails = await Preference._GetUserDetails(user.id);

      if (!userDetails) {
        return res.status(200).json(APIResponseFormat._ResPreferenceNotFound({ key: 'User Details not found', preference: false }));
      } else {
        const checkDeviceTokenIsExist = userDetails.userDeviceToken.find((el) => el === userDeviceToken);
        if (!checkDeviceTokenIsExist) {
          if (userDeviceToken !== null && userDeviceToken !== undefined && userDeviceToken !== '') {
            userDetails.userDeviceToken.push(userDeviceToken);
          }
          const updatedUser = await Preference._UpdateUser(user.id, userDetails);
          res.status(200).json(APIResponseFormat._ResDataFound(updatedUser));
        } else {
          res.status(200).json(APIResponseFormat._ResDataFound(userDetails));
        }
      }
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
        action_by: req.user.id,
        reason: null,
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
        action_by: req.user.id,
        reason: null,
      });
      eventEmitterTask.default.emit('log_Out_task_time_stop', req.user.id);
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
        eventEmitterTask.default.emit('log_Out_task_time_stop', userLog.user_id);
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
      //console.log('🚀 ~ file: auth.controller.ts:281 ~ AuthController ~ systemAutoLogout= ~ error:', error);
    }
  };

  public break = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { action, ip, id, sessionid } = req.headers;

      const userId = id ? id : req.user.id;

      if (!userId) {
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
        action_by: userId,
        reason: null,
      };
      const query = {
        user_id: userId,
        action_end_date: null,
        sessionid,
      };
      const updateUserLog = await this.UserLogService._updateLog(data, query);

      if (!updateUserLog) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Logout Data'));
      }

      // Add new Break Log
      const logData = await this.UserLogService._createLog({
        action,
        action_start_date: new Date(),
        user_id: userId,
        login_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
        sessionid,
        action_by: userId,
        reason: null,
      });

      //console.log('action', action);

      let status = null;

      if (action === 'BREAK_TIME') {
        status = true;
      } else {
        status = false;
      }

      eventEmitterTask.default.emit('log_Out_task_time_stop', userId);
      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Break Log'));
      }

      return res.status(200).json(APIResponseFormat._ResDataFound({ status }));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public memberBreak = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { action, ip, id, active_sessionid } = req.headers;

      const userId = id ? id : req.user.id;

      if (!userId) {
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
        action_by: req.user.id,
      };
      const query = {
        user_id: userId,
        action_end_date: null,
        sessionid: active_sessionid,
      };
      const updateUserLog = await this.UserLogService._updateLog(data, query);

      if (!updateUserLog) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Logout Data'));
      }

      // Add new Break Log
      const logData = await this.UserLogService._createLog({
        action,
        action_start_date: new Date(),
        user_id: userId,
        login_capture_data: {
          ip: ip || null,
          browser_client: req.headers['user-agent'],
        },
        sessionid: active_sessionid,
        action_by: req.user.id,
      });

      //console.log('action', action);

      let status = null;

      if (action === 'BREAK_TIME') {
        status = true;
      } else {
        status = false;
      }

      eventEmitterTask.default.emit('log_Out_task_time_stop', userId);
      if (!logData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Break Log'));
      }

      return res.status(200).json(APIResponseFormat._ResDataFound({ status }));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default AuthController;
