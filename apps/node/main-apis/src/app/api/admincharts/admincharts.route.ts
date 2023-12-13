import { Router } from 'express';
import AdminchartsController from './controller/admincharts.controller';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class Admincharts implements Routes {
  public router = Router();
  public controller = new AdminchartsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/chart/pieChart`, auth.default, this.controller._pieCharts);
  }
}

export default Admincharts;
