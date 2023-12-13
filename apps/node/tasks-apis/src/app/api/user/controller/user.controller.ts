import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import UserService from '../services/user.service';
import { iUser, iRequestWithUser, iUserLog, iUserWithRole } from '../../../database/interface/user.interface';
import moment from 'moment';
import { Op } from 'sequelize';
import UserLogService from '../services/user_log.service';
import { developmentConfig } from '@tms-workspace/configurations';
import { FileService, BasePath } from '@tms-workspace/file-upload';
import { Encryption } from '@tms-workspace/';

class UserController {
  public UserService = new UserService();
  public UserLogService = new UserLogService();

  /*
    * getUserById
    * To Use Authorized User Data By 
    ?  RequestType: iRequestWithUser
    ?  GetData : req.user
   */
  public getUserById = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.headers.id);

      if (!userId) {
        res.status(404).json(APIResponseFormat._ResMissingRequiredField('UserId'));
      }

      this.UserService._getUserDataById(userId)
        .then((user: iUser) => {
          res.status(200).json(APIResponseFormat._ResDataFound(user));
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

          console.log(mySet);

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
      const userId = req.user.id;

      if (!userId) {
        res.status(404).json(APIResponseFormat._ResMissingRequiredField('UserId'));
      }

      const approverPersons = await this.UserService._getLeaveApproverPersons(Number(userId));

      const result = Array.from(new Set(approverPersons.flatMap((report) => report.report_to)));

      console.log(result);

      const users = await this.UserService._getAllUsers({ id: { [Op.in]: result } });

      if (!users) return res.status(500).json(APIResponseFormat._ResDataNotFound('User'));

      const result2 = users.map((user) => {
        return { id: user.id, first_name: user.first_name, last_name: user.last_name, employee_image: user.employee_image };
      });

      return res.status(200).json(APIResponseFormat._ResDataFound(result2));
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
                }
              }

              // console.log(getUserData);

              // const UserData = getUserData.map(async (employee) => {
              //   const OldEmployee = userOldData.find(
              //     (oldEmp) => oldEmp.employee_id === employee.employee_id
              //   );

              //   if (employee.employee_image !== null) {
              //     const TMS_USER_PROFILE = await FileService._employeeImageSync(
              //       employee.employee_image,
              //       BasePath.default.USER_PATH
              //     );

              //     //  employee.employee_image = TMS_USER_PROFILE;
              //     console.log(TMS_USER_PROFILE);
              //   }
              //   if (OldEmployee) {
              //     return { ...employee, id: OldEmployee.id };
              //   }

              //   return employee;
              // });

              // console.log(UserData);

              // Sync User HRMS to TMS
              this.UserService._syncUser(getUserData)
                .then((response) => {
                  res.status(200).json(APIResponseFormat._ResDataSync());
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
        user = await this.UserService._updateHrmsUser(req.body);
      } else if (type == 'add') {
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
      let todayRemainingTime = developmentConfig.default.DAILY_WORKING_MINUTES;
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
        if (el.action_end_date && el.action != 'BREAK_TIME') {
          todayRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        } else if (!el.action_end_date && el.action != 'BREAK_TIME') {
          todayRemainingTime -= moment().diff(moment(el.action_start_date), 'minutes');
        }

        // else if (el.action_end_date && el.action === 'BREAK_TIME') {
        //   todayRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        // }

        // else {
        //   todayRemainingTime += moment().diff(moment(el.action_start_date), 'minutes');
        // }
      });

      // Get Weekly Remaining Hours = Login Time - Break Time
      const startWeek = moment().weekday(1).format('YYYY-MM-DD');
      const endWeek = moment().weekday(5).format('YYYY-MM-DD');
      let weeklyRemainingTime = developmentConfig.default.WEEKLY_WORKING_MINUTES;
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
        if (el.action_end_date && el.action != 'BREAK_TIME') {
          weeklyRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        } else if (!el.action_end_date && el.action != 'BREAK_TIME') {
          weeklyRemainingTime -= moment().diff(moment(el.action_start_date), 'minutes');
        }

        // else if (el.action_end_date && el.action === 'BREAK_TIME') {
        //   weeklyRemainingTime -= moment(el.action_end_date).diff(moment(el.action_start_date), 'minutes');
        // }

        // else {
        //   weeklyRemainingTime += moment().diff(moment(el.action_start_date), 'minutes');
        // }
      });

      return res.status(200).json(
        APIResponseFormat._ResDataFound({
          todayRemainingTime,
          weeklyRemainingTime,
        })
      );
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getUserList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, search } = req.body;

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

      const count = await this.UserService._count(where);
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }

      const data = await this.UserService._getAllUsers(where, page as number, limit as number, sortBy as string, orderBy as string);

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

      if (id.length===0 || !role_id) {
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
}

export default UserController;
