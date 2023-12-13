import { NextFunction, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Op, Sequelize, json } from 'sequelize';
import _DB from '../../../database/models';
import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import { BasePath, FileService, MulterService } from '@tms-workspace/file-upload';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import { iWorkspace } from '../../../database/interface/workspace.interface';
import WorkspaceService from '../services/workspace.service';
import UserService from '../../user/services/user.service';
import ProjectService from '../../project/services/project.service';
import PermissionService from '../../../service/permissionCheck';
import { Encryption } from '@tms-workspace/';
import eventEmitter from '../../../../core/project.event';
import readXlsxFile from 'read-excel-file/node';

interface CountObject {
  total_count: number; // You can adjust the type as per your actual data type
}

class WorkspaceController {
  public workspaceService = new WorkspaceService();
  public userService = new UserService();
  public projectService = new ProjectService();
  public permissionService = new PermissionService();
  public workspace = _DB.Workspace;
  public workspaceTeam = _DB.WorkspaceTeam;
  public projectWorkspace = _DB.ProjectWorkspace;
  public project = _DB.Projects;
  public user = _DB.User;

  public getWorkspaces = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, search } = req.query;
      let searchText: any = '';
      if (!search || search == undefined) {
        searchText = '';
      } else {
        searchText = search;
      }
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');

      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      // const where = req.user.isAdmin
      //   ? {title:{ [Op.like]:`%${searchText}%` }}
      //   : {
      //       title:{ [Op.like]:`%${searchText}%`},
      //       [Op.or]: [
      //         {
      //           '$team.user_id$': req.user.id,
      //         },
      //         Sequelize.fn('JSON_CONTAINS', Sequelize.col('team.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
      //         {
      //           created_by: req.user.id,
      //         },
      //         {
      //           updated_by: req.user.id,
      //         },
      //       ],
      //     };

      // const where = req.user.isAdmin&&(!req.headers.isdropdown)
      // const where =
      //   req.user.isAdmin || req.headers.isdropdown
      //     ? { title: { [Op.like]: `%${searchText}%` } }
      //     : { [Op.and]: [{ title: { [Op.like]: `%${searchText}%` } }, { is_active: true }] };
      const where = req.user.isAdmin
        ? req.headers.isdropdown
          ? { [Op.and]: [{ title: { [Op.like]: `%${searchText}%` } }, { is_active: true }] }
          : { title: { [Op.like]: `%${searchText}%` } }
        : { [Op.and]: [{ title: { [Op.like]: `%${searchText}%` } }, { is_active: true }] };
      const inner_where = req.user.isAdmin || req.headers.isdropdown ? {} : { user_id: req.user.id };
      const count = await this.workspaceService._getWorkspaceCount(where, inner_where);
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      let workspace = await this.workspaceService._getAllWorkspaces(where, inner_where, +page, +limit, sortBy as string, orderBy as string);
      workspace = JSON.parse(JSON.stringify(workspace));
      workspace = workspace.map((el) => {
        delete el.team;
        delete el.responsible_person;
        delete el.documents;
        delete el.notes;
        delete el.created_by;
        delete el.updated_by;
        return el;
      });
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(workspace, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getWorkspacesForV2 = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, search } = req.query;
      let searchText: any = '';
      if (!search || search == undefined) {
        searchText = '';
      } else {
        searchText = search;
      }
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');

      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      let count: CountObject[] = await this.workspaceService._getWorkspaceCountV2(req.user, searchText) as CountObject[];
      count = JSON.parse(JSON.stringify(count));
      if (count[0].total_count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }
      
      let workspace = await this.workspaceService._getAllWorkspacesV2(req.user,searchText, +page, +limit, sortBy as string, orderBy as string);
      workspace = JSON.parse(JSON.stringify(workspace));
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count[0].total_count);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(workspace, totalPages, limit as string,count[0].total_count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getWorkspacesData = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const { page, limit, sortBy, orderBy, search } = req.query;
      // let searchText: any = '';
      // if (!search || search == undefined) {
      //   searchText = '';
      // } else {
      //   searchText = search;
      // }
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');

      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const where = req.body.id
        ? req.user.isAdmin
          ? { id: req.body.id }
          : {
              [Op.and]: [
                { id: req.body.id },
                {
                  [Op.or]: [
                    {
                      '$team.user_id$': req.user.id,
                    },

                    Sequelize.fn('JSON_CONTAINS', Sequelize.col('team.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                    // {
                    //   created_by: req.user.id,
                    // },
                    // {
                    //   updated_by: req.user.id,
                    // },
                  ],
                },
              ],
            }
        : req.user.isAdmin
        ? {}
        : {
            [Op.or]: [
              {
                '$team.user_id$': req.user.id,
              },
              Sequelize.fn('JSON_CONTAINS', Sequelize.col('team.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
              // {
              //   created_by: req.user.id,
              // },
              // {
              //   updated_by: req.user.id,
              // },
            ],
          };
      // const where = { title: { [Op.like]: `%${searchText}%` } };
      // const inner_where = req.user.isAdmin ? {} : { user_id: req.user.id };
      // const count = await this.workspaceService._getWorkspaceCount(where, inner_where);
      // if (count < 1) {
      //   return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      // }

      const workspace = await this.workspaceService._getAllWorkspacesData(where, req.body);

      return res.status(200).json(APIResponseFormat._ResDataFound(workspace));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getWorkspacesProjectDropdown = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');

      // if (!permission) {
      //   return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      // }
      req.user.isAdmin=false;
      const where = req.user.isAdmin
        ? {
            // [Op.and]: [
            //   {
            //     is_active: true,
            //   },
            // ],
          }
        : {
            [Op.or]: [
              {
                '$team.user_id$': req.user.id,
              },
              {
                '$workspaceProject.project.projectTeam.user_id$': req.user.id,
              },
              Sequelize.fn('JSON_CONTAINS', Sequelize.col('team.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
            ],
            [Op.and]: [
              {
                is_active: true,
              },
            ],
          };

      let workspace = await this.workspaceService._getAllWorkspacesProjectDropdown(where, Number(req.user.id));
      workspace = JSON.parse(JSON.stringify(workspace));

      workspace = workspace.map((el) => {
        delete el.description;
        delete el.avatar;
        delete el.team;
        delete el.responsible_person;
        delete el.documents;
        delete el.notes;
        delete el.created_by;
        delete el.updated_by;

        const project = el.workspaceProject.map((p) => {
          return { ...p.project };
        });

        el.projects = project;
        delete el.workspaceProject;
        return el;
      });

      return res.status(200).json(APIResponseFormat._ResDataFound(workspace));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getWorkspacesProjectDropdownV2 = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');

      // if (!permission) {
      //   return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      // }

      const where = req.user.isAdmin
        ? {
            // [Op.and]: [
            //   {
            //     is_active: true,
            //   },
            // ],
          }
        : {
            [Op.or]: [
              {
                '$team.user_id$': req.user.id,
              },
              {
                '$workspaceProject.project.projectTeam.user_id$': req.user.id,
              },
              Sequelize.fn('JSON_CONTAINS', Sequelize.col('team.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
            ],
            [Op.and]: [
              {
                is_active: true,
              },
            ],
          };

      const workspace = await this.workspaceService._getAllWorkspacesProjectDropdownV2(req.user);
      // workspace = JSON.parse(JSON.stringify(workspace));

      // workspace = workspace.map((el) => {
      //   delete el.description;
      //   delete el.avatar;
      //   delete el.team;
      //   delete el.responsible_person;
      //   delete el.documents;
      //   delete el.notes;
      //   delete el.created_by;
      //   delete el.updated_by;

      //   const project = el.workspaceProject.map((p) => {
      //     return { ...p.project };
      //   });

      //   el.projects = project;
      //   delete el.workspaceProject;
      //   return el;
      // });

      return res.status(200).json(APIResponseFormat._ResDataFound(workspace));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getWorkspacesDropdown = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');

      // if (!permission) {
      //   return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      // }

      const where = req.user.isAdmin
        ? {
            [Op.and]: [
              {
                is_active: true,
              },
            ],
          }
        : {
            [Op.or]: [
              {
                '$team.user_id$': req.user.id,
              },
              Sequelize.fn('JSON_CONTAINS', Sequelize.col('team.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
            ],
            [Op.and]: [
              {
                is_active: true,
              },
            ],
          };

      let workspace = await this.workspaceService._getAllWorkspacesDropdown(where);
      workspace = JSON.parse(JSON.stringify(workspace));

      workspace = workspace.map((el) => {
        delete el.description;
        delete el.avatar;
        delete el.team;
        delete el.responsible_person;
        delete el.documents;
        delete el.notes;
        delete el.created_by;
        delete el.updated_by;

        const project = el.workspaceProject
          .filter((p) => p.project)
          .map((p) => {
            return { ...p.project };
          });

        el.projects = project;
        delete el.workspaceProject;
        return el;
      });

      return res.status(200).json(APIResponseFormat._ResDataFound(workspace));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getWorkspaceById = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const workspaceId = +Encryption._doDecrypt(req.headers.id as string);
      // const workspaceId = +req.headers.id;

      if (!workspaceId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Workspace Id'));

      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'update');

      if (!permission) {
        return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
      }

      // const permission: any = await this.workspaceService._getWorkSpacePermission(req.user.id, 'update');

      // if (!Object.keys(permission).length && permission.edit) {
      //   return res.status(401).json(APIResponseFormat._ResUnauthrized());
      // }

      let data = await this.workspaceService._getWorkspace({ id: workspaceId });
      data = JSON.parse(JSON.stringify(data));
      if (!data) {
        return res.status(404).json(APIResponseFormat._ResNotExists('Workspace'));
      }

      // get report person data
      for (let i = 0; i < data.team.length; i++) {
        data.team[i].reporter = await this.userService._getAllUsers({ id: { [Op.in]: data.team[i].report_to || [] } });
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getProjectCountOfWorkspaces = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');

      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const where = req.user.isAdmin
        ? {}
        : {
            [Op.and]: [
              {
                [Op.or]: [
                  {
                    '$team.user_id$': req.user.id,
                  },
                  Sequelize.fn('JSON_CONTAINS', Sequelize.col('team.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                  // {
                  //   created_by: req.user.id,
                  // },
                  // {
                  //   updated_by: req.user.id,
                  // },
                ],
              },
              {
                [Op.or]: [
                  {
                    '$workspaceProject.project.projectTeam.user_id$': req.user.id,
                  },
                  Sequelize.fn(
                    'JSON_CONTAINS',
                    Sequelize.col('workspaceProject.project.projectTeam.report_to'),
                    Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')
                  ),
                  {
                    '$workspaceProject.project.created_by$': req.user.id,
                  },
                  {
                    '$workspaceProject.project.updated_by$': req.user.id,
                  },
                ],
              },
              {
                is_active: true,
              },
            ],
          };

      const data = await this.workspaceService._getProjectCount(where);

      const resultData = data.map((item) => {
        const projectCount = item.workspaceProject.filter((e) => e.project !== null).length;
        const workspaceTotalTask = item.workspaceProject.reduce((count, project) => count + (project?.project?.ProjectTasks.length || 0), 0);
        const workspaceCompleteTaskCount = item.workspaceProject.reduce((count, project) => {
          return count + (project?.project?.ProjectTasks.filter((task) => task.state === 'completed').length || 0);
        }, 0);
        const workspacePendingTaskCount = workspaceTotalTask - workspaceCompleteTaskCount;

        return {
          id: item.id,
          project_count: projectCount,
          workspace_total_task: workspaceTotalTask,
          workspace_complete_task_count: workspaceCompleteTaskCount,
          workspace_pending_task_count: workspacePendingTaskCount,
        };
      });

      // data = JSON.parse(JSON.stringify(data));
      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      // // get report person data
      // for (let i = 0; i < data.team.length; i++) {
      //   data.team[i].reporter = await this.userService._getAllUsers({ id: { [Op.in]: data.team[i].report_to || [] } });
      // }

      return res.status(200).json(APIResponseFormat._ResDataFound(resultData));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public createWorkspace = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._workspaceStorage,
        fileFilter: MulterService._fileFilter,
      }).fields([
        { name: 'avatarFile', maxCount: 1 },
        { name: 'documents', maxCount: 10 },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }

          const team = req.body.team ? JSON.parse(req.body.team) : [];
          if (!req.body.title || !req.body.responsible_person || team.length == 0) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField());
          }

          const permission = await thisI.permissionService._checkModulePermission(req.user.id, 'workspace', 'create');

          if (!permission || !permission.title || !permission.responsible_person || !permission.team) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
          }

          if (!permission.avatar) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
          }
          if (!permission.documents) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
          }

          const workspaceData: any = {
            title: req.body.title,
            responsible_person: req.body.responsible_person,
            team: JSON.parse(req.body.team),
            created_by: req.user.id || null,
          };
          if (permission.description) {
            workspaceData.description = req.body.description || null;
          }
          if (permission.projects) {
            workspaceData.workspaceProject = req.body.project ? JSON.parse(req.body.project) : [];
            //unlink project from old workspace
          await thisI.workspaceService._deleteWorkspaceProject({
            project_id: { [Op.in]: workspaceData.workspaceProject.map((el) => el.project_id) },
          });
          }
          if (permission.notes) {
            workspaceData.notes = req.body.notes || null;
          }
          if (permission.avatar) {
            workspaceData.avatar = req.files?.['avatarFile']?.[0].filename ? `uploads/workspace/${req.files['avatarFile'][0].filename}` : null;
          }
          if (permission.documents) {
            workspaceData.documents = req.files?.['documents']?.length
              ? req.files?.['documents'].map((el) => `uploads/workspace/${el.filename}`)
              : null;
          }

          // workspace should not have same title
          const validation = await thisI.workspaceService._getWorkspace({ title: workspaceData.title });
          if (validation) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(409).json(APIResponseFormat._ResDataExists('Workspace', 'Title'));
          }

          const data = await thisI.workspaceService._createWorkspace(workspaceData);
          if (!data) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(500).json(APIResponseFormat._ResDataNotCreated('Workspace'));
          }

          return res.status(201).json(APIResponseFormat._ResDataCreated('Workspace', data));
        } catch (error) {
          FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
          FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
          next(error);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
        }
      });
    } catch (error) {
      next(error);
      FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
      FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public updateWorkspace = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._workspaceStorage,
        fileFilter: MulterService._fileFilter,
      }).fields([
        { name: 'avatarFile', maxCount: 1 },
        { name: 'documents', maxCount: 10 },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }

          const workspaceId = Encryption._doDecrypt(req.headers.id as string);
          const team = JSON.parse(req.body.team) || [];
          const workspaceProject = JSON.parse(req.body.project) || [];
          if (!req.headers.id || !req.body.title || !req.body.responsible_person || team.length == 0) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField());
          }

          // check workspace exits or not
          let validation = await thisI.workspaceService._getWorkspace({ id: workspaceId });
          validation = JSON.parse(JSON.stringify(validation));
          if (!validation) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(409).json(APIResponseFormat._ResDataNotFound('Workspace'));
          }

          // workspace should not exits with same title
          const validationByTitle: iWorkspace = await thisI.workspaceService._getWorkspace({
            id: { [Op.ne]: workspaceId },
            title: req.body.title,
          });

          if (validationByTitle) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(409).json(APIResponseFormat._ResDataExists('Workspace', 'Title'));
          }

          const permission = await thisI.permissionService._checkModulePermission(req.user.id, 'workspace', 'update');

          if (!permission) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
          }

          if (!permission.avatar) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
          }
          if (!permission.documents) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
          }

          const oldAvatar = req.body.avatar ? validation.avatar : null;
          //unlink project from old workspace
         const result= await thisI.workspaceService._deleteWorkspaceProject({
            project_id: { [Op.in]: workspaceProject.map((el) => el.project_id) },
          });
          console.log(result,"P_0");
          // remove documents from existing which are in deleted document array
          const newDocuments =
            validation.documents && req.body.deletedDocuments
              ? JSON.parse(JSON.stringify(validation.documents)).filter((el) => !JSON.parse(JSON.stringify(req.body.deletedDocuments)).includes(el))
              : JSON.parse(JSON.stringify(validation.documents)) || [];

          if (req.files?.['documents']?.length) {
            req.files['documents'].forEach((el) => newDocuments.push(`uploads/workspace/${el.filename}`));
          }
          const updatedWorkspaceProject=workspaceProject.map((element)=>{return {project_id:element.project_id,workspace_id:workspaceId}})
console.log(permission.projects,"P_0",workspaceProject,"P-9");

          const workspaceData = {
            id: workspaceId,
            title: permission.title ? req.body.title : validation.title,
            description: permission.description ? req.body.description : validation.description,
            responsible_person: permission.responsible_person ? req.body.responsible_person : validation.responsible_person,
            team: permission.team ? team : validation.team,
            workspaceProject: permission.projects ? updatedWorkspaceProject : validation.workspaceProject,
            notes: permission.notes ? req.body.notes : validation.notes,
            updated_by: req.user.id || null,
            avatar:
              permission.avatar && req.files?.['avatarFile']?.[0].filename ? `uploads/workspace/${req.files['avatarFile'][0].filename}` : oldAvatar,
            documents: permission.documents ? newDocuments : validation.documents,
          };

          workspaceData.team = workspaceData.team.map((el) => {
            return {
              ...el,
              workspace_id: workspaceId,
            };
          });
          workspaceData.workspaceProject = workspaceData.workspaceProject.map((el) => {
            return {
              ...el,
              workspace_id: workspaceId,
            };
          });

          // delete teams
          const deletedTeam = validation.team.filter((el) => el.id && !team.find((e) => e.id === el.id));
          if (deletedTeam.length && permission.team) {
            const data = await thisI.workspaceService._deleteWorkspaceTeam({
              id: { [Op.in]: deletedTeam.map((el) => el.id) },
            });

            if (!data) {
              FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
              FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
              return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Workspace'));
            }
          }
          // console.log(validation.team,"P_0_9_O",team,deletedTeam,"P_0_8",workspaceProject);

          // new teams
          // const newTeam = team.filter((el) => !el.id);
          // const newProject = workspaceProject.filter((el) => !el.id);
          // console.log(newTeam,"P_0_9_1",newProject);
          
          //add project team
          for(const project of workspaceProject){
            let oldteam=await thisI.workspaceService._getProjectTeam({project_id:project.project_id});
            oldteam=JSON.parse(JSON.stringify(oldteam));
            const oldteamId = oldteam.map((item) => item.user_id);
            const user_ids_to_insert = team.filter(
              (user) => !oldteamId.includes(user.user_id)
            );
            if (user_ids_to_insert.length > 0) {
              const insertData = user_ids_to_insert.map((user) => ({
                project_id: project.project_id,
                user_id: user.user_id,
                report_to: user.report_to||[], // Set the report_to value as needed
              }));
               await thisI.workspaceService._addProjectTeam(insertData);
            }
          }

          //remove project team
          for(const project of workspaceProject){
            const deleteteamId = deletedTeam.map((item) => item.user_id);
            if (deleteteamId.length > 0) {
              const query={
                  user_id: {
                    [Op.in]: deleteteamId,
                  },
                  project_id: project.project_id,
                }
               await thisI.workspaceService._deleteProjectTeam(query);
            }
          }
          // if (deletedTeam.length && permission.team) {
          //   const data = await thisI.workspaceService._deleteWorkspaceTeam({
          //     id: { [Op.in]: deletedTeam.map((el) => el.id) },
          //   });
          // }

          // delete project
          const deletedProject = workspaceProject.length
            ? validation?.workspaceProject.filter((el) => !workspaceProject.find((e) => e.id == el.id))
            : validation?.workspaceProject;

          if (deletedProject.length && permission.projects) {
            const data = await thisI.workspaceService._deleteWorkspaceProject({
              id: { [Op.in]: deletedProject.map((el) => el.id) },
            });
            if (!data) {
              FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
              FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
              return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Workspace'));
            }
          }

          // update Workspace
          const data = await thisI.workspaceService._updateWorkspace(workspaceData);
          if (!data) {
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
            FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
            return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Workspace'));
          }

          // delete old avatar
          if (
            permission.avatar &&
            req.files?.['avatarFile']?.[0].filename &&
            oldAvatar &&
            fs.existsSync(path.join(BasePath.default.BASE_PATH, oldAvatar))
          ) {
            fs.unlinkSync(path.join(BasePath.default.BASE_PATH, oldAvatar));
          }

          // delete deleted documents
          const deletedDocuments = JSON.parse(req.body.deletedDocuments) || [];
          if (deletedDocuments.length && permission.documents) {
            for (let i = 0; i < deletedDocuments.length; i++) {
              if (fs.existsSync(path.join(BasePath.default.BASE_PATH, deletedDocuments[i]))) {
                fs.unlinkSync(path.join(BasePath.default.BASE_PATH, deletedDocuments[i]));
              }
            }
          }

          return res.status(200).json(APIResponseFormat._ResDataUpdated('Workspace', workspaceData));
        } catch (error) {
          next(error);
          FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
          FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
        }
      });
    } catch (error) {
      next(error);
      FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['avatarFile']);
      FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public deleteWorkspace = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const workspaceId = +Encryption._doDecrypt(req.headers.id as string);
      if (!workspaceId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Workspace Id'));

      let validation: iWorkspace = await this.workspaceService._getWorkspace({ id: workspaceId });
      validation = JSON.parse(JSON.stringify(validation));
      if (!validation) return res.status(409).json(APIResponseFormat._ResDataNotFound());

      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'delete');

      if (!permission) {
        return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
      }

      const data = await this.workspaceService._deleteWorkspace(workspaceId);
      await this.workspaceService._deleteWorkspaceProject({ workspace_id: workspaceId });
      await this.workspaceService._deleteWorkspaceTeam({ workspace_id: workspaceId });

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Workspace'));
      }

      // delete old avatar
      if (validation.avatar) {
        if (fs.existsSync(path.join(BasePath.default.BASE_PATH, validation.avatar))) {
          fs.unlinkSync(path.join(BasePath.default.BASE_PATH, validation.avatar));
        }
      }

      // delete documents
      const documents = validation.documents || [];
      if (documents.length) {
        for (let i = 0; i < documents.length; i++) {
          if (fs.existsSync(path.join(BasePath.default.BASE_PATH, documents[i]))) {
            fs.unlinkSync(path.join(BasePath.default.BASE_PATH, documents[i]));
          }
        }
      }

      return res.status(200).json(APIResponseFormat._ResDataDeleted('Workspace'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getProjectByWorkspaceId = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const workspaceId = +Encryption._doDecrypt(req.headers.id as string);
      // const workspaceId = +req.headers.id;

      if (!workspaceId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Workspace Id'));

      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');

      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const getActiveWorkspace = await this.workspaceService._getWorkspace({ id: workspaceId, is_active: true });

      if (!getActiveWorkspace) return res.status(409).json(APIResponseFormat._ResNotExists('Workspace'));

      const data = await this.workspaceService._getProjects({ workspace_id: getActiveWorkspace.id });

      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  // only super admin can change workspace activity status
  public updateWorkspaceActiveStatus = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const workspaceId = +Encryption._doDecrypt(req.headers.id as string);
      // const workspaceId = +req.headers.id;

      if (!workspaceId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Workspace Id'));

      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'update');

      if (!permission) {
        return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
      }

      // check user is Admin or not
      //const isAdmin = req.user.isAdmin ? true : false;

      if (!req.user.isAdmin) {
        return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
      }

      const getWorkSpace = await this.workspaceService._getWorkspace({ id: workspaceId });

      if (!getWorkSpace) return res.status(409).json(APIResponseFormat._ResNotExists('Workspace'));

      // update workspace status
      const getActiveWorkspace = JSON.parse(JSON.stringify(getWorkSpace));

      const updateWorkspaceStatus = await this.workspaceService._updateWorkspaceActiveStatus(workspaceId, !getActiveWorkspace.is_active);

      if (!updateWorkspaceStatus) return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Workspace'));
      if (getActiveWorkspace.is_active) {
        eventEmitter.emit('workspaceProjectStatusClose', workspaceId);
      }
      const statusWorkspace = {
        workspace_id: workspaceId,
        is_active: !getActiveWorkspace.is_active,
      };

      return res.status(200).json(APIResponseFormat._ResDataUpdated('Workspace', statusWorkspace));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  //Import Workspace from excel
  public importWorkspace = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._workspaceImportStorage,
        fileFilter: MulterService._excelFilter,
      }).fields([{ name: 'workspaceExcelFile', maxCount: 1 }]);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            FileService._deleteFile(BasePath.default.WORKSPACE_IMPORT_PATH, req.files['workspaceExcelFile']);
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }

          console.log('workspaceExcelFile', req.files['workspaceExcelFile'][0].path);

          const filePath = req.files['workspaceExcelFile'][0].path;

          const workSpaceMap = {
            id: 'id',
            title: 'title',
            resposiblePerson: 'resposiblePerson',
            description: 'description',
            createdBy: 'createdBy',
            updatedBy: 'updatedBy',
            isActive: 'isActive',
          };

          const workSpaceTeamMap = {
            workSpaceId: 'workSpaceId',
            userId: 'userId',
            reportTo: 'reportTo',
          };

          const projectMap = {
            id: 'id',
            workSpaceId: 'workSpaceId',
            name: 'name',
            projectKey: 'projectKey',
            description: 'description',
            responsiblePerson: 'responsiblePerson',
            startDate: 'startDate',
            estimatedEndDate: 'estimatedEndDate',
            createdBy: 'createdBy',
            updatedBy: 'updatedBy',
            isBillable: 'isBillable',
          };

          const projectTeamMap = {
            projectId: 'projectId',
            userId: 'userId',
            reportTo: 'reportTo',
          };

          const WorkSpacesRows = await readXlsxFile(filePath, { sheet: 'workSpace', map: workSpaceMap });
          const WorkSpaceTeamRows = await readXlsxFile(filePath, { sheet: 'workSpaceTeam', map: workSpaceTeamMap });
          const ProjectsRows = await readXlsxFile(filePath, { sheet: 'projects', map: projectMap });
          const ProjectTeamRows = await readXlsxFile(filePath, { sheet: 'projectTeam', map: projectTeamMap });

          // console.log('WorkSpaces', WorkSpacesRows.rows);
          // console.log('WorkSpaceTeam', WorkSpaceTeamRows.rows);
          // console.log('Projects', ProjectsRows.rows);
          // console.log('ProjectTeam', ProjectTeamRows.rows);

          const workSpaces = WorkSpacesRows.rows;
          const workSpacesTeam = WorkSpaceTeamRows.rows;
          const Projects = ProjectsRows.rows;
          const ProjectTeam = ProjectTeamRows.rows;

          const WorkSpaceFormatData = await Promise.all(
            workSpaces.map(async (workspace: any) => {
              const responsiblePerson = await thisI.userService._getUserDataByEmployeeCode(workspace.resposiblePerson);

              const createdBy = await thisI.userService._getUserDataByEmployeeCode(workspace.resposiblePerson);

              const updatedBy = await thisI.userService._getUserDataByEmployeeCode(workspace.resposiblePerson);

              // console.log('workSpace', workspace);

              const workSpaceTempId = workspace.id;

              const workSpaceTeam = await Promise.all(
                workSpacesTeam
                  .filter((user: any) => user.workSpaceId === workSpaceTempId)
                  .map(async (user: any) => {
                    // console.log('user', user);

                    const userId = await thisI.userService._getUserDataByEmployeeCode(user.userId);

                    const reportToArray = user.reportTo.split(',');

                    // console.log('reportToArray', reportToArray);

                    const reportTo = await Promise.all(
                      reportToArray.map(async (reportToUser) => {
                        const user: any = await thisI.userService._getUserDataByEmployeeCode(reportToUser);

                        return user.id;
                      })
                    );

                    return {
                      user_id: userId.id,
                      report_to: reportTo,
                    };
                  })
              );

              // console.log('workSpaceTeam', workSpaceTeam);

              const WorkSpaceProjects = await Promise.all(
                Projects.filter((project: any) => project.workSpaceId === workSpaceTempId).map(async (project: any) => {
                  console.log('project', project);
                  const projectResponsiblePerson = await thisI.userService._getUserDataByEmployeeCode(project.responsiblePerson);

                  const projectCreatedBy = await thisI.userService._getUserDataByEmployeeCode(project.createdBy);

                  const projectUpdatedBy = await thisI.userService._getUserDataByEmployeeCode(project.updatedBy);

                  const projectTempId = project.id;

                  // console.log('ProjectTeam', ProjectTeam);

                  const projectTeamData = await Promise.all(
                    ProjectTeam.filter((user: any) => user.projectId === projectTempId).map(async (user: any) => {
                      // console.log('user', user);

                      const userId = await thisI.userService._getUserDataByEmployeeCode(user.userId);

                      const reportToArray = user.reportTo.split(',');

                      // console.log('reportToArray', reportToArray);

                      const reportTo = await Promise.all(
                        reportToArray.map(async (reportToUser) => {
                          const user: any = await thisI.userService._getUserDataByEmployeeCode(reportToUser);

                          // console.log('reportToUser', user);

                          return user.id;
                        })
                      );

                      // console.log('userId', userId);

                      return {
                        user_id: userId.id,
                        report_to: reportTo,
                      };
                    })
                  );

                  const createdProjectResponse = await thisI.projectService
                    ._createProject({
                      name: project.name,
                      project_key: project.projectKey,
                      responsible_person: projectResponsiblePerson.id,
                      start_date: new Date(project.startDate),
                      estimated_end_date: new Date(project.estimatedEndDate),
                      created_by: projectCreatedBy.id,
                      updated_by: projectUpdatedBy.id,
                      projectTeam: projectTeamData,
                      projectBillingConfigration: { project_status: 'ongoing', is_billable: project.isBillable },
                    })
                    .then((res) => JSON.parse(JSON.stringify(res)));

                  console.log('createdProjectResponse', createdProjectResponse);

                  return { project_id: createdProjectResponse.id };
                })
              );

              console.log('WorkSpaceProjects', WorkSpaceProjects);

              return {
                title: workspace.title,
                responsible_person: responsiblePerson.id,
                description: workspace.description,
                created_by: createdBy.id,
                updated_by: updatedBy.id,
                is_active: workspace.isActive,
                team: workSpaceTeam,
                workspaceProject: WorkSpaceProjects,
              };
            })
          );

          console.log('WorkSpaceFormatData', WorkSpaceFormatData);

          const createWorkSpaceData = await thisI.workspaceService._importWorkspaces(WorkSpaceFormatData);

          return res.status(201).json(APIResponseFormat._ResDataCreated('Workspace Import'));
        } catch (error) {
          FileService._deleteFile(BasePath.default.WORKSPACE_IMPORT_PATH, req.files['workspaceExcelFile']);
          next(error);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
        }
      });
    } catch (error) {
      next(error);
      FileService._deleteFile(BasePath.default.WORKSPACE_IMPORT_PATH, req.files['workspaceExcelFile']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default WorkspaceController;
