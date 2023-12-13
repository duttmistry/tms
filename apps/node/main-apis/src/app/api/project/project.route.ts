import { Router } from 'express';
import Project from './controller/project.controller';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class ProjectRoute implements Routes {
  public router = Router();
  public controller = new Project();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/project`, auth.default, this.controller.getProject);
    this.router.get(`/project/active`, auth.default, this.controller.getActiveProject);
    this.router.get(`/project/unlink`, auth.default, this.controller.getUnlinkProject);
    this.router.post(`/getprojects`, auth.default, this.controller.getProjectsData);
    this.router.get(`/getprojects/single`, auth.default, this.controller.getProjectFullDataById);
    this.router.post(`/project/bilingconfigrationstatus`, auth.default, this.controller.createProjectBillingConfiguration);
    this.router.post(`/project/list`, auth.default, this.controller.getProjectList);
    this.router.get(`/project/dashboard/list`, auth.default, this.controller.getProjectDashboardListV2);
    this.router.get(`/project/single`, auth.default, this.controller.getProjectById);
    this.router.post(`/project`, auth.default, this.controller.createProject);
    this.router.post(`/project/upload/file`, this.controller.uploadDocumentFile);
    this.router.put(`/project`, auth.default, this.controller.updateProject);
    this.router.delete(`/project`, auth.default, this.controller.deleteProject);
    this.router.post(`/project/checkkey`, auth.default, this.controller.checkProjectKey);
    this.router.post(`/project/team`, auth.default, this.controller.getProjectTeam);
    this.router.post(`/project/substatus`, auth.default, this.controller.getProjectStatus);
    this.router.post(`/project/customfields`, auth.default, this.controller.getProjectCustomFields);
    this.router.get(`/getprojects/v2`, auth.default, this.controller.getProjectsDataList);
    this.router.get(`/project/listwithtaskcount/v2`, auth.default, this.controller.getProjectsDataListWithTaskCount);
    this.router.get(`/project/listForUsersActive/v2`, auth.default, this.controller.getProjectsDataListForActiveProject);
    this.router.post(`/project/list/v2`, auth.default, this.controller.getProjectListV2);
    this.router.post(`/project/list/billing/v2`, auth.default, this.controller.getProjectListBillingV2);
    this.router.post(`/project/list/billing/totalWorkingTime/v2`, auth.default, this.controller.getProjectListBillingWorkingHouresV2);
    this.router.get(`/project/dashboard/active/v2`, auth.default, this.controller.getProjectDashboardActiveV2);
    this.router.post(`/project/bulk/inactive`, auth.default, this.controller.bulkInactive);
    this.router.get(`/v1/analytics/get-project-tasks`,auth.default, this.controller.getProjectTasksV2);
    
  }
}

export default ProjectRoute;
