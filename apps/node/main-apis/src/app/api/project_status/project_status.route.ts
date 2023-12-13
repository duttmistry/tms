import ProjectStatusController from './controller/project_status.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class SampleRoute implements Routes {
  public router = Router();
  public projectStatusController = new ProjectStatusController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/project/status`, auth.default, this.projectStatusController.getProjectStatusByProject);
    this.router.post(`/project/status`, auth.default, this.projectStatusController.createProjectStatus);
    this.router.put(`/project/status`, auth.default, this.projectStatusController.updateProjectStatus);
    this.router.delete(`/project/status`, auth.default, this.projectStatusController.deleteProjectStatus);
    this.router.put(`/project/status/color`, auth.default, this.projectStatusController.updateProjectStatusColor);
    this.router.get(`/project/state`, auth.default, this.projectStatusController.getProjectStateByProject);

  }
}

export default SampleRoute;
