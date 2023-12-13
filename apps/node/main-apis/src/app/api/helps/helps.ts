import HelpsController from './controller/helps.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class HelpsRoutes implements Routes {
  public router = Router();
  public controller = new HelpsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/help`, auth.default ,this.controller.getSingle);
    // this.router.post(`/help`, auth.default, this.controller.createHelp);
  }
}

export default HelpsRoutes;
