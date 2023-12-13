import { Response, NextFunction } from 'express';
import LeaveHistoryService from '../services/leave.service';
import LeaveSubjectsService from '../../leave_subjects/services/leave_subjects.service';
import LeaveBalanceService from '../../leave_balance/services/leave_balance.service';
import LeaveFunctions from './leaveFunction';
import { Pagination, APIResponseFormat } from '@tms-workspace/apis-core';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import { Sequelize, Op } from 'sequelize';
import moment from 'moment';
import eventEmitter from '../../../../core/leave-txn-events';
import { eventEmitterLeave } from '@tms-workspace/preference';

class LeaveApprovalController {
  public leaveHistoryService = new LeaveHistoryService();
  public leaveSubjectsService = new LeaveSubjectsService();
  public leaveBalanceService = new LeaveBalanceService();
  public leaveFunctions = new LeaveFunctions();

  //Team Leave API's

  public getApprovalLeaveCount = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;
      // condole.log('leaveCount', user_id);

      const where = {
        [Op.and]: [
          {
            status: 'PENDING',
          },
          {
            '$leaveApproval.user_id$': req.user.id,
            '$leaveApproval.status$': 'PENDING',
          },
        ],
      };

      const leaveCount = await this.leaveHistoryService._getTeamLeavesCount(where, {});

      if (!leaveCount) return res.status(200).json(APIResponseFormat._ResDataNotFound(0));

      return res.status(200).json(APIResponseFormat._ResDataFound(leaveCount));
    } catch (error) {
      console.log(error, 'error');

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getApprovalLeave = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, status } = req.query;
      const { from_date, to_date } = req.query;
      const { userIds } = req.body;
      const user_id = req.user.id;

      // condole.log('status', status);

      let where1 = {};

      let where2 = {};

      if (status && status !== 'ALL') {
        where1 = { ...where1, status };

        if (status === 'CANCELLED') {
          where2 = { ...where2 };
        } else {
          where2 = { ...where2 };
        }
      }

      if (userIds && userIds.length > 0) {
        where1 = { ...where1, user_id: { [Op.in]: userIds } };
        where2 = { ...where2 };
      }
      if (from_date && from_date !== '' && to_date && to_date !== '' && from_date != 'undefined' && to_date != 'undefined') {
        where1 = {
          ...where1,
          [Op.or]: [
            {
              [Op.and]: [
                {
                  [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                    [Op.gte]: new Date(from_date as string).toISOString().slice(0, 10),
                    // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                  }),
                },
                {
                  [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                    [Op.lte]: new Date(to_date as string).toISOString().slice(0, 10),
                    // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                  }),
                },
              ],
            },
            {
              [Op.and]: [
                {
                  [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('from_date')), {
                    [Op.lte]: new Date(to_date as string).toISOString().slice(0, 10),
                    // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                  }),
                },
                {
                  [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('to_date')), {
                    [Op.gte]: new Date(from_date as string).toISOString().slice(0, 10),
                    // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
                  }),
                },
              ],
            },
          ],
        };
      }
      // where2 = { ...where2, user_id: req.user.id };

      const count = await this.leaveHistoryService._getTeamLeavesCount_v2(where1, where2);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const leaveHistory = await this.leaveHistoryService._getAllLeaves(where1, where2, +page, +limit, sortBy as string, orderBy as string);

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);

      // const userIds = ["11", "54"];
      // const description = 'Notification Module Checking';
      // const action_by = "Vikramsinh Parmar";

      // this.event.emit('Leave Application Cancel' , userIds , description , action_by);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(leaveHistory, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getApprovalEmployee = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const leaveEmployee = await this.leaveHistoryService._getTeamLeavesEmployeeList(status);
      return res.status(200).json(APIResponseFormat._ResDataFound(leaveEmployee));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  //Team Leave Approval API's
  public action = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const leaveId = Number(req.headers.id);
      const user_id = req.user.id;

      const { status, action_comment } = req.body;

      if (!leaveId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Leave Id'));

      const leaveApprovalCheck = await this.leaveHistoryService._getApprovalOfLeave({ leave_history_id: leaveId, user_id });

      if (leaveApprovalCheck[0].status === 'APPROVED' && status !== 'CANCELLED') {
        return res.status(409).json(APIResponseFormat._ResCustomRequest('Leave Request Already Approved '));
      }

      const validation = await this.leaveHistoryService._getLeaveById(leaveId);
      if (!validation) return res.status(409).json(APIResponseFormat._ResNotExists('Leave'));

      const todayDate = moment().startOf('day');
      const validationFromDate = moment(validation.from_date).startOf('day');
      const validationToDate = moment(validation.to_date).startOf('day');

      if (
        validation.status === 'APPROVED' &&
        status !== 'CANCELLED' &&
        validationFromDate.isBefore(todayDate) &&
        validationToDate.isBefore(todayDate)
      ) {
        return res.status(400).json(APIResponseFormat._ResBadRequest('Leave modification is not possible as the leave date has already passed'));
      }

      if (validation.status === 'CANCELLED') return res.status(400).json(APIResponseFormat._ResBadRequest('Leave already Cancelled by user'));

      if (!status) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('status or action_by'));
      }

      if ((status === 'REJECTED' || status === 'CANCELLED') && !action_comment) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField(' Comment'));
      }

      const LeaveApproveStatus = {
        status,
        action_comment: action_comment.trim(),
      };

      const UpdateLeaveApprove = await this.leaveHistoryService._updateApprovalOfLeave(LeaveApproveStatus, { leave_history_id: leaveId, user_id });

      if (!UpdateLeaveApprove) return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Details'));

      const leaveHistoryLog = {
        user_id: validation.user_id,
        leave_history_id: leaveId,
        action: `Leave ${status}`,
        action_by: user_id,
      };

      const log = await this.leaveHistoryService._createLeaveLog(leaveHistoryLog);

      if (!log) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Leave History Log'));
      }

      const ApprovalCheck = await this.leaveHistoryService._getApprovalOfLeave({ leave_history_id: leaveId });

      const approvalCheckCount = ApprovalCheck.map((ac) => ac.status === 'APPROVED');
      const rejectionCheckCount = ApprovalCheck.map((ac) => ac.status === 'REJECTED');
      const cancelCheckCount = ApprovalCheck.map((ac) => ac.status === 'CANCELLED');

      const approvalCheckForResponsibleCount = ApprovalCheck.map((ac) => ac.status === 'APPROVED' && ac.type === 'leave_responsible_person');
      const rejectionCheckForResponsibleCount = ApprovalCheck.map((ac) => ac.status === 'REJECTED' && ac.type === 'leave_responsible_person');
      const cancelCheckForResponsibleCount = ApprovalCheck.map((ac) => ac.status === 'CANCELLED' && ac.type === 'leave_responsible_person');

      const leaveStatusUpdate = {
        status: 'PENDING',
        approved_by: status === 'APPROVED' ? [...validation.approved_by, user_id] : [...validation.approved_by],
      };

      let leaveCheckResponsibleCountStatus = 'PENDING';

      // if (rejectionCheckCount.includes(true)) {
      //   leaveStatusUpdate.status = 'REJECTED';
      // }

      if (approvalCheckCount.every((v) => v === true) || approvalCheckForResponsibleCount.includes(true)) {
        leaveStatusUpdate.status = 'APPROVED';
      }

      if (cancelCheckCount.includes(true)) {
        leaveStatusUpdate.status = 'CANCELLED';
      }

      if (approvalCheckForResponsibleCount.includes(true)) {
        leaveCheckResponsibleCountStatus = 'APPROVED';
      } else if (rejectionCheckForResponsibleCount.includes(true)) {
        leaveCheckResponsibleCountStatus = 'REJECTED';
        leaveStatusUpdate.status = 'REJECTED';
      } else if (cancelCheckForResponsibleCount.includes(true)) {
        leaveCheckResponsibleCountStatus = 'CANCELLED';
      } else {
        leaveCheckResponsibleCountStatus = 'PENDING';
      }

      //console.log('(approvalCheckForResponsibleCount || rejectionCheckForResponsibleCount || cancelCheckForResponsibleCount) && validation.status !== APPROVED && status !== CANCELLED',     (approvalCheckForResponsibleCount || rejectionCheckForResponsibleCount || cancelCheckForResponsibleCount) && validation.status !== 'APPROVED' &&         status !== 'CANCELLED'   );

      if (
        (approvalCheckForResponsibleCount || rejectionCheckForResponsibleCount || cancelCheckForResponsibleCount) &&
        validation.status !== 'APPROVED' &&
        status !== 'CANCELLED'
      ) {
        await this.leaveHistoryService._updateApprovalOfLeave(
          { status: leaveCheckResponsibleCountStatus },
          { leave_history_id: leaveId, type: 'leave_responsible_person' }
        );
      }

      const LeaveStatusUpdate = await this.leaveHistoryService._updateLeave(leaveStatusUpdate, leaveId);

      if (!LeaveStatusUpdate) return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Status'));

      if (leaveStatusUpdate.status === 'APPROVED') {
        await this.leaveFunctions.updateLeaveBalanceF(res, 'approveLeave', validation.user_id, validation.leaveTypes);
        eventEmitter.emit(
          'approveLeaveBySuperiority',
          moment(validation.from_date).format('DD/MM/YYYY'),
          moment(validation.to_date).format('DD/MM/YYYY'),
          validation.leaveTypes,
          validation.leave_subject ? Number(validation.leave_subject) : validation.leave_subject_text,
          validation.user_id,
          user_id
        );
        // Notification of Leave Added #START

        const leaveResponsiblePerson = validation.leaveApproval
          .filter((approvalFrom) => approvalFrom.type === 'leave_responsible_person')
          .map((obj) => obj.user_id);

        const leaveReportingPerson = validation.leaveApproval
          .filter((approvalFrom) => approvalFrom.type === 'leave_reporting_person')
          .map((obj) => obj.user_id);

        const leaveBalance = await this.leaveBalanceService._getleaveBalance({
          user_id: validation.user_id,
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

        let getLeaves = await this.leaveHistoryService._getUserMost3Leave({
          user_id: validation.user_id,
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

        const data = {
          leave_id: validation.id,
          leave_request_user: [validation.user_id],
          leave_request_user_name: `${validation.user.first_name} ${validation.user.last_name}`,
          leave_responsible_person: leaveResponsiblePerson,
          leave_reporting_person: leaveReportingPerson,
          leave_status: 'APPROVED',
          action_by: req.user.first_name + ' ' + req.user.last_name,
          leave_date_from: moment(validation.from_date).format('DD/MM/YYYY'),
          leave_date_to: moment(validation.to_date).format('DD/MM/YYYY'),
          action_by_profile: req.user.user_image,
          leaves_on_current_year: leaves_on_current_year,
          leave_subject: validation.description,
          total_leave_days: validation.no_of_days,
          leave_type: validation.leaveTypes[0].leave_type,
          cl: clCurrentBalance,
          pl: plCurrentBalance,
          leave_description: validation.description,
          leave_responsible_person_name: '',
        };

        eventEmitterLeave.default.emit('notify_leave_status_changed', data);
        // Notification of Leave Added #END
      }

      if (leaveStatusUpdate.status === 'REJECTED') {
        await this.leaveFunctions.updateLeaveBalanceF(res, 'rejectorcancelLeave', validation.user_id, validation.leaveTypes);

        eventEmitter.emit(
          'cancelLeaveBySuperiority',
          moment(validation.from_date).format('DD/MM/YYYY'),
          moment(validation.to_date).format('DD/MM/YYYY'),
          validation.leaveTypes,
          validation.leave_subject ? Number(validation.leave_subject) : validation.leave_subject_text,
          validation.user_id,
          user_id
        );

        // Notification of Leave Added #START

        const leaveResponsiblePerson = validation.leaveApproval
          .filter((approvalFrom) => approvalFrom.type === 'leave_responsible_person')
          .map((obj) => obj.user_id);

        const leaveReportingPerson = validation.leaveApproval
          .filter((approvalFrom) => approvalFrom.type === 'leave_reporting_person')
          .map((obj) => obj.user_id);

        const leaveBalance = await this.leaveBalanceService._getleaveBalance({
          user_id: validation.user_id,
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

        let getLeaves = await this.leaveHistoryService._getUserMost3Leave({
          user_id: validation.user_id,
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

        const data = {
          leave_id: validation.id,
          leave_request_user: [validation.user_id],
          leave_request_user_name: `${validation.user.first_name} ${validation.user.last_name}`,
          leave_responsible_person: leaveResponsiblePerson,
          leave_reporting_person: leaveReportingPerson,
          leave_status: 'REJECTED',
          action_by: req.user.first_name + ' ' + req.user.last_name,
          leave_date_from: moment(validation.from_date).format('DD/MM/YYYY'),
          leave_date_to: moment(validation.to_date).format('DD/MM/YYYY'),
          action_by_profile: req.user.user_image,
          leaves_on_current_year: leaves_on_current_year,
          leave_subject: validation.description,
          total_leave_days: validation.no_of_days,
          leave_type: validation.leaveTypes[0].leave_type,
          cl: clCurrentBalance,
          pl: plCurrentBalance,
          leave_description: validation.description,
          leave_responsible_person_name: '',
        };

        eventEmitterLeave.default.emit('notify_leave_status_changed', data);
        // Notification of Leave Added #END
      }

      if (leaveStatusUpdate.status === 'CANCELLED') {
        await this.leaveFunctions.updateLeaveBalanceF(res, 'cancelApprovedLeave', validation.user_id, validation.leaveTypes);

        eventEmitter.emit(
          'cancelLeaveBySuperiority',
          moment(validation.from_date).format('DD/MM/YYYY'),
          moment(validation.to_date).format('DD/MM/YYYY'),
          validation.leaveTypes,
          validation.leave_subject ? Number(validation.leave_subject) : validation.leave_subject_text,
          validation.user_id,
          user_id
        );

        // Notification of Leave Added #START

        const leaveResponsiblePerson = validation.leaveApproval
          .filter((approvalFrom) => approvalFrom.type === 'leave_responsible_person')
          .map((obj) => obj.user_id);

        const leaveReportingPerson = validation.leaveApproval
          .filter((approvalFrom) => approvalFrom.type === 'leave_reporting_person')
          .map((obj) => obj.user_id);

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

        let getLeaves = await this.leaveHistoryService._getUserMost3Leave({
          user_id: validation.user_id,
        });
        getLeaves = JSON.parse(JSON.stringify(getLeaves));
        //console.log('getLeaves: ', getLeaves);

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

        const data = {
          leave_id: validation.id,
          leave_request_user: [validation.user_id],
          leave_request_user_name: `${validation.user.first_name} ${validation.user.last_name}`,
          leave_responsible_person: leaveResponsiblePerson,
          leave_reporting_person: leaveReportingPerson,
          leave_status: 'CANCELLED',
          action_by: req.user.first_name + ' ' + req.user.last_name,
          leave_date_from: moment(validation.from_date).format('DD/MM/YYYY'),
          leave_date_to: moment(validation.to_date).format('DD/MM/YYYY'),
          action_by_profile: req.user.user_image,
          leaves_on_current_year: leaves_on_current_year,
          leave_subject: validation.description,
          total_leave_days: validation.no_of_days,
          leave_type: validation.leaveTypes[0].leave_type,
          cl: clCurrentBalance,
          pl: plCurrentBalance,
          leave_description: validation.description,
          leave_responsible_person_name: '',
        };

        eventEmitterLeave.default.emit('notify_leave_status_changed', data);
        // Notification of Leave Added #END
      }

      res.status(200).json(APIResponseFormat._ResDataUpdated('Leave'));
    } catch (error) {
      // condole.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default LeaveApprovalController;
