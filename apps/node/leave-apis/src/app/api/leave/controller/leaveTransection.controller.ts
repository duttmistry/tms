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

class leaveTransectionController {
  public leaveHistoryService = new LeaveHistoryService();
  public leaveSubjectsService = new LeaveSubjectsService();
  public leaveBalanceService = new LeaveBalanceService();

  public getLeaveTxnHistory = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, from_date, to_date, leave_type, search_remark } = req.query;

      const emp_id = Number(req.headers.id);
      const user_id = req.user.id;

      const fromDate = from_date ? new Date(from_date as string) : null;
      const toDate = to_date ? new Date(to_date as string) : null;
      const leaveType = leave_type;
      const searchRemarks = search_remark as string;
      let where = {};
      const validation = [];

      if (fromDate && toDate) {
        if (fromDate > toDate) {
          return res.status(409).json(APIResponseFormat._ResCustomRequest(`Invalid date range. Please reselect.`));
        }
        validation.push({
          [Op.or]: [
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('created_date')), {
                [Op.between]: [new Date(fromDate).toISOString().slice(0, 10), new Date(toDate).toISOString().slice(0, 10)],
                // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              }),
            },
          ],
        });
      } else {
        if (fromDate) {
          validation.push({
            [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('created_date')), {
              [Op.lte]: new Date(fromDate).toISOString().slice(0, 10),
              // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
            }),
          });
        }

        if (toDate) {
          validation.push({
            [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('created_date')), {
              [Op.lte]: new Date(toDate).toISOString().slice(0, 10),
              // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
            }),
          });
        }
      }

      if (leaveType) {
        validation.push({ leave_type: leaveType });
      }

      // condole.log('searchRemarks', searchRemarks);

      if (searchRemarks) {
        validation.push({
          [Op.or]: {
            ...where,
            remarks: { [Op.like]: `%${searchRemarks}%` },
          },
        });
      }

      validation.push({
        user_id: emp_id,
      });

      where = { [Op.and]: validation };
      // const where = {
      //   user_id: emp_id,
      // };

      const count = await this.leaveHistoryService._getLeavesTxnHistoryCount(where);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const LeavesTxnHistory = await this.leaveHistoryService._getAllLeavesTxnHistory(where, +page, +limit, sortBy as string, orderBy as string);

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(LeavesTxnHistory, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getLeaveTxnHistoryUser = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const emp_id = Number(req.headers.id);

      // condole.log('emp_id', emp_id);

      const where = {
        id: emp_id,
      };

      const userDetails = await this.leaveHistoryService._getLeavesTxnHistoryUserDetails(where);

      if (!userDetails) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const userDetailsData = {
        first_name: userDetails.first_name,
        last_name: userDetails.last_name,
        designation: userDetails.designation,
        employee_image: userDetails.employee_image,
        team_lead: userDetails.team_lead_name,
        project_manager: userDetails.project_manager_name,
        leaveBalance: userDetails.leaveBalance,
      };

      return res.status(200).json(APIResponseFormat._ResDataFound(userDetailsData));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default leaveTransectionController;
