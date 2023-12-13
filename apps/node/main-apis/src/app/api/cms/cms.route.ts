import CmsController from './controller/cms.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class CmsRoute implements Routes {
  public router = Router();
  public controller = new CmsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/cms/get', this.controller.getCms);
    this.router.post(`/cms/create`, this.controller.createCms);
    this.router.put(`/cms/update`, this.controller.updateCms);
    this.router.delete(`/cms/delete`, this.controller.deleteCms);
  }
}

export default CmsRoute;
