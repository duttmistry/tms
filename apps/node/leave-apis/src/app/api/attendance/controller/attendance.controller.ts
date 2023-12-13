import { APIResponseFormat } from '@tms-workspace/apis-core';
import { Request, Response, NextFunction } from 'express';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import _ from 'lodash';
import moment from 'moment';
import AttendanceService from '../services/attendance.service';
import { Op, Sequelize } from 'sequelize';
import LeaveSubjectsService from '../../leave_subjects/services/leave_subjects.service';
import { log } from 'console';

class AttendanceController {
  public attendanceService = new AttendanceService();
  public leaveSubjectsService = new LeaveSubjectsService();

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

  public getReportingUser = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      //* PERMISSION FOR GET REPORTING USER of LOGGED USER
      // const permission: any = await this.projectService._getProjectPermission(req.user.id, 'view');
      // if (!Object.keys(permission).length) {
      //   return res.status(401).json(APIResponseFormat._ResUnauthrized());
      // }

      const where = req.user.isAdmin
        ? {
            [Op.and]: {
              user_id: {
                [Op.ne]: req.user.id,
              },
            },
          }
        : {
            [Op.and]: [
              {
                [Op.and]: [
                  Sequelize.fn('JSON_CONTAINS', Sequelize.col('ProjectTeamModel.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                ],
              },
              {
                user_id: {
                  [Op.ne]: req.user.id,
                },
              },
            ],
          };

      const data = await this.attendanceService._getReportingUser(where);

      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      const ReportingUsers = await data.map((d) => {
        return {
          id: d?.user_id,
          first_name: d?.user?.first_name,
          last_name: d?.user?.last_name,
          designation: d?.user?.designation,
          employee_image: d?.user?.employee_image,
        };
      });

      const mySet = [...new Set(ReportingUsers.map((obj) => JSON.stringify(obj)))].map((str) => JSON.parse(str));

      return res.status(200).json(APIResponseFormat._ResDataFound(mySet.sort((a, b) => a.id - b.id)));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getTeamLeave = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.headers.id);
      const year = Number(req.query.year);
      const from_date = req.query.from as string;
      const to_date = req.query.to as string;

      const from_date_month = moment(from_date).format('MMMM');
      const to_date_month = moment(to_date).format('MMMM');

      // let months = [];
      const filterLeaves = [];
      const months = new Set();

      months.add(from_date_month);
      months.add(to_date_month);

      if (!year) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Year'));
      }
      // if (!req.query.month) {
      //   return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Month'));
      // }

      // if (req.query.month === 'All') {
      //   months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      // } else {
      //   months = [req.query.month];
      // }

      console.log('req.user.isAdmin', req.user.isAdmin);

      const where = req.user.isAdmin
        ? {
            [Op.and]: {
              id: {
                [Op.ne]: req.user.id,
              },
            },
          }
        : {
            [Op.and]: [
              {
                [Op.and]: [
                  Sequelize.fn('JSON_CONTAINS', Sequelize.col('ProjectTeamModel.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                ],
              },
              {
                user_id: {
                  [Op.ne]: req.user.id,
                },
              },
              {
                '$teamProjectData.projectBillingConfigration.project_status$': {
                  [Op.ne]: 'closed',
                },
              },
            ],
          };

      const reportingUserData = req.user.isAdmin
        ? await this.attendanceService._getUsers(where)
        : await this.attendanceService._getReportingUser(where);

      // console.log('reportingUserData', reportingUserData);

      let ReportingUsers = !userId
        ? req.user.isAdmin
          ? await reportingUserData.map((d) => d.id)
          : await reportingUserData.map((d) => d.user_id)
        : [userId];

      ReportingUsers = [...new Set(ReportingUsers)];

      const holidays = await this.attendanceService._getHolidays(year);

      const where1 = {
        [Op.and]: [
          {
            user_id: {
              [Op.in]: ReportingUsers,
            },
            status: 'APPROVED',
          },
          {
            [Op.or]: [
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                      [Op.gte]: new Date(from_date).toISOString().slice(0, 10),
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                      [Op.lte]: new Date(to_date).toISOString().slice(0, 10),
                    }),
                  },
                ],
              },
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                      [Op.lte]: new Date(to_date).toISOString().slice(0, 10),
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                      [Op.gte]: new Date(from_date).toISOString().slice(0, 10),
                    }),
                  },
                ],
              },
            ],
          },
        ],
      };

      const ApprovedLeaves = await this.attendanceService._getAllApprovedLeaves(where1);

      // console.log(ApprovedLeaves);
      const datesBetween = await this.getDatesBetween(from_date, to_date);

      // console.log('datesBetween', datesBetween);

      datesBetween.forEach((item: never) => {
        ApprovedLeaves.forEach(async (userleaves) => {
          const fromDate = moment(userleaves.from_date).format('YYYY-MM-DD');
          const toDate = moment(userleaves.to_date).format('YYYY-MM-DD');
          const dateToCheck = moment(item).format('YYYY-MM-DD');

          const leaveSubject =
            userleaves.leave_subject !== null
              ? await this.leaveSubjectsService._getLeaveSubjectById({ id: userleaves.leave_subject })
              : userleaves.leave_subject_text;

          if (moment(fromDate).isSame(toDate)) {
            if (moment(dateToCheck).isBetween(fromDate, toDate, null, '[]')) {
              if (userleaves.leave_to_slot === 'FH') {
                // leave = 'HD - F';
                // leave = 'FH';
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'FH',
                  leaveSubject: leaveSubject,
                });
              } else if (userleaves.leave_to_slot === 'SH') {
                // leave = 'HD - S';
                // leave = 'SH';
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'SH',
                  leaveSubject: leaveSubject,
                });
              } else {
                // leave = 'PL';
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'FD',
                  leaveSubject: leaveSubject,
                });
              }
            }
          } else {
            if (moment(dateToCheck).isBetween(fromDate, toDate)) {
              filterLeaves.push({
                id: userleaves.id,
                user_id: userleaves.user_id,
                name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                designation: userleaves.user.designation,
                employee_image: userleaves.user.employee_image,
                date: item,
                leaveType: 'FD',
                leaveSubject: leaveSubject,
              });
            }

            if (moment(dateToCheck).isSame(fromDate)) {
              if (userleaves.leave_from_slot === 'FH') {
                // leave = 'HD - F';
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'FH',
                  leaveSubject: leaveSubject,
                });
              } else if (userleaves.leave_from_slot === 'SH') {
                // leave = 'HD - S';
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'SH',
                  leaveSubject: leaveSubject,
                });
              } else {
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'FD',
                  leaveSubject: leaveSubject,
                });
              }
            }

            if (moment(dateToCheck).isSame(toDate)) {
              if (userleaves.leave_to_slot === 'FH') {
                // leave = 'HD - F';
                // leave = 'FH';
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'FH',
                  leaveSubject: leaveSubject,
                });
              } else if (userleaves.leave_to_slot === 'SH') {
                // leave = 'HD - S';
                // leave = 'SH';
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'SH',
                  leaveSubject: leaveSubject,
                });
              } else {
                // leave = 'PL';
                filterLeaves.push({
                  id: userleaves.id,
                  user_id: userleaves.user_id,
                  name: `${userleaves.user.first_name} ${userleaves.user.last_name}`,
                  designation: userleaves.user.designation,
                  employee_image: userleaves.user.employee_image,
                  date: item,
                  leaveType: 'FD',
                  leaveSubject: leaveSubject,
                });
              }
            }
          }
        });
      });

      // months.forEach(async (month) => {
      //   console.log('month', month);
      //   const daysInMonth = [];
      //   const monthDate = moment(`${month}-${year}`, 'MMMM-YYYY').startOf('month'); // specified month start date

      //   // if (year === moment().year() && moment(month, 'MMMM').month() > moment().month()) {
      //   //   return;
      //   // }
      //   // if (year > moment().year()) {
      //   //   return;
      //   // }

      //   _.times(monthDate.daysInMonth(), function () {
      //     daysInMonth.push(moment(monthDate).format('YYYY-MM-DD'));
      //     monthDate.add(1, 'day');
      //   });

      //   console.log('daysInMonth', daysInMonth);
      //   console.log('approvedLeaves', approvedLeaves);

      // });

      //   const userleave = ReportingUsers.map((user) => {
      //     // console.log('user.name', user.first_name);
      //     const monthAttendance = {};
      //     daysInMonth.forEach((item: never) => {
      //       const day = moment(item, 'MM/DD/YYYY').format('dddd');
      //       const date = moment(item, 'MM/DD/YYYY').date();
      //       let leave = null;
      //       //WEEKOFF
      //       // if (['Saturday', 'Sunday'].includes(day)) {
      //       //   monthAttendance[date] = 'WO';
      //       //   return;
      //       // }
      //       // //HOLIDAY
      //       // if (holidays.includes(item)) {
      //       //   monthAttendance[date] = 'H';
      //       //   return;
      //       // }
      //       //LEAVE
      //       user?.leaves.forEach((leaves) => {

      //         // console.log('fromDate', fromDate);
      //         // console.log('toDate', toDate);
      //         // console.log('dateToCheck', dateToCheck);
      //         // if (dateToCheck > fromDate && dateToCheck < toDate) {
      //         //   if (leaveBalance > 0) {
      //         //     leave = 'PL';
      //         //   }
      //         //   leave = 'UPL';
      //         // }
      //         // console.log('+fromDate', +fromDate);
      //         // console.log('+dateToCheck', +dateToCheck);
      //         if (+fromDate === +dateToCheck) {
      //           if (leaveBalance > 0) {
      //             if (leaves.leave_from_slot === 'FH') {
      //               // leave = 'HD - F';
      //               leave = 'FH';
      //             } else if (leaves.leave_from_slot === 'SH') {
      //               // leave = 'HD - S';
      //               leave = 'SH';
      //             } else {
      //               leave = 'FD';
      //             }
      //           } else {
      //             if (leaves.leave_from_slot === 'FH') {
      //               leave = 'UP_HD - F';
      //             } else if (leaves.leave_from_slot === 'SH') {
      //               leave = 'UP_HD - S';
      //             } else {
      //               leave = 'UPL';
      //             }
      //           }
      //         }
      //         if (+toDate === +dateToCheck) {
      //           if (leaveBalance > 0) {
      //             if (leaves.leave_to_slot === 'FH') {
      //               // leave = 'HD - F';
      //               leave = 'FH';
      //             } else if (leaves.leave_to_slot === 'SH') {
      //               // leave = 'HD - S';
      //               leave = 'SH';
      //             } else {
      //               // leave = 'PL';
      //               leave = 'FD';
      //             }
      //           } else {
      //             if (leaves.leave_to_slot === 'FH') {
      //               leave = 'UP_HD - F';
      //             } else if (leaves.leave_to_slot === 'SH') {
      //               leave = 'UP_HD - S';
      //             } else {
      //               leave = 'UPL';
      //             }
      //           }
      //         }
      //       });
      //       if (leave) {
      //         monthAttendance[date] = leave;
      //         return;
      //       }
      //       //PRESENT
      //       // monthAttendance[date] = 'P';
      //       monthAttendance[date] = null;
      //     });
      //     const MonthlyUserAttendance = monthAttendance;
      //     // console.log(`MonthlyUserAttendance of ${user.first_name}`, MonthlyUserAttendance);
      //     return { ...user, leaves: MonthlyUserAttendance };
      //   });
      //   // console.log('userleave', userleave);
      //   filterAttendace[month] = userleave;
      // });

      // // console.log('filterAttendace', filterAttendace);

      // res.send({ [year]: filterAttendace });

      const outputArray = [...new Map(filterLeaves.map((item) => [item['id'], item])).values()];

      // console.log('filterLeaves', filterLeaves);

      return res.status(200).json(APIResponseFormat._ResDataFound(filterLeaves));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getAttendance = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      return res.status(200).json(APIResponseFormat._ResDataFound([]));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default AttendanceController;
