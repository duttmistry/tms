import { Response, NextFunction } from 'express';
import LeaveHistoryService from '../services/leave.service';
import LeaveSubjectsService from '../../leave_subjects/services/leave_subjects.service';
import LeaveBalanceService from '../../leave_balance/services/leave_balance.service';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import { Op, Sequelize } from 'sequelize';
import { Leave_Type } from '@tms-workspace/enum-data';
import moment, { Moment } from 'moment';

class LeaveFunctions {
  public leaveHistoryService = new LeaveHistoryService();
  public leaveSubjectsService = new LeaveSubjectsService();
  public leaveBalanceService = new LeaveBalanceService();

  public checkLeaveBalance = async (user_id: number, leaveDetailsLeaveType: string, noOfLeaveDetailsDay: number, res: Response) => {
    // Get Latest Balance of Users
    const validateLeaveBalance = await this.leaveHistoryService._getleaveBalance({
      user_id: user_id,
    });

    // Find CL leave Balance
    const leaveBalanceCL = validateLeaveBalance.find((lb) => lb.leave_type.toString() === Leave_Type.CL.toString() && lb.user_id === user_id);
    // Find PL leave Balance
    const leaveBalancePL = validateLeaveBalance.find((lb) => lb.leave_type.toString() === Leave_Type.PL.toString() && lb.user_id === user_id);

    // If Requested Leave Type LWP but user has Leave Balance of CL / PL
    if ((leaveBalanceCL.current_balance > 0 || leaveBalancePL.current_balance > 0) && leaveDetailsLeaveType === 'LWP') {
      return res.status(409).json(APIResponseFormat._ResCustomRequest('You have already have PL / CL. Please use available balance first'));
    }

    // If Requested Leave Type Not LWP but user does not have Leave Balance of Cl /PL
    const leaveBalance = validateLeaveBalance.find((lb) => lb.leave_type === leaveDetailsLeaveType && lb.user_id === user_id);

    if (leaveBalance.current_balance <= 0 && leaveDetailsLeaveType != 'LWP') {
      return res
        .status(409)
        .json(
          APIResponseFormat._ResCustomRequest(
            `Your leave balance has been exhausted. Please submit a request for an additional  ${noOfLeaveDetailsDay} Day(s) as Leave Without Pay (LWP).`
          )
        );
    }
    return;
  };

  public checkForDateAndSlot = async (
    user_id: number,
    from_date: Moment,
    to_date: Moment,
    from_slot: string,
    to_slot: string,
    leaveId: number,
    holidayListDates: Moment[]
  ) => {
    const fDate = from_date.format('YYYY-MM-DD');
    const tDate = to_date.format('YYYY-MM-DD');
    const validations = [];

    if (leaveId) {
      validations.push({
        id: {
          [Op.ne]: leaveId,
        },
      });
    }

    validations.push({
      [Op.or]: [
        {
          [Op.and]: [
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                [Op.gte]: new Date(fDate).toISOString().slice(0, 10),
                // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              }),
            },
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                [Op.lte]: new Date(tDate).toISOString().slice(0, 10),
                // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              }),
            },
          ],
        },
        {
          [Op.and]: [
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                [Op.lte]: new Date(tDate).toISOString().slice(0, 10),
                // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              }),
            },
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                [Op.gte]: new Date(fDate).toISOString().slice(0, 10),
                // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              }),
            },
          ],
        },
      ],
    });

    validations.push({
      user_id,
    });

    validations.push({
      status: {
        [Op.in]: ['PENDING', 'APPROVED'],
      },
    });

    const where = { [Op.and]: validations };

    const validateLeaveByDate = await this.leaveHistoryService._validateLeave(where);

    // Check Date with Pending Status leave Date

    // check selected date is Date available for leave
    let isDateAvailable = true;
    let isFromDateAvailable = true;
    let isToDateAvailable = true;
    let isFromSlotAvailable = true;
    let isToSlotAvailable = true;

    let isLeaveAvailable = false;
    let isHoliday = false;
    let isWeekend = false;

    //Check FromDate & ToDate
    if (moment(fDate).weekday() === 0 || moment(fDate).weekday() === 6) {
      //Check Is FromDate on Weekend
      isWeekend = true;
      isFromDateAvailable = false;
      isFromSlotAvailable = false;
    } else if (moment(tDate).weekday() === 0 || moment(tDate).weekday() === 6) {
      //Check Is ToDate on Weekend
      isWeekend = true;
      isToDateAvailable = false;
      isToSlotAvailable = false;
    } else if (holidayListDates.some((date) => date.isSame(moment(fDate), 'day'))) {
      //Check Is FromDate on Holiday
      isHoliday = true;
      isFromDateAvailable = false;
      isFromSlotAvailable = false;
    } else if (holidayListDates.some((date) => date.isSame(moment(tDate), 'day'))) {
      //Check Is ToDate on Holiday
      isHoliday = true;
      isToDateAvailable = false;
      isToSlotAvailable = false;
    } else {
      for (const item of validateLeaveByDate) {
        const itemFromDate = moment(item.from_date).format('YYYY-MM-DD');
        const itemToDate = moment(item.to_date).format('YYYY-MM-DD');
        const itemFromSlot = item.leave_from_slot;
        const itemToSlot = item.leave_to_slot;

        // If Only 1 day selected Then Check is Date between Other leaves Dates
        if (
          moment(fDate).isSame(tDate) &&
          moment(fDate).isBetween(itemFromDate, itemToDate, null, '[]') &&
          (itemFromSlot === from_slot || itemFromSlot === 'FD') &&
          (itemToSlot === to_slot || itemToSlot === 'FD')
        ) {
          isDateAvailable = false;
          isFromDateAvailable = false;
          isToDateAvailable = false;
          isFromSlotAvailable = false;
          isToSlotAvailable = false;
          break;
        }

        // If Only 1 day selected Then Check is Date between Other leaves Dates
        // if (
        //   moment(fDate).isSame(tDate) &&
        //   moment(fDate).isBetween(itemFromDate, itemToDate, null, '[]') &&
        //   (itemFromSlot != from_slot || itemFromSlot != 'FD') &&
        //   (itemToSlot != to_slot || itemToSlot != 'FD')
        // ) {
        //   isFromSlotAvailable = false;
        //   isToSlotAvailable = false;
        //   break;
        // }

        if (
          moment(fDate).isSame(tDate) &&
          moment(fDate).isBetween(itemFromDate, itemToDate, null, '[]') &&
          (itemFromSlot != from_slot || itemFromSlot != 'FD') &&
          (itemToSlot != to_slot || itemToSlot != 'FD') &&
          from_slot === 'FD'
        ) {
          isDateAvailable = false;
          isFromDateAvailable = false;
          isToDateAvailable = false;
          isFromSlotAvailable = false;
          isToSlotAvailable = false;
          break;
        }

        // Selected More then 2 days Then Check is any Leave Available between Selected Dates
        if (
          !moment(fDate).isSame(tDate) &&
          (moment(itemFromDate).isBetween(fDate, tDate, null) || moment(itemToDate).isBetween(fDate, tDate, null)) &&
          (itemFromSlot === from_slot || itemFromSlot === 'FD') &&
          (itemToSlot === 'FD' || itemToSlot === to_slot)
        ) {
          isLeaveAvailable = true;
          break;
        }

        if (!moment(fDate).isSame(tDate) && moment(itemFromDate).isSame(fDate) && (itemFromSlot === from_slot || itemFromSlot === 'FD')) {
          isLeaveAvailable = true;
          isFromDateAvailable = false;
          isFromSlotAvailable = false;
          break;
        }

        if (!moment(fDate).isSame(tDate) && moment(itemFromDate).isSame(tDate) && (itemToSlot === 'FD' || itemToSlot === to_slot)) {
          isLeaveAvailable = true;
          isToDateAvailable = false;
          isToSlotAvailable = false;
          break;
        }

        if (!moment(fDate).isSame(tDate) && moment(itemToDate).isSame(fDate) && (itemFromSlot === from_slot || itemFromSlot === 'FD')) {
          isLeaveAvailable = true;
          isFromDateAvailable = false;
          isFromSlotAvailable = false;
          break;
        }

        if (!moment(fDate).isSame(tDate) && moment(itemToDate).isSame(tDate) && (itemToSlot === 'FD' || itemToSlot === to_slot)) {
          isLeaveAvailable = true;
          isToDateAvailable = false;
          isToSlotAvailable = false;
          break;
        }

        //  Selected More then 2 days Then Check  from Dates
        if (
          !moment(fDate).isSame(tDate) &&
          moment(fDate).isBetween(itemFromDate, itemToDate) &&
          (itemFromSlot === from_slot || itemFromSlot === 'FD')
        ) {
          isFromDateAvailable = false;
          isFromSlotAvailable = false;
          break;
        }

        //  Selected More then 2 days Then Check  to Dates
        if (!moment(fDate).isSame(tDate) && moment(tDate).isBetween(itemFromDate, itemToDate) && (itemToSlot === 'FD' || itemToSlot === to_slot)) {
          isToDateAvailable = false;
          isToSlotAvailable = false;
          break;
        }

        if (
          !moment(fDate).isSame(tDate) &&
          moment(fDate).isBetween(itemFromDate, itemToDate, null, '[]') &&
          (itemFromSlot === from_slot || from_slot === 'FD') &&
          itemFromSlot !== 'FD'
        ) {
          isFromSlotAvailable = false;
          break;
        }

        if (
          !moment(fDate).isSame(tDate) &&
          moment(tDate).isBetween(itemFromDate, itemToDate, null, '[]') &&
          (itemToSlot === to_slot || to_slot === 'FD') &&
          itemToSlot !== 'FD'
        ) {
          isToSlotAvailable = false;
          break;
        }
      }
    }

    return {
      fDate: moment(fDate),
      tDate: moment(tDate),
      from_slot,
      to_slot,
      isDateAvailable,
      isFromDateAvailable,
      isToDateAvailable,
      isFromSlotAvailable,
      isToSlotAvailable,
      isLeaveAvailable,
      isHoliday,
      isWeekend,
    };
  };

  public checkForContinousLeave = async (
    user_id: number,
    from_date: Moment,
    to_date: Moment,
    from_slot: string,
    to_slot: string,
    leaveId: number
  ) => {
    const fDate = from_date;
    const previousFiveDayDate = from_date.clone().subtract(5, 'day');
    const tDate = to_date;
    const nextFiveDayDate = to_date.clone().add(5, 'days');
    let previousDate = null;
    const nextDate = null;
    const betweenDate = null;

    // Check Previous Day

    do {
      previousDate = previousDate ? previousDate : fDate;
      previousDate = previousDate.clone().subtract(1, 'days');

      const validations = [];

      if (leaveId) {
        validations.push({
          id: {
            [Op.ne]: leaveId,
          },
        });
      }

      validations.push({
        [Op.or]: [
          {
            [Op.and]: [
              {
                [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                  [Op.lte]: new Date(previousDate).toISOString().slice(0, 10),
                  // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                }),
              },
              {
                [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                  [Op.gte]: new Date(previousDate).toISOString().slice(0, 10),
                  // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                }),
              },
            ],
          },
        ],
      });

      validations.push({
        user_id,
      });

      validations.push({
        status: {
          [Op.in]: ['PENDING', 'APPROVED'],
        },
      });

      const where = { [Op.and]: validations };

      const validateLeaveByDate = await this.leaveHistoryService._validateLeave(where);

      //console.log('validateLeaveByDate', validateLeaveByDate);

      const isFullday = false;

      // validateLeaveByDate.forEach((leave) => {
      //   if (moment(leave.from_date).isSame(leave.to_date)) {
      //     console.log('<<<<<====================SAME DATE LEAVE ===========================>');
      //     console.log(leave);
      //   } else {
      //     console.log('<<<<<====================NOT SAME DATE LEAVE ===========================>');
      //     console.log(leave);
      //   }
      // });

      // if (beetWeenAsHolidayOrWeekOff) {
      //   // check if leave previousDate is any of the FD leave of the

      //   if (from_slot === 'FD' && to_slot === 'FD') {
      //     // update from date
      //     isSandwichLeave = true;
      //   } else {
      //     isSandwichLeave = false;
      //   }
      // }

      // condole.log('betweenDate.isSame(endDate)', betweenDate.isSame(endDate));
    } while (!previousDate.isSame(previousFiveDayDate));

    // // Create arrays to hold the continuous leave periods
    // const previousDaysLeave = [];
    // const nextDaysLeave = [];

    // // Check for continuous leave in the 5 days leading up to the fromDate
    // for (let i = 1; i <= 5; i++) {
    //   const currentDate = from_date.clone().subtract(1, 'days');
    //   //   const validations = [];

    //   //   if (leaveId) {
    //   //     validations.push({
    //   //       id: {
    //   //         [Op.ne]: leaveId,
    //   //       },
    //   //     });
    //   //   }

    //   //   validations.push({
    //   //     [Op.or]: [
    //   //       {
    //   //         [Op.and]: [
    //   //           {
    //   //             [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
    //   //               [Op.lte]: new Date(previousDate).toISOString().slice(0, 10),
    //   //               // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
    //   //             }),
    //   //           },
    //   //           {
    //   //             [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
    //   //               [Op.gte]: new Date(previousDate).toISOString().slice(0, 10),
    //   //               // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
    //   //             }),
    //   //           },
    //   //         ],
    //   //       },
    //   //     ],
    //   //   });

    //   //   validations.push({
    //   //     user_id,
    //   //   });

    //   //   validations.push({
    //   //     status: {
    //   //       [Op.in]: ['PENDING', 'APPROVED'],
    //   //     },
    //   //   });

    //   //   const where = { [Op.and]: validations };

    //   //   const validateLeaveByDate = await this.leaveHistoryService._validateLeave(where);

    //   if (dateFns.isWeekend(currentDate) || holidays.includes(dateFns.format(currentDate, 'yyyy-MM-dd'))) {
    //     previousDaysLeave.push(dateFns.format(currentDate, 'yyyy-MM-dd'));
    //   } else {
    //     break; // If a non-leave day is encountered, stop checking
    //   }
    // }

    // // Check for continuous leave in the 5 days following the toDate
    // for (let i = 1; i <= 5; i++) {
    //   const currentDate = dateFns.addDays(toDate, i);

    //   if (dateFns.isWeekend(currentDate) || holidays.includes(dateFns.format(currentDate, 'yyyy-MM-dd'))) {
    //     nextDaysLeave.push(dateFns.format(currentDate, 'yyyy-MM-dd'));
    //   } else {
    //     break; // If a non-leave day is encountered, stop checking
    //   }
    // }

    // return {
    //   previousDaysLeave,
    //   nextDaysLeave,
    // };

    // // Check For Next Five Days

    // do {
    //   nextDate = nextDate ? nextDate : tDate;
    //   nextDate = nextDate.clone().add(1, 'days');

    //   const validations = [];

    //   if (leaveId) {
    //     validations.push({
    //       id: {
    //         [Op.ne]: leaveId,
    //       },
    //     });
    //   }

    //   validations.push({
    //     [Op.or]: [
    //       {
    //         [Op.and]: [
    //           {
    //             [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
    //               [Op.lte]: new Date(nextDate).toISOString().slice(0, 10),
    //               // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
    //             }),
    //           },
    //           {
    //             [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
    //               [Op.gte]: new Date(nextDate).toISOString().slice(0, 10),
    //               // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
    //             }),
    //           },
    //         ],
    //       },
    //     ],
    //   });

    //   validations.push({
    //     user_id,
    //   });

    //   validations.push({
    //     status: {
    //       [Op.in]: ['PENDING', 'APPROVED'],
    //     },
    //   });

    //   const where = { [Op.and]: validations };

    //   const validateLeaveByDate = await this.leaveHistoryService._validateLeave(where);

    //   console.log(
    //     '<===========================================================>validateLeavenextDateByDate ===========================================================>',
    //     validateLeaveByDate
    //   );

    //   const isFullday = false;

    //   validateLeaveByDate.forEach((leave) => {
    //     if (moment(leave.from_date).isSame(leave.to_date)) {
    //       console.log('<<<<<====================SAME DATE LEAVE ===========================>');
    //       console.log(leave);
    //     } else {
    //       console.log('<<<<<====================NOT SAME DATE LEAVE ===========================>');
    //       console.log(leave);
    //     }
    //   });

    //   // if (beetWeenAsHolidayOrWeekOff) {
    //   //   // check if leave previousDate is any of the FD leave of the

    //   //   if (from_slot === 'FD' && to_slot === 'FD') {
    //   //     // update from date
    //   //     isSandwichLeave = true;
    //   //   } else {
    //   //     isSandwichLeave = false;
    //   //   }
    //   // }

    //   // condole.log('betweenDate.isSame(endDate)', betweenDate.isSame(endDate));
    // } while (!nextDate.isSame(nextFiveDayDate));
  };

  public countDays = (fDate, tDate, isSandwichLeave, holidayListDates, isHoliday, isWeekend, fromSlot, toSlot) => {
    const startDate = moment(fDate);
    const endDate = moment(tDate);
    let dayCount = 0;
    const currentDate = startDate;

    while (currentDate.isSameOrBefore(endDate)) {
      if (!isSandwichLeave) {
        if (currentDate.day() !== 0 && currentDate.day() !== 6) {
          // Check if the current date is a weekday (0 is Sunday, 6 is Saturday)
          const isHoliday = holidayListDates.some((holiday) => currentDate.isSame(holiday, 'day'));
          if (!isHoliday) {
            dayCount++;
          }
        }
      } else {
        dayCount++;
      }
      currentDate.add(1, 'day');
    }

    let remainingNoOfDays = isHoliday === true || isWeekend === true ? 0 : dayCount;

    if (isHoliday === false && isWeekend === false) {
      if (remainingNoOfDays === 1) {
        if (fromSlot === toSlot && fromSlot !== 'FD') {
          remainingNoOfDays = remainingNoOfDays - 0.5;
        }
      } else {
        if (fromSlot != 'FD') {
          remainingNoOfDays = remainingNoOfDays - 0.5;
        }

        if (toSlot != 'FD') {
          remainingNoOfDays = remainingNoOfDays - 0.5;
        }
      }
    }

    return remainingNoOfDays;
  };

  public checkForSandwichLeave = async (
    user_id: number,
    fdate: Moment,
    tdate: Moment,
    from_slot: string,
    to_slot: string,
    holidayListDates: Moment[],
    leaveId: number,
    isHoliday,
    isWeekend
  ) => {
    // constant Variable
    const userId = user_id;
    const startDate = fdate.startOf('day');
    const endDate = tdate.startOf('day');
    const holidayList = holidayListDates;

    // Local Variable For Check Sandwich leave

    let previousDayAsHolidayOrWeekOff = false;
    let nextDayAsHolidayOrWeekOff = false;
    let PDHW = false;
    let NDHW = false;
    let previousDate = null;
    let nextDate = null;
    let PD = null;
    let ND = null;
    let day_count = null;
    let between_day_count = null;

    let isSandwichLeave = false;
    let _finalLeaveStartDate = startDate;
    let _finalLeaveEndDate = endDate;

    let previousIterationCount = 0;
    let nextIterationCount = 0;

    // Check Sandwich Leave In Previous Days
    do {
      previousIterationCount++;
      previousDate = previousDate ? previousDate : startDate;
      previousDate = previousDate.clone().subtract(1, 'day');
      previousDate = previousDate.startOf('day');
      previousDayAsHolidayOrWeekOff =
        holidayList.some((date) => date.isSame(previousDate, 'day')) || previousDate.weekday() === 0 || previousDate.weekday() === 6;

      console.log('previousDate', previousDate);

      // If Previous Day is NOT Holiday or Week Off then check for Leave
      if (!previousDayAsHolidayOrWeekOff) {
        const checkForLeave = await this.leaveHistoryService._getAllLeaves({
          [Op.and]: [
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                [Op.lte]: new Date(previousDate.format('YYYY-MM-DD')).toISOString().slice(0, 10),
              }),
            },
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                [Op.gte]: new Date(previousDate.format('YYYY-MM-DD')).toISOString().slice(0, 10),
              }),
            },
            {
              user_id: userId,
              id: {
                [Op.notIn]: leaveId ? [leaveId] : [],
              },
            },
            {
              status: {
                [Op.in]: ['PENDING', 'APPROVED'],
              },
            },
          ],
        });

        const dataExistsForPreviousDate = checkForLeave.length > 0 ? true : false;

        console.log('dataExistsForPreviousDate', dataExistsForPreviousDate);

        if (dataExistsForPreviousDate && previousIterationCount !== 1 && from_slot === 'FD') {
          checkForLeave.forEach((leave) => {
            // console.log(leave, 'leave');
            const fromDate = moment(leave.from_date).format('YYYY-MM-DD');
            const toDate = moment(leave.to_date).format('YYYY-MM-DD');
            let betweenDateinc = null;

            if (!moment(leave.from_date).isSame(moment(leave.to_date))) {
              do {
                betweenDateinc = betweenDateinc ? betweenDateinc : moment(leave.from_date);

                betweenDateinc = betweenDateinc.startOf('day');

                if (betweenDateinc.isSame(moment(previousDate).startOf('day'))) {
                  if (betweenDateinc.isSame(moment(leave.from_date).startOf('day')) && leave.leave_from_slot === 'FD') {
                    console.log('FD NOT SAME DAY FROM DATE FD');
                    // acc += developmentConfig.default.DAILY_WORKING_MINUTES;
                    _finalLeaveStartDate = previousDate.clone().add(1, 'days');
                    isSandwichLeave = true;
                  }

                  if (betweenDateinc.isSame(moment(leave.to_date).startOf('day')) && leave.leave_to_slot === 'FD') {
                    console.log('elFD NOT SAME DAY TO DATE FD');
                    // acc += developmentConfig.default.DAILY_WORKING_MINUTES;
                    _finalLeaveStartDate = previousDate.clone().add(1, 'days');
                    isSandwichLeave = true;
                  }

                  if (betweenDateinc.isBetween(moment(leave.from_date).startOf('day'), moment(leave.to_date).startOf('day'))) {
                    console.log('elFD NOT SAME DAY BETWEEN DATE FD');
                    // acc += developmentConfig.default.DAILY_WORKING_MINUTES;
                    _finalLeaveStartDate = previousDate.clone().add(1, 'days');
                    isSandwichLeave = true;
                  }
                }
                betweenDateinc = betweenDateinc.clone().add(1, 'days');
              } while (!betweenDateinc.isSame(moment(leave.to_date).clone().add(1, 'days').startOf('day')));
            } else {
              if (fromDate === toDate && moment(fromDate).isSame(moment(previousDate).startOf('day')) && leave.leave_from_slot === 'FD') {
                // acc += developmentConfig.default.DAILY_WORKING_MINUTES;
                console.log('FD SAME DAY FROM DATE FD');
                _finalLeaveStartDate = previousDate.clone().add(1, 'days');
                isSandwichLeave = true;
              }
            }
          });
        } else {
          _finalLeaveStartDate = startDate;
        }
      }
    } while (previousDayAsHolidayOrWeekOff);

    // Check Sandwich Leave in Next Days
    do {
      nextIterationCount++;
      nextDate = nextDate ? nextDate : endDate;
      nextDate = nextDate.clone().add(1, 'days');
      nextDate = nextDate.startOf('day');
      nextDayAsHolidayOrWeekOff = holidayList.some((date) => date.isSame(nextDate, 'day')) || nextDate.weekday() === 0 || nextDate.weekday() === 6;

      console.log(nextDate, 'nextDate');

      // If Previous Day is NOT Holiday or Week Off then check for Leave
      if (!nextDayAsHolidayOrWeekOff) {
        const checkForLeave = await this.leaveHistoryService._getAllLeaves({
          [Op.and]: [
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                [Op.lte]: new Date(nextDate.format('YYYY-MM-DD')).toISOString().slice(0, 10),
              }),
            },
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                [Op.gte]: new Date(nextDate.format('YYYY-MM-DD')).toISOString().slice(0, 10),
              }),
            },
            {
              user_id: userId,
              id: {
                [Op.notIn]: leaveId ? [leaveId] : [],
              },
            },
            {
              status: {
                [Op.in]: ['PENDING', 'APPROVED'],
              },
            },
          ],
        });
        const dataExistsForNextDate = checkForLeave.length > 0 ? true : false;

        console.log('dataExistsForNextDate', dataExistsForNextDate);

        if (dataExistsForNextDate && nextIterationCount !== 1 && from_slot === 'FD') {
          checkForLeave.forEach((leave) => {
            // console.log(leave, 'leave');
            const fromDate = moment(leave.from_date).format('YYYY-MM-DD');
            const toDate = moment(leave.to_date).format('YYYY-MM-DD');
            let betweenDateinc = null;

            console.log('!moment(leave.from_date).isSame(moment(leave.to_date))', !moment(leave.from_date).isSame(moment(leave.to_date)));

            if (!moment(leave.from_date).isSame(moment(leave.to_date))) {
              do {
                betweenDateinc = betweenDateinc ? betweenDateinc : moment(leave.from_date);

                betweenDateinc = betweenDateinc.startOf('day');

                if (betweenDateinc.isSame(moment(nextDate).startOf('day'))) {
                  if (betweenDateinc.isSame(moment(leave.from_date).startOf('day')) && leave.leave_from_slot === 'FD') {
                    console.log('FD NOT SAME DAY FROM DATE FD');
                    // acc += developmentConfig.default.DAILY_WORKING_MINUTES;
                    _finalLeaveEndDate = nextDate.clone().add(1, 'days');
                    isSandwichLeave = true;
                  }

                  if (betweenDateinc.isSame(moment(leave.to_date).startOf('day')) && leave.leave_to_slot === 'FD') {
                    console.log('elFD NOT SAME DAY TO DATE FD');
                    // acc += developmentConfig.default.DAILY_WORKING_MINUTES;
                    _finalLeaveEndDate = nextDate.clone().add(1, 'days');
                    isSandwichLeave = true;
                  }

                  if (betweenDateinc.isBetween(moment(leave.from_date).startOf('day'), moment(leave.to_date).startOf('day'))) {
                    console.log('elFD NOT SAME DAY BETWEEN DATE FD');
                    // acc += developmentConfig.default.DAILY_WORKING_MINUTES;
                    _finalLeaveEndDate = nextDate.clone().add(1, 'days');
                    isSandwichLeave = true;
                  }
                }
                betweenDateinc = betweenDateinc.clone().add(1, 'days');
              } while (!betweenDateinc.isSame(moment(leave.to_date).clone().add(1, 'days').startOf('day')));
            } else {
              if (fromDate === toDate && moment(fromDate).isSame(moment(nextDate).startOf('day')) && leave.leave_from_slot === 'FD') {
                // acc += developmentConfig.default.DAILY_WORKING_MINUTES;
                console.log('FD SAME DAY FROM DATE FD');
                _finalLeaveEndDate = nextDate.clone().add(1, 'days');
                isSandwichLeave = true;
              }
            }
          });
        } else {
          _finalLeaveEndDate = endDate;
        }
      }
    } while (nextDayAsHolidayOrWeekOff);

    day_count = this.countDays(_finalLeaveStartDate, _finalLeaveEndDate, isSandwichLeave, holidayList, isHoliday, isWeekend, from_slot, to_slot);

    // Check Sandwich Leave in Between From Date - To Date
    if (!_finalLeaveStartDate.startOf('day').isSame(_finalLeaveEndDate.startOf('day'))) {
      day_count = _finalLeaveEndDate.diff(_finalLeaveStartDate, 'days') + 1; // Get All Day Count
      let middleDate = null;
      console.log(day_count, 'day_count');
      let holidaycount = 0;

      if (to_slot != 'FD' && from_slot !== 'FD') {
        console.log('BOTH SLOT HLF DAY');

        day_count = day_count - 1;

        do {
          ND = ND ? ND : _finalLeaveEndDate;
          ND = ND.clone().subtract(1, 'days');
          ND = ND.startOf('day');
          NDHW = holidayList.some((date) => date.isSame(ND, 'day')) || ND.weekday() === 0 || ND.weekday() === 6;

          if (NDHW) {
            holidaycount++;
          } else {
            middleDate = ND;
          }
        } while (NDHW);

        console.log('middleDate====>', middleDate);

        do {
          PD = PD ? PD : _finalLeaveStartDate;
          PD = PD.clone().add(1, 'days');
          PD = PD.startOf('day');
          PDHW = holidayList.some((date) => date.isSame(PD, 'day')) || PD.weekday() === 0 || PD.weekday() === 6;

          if (PDHW) {
            holidaycount++;
          }
        } while (PDHW && !PD.isSame(middleDate.startOf('day')));
      } else if (to_slot != 'FD' && from_slot === 'FD') {
        console.log('TO SLOT HLF DAY');
        day_count = day_count - 0.5;
        do {
          ND = ND ? ND : _finalLeaveEndDate;
          ND = ND.clone().subtract(1, 'days');
          ND = ND.startOf('day');
          NDHW = holidayList.some((date) => date.isSame(ND, 'day')) || ND.weekday() === 0 || ND.weekday() === 6;

          if (NDHW) {
            holidaycount++;
          }
        } while (NDHW);
      } else if (from_slot !== 'FD' && to_slot === 'FD') {
        day_count = day_count - 0.5;
        console.log('FROM SLOT HLF DAY');
        do {
          PD = PD ? PD : _finalLeaveStartDate;
          PD = PD.clone().add(1, 'days');
          PD = PD.startOf('day');
          PDHW = holidayList.some((date) => date.isSame(PD, 'day')) || PD.weekday() === 0 || PD.weekday() === 6;

          if (PDHW) {
            holidaycount++;
          }
        } while (PDHW);
      }

      day_count = day_count - holidaycount;

      let dayCount = 0;
      const currentDate = _finalLeaveStartDate.clone();

      while (currentDate.isSameOrBefore(_finalLeaveEndDate.startOf('day'))) {
        if (holidayList.some((date) => date.isSame(currentDate, 'day')) || currentDate.weekday() === 0 || currentDate.weekday() === 6) {
          dayCount++;
        }
        currentDate.add(1, 'day');
      }

      if (dayCount !== holidaycount) {
        isSandwichLeave = true;
      }

      console.log('\x1b[2m', '\x1b[31m', '\x1b[44m', dayCount, day_count, holidaycount, isSandwichLeave, between_day_count, '\x1b[0m');
    }

    return { _finalLeaveStartDate, _finalLeaveEndDate, isSandwichLeave, day_count };
  };

  public updateLeaveBalanceF = async (res, action, userId, leaveTypes) => {
    // Get Latest Balance of Users
    const validateLeaveBalance = await this.leaveHistoryService._getleaveBalance({
      user_id: userId,
    });

    const updateLeaveBalance = leaveTypes.map((type) => {
      const leaveBalance = validateLeaveBalance.find((lb) => lb.leave_type === type.leave_type);

      switch (action) {
        case 'addLeave':
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance:
              type.leave_type === 'LWP' ? Number(leaveBalance.current_balance) : Number(leaveBalance.current_balance) - Number(type.leave_days),
            reserved_balance:
              type.leave_type === 'LWP'
                ? Number(leaveBalance.reserved_balance) + Number(type.leave_days)
                : Number(leaveBalance.reserved_balance) + Number(type.leave_days),
            applied_balance: type.leave_type === 'LWP' ? Number(leaveBalance.applied_balance) : Number(leaveBalance.applied_balance),
          };

          break;

        case 'updateLeave':
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance:
              type.leave_type === 'LWP' ? Number(leaveBalance.current_balance) : Number(leaveBalance.current_balance) - Number(type.leave_days),
            reserved_balance:
              type.leave_type === 'LWP'
                ? Number(leaveBalance.reserved_balance) + Number(type.leave_days)
                : Number(leaveBalance.reserved_balance) + Number(type.leave_days),
            applied_balance: type.leave_type === 'LWP' ? Number(leaveBalance.applied_balance) : Number(leaveBalance.applied_balance),
          };

          break;

        case 'approveLeave':
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance:
              type.leave_type === 'LWP' ? Number(leaveBalance.current_balance) + Number(type.leave_days) : Number(leaveBalance.current_balance),
            applied_balance:
              type.leave_type === 'LWP' ? Number(leaveBalance.applied_balance) : Number(leaveBalance.applied_balance) + Number(type.leave_days),
            reserved_balance:
              type.leave_type === 'LWP'
                ? Number(leaveBalance.reserved_balance) - Number(type.leave_days)
                : Number(leaveBalance.reserved_balance) - Number(type.leave_days),
          };

          break;

        case 'rejectorcancelLeave':
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance:
              type.leave_type === 'LWP' ? Number(leaveBalance.current_balance) : Number(leaveBalance.current_balance) + Number(type.leave_days),
            applied_balance: type.leave_type === 'LWP' ? Number(leaveBalance.applied_balance) : Number(leaveBalance.applied_balance),
            reserved_balance:
              type.leave_type === 'LWP'
                ? Number(leaveBalance.reserved_balance) - Number(type.leave_days)
                : Number(leaveBalance.reserved_balance) - Number(type.leave_days),
          };
          break;

        case 'cancelApprovedLeave':
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance:
              type.leave_type === 'LWP'
                ? Number(leaveBalance.current_balance) - Number(type.leave_days)
                : Number(leaveBalance.current_balance) + Number(type.leave_days),
            applied_balance:
              type.leave_type === 'LWP' ? Number(leaveBalance.applied_balance) : Number(leaveBalance.applied_balance) - Number(type.leave_days),
            reserved_balance: type.leave_type === 'LWP' ? Number(leaveBalance.reserved_balance) : Number(leaveBalance.reserved_balance),
          };
          break;

        case 'resetLeave':
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance:
              type.leave_type === 'LWP' ? Number(leaveBalance.current_balance) : Number(leaveBalance.current_balance) + Number(type.leave_days),
            applied_balance: type.leave_type === 'LWP' ? 0 : Number(leaveBalance.applied_balance),
            reserved_balance:
              type.leave_type === 'LWP'
                ? Number(leaveBalance.reserved_balance) - Number(type.leave_days)
                : Number(leaveBalance.reserved_balance) - Number(type.leave_days),
          };
          break;

        case 'updateApprovedLeave':
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance:
              type.leave_type === 'LWP'
                ? Number(leaveBalance.current_balance) + Number(type.leave_days)
                : Number(leaveBalance.current_balance) - Number(type.leave_days),
            reserved_balance: type.leave_type === 'LWP' ? Number(leaveBalance.reserved_balance) : Number(leaveBalance.reserved_balance),
            applied_balance:
              type.leave_type === 'LWP' ? Number(leaveBalance.applied_balance) : Number(leaveBalance.applied_balance) + Number(type.leave_days),
          };

          break;

        case 'resetApprovedLeave':
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance:
              type.leave_type === 'LWP'
                ? Number(leaveBalance.current_balance) - Number(type.leave_days)
                : Number(leaveBalance.current_balance) + Number(type.leave_days),
            applied_balance: type.leave_type === 'LWP' ? 0 : Number(leaveBalance.applied_balance) - Number(type.leave_days),
            reserved_balance: type.leave_type === 'LWP' ? Number(leaveBalance.reserved_balance) : Number(leaveBalance.reserved_balance),
          };
          break;

        default:
          return {
            id: leaveBalance.id,
            user_id: leaveBalance.user_id,
            leave_type: type.leave_type,
            current_balance: Number(leaveBalance.current_balance),
            reserved_balance: Number(leaveBalance.reserved_balance),
            applied_balance: Number(leaveBalance.applied_balance),
          };

          break;
      }
    });

    const updateLeaveBalanceResponse = await this.leaveHistoryService._updateleaveBalanceNew(updateLeaveBalance);

    if (!updateLeaveBalanceResponse) {
      return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Balance'));
    }
  };

  //Personal Leave API's
  public getBalanceLeave = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.headers.id;

      const leaveBalance = await this.leaveHistoryService._getleaveBalance({
        user_id: user_id,
      });

      if (!leaveBalance) return res.status(404).json(APIResponseFormat._ResDataNotFound());

      res.status(200).json(APIResponseFormat._ResDataFound(leaveBalance));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default LeaveFunctions;
