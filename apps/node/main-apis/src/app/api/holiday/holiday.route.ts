import HolidayController from './controller/holiday.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class HolidayRoute implements Routes {
  public router = Router();
  public controller = new HolidayController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/holidays`, auth.default, this.controller.getAll);
    this.router.get(`/holidays/dashboard`, auth.default, this.controller.getDashboardRemindersData);
    this.router.get(`/holidays/upcomming`, auth.default, this.controller.getAllUpcommingHoliday);
    this.router.get(`/holidays/single`, auth.default, this.controller.getSingle);
    this.router.post(`/holidays`, auth.default, this.controller.create);
    this.router.put(`/holidays`, auth.default, this.controller.update);
    this.router.delete(`/holidays`, auth.default, this.controller.delete);
    this.router.delete(`/holidays`, auth.default, this.controller.delete);

    // Holiday && SpeciaL Day Sync

    this.router.post(`/holidays/sync`, this.controller.syncHoliday);
    this.router.post(`/holiday/sync`, this.controller.syncHrmsHoliday);
  }
}

export default HolidayRoute;
