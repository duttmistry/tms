import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';
import LeaveManualUpdateController from './controller/leave_manual_update.controller';

class LeaveManualUpdateRoute implements Routes {
  public router = Router();
  public controller = new LeaveManualUpdateController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/leave/manual/log`, auth.default, this.controller.getLeaveManualLogList);
    this.router.get(`/leave/manual/data`, auth.default, this.controller.getLeaveManualData);

    this.router.get(`/leave/manual/update`, auth.default, this.controller.getLeaveManualUpdateData);

    this.router.post(`/leave/manual/draft`, auth.default, this.controller.getLeaveManualDraft);

    this.router.post(`/leave/manual/save`, auth.default, this.controller.getLeaveManualSave);
  }
}

export default LeaveManualUpdateRoute;
