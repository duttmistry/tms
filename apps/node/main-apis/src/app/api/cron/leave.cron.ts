import { APIResponseFormat } from '@tms-workspace/apis-core';
import { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import { MyEnum } from '../../database/interface/leave.interface';
import { Leave_Manual_Enum, Leave_Type } from '@tms-workspace/enum-data';
import _DB from '../../database/models';

const leavebalance = _DB.LeaveBalance;
const leaveopeningbalance = _DB.LeaveOpeningBalance;
const leavehistory = _DB.Leave;
const leaveHistoryTransection = _DB.LeaveTransectionHistory;
const user = _DB.User;
class LeaveCrons {
  // update closing balance
  public updateLeaveClosingBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentDate = new Date();
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      const currentYear = currentDate.getFullYear();
      const currentMonthLong = currentDate.toLocaleString('default', { month: 'long' });
      const currentMonth = currentDate.getMonth() + 1;
      if (tomorrow.getMonth() !== currentDate.getMonth()) {
        leaveopeningbalance
          .findAll({ where: { month: currentMonthLong } })
          .then((res) => {
            const leavedata = JSON.parse(JSON.stringify(res));
            leavedata.map(async (element) => {
              leavehistory
                .findAll({
                  where: {
                    user_id: element.user_id,
                    status: 'approved',
                    leave_type: element.leave_type,
                    [Op.or]: [
                      {
                        [Op.and]: [
                          Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('from_date')), currentMonth),
                          Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('from_date')), currentYear),
                        ],
                      },
                    ],
                  },
                })
                .then(async (res) => {
                  const hestorydata = JSON.parse(JSON.stringify(res));
                  let count = 0;
                  for (const row of hestorydata) {
                    if (moment(row.to_date).isSame(moment(), 'month')) {
                      count = count + row.no_of_days;
                    } else {
                      count = count + moment().endOf('month').diff(moment(row.from_date), 'days');
                    }
                  }
                  await leaveopeningbalance.update(
                    { ...element, closing_balance: element.closing_balance - count, leave_type: element.leave_type },
                    {
                      where: { month: currentMonthLong, user_id: element.user_id, leave_type: element.leave_type },
                    }
                  );
                })
                .catch((err) => console.log(err));
            });
          })
          .catch((err) => console.log(err));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  //credit opning leaves balance
  public creditLeaveBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentDate = new Date();
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
      const previousMonthLong = previousMonth.toLocaleString('default', { month: 'long' });
      const currentMonthLong = currentDate.toLocaleString('default', { month: 'long' });

      //last month 15th end day
      const previousMonth15th = moment().subtract(1, 'month').date(15).format('YYYY-MM-DDT24:00:00.000Z');

      //last to last month 16th start day
      const previousToPreviousMonth15th = moment().subtract(2, 'months').date(16).format('YYYY-MM-DDT00:00:00.000Z');

      // new User credit leaves
      user
        .findAll({
          where: {
            production_date: {
              [Op.between]: [previousToPreviousMonth15th, previousMonth15th],
            },
          },
        })
        .then((res) => {
          const joiningUserData = JSON.parse(JSON.stringify(res));
          joiningUserData.map(async (userinfo) => {
            await leaveopeningbalance.create({
              user_id: userinfo.id,
              opening_balance: 1,
              closing_balance: 0,
              leave_type: Leave_Type.CL,
              month: currentMonthLong,
            });
            await leaveopeningbalance.create({
              user_id: userinfo.id,
              opening_balance: 1,
              closing_balance: 0,
              leave_type: Leave_Type.PL,
              month: currentMonthLong,
            });
            await leavebalance.create({
              user_id: userinfo.id,
              current_balance: 0,
              applied_balance: 0,
              leave_type: Leave_Type.CL,
              reserved_balance: 0,
            });
            await leavebalance.create({
              user_id: userinfo.id,
              current_balance: 0,
              applied_balance: 0,
              leave_type: Leave_Type.PL,
              reserved_balance: 0,
            });
          });
        })
        .catch((err) => console.log(err));

      //opening balance credit
      leaveopeningbalance.findAll({ where: { month: previousMonthLong } }).then((res) => {
        const leavedata = JSON.parse(JSON.stringify(res));
        leavedata.map(async (element) => {
          await leaveopeningbalance.create({
            ...element,
            id: undefined,
            opening_balance: element.closing_balance + 1,
            closing_balance: 0,
            month: currentMonthLong,
          });
        });
      });

      // leave balance credit
      leavebalance
        .increment('current_balance', { by: 1, where: {} })
        .then(() => {
          leavebalance.findAll({ where: {} }).then((res) => {
            const leaves = JSON.parse(JSON.stringify(res));
            leaves.map(async (leave) => {
              await leaveHistoryTransection.create({
                user_id: leave.user_id,
                leave_type: leave.leave_type,
                credit: 1,
                debit: null,
                after_balance: leave.current_balance,
                remarks: 'Leave credit by system',
                created_by: null,
                created_date: new Date(),
              });
            });
            console.log('Current balance updated for all records');
          });
        })
        .catch((err) => console.log(err));
    } catch (error) {
      console.log(error, 'P_9');

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}
export default LeaveCrons;
