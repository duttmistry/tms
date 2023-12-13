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

class LeaveTeamController {
  public leaveHistoryService = new LeaveHistoryService();
  public leaveSubjectsService = new LeaveSubjectsService();
  public leaveBalanceService = new LeaveBalanceService();

  public getTeamLeave = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.headers.user_id ? Number(req.headers.user_id) : req.user.id;
      const leaveId = Number(req.headers.id);
      const from_date = req.headers.from_date as string;
      const to_date = req.headers.to_date as string;

      if (!from_date && !to_date) {
        return res.status(200).json(APIResponseFormat._ResDataFound({}));
      }

      const userProject = await this.leaveHistoryService._getProjectTeam({ user_id });

      if (!userProject) {
        return res.status(200).json(APIResponseFormat._ResDataFound({}));
      }

      const projects = await userProject.map((up) => up.project_id);

      const getAllProjectTeamEmployee = await this.leaveHistoryService._getProjectTeam({
        project_id: {
          [Op.in]: projects,
        },
        user_id: {
          [Op.ne]: user_id,
        },
      });

      if (!getAllProjectTeamEmployee) {
        return res.status(200).json(APIResponseFormat._ResDataFound({}));
      }
      const userTeamId = await getAllProjectTeamEmployee.map((up) => up.user_id);

      // Check Date with Pending Status leave Date
      const validateLeaveByDate = await this.leaveHistoryService._validateLeave({
        [Op.and]: [
          {
            [Op.or]: [
              // {
              //   [Op.and]: [
              //     {
              //       [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
              //         [Op.lte]: new Date(from_date).toISOString().slice(0, 10),
              //         // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              //       }),
              //     },
              //     {
              //       [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
              //         [Op.gte]: new Date(to_date).toISOString().slice(0, 10),
              //         // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              //       }),
              //     },
              //   ],
              // },
              // {
              //   [Op.and]: [
              //     {
              //       [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
              //         [Op.lte]: new Date(to_date).toISOString().slice(0, 10),
              //         // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              //       }),
              //     },
              //     {
              //       [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
              //         [Op.gte]: new Date(from_date).toISOString().slice(0, 10),
              //         // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              //       }),
              //     },
              //   ],
              // },

              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                      [Op.gte]: new Date(from_date).toISOString().slice(0, 10),
                      // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                      [Op.lte]: new Date(to_date).toISOString().slice(0, 10),
                      // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                    }),
                  },
                ],
              },
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                      [Op.lte]: new Date(to_date).toISOString().slice(0, 10),
                      // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                      [Op.gte]: new Date(from_date).toISOString().slice(0, 10),
                      // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                    }),
                  },
                ],
              },
            ],
          },
          {
            user_id: {
              [Op.in]: userTeamId,
            },
          },
          {
            id: {
              [Op.ne]: leaveId,
            },
          },
          {
            status: {
              [Op.notIn]: ['REJECTED', 'CANCELLED'],
            },
          },
        ],
      });

      if (!validateLeaveByDate) {
        return res.status(200).json(APIResponseFormat._ResDataFound({}));
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(validateLeaveByDate));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getTeamDashboardLeave = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.headers.user_id ? Number(req.headers.user_id) : req.user.id;
      const leaveId = Number(req.headers.id);
      const from_date = new Date();
      const to_date = new Date();
      to_date.setDate(from_date.getDate() + 7);

      if (!from_date && !to_date) {
        return res.status(200).json(APIResponseFormat._ResDataFound({}));
      }

      const userProject = await this.leaveHistoryService._getProjectTeam({ user_id });

      if (!userProject) {
        return res.status(200).json(APIResponseFormat._ResDataFound({}));
      }

      const projects = await userProject.map((up) => up.project_id);

      const getAllProjectTeamEmployee = await this.leaveHistoryService._getProjectTeam({
        project_id: {
          [Op.in]: projects,
        },
        user_id: {
          [Op.ne]: user_id,
        },
      });

      if (!getAllProjectTeamEmployee) {
        return res.status(200).json(APIResponseFormat._ResDataFound({}));
      }
      const userTeamId = await getAllProjectTeamEmployee.map((up) => up.user_id);
      // Check Date with Pending Status leave Date
      const validateLeaveByDate = await this.leaveHistoryService._validateLeave({
        [Op.and]: [
          {
            [Op.or]: [
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                      [Op.gte]: new Date(from_date).toISOString().slice(0, 10),
                      // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                      [Op.lte]: new Date(to_date).toISOString().slice(0, 10),
                      // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                    }),
                  },
                ],
              },
              {
                [Op.and]: [
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                      [Op.lte]: new Date(to_date).toISOString().slice(0, 10),
                      // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                    }),
                  },
                  {
                    [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                      [Op.gte]: new Date(from_date).toISOString().slice(0, 10),
                      // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                    }),
                  },
                ],
              },
            ],
          },
          {
            user_id: {
              [Op.in]: [...userTeamId, user_id],
            },
          },
          // {
          //   id: {
          //     [Op.ne]: leaveId,
          //   },
          // },
          {
            status: {
              [Op.in]: ['APPROVED', 'PENDING'],
            },
          },
        ],
      });

      if (!validateLeaveByDate) {
        return res.status(200).json(APIResponseFormat._ResDataFound({}));
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(validateLeaveByDate));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default LeaveTeamController;
