import { NextFunction, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Op, Sequelize } from 'sequelize';
import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import { Encryption } from '@tms-workspace/encryption';
import { BasePath, FileService, MulterService } from '@tms-workspace/file-upload';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import ProjectService from '../services/project.service';
import UserService from '../../user/services/user.service';
import CustomFieldsService from '../../custom_fields/services/custom_fields.service';
import PermissionService from '../../../service/permissionCheck';
import { iProject } from '../../../database/interface/projects.interface';
import eventEmitter from '../../../../core/project.event';
import { eventEmitterProject, eventEmitterTask } from '@tms-workspace/preference';
import baseurls from 'apps/node/main-apis/src/baseurls';
class ProjectController {
  public projectService = new ProjectService();
  public customFieldsService = new CustomFieldsService();
  public userService = new UserService();
  public permissionService = new PermissionService();
  public projectEventEmitter = eventEmitterProject.default;
  public taskEventEmitter = eventEmitterTask.default;

  public getProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission && !req.headers.isdropdown) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const where = req.user.isAdmin
        ? {}
        : {
          [Op.and]: [
            {
              [Op.or]: [
                { '$projectWorkspace.id$': null }, // If workspace is not available
                { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
              ],
            },
            {
              [Op.or]: [
                {
                  '$projectTeam.user_id$': req.user.id,
                },
                Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                // {
                //   created_by: req.user.id,
                // },
                // {
                //   updated_by: req.user.id,
                // },
              ],
            },
          ],
        };

      const count = await this.projectService._getProjectsCount(where);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const projects = await this.projectService._getAllProject(where, +page, +limit, sortBy as string, orderBy as string);

      const result = projects.reduce((r, a) => {
        r[a.id] = r[a.id] || {};
        r[a.id]['id'] = a.id || null;
        r[a.id]['project_key'] = a.project_key || null;
        r[a.id]['name'] = a.name || null;
        r[a.id]['description'] = a.description || null;
        r[a.id]['start_date'] = a.start_date || null;
        r[a.id]['estimated_end_date'] = a.estimated_end_date || null;
        r[a.id]['responsible_person'] = a.responsible_person || null;
        r[a.id]['avatar'] = a.avatar || null;
        r[a.id]['created_by'] = a.created_by || null;
        r[a.id]['updated_by'] = a.updated_by || null;

        r[a.id]['projectTeam'] = r[a.id]['projectTeam'] ? [r[a.id]['projectTeam'], ...a.projectTeam] : [...a.projectTeam];
        r[a.id]['projectTag'] = r[a.id]['projectTag'] ? [r[a.id]['projectTag'], ...a.projectTag] : [...a.projectTag];
        r[a.id]['projectWorkspace'] = r[a.id]['projectWorkspace'] ? [r[a.id]['projectWorkspace'], a.projectWorkspace] : [a.projectWorkspace];
        return r;
      }, Object.create(null));

      const responseProjectDataTMP: iProject[] = Object.values(result);

      const responseProjectData = responseProjectDataTMP
        .map((project) => {
          const TaskCount = 0;
          const TeamMemberCount = project?.projectTeam?.length || 0;
          const tags = project?.projectTag?.map((tag) => {
            return tag?.tag !== null ? tag?.tag?.title : null;
          });

          const isUserHasProject =
            project?.projectTeam.find((user) => user.user_id === req.user.id || user.report_to.includes(req.user.id)) ||
            project.created_by === req.user.id ||
            project.updated_by === req.user.id;

          //  return {
          //    id: project.id,
          //    project_key: project.project_key,
          //    project_title: project.name,
          //    project_task_count: TaskCount,
          //    project_team_count: TeamMemberCount,
          //    project_tags: tags,
          //  };

          if (
            req.user.isAdmin ||
            (!req.user.isAdmin && isUserHasProject) ||
            project?.created_by === req.user.id ||
            project?.updated_by === req.user.id
          ) {
            return {
              id: project.id,
              project_key: project.project_key,
              project_title: project.name,
              project_task_count: TaskCount,
              project_team_count: TeamMemberCount,
              project_tags: tags,
            };
          }
        })
        .filter((notUndefined) => notUndefined !== undefined);

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);
      const data = responseProjectData.sort((a, b) => a.project_title.localeCompare(b.project_title));

      // [...responseProjectData]

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getActiveProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.headers;
      const user_id = Encryption._doDecrypt(req.headers.user_id as string);
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const where = (req.user.isAdmin || req.user.id === Number(user_id))
        ? {
          [Op.and]: [
            {
              [Op.or]: [
                { '$projectWorkspace.id$': null }, // If workspace is not available
                { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
              ],
            },
            {
              [Op.and]: [
                {
                  [Op.and]: [{ '$projectTeam.user_id$': user_id }]
                }
              ],
            },
          ]
        }
        : {
          [Op.and]: [
            {
              [Op.or]: [
                { '$projectWorkspace.id$': null }, // If workspace is not available
                { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
              ],
            },
            {
              [Op.and]: [
                {
                  [Op.and]: [{ '$projectTeam.user_id$': user_id }]
                },
                // Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
              ],
            },
          ]
        };
      const count = await this.projectService._getProjectsCountAfterSerch(where, {}, [], [], '', ['ongoing', 'undermaintenance']);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const projects = await this.projectService._getAllProjectAfterSerch(where, {}, [], [], '', ['ongoing', 'undermaintenance'], +page, +limit, sortBy as string, orderBy as string);
      const responseProjectData = [];
      for (const project of projects) {
        const TotalTaskCount = project?.ProjectTasks?.length ? project.ProjectTasks[0].total_task : 0;
        const PendingTaskCount = project?.ProjectTasks?.length ? project.ProjectTasks[0].pending_task_count : 0;
        const CompleteTaskCount = project?.ProjectTasks?.length ? project.ProjectTasks[0].complete_task_count : 0;
        const TeamMemberCount = project?.projectTeamData?.length ? project.projectTeamData[0].team_count : 0;
        const findTags = await this.projectService._getTags({ project_id: project.id });
        const tags = JSON.parse(JSON.stringify(findTags))?.map((tag) => {
          return tag?.tag !== null ? tag?.tag?.title : null;
        });
        const workspace: any = Object.assign({}, project?.projectWorkspace);
        // const isUserHasProject =
        //   project?.projectTeam.find((user) => user.user_id === req.user.id || user.report_to.includes(req.user.id)) ||
        //   project.created_by === req.user.id ||
        //   project.updated_by === req.user.id;

        // if (
        //   req.user.isAdmin ||
        //   (!req.user.isAdmin && isUserHasProject) ||
        //   project?.created_by === req.user.id ||
        //   project?.updated_by === req.user.id
        // ) {
        //   responseProjectData.push({
        //     id: project.id,
        //     project_key: project.project_key,
        //     project_title: project.name,
        //     project_task_count: TotalTaskCount,
        //     project_complete_task_count: CompleteTaskCount,
        //     project_pending_task_count: PendingTaskCount,
        //     project_team_count: TeamMemberCount,
        //     project_tags: tags,
        //     project_estimated_end_date: project.estimated_end_date || '',
        //     projectStatus: project?.projectBillingConfigration?.project_status || '',
        //     projectBillable: project?.projectBillingConfigration?.is_billable,
        //     projectStatusId: project?.projectBillingConfigration?.id || null,
        //     project_workspace: workspace?.workspace?.title || '',
        //     project_workspace_id: workspace?.workspace?.id || '',
        //   });
        // }
        responseProjectData.push({
          id: project.id,
          project_key: project.project_key,
          project_title: project.name,
          project_task_count: TotalTaskCount,
          project_complete_task_count: CompleteTaskCount,
          project_pending_task_count: PendingTaskCount,
          project_team_count: TeamMemberCount,
          project_tags: tags,
          project_estimated_end_date: project.estimated_end_date || '',
          projectStatus: project?.projectBillingConfigration?.project_status || '',
          projectBillable: project?.projectBillingConfigration?.is_billable,
          projectStatusId: project?.projectBillingConfigration?.id || null,
          project_workspace: workspace?.workspace?.title || '',
          project_workspace_id: workspace?.workspace?.id || '',
        });
      }

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(responseProjectData, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getUnlinkProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const workspace_id = Encryption._doDecrypt(req.headers.workspace_id as string);
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }
      const where = {};
      // const where = workspace_id
      //   ? {
      //       [Op.or]: [
      //         {
      //           '$projectWorkspace.id$': { [Op.is]: undefined },
      //         },
      //         {
      //           '$projectWorkspace.workspace_id$': workspace_id,
      //         },
      //       ],
      //     }
      //   : {
      //       [Op.or]: [
      //         {
      //           '$projectWorkspace.id$': { [Op.is]: undefined },
      //         },
      //       ],
      //     };
      // const where = {
      //   [Op.and]:[{
      //     '$projectWorkspace.id$': {[Op.is]: undefined },
      //   },{
      //       [Op.or]: [
      //         {
      //           '$projectTeam.user_id$': req.user.id,
      //         },
      //         Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
      //         {
      //           created_by: req.user.id,
      //         },
      //         {
      //           updated_by: req.user.id,
      //         },
      //       ],
      //     }]
      //     };

      const count = await this.projectService._getAllUnlinkProjectsCount(where);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }
      const projects = await this.projectService._getAllUnlinkProject(where, +page, +limit, sortBy as string, orderBy as string);
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(projects, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
  public getProjectsData = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission && !req.headers.isdropdown) {
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
                  { '$projectWorkspace.id$': null }, // If workspace is not available
                  { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
                ],
              },
              {
                [Op.or]: [
                  {
                    '$projectTeam.user_id$': req.user.id,
                  },
                  Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
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
            [Op.and]: [
              {
                [Op.or]: [
                  { '$projectWorkspace.id$': null }, // If workspace is not available
                  { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
                ],
              },
              {
                [Op.or]: [
                  {
                    '$projectTeam.user_id$': req.user.id,
                  },
                  Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                  // {
                  //   created_by: req.user.id,
                  // },
                  // {
                  //   updated_by: req.user.id,
                  // },
                ],
              },
            ],
          };
      const count = await this.projectService._getProjectsWithDataCount(where, req.body);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      // const projects = await this.projectService._getAllProject({}, +page, +limit, sortBy as string, orderBy as string);

      const projects = await this.projectService._getAllProjectData(where, req.body, +page, +limit, sortBy as string, orderBy as string);
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(projects, totalPages, limit as string, count, pageNumber));
      // return res.status(200).json(APIResponseFormat._ResDataFound(projects));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectsDataList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      req.user.isAdmin=false;
      const where = req.user.isAdmin
        ? {}
        : {
          [Op.and]: [
            {
              [Op.or]: [
                { '$projectWorkspace.id$': null }, // If workspace is not available
                { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
              ],
            },
            {
              [Op.or]: [
                {
                  '$projectTeam.user_id$': req.user.id,
                },
                Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
              ],
            },
          ],
        };
      const projects = await this.projectService._getProjectDrop(where, req.user);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(projects, null, null, null, null));
      // return res.status(200).json(APIResponseFormat._ResDataFound(projects));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectsDataListWithTaskCount = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectService._getProjectWithTaskCount(req.user);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(projects, null, null, null, null));
      // return res.status(200).json(APIResponseFormat._ResDataFound(projects));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectsDataListForActiveProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = Number(Encryption._doDecrypt(req.headers.user_id as string));
      console.log('userId: ====>', userId);
      const projects = await this.projectService._getProjectUsersActiveProject({ id: userId });
      console.log('projects: ====>', projects);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(projects, null, null, null, null));
      // return res.status(200).json(APIResponseFormat._ResDataFound(projects));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const { tagIds, workspaceIds, search, status, billable } = req.body;
      const searchText = search || '';
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission && !req.headers.isdropdown) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const where = req.user.isAdmin
        ? { [Op.or]: [{ name: { [Op.like]: `%${searchText}%` } }, { '$projectTag.tag.title$': { [Op.like]: `%${searchText}%` } }] }
        : {
          [Op.and]: [
            { [Op.or]: [{ name: { [Op.like]: `%${searchText}%` } }, { '$projectTag.tag.title$': { [Op.like]: `%${searchText}%` } }] },
            {
              [Op.or]: [
                { '$projectWorkspace.id$': null }, // If workspace is not available
                { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
              ],
            },
            {
              [Op.or]: [
                {
                  '$projectTeam.user_id$': req.user.id,
                },
                Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                // {
                //   created_by: req.user.id,
                // },
                // {
                //   updated_by: req.user.id,
                // },
              ],
            },
          ],
        };

      // const where = { name: { [Op.like]: `%${searchText}%` } };
      const inner_where = req.user.isAdmin ? {} : { user_id: req.user.id };
      const count = await this.projectService._getProjectsCountAfterSerch(
        where,
        inner_where,
        tagIds,
        workspaceIds,
        billable,
        status.length ? status : ['ongoing', 'undermaintenance', 'closed']
      );

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const projects = await this.projectService._getAllProjectAfterSerch(
        where,
        inner_where,
        tagIds,
        workspaceIds,
        billable,
        status.length ? status : ['ongoing', 'undermaintenance', 'closed'],
        +page,
        +limit,
        sortBy as string,
        orderBy as string
      );
      const responseProjectData = [];
      for (const project of projects) {
        const TotalTaskCount = project?.ProjectTasks?.length ? project.ProjectTasks[0].total_task : 0;
        const PendingTaskCount = project?.ProjectTasks?.length ? project.ProjectTasks[0].pending_task_count : 0;
        const CompleteTaskCount = project?.ProjectTasks?.length ? project.ProjectTasks[0].complete_task_count : 0;
        const TeamMemberCount = project?.projectTeamData?.length ? project.projectTeamData[0].team_count : 0;
        const findTags = await this.projectService._getTags({ project_id: project.id });
        const tags = JSON.parse(JSON.stringify(findTags))?.map((tag) => {
          return tag?.tag !== null ? tag?.tag?.title : null;
        });
        const workspace: any = Object.assign({}, project?.projectWorkspace);
        const data = await this.projectService._getTaskHistoryData({ project_id: project.id });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const isUserHasProject =
          project?.projectTeam.find((user) => user.user_id === req.user.id || user.report_to.includes(req.user.id)) ||
          project.created_by === req.user.id ||
          project.updated_by === req.user.id;
        project['total_worked_hours'] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`;
        if (
          req.user.isAdmin ||
          (!req.user.isAdmin && isUserHasProject) ||
          project?.created_by === req.user.id ||
          project?.updated_by === req.user.id
        ) {
          responseProjectData.push({
            id: project.id,
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            project_key: project.project_key,
            project_title: project.name,
            project_task_count: TotalTaskCount,
            project_complete_task_count: CompleteTaskCount,
            project_pending_task_count: PendingTaskCount,
            project_team_count: TeamMemberCount,
            project_tags: tags,
            project_estimated_end_date: project.estimated_end_date || '',
            projectStatus: project?.projectBillingConfigration?.project_status || '',
            projectBillable: project?.projectBillingConfigration?.is_billable,
            projectQuotedHours: project?.projectBillingConfigration?.quoted_hours,
            projectStatusId: project?.projectBillingConfigration?.id || null,
            project_workspace: workspace?.workspace?.title || '',
            project_workspace_is_active: workspace?.workspace?.is_active || 'false',
            project_workspace_id: workspace?.workspace?.id || '',
          });
        }
      }
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(responseProjectData, totalPages, limit as string, count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectDashboardListV2 = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission && !req.headers.isdropdown) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const count: { total_count: number }[] = await this.projectService._getProjectsDashboardCountAfterSerchV2(
        req.user,
      ) as { total_count: number }[];

      if (count[0]?.total_count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const projects = await this.projectService._getAllProjectDashboardAfterSerchV2(
        req.user,
        +page,
        +limit,
        sortBy as string,
        orderBy as string
      )
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count[0]?.total_count || 0);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(projects, totalPages, limit as string, count[0]?.total_count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectDashboardActiveV2 = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { sortBy, orderBy } = req.query;
      const user_id = Encryption._doDecrypt(req.headers.user_id as string);
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission && !req.headers.isdropdown) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const projects = await this.projectService._getAllProjectDashboardActionV2(
        {id:user_id},
        sortBy as string,
        orderBy as string
      )

      return res.status(200).json(APIResponseFormat._ResDataFound(projects));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectListV2 = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const { tagIds, workspaceIds, search, status, billable } = req.body;
      const searchText = search || '';
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission && !req.headers.isdropdown) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const count: { total_count: number }[] = await this.projectService._getProjectsCountAfterSerchV2(
        req.user,
        searchText,
        tagIds,
        workspaceIds,
        billable,
        status.length ? status : ['ongoing', 'undermaintenance', 'closed'],
      ) as { total_count: number }[];

      if (count[0].total_count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const projects = await this.projectService._getAllProjectAfterSerchV2(
        req.user,
        searchText,
        tagIds,
        workspaceIds,
        billable,
        status.length ? status : ['ongoing', 'undermaintenance', 'closed'],
        +page,
        +limit,
        sortBy as string,
        orderBy as string
      )

      // const responseProjectData = [];
      // for (const project of projects) {
      //   const data = await this.projectService._getTaskHistoryData({ project_id: project.id });
      //   const currentTime = new Date();

      //   let totalMilliseconds = 0;
      //   for (const entry of data) {
      //     if (entry.end_time === null) {
      //       const startTime = new Date(entry.start_time);
      //       totalMilliseconds += currentTime.getTime() - startTime.getTime();
      //     } else {
      //       const startTime = new Date(entry.start_time);
      //       const endTime = new Date(entry.end_time);
      //       totalMilliseconds += endTime.getTime() - startTime.getTime();
      //     }
      //   }

      //   const totalSeconds = Math.floor(totalMilliseconds / 1000);
      //   const hours = Math.floor(totalSeconds / 3600);
      //   const minutes = Math.floor((totalSeconds % 3600) / 60);
      //   const seconds = totalSeconds % 60;
      //   responseProjectData.push({...project,project_tags:project.project_tags?JSON.parse(project.project_tags):[],total_worked_hours:`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`})
      // }


      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count[0].total_count);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(projects, totalPages, limit as string, count[0].total_count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectListBillingV2 = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const { tagIds, workspaceIds, search, status, billable } = req.body;
      const searchText = search || '';
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission && !req.headers.isdropdown) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const count: { total_count: number }[] = await this.projectService._getProjectsCountAfterSerchBillingV2(
        req.user,
        searchText,
        tagIds,
        workspaceIds,
        billable,
        status.length ? status : ['ongoing', 'undermaintenance', 'closed'],
      ) as { total_count: number }[];

      if (count[0].total_count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const projects = await this.projectService._getAllProjectAfterSerchBillingV2(
        req.user,
        searchText,
        tagIds,
        workspaceIds,
        billable,
        status.length ? status : ['ongoing', 'undermaintenance', 'closed'],
        +page,
        +limit,
        sortBy as string,
        orderBy as string
      )

      // const responseProjectData = [];
      // for (const project of projects) {
      //   const data = await this.projectService._getTaskHistoryData({ project_id: project.id });
      //   const currentTime = new Date();

      //   let totalMilliseconds = 0;
      //   for (const entry of data) {
      //     if (entry.end_time === null) {
      //       const startTime = new Date(entry.start_time);
      //       totalMilliseconds += currentTime.getTime() - startTime.getTime();
      //     } else {
      //       const startTime = new Date(entry.start_time);
      //       const endTime = new Date(entry.end_time);
      //       totalMilliseconds += endTime.getTime() - startTime.getTime();
      //     }
      //   }

      //   const totalSeconds = Math.floor(totalMilliseconds / 1000);
      //   const hours = Math.floor(totalSeconds / 3600);
      //   const minutes = Math.floor((totalSeconds % 3600) / 60);
      //   const seconds = totalSeconds % 60;
      //   responseProjectData.push({...project,project_tags:project.project_tags?JSON.parse(project.project_tags):[],total_worked_hours:`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`})
      // }


      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count[0].total_count);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(projects, totalPages, limit as string, count[0].total_count, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectListBillingWorkingHouresV2 = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { project_ids } = req.body;
      const responseProjectData = [];
      for (const project of project_ids) {
        const data = await this.projectService._getTaskHistoryData({ project_id: project });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        responseProjectData.push({ project_id: project, total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` })
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(responseProjectData))
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectById = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const projectId = Number(req.headers.id);
      const projectId = Number(Encryption._doDecrypt(req.headers.id as string));
      if (!projectId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'update');

      if (!permission && !req.headers.isdropdown) {
        return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
      }
      let data = await this.projectService._getProject({ id: projectId });
      data = JSON.parse(JSON.stringify(data));
      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }
      const taskTimeLogs = await this.projectService._getTaskHistoryData({ project_id: projectId });
      const currentTime = new Date();

      let totalMilliseconds = 0;
      for (const entry of taskTimeLogs) {
        if (entry.end_time === null) {
          const startTime = new Date(entry.start_time);
          totalMilliseconds += currentTime.getTime() - startTime.getTime();
        } else {
          const startTime = new Date(entry.start_time);
          const endTime = new Date(entry.end_time);
          totalMilliseconds += endTime.getTime() - startTime.getTime();
        }
      }

      // const totalSeconds = Math.floor(totalMilliseconds / 1000);
      // const hours = Math.floor(totalSeconds / 3600);
      const hours = Math.floor(totalMilliseconds / (60 * 60 * 1000));
      const minutes = Math.floor((totalMilliseconds % (60 * 60 * 1000)) / (60 * 1000));
      const hoursString = hours.toString().padStart(2, '0');
      const minutesString = minutes.toString().padStart(2, '0');
      const timeString = `${hoursString}:${minutesString}`;


      return res.status(200).json(APIResponseFormat._ResDataFound({ ...data, totalWorkedHours: timeString }));
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectFullDataById = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const projectId = Number(req.headers.id);
      const projectId = Number(Encryption._doDecrypt(req.headers.id as string));
      if (!projectId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));
      // const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'update');

      // if (!permission&&!req.headers.isdropdown) {
      //   return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
      // }
      const data = await this.projectService._getProjectData({ id: projectId });
      // data=JSON.parse(JSON.stringify(data));
      // if (!data) {
      //   return res.status(404).json(APIResponseFormat._ResDataNotFound());
      // }
      // const taskTimeLogs = await this.projectService._getTaskHistoryData({ project_id: projectId });
      // const currentTime = new Date();

      // let totalMilliseconds = 0;
      // for (const entry of taskTimeLogs) {
      //   if (entry.end_time === null) {
      //     const startTime = new Date(entry.start_time);
      //     totalMilliseconds += currentTime.getTime() - startTime.getTime();
      //   } else {
      //     const startTime = new Date(entry.start_time);
      //     const endTime = new Date(entry.end_time);
      //     totalMilliseconds += endTime.getTime() - startTime.getTime();
      //   }
      // }

      // // const hours = Math.floor(totalSeconds / 3600);
      // const hours = Math.floor(totalMilliseconds / (60 * 60 * 1000));
      // const minutes = Math.floor((totalMilliseconds % (60 * 60 * 1000)) / (60 * 1000));
      // const hoursString = hours.toString().padStart(2, '0');
      // const minutesString = minutes.toString().padStart(2, '0');
      // const timeString = `${hoursString}:${minutesString}`;


      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public createProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._projectStorage,
        fileFilter: MulterService._imageFileFilter,
      }).fields([{ name: 'avatarFile', maxCount: 1 }]);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }

          const team = req.body.team ? JSON.parse(req.body.team) : [];
          const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
          let projectTags = [];

          if (!req.body.name || !req.body.project_key || !req.body.responsible_person || team.length == 0) {
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField());
          }

          const permission = await thisI.permissionService._checkModulePermission(req.user.id, 'project', 'create');

          if (
            !permission ||
            !permission.title ||
            !permission.responsible_person ||
            !permission.team ||
            !permission.project_key ||
            !permission.link_workspace
          ) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
            return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
          }

          if (!permission.documents) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
          }

          if (permission.tag) {
            projectTags = await Promise.all(
              tags.map((tag) => {
                const newtag = thisI.projectService._findOrCreateTag(tag);
                return newtag;
              })
            );
          }

          const projectData: any = {
            name: req.body.name,
            responsible_person: Number(req.body.responsible_person),
            projectTeam: team,
            projectWorkspace: req.body.workspace_id ? { workspace_id: Number(req.body.workspace_id) } : null,
            project_key: req.body.project_key,
            created_by: req.user.id || null,
            updated_by: req.user.id || null,
          };

          if (permission.description) {
            projectData.description = req.body.description || null;
          }

          if (permission.tag) {
            projectData.projectTag = projectTags || null;
          }

          if (permission.start_date) {
            projectData.start_date = req.body.start_date ? new Date(req.body.start_date) : null;
          }

          if (permission.end_date) {
            projectData.estimated_end_date = req.body.estimated_end_date ? new Date(req.body.estimated_end_date) : null;
          }

          if (permission.documents) {
            projectData.avatar = req.files?.['avatarFile']?.[0].filename ? `uploads/project/${req.files['avatarFile'][0].filename}` : null;
          }

          // Project should not have same name
          const validation = await thisI.projectService._getProject({ name: projectData.name });
          if (validation) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
            return res.status(409).json(APIResponseFormat._ResDataExists('Project', 'name'));
          }

          const data = await thisI.projectService._createProject(projectData);
          if (!data) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
            return res.status(500).json(APIResponseFormat._ResDataNotCreated('Project'));
          }
          const ProjectData = JSON.parse(JSON.stringify(data));
          eventEmitter.emit('createProjectStatus', null, ProjectData.id, 'ongoing', false, null);
          eventEmitter.emit('createProjectStatusWithState', req.user.id, ProjectData.id);

          let users = [];

          if (ProjectData.projectTeam.length > 0) {
            ProjectData.projectTeam.forEach((element) => {
              users.push(element.user_id);
            });
          }

          if (ProjectData.responsible_person) {
            users.push(ProjectData.responsible_person);
          }

          if (ProjectData.projectTeam.length > 0) {
            ProjectData.projectTeam.forEach((element) => {
              users = [...users, ...element.report_to];
            });
          }

          const uniqueUsers = [...new Set(users)];

          console.log('uniqueUsers', uniqueUsers);

          const projecteventData = {
            userIds: uniqueUsers,
            projectId: ProjectData.id,
          };

          eventEmitterProject.default.emit('createProject', projecteventData);

          return res.status(201).json(APIResponseFormat._ResDataCreated('Project', data));
        } catch (error) {
          FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
          next(error);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError());
        }
      });
    } catch (error) {
      next(error);
      FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public uploadDocumentFile = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._projectStorage,
        fileFilter: MulterService._imageFileFilter,
      }).fields([{ name: 'upload', maxCount: 1 }]);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      newUpload(req, res, async function (err) {
        if (err && err.message) {
          return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
        }
        // return res.status(201).json(APIResponseFormat._ResDataCreated('Project', {currentFolder:{url:req.files?.['avatarFile']?.[0].filename ? `uploads/project/${req.files['avatarFile'][0].filename}` : null}}));
        // return res.send({currentFolder:{url:req.files?.['avatarFile']?.[0].filename ? `http://127.0.0.1:3500/uploads/project/${req.files['avatarFile'][0].filename}` : null,path:'/',acl:991}})
        return res.send({
          uploaded: 1,
          fileName: req.files?.['upload']?.[0].filename,
          url: req.files?.['upload']?.[0].filename ? `${baseurls.URL}uploads/project/${req.files['upload'][0].filename}` : null
      })
      });
    } catch (error) {
      // next(error);
      return res.send({
        uploaded: 1,
        fileName: req.files?.['upload']?.[0].filename,
        url: req.files?.['upload']?.[0].filename ? `${baseurls.URL}uploads/project/${req.files['upload'][0].filename}` : null,
        error: {
          message: error.message
      }
    })
      // return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public updateProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._projectStorage,
        fileFilter: MulterService._imageFileFilter,
      }).fields([{ name: 'avatarFile', maxCount: 1 }]);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }

          const projectId = Number(Encryption._doDecrypt(req.headers.id as string));
          // const projectId = req.headers.id

          const team = req.body.team ? JSON.parse(req.body.team) : [];
          const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
          let projectTags = [];

          if (!req.body.name || !req.body.project_key || !req.body.responsible_person || team.length == 0) {
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField());
          }

          // check workspace exits or not
          let validation = await thisI.projectService._getProject({ id: projectId });
          validation = JSON.parse(JSON.stringify(validation));
          if (!validation) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
            return res.status(409).json(APIResponseFormat._ResDataNotFound('Project'));
          }

          // old project data
          const oldProjectData: iProject = await thisI.projectService._getProject({
            id: projectId,
          });

          // project should not exits with same name
          const validationByName: iProject = await thisI.projectService._getProject({
            id: { [Op.ne]: projectId },
            name: req.body.name,
          });

          if (validationByName) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
            return res.status(409).json(APIResponseFormat._ResDataExists('Project', 'Name'));
          }

          const permission = await thisI.permissionService._checkModulePermission(req.user.id, 'project', 'update');

          if (!permission) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
            return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
          }

          if (!permission.documents) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
          }

          if (permission.tag) {
            projectTags = await Promise.all(
              tags.map((tag) => {
                const newtag = thisI.projectService._findOrCreateTag(tag);
                return newtag;
              })
            );

            projectTags = projectTags.map((tag) => {
              const Tags = validation.projectTag.find((e) => e.tag_id === tag.tag_id);
              if (Tags) {
                return { id: Tags.id, tag_id: tag.tag_id };
              } else {
                return tag;
              }
            });
          }
          const oldAvatar = validation.avatar || null;
          const projectData = {
            id: projectId,
            name: permission.title ? req.body.name : validation.name,
            description: permission.description ? req.body.description : validation.description,
            responsible_person: permission.responsible_person ? Number(req.body.responsible_person) : validation.responsible_person,
            projectTeam: permission.team ? team : validation.projectTeam,
            projectWorkspace:
              req.body.workspace_id ? permission.link_workspace && req.body.workspace_id
                ? validation?.projectWorkspace?.id != undefined
                  ? { id: validation?.projectWorkspace?.id, workspace_id: Number(req.body.workspace_id), project_id: projectId }
                  : { workspace_id: Number(req.body.workspace_id), project_id: projectId }
                : validation.projectWorkspace : {},
            project_key: permission.project_key ? req.body.project_key : validation.project_key,
            projectTag: permission.tag ? projectTags : validation.projectTag,
            start_date: permission.start_date ? (req.body.start_date ? new Date(req.body.start_date) : null) : validation.start_date,
            estimated_end_date: permission.end_date
              ? req.body.estimated_end_date
                ? new Date(req.body.estimated_end_date)
                : null
              : validation.estimated_end_date,
            avatar:
              permission.documents && req.files?.['avatarFile']?.[0].filename ? `uploads/project/${req.files['avatarFile'][0].filename}` : oldAvatar,
            updated_by: req.user.id || null,
            created_by: validation.created_by,
          };

          projectData.projectTeam = projectData.projectTeam.map((el) => {
            return {
              ...el,
              project_id: projectId,
            };
          });
          projectData.projectTag = projectData.projectTag.map((el) => {
            return {
              ...el,
              project_id: projectId,
            };
          });

          // delete teams
          const deletedTeam = validation.projectTeam.filter(
            (el) =>
              !projectData?.projectTeam.find((e) => {
                return e.id == el.id;
              })
          );

          if (deletedTeam.length && permission.team) {
            const data = await thisI.projectService._deleteProjectTeam({
              id: { [Op.in]: deletedTeam.map((el) => el.id) },
            });
            if (!data) {
              FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
              return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Project'));
            }
          }

          // delete project
          const deletedTag = validation.projectTag.filter((el) => !projectData?.projectTag.find((e) => e?.id == el.id));
          if (deletedTag.length && permission.tag) {
            const data = await thisI.projectService._deleteProjectTags({
              id: { [Op.in]: deletedTag.map((el) => el.id) },
            });
            if (!data) {
              FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
              return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Project'));
            }
          }

          // update Workspace
          const data = await thisI.projectService._updateProject(projectData);

          if (!data) {
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
            return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Project'));
          }

          // delete old avatar
          if (req.files?.['avatarFile']?.[0].filename && oldAvatar && fs.existsSync(path.join(BasePath.default.PROJECT_PATH, oldAvatar))) {
            fs.unlinkSync(path.join(BasePath.default.PROJECT_PATH, oldAvatar));
          }
          const newProjectData: iProject = await thisI.projectService._getProject({
            id: projectId,
          });

          const oldTeamData = JSON.parse(JSON.stringify(oldProjectData)).projectTeam;
          const newTeamData = JSON.parse(JSON.stringify(newProjectData)).projectTeam;
          const userIdsToRemove = oldTeamData
            .filter((oldUser) => !newTeamData.some((newUser) => newUser.user_id === oldUser.user_id))
            .map((user) => user.user_id);

          thisI.taskEventEmitter.emit('team_member_remove_from_project', userIdsToRemove, projectId);

          eventEmitterProject.default.emit('updateProject', {
            userIds: deletedTeam.map((el) => el.user_id.toString()),
            projectId: projectId.toString(),
            updatedUserIds: newTeamData.map((user) => user.user_id.toString()),
          });

          return res.status(200).json(APIResponseFormat._ResDataUpdated('Project'));
        } catch (error) {
          console.log('Error', error);

          next(error);
          FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError());
        }
      });
    } catch (error) {
      console.log('Error', error);

      next(error);
      FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public deleteProject = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const projectId = Number(req.headers.id);
      const projectId = Number(Encryption._doDecrypt(req.headers.id as string));
      if (!projectId) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));

      let validation: iProject = await this.projectService._getProject({ id: projectId });
      validation = JSON.parse(JSON.stringify(validation));
      if (!validation) return res.status(409).json(APIResponseFormat._ResDataNotFound());

      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'delete');

      if (!permission) {
        return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
      }

      const data = await this.projectService._deleteProject(projectId);
      const dataTeam = await this.projectService._deleteProjectTeam({ project_id: projectId });
      // const dataTags = await this.projectService._deleteProjectTags({ project_id: projectId });
      const dataWorkspace = await this.projectService._deleteProjectWorkspace({ project_id: projectId });

      if (!data || !dataTeam || !dataWorkspace) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Project'));
      }

      // delete old avatar
      if (validation.avatar) {
        fs.unlinkSync(path.join(BasePath.default.BASE_PATH, validation.avatar));
      }

      return res.status(200).json(APIResponseFormat._ResDataDeleted('Project'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public createProjectBillingConfiguration = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.body.project_id || !req.body.status) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField());
      }
      eventEmitter.emit(
        'createProjectStatus',
        req.body.id || null,
        req.body.project_id,
        req.body.status,
        req.body.isBillable || false,
        req.body.isBillable ? req.body.quoted_hours || null : null
      );

      return res.status(200).json(APIResponseFormat._ResDataUpdated('Project status'));
    } catch (error) {
      next(error);
      FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['avatarFile']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public checkProjectKey = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const projectId = Number(req.headers.id);
      const projectkey = req.body.key;
      if (!projectkey) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project key'));

      const data = await this.projectService._getProject({ project_key: projectkey });

      if (!data) {
        return res.status(200).json(APIResponseFormat._ResMessage(200, true, 'It will be unique'));
      }
      return res.status(200).json(APIResponseFormat._ResMessage(200, false, 'Key already exists'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectTeam = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const projectId = Number(Encryption._doDecrypt(req.headers.id as string));
      const projectId = req.body.project_id;
      if (projectId.length < 1) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));
      // const data = await this.projectService._getProjectTeam({ id:{[Op.in]:projectId} });
      let data = await this.projectService._getProjectTeam(projectId);
      data=JSON.parse(JSON.stringify(data))
      data = data.map((item: any) => {
        const sortedTeam=item.projectTeam.sort((a: any, b: any) => a.user.first_name.localeCompare(b.user.first_name));
        return {
          ...item,
          projectTeam: sortedTeam
        }

      })
      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectStatus = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const projectId = Number(Encryption._doDecrypt(req.headers.id as string));
      const projectIds = req.body.project_id;
      if (projectIds.length < 1) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));

      const data = await this.projectService._getProjectStatus({ id: { [Op.in]: projectIds } });
      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectCustomFields = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const projectId = Number(Encryption._doDecrypt(req.headers.id as string));
      const projectIds = req.body.project_id;
      if (projectIds.length < 1) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));

      const data = await this.projectService._getProjectCustomFields({ id: { [Op.in]: projectIds } });
      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public bulkInactive = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = Number(Encryption._doDecrypt(req.headers.user_id as string));
      const projectIds = req.body.project_ids;
      const workspaceIds = req.body.workspace_ids;
      console.log(user_id,"user_id");
      console.log(projectIds,"projectIds");
      console.log(workspaceIds,"workspaceIds");
      
      if (projectIds.length < 1 && workspaceIds?.length < 1) return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id'));
      if (projectIds.length > 0) {
        const update=await this.projectService._deleteProjectTeam({ project_id: { [Op.in]: projectIds }, user_id });
        if(update){
          await this.projectService._updateProjectTeam({user_id, project_ids:projectIds})
          this.taskEventEmitter.emit('team_member_remove_from_project_multy_project', user_id, projectIds);
        }
      }
      if (workspaceIds.length > 0) {
        await this.projectService._deleteWorkspaceTeam({ workspace_id: { [Op.in]: workspaceIds }, user_id });
      }

      eventEmitterProject.default.emit('updateUser', {
        userId: user_id.toString(),
        projectIds: projectIds.map((p) => p.toString()),
      });

      return res.status(200).json(APIResponseFormat._ResDataFound());
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getProjectTasksV2 = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { limit } = req.query;
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');

      if (!permission && !req.headers.isdropdown) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      const projects = await this.projectService._getProjectTasksV2(Number(limit));
      return res.status(200).json(APIResponseFormat._ResDataFound(projects));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

}

export default ProjectController;
