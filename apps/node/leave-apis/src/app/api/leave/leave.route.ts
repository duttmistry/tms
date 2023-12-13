import { Router } from 'express';
import Leave from './controller/leave.controller';
import LeaveApprovalController from './controller/leaveApproval.controller';
import LeaveManipulationController from './controller/leaveManipulation.controller';
import LeaveTeamController from './controller/leaveTeam.controller';
import LeaveTeamReportController from './controller/leaveTeamReport.controller';
import leaveTransectionController from './controller/leaveTransection.controller';

import { auth } from '@tms-workspace/auth/user-authentication';
import { Routes } from '@tms-workspace/apis-core';
class LeaveRoute implements Routes {
  public router = Router();
  public controller = new Leave();
  public leaveApprovalController = new LeaveApprovalController();
  public leaveManipulationController = new LeaveManipulationController();
  public leaveTeamController = new LeaveTeamController();
  public leaveTeamReportController = new LeaveTeamReportController();
  public leaveTransectionController = new leaveTransectionController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //Personal Leave API Controller
    this.router.get(`/leaves`, auth.default, this.controller.getLeaveHistory);
    this.router.get(`/leave`, auth.default, this.controller.getSingleLeaveHistory);
    this.router.post(`/leave/check`, auth.default, this.controller.getBalanceAfterLeaveBook);
    this.router.post(`/leave`, auth.default, this.controller.createLeaveHistory);
    this.router.put(`/leave`, auth.default, this.controller.updateLeaveHistory);
    this.router.delete(`/leave`, auth.default, this.controller.deleteLeaveHistory);

    // Leave Transection API Controller

    this.router.get(`/leave/transection/`, auth.default, this.leaveTransectionController.getLeaveTxnHistory);
    this.router.get(`/leave/transection/user/`, auth.default, this.leaveTransectionController.getLeaveTxnHistoryUser);

    //Approval Leave API Controller
    this.router.get('/leaves/approval/count', auth.default, this.leaveApprovalController.getApprovalLeaveCount);
    this.router.post('/leaves/approval', auth.default, this.leaveApprovalController.getApprovalLeave);
    this.router.get('/leaves/approval/employee', auth.default, this.leaveApprovalController.getApprovalEmployee);
    this.router.put(`/leaves/action`, auth.default, this.leaveApprovalController.action);

    //Employee Leave Report
    this.router.get(`/leave/Report`, auth.default, this.leaveTeamReportController.getLeaveReport);

    // Get Team Leave on Selected Date
    this.router.get('/leave/Teams', auth.default, this.leaveTeamController.getTeamLeave);
    this.router.get('/leave/Teams/dashboard', auth.default, this.leaveTeamController.getTeamDashboardLeave);

    // Import Leave Data
    this.router.post(`/leave/import`, this.leaveManipulationController.importLeaveData);
  }
}

export default LeaveRoute;
