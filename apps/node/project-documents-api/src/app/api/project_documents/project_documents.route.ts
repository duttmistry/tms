import ProjectDocumentsController from './controller/project_documents.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';
class ProjectDocumentsRoute implements Routes {
  public router = Router();
  public controller = new ProjectDocumentsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/project/documents`, auth.default, this.controller.getProjectDocuments);
    this.router.post(`/project/documents/create`, auth.default, this.controller.createProjectDocuments);
    this.router.get(`/project/download`, auth.default, this.controller.downloadProjectDocuments);
    this.router.put(`/project/documents/update`, auth.default, this.controller.updateProjectDocuments);
    this.router.put(`/project/uploadeddocuments/update`, auth.default, this.controller.updateUploadedProjectDocuments);
    this.router.put(`/project/documents/update/update-authorized-user`, auth.default, this.controller.updateAuthorizedUserProjectDocuments);
    this.router.delete(`/project/documents/delete`, auth.default, this.controller.deleteProjectDocuments);
  }
}

export default ProjectDocumentsRoute;
