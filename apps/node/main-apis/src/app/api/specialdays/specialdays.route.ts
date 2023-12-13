import SpecialdaysController from './controller/specialdays.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class SpecialdaysRoute implements Routes {
  public router = Router();
  public controller = new SpecialdaysController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/specialdays/create`, auth.default, this.controller.create);
    this.router.put(`/specialdays/update`, auth.default, this.controller.update);
    this.router.post(`/specialdays/get`, auth.default, this.controller.getAll);
    this.router.get(`/specialdays/get`, auth.default, this.controller.getSingle);
    this.router.delete(`/specialdays/delete`, auth.default, this.controller.delete);
  }
}

export default SpecialdaysRoute;
