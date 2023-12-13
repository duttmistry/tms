import { Router } from 'express';
import Workspace from './controller/workspace.controller';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class WorkspaceRoute implements Routes {
  public router = Router();
  public controller = new Workspace();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/workspace`, auth.default, this.controller.getWorkspaces);
    this.router.post(`/getworkspace`, auth.default, this.controller.getWorkspacesData);
    this.router.get(`/workspace/project/filterdropdown`, auth.default, this.controller.getWorkspacesProjectDropdown);
    this.router.get(`/workspace/task/dropdown`, auth.default, this.controller.getWorkspacesDropdown);
    this.router.get(`/workspace/single`, auth.default, this.controller.getWorkspaceById);
    this.router.get(`/workspace/projects`, auth.default, this.controller.getProjectByWorkspaceId);
    this.router.get(`/workspace/project/count`, auth.default, this.controller.getProjectCountOfWorkspaces);
    this.router.post(`/workspace`, auth.default, this.controller.createWorkspace);
    this.router.put(`/workspace`, auth.default, this.controller.updateWorkspace);
    this.router.delete(`/workspace`, auth.default, this.controller.deleteWorkspace);
    this.router.put('/workspace/activeStatus', auth.default, this.controller.updateWorkspaceActiveStatus);
    this.router.get(`/workspace/v2`, auth.default, this.controller.getWorkspacesForV2);
    this.router.get(`/workspace/project/filterdropdown/v2`, auth.default, this.controller.getWorkspacesProjectDropdownV2);

    //IMPORT Workspace from excel
    this.router.post(`/workspace/import`, auth.default, this.controller.importWorkspace);
  }
}

export default WorkspaceRoute;
