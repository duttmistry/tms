import { NextFunction, Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { Query, Pagination, APIResponseFormat } from '@tms-workspace/apis-core';
import LeaveManualUpdateService from '../services/leave_manual_update.service';
import LeaveBalanceService from '../../leave_balance/services/leave_balance.service';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import { Leave_Manual_Enum, Leave_Type } from '@tms-workspace/enum-data';
import { iLeaveManualUpdateDraftResponseData } from '../../../database/interface/leave.interface';
import eventEmitter from '../../../../core/leave-txn-events';

class LeaveController {
  public leaveManualUpdateService = new LeaveManualUpdateService();
  public leaveBalanceService = new LeaveBalanceService();

  public getLeaveManualLogList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, month, year } = req.query;

      let where;

      if (year) {
        where = { ...where, year };
      }

      if (month) {
        where = { ...where, month };
      }

      where = { status: 'Saved' };

      const count = await this.leaveManualUpdateService._getLeaveManualUpdateLogCount(where);

      if (count < 0) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const data = await this.leaveManualUpdateService._getLeaveManualUpdateLogList(where, +page, +limit, sortBy as string, orderBy as string);

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getLeaveManualData = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, search } = req.query;
      const logId = Number(req.headers.id);

      const where = { leave_manual_log_id: logId };

      let leaveManualUpdateLogData = {};

      if (!logId) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('log Id'));
      }

      let where1 = {};
      const manualLog = await this.leaveManualUpdateService._getLeaveManualUpdateLog({
        id: logId,
      });
      if (search) {
        where1 = {
          ...where1,
          [Op.or]: {
            '$userDetails.first_name$': { [Op.like]: `%${search}%` },
            '$userDetails.last_name$': { [Op.like]: `%${search}%` },
            comments: { [Op.like]: `%${search}%` },
          },
        };
      }

      where1 = {
        ...where1,
        [Op.and]: { leave_manual_log_id: logId },
      };

      leaveManualUpdateLogData = { ...manualLog };

      const getAllUserData = await this.leaveManualUpdateService._getLeaveManualUpdateDraft(
        where1,
        +page,
        +limit,
        sortBy as string,
        orderBy as string
      );

      const data: Array<iLeaveManualUpdateDraftResponseData> = Object.values(
        getAllUserData.reduce((acc, curr) => {
          const emp_Id = curr.userDetails.id;

          if (!acc[emp_Id]) {
            acc[emp_Id] = {
              id: emp_Id,
              first_name: curr.userDetails.first_name,
              last_name: curr.userDetails.last_name,
              designation: curr.userDetails.designation,

              opening_CL: curr.leave_type === 'CL' ? curr.leave_opening : 0,
              opening_PL: curr.leave_type === 'PL' ? curr.leave_opening : 0,
              opening_LWP: curr.leave_type === 'LWP' ? curr.leave_opening : 0,
              used_CL: curr.leave_type === 'CL' ? curr.leave_used : 0,
              used_PL: curr.leave_type === 'PL' ? curr.leave_used : 0,
              used_LWP: curr.leave_type === 'LWP' ? curr.leave_used : 0,
              added_CL: curr.leave_type === 'CL' ? curr.leave_added : 0,
              added_PL: curr.leave_type === 'PL' ? curr.leave_added : 0,
              adjusted_LWP: curr.leave_type === 'LWP' ? curr.leave_added : 0,
              current_CL: curr.leave_type === 'CL' ? curr.leave_current : 0,
              current_PL: curr.leave_type === 'PL' ? curr.leave_current : 0,
              current_LWP: curr.leave_type === 'LWP' ? curr.leave_current : 0,
              new_balance_CL: curr.leave_type === 'CL' ? curr.leave_current + curr.leave_added : 0,
              new_balance_PL: curr.leave_type === 'PL' ? curr.leave_current + curr.leave_added : 0,
              new_balance_LWP: curr.leave_type === 'LWP' ? curr.leave_current - curr.leave_added : 0,
              comments: curr.comments,
            };
          } else {
            if (curr.leave_type === 'CL') {
              acc[emp_Id].opening_CL = curr.leave_opening;
              acc[emp_Id].used_CL = curr.leave_used;
              acc[emp_Id].added_CL = curr.leave_added;
              acc[emp_Id].current_CL = curr.leave_current;
              acc[emp_Id].new_balance_CL = curr.leave_current + curr.leave_added;
            }

            if (curr.leave_type === 'PL') {
              acc[emp_Id].opening_PL = curr.leave_opening;

              acc[emp_Id].used_PL = curr.leave_used;
              acc[emp_Id].added_PL = curr.leave_added;
              acc[emp_Id].current_PL = curr.leave_current;
              acc[emp_Id].new_balance_PL = curr.leave_current + curr.leave_added;
            }

            if (curr.leave_type === 'LWP') {
              acc[emp_Id].opening_LWP = curr.leave_opening;

              acc[emp_Id].used_LWP = curr.leave_used;
              acc[emp_Id].adjusted_LWP = curr.leave_added;
              acc[emp_Id].current_LWP = curr.leave_current;
              acc[emp_Id].new_balance_LWP = curr.leave_current - curr.leave_added;
            }
          }

          return acc;
        }, {})
      );

      if (orderBy === 'asc') {
        data.sort((a, b) => (a.first_name.toLowerCase() > b.first_name.toLowerCase() ? 1 : -1));
      } else {
        data.sort((a, b) => (a.first_name.toLowerCase() < b.first_name.toLowerCase() ? 1 : -1));
      }

      return res.status(200).json(APIResponseFormat._ResDataFound({ leaveManualUpdateLog: leaveManualUpdateLogData, leaveManualUpdateDraft: data }));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getLeaveManualUpdateData = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, search, userIds } = req.query;
      const user_id = req.user.id;

      console.log('userIds', userIds);
      console.log('userIds', userIds.length);

      const userId = JSON.parse(userIds as string);
      const monthDate = new Date(req.query.monthDate as string);
      const year = monthDate.getFullYear();
      const month = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1).toLocaleString('default', { month: 'long' });

      console.log('month', month);
      

      const user_validation = [];
      const validation = [];
      let leaveManualUpdateLogData = {};

      if (!year) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('year'));
      }

      if (!month) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('month'));
      }

      const manualLogCount = await this.leaveManualUpdateService._getLeaveManualUpdateLogCount({
        month,
        year,
      });

      console.log('manualLogCount', manualLogCount);

      console.log('userId', userId);
      console.log('userId', userId.length);

      //  userId.length !== null
      //       ? {
      //           [Op.or]: [
      //             {
      //               id: {
      //                 [Op.in]: userId,
      //               },
      //             },
      //           ],
      //         }
      //       :

      if (manualLogCount <= 0) {
        const where1 = {
          status: 'employee',
          is_active: 1,
        };
        const where2 = { month };
        console.log('11111');
        // Get User Data
        const getAllUserData = await this.leaveManualUpdateService._getUserData(where1, where2, +page, +limit, sortBy as string, orderBy as string);

        console.log('getAllUserData', getAllUserData);

        const leaveManualUpdateData = await Promise.all(
          getAllUserData.map(async (userData) => {
            const OpeningCL = userData.leaveOpeningClosingBalance.find(
              (locb) => locb.leave_type.toString() === Leave_Type.CL.toString() && locb.month === month && locb.year === year
            );
            const OpeningPL = userData.leaveOpeningClosingBalance.find(
              (locb) => locb.leave_type.toString() === Leave_Type.PL.toString() && locb.month === month && locb.year === year
            );

            const OpeningLWP = userData.leaveOpeningClosingBalance.find(
              (locb) => locb.leave_type.toString() === Leave_Type.LWP.toString() && locb.month === month
            );

            const CurrentCL = userData.leaveBalance.find((lb) => lb.leave_type.toString() === Leave_Type.CL.toString());
            const CurrentPL = userData.leaveBalance.find((lb) => lb.leave_type.toString() === Leave_Type.PL.toString());
            const CurrentLWP = userData.leaveBalance.find((lb) => lb.leave_type.toString() === Leave_Type.LWP.toString());

            // console.log('leaveHistory', user.leaveHistory);
            const UsedData = await this.leaveManualUpdateService._getLeaveHistoryMonthCount({
              status: 'APPROVED',
              user_id: userData.id,
              [Op.or]: [
                {
                  [Op.and]: [
                    Sequelize.where(Sequelize.fn('MONTHNAME', Sequelize.col('from_date')), month),
                    Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('from_date')), year),
                  ],
                },
              ],
            });

            let UsedCL = 0;
            let UsedPL = 0;
            let UsedLWP = 0;

            UsedData.forEach((userleave) => {
              UsedCL += userleave.leaveTypes
                .filter((leave) => leave.leave_type.toString() === Leave_Type.CL.toString())
                .reduce((sum, item) => sum + item.leave_days, 0);
              UsedPL += userleave.leaveTypes
                .filter((leave) => leave.leave_type.toString() === Leave_Type.PL.toString())
                .reduce((sum, item) => sum + item.leave_days, 0);
              UsedLWP += userleave.leaveTypes
                .filter((leave) => leave.leave_type.toString() === Leave_Type.LWP.toString())
                .reduce((sum, item) => sum + item.leave_days, 0);

              console.log('UsedCL', UsedCL);
              console.log('UsedPL', UsedPL);
              console.log('UsedLWP', UsedLWP);
            });

            return {
              id: userData.id,
              opening_CL: OpeningCL?.opening_balance || 0,
              opening_PL: OpeningPL?.opening_balance || 0,
              opening_LWP: OpeningLWP?.opening_balance || 0,
              used_CL: UsedCL || 0,
              used_PL: UsedPL || 0,
              used_LWP: UsedLWP || 0,
              added_CL: 1,
              added_PL: 1,
              adjusted_LWP: 0,
              current_CL: CurrentCL?.current_balance || 0,
              current_PL: CurrentPL?.current_balance || 0,
              current_LWP: CurrentLWP?.current_balance || 0,
              comments: '',
            };
          })
        );

        // Format Log Data
        const leaveManualUpdateLogData = {
          year: Number(year),
          month: month.toString(),
          status: Leave_Manual_Enum.InProcess,
          draft_date: new Date(),
          final_save_date: null,
          created_by: user_id,
          updated_by: user_id,
        };

        // Add Monthly Log

        const leaveManualUpdateLogResponse = await this.leaveManualUpdateService._createLeaveManualUpdateLog(leaveManualUpdateLogData);

        // Format Data for Save New Draft Leave Type CL
        const leaveManualUpdateCLData = leaveManualUpdateData?.map((user) => {
          return {
            leave_manual_log_id: leaveManualUpdateLogResponse.id,
            year: Number(year),
            month: month.toString(),
            user_id: user.id,
            leave_type: Leave_Type.CL,
            leave_opening: user.opening_CL,
            leave_used: user.used_CL,
            leave_added: user.added_CL || 0,
            leave_current: user.current_CL,
            comments: user.comments,
            created_by: user_id,
            updated_by: user_id,
          };
        });

        // Format Data for Save New Draft Leave Type PL
        const leaveManualUpdatePLData = leaveManualUpdateData?.map((user) => {
          return {
            leave_manual_log_id: leaveManualUpdateLogResponse.id,
            year: Number(year),
            month: month.toString(),
            user_id: user.id,
            leave_type: Leave_Type.PL,
            leave_opening: user.opening_PL,
            leave_used: user.used_PL,
            leave_added: user.added_PL || 0,
            leave_current: user.current_PL,
            comments: user.comments,
            created_by: user_id,
            updated_by: user_id,
          };
        });

        // Format Data for Save New Draft Leave Type PL
        const leaveManualUpdateLWPData = leaveManualUpdateData?.map((user) => {
          return {
            leave_manual_log_id: leaveManualUpdateLogResponse.id,
            year: Number(year),
            month: month.toString(),
            user_id: user.id,
            leave_type: Leave_Type.LWP,
            leave_opening: user.opening_LWP,
            leave_used: user.used_LWP,
            leave_added: user.adjusted_LWP || 0,
            leave_current: user.current_LWP,
            comments: user.comments,
            created_by: user_id,
            updated_by: user_id,
          };
        });

        // Merge both Leave Type Data
        const leaveManualUpdateDataDetails = [...leaveManualUpdateCLData, ...leaveManualUpdatePLData, ...leaveManualUpdateLWPData];

        // Add Data into Draft
        await this.leaveManualUpdateService._createLeaveManualUpdateDraftData(leaveManualUpdateDataDetails);

        // update Log Status InProcess to Draft
        await this.leaveManualUpdateService._updateLeaveManualUpdateLog(
          {
            status: Leave_Manual_Enum.Draft,
          },
          { id: leaveManualUpdateLogResponse.id }
        );
      }

      let where1 = {};

      const manualLog = await this.leaveManualUpdateService._getLeaveManualUpdateLog({
        month,
        year,
      });
      if (search) {
        where1 = {
          ...where1,
          [Op.or]: {
            '$userDetails.first_name$': { [Op.like]: `%${search}%` },
            '$userDetails.last_name$': { [Op.like]: `%${search}%` },
            comments: { [Op.like]: `%${search}%` },
          },
        };
      }

      if (userId.length > 0) {
        where1 = {
          ...where1,

          [Op.and]: [
            { leave_manual_log_id: manualLog.id },
            {
              user_id: {
                [Op.in]: userId,
              },
            },
          ],
        };
      } else {
        where1 = {
          ...where1,
          [Op.and]: [{ leave_manual_log_id: manualLog.id }],
        };
      }

      leaveManualUpdateLogData = { ...manualLog };

      console.log('where1', where1);

      const getAllUserData = await this.leaveManualUpdateService._getLeaveManualUpdateDraft(
        where1,
        +page,
        +limit,
        sortBy as string,
        orderBy as string
      );
      console.log('where2', getAllUserData);
      const data: Array<iLeaveManualUpdateDraftResponseData> = Object.values(
        getAllUserData.reduce((acc, curr) => {
          console.log('2.3', curr);
          if(curr.userDetails){
          const emp_Id = curr.userDetails.id;

          if (!acc[emp_Id]) {
            acc[emp_Id] = {
              id: emp_Id,
              first_name: curr.userDetails.first_name,
              last_name: curr.userDetails.last_name,
              designation: curr.userDetails.designation,

              opening_CL: curr.leave_type === 'CL' ? curr.leave_opening : 0,
              opening_PL: curr.leave_type === 'PL' ? curr.leave_opening : 0,
              opening_LWP: curr.leave_type === 'LWP' ? curr.leave_opening : 0,
              used_CL: curr.leave_type === 'CL' ? curr.leave_used : 0,
              used_PL: curr.leave_type === 'PL' ? curr.leave_used : 0,
              used_LWP: curr.leave_type === 'LWP' ? curr.leave_used : 0,
              added_CL: curr.leave_type === 'CL' ? curr.leave_added : 0,
              added_PL: curr.leave_type === 'PL' ? curr.leave_added : 0,
              adjusted_LWP: curr.leave_type === 'LWP' ? curr.leave_added : 0,
              current_CL: curr.leave_type === 'CL' ? curr.leave_current : 0,
              current_PL: curr.leave_type === 'PL' ? curr.leave_current : 0,
              current_LWP: curr.leave_type === 'LWP' ? curr.leave_current : 0,
              new_balance_CL: curr.leave_type === 'CL' ? curr.leave_current + curr.leave_added : 0,
              new_balance_PL: curr.leave_type === 'PL' ? curr.leave_current + curr.leave_added : 0,
              new_balance_LWP: curr.leave_type === 'LWP' ? curr.leave_current - curr.leave_added : 0,
              comments: curr.comments,
            };
          } else {
            if (curr.leave_type === 'CL') {
              acc[emp_Id].opening_CL = curr.leave_opening;
              acc[emp_Id].used_CL = curr.leave_used;
              acc[emp_Id].added_CL = curr.leave_added;
              acc[emp_Id].current_CL = curr.leave_current;
              acc[emp_Id].new_balance_CL = curr.leave_current + curr.leave_added;
            }

            if (curr.leave_type === 'PL') {
              acc[emp_Id].opening_PL = curr.leave_opening;

              acc[emp_Id].used_PL = curr.leave_used;
              acc[emp_Id].added_PL = curr.leave_added;
              acc[emp_Id].current_PL = curr.leave_current;
              acc[emp_Id].new_balance_PL = curr.leave_current + curr.leave_added;
            }

            if (curr.leave_type === 'LWP') {
              acc[emp_Id].opening_LWP = curr.leave_opening;

              acc[emp_Id].used_LWP = curr.leave_used;
              acc[emp_Id].adjusted_LWP = curr.leave_added;
              acc[emp_Id].current_LWP = curr.leave_current;
              acc[emp_Id].new_balance_LWP = curr.leave_current - curr.leave_added;
            }
          }
        }
          return acc;
        }, {})
      );

      if (orderBy === 'asc') {
        data.sort((a, b) => (a.first_name.toLowerCase() > b.first_name.toLowerCase() ? 1 : -1));
      } else {
        data.sort((a, b) => (a.first_name.toLowerCase() < b.first_name.toLowerCase() ? 1 : -1));
      }

      return res.status(200).json(APIResponseFormat._ResDataFound({ leaveManualUpdateLog: leaveManualUpdateLogData, leaveManualUpdateDraft: data }));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getLeaveManualDraft = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;
      const monthDate = new Date(req.headers.monthdate as string);
      const year = monthDate.getFullYear();
      const month = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1).toLocaleString('default', { month: 'long' });
      const draftLogId = Number(req.headers.draftlogid);
      const userData = JSON.parse(JSON.stringify(req.body.data));

      if (!year) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('year'));
      }

      if (!month) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('month'));
      }

      //check for Saved or Not
      const checkLogStatus = await this.leaveManualUpdateService._getLeaveManualUpdateLog({ status: 'Saved', id: draftLogId });

      if (checkLogStatus) {
        return res.status(409).json(APIResponseFormat._ResCustomRequest(`The leave for ${month} has already been saved.`));
      }

      // Save to Draft

      // Old Draft
      if (draftLogId) {
        // Get All Draft Data for Update
        const getAllData = await this.leaveManualUpdateService._getLeaveManualUpdateDraft({ leave_manual_log_id: draftLogId });

        // Put Log into InProcess Status
        await this.leaveManualUpdateService._updateLeaveManualUpdateLog(
          {
            status: Leave_Manual_Enum.InProcess,
          },
          { id: draftLogId }
        );

        // format Data for Draft Update For Leave Type PL
        const leaveManualUpdatePLData = userData.map((user) => {
          const getID = getAllData.find(
            (data) =>
              data.leave_manual_log_id === draftLogId &&
              data.year === year &&
              data.month === month &&
              data.leave_type === 'PL' &&
              data.user_id === user.id
          );

          console.log('getID', getID);
          console.log('user', user);

          return {
            id: getID.id || null,
            year,
            month,
            leave_manual_log_id: draftLogId,
            user_id: user.id,
            leave_type: 'PL',
            leave_opening: getID.leave_opening,
            leave_used: getID.leave_used,
            leave_added: user.added_PL,
            leave_current: getID.leave_current,
            comments: user.comments,
            created_by: getID.created_by,
            updated_by: user_id,
          };
        });

        // format Data for Draft Update For Leave Type CL
        const leaveManualUpdateCLData = userData.map((user) => {
          const getID = getAllData.find(
            (data) =>
              data.leave_manual_log_id === draftLogId &&
              data.year === year &&
              data.month === month &&
              data.leave_type === 'CL' &&
              data.user_id === user.id
          );
          console.log('getID', getID);
          console.log('user', user);
          return {
            id: getID.id || null,
            year,
            month,
            leave_manual_log_id: draftLogId,
            user_id: user.id,
            leave_type: 'CL',
            leave_opening: getID.leave_opening,
            leave_used: getID.leave_used,
            leave_added: user.added_CL,
            leave_current: getID.leave_current,
            comments: user.comments,
            created_by: getID.created_by,
            updated_by: user_id,
          };
        });

        // format Data for Draft Update For Leave Type LWP
        const leaveManualUpdateLWPData = userData.map((user) => {
          const getID = getAllData.find(
            (data) =>
              data.leave_manual_log_id === draftLogId &&
              data.year === year &&
              data.month === month &&
              data.leave_type === 'LWP' &&
              data.user_id === user.id
          );
          console.log('getID', getID);
          console.log('user', user);
          return {
            id: getID.id || null,
            year,
            month,
            leave_manual_log_id: draftLogId,
            user_id: user.id,
            leave_type: 'LWP',
            leave_opening: getID.leave_opening,
            leave_used: getID.leave_used,
            leave_added: user.adjusted_LWP,
            leave_current: getID.leave_current,
            comments: user.comments,
            created_by: getID.created_by,
            updated_by: user_id,
          };
        });

        // Merge Both leave Type Data
        const leaveManualUpdateData = [...leaveManualUpdateCLData, ...leaveManualUpdatePLData, ...leaveManualUpdateLWPData];

        // update Draft Data
        await this.leaveManualUpdateService._updateLeaveManualUpdateDraftData(leaveManualUpdateData);

        // Update log Status In Process to Draft
        await this.leaveManualUpdateService._updateLeaveManualUpdateLog(
          {
            status: Leave_Manual_Enum.Draft,
            draft_date: new Date(),
            updated_by: user_id,
          },
          { id: draftLogId }
        );
      } else {
        // New Draft Process

        // Format Log Data
        const leaveManualUpdateLogData = {
          year: Number(year),
          month,
          status: Leave_Manual_Enum.InProcess,
          draft_date: new Date(),
          final_save_date: null,
          created_by: user_id,
          updated_by: user_id,
        };

        // Add Monthly Log

        const leaveManualUpdateLogResponse = await this.leaveManualUpdateService._createLeaveManualUpdateLog(leaveManualUpdateLogData);

        // Format Data for Save New Draft Leave Type CL
        const leaveManualUpdateCLData = userData?.map((user) => {
          return {
            leave_manual_log_id: leaveManualUpdateLogResponse.id,
            year: year,
            month,
            user_id: user.id,
            leave_type: 'CL',
            leave_opening: user.opening_CL,
            leave_used: user.used_CL,
            leave_added: user.added_CL || 0,
            leave_current: user.current_CL,
            comments: user.comments,
            created_by: user_id,
            updated_by: user_id,
          };
        });
        // Format Data for Save New Draft Leave Type PL
        const leaveManualUpdatePLData = userData?.map((user) => {
          return {
            leave_manual_log_id: leaveManualUpdateLogResponse.id,
            year: year,
            month,
            user_id: user.id,
            leave_type: 'PL',
            leave_opening: user.opening_PL,
            leave_used: user.used_PL,
            leave_added: user.added_PL || 0,
            leave_current: user.current_PL,
            comments: user.comments,
            created_by: user_id,
            updated_by: user_id,
          };
        });

        // Merge both Leave Type Data
        const leaveManualUpdateData = [...leaveManualUpdateCLData, ...leaveManualUpdatePLData];

        // Add Data into Draft
        await this.leaveManualUpdateService._createLeaveManualUpdateDraftData(leaveManualUpdateData);

        // update Log Status InProcess to Draft
        await this.leaveManualUpdateService._updateLeaveManualUpdateLog(
          {
            status: Leave_Manual_Enum.Draft,
          },
          { id: leaveManualUpdateLogResponse.id }
        );
      }

      return res.status(200).json(APIResponseFormat._ResDataFound([]));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getLeaveManualSave = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;
      const monthDate = new Date(req.headers.monthdate as string);
      const year = monthDate.getFullYear();
      const month = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1).toLocaleString('default', { month: 'long' });
      const draftLogId = Number(req.headers.draftlogid);
      const userData = JSON.parse(JSON.stringify(req.body.data));
      console.log('monthDate', monthDate);
      console.log('year', year);
      console.log('month', month);

      if (!year) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('year'));
      }

      if (!month) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('month'));
      }

      //check for Saved or Not
      const checkLogStatus = await this.leaveManualUpdateService._getLeaveManualUpdateLog({ status: 'Saved', id: draftLogId });

      if (checkLogStatus) {
        return res.status(409).json(APIResponseFormat._ResCustomRequest(`The leave for ${month} has already been saved.`));
      }

      // Get All Draft Data for Update
      const getAllData = await this.leaveManualUpdateService._getLeaveManualUpdateDraft({ leave_manual_log_id: draftLogId });

      // Put Log into InProcess Status
      await this.leaveManualUpdateService._updateLeaveManualUpdateLog(
        {
          status: Leave_Manual_Enum.InProcess,
        },
        { id: draftLogId }
      );

      // format Data for Draft Update For Leave Type PL
      const leaveManualUpdatePLData = userData.map((user) => {
        const getID = getAllData.find(
          (data) =>
            data.leave_manual_log_id === draftLogId &&
            data.year === year &&
            data.month === month &&
            data.leave_type === 'PL' &&
            data.user_id === user.id
        );
        return {
          id: getID.id || null,
          year,
          month,
          leave_manual_log_id: draftLogId,
          user_id: user.id,
          leave_type: 'PL',
          leave_opening: getID.leave_opening,
          leave_used: getID.leave_used,
          leave_added: user.added_PL,
          leave_current: getID.leave_current,
          comments: user.comments,
          created_by: getID.created_by,
          updated_by: user_id,
        };
      });

      // format Data for Draft Update For Leave Type CL
      const leaveManualUpdateCLData = userData.map((user) => {
        const getID = getAllData.find(
          (data) =>
            data.leave_manual_log_id === draftLogId &&
            data.year === year &&
            data.month === month &&
            data.leave_type === 'CL' &&
            data.user_id === user.id
        );
        return {
          id: getID.id || null,
          year,
          month,
          leave_manual_log_id: draftLogId,
          user_id: user.id,
          leave_type: 'CL',
          leave_opening: getID.leave_opening,
          leave_used: getID.leave_used,
          leave_added: user.added_CL,
          leave_current: getID.leave_current,
          comments: user.comments,
          created_by: getID.created_by,
          updated_by: user_id,
        };
      });

      // format Data for Draft Update For Leave Type LWP
      const leaveManualUpdateLWPData = userData.map((user) => {
        const getID = getAllData.find(
          (data) =>
            data.leave_manual_log_id === draftLogId &&
            data.year === year &&
            data.month === month &&
            data.leave_type === 'LWP' &&
            data.user_id === user.id
        );
        console.log('getID', getID);
        console.log('user', user);
        return {
          id: getID.id || null,
          year,
          month,
          leave_manual_log_id: draftLogId,
          user_id: user.id,
          leave_type: 'LWP',
          leave_opening: getID.leave_opening,
          leave_used: getID.leave_used,
          leave_added: user.adjusted_LWP,
          leave_current: getID.leave_current,
          comments: user.comments,
          created_by: getID.created_by,
          updated_by: user_id,
        };
      });

      // Merge Both leave Type Data
      const leaveManualUpdateData = [...leaveManualUpdateCLData, ...leaveManualUpdatePLData, ...leaveManualUpdateLWPData];

      // update Draft Data
      await this.leaveManualUpdateService._updateLeaveManualUpdateDraftData(leaveManualUpdateData);

      // Update Employee Balance

      // Get All Draft Data for Update
      const getAllNewData = await this.leaveManualUpdateService._getLeaveManualUpdateDraft({ leave_manual_log_id: draftLogId });

      getAllNewData.forEach(async (user) => {
        const employee_id = user.userDetails.id;
        const previousMonthOpening = user.leave_opening;
        const previousMonthClosing = user.leave_opening - user.leave_used;
        const nextMonthOpening = previousMonthClosing + user.leave_added;
        const addedLeave = user.leave_added;
        const usedLeave = user.leave_used;
        const newCurrentBalance = user.leave_added + user.leave_current;
        const newLWPCurrentBalance = user.leave_current - user.leave_used;
        const leaveType = user.leave_type;
        const leaveComment = user.comments;
        const leaveMonth = user.month;
        const leaveYear = user.year;

        if (leaveType === 'LWP') {
          await this.leaveBalanceService._updateIncreaseLeaveBalance(
            { current_balance: -usedLeave },
            { user_id: employee_id, leave_type: leaveType }
          );

          await this.leaveManualUpdateService._updateLeaveOpeningData(
            {
              closing_balance: previousMonthClosing,
            },
            {
              user_id: employee_id,
              leave_type: leaveType,
              month: leaveMonth,
              year: leaveYear,
            }
          );

          await this.leaveManualUpdateService._createLeaveOpeningData({
            user_id: employee_id,
            leave_type: leaveType,
            month: monthDate.toLocaleString('default', { month: 'long' }),
            year: leaveYear,
            opening_balance: nextMonthOpening,
            closing_balance: null,
          });
        } else {
          await this.leaveBalanceService._updateIncreaseLeaveBalance(
            { current_balance: addedLeave },
            { user_id: employee_id, leave_type: leaveType }
          );

          await this.leaveManualUpdateService._updateLeaveOpeningData(
            {
              closing_balance: previousMonthClosing,
            },
            {
              user_id: employee_id,
              leave_type: leaveType,
              month: leaveMonth,
              year: leaveYear,
            }
          );

          await this.leaveManualUpdateService._createLeaveOpeningData({
            user_id: employee_id,
            leave_type: leaveType,
            month: monthDate.toLocaleString('default', { month: 'long' }),
            year: leaveYear,
            opening_balance: nextMonthOpening,
            closing_balance: null,
          });
        }

        eventEmitter.emit('creditLeaveBySuperiority', addedLeave, leaveType, 'Leave Credit / Adjust By System', employee_id, user_id);
      });

      // Update Transection History

      // Update log Status In Process to Draft
      await this.leaveManualUpdateService._updateLeaveManualUpdateLog(
        {
          status: Leave_Manual_Enum.Saved,
          draft_date: new Date(),
          final_save_date: new Date(),
          updated_by: user_id,
        },
        { id: draftLogId }
      );

      return res.status(200).json(APIResponseFormat._ResDataFound([]));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default LeaveController;
