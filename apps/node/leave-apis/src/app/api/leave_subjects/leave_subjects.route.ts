import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';
import LeaveController from './controller/leave_subjects.controller';

class LeaveSubjectsRoute implements Routes {
  public router = Router();
  public controller = new LeaveController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/leave/subjects`, auth.default, this.controller.getLeaveSubjects);
  }
}

export default LeaveSubjectsRoute;
