import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import LeaveHistoryService from '../services/leave.service';
import LeaveSubjectsService from '../../leave_subjects/services/leave_subjects.service';
import LeaveBalanceService from '../../leave_balance/services/leave_balance.service';
import LeaveFunctions from './leaveFunction';
import { Pagination, APIResponseFormat } from '@tms-workspace/apis-core';
import { FileService, MulterService, BasePath } from '@tms-workspace/file-upload';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import { Op, Sequelize } from 'sequelize';
import { Leave_Type } from '@tms-workspace/enum-data';
import moment from 'moment';
import eventEmitter from '../../../../core/leave-txn-events';
import { eventEmitterLeave } from '@tms-workspace/preference';

class LeaveController {
  public leaveHistoryService = new LeaveHistoryService();
  public leaveSubjectsService = new LeaveSubjectsService();
  public leaveBalanceService = new LeaveBalanceService();
  public leaveFunctions = new LeaveFunctions();

  public getLeaveHistory = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, from_date, to_date, leave_type, status } = req.query;

      const fromDate = from_date ? new Date(from_date as string) : null;
      const toDate = to_date ? new Date(to_date as string) : null;
      const leaveType = leave_type;
      const LeaveStatus = status;
      const user_id = req.headers.id ? Number(req.headers.id) : req.user.id;
      let where = {};
      const validation = [];

      // Check Valid Date

      if (fromDate && toDate) {
        if (fromDate > toDate) {
          return res.status(409).json(APIResponseFormat._ResCustomRequest(`Invalid date range. Please reselect.`));
        }
        validation.push({
          [Op.or]: [
            {
              [Op.or]: [
                {
                  [Op.and]: [
                    {
                      [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                        [Op.gte]: new Date(fromDate).toISOString().slice(0, 10),
                        // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                      }),
                    },
                    {
                      [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                        [Op.lte]: new Date(toDate).toISOString().slice(0, 10),
                        // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                      }),
                    },
                  ],
                },
                {
                  [Op.and]: [
                    {
                      [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                        [Op.lte]: new Date(toDate).toISOString().slice(0, 10),
                        // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                      }),
                    },
                    {
                      [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                        [Op.gte]: new Date(fromDate).toISOString().slice(0, 10),
                        // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                      }),
                    },
                  ],
                },
              ],
            },
          ],
        });
      }

      if (leaveType) {
        validation.push({ leave_type: leaveType });
      }

      if (LeaveStatus) {
        validation.push({ status: LeaveStatus });
      }

      validation.push({
        user_id: user_id,
      });

      where = { [Op.and]: validation };
      // const where = {
      //   user_id: user_id,
      // };

      //         {
      //           user_id,
      //         },
      //         { status: 'PENDING' },
      //       ],

      const count = await this.leaveHistoryService._getLeavesCount(where);

      if (count < 0) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const leaveHistory = await this.leaveHistoryService._getAllLeaves(where, {}, +page, +limit, sortBy as string, orderBy as string);

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(leaveHistory, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      console.log(error, 'error');

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getSingleLeaveHistory = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const leaveId = Number(req.headers.id);

      const user_id = req.headers.id;

      const where = {
        user_id: user_id,
      };

      const leaveHistory = await this.leaveHistoryService._getLeaveById(leaveId);

      if (!leaveHistory) res.status(404).json(APIResponseFormat._ResDataNotFound({}));

      res.status(200).json(APIResponseFormat._ResDataFound(leaveHistory));
    } catch (error) {
      // // condole.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getBalanceAfterLeaveBook = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const leaveId = Number(req.headers.id) || null;
      const userId = Number(req.headers.user_id);

      const fromDate = moment(req.body.from_date as string);
      const fromSlot = req.body.from_slot as string;
      const toDate = moment(req.body.to_date as string);
      const toSlot = req.body.to_slot as string;
      const sandwichLeave = (req.body.isSandwichLeave as boolean) || false;

      let leaveData;

      if (leaveId) {
        leaveData = await this.leaveHistoryService._getLeaveById(leaveId);
      }

      // Get User Balance
      let userBalance = await this.leaveHistoryService._getleaveBalance({
        user_id: userId,
      });

      if (leaveData) {
        userBalance = userBalance.map((types) => {
          const leaveLeaveTypes = leaveData.leaveTypes.find((type) => type.leave_type === types.leave_type);

          // condole.log('leaveLeaveTypes', leaveLeaveTypes);

          return {
            ...types,
            leave_type: types.leave_type,
            current_balance: leaveLeaveTypes
              ? leaveLeaveTypes.leave_type === 'LWP'
                ? Number(types.current_balance)
                : Number(types.current_balance) + Number(leaveLeaveTypes.leave_days)
              : Number(types.current_balance),
            reserved_balance: leaveLeaveTypes ? Number(types.reserved_balance) - Number(leaveLeaveTypes.leave_days) : Number(types.reserved_balance),
          };
        });
      }

      // Get PL Balance
      const userPLBalance = userBalance.find((Type) => Type.leave_type.toString() === Leave_Type.PL.toString());

      // Get CL Balance
      const userCLBalance = userBalance.find((Type) => Type.leave_type.toString() === Leave_Type.CL.toString());

      // Get LWP Balance
      const userLWPBalance = userBalance.find((Type) => Type.leave_type.toString() === Leave_Type.LWP.toString());

      // Global Variable for Response
      let fDate = null;
      let tDate = null;
      let no_of_days = null;
      let day_count = 0;
      let leaveUsedCL = 0;
      let leaveRemainCL = userCLBalance.current_balance;
      let leaveUsedPL = 0;
      let leaveRemainPL = userPLBalance.current_balance;
      let leaveUsedLWP = 0;
      let leaveRemainLWP = userLWPBalance.current_balance;

      let isHoliday = false;
      let isWeekend = false;
      let isSandwichLeave = false;
      let isDocumentRequired = false;

      let isDateAvailable = false;
      let isFromDateAvailable = true;
      let isToDateAvailable = true;

      let isFromSlotAvailable = true;
      let isToSlotAvailable = true;

      let isLeaveAvailable = false;

      // Check for Sandwich leave

      const fromYear = moment(fromDate, 'DD/MM/YYYY').year();
      const toYear = moment(toDate, 'DD/MM/YYYY').year();

      const holidayList = await this.leaveHistoryService._getHolidayList({
        [Op.and]: [
          {
            [Op.and]: Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('holiday_date')), fromYear),
          },
          {
            [Op.and]: Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('holiday_date')), toYear),
          },
          {
            isHoliday: 1,
          },
        ],
      });

      const holidayListDates = holidayList.map((holiday) => {
        return moment(holiday.holiday_date);
      });

      const availableDates = await this.leaveFunctions.checkForDateAndSlot(userId, fromDate, toDate, fromSlot, toSlot, leaveId, holidayListDates);

      // console.log('availableDates', availableDates);

      isHoliday = availableDates.isHoliday;
      isWeekend = availableDates.isWeekend;

      isDateAvailable = availableDates.isDateAvailable;
      isFromDateAvailable = availableDates.isFromDateAvailable;
      isToDateAvailable = availableDates.isToDateAvailable;
      isFromSlotAvailable = availableDates.isFromSlotAvailable;
      isToSlotAvailable = availableDates.isToSlotAvailable;
      isLeaveAvailable = availableDates.isLeaveAvailable;

      if (isFromDateAvailable && isToDateAvailable) {
        const sandwichLeaveResponse = await this.leaveFunctions.checkForSandwichLeave(
          userId,
          availableDates.fDate,
          availableDates.tDate,
          availableDates.from_slot,
          availableDates.to_slot,
          holidayListDates,
          leaveId,
          isHoliday,
          isWeekend
        );
        // console.log('sandwichLeaveResponse', sandwichLeaveResponse);

        fDate = sandwichLeaveResponse._finalLeaveStartDate;
        tDate = sandwichLeaveResponse._finalLeaveEndDate;
        isSandwichLeave = sandwichLeaveResponse.isSandwichLeave;
        day_count = sandwichLeaveResponse.day_count;
      } else {
        fDate = availableDates.fDate;
        tDate = availableDates.tDate;
        day_count = await this.leaveFunctions.countDays(fDate, tDate, isSandwichLeave, holidayListDates, isHoliday, isWeekend, fromSlot, toSlot);
      }

      let remainingNoOfDays = day_count;

      const total_no_of_days = remainingNoOfDays;

      if (isDateAvailable && !isLeaveAvailable) {
        // Check if Total No of Days 1 then use CL if CL balance 0 then use PL Balance if PL Balance 0 then use LWP
        if (remainingNoOfDays <= 1) {
          // CL
          if (userCLBalance.current_balance > 0) {
            if (userCLBalance.current_balance < remainingNoOfDays) {
              leaveUsedCL = userCLBalance.current_balance;
              leaveRemainCL = 0;
              remainingNoOfDays = remainingNoOfDays - userCLBalance.current_balance;
            } else {
              leaveUsedCL = remainingNoOfDays;
              leaveRemainCL = userCLBalance.current_balance - leaveUsedCL;
              remainingNoOfDays = remainingNoOfDays - userCLBalance.current_balance;
            }
          }
          // PL
          if (userCLBalance.current_balance === 0 && userPLBalance.current_balance > 0) {
            if (userPLBalance.current_balance < remainingNoOfDays) {
              leaveUsedPL = userPLBalance.current_balance;
              leaveRemainPL = 0;
              remainingNoOfDays = remainingNoOfDays - userPLBalance.current_balance;
            } else {
              leaveUsedPL = remainingNoOfDays;
              leaveRemainPL = userPLBalance.current_balance - leaveUsedPL;
              remainingNoOfDays = remainingNoOfDays - userPLBalance.current_balance;
            }
          }

          if ((userPLBalance.current_balance === 0 && userCLBalance.current_balance === 0) || remainingNoOfDays > 0) {
            leaveUsedLWP = remainingNoOfDays;

            leaveRemainLWP = userLWPBalance.current_balance + leaveUsedLWP;
          }
        }
        if (remainingNoOfDays > 1) {
          if (userPLBalance.current_balance > 0) {
            // PL

            if (userPLBalance.current_balance < remainingNoOfDays) {
              leaveUsedPL = userPLBalance.current_balance;
              leaveRemainPL = 0;
              remainingNoOfDays = remainingNoOfDays - userPLBalance.current_balance;
            } else {
              leaveUsedPL = remainingNoOfDays;
              leaveRemainPL = userPLBalance.current_balance - leaveUsedPL;
              remainingNoOfDays = remainingNoOfDays - userPLBalance.current_balance;
            }
          }

          // CL
          if ((userPLBalance.current_balance === 0 || userCLBalance.current_balance > 0) && remainingNoOfDays > 0) {
            if (userCLBalance.current_balance < remainingNoOfDays) {
              leaveUsedCL = userCLBalance.current_balance;
              leaveRemainCL = 0;
              remainingNoOfDays = remainingNoOfDays - userCLBalance.current_balance;
            } else {
              leaveUsedCL = remainingNoOfDays;
              leaveRemainCL = userCLBalance.current_balance - leaveUsedCL;
              remainingNoOfDays = remainingNoOfDays - userCLBalance.current_balance;
            }
          }

          if ((userPLBalance.current_balance === 0 && userCLBalance.current_balance === 0) || remainingNoOfDays > 0) {
            leaveUsedLWP = remainingNoOfDays;

            leaveRemainLWP = userLWPBalance.current_balance + leaveUsedLWP;
          }
        }
      }

      // Check if Total No of Days 2 or greater then 2 then use PL. if PL balance 0 then use CL balance if CL balance 0 then use LWP

      const data = [
        {
          leave_type: Leave_Type.CL,
          balance: userCLBalance.current_balance,
          used: leaveUsedCL,
          remaining: leaveRemainCL,
        },
        {
          leave_type: Leave_Type.PL,
          balance: userPLBalance.current_balance,
          used: leaveUsedPL,
          remaining: leaveRemainPL,
        },
        {
          leave_type: Leave_Type.LWP,
          balance: userLWPBalance.current_balance,
          used: leaveUsedLWP,
          remaining: leaveRemainLWP,
        },
      ];

      // condole.log('data', data);

      // Check if Document Required Or Not

      // const isContinousLeave = await this.leaveFunctions.checkForContinousLeave(userId, fDate, tDate, fromSlot, toSlot, leaveId);

      // if (total_no_of_days > 4) {
      //   // Check For Continous Leave For Document Requirement

      //   isDocumentRequired = true;
      // }

      res.status(200).json(
        APIResponseFormat._ResDataFound({
          from_date: fromDate.format('DD-MM-YYYY'),
          to_date: toDate.format('DD-MM-YYYY'),
          sandwich_from_date: isSandwichLeave ? fDate.format('DD-MM-YYYY') : null,
          from_slot: fromSlot,
          sandwich_to_date: isSandwichLeave ? tDate.format('DD-MM-YYYY') : null,
          to_slot: toSlot,
          no_of_days: total_no_of_days,
          balance: data,
          isDocumentRequired,
          isSandwichLeave,
          isFromDateAvailable,
          isToDateAvailable,
          isFromSlotAvailable,
          isToSlotAvailable,
          isLeaveAvailable,
          isHoliday,
          isWeekend,
        })
      );
    } catch (error) {
      console.log('error', error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  // leave add request by user
  public createLeaveHistory = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._leaveDocumentStorage,
        fileFilter: MulterService._fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
      }).fields([{ name: 'attachments', maxCount: 10 }]);

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      const maxTotalSize = 25 * 1024 * 1024; // 25MB in bytes

      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }
          const user_id = Number(req.headers.id);
          if (!user_id) {
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField('User Id'));
          }

          const loggedInUserId = req.user.id;

          // Get User's Leave Balance

          const validateLeaveBalance = await thisI.leaveHistoryService._getleaveBalance({
            user_id: user_id,
          });

          // get & parse Approver Details
          const ApprovedRequiredFrom = JSON.parse(req.body.approved_required_from);

          // condole.log('ApprovedRequiredFrom', ApprovedRequiredFrom);

          const leaveApproval = ApprovedRequiredFrom.map((approvalFrom) => {
            return {
              status: 'PENDING',
              user_id: approvalFrom.id,
              action_comment: '',
              type: approvalFrom.type,
            };
          });

          const ApprovedRequiredFromData = ApprovedRequiredFrom.map((approvalFrom) => {
            return approvalFrom.id;
          });

          // condole.log('ApprovedRequiredFromData', ApprovedRequiredFromData);

          // Format leave History log Data
          const leaveHistoryLog = {
            user_id: user_id,
            action: 'Leave Added',
            action_by: [Number(loggedInUserId)],
          };

          let totalSize = 0;

          // Add New Documents
          const leaveAttechments = req.files?.['attachments']
            ? req.files?.['attachments'].map((attachment) => {
                totalSize += attachment.size;
                return { path: `uploads/leaveDocuments/${attachment.filename}`, size: attachment.size };
              })
            : null;

          if (totalSize > maxTotalSize) {
            FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, req.files['attachments']);
            return res.status(409).json(APIResponseFormat._ResCustomRequest(`Total size of all documents should not be more than 25 mb`));
          }

          const leaveTypesData = JSON.parse(req.body.leave_type);
          // condole.log('leaveTypesData', leaveTypesData);

          const leaveTypes = leaveTypesData
            .map((type) => {
              return type.used > 0 ? { user_id, leave_type: type.leave_type, leave_days: type.used } : {};
            })
            .filter((value) => Object.keys(value).length !== 0);


            console.log(req.body, 'req.body');
            

          const leaveDetails = {
            from_date: new Date(req.body.from_date),
            leave_from_slot: req.body.leave_from_slot,
            to_date: new Date(req.body.to_date),
            leave_to_slot: req.body.leave_to_slot,
            no_of_days: Number(req.body.no_of_days),
            leave_subject: req.body.leave_subject || null,
            leave_subject_text: req.body.leave_subject_text,
            description: req.body.description,
            isSandwichLeave: req.body.is_sandwich_leave,
            sandwich_from_date: req.body.sandwich_from_date,
            sandwich_to_date: req.body.sandwich_to_date,
            approved_required_from: ApprovedRequiredFromData,
            requested_date: new Date(),
            user_id: user_id,
            approved_by: [],
            attachments: leaveAttechments,
            status: 'PENDING',
            leaveHistoryLog,
            leaveApproval,
            leaveTypes,
          };

          // if (leaveDetails.no_of_days > 4 && leaveAttechments === null) {
          //   return res.status(409).json(APIResponseFormat._ResCustomRequest(`Attachment is mandatory for leaves exceeding 4 days.`));
          // }

          const data = await thisI.leaveHistoryService._createLeave(leaveDetails);

          const dataForEvent = JSON.parse(JSON.stringify(data));

          if (!data) {
            FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, req.files['attachments']);

            return res.status(500).json(APIResponseFormat._ResDataNotCreated('Leave'));
          }

          await thisI.leaveFunctions.updateLeaveBalanceF(res, 'addLeave', user_id, leaveDetails.leaveTypes);

          eventEmitter.emit(
            'addLeaveByUser',
            moment(leaveDetails.from_date).format('DD/MM/YYYY'),
            moment(leaveDetails.to_date).format('DD/MM/YYYY'),
            leaveDetails.leaveTypes,
            leaveDetails.leave_subject ? Number(leaveDetails.leave_subject) : leaveDetails.leave_subject_text,
            user_id,
            loggedInUserId
          );

          // Notification of Leave Added #START

          const userDetails = await thisI.leaveHistoryService._getUserDetails({ id: leaveDetails.user_id });

          const leaveResponsiblePerson = ApprovedRequiredFrom.filter((approvalFrom) => approvalFrom.type === 'leave_responsible_person').map(
            (obj) => obj.id
          );

          let leaveResPerson = await thisI.leaveHistoryService._getUsersDetails(leaveResponsiblePerson);
          leaveResPerson = JSON.parse(JSON.stringify(leaveResPerson));
          // get the name of all leave responsible person name in one string;
          let lrspname = '';
          for (let i = 0; i < leaveResPerson.length; i++) {
            lrspname = lrspname + ' ' + leaveResPerson[i].first_name + ' ' + leaveResPerson[i].last_name + ',';
          }

          const leaveReportingPerson = ApprovedRequiredFrom.filter((approvalFrom) => approvalFrom.type === 'leave_reporting_person').map(
            (obj) => obj.id
          );

          let leaveRepPerson = await thisI.leaveHistoryService._getUsersDetails(leaveReportingPerson);
          leaveRepPerson = JSON.parse(JSON.stringify(leaveRepPerson));

          let leaveReportingPersonName = '';
          for (let i = 0; i < leaveRepPerson.length; i++) {
            leaveReportingPersonName = leaveReportingPersonName + ' ' + leaveRepPerson[i].first_name + ' ' + leaveRepPerson[i].last_name;
          }

          // Leave balance
          const leaveBalance = await thisI.leaveBalanceService._getleaveBalance({
            user_id,
          });

          let clCurrentBalance = null; // Initialize variables to store CL and PL current balances
          let plCurrentBalance = null;

          for (const item of leaveBalance) {
            if (item?.leave_type === 'CL') {
              clCurrentBalance = item?.current_balance;
            } else if (item.leave_type === 'PL') {
              plCurrentBalance = item?.current_balance;
            }
          }

          let getLeaves = await thisI.leaveHistoryService._getUserMost3Leave({
            user_id,
          });
          getLeaves = JSON.parse(JSON.stringify(getLeaves));

          const leaves_on_current_year = getLeaves.map((leave) => {
            const fromDate: any = new Date(leave.from_date);
            const toDate: any = new Date(leave.to_date);
            const days = (toDate - fromDate) / (1000 * 60 * 60 * 24) + 1;

            return {
              Subject: leave.description || 'Unknown',
              Status: leave.status === 'PENDING' ? 'Pending' : 'Approved',
              LeaveDates: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()} (${days} day${days > 1 ? 's' : ''})`,
            };
          });

          const notificationData = {
            leave_id: dataForEvent.id,
            leave_request_user_name: `${userDetails.first_name} ${userDetails.last_name}`,
            leave_responsible_person: leaveResponsiblePerson,
            leave_reporting_person: leaveReportingPerson,
            leave_date_from: moment(leaveDetails.from_date).format('DD/MM/YYYY'),
            leave_date_to: moment(leaveDetails.to_date).format('DD/MM/YYYY'),
            action_by: req.user.first_name + ' ' + req.user.last_name,
            action_by_profile: req.user.user_image,
            leave_subject: 'A new Leave request from ' + req.user.first_name + ' ' + req.user.last_name,
            total_leave_days: leaveDetails.no_of_days || 0,
            leave_type: leaveDetails.leaveTypes[0].leave_type,
            cl: clCurrentBalance,
            pl: plCurrentBalance,
            leave_description: leaveDetails.description,
            leave_responsible_person_name: lrspname,
            leave_reporting_person_name: leaveReportingPersonName,
            leaves_on_current_year: leaves_on_current_year,
          };

          eventEmitterLeave.default.emit('notify_add_leave_by_team', notificationData);
          // Notification of Leave Added #END
          return res.status(201).json(APIResponseFormat._ResDataCreated('Leave', {}));
        } catch (error) {
          FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, req.files['attachments']);
          next(error);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError());
        }
      });
    } catch (error) {
      FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, req.files['attachments']);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public updateLeaveHistory = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._leaveDocumentStorage,
        fileFilter: MulterService._fileFilter,
        limits: {
          fileSize: 5 * 1024 * 1024,
        },
      }).fields([{ name: 'attachments', maxCount: 10 }]);

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      const maxTotalSize = 25 * 1024 * 1024; // 25MB in bytes
      newUpload(req, res, async function (err) {
        try {
          // Image Error
          if (err && err.message) {
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }

          const loggedInUserId = req.user.id;

          const isReponsiblePerson = await thisI.leaveHistoryService._checkIsReponsiblePerson({
            [Op.and]: [{ name: 'Leave Responsible Person', identifier: 'leave_reponsible_person', module: 'leave' }],
          });

          // Get User Id from frontEnd
          const leaveId = Number(req.headers.id);
          const user_id = Number(req.headers.user_id);

          if (!leaveId) {
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Leave Id'));
          }

          if (!user_id) {
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField('User Id'));
          }

          // Get Approval Check for Leave

          const ApprovalCheck = await thisI.leaveHistoryService._getApprovalOfLeave({ leave_history_id: leaveId });

          const approvalCheckCount = ApprovalCheck.filter((ac) => ac.status != 'PENDING');

          if (approvalCheckCount.length > 0 && !isReponsiblePerson.includes(loggedInUserId)) {
            return res.status(409).json(APIResponseFormat._ResCustomRequest('The leave request has already been approved and cannot be modified.'));
          }

          // Get check validation for leave
          const validation = await thisI.leaveHistoryService._getLeaveById(leaveId);

          console.log('validation', validation);

          if (!validation) {
            FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, req.files['attachments']);
            return res.status(409).json(APIResponseFormat._ResNotExists('Leave'));
          }

          // Reset Leave Balance

          const oldAttachments = validation.attachments || [];

          const leaveAttechments = req.files?.['attachments']
            ? req.files?.['attachments'].map((attachment) => {
                return { path: `uploads/leaveDocuments/${attachment.filename}`, size: attachment.size };
              })
            : [];

          const oldAttachmentsInRequest = req.body.atteched_documents ? JSON.parse(req.body.atteched_documents) : [];

          if (!oldAttachmentsInRequest.length) {
            oldAttachments.forEach((attachments) => {
              console.log('attachments', attachments.path.substring(attachments.path.lastIndexOf('/') + 1));

              const filename = attachments.path.substring(attachments.path.lastIndexOf('/') + 1);
              FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, [filename]);
            });
          } else {
            oldAttachmentsInRequest.forEach((attachment) => {
              leaveAttechments.push(attachment);
            });
          }

          const totalSize = leaveAttechments.reduce((accumulator, currentValue) => accumulator.size + currentValue.size, 0);
          if (totalSize > maxTotalSize) {
            FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, req.files['attachments']);
            return res.status(409).json(APIResponseFormat._ResCustomRequest(`Total size of all documents should not be more than 25 mb`));
          }

          const leaveTypesData = JSON.parse(req.body.leave_type);

          const leaveTypes = leaveTypesData
            .map((type) => {
              const oldLeaveType = validation.leaveTypes.find((leaveType) => leaveType.leave_type === type.leave_type);

              // condole.log('oldLeaveType', oldLeaveType);

              return type.used > 0
                ? oldLeaveType
                  ? { ...oldLeaveType, user_id, leave_type: type.leave_type, leave_days: type.used }
                  : { leave_history_id: leaveId, user_id, leave_type: type.leave_type, leave_days: type.used }
                : {};
            })
            .filter((value) => Object.keys(value).length !== 0);

          console.log(req.body, 'req.body');
          const leaveDetails = {
            from_date: new Date(req.body.from_date),
            leave_from_slot: req.body.leave_from_slot,
            to_date: new Date(req.body.to_date),
            leave_to_slot: req.body.leave_to_slot,
            no_of_days: Number(req.body.no_of_days),
            leave_subject: req.body.leave_subject || null,
            leave_subject_text: req.body.leave_subject_text,
            description: req.body.description,
            isSandwichLeave: req.body.is_sandwich_leave,
            sandwich_from_date: req.body.sandwich_from_date,
            sandwich_to_date:  req.body.sandwich_to_date,
            requested_date: new Date(),
            user_id: user_id,
            attachments: leaveAttechments,
          };

          // Validation for Attachments
          // if (leaveDetails.no_of_days > 4 && leaveAttechments === null) {
          //   return res.status(409).json(APIResponseFormat._ResCustomRequest(`Attachment is mandatory for leaves exceeding 4 days.`));
          // }

          // condole.log('leaveDetails', leaveDetails);

          // Update Leave

          const updateLeave = await thisI.leaveHistoryService._updateLeave(leaveDetails, leaveId);

          const deletedLeaveTypes = validation.leaveTypes.filter((el) => !leaveTypes.find((e) => e?.leave_type == el.leave_type));
          if (deletedLeaveTypes.length) {
            const data = await thisI.leaveHistoryService._deleteLeaveTypes({
              id: { [Op.in]: deletedLeaveTypes.map((el) => el.id) },
            });
            if (!data) {
              return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Types'));
            }
          }

          const updateLeaveType = await thisI.leaveHistoryService._updateLeaveType(leaveTypes);

          if (!updateLeave && !updateLeaveType) return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Details'));

          // Update Leave Log

          //check updated field
          const deference = await thisI.leaveHistoryService._compareObjects(validation, leaveDetails);

          console.log('deference', deference);

          const leaveHistoryLog = {
            leave_history_id: leaveId,
            user_id: user_id,
            action: 'Leave Updated',
            action_by: [Number(loggedInUserId)],
            updated_values: deference,
          };

          const leaveLogUpdate = await thisI.leaveHistoryService._createLeaveLog(leaveHistoryLog);

          if (!leaveLogUpdate) return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Details'));

          if (validation.status === 'APPROVED') {
            await thisI.leaveFunctions.updateLeaveBalanceF(res, 'resetApprovedLeave', user_id, validation.leaveTypes);
            await thisI.leaveFunctions.updateLeaveBalanceF(res, 'updateApprovedLeave', user_id, leaveTypes);
          } else {
            await thisI.leaveFunctions.updateLeaveBalanceF(res, 'resetLeave', user_id, validation.leaveTypes);
            await thisI.leaveFunctions.updateLeaveBalanceF(res, 'updateLeave', user_id, leaveTypes);
          }

          eventEmitter.emit(
            'updateLeaveByUser',
            moment(leaveDetails.from_date).format('DD/MM/YYYY'),
            moment(leaveDetails.to_date).format('DD/MM/YYYY'),
            validation.leaveTypes,
            leaveTypes,
            leaveDetails.leave_subject ? Number(leaveDetails.leave_subject) : leaveDetails.leave_subject_text,
            user_id,
            loggedInUserId
          );

          // Notification of Leave Added #START

          const leaveResponsiblePerson = validation.leaveApproval
            .filter((approvalFrom) => approvalFrom.type === 'leave_responsible_person')
            .map((obj) => obj.user_id);

          const leaveReportingPerson = validation.leaveApproval
            .filter((approvalFrom) => approvalFrom.type === 'leave_reporting_person')
            .map((obj) => obj.user_id);

          let getLeaves = await thisI.leaveHistoryService._getUserMost3Leave({
            user_id,
          });
          getLeaves = JSON.parse(JSON.stringify(getLeaves));

          const leaves_on_current_year = getLeaves.map((leave) => {
            const fromDate: any = new Date(leave.from_date);
            const toDate: any = new Date(leave.to_date);
            const days = (toDate - fromDate) / (1000 * 60 * 60 * 24) + 1;

            return {
              Subject: leave.description || 'Unknown',
              Status: leave.status === 'PENDING' ? 'Pending' : 'Approved',
              LeaveDates: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()} (${days} day${days > 1 ? 's' : ''})`,
            };
          });

          const leaveBalance = await thisI.leaveBalanceService._getleaveBalance({
            user_id,
          });

          let clCurrentBalance = null; // Initialize variables to store CL and PL current balances
          let plCurrentBalance = null;

          for (const item of leaveBalance) {
            if (item?.leave_type === 'CL') {
              clCurrentBalance = item?.current_balance;
            } else if (item.leave_type === 'PL') {
              plCurrentBalance = item?.current_balance;
            }
          }

          const data = {
            leave_id: validation.id,
            leave_request_user: [validation.user_id],
            leave_request_user_name: `${validation.user.first_name} ${validation.user.last_name}`,
            leave_responsible_person: leaveResponsiblePerson,
            leave_reporting_person: leaveReportingPerson,
            leave_date_from: moment(leaveDetails.from_date).format('DD/MM/YYYY'),
            leave_date_to: moment(leaveDetails.to_date).format('DD/MM/YYYY'),
            action_by: req.user.first_name + ' ' + req.user.last_name,
            action_by_profile: req.user.user_image,
            leave_applied_from: moment(validation?.requested_date).format('DD/MM/YYYY'),
            leave_applied_to: moment(validation?.from_date).format('DD/MM/YYYY'),
            leave_subject: validation.description,
            total_leave_days: validation.no_of_days,
            leave_type: validation.leaveTypes[0].leave_type,
            cl: clCurrentBalance,
            pl: plCurrentBalance,
            leave_description: validation.description,
            leave_responsible_person_name: '',
            leaves_on_current_year: leaves_on_current_year,
          };

          eventEmitterLeave.default.emit('notify_leave_date_changed', data);
          // Notification of Leave Added #END

          res.status(200).json(APIResponseFormat._ResDataUpdated('Leave'));
        } catch (error) {
          console.log('Error', error);

          FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, req.files['attachments']);
          next(error);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError());
        }
      });
    } catch (error) {
      console.log('Error', error);

      FileService._deleteFile(BasePath.default.LEAVE_DOCUMENT_PATH, req.files['attachments']);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public deleteLeaveHistory = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const leaveId = Number(req.headers.id);
      const { reason } = req.body;

      if (!leaveId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Leave Id'));
      const loggedInUserId = req.user.id;
      const validation = await this.leaveHistoryService._getLeaveById(leaveId);
      const user_id = Number(validation.user_id);

      if (!validation) return res.status(409).json(APIResponseFormat._ResDataNotFound('Leave'));

      if (validation.status === 'CANCELLED') return res.status(400).json(APIResponseFormat._ResBadRequest('You have already canceled this leave.'));

      const todayDate = moment().startOf('day');
      const validationFromDate = moment(validation.from_date).startOf('day');
      const validationToDate = moment(validation.to_date).startOf('day');

      if (
        validation.status === 'APPROVED' &&
        validationFromDate.isSameOrBefore(todayDate) &&
        validationToDate.isSameOrBefore(todayDate) &&
        loggedInUserId === user_id
      ) {
        return res.status(400).json(APIResponseFormat._ResBadRequest('Leave modification is not possible as the leave date has already passed'));
      }

      // const ApprovalCheck = await this.leaveHistoryService._getApprovalOfLeave({ leave_history_id: leaveId });

      // const approvalCheckCount = ApprovalCheck.filter((ac) => ac.status != 'PENDING');

      // if (approvalCheckCount.length > 0) {
      //   return res.status(409).json(APIResponseFormat._ResCustomRequest('You Can not Update This Leave '));
      // }

      const DeleteLeaveData = {
        status: 'CANCELLED',
        comments: reason,
      };

      const deleteLeave = await this.leaveHistoryService._updateLeave(DeleteLeaveData, leaveId);

      if (!deleteLeave) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave'));
      }

      const leaveHistoryLog = {
        leave_history_id: leaveId,
        user_id: user_id,
        action: 'Leave Deleted',
        action_by: [Number(loggedInUserId)],
      };

      const leaveLogUpdate = await this.leaveHistoryService._createLeaveLog(leaveHistoryLog);

      if (!leaveLogUpdate) return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Details'));

      if (validation.status === 'APPROVED') {
        await this.leaveFunctions.updateLeaveBalanceF(res, 'cancelApprovedLeave', user_id, validation.leaveTypes);
      } else {
        await this.leaveFunctions.updateLeaveBalanceF(res, 'rejectorcancelLeave', user_id, validation.leaveTypes);
      }

      // const deleteLeaveApproval = await this.leaveHistoryService._updateApprovalOfLeave(DeleteLeaveData, { leave_history_id: leaveId });

      // if (!deleteLeaveApproval) {
      //   return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Approval'));
      // }

      // event call for Cancel leave by user
      eventEmitter.emit(
        'cancelLeaveByUser',
        moment(validation.from_date).format('DD/MM/YYYY'),
        moment(validation.to_date).format('DD/MM/YYYY'),
        validation.leaveTypes,
        validation.leave_subject ? Number(validation.leave_subject) : validation.leave_subject_text,
        user_id,
        loggedInUserId
      );

      // Notification of Leave Added #START

      const leaveResponsiblePerson = validation.leaveApproval
        .filter((approvalFrom) => approvalFrom.type === 'leave_responsible_person')
        .map((obj) => obj.user_id);

      const leaveReportingPerson = validation.leaveApproval
        .filter((approvalFrom) => approvalFrom.type === 'leave_reporting_person')
        .map((obj) => obj.user_id);

      // const { leave_request_user_name  ,  leave_status , leave_date_from , leave_date_to , action_by , action_by_profile , leave_subject , total_leave_days , leave_type , cl , pl , leave_description , leave_responsible_person_name,  leave_id } = data;
      // let { leave_responsible_person , leave_reporting_person , leave_request_user } = data;
      // let { leaves_on_current_year } = data;

      let getLeaves = await this.leaveHistoryService._getUserMost3Leave({
        user_id,
      });
      getLeaves = JSON.parse(JSON.stringify(getLeaves));

      const leaves_on_current_year = getLeaves.map((leave) => {
        const fromDate: any = new Date(leave.from_date);
        const toDate: any = new Date(leave.to_date);
        const days = (toDate - fromDate) / (1000 * 60 * 60 * 24) + 1;

        return {
          Subject: leave.description || 'Unknown',
          Status: leave.status === 'PENDING' ? 'Pending' : 'Approved',
          LeaveDates: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()} (${days} day${days > 1 ? 's' : ''})`,
        };
      });

      const leave = await this.leaveHistoryService._getLeaveById(validation.id);
      //console.log(JSON.parse(JSON.stringify(leave)));

      const leaveBalance = await this.leaveBalanceService._getleaveBalance({
        user_id,
      });

      let clCurrentBalance = null; // Initialize variables to store CL and PL current balances
      let plCurrentBalance = null;

      for (const item of leaveBalance) {
        if (item?.leave_type === 'CL') {
          clCurrentBalance = item?.current_balance;
        } else if (item.leave_type === 'PL') {
          plCurrentBalance = item?.current_balance;
        }
      }

      const data = {
        leave_id: validation.id,
        leave_request_user: [validation.user_id], //
        leave_request_user_name: `${validation.user.first_name} ${validation.user.last_name}`,
        leave_responsible_person: leaveResponsiblePerson,
        leave_reporting_person: leaveReportingPerson,
        leave_status: 'CANCELLED', //
        action_by: req.user.first_name + ' ' + req.user.last_name, //
        leave_date_from: moment(validation.from_date).format('DD/MM/YYYY'), //
        leave_date_to: moment(validation.to_date).format('DD/MM/YYYY'), //
        action_by_profile: req.user.user_image, //
        leave_subject: validation.description,
        total_leave_days: validation.no_of_days,
        leave_type: validation.leaveTypes[0].leave_type,
        cl: clCurrentBalance,
        pl: plCurrentBalance,
        leave_description: validation.description,
        leave_responsible_person_name: '',
        leaves_on_current_year: leaves_on_current_year,
      };

      eventEmitterLeave.default.emit('notify_leave_status_changed', data);
      // Notification of Leave Added #END

      res.status(200).json(APIResponseFormat._ResDataDeleted('Leave'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default LeaveController;