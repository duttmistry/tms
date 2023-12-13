import { Router } from 'express';
import Administration from './controller/administration.controller';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class AdministrationRoute implements Routes {
  public router = Router();
  public controller = new Administration();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/attendanceReport`, auth.default, this.controller.getAttendance);
  }
}

export default AdministrationRoute;
