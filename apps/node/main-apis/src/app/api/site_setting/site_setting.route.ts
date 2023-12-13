import SiteSettingController from './controller/site_setting.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class SiteSettingRoute implements Routes {
  public router = Router();
  public controller = new SiteSettingController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/site/setting`, this.controller.getSingle);
    this.router.get(`/getByName`, auth.default, this.controller.getByName);
    this.router.get(`/getByIdentifier`, auth.default, this.controller.getByIdentifier);
    this.router.get(`/getByModule`, auth.default, this.controller.getByModule);
    this.router.get(`/getBySimilarName`, auth.default, this.controller.getBySimilarName);
    this.router.get(`/getAll`, auth.default, this.controller.getAll);
    this.router.post(`/setSingleField`, auth.default, this.controller.setSingleField);
    this.router.post(`/setModulewiseField`, auth.default, this.controller.setModulewiseField);
    this.router.put(`/ceo`, auth.default, this.controller.setCeoField);
    this.router.get(`/ceo`, auth.default, this.controller.getCeoField);

    this.router.post(`/site/setting/save`, auth.default, this.controller.saveData);
  }
}

export default SiteSettingRoute;
