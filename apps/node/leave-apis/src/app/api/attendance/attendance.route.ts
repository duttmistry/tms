import { Router } from 'express';
import Attendance from './controller/attendance.controller';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class AttendanceRoute implements Routes {
  public router = Router();
  public controller = new Attendance();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/teamLeaveReport`, auth.default, this.controller.getTeamLeave);
    this.router.get(`/attendanceReport`, auth.default, this.controller.getAttendance);
    this.router.get(`/getReportingUsers`, auth.default, this.controller.getReportingUser);
  }
}

export default AttendanceRoute;
