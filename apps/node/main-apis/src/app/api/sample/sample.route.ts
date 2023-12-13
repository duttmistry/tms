import SampleController from './controller/sample.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class SampleRoute implements Routes {
  public router = Router();
  public controller = new SampleController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/samples`, auth.default, this.controller.getSample);
  }
}

export default SampleRoute;
