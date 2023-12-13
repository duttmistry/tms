import { APIResponseFormat } from '@tms-workspace/apis-core';
import { Request, Response, NextFunction } from 'express';
import { iRequestWithUser, iUser } from '../../../database/interface/user.interface';
import _ from 'lodash';
import moment from 'moment';
import AdministrationService from '../services/administration.service';
import { Op, Sequelize } from 'sequelize';
import { log } from 'console';

class Administration {
  public administrationService = new AdministrationService();

  public getDatesBetween = (startDate, endDate) => {
    const dates = [];
    const currDate = moment(startDate);
    const lastDate = moment(endDate);

    while (currDate <= lastDate) {
      dates.push(currDate.format('YYYY-MM-DD'));
      currDate.add(1, 'days');
    }

    return dates;
  };

  public formatEmployeeData = (employees: iUser[]) => {
    // console.log('Fun Employee F', employees);

    const formatedEmployees = employees.map((employee) => {
      const leaves = employee.leaveHistory.map((leave) => {
        return leave;
      });

      return {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        designation: employee.designation,
        employee_image: employee.employee_image,
        employee_id: employee.employee_id,
        leaves,
        loginLog: employee.UsersTimeLog,
      };
    });

    return formatedEmployees;
  };

  public findFirstAndLastOccurrencesByTimestamp = (array: any, targetAction: string) => {
    let firstOccurrence = null;
    let lastOccurrence = null;

    for (let i = 0; i < array.length; i++) {
      if (array[i].action === targetAction) {
        if (firstOccurrence === null) {
          firstOccurrence = array[i];
        }
        lastOccurrence = array[i];
      }
    }

    return {
      firstOccurrence,
      lastOccurrence,
    };
  };

  public calculateTotalTime = (array: any, targetAction: string, targetAction2: string) => {
    let totalMilliseconds = 0;

    console.log('LOGIN TIME', array);

    for (const item of array) {
      if (targetAction2 != null) {
        if (item.action === targetAction || item.action === targetAction2) {
          const fromDate = new Date(item.action_start_date);
          const toDate = item.action_end_date ? new Date(item.action_end_date) : new Date();
          const timeDiffInMilliseconds = toDate.getTime() - fromDate.getTime();
          totalMilliseconds += timeDiffInMilliseconds;
        }
      } else {
        if (item.action === targetAction) {
          const fromDate = new Date(item.action_start_date);
          const toDate = item.action_end_date ? new Date(item.action_end_date) : new Date();
          const timeDiffInMilliseconds = toDate.getTime() - fromDate.getTime();
          totalMilliseconds += timeDiffInMilliseconds;
        }
      }
    }

    // Convert totalMilliseconds to total hours and minutes
    const totalMinutes = totalMilliseconds / (1000 * 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.floor(totalMinutes % 60);

    return {
      totalHours,
      remainingMinutes,
    };
  };

  public getAttendance = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { userId, month, year, fromDate, toDate } = req.body;

      const from_date_month = moment(fromDate).format('MM');
      const to_date_month = moment(toDate).format('MM');
      const from_date_year = moment(fromDate).format('YYYY');
      const to_date_year = moment(toDate).format('YYYY');

      let months = [];
      let years = [];

      if (year !== null && month !== null) {
        months.push(Number(month));
        years.push(Number(year));
      }

      if (fromDate !== null && toDate !== null) {
        months.push(Number(from_date_month));
        months.push(Number(to_date_month));

        years.push(Number(from_date_year));
        years.push(Number(to_date_year));
      }

      months = [...new Set(months)];
      years = [...new Set(years)];

      // console.log('YEARS', years);
      // console.log('MONTHS', months);

      // Get Holidays

      const holidays = await this.administrationService._getHolidays(years, months);
      console.log('HOLIDAYS', holidays);

      // Get Employee with Leaves

      let employeeWhere = {};

      if (userId !== null) {
        employeeWhere = {
          id: {
            [Op.in]: userId,
          },
          is_active: {
            [Op.eq]: 1,
          },
        };
      }

      const leaveWhere = {
        [Op.and]: [
          {
            status: 'APPROVED',
          },
          {
            [Op.or]: [
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                      [Op.gte]: new Date(fromDate).toISOString().slice(0, 10),
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                      [Op.lte]: new Date(toDate).toISOString().slice(0, 10),
                    }),
                  },
                ],
              },
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                      [Op.lte]: new Date(toDate).toISOString().slice(0, 10),
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                      [Op.gte]: new Date(fromDate).toISOString().slice(0, 10),
                    }),
                  },
                ],
              },
            ],
          },
        ],
      };

      const logWhere = {
        [Op.and]: [
          {
            [Op.or]: [
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('action_start_date')), {
                      [Op.gte]: new Date(fromDate).toISOString().slice(0, 10),
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('action_start_date')), {
                      [Op.lte]: new Date(toDate).toISOString().slice(0, 10),
                    }),
                  },
                ],
              },
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('action_end_date')), {
                      [Op.lte]: new Date(toDate).toISOString().slice(0, 10),
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('action_end_date')), {
                      [Op.gte]: new Date(fromDate).toISOString().slice(0, 10),
                    }),
                  },
                ],
              },
            ],
          },
        ],
      };

      const employee = await this.administrationService._getEmployees(employeeWhere, leaveWhere, logWhere);

      const formatedEmployee = await this.formatEmployeeData(employee);

      const datesBetween = await this.getDatesBetween(fromDate, toDate);
      // console.log('EMPLOYEE', formatedEmployee);
      // console.log('datesBetween', datesBetween);

      const responseData = await Promise.all(
        formatedEmployee.map(async (employee) => {
          const employeeAttendance = await Promise.all(
            datesBetween.map(async (date) => {
              const day = moment(date).isoWeekday();
              const today = moment().format('YYYY-MM-DD');
              const currentTime = moment().format('HH:mm:ss');
              const dateToCheck = moment(date).format('YYYY-MM-DD');
              let response = null;

              const allDaylogs = employee.loginLog.filter((obj) => moment(dateToCheck).isSame(moment(obj.action_start_date), 'day'));

              let time = null;

              const loginLog = await this.findFirstAndLastOccurrencesByTimestamp(allDaylogs, 'LOGIN');
              const breakTimeLog = await this.findFirstAndLastOccurrencesByTimestamp(allDaylogs, 'BREAK_TIME');
              const backFromBreakLog = await this.findFirstAndLastOccurrencesByTimestamp(allDaylogs, 'BACK_FROM_BREAK');
              const logoutLog = await this.findFirstAndLastOccurrencesByTimestamp(allDaylogs, 'LOGOUT');

              const loginTime = loginLog.firstOccurrence != null ? moment(loginLog.firstOccurrence.action_start_date).format('hh:mm:ss A') : '-';

              const logoutTime = logoutLog.lastOccurrence != null ? moment(logoutLog.lastOccurrence.action_start_date).format('hh:mm:ss A') : '-';

              const breakTime = await this.calculateTotalTime(allDaylogs, 'BREAK_TIME', null);
              const totalWorkTimeAfterLogin = await this.calculateTotalTime(allDaylogs, 'LOGIN', 'BACK_FROM_BREAK');

              time = {
                loginTime,
                logoutTime,
                breakTime: `${breakTime.totalHours}h ${breakTime.remainingMinutes}m`,
                totalTime: `${totalWorkTimeAfterLogin.totalHours}h ${totalWorkTimeAfterLogin.remainingMinutes}m`,
              };

              // Check Date is current Same
              if (moment(dateToCheck).isSame(today)) {
                const logs = employee.loginLog.filter(
                  (obj) =>
                    obj.action === 'LOGIN' &&
                    moment(dateToCheck).isSame(moment(obj.action_start_date), 'day') &&
                    moment(moment(obj.action_start_date).format('HH:mm:ss'), 'HH:mm:ss').isBefore(moment('12:00:00', 'HH:mm:ss'))
                );

                if (moment(currentTime, 'HH:mm:ss').isBefore(moment('12:00:00', 'HH:mm:ss')) && !logs.length) {
                  response = {
                    date: moment(date).format('YYYY-MM-DD'),
                    day_type: '-',
                    day_id: 8,
                    month: moment(date).format('MM'),
                    year: moment(date).format('YYYY'),
                    time,
                  };
                } else {
                  if (logs.length > 0) {
                    // Else Present
                    response = {
                      date: moment(date).format('YYYY-MM-DD'),
                      day_type: 'P',
                      day_id: 3,
                      month: moment(date).format('MM'),
                      year: moment(date).format('YYYY'),
                      time,
                    };
                  } else {
                    // Else Present
                    response = {
                      date: moment(date).format('YYYY-MM-DD'),
                      day_type: 'A',
                      day_id: 9,
                      month: moment(date).format('MM'),
                      year: moment(date).format('YYYY'),
                      time,
                    };
                  }
                }
              }

              // Check Date is current After
              if (moment(dateToCheck).isAfter(today)) {
                // Else Present

                response = {
                  date: moment(date).format('YYYY-MM-DD'),
                  day_type: '-',
                  day_id: 8,
                  month: moment(date).format('MM'),
                  year: moment(date).format('YYYY'),
                  time,
                };
              }

              // Check Date is current Before
              if (moment(dateToCheck).isBefore(today)) {
                // console.log('loginLog', employee.loginLog);
                const logs = employee.loginLog.filter(
                  (obj) => obj.action === 'LOGIN' && moment(dateToCheck).isSame(moment(obj.action_start_date), 'day')
                );
                // console.log('logs', logs);
                // Else Present

                if (logs.length > 0) {
                  response = {
                    date: moment(date).format('YYYY-MM-DD'),
                    day_type: 'P',
                    day_id: 3,
                    month: moment(date).format('MM'),
                    year: moment(date).format('YYYY'),
                    time,
                  };
                } else {
                  response = {
                    date: moment(date).format('YYYY-MM-DD'),
                    day_type: 'A',
                    day_id: 9,
                    month: moment(date).format('MM'),
                    year: moment(date).format('YYYY'),
                    time,
                  };
                }
              }

              // Week Off Check
              if (day === 6 || day === 7) {
                response = {
                  date: moment(date).format('YYYY-MM-DD'),
                  day_type: 'WO',
                  day_id: 2,
                  month: moment(date).format('MM'),
                  year: moment(date).format('YYYY'),
                  time,
                };
              }

              // Holiday Check
              if (holidays.some((holidayDate) => moment(holidayDate.holiday_date).isSame(moment(date), 'day'))) {
                response = {
                  date: moment(date).format('YYYY-MM-DD'),
                  day_type: 'H',
                  day_id: 1,
                  month: moment(date).format('MM'),
                  year: moment(date).format('YYYY'),
                  time,
                  holiday_title: holidays.find((holidayDate) => moment(holidayDate.holiday_date).isSame(moment(date), 'day')).title,
                };
              }

              // If Leave Available then leave Check
              if (employee.leaves.length !== 0) {
                const leave = employee.leaves.find(
                  (obj) =>
                    moment(obj.from_date).format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD') ||
                    moment(obj.to_date).format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD') ||
                    moment(date).isBetween(obj.from_date, obj.to_date, null, '[]')
                );

                if (leave) {
                  console.log('leave', leave);

                  const fromLeaveDate = moment(leave.from_date).format('YYYY-MM-DD');
                  const toLeaveDate = moment(leave.to_date).format('YYYY-MM-DD');

                  if (moment(fromLeaveDate).isSame(toLeaveDate)) {
                    // console.log('SAME', moment(fromLeaveDate).isSame(toLeaveDate));
                    // console.log(moment(dateToCheck).isBetween(fromLeaveDate, toLeaveDate, null, '[]'));

                    if (moment(dateToCheck).isBetween(fromLeaveDate, toLeaveDate, null, '[]')) {
                      // console.log('leave.leave_to_slot ', leave.leave_to_slot);

                      if (leave.leave_to_slot === 'FH') {
                        // leave = 'HD - F';
                        // leave = 'FH';
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'FH',
                          day_id: 4,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      }

                      if (leave.leave_to_slot === 'SH') {
                        // leave = 'HD - S';
                        // leave = 'SH';
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'SH',
                          day_id: 5,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      }

                      if (leave.leave_to_slot === 'FD') {
                        // leave = 'PL';
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'FD',
                          day_id: 7,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      }
                    }
                  } else {
                    // console.log('NOT SAME', moment(fromLeaveDate).isSame(toLeaveDate));

                    // console.log('moment(dateToCheck).isSame(fromDate)', moment(dateToCheck).isSame(fromDate));
                    if (moment(dateToCheck).isSame(fromDate)) {
                      if (leave.leave_from_slot === 'FH') {
                        // leave = 'HD - F';
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'FH',
                          day_id: 4,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      } else if (leave.leave_from_slot === 'SH') {
                        // leave = 'HD - S';
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'SH',
                          day_id: 5,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      } else {
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'FD',
                          day_id: 7,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      }
                    }

                    // console.log('moment(dateToCheck).isSame(toDate)', moment(dateToCheck).isSame(toDate));
                    if (moment(dateToCheck).isSame(toDate)) {
                      if (leave.leave_to_slot === 'FH') {
                        // leave = 'HD - F';
                        // leave = 'FH';
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'FH',
                          day_id: 4,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      } else if (leave.leave_to_slot === 'SH') {
                        // leave = 'HD - S';
                        // leave = 'SH';
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'SH',
                          day_id: 5,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      } else {
                        // leave = 'PL';
                        response = {
                          date: moment(date).format('YYYY-MM-DD'),
                          day_type: 'FD',
                          day_id: 7,
                          month: moment(date).format('MM'),
                          year: moment(date).format('YYYY'),
                          time,
                          leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                        };
                      }
                    }

                    // console.log('moment(dateToCheck).isBetween(fromDate, toDate)', moment(dateToCheck).isBetween(fromDate, toDate));

                    if (moment(dateToCheck).isBetween(fromDate, toDate)) {
                      response = {
                        date: moment(date).format('YYYY-MM-DD'),
                        day_type: 'FD',
                        day_id: 7,
                        month: moment(date).format('MM'),
                        year: moment(date).format('YYYY'),
                        time,
                        leave_subject: leave.leave_subject != null ? leave.leaveSubject.title : leave.leave_subject_text,
                      };
                    }
                  }
                }
              }
              return response;
            })
          );

          delete employee.leaves;
          delete employee.loginLog;

          return { ...employee, attendance: employeeAttendance };
        })
      );

      return res.status(200).json(APIResponseFormat._ResDataFound(responseData));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default Administration;
