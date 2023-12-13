import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import UserService from '../services/user.service';
import { iUser, iRequestWithUser, iUserLog, iUserWithRole } from '../../../database/interface/user.interface';
import moment from 'moment';
import { Op, Sequelize, literal } from 'sequelize';
import UserLogService from '../services/user_log.service';
import { developmentConfig } from '@tms-workspace/configurations';
import { FileService, BasePath } from '@tms-workspace/file-upload';
import { Encryption } from '@tms-workspace/';
import eventEmitter from '../../../../core/project.event';
import { eventEmitterUser } from '@tms-workspace/preference';
// import UserValidation from '../../../../core/user';
class UserController {
  public UserService = new UserService();
  // public Validator = new UserValidation();
  public UserLogService = new UserLogService();
  public userEventEmitter = eventEmitterUser.default;

  /*
    * getUserById
    * To Use Authorized User Data By 
    ?  RequestType: iRequestWithUser
    ?  GetData : req.user
   */
  public msToTime = (duration) => {
    console.log('duration', duration);

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const formatted_hours = hours < 10 ? '0' + hours : hours;
    const formatted_minutes = minutes < 10 ? '0' + minutes : minutes;
    return formatted_hours + ':' + formatted_minutes;
  };

  public getUserHierarchy = async (employeeId: string, type: string) => {
    // console.log(employeeId, type);
    let users = [];

    const userdata = await this.UserService._getUserDataByEmployeeCode(employeeId);

    // console.log('userdata', userdata);

    if (userdata) {
      // console.log(userdata.team_lead, 'userdata.team_lead ');
      // console.log('userdata.project_manager', userdata.project_manager);
      // console.log('userdata.team_lead != null', userdata.team_lead !== null);

      if (userdata.team_lead != null) {
        users = [userdata.team_lead_name, ...(await this.getUserHierarchy(userdata.team_lead, 'TL'))];
      } else {
        users = [userdata.project_manager_name, ...(await this.getUserHierarchy(userdata.project_manager, 'PM'))];
      }
    }

    // console.log('users', users);

    users = users.filter((user) => user != null);

    return users;
  };

  public checkValidation = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      return res.status(200).json(APIResponseFormat._ResDataFound());
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getUserById = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.headers.id);

      if (!userId) {
        res.status(404).json(APIResponseFormat._ResMissingRequiredField('UserId'));
      }

      const userData: iUser = await this.UserService._getUserDataById(userId);

      if (!userData) {
        res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      if (userData.team_lead != null) {
        userData.hierarchy = [userData.team_lead_name, ...(await this.getUserHierarchy(userData.team_lead, 'TL'))];
      } else {
        userData.hierarchy = [userData.project_manager_name, ...(await this.getUserHierarchy(userData.project_manager, 'PM'))];
      }

      // console.log('userData', userData);

      return res.status(200).json(APIResponseFormat._ResDataFound(userData));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getReportingPersons = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;

      if (!userId) {
        res.status(404).json(APIResponseFormat._ResMissingRequiredField('UserId'));
      }

      await this.UserService._getReportingPersons(Number(userId))
        .then((data) => {
          const reportedPersons = JSON.parse(JSON.stringify(data));
          // reporting persons group by project_id
          const result = reportedPersons.reduce(function (r, a) {
            r.push(a.user);
            return r;
          }, []);

          let mySet = Object.values(result);

          mySet = [...new Set(mySet.map((obj) => JSON.stringify(obj)))].map((str) => JSON.parse(str));

          // console.log(mySet);

          res.status(200).json(APIResponseFormat._ResDataFound(mySet));
        })
        .catch((err) => {
          res.status(500).json(APIResponseFormat._ResIntervalServerError(err));
        });
    } catch (error) {
      next(error);
      return res.status(500).json(error);
    }
  };

  public getReportingPersonsLeaves = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const encryptedId = req.headers.user_id;
      const month = Number(req.query.month);
      const year = Number(req.query.year);

      if (!encryptedId) {
        res.status(404).json(APIResponseFormat._ResMissingRequiredField('UserId'));
      }
      if (!year) {
        res.status(404).json(APIResponseFormat._ResMissingRequiredField('Year'));
      }
      if (!month) {
        res.status(404).json(APIResponseFormat._ResMissingRequiredField('Month'));
      }

      const userId = Encryption._doDecrypt(String(encryptedId));

      await this.UserService._getReportingPersonsLeaves(Number(userId), month, year)
        .then((data) => {
          const reportedPersons = JSON.parse(JSON.stringify(data));

          // reporing person leaves group by user_id
          const respData = reportedPersons.reduce(function (r, a) {
            r[a.user_id] = r[a.user_id] || {};
            r[a.user_id]['user_id'] = a.user_id || null;
            r[a.user_id]['leaves'] = r[a.user_id]['leaves'] || [];
            if (a.leave) r[a.user_id]['leaves'].push(a.leave);
            return r;
          }, Object.create(null));

          res.status(200).json(APIResponseFormat._ResDataFound(Object.values(respData)));
        })
        .catch((err) => {
          res.status(500).json(APIResponseFormat._ResIntervalServerError(err));
        });
    } catch (error) {
      next(error);
      return res.status(500).json(error);
    }
  };

  public getLeaveApproverPersons = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers.id ? Number(req.headers.id) : req.user.id;

      if (!userId) {
        res.status(404).json(APIResponseFormat._ResMissingRequiredField('UserId'));
      }

      const approverPersons = await this.UserService._getLeaveApproverPersons(Number(userId));
      const getLeaveResponsible = await this.UserService._getLeaveResponsiblePersons();

      const Approver = [];

      if (approverPersons.team_lead_name) {
        Approver.push({ ...approverPersons.team_lead_name, type: 'leave_reporting_person' });
      }

      if (approverPersons.project_manager_name) {
        Approver.push({ ...approverPersons.project_manager_name, type: 'leave_reporting_person' });
      }

      if (getLeaveResponsible) {
        getLeaveResponsible.forEach((user) => {
          Approver.push({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            designation: user.designation,
            employee_image: user.employee_image,
            type: 'leave_responsible_person',
          });
        });
      }

      const key = 'id';
      const uniqueApprover = Approver.reduce((accumulator, currentObject) => {
        const existingObject = accumulator.find((obj) => obj[key] === currentObject[key]);

        // If there is an existing object and its type is "leave_responsible_person",
        // replace it with the current object
        if (existingObject) {
          if (existingObject.type !== 'leave_responsible_person' && currentObject.type === 'leave_responsible_person') {
            accumulator.splice(accumulator.indexOf(existingObject), 1, currentObject);
          }
        } else {
          // If there is no existing object, add the current object to the accumulator
          accumulator.push(currentObject);
        }

        // Return the accumulator for the next iteration
        return accumulator;
      }, []);

      return res.status(200).json(APIResponseFormat._ResDataFound(uniqueApprover));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error));
    }
  };
  public employeeSync = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // SERVICE CALL & HANDLE PROMISES
      // Get New Or Updated User From HRMS
      await this.UserService._getSyncUser()
        .then((dbResponse: any) => {
          //Get User Old Data From TMS
          this.UserService._getUserData()
            .then(async (userOldData: any) => {
              //new User Data
              const getUserData = dbResponse.data.data;

              //Format Data For Update User

              for (let index = 0; index < getUserData.length; index++) {
                // const element = getUserData[index];
                const OldEmployee = userOldData.find((oldEmp) => oldEmp.employee_id === getUserData[index].employee_id);
                // getUserData[index].is_active = 1;
                // getUserData[index].password = '660dd0298bd4ea6feadbd655a89c7b34';
                getUserData[index].dob = getUserData[index].dob != 'Invalid date' ? getUserData[index].dob : null;

                getUserData[index].workdetails = getUserData[index].workDetails;

                if (getUserData[index].employee_image !== null) {
                  const TMS_USER_PROFILE = await FileService._employeeImageSync(getUserData[index].employee_image, BasePath.default.USER_PATH);

                  getUserData[index].employee_image = TMS_USER_PROFILE;
                  // console.log(TMS_USER_PROFILE);
                }

                if (getUserData[index]?.certificates !== null) {
                  getUserData[index]?.certificates.forEach(async (certificate, idx) => {
                    if (certificate.certificate_file !== null) {
                      const TMS_USER_CERTIFICATE = await FileService._employeeCertificateSync(
                        certificate.certificate_file,
                        BasePath.default.USER_CERTIFICATE_PATH
                      );

                      getUserData[index].certificates[idx].certificate_file = TMS_USER_CERTIFICATE;
                    }
                  });
                }

                if (OldEmployee) {
                  getUserData[index].id = OldEmployee.id;
                  if (getUserData[index].status === 'ex-employee') {
                    getUserData[index].is_active = 0;
                    this.userEventEmitter.emit('exemployee_remove_from_workspace_project_tasks', getUserData[index].employee_id);
                  }

                  if (getUserData[index].status === 'employee') {
                    getUserData[index].is_active = 1;
                  }
                } else {
                  getUserData[index].user_with_role = {
                    role_id: 5,
                  };

                  getUserData[index].leaveBalance = [
                    {
                      leave_type: 'CL',
                      current_balance: 0,
                      applied_balance: 0,
                      reserved_balance: 0,
                    },
                    {
                      leave_type: 'PL',
                      current_balance: 0,
                      applied_balance: 0,
                      reserved_balance: 0,
                    },
                    {
                      leave_type: 'LWP',
                      current_balance: 0,
                      applied_balance: 0,
                      reserved_balance: 0,
                    },
                  ];
                }
              }

              // Sync User HRMS to TMS
              this.UserService._syncUser(getUserData)
                .then((response) => {
                  res.status(200).json(APIResponseFormat._ResDataSync(getUserData));
                })
                .catch((err) => {
                  next(err);
                  res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
                });
            })
            .catch((err) => {
              next(err);
              res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
            });
        })
        .catch((err) => {
          next(err);
          res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
        });
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public syncHrmsData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.headers.type;

      let user;
      if (type == 'update') {
        if (req.body.employee_image !== null) {
          const TMS_USER_PROFILE = await FileService._employeeImageSync(req.body.employee_image, BasePath.default.USER_PATH);

          req.body.employee_image = TMS_USER_PROFILE;
          // console.log(TMS_USER_PROFILE);
        }

        if (req.body.certificates !== null) {
          req.body.certificates.forEach(async (certificate, idx) => {
            if (certificate.certificate_file !== null) {
              const TMS_USER_CERTIFICATE = await FileService._employeeCertificateSync(
                certificate.certificate_file,
                BasePath.default.USER_CERTIFICATE_PATH
              );

              req.body.certificates[idx].certificate_file = TMS_USER_CERTIFICATE;
            }
          });
        }

        req.body.workdetails = req.body.workDetails;

        if (req.body.status === 'ex-employee') {
          req.body.is_active = 0;
          this.userEventEmitter.emit('exemployee_remove_from_workspace_project_tasks', req.body.employee_id);
        }

        if (req.body.status === 'employee') {
          req.body.is_active = 1;
        }

        // console.log('req.body', req.body);

        user = await this.UserService._updateHrmsUser(req.body);

        // If Employee Status Exexployee Then Remove From All The Workspaces, Projects & Tasks
      } else if (type == 'add') {
        req.body.is_active = 1;
        if (req.body.employee_image !== null) {
          const TMS_USER_PROFILE = await FileService._employeeImageSync(req.body.employee_image, BasePath.default.USER_PATH);

          req.body.employee_image = TMS_USER_PROFILE;
          // console.log(TMS_USER_PROFILE);
        }

        if (req.body.certificates !== null) {
          req.body.certificates.forEach(async (certificate, idx) => {
            if (certificate.certificate_file !== null) {
              const TMS_USER_CERTIFICATE = await FileService._employeeCertificateSync(
                certificate.certificate_file,
                BasePath.default.USER_CERTIFICATE_PATH
              );

              req.body.certificates[idx].certificate_file = TMS_USER_CERTIFICATE;
            }
          });
        }
        req.body.workdetails = req.body.workDetails;
        req.body.user_with_role = {
          role_id: 5,
        };

        req.body.leaveBalance = [
          {
            leave_type: 'CL',
            current_balance: 0,
            applied_balance: 0,
            reserved_balance: 0,
          },
          {
            leave_type: 'PL',
            current_balance: 0,
            applied_balance: 0,
            reserved_balance: 0,
          },
          {
            leave_type: 'LWP',
            current_balance: 0,
            applied_balance: 0,
            reserved_balance: 0,
          },
        ];

        user = await this.UserService._syncUser([req.body]);
      } else {
        return res.status(400).json(APIResponseFormat._ResBadRequest('Invalid Operation Type Found'));
      }

      if (!user) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('User'));
      }

      return res.status(200).json(APIResponseFormat._ResDataUpdated('User'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public userPendingTime = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = req.user.id;

      if (!id) {
        return res.status(500).json(APIResponseFormat._ResMissingRequiredField('User Id'));
      }

      // Get Today's Remaining Hours = Login Time - Break Time
      const today = moment().format('YYYY-MM-DD');

      // Get Weekly Remaining Hours = Login Time - Break Time
      const startWeek = moment().weekday(1).format('YYYY-MM-DD');
      const endWeek = moment().weekday(5).format('YYYY-MM-DD');

      console.log('endWeek', endWeek);

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
            user_id: id,
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
        console.log('DAILY COUNT');
        if (!moment(el.from_date).isSame(moment(el.to_date))) {
          do {
            betweenDateinc = betweenDateinc ? betweenDateinc : moment(el.from_date);

            betweenDateinc = betweenDateinc.startOf('day');

            console.log(getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day')));
            console.log(betweenDateinc);
            console.log(betweenDateinc.isSame(moment(today)));

            if (
              betweenDateinc.isBetween(moment(startWeek).startOf('day'), moment(endWeek).startOf('day'), undefined, '[]') &&
              betweenDateinc.isSame(moment(today).startOf('day'))
            ) {
              if (
                betweenDateinc.isSame(moment(el.from_date).startOf('day')) &&
                el.leave_from_slot === 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY FROM DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }

              if (
                betweenDateinc.isSame(moment(el.from_date).startOf('day')) &&
                el.leave_from_slot !== 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('el HD NOT SAME DAY FROM DATE HF', el);
                acc += developmentConfig.default.HALF_WORKING_MINITES;
              }

              if (
                betweenDateinc.isSame(moment(el.to_date).startOf('day')) &&
                el.leave_to_slot === 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY TO DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }

              if (
                betweenDateinc.isSame(moment(el.to_date).startOf('day')) &&
                el.leave_to_slot !== 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('el HD NOT SAME DAY TO DATE HF', el);
                acc += developmentConfig.default.HALF_WORKING_MINITES;
              }

              if (
                betweenDateinc.isBetween(moment(el.from_date).startOf('day'), moment(el.to_date).startOf('day')) &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY BETWEEN DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }
            }
            betweenDateinc = betweenDateinc.clone().add(1, 'days');
          } while (!betweenDateinc.isSame(moment(el.to_date).clone().add(1, 'days').startOf('day')));
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
        user_id: id,
        action_start_date: { [Op.gte]: `${today} 00:00:00` },
        action_end_date: {
          [Op.or]: [{ [Op.lte]: `${today} 23:59:59` }, { [Op.eq]: null }],
        },
      };

      let todaysLoginLog: iUserLog[] = await this.UserLogService._getAllLog(tQuery);

      todaysLoginLog = JSON.parse(JSON.stringify(todaysLoginLog));

      todaysLoginLog.forEach((el) => {
        console.log('todayRemainingTime', todayRemainingTime);
        if (el.action === 'MANUAL_TIME_ADD') {
          console.log('MANUAL_TIME_ADD TIME', el.time, moment(el.time, 'HH:mm').hours() * 60 + moment(el.time, 'HH:mm').minutes());

          todayRemainingTime += moment(el.time, 'HH:mm').hours() * 60 + moment(el.time, 'HH:mm').minutes();
        }

        if (el.action === 'MANUAL_TIME_REMOVE') {
          console.log('MANUAL_TIME_REMOVE TIME', el.time, moment(el.time, 'HH:mm').hours() * 60 + moment(el.time, 'HH:mm').minutes());

          todayRemainingTime -= moment(el.time, 'HH:mm').hours() * 60 + moment(el.time, 'HH:mm').minutes();
        }

        if (el.action_end_date && el.action != 'BREAK_TIME') {
          todayRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        } else if (!el.action_end_date && el.action != 'BREAK_TIME') {
          todayRemainingTime -= moment().diff(moment(el.action_start_date), 'minutes');
        }
      });

      console.log('todayRemainingTime', todayRemainingTime);

      const LeaveHours = await getWeeklyUserLeave.reduce((acc, el) => {
        const fromDate = moment(el.from_date).format('YYYY-MM-DD');
        const toDate = moment(el.to_date).format('YYYY-MM-DD');
        let betweenDateinc = null;

        console.log('WEEKLY COUNT');

        if (!moment(el.from_date).isSame(moment(el.to_date))) {
          do {
            betweenDateinc = betweenDateinc ? betweenDateinc : moment(el.from_date);

            betweenDateinc = betweenDateinc.startOf('day');

            console.log(betweenDateinc, 'betweenDateinc');
            console.log(betweenDateinc.isBetween(moment(startWeek).startOf('day'), moment(endWeek).startOf('day'), undefined, '[]'));

            if (betweenDateinc.isBetween(moment(startWeek).startOf('day'), moment(endWeek).startOf('day'), undefined, '[]')) {
              console.log(' betweenDateinc.isSame(moment(el.from_date))', betweenDateinc.isSame(moment(el.from_date).startOf('day')));

              if (
                betweenDateinc.isSame(moment(el.from_date).startOf('day')) &&
                el.leave_from_slot === 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY FROM DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }

              if (
                betweenDateinc.isSame(moment(el.from_date).startOf('day')) &&
                el.leave_from_slot !== 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('el HD NOT SAME DAY FROM DATE HF', el);
                acc += developmentConfig.default.HALF_WORKING_MINITES;
              }

              if (
                betweenDateinc.isSame(moment(el.to_date).startOf('day')) &&
                el.leave_to_slot === 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY TO DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }

              if (
                betweenDateinc.isSame(moment(el.to_date).startOf('day')) &&
                el.leave_to_slot !== 'FD' &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('el HD NOT SAME DAY TO DATE HF', el);
                acc += developmentConfig.default.HALF_WORKING_MINITES;
              }

              if (
                betweenDateinc.isBetween(moment(el.from_date).startOf('day'), moment(el.to_date).startOf('day')) &&
                !getWeeklyHoliday.some((obj) => moment(obj.holiday_date).isSame(betweenDateinc, 'day'))
              ) {
                console.log('elFD NOT SAME DAY BETWEEN DATE FD', el);
                acc += developmentConfig.default.DAILY_WORKING_MINUTES;
              }
            }
            betweenDateinc = betweenDateinc.clone().add(1, 'days');
          } while (!betweenDateinc.isSame(moment(el.to_date).clone().add(1, 'days').startOf('day')));
        } else {
          if (fromDate === toDate && fromDate === today && el.leave_from_slot === 'FD') {
            console.log('el FD SAME DAY', el);
            acc += developmentConfig.default.DAILY_WORKING_MINUTES;
          }

          if (fromDate === toDate && fromDate === today && el.leave_from_slot !== 'FD') {
            console.log('el HD SAME DAY', el);
            acc += developmentConfig.default.HALF_WORKING_MINITES;
          }

          if (fromDate === toDate && fromDate != today && el.leave_from_slot === 'FD') {
            console.log('el FD SAME DAY', el);
            acc += developmentConfig.default.DAILY_WORKING_MINUTES;
          }

          if (fromDate === toDate && fromDate != today && el.leave_from_slot !== 'FD') {
            console.log('el HD SAME DAY', el);
            acc += developmentConfig.default.HALF_WORKING_MINITES;
          }
        }

        // if (today > fromDate && today < toDate) {
        //   console.log('el FD NOT SAME DAY', el);
        //   acc += developmentConfig.default.DAILY_WORKING_MINUTES;
        // }
        return acc;
      }, 0);

      let weeklyRemainingTime = developmentConfig.default.WEEKLY_WORKING_MINUTES - LeaveHours - WeeklyHolidayHour;
      const wQuery = {
        user_id: id,
        action_start_date: { [Op.gte]: `${startWeek} 00:00:00` },
        action_end_date: {
          [Op.or]: [{ [Op.lte]: `${endWeek} 23:59:59` }, { [Op.eq]: null }],
        },
      };
      let weeklyLoginLog: iUserLog[] = await this.UserLogService._getAllLog(wQuery);
      weeklyLoginLog = JSON.parse(JSON.stringify(weeklyLoginLog));

      weeklyLoginLog.forEach((el) => {
        console.log('weeklyRemainingTime', weeklyRemainingTime);

        if (el.action === 'MANUAL_TIME_ADD') {
          console.log('MANUAL_TIME_ADD TIME', el.time, moment(el.time, 'HH:mm').hours() * 60 + moment(el.time, 'HH:mm').minutes());

          weeklyRemainingTime += moment(el.time, 'HH:mm').hours() * 60 + moment(el.time, 'HH:mm').minutes();
        }

        if (el.action === 'MANUAL_TIME_REMOVE') {
          console.log('MANUAL_TIME_REMOVE TIME', el.time, moment(el.time, 'HH:mm').hours() * 60 + moment(el.time, 'HH:mm').minutes());

          weeklyRemainingTime -= moment(el.time, 'HH:mm').hours() * 60 + moment(el.time, 'HH:mm').minutes();
        }

        if (el.action_end_date && el.action != 'BREAK_TIME') {
          weeklyRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        } else if (!el.action_end_date && el.action != 'BREAK_TIME') {
          weeklyRemainingTime -= moment().diff(moment(el.action_start_date), 'minutes');
        }

        // else if (el.action == 'MANUAL_TIME_ADD') {
        //   weeklyRemainingTime += moment(el.time, 'HH:mm').minutes();
        // } else if (el.action == 'MANUAL_TIME_REMOVE') {
        //   weeklyRemainingTime -= moment(el.time, 'HH:mm').minutes();
        // }
      });

      console.log('weeklyRemainingTime', weeklyRemainingTime);
      // Break Status
      const tbQuery = {
        user_id: id,
        action_start_date: { [Op.gte]: `${today} 00:00:00` },
        action_end_date: { [Op.eq]: null },
      };

      let todaysBreakLog: iUserLog[] = await this.UserLogService._getAllLog(tbQuery);

      todaysBreakLog = JSON.parse(JSON.stringify(todaysBreakLog));

      // console.log('todaysBreakLog', todaysBreakLog);
      let breakStatus = false;
      if (todaysBreakLog[0]?.action === 'BREAK_TIME') {
        breakStatus = true;
      }

      console.log('weeklyRemainingTime', weeklyRemainingTime);

      return res.status(200).json(
        APIResponseFormat._ResDataFound({
          todayRemainingTime,
          weeklyRemainingTime,
          todayLeaveMinites: DailyLeaveHours,
          weeklyLeaveMinites: LeaveHours + WeeklyHolidayHour,
          breakStatus,
        })
      );
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getUserList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, search, role_id } = req.body;

      let where = {};
      if (search) {
        where = {
          [Op.or]: {
            first_name: { [Op.like]: `%${search}%` },
            last_name: { [Op.like]: `%${search}%` },
            contact_number: { [Op.like]: `%${search}%` },
            employee_id: { [Op.like]: `%${search}%` },
          },
        };
      }

      const count = await this.UserService._count(where, role_id);
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }

      const data = await this.UserService._getAllUsers(where, role_id, page as number, limit as number, sortBy as string, orderBy as string);

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public updateUserRole = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.headers.id);
      const role_id = req.body.role_id;

      if (!id || !role_id) {
        return res.status(500).json(APIResponseFormat._ResMissingRequiredField());
      }

      const userWithRole: iUserWithRole = await this.UserService._getUserRole(id);

      if (userWithRole) {
        await this.UserService._updateUserRole(role_id, id);
      } else {
        await this.UserService._createUserRole({ role_id, user_id: id });
      }
      let userRole: iUserWithRole = await this.UserService._getUserRoleByRoleId(role_id);
      userRole = JSON.parse(JSON.stringify(userRole));
      if (userRole && userRole.user_role?.title.trim().toLocaleLowerCase() === 'super admin') {
        eventEmitter.emit('addAdminInProjectTeam', id);
        eventEmitter.emit('addAdminInWorkspaceTeam', id);
      }
      return res.status(200).json(APIResponseFormat._ResDataUpdated('User Role'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public updateUserRoleMultiple = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = req.body.id;
      const role_id = req.body.role_id;

      if (id.length === 0 || !role_id) {
        return res.status(500).json(APIResponseFormat._ResMissingRequiredField());
      }
      await this.UserService._updateUserRoleMultiple(role_id, id);
      return res.status(200).json(APIResponseFormat._ResDataUpdated('User Role'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public updateSkillDescription = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const employee_id = Number(req.user.id);
      const { skill_description } = req.body;

      const updateUserResponse = await this.UserService._updateUserSkillDescription(skill_description as string, employee_id as number);

      if (!updateUserResponse) return res.status(500).json(APIResponseFormat._ResDataNotUpdated('User'));

      return res.status(200).json(APIResponseFormat._ResDataUpdated('User'));
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(error);
    }
  };

  public getUserTimeHistory = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortby, orderby, fromdate, todate } = req.headers;
      const user_id = req.headers.id ? Number(req.headers.id) : null;
      const startDate = fromdate ? moment(`${fromdate}`).format('YYYY-MM-DD HH:mm:ss') : null;
      const endDate = todate ? moment(`${todate}`).endOf('day').format('YYYY-MM-DD HH:mm:ss') : null;
      // const isAuthenticate=await this.Validator.validateUser(user_id,req.user.id)
      // if(req.user.id===user_id||isAuthenticate){
      let where = {};
      where = {
        user_id: user_id,
        [Op.or]: [{ action_start_date: { [Op.between]: [startDate, endDate] } }, { action_end_date: { [Op.between]: [startDate, endDate] } }],
      };
      // const data = await this.UserService._getTimeHistory(where,user_id, +page, +limit, sortby as string, orderby as string);
      const count = await this.UserService._TimeHistoryCount(where);
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const user = await this.UserService._getUserDataById(user_id);
      const totalData = await this.UserService._getAllTimeHistory(where, user_id);
      const data = await this.UserService._getTimeHistory(where, user_id, +page, +limit, sortby as string, orderby as string);

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);
      const userData = JSON.parse(JSON.stringify(user));
      // const UsersTimeLog=userData?.UsersTimeLog||[];
      const UsersTimeLog = JSON.parse(JSON.stringify(data));
      let userIDs = UsersTimeLog
        // eslint-disable-next-line no-prototype-builtins
        .filter((item) => item.action_by !== null && item.hasOwnProperty('action_by'))
        .map((item) => item.action_by);
      userIDs = Array.from(new Set(userIDs));
      let usersDetails = await this.UserService._getUsersDatabyIds(userIDs);
      usersDetails = JSON.parse(JSON.stringify(usersDetails));

      console.log('UsersTimeLog', UsersTimeLog);

      let totalWorkTime = 0;
      let totalIdealTime = 0;
      let totalManualAdjustTime = 0;

      totalData.forEach((element) => {
        if (element.action === 'LOGIN' || element.action === 'BACK_FROM_BREAK') {
          totalWorkTime += element.action_end_date
            ? moment(element.action_end_date).diff(moment(element.action_start_date), 'minutes')
            : moment().diff(moment(element.action_start_date), 'minutes');
        }
        if (element.action === 'BREAK_TIME') {
          totalIdealTime += element.action_end_date
            ? moment(element.action_end_date).diff(moment(element.action_start_date), 'minutes')
            : moment().diff(moment(element.action_start_date), 'minutes');
        }
        if (element.action === 'MANUAL_TIME_ADD') {
          totalManualAdjustTime += moment.duration(element.time).asMinutes();
        }
        if (element.action === 'MANUAL_TIME_REMOVE') {
          totalManualAdjustTime -= moment.duration(element.time).asMinutes();
        }
      });

      const result = UsersTimeLog.map((obj: iUserLog) => {
        let diffInMilliseconds;
        let action_by;

        if (obj.action_by != null) {
          const val = (usersDetails as any[]).find((item) => item.id === obj.action_by);
          action_by = val.first_name + ' ' + val.last_name;
        }

        if (obj.action === 'MANUAL_TIME_ADD' || obj.action === 'MANUAL_TIME_REMOVE') {
          diffInMilliseconds = obj.time;
        } else {
          diffInMilliseconds = obj.action_end_date
            ? this.msToTime(moment(obj.action_end_date).diff(moment(obj.action_start_date)))
            : this.msToTime(moment().diff(moment(obj.action_start_date)));
        }

        const history = {
          full_Name: `${userData.first_name} ${userData.last_name}`,
          total_time: diffInMilliseconds,
          action_by_name: action_by,
          ...obj,
        };
        return history;
      });

      // sort result's data id wise
      // result = result.sort((a, b) => {
      //   return b.id - a.id;
      // });

      const finaldata = {
        result,
        userData,
        totalWorkTime,
        totalIdealTime,
        totalManualAdjustTime,
      };

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(finaldata, totalPages, limit as string, count as number, pageNumber));
      // return res.status(200).json(APIResponseFormat._ResDataFound(result));
      // }else{
      //   return res.status(401).json(APIResponseFormat._ResCustomRequest("Can not access this user data"));
      // }
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(error);
    }
  };

  public getUserBirthdayWorkday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.currentdate) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Date'));
      }
      const { page, limit, sortBy, orderBy } = req.body;

      const targetDate = new Date(req.headers.currentdate as string);
      const date = moment(targetDate).format('YYYY-MM-DD');
      const day = targetDate.getDate();
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const where = { day, month, year, date };

      const count = await this.UserService._countBirthdayWorkAnniversary(where);

      console.log('count', count);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }

      const data = await this.UserService._getAllUsersBirthdayWorkAnniversary(
        where,
        page as number,
        limit as number,
        sortBy as string,
        orderBy as string
      );

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public manualUserTimeUpdate = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;

      const getLeaveResponsiblePerson = await this.UserService._getLeaveResponsiblePersonsId();

      if (!req.user.isAdmin) {
        if (!getLeaveResponsiblePerson.includes(user_id)) {
          return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
        }
      }

      const employee_id = Number(req.headers.id);
      const { type, date, time, reason } = req.body;

      const response = await this.UserLogService._createLog({
        action: type === 'ADD' ? 'MANUAL_TIME_ADD' : 'MANUAL_TIME_REMOVE',
        action_start_date: new Date(date),
        action_end_date: new Date(date),
        user_id: employee_id,
        login_capture_data: null,
        logout_capture_data: null,
        sessionid: null,
        action_by: user_id,
        time: time,
        reason: reason,
      });

      if (!response) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Manual Time Added'));
      }

      return res.status(200).json(APIResponseFormat._ResDataUpdated('Worked Hours'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default UserController;
