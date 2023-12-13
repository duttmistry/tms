import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import { Op, Sequelize } from 'sequelize';
import ProjectStatusService from '../services/project_status.service';
import { Encryption } from '@tms-workspace/encryption'; // Ecnryption Service
import { iRequestWithUser } from '../../../database/interface/user.interface';
import ProjectService from '../../project/services/project.service';
import { iProjectStatus } from '../../../database/interface/projects.interface';

class ProjectStatusController {
  public projectStatusService = new ProjectStatusService();
  public projectService = new ProjectService();
  public getProjectStatusByProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const projectId = Number(req.headers.id);

      if (!projectId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));

      //  const permission: any = await this.projectService._getProjectPermission(req.user.id, 'update');

      //  if (!Object.keys(permission).length) {
      //    return res.status(401).json(APIResponseFormat._ResUnauthrized());
      //  }

      const data = await this.projectStatusService._getProjectStatusData({ project_id: projectId });
      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public createProjectStatus = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const project_id = Number(req.headers.id);
      const userId = req.user.id;
      const { title, state } = req.body;
      if (!project_id || !title || !state) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField());
      }
      let stateData = await this.projectStatusService._getSingleProjectStatusColorData({ project_id: project_id,state:state});
      stateData=JSON.parse(JSON.stringify(stateData));

      // const permission: any = await thisI.projectService._getProjectPermission(req.user.id, 'create');

      // if (
      //   !Object.keys(permission).length ||
      //   !permission.title ||
      //   !permission.responsible_person ||
      //   !permission.team ||
      //   !permission.project_key ||
      //   !permission.link_workspace
      // ) {
      //   FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
      //   return res.status(401).json(APIResponseFormat._ResUnauthrized());
      // }

      const projectStatus: iProjectStatus = {
        project_id: project_id,
        title: title.trim(),
        state: state,
        color: stateData?.color,
        created_by: userId,
        updated_by: userId,
      };

      // Project should not have same name
      const validation = await this.projectStatusService._getSingleProjectStatusData({project_id: project_id,title: title.trim() });
      if (validation) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Project Status', 'title'));
      }

      const data = await this.projectStatusService._createProjectStatusData(projectStatus);
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Project Status'));
      }

      return res.status(201).json(APIResponseFormat._ResDataCreated('Project Status', data));
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public updateProjectStatus = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const project_status_id = Number(req.headers.id);
      const userId = req.user.id;
      if (!project_status_id) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project StatusId'));

      const project_id = Number(req.headers.project_id);
      const { title, state } = req.body;

      if (!project_id || !title || !state) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField());
      }

      // check Project Status exits or not
      const validation = await this.projectStatusService._getSingleProjectStatusData({ id: project_status_id });
      console.log('🚀 ~ file: project_status.controller.ts:104 ~ ProjectStatusController ~ updateProjectStatus= ~ validation:', validation);

      if (!validation) {
        return res.status(409).json(APIResponseFormat._ResDataNotFound('Project Status'));
      }

      // project should not exits with same name
      const validationByTitle = await this.projectStatusService._getSingleProjectStatusData({
        id: { [Op.ne]: project_status_id },
        title: title,
        project_id: project_id,
      });

      if (validationByTitle) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Project Status', 'Title'));
      }

      // const permission: any = await thisI.projectService._getProjectPermission(req.user.id, 'update');

      // if (!Object.keys(permission).length) {
      //   return res.status(401).json(APIResponseFormat._ResUnauthrized());
      // }
      let stateData = await this.projectStatusService._getSingleProjectStatusColorData({ project_id: project_id,state:state });
      stateData=JSON.parse(JSON.stringify(stateData));

      const projectStatus: iProjectStatus = {
        id: project_status_id,
        project_id: project_id,
        title: title.trim(),
        state: state,
        color: stateData.color,
        updated_by: userId,
      };

      const data = await this.projectStatusService._updateProjectStatusData(projectStatus);

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Project Status'));
      }

      const updatedData = await this.projectStatusService._getSingleProjectStatusData({ id: project_status_id });

      return res.status(200).json(APIResponseFormat._ResDataUpdated('Project Status', updatedData));
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public deleteProjectStatus = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const project_status_id = Number(req.headers.id);

      if (!project_status_id) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project StatusId'));

      // check Project Status exits or not
      const validation = await this.projectStatusService._getSingleProjectStatusData({ id: project_status_id });

      if (!validation) {
        return res.status(409).json(APIResponseFormat._ResDataNotFound('Project Status'));
      }

      // const permission: any = await this.projectService._getProjectPermission(req.user.id, 'delete');

      // if (!Object.keys(permission).length) {
      //   return res.status(401).json(APIResponseFormat._ResUnauthrized());
      // }

      const data = await this.projectStatusService._deleteProjectStatusData(project_status_id);

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Project Status'));
      }

      return res.status(200).json(APIResponseFormat._ResDataDeleted('Project Status'));
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public updateProjectStatusColor = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { project_id,state, color } = req.body;

      if (!project_id || !state || !color) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField());
      }
      const projectStatus= {
        color: color,
      };

      const data = await this.projectStatusService._updateProjectStatusColorData(projectStatus,{project_id:project_id,state:state});

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Project Status'));
      }
      return res.status(200).json(APIResponseFormat._ResDataUpdated('Project Status'));
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
  public getProjectStateByProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const projectId = Number(req.headers.projectid);

      if (!projectId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));

      //  const permission: any = await this.projectService._getProjectPermission(req.user.id, 'update');

      //  if (!Object.keys(permission).length) {
      //    return res.status(401).json(APIResponseFormat._ResUnauthrized());
      //  }

      const data = await this.projectStatusService._getProjectStateData({ project_id: projectId });
      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default ProjectStatusController;
