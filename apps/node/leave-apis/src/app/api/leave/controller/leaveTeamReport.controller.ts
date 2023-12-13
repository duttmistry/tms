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

class LeaveTeamReportController {
  public leaveHistoryService = new LeaveHistoryService();
  public leaveSubjectsService = new LeaveSubjectsService();
  public leaveBalanceService = new LeaveBalanceService();

  // Employee Leave Report
  public getLeaveReport = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, search } = req.query;

      const user_id = req.user.id;

      let where = {};
      if (search) {
        where = {
          [Op.or]: {
            first_name: { [Op.like]: `%${search}%` },
            last_name: { [Op.like]: `%${search}%` },
            employee_id: { [Op.like]: `%${search}%` },
          },
        };
      }

      const count = await this.leaveHistoryService._getLeaveReportCount(where);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const leaveBalance = await this.leaveHistoryService._getLeaveReport(where, +page, +limit, sortBy as string, orderBy as string);

      if (!leaveBalance) return res.status(404).json(APIResponseFormat._ResDataNotFound());

      // Create an empty object to store the final data
      const result = {};

      // Loop through each item in the original array
      // leaveBalance.forEach((item) => {
      //   const { id, user, leave_type, current_balance, applied_balance, reserved_balance } = item;

      //   // If the user_id doesn't exist in the result object, create a new object for that user
      //   if (!result[user_id]) {
      //     result[user_id] = {
      //       user_id,
      //       first_name: user.first_name,
      //       last_name: user.last_name,
      //       designation: user.designation,
      //       employee_image: user.employee_image,
      //       employee_id: user.employee_id,
      //       current: {},
      //       reserved: {},
      //       used: {},
      //     };
      //   }

      //   // Add the current, reserved, and used balances for the given leave_type
      //   result[user_id].current[leave_type] = current_balance;
      //   result[user_id].reserved[leave_type] = reserved_balance;
      //   result[user_id].used[leave_type] = applied_balance;
      // });

      // Convert the result object to an array of objects
      const EmployeeLeaveReport = leaveBalance.map((emp) => {
        const current = {};
        const reserved = {};
        const used = {};

        emp.leaveBalance.forEach((element) => {
          current[element.leave_type] = element.current_balance;
          reserved[element.leave_type] = element.reserved_balance;
          used[element.leave_type] = element.applied_balance;
        });

        return {
          user_id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          designation: emp.designation,
          employee_image: emp.employee_image,
          employee_id: emp.employee_id,
          current: current,
          reserved: reserved,
          used: used,
        };
      });

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(EmployeeLeaveReport, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default LeaveTeamReportController;
