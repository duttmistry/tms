import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';
import PrefereceController from './controller/preference.controller';

class PreferenceRoute implements Routes {
  public router = Router();
  public controller = new PrefereceController();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/preference`, auth.default, this.controller.getPreference);
    this.router.post(`/preference`, auth.default, this.controller.createPreference);
    this.router.put(`/preference`, auth.default, this.controller.updateUsersPreference);
    this.router.delete(`/preference/project`, auth.default, this.controller.deleteUserProject);
    this.router.get(`/preference/getLogs` , auth.default, this.controller.notificationLog);
    this.router.put(`/preference/bulkprojectupdate` , auth.default, this.controller.updateProjectsFields)
    this.router.get(`/preference/notifications` , auth.default, this.controller.getNotificationPreference);

    // email template routes
    this.router.post(`/template`, auth.default, this.controller.createTemplate);
    this.router.get(`/template`, auth.default, this.controller.getTemplates);
    this.router.get(`/templateById`, auth.default, this.controller.getTemplateById);
    this.router.put(`/template`, auth.default, this.controller.updateTemplate);
    this.router.delete(`/template`, auth.default, this.controller.deleteTemplate);

    this.router.get(`/instanceVariable`, auth.default, this.controller.getInstanceVariable);
    this.router.post(`/instanceVariable`, auth.default, this.controller.createInstanceVariable);

  }
}

export default PreferenceRoute;
