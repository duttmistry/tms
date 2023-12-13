import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Order } from 'sequelize';
import LeaveHistoryService from '../services/leave.service';
import LeaveSubjectsService from '../../leave_subjects/services/leave_subjects.service';
import LeaveBalanceService from '../../leave_balance/services/leave_balance.service';
import { Query, Pagination, APIResponseFormat } from '@tms-workspace/apis-core';
import { map } from 'rxjs';
import { FileService, MulterService, BasePath } from '@tms-workspace/file-upload';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import { Op, Sequelize } from 'sequelize';
import { Leave_Type } from '@tms-workspace/enum-data';
import moment, { Moment } from 'moment';
import eventEmitter from '../../../../core/leave-txn-events';
import readXlsxFile from 'read-excel-file/node';
import { eventEmitterLeave, eventEmitterTask } from '@tms-workspace/preference';
import { iLeaveBalance, iLeaveHistory, iLeaveOpeningBalance } from '../../../database/interface/leave.interface';
import { isNull } from 'util';

class leaveManipulationController {
  public leaveHistoryService = new LeaveHistoryService();
  public leaveSubjectsService = new LeaveSubjectsService();
  public leaveBalanceService = new LeaveBalanceService();

  public updateLeaveBalance = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;

      if (!req.user.isAdmin) {
        return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
      }

      const employee_id = Number(req.headers.id);

      if (!employee_id) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('employee_id'));
      }

      const { CL, PL, NOTES } = req.body;

      if (!CL && !PL) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Leave Data'));
      }

      const clLeaveData = { current_balance: CL.available, applied_balance: CL.used, reserved_balance: CL.reserved };

      const plLeaveData = { current_balance: PL.available, applied_balance: PL.used, reserved_balance: PL.reserved };

      const updateCLLeave = await this.leaveHistoryService._updateleaveBalance(clLeaveData, { user_id: employee_id, leave_type: 'CL' });

      const updatePLLeave = await this.leaveHistoryService._updateleaveBalance(plLeaveData, { user_id: employee_id, leave_type: 'PL' });

      if (!updateCLLeave && !updatePLLeave) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Balance'));
      }

      eventEmitter.emit('updateLeaveBySuperiority', CL, PL, NOTES, employee_id, user_id);

      res.status(200).json(APIResponseFormat._ResDataUpdated('Leave Balance'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  // Dev API's For Direct Changes
  public addBalanceLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const Employee = await this.leaveHistoryService._getAllUser();

      const EmployeeCLLeaveBalance = Employee.map((emp) => {
        return { ...emp, leave_type: Leave_Type.CL, current_balance: 5, applied_balance: 0, reserved_balance: 0 };
      });

      const EmployeePLLeaveBalance = Employee.map((emp) => {
        return { ...emp, leave_type: Leave_Type.PL, current_balance: 5, applied_balance: 0, reserved_balance: 0 };
      });

      const EmployeeLWPLeaveBalance = Employee.map((emp) => {
        return { ...emp, leave_type: Leave_Type.LWP, current_balance: 0, applied_balance: 0, reserved_balance: 0 };
      });

      const employeeLeaveBalance = [...EmployeeCLLeaveBalance, ...EmployeePLLeaveBalance, ...EmployeeLWPLeaveBalance];

      const AddEmployeeBalance = this.leaveHistoryService._addLeaveBalance(employeeLeaveBalance);

      if (!AddEmployeeBalance) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('AddEmployeeBalance'));
      }

      res.status(200).json(APIResponseFormat._ResDataFound(employeeLeaveBalance));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  // Import Leave Data
  public importLeaveData = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    const newUpload = multer({
      storage: MulterService._leaveDataExcel,
      fileFilter: MulterService._excelFilter,
    }).fields([
      { name: 'leaveDataFile', maxCount: 1 },
      { name: 'leaveBalanceDataFile', maxCount: 1 },
      { name: 'leaveOpeningBalanceDataFile', maxCount: 1 },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisI = this;
    newUpload(req, res, async function (err) {
      try {
        if (err && err.message) {
          return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
        }

        const leaveDataFilePath = req.files['leaveDataFile'][0].path;
        const leaveBalanceDataFilePath = req.files['leaveBalanceDataFile'][0].path;
        const leaveOpeningBalanceDataFilePath = req.files['leaveOpeningBalanceDataFile'][0].path;

        const leaveDataMap = {
          id: 'id',
          user_id: 'user_id',
          subject: 'subject',
          message: 'message',
          from_date: 'from_date',
          to_date: 'to_date',
          leave_days: 'leave_days',
          leave_type: 'leave_type',
          leave_slot1: 'leave_slot1',
          leave_slot2: 'leave_slot2',
          manager_id: 'manager_id',
          department: 'department',
          action_by: 'action_by',
          status: 'status',
          created_at: 'created_at',
          updated_at: 'updated_at',
          new_user_id: 'new_user_id',
          new_actionby_id: 'new_actionby_id',
        };

        const leaveBalanceDataMap = {
          id: 'id',
          user_id: 'user_id',
          leave_days: 'leave_days',
          leave_type: 'leave_type',
          created_at: 'created_at',
          updated_at: 'updated_at',
          new_user_id: 'new_user_id',
        };

        const leaveOpeningBalanceDataMap = {
          id: 'id',
          user_id: 'user_id',
          leave_type: 'leave_type',
          balance: 'balance',
          created_at: 'created_at',
          new_user_id: 'new_user_id',
        };

        const { rows: excelLeaveData } = await readXlsxFile(leaveDataFilePath, {
          map: leaveDataMap,
          dateFormat: 'yyyy-mm-dd',
        });

        // 1 = PENDING;
        // 2 = APPROVED;
        // 3 = CANCELLED;
        // 4 = APPROVED;

        // Leave Data Added
        const leaveData = await Promise.all(
          excelLeaveData.map((leave: any) => {
            // console.log('leave', leave);

            const LeaveStatus =
              leave.status === 4
                ? 'APPROVED'
                : leave.status === 3
                  ? 'CANCELLED'
                  : leave.status === 2
                    ? 'APPROVED'
                    : leave.status === 1
                      ? 'PENDING'
                      : null;

            const leaveTypes = [];
            const leaveT = JSON.parse(leave.leave_type);
            if (leaveT['1']) leaveTypes.push({ user_id: leave.new_user_id, leave_type: 'CL', leave_days: Number(leaveT['1']) });
            if (leaveT['2']) leaveTypes.push({ user_id: leave.new_user_id, leave_type: 'PL', leave_days: Number(leaveT['2']) });
            if (leaveT['3']) leaveTypes.push({ user_id: leave.new_user_id, leave_type: 'LWP', leave_days: Number(leaveT['3']) });

            const leaveHistoryLog = [];
            const leaveApproval = [];
            const ApprovedRequiredFromData = [];
            const approvedBy = [];

            if (LeaveStatus === 'APPROVED') {
              leaveHistoryLog.push({
                user_id: leave.new_user_id,
                action: 'Leave Added',
                action_by: [leave.new_user_id],
              });

              leaveHistoryLog.push({
                user_id: leave.new_user_id,
                action: 'Leave APPROVED',
                action_by: [leave.new_actionby_id],
              });

              leaveApproval.push({
                status: LeaveStatus,
                user_id: leave.new_actionby_id,
                action_comment: '',
                type: 'leave_responsible_person',
              });

              ApprovedRequiredFromData.push(leave.new_actionby_id);
              approvedBy.push(leave.new_actionby_id);
            }

            if (LeaveStatus === 'CANCELLED') {
              leaveHistoryLog.push({
                user_id: leave.new_user_id,
                action: 'Leave CANCELLED',
                action_by: [leave.new_user_id],
              });
              ApprovedRequiredFromData.push(leave.new_actionby_id);
              approvedBy.push(leave.new_actionby_id);
            }

            if (LeaveStatus === 'PENDING') {
              leaveHistoryLog.push({
                user_id: leave.new_user_id,
                action: 'Leave Added',
                action_by: [leave.new_user_id],
              });

              leaveApproval.push({
                status: LeaveStatus,
                user_id: leave.new_actionby_id,
                action_comment: '',
                type: 'leave_responsible_person',
              });

              ApprovedRequiredFromData.push(leave.new_actionby_id);
              approvedBy.push(leave.new_actionby_id);
            }

            const leaveFromSlot = leave.leave_slot1 === 'F' ? 'FD' : leave.leave_slot1;
            const leaveToSlot = leave.leave_slot2 === 'F' ? 'FD' : leave.leave_slot2;
            const leaveAttechments = [];

            return {
              from_date: new Date(leave.from_date),
              leave_from_slot: leaveFromSlot,
              to_date: new Date(leave.to_date),
              leave_to_slot: leaveToSlot,
              no_of_days: Number(leave.leave_days),
              leave_subject: null,
              leave_subject_text: leave.subject,
              description: leave.message,
              approved_required_from: ApprovedRequiredFromData,
              requested_date: new Date(leave.created_at),
              user_id: leave.new_user_id,
              approved_by: [],
              attachments: leaveAttechments,
              status: LeaveStatus,
              leave_type: null,
              comments: null,
              leaveHistoryLog,
              leaveApproval,
              leaveTypes,
              isSandwichLeave: false,
              sandwich_from_date: null,
              sandwich_to_date: null,
            };
          })
        );

        const updateLeaveData = await thisI.leaveHistoryService._importleaveData(leaveData as iLeaveHistory[]);

        if (!updateLeaveData) {
          return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Data'));
        }

        // Update Leave Balance
        const { rows: excelLeaveBalanceData } = await readXlsxFile(leaveBalanceDataFilePath, {
          map: leaveBalanceDataMap,
          dateFormat: 'yyyy-mm-dd',
        });

        const leaveBalance = await Promise.all(
          excelLeaveBalanceData.map(async (leaveb: any) => {
            const leaveType = leaveb.leave_type == 1 ? 'CL' : leaveb.leave_type == 2 ? 'PL' : 'LWP';

            return {
              user_id: leaveb.new_user_id,
              leave_type: leaveType,
              current_balance: leaveb.leave_days,
              applied_balance: 0,
              reserved_balance: 0,
            };
          })
        );

        const updateLeaveBalanceData = await thisI.leaveHistoryService._importleaveBalance(leaveBalance as iLeaveBalance[]);

        if (!updateLeaveBalanceData) {
          return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Balance Data'));
        }

        //Add Leave Opening Balance

        const { rows: excelLeaveOpeningBalanceData } = await readXlsxFile(leaveOpeningBalanceDataFilePath, {
          map: leaveOpeningBalanceDataMap,
          dateFormat: 'yyyy-mm-dd',
        });

        const leaveOpeningBalance = await Promise.all(
          excelLeaveOpeningBalanceData.map(async (leaveob: any) => {
            const leaveType = leaveob.leave_type == 1 ? 'CL' : leaveob.leave_type == 2 ? 'PL' : 'LWP';

            await thisI.leaveHistoryService._updateLeaveOpeningData(
              {
                closing_balance: leaveob.balance,
              },
              {
                user_id: leaveob.new_user_id,
                leave_type: leaveType,
                month: 'October',
                year: 2023,
              }
            );
            return {
              user_id: leaveob.new_user_id,
              leave_type: leaveType,
              opening_balance: leaveob.balance,
              closing_balance: null,
              month: moment(leaveob.month).format('MMMM'),
              year: Number(moment(leaveob.month).format('YYYY')),
            };
          })
        );

        const updateLeaveOpeningBalanceData = await thisI.leaveHistoryService._importleaveOpeningBalance(
          leaveOpeningBalance as iLeaveOpeningBalance[]
        );

        if (!updateLeaveOpeningBalanceData) {
          return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Balance Data'));
        }

        return res.status(201).json(APIResponseFormat._ResDataUpdated('Leave Data'));
      } catch (error) {
        console.log('error', error);

        FileService._deleteFile(BasePath.default.LEAVE_DATA_PATH, req.files['leaveDataFile']);
        FileService._deleteFile(BasePath.default.LEAVE_DATA_PATH, req.files['leaveBalanceDataFile']);
        FileService._deleteFile(BasePath.default.LEAVE_DATA_PATH, req.files['leaveOpeningBalanceDataFile']);

        next(error);
        return res.status(500).json(APIResponseFormat._ResIntervalServerError());
      }
    });
  };
}

export default leaveManipulationController;
