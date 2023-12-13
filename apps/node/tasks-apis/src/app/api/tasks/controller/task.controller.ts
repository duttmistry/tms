import { NextFunction, Request, Response, response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import TaskService from '../services/task.service';
import { Pagination } from '@tms-workspace/apis-core';
import TaskTimeLogsService from '../services/task_time_logs.service';
import { iRequestWithUser, iRequestWithUserWithProfile } from '../../../database/interface/user.interface';
import { Op, Sequelize } from 'sequelize';
import { BasePath, FileService, MulterService } from '@tms-workspace/file-upload';
import multer from 'multer';
import PermissionService from '../../../service/permissionCheck';
import TaskChangeLogService from '../services/task_change_log.service';
import _DB from '../../../database/models';
import { Encryption } from '@tms-workspace/';
import { iTasksObj } from '../../../database/interface/task.interface';
import { eventEmitterTask } from '@tms-workspace/preference';
import { _doEncrypt } from 'libs/utils/encryption/src/lib/utils-encryption';
import moment from 'moment';
class TaskController {
  public taskService = new TaskService();
  public permissionService = new PermissionService();
  public taskChangeLogService = new TaskChangeLogService();
  public taskTimeLogsService = new TaskTimeLogsService();

  public getAllWorkspace = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'workspace', 'view');
      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }
      const where = req.user.isAdmin
        ? {}
        : {
            [Op.and]: [
              { is_active: true },
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
          };
      let workspace = await this.taskService._getAllWorkspacesDropdown(where);
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
          .filter((p) => p.project !== null)
          .map((p) => {
            return { ...p.project };
          });

        el.projects = project;
        delete el.workspaceProject;
        return el;
      });
      return res.status(200).json(APIResponseFormat._ResDataFound(workspace));
    } catch (error) {
      console.log('🚀 ~ file: task.controller.ts:15 ~ TaskController ~ getAllWorkspace= ~ error:', error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getAllTasks = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const count = await this.taskService._count({});
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.taskService._getAllTasks({}, +page, +limit, sortBy as string, orderBy as string);
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getAllTasksByProjects = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { projects, search } = req.body;
      if (projects.length <= 0) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound());
      }
      const where =
        search && search !== ''
          ? {
              [Op.and]: {
                project_id: {
                  [Op.in]: projects,
                },
                title: { [Op.like]: `%${search.trim()}%` },
              },
            }
          : {
              project_id: {
                [Op.in]: projects,
              },
            };
      const { page, limit, sortBy, orderBy } = req.query;
      const count = await this.taskService._count(where);
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.taskService._getAllTasks(where, +page, +limit, sortBy as string, orderBy as string);
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getAllFreeTasksByProjects = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { projects, search } = req.body;
      if (projects.length <= 0) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound());
      }
      const where =
        search && search !== ''
          ? {
              [Op.and]: {
                project_id: {
                  [Op.in]: projects,
                },
                title: { [Op.like]: `%${search.trim()}%` },
                // id: {
                //   [Op.notIn]: Sequelize.literal('(SELECT parent_task_id FROM tm_tasks WHERE parent_task_id IS NOT NULL)'),
                // },
                parent_task_id: null,
              },
            }
          : {
              // project_id: {
              //   [Op.in]: projects,
              // },
              [Op.and]: {
                project_id: {
                  [Op.in]: projects,
                },
                // id: {
                //   [Op.notIn]: Sequelize.literal('(SELECT parent_task_id FROM tm_tasks WHERE parent_task_id IS NOT NULL)'),
                // },
                parent_task_id: null,
              },
            };
      const { page, limit, sortBy, orderBy } = req.query;
      const count = await this.taskService._count(where);
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.taskService._getAllTasks(where, +page, +limit, sortBy as string, orderBy as string);
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getProjectTeam = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const projects = req.headers.projects as string;
      const where = req.user.isAdmin
        ? {}
        : {
            id: {
              [Op.in]: JSON.parse(projects),
            },
          };
      const getProjectTeam = await this.taskService._getProjectTeam(where);
      const Users = getProjectTeam.map((p) => {
        const projectTeam = p.projectTeam.map((u) => {
          return u.user;
        });
        return { id: p.id, projectTeam };
      });
      if (!getProjectTeam) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(Users));
    } catch (error) {
      console.log('error', error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getTaskById = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const TaskId = Encryption._doDecrypt(req.headers.id as string);
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'tasks', 'view');
      if (!permission && !req.user.isAdmin) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }
      let task = await this.taskService._getTasksById({ id: TaskId });
      task = JSON.parse(JSON.stringify(task));
      // let child_task = await this.taskService._getAllTasksData({ parent_task_id: TaskId });
      // child_task = JSON.parse(JSON.stringify(child_task));
      let is_team_member = await this.taskService._getProjectTeamById({ project_id: task.project_id, user_id: req.user.id });
      is_team_member = JSON.parse(JSON.stringify(is_team_member));
      if ((is_team_member && is_team_member.id) || req.user.isAdmin) {
        const pendingTime = await this.taskService._countPendingTime(task.eta, task.total_worked_hours);
        // const newTask={...task,pendingTime:pendingTime,subTask:child_task};
        const newTask = { ...task, pendingTime: pendingTime };
        return res.status(200).json(APIResponseFormat._ResDataFound(newTask));
      } else {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getTaskByUser = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = Encryption._doDecrypt(req.headers.user_id as string);
      // const userId =req.headers.user_id;
      const permission = await this.permissionService._checkModulePermission(req.user.id, 'tasks', 'view');
      if (!permission && !req.user.isAdmin) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }
      let tasks = await this.taskService._getTasksByUserId({ assignee: userId, state: { [Op.ne]: 'completed' } });
      tasks = JSON.parse(JSON.stringify(tasks));
      let taskList = [];
      for (let task of tasks) {
        const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: task.id });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        let letestMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
            letestMilliseconds = currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
            letestMilliseconds = endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const totalSecondsLetest = Math.floor(letestMilliseconds / 1000);
        const hoursLetest = Math.floor(totalSecondsLetest / 3600);
        const minutesLetest = Math.floor((totalSecondsLetest % 3600) / 60);
        const secondsLetest = totalSecondsLetest % 60;

        taskList.push({
          ...task,
          letest_worked_hours: `${hoursLetest.toString().padStart(2, '0')}:${minutesLetest.toString().padStart(2, '0')}:${secondsLetest
            .toString()
            .padStart(2, '0')}`,
          total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        });
      }
      taskList = taskList.sort((a, b) => {
        if (a.running_status === 'Ongoing' && b.running_status !== 'Ongoing') {
          return -1; // Place 'Ongoing' tasks before others
        } else if (a.running_status !== 'Ongoing' && b.running_status === 'Ongoing') {
          return 1; // Place 'Ongoing' tasks after others
        } else {
          return 0; // Leave the order unchanged for tasks with the same status
        }
      });

      return res.status(200).json(APIResponseFormat._ResDataFound(taskList));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getTasksLabels = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const project = req.headers.project;
      // const where = req.user.isAdmin
      //   ? {}
      //   : {
      //       project_id: project,
      //     };
      const where = {
        project_id: project,
      };
      const getProjectLabels = await this.taskService._getProjectLabels(where);
      if (!getProjectLabels) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(getProjectLabels));
    } catch (error) {
      console.log('error', error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getTasksLabelsByProjects = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const projects = req.body.projects;
      // const where = req.user.isAdmin
      //   ? {}
      //   : {
      //       project_id: project,
      //     };
      const where = {
        id: {
          [Op.in]: projects,
        }
      };
      const getProjectLabels = await this.taskService._getProjectLabelsWithFullData(where);
      if (!getProjectLabels) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(getProjectLabels));
    } catch (error) {
      console.log('error', error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public allActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const task_id = req.headers.task_id;
      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      let count = await this.taskService._ActivityCount({ task_id: Number(task_id) });
      count = count[0]?.count || 0;
      if ((count as number) < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.taskService._getAllActivity(+page, +limit, sortBy as string, orderBy as string, { task_id: Number(task_id) });
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public createTasks = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._taskDocumentStorage,
        fileFilter: MulterService._fileFilter,
      }).fields([{ name: 'documents', maxCount: 30 }]);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }
          const {
            project_id,
            parent_task_id,
            type,
            title,
            description,
            state,
            status,
            section,
            assignee,
            assigned_by,
            reporter,
            labels,
            external_link,
            start_date,
            due_date,
            priority,
            eta,
            subscribers,
          } = req.body;
          if (!project_id) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Please select a project.'));
          }
          if (!type || !title) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Task Type , Title Or Assignee'));
          }

          if (parent_task_id && parent_task_id != 'null') {
            let task = await thisI.taskService._getTasksById({ id: parent_task_id });
            task = JSON.parse(JSON.stringify(task));
            console.log(task, 'P_D_d', parent_task_id);

            if (task.project_id != project_id) {
              return res.status(409).send(APIResponseFormat._ResMessage(409, false, 'Perent task project and subtask project not match'));
            }
          }

          // find required custom fields
          const costomeFields = await thisI.taskService._getAllCustomeFieldByProjectId(project_id);
          const customFieldArray = [];
          const requiredFieldsError = [];
          for (const field of JSON.parse(JSON.stringify(costomeFields))) {
            const fieldT = req.body[field.label.trim()];
            if (field.is_required) {
              if (!fieldT || fieldT == undefined || fieldT == null || fieldT === '') {
                requiredFieldsError.push(field.label);
              } else {
                customFieldArray.push({
                  task_custom_field_id: field.id,
                  task_id: '',
                  value: fieldT,
                  created_by: Number(req.user.id),
                  updated_by: Number(req.user.id),
                });
              }
            } else {
              if (!fieldT || fieldT == undefined || fieldT == null || fieldT === '') {
                //
              } else {
                customFieldArray.push({
                  task_custom_field_id: field.id,
                  task_id: '',
                  value: fieldT,
                  created_by: Number(req.user.id),
                  updated_by: Number(req.user.id),
                });
              }
            }
          }

          // validate required custom fields
          if (requiredFieldsError.length > 0) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField(requiredFieldsError.join(',')));
          }
          const ProjectDetails = await thisI.taskService._getProjectData({ id: project_id });

          //Store Labels
          const tasks_labels_array = labels ? JSON.parse(labels) : [];
          const labelsList = await Promise.all(
            tasks_labels_array.map((label) => {
              const newlabel = thisI.taskService._findOrCreateLabel(label);
              return newlabel;
            })
          );

          const task_details = {
            project_id: Number(project_id),
            parent_task_id: parent_task_id && parent_task_id != 'null' ? Number(parent_task_id) : null,
            task_key_prefix: ProjectDetails.project_key,
            type: type,
            title: title.trim(),
            external_link: external_link || null,
            description: description.trim(),
            state: state,
            status: status && status != 'null' ? Number(status) : null,
            section: section && section != 'null' ? Number(section) : null,
            assignee: assignee && assignee != 'null' ? Number(assignee) : null,
            assigned_by: assigned_by && assigned_by != 'null' ? Number(assigned_by) : null,
            reporter: reporter && reporter != 'null' ? Number(reporter) : null,
            labels: labelsList || [],
            documents: [],
            start_date: start_date ? new Date(start_date) : null,
            due_date: due_date ? new Date(due_date) : null,
            // priority: priority || 'Normal',
            priority: priority && priority != 'null' ? priority : null,
            running_status: 'Not Started Yet',
            eta: eta,
            subscribers: subscribers ? JSON.parse(subscribers) : [],
            created_by: Number(req.user.id),
            updated_by: Number(req.user.id),
          };
          task_details.documents = req.files?.['documents']?.length
            ? req.files?.['documents'].map((el) => `uploads/taskDocuments/${el.filename}`)
            : null;
          const Create_Task = await thisI.taskService._createTasks(task_details);

          if (!Create_Task) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(500).json(APIResponseFormat._ResDataNotCreated('Tasks'));
          } else if (Create_Task) {
            const Task = JSON.parse(JSON.stringify(Create_Task));
            customFieldArray.map((e) => (e.task_id = Task.id));
            if (customFieldArray.length > 0) {
              await thisI.taskService._createTasksFields(customFieldArray);
            }
            const logBody = {
              user_id: req.user.id,
              user_name: `${req.user.first_name} ${req.user.last_name}`,
              user_profile: req.user.user_image,
              task_id: Task.id,
              action: 'Task created',
            };

            await thisI.taskChangeLogService._create(logBody);
            let Newtask = await thisI.taskService._getTasksById({ id: Task.id });
            Newtask = JSON.parse(JSON.stringify(Newtask));

            const subscribers_array = Newtask.subscribers;
            const subscribers = subscribers_array.map((el) => el.toString());

            const task = await thisI.taskService._getTasksById({ id: Task.id });
            const data = {
              task_id: Task.id,
              assigned_to: [Newtask.assignee ? '' + Newtask.assignee : null],
              subscribers: subscribers || [],
              reporting_person: [Newtask.reporter ? '' + Newtask.reporter : null],
              task_title: Newtask.title,
              projectId: Newtask.project_id ? '' + Newtask.project_id : null,
              action_by: req.user.first_name + ' ' + req.user.last_name,
              action_by_profile: req.user.user_image,
              assigned_to_name: Newtask.assigneeUser ? `${Newtask.assigneeUser.first_name} ${Newtask.assigneeUser.last_name}` : '',
              assigned_by_name: Newtask.assignedByUser ? `${Newtask.assignedByUser.first_name} ${Newtask.assignedByUser.last_name}` : '',
              priority: Newtask.priority,
              project_name: Newtask.projects.name,
              due_date: Newtask.due_date,
              subscribers_name: Newtask.assignedByUser
                ? `${Newtask.assignedByUser?.first_name} ${Newtask.assignedByUser?.last_name}`
                : '' + Newtask.reportToUser
                ? `${Newtask.reportToUser?.first_name} ${Newtask.reportToUser?.last_name}`
                : '',
              action_performer : '' + req.user.id
            };

            eventEmitterTask.default.emit('notify_add_task', data);
            return res.status(201).json(APIResponseFormat._ResDataCreated('Tasks', [Newtask]));
          }
        } catch (error) {
          console.log('error', error);
          FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
          next(error);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
        }
      });
    } catch (error) {
      console.log('error', error);
      next(error);
      FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public createQuickTasks = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const {
        project_id,
        type,
        title,
        assignee,
        reporter,
        state,
        status,
        section,
        start_date,
        labels,
        due_date,
        parent_task_id,
        description,
        priority,
        eta,
        subscribers,
      } = req.body;
      if (!project_id) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Please select a project.'));
      }

      if (parent_task_id && parent_task_id != 'null') {
        let task = await this.taskService._getTasksById({ id: parent_task_id });
        task = JSON.parse(JSON.stringify(task));
        if (task.project_id != project_id) {
          return res.status(409).send(APIResponseFormat._ResMessage(409, false, 'Perent task project and subtask project not match'));
        }
      }

      if (!type || !title) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Task Type , Title Or Assignee'));
      }
      const tasks_labels_array = labels ? JSON.parse(labels) : [];
      const labelsList = await Promise.all(
        tasks_labels_array.map((label) => {
          const newlabel = this.taskService._findOrCreateLabel(label);
          return newlabel;
        })
      );
      const ProjectDetails = await this.taskService._getProjectData({ id: project_id });
      const task_details = {
        project_id: Number(project_id),
        parent_task_id: parent_task_id || null,
        // task_key: `${ProjectDetails.project_key}${(parseInt(last_task_id) + 1).toString().padStart(2, '0')}`,
        task_key_prefix: ProjectDetails.project_key,
        type: type,
        title: title.trim(),
        description: description || null,
        state: state || 'todo',
        status: status || null,
        section: section && section != 'null' ? Number(section) : null,
        assignee: assignee && assignee != 'null' ? Number(assignee) : null,
        assigned_by: Number(req.user.id),
        reporter: reporter && reporter != 'null' ? Number(reporter) : null,
        labels: labelsList || [],
        documents: [],
        start_date: start_date || null,
        due_date: due_date || null,
        // priority: priority||'Normal',
        priority: priority && priority != 'null' ? priority : null,
        running_status: 'Not Started Yet',
        eta: eta || '2h',
        subscribers: subscribers ? req.body.subscribers : [],
        created_by: Number(req.user.id),
        updated_by: Number(req.user.id),
      };

      // adding subscribers in parent task if not exist;

      if (parent_task_id && req.body.subscribers.length > 0) {
        let task = await this.taskService._getTasksById({ id: parent_task_id });
        task = JSON.parse(JSON.stringify(task));
        console.log('task.subscribers', task.subscribers);
        console.log('req.body.subscribers', req.body.subscribers);
        // check in task.subscribers and req.body.subsribers if req.body.subscribers is not includes in task.subscribers the only add in task.subscribers
        req.body.subscribers.forEach((subscriber) => {
          if (!task.subscribers.includes(subscriber)) {
            task.subscribers.push(subscriber);
          }
        });
        const updateTask = await this.taskService._updateTasks({ subscribers: task.subscribers }, { id: parent_task_id });
      }

      const Create_Task = await this.taskService._createTasks(task_details);

      if (!Create_Task) {
        FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Task'));
      } else if (Create_Task) {
        const Task = JSON.parse(JSON.stringify(Create_Task));
        const logBody = {
          user_id: req.user.id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
          task_id: Task.id,
          action: 'Task created',
        };
        await this.taskChangeLogService._create(logBody);
        let Newtask = await this.taskService._getTasksById({ id: Task.id });
        Newtask = JSON.parse(JSON.stringify(Newtask));

        // const subscribers_array = Newtask.subscribers || [];
        // convert subscribers array into string
        const subscribers = req.body.subscribers.map((e) => e.toString());

        const data = {
          task_id: Task.id,
          assigned_to: [Newtask.assignee ? '' + Newtask.assignee : null],
          subscribers: subscribers || [],
          reporting_person: [Newtask.reporter ? '' + Newtask.reporter : null],
          task_title: Newtask.title,
          projectId: Newtask.project_id ? '' + Newtask.project_id : null,
          action_by: req.user.first_name + ' ' + req.user.last_name,
          action_by_profile: req.user.user_image,
          assigned_to_name: Newtask.assigneeUser ? `${Newtask.assigneeUser.first_name} ${Newtask.assigneeUser.last_name}` : null,
          assigned_by_name: Newtask.assignedByUser ? `${Newtask.assignedByUser.first_name} ${Newtask.assignedByUser.last_name}` : '',
          priority: Newtask.priority,
          project_name: Newtask.projects.name,
          due_date: Newtask.due_date,
          subscribers_name: Newtask.assignedByUser
            ? `${Newtask.assignedByUser?.first_name} ${Newtask.assignedByUser?.last_name}`
            : '' + Newtask.reportToUser
            ? `${Newtask.reportToUser?.first_name} ${Newtask.reportToUser?.last_name}`
            : '',
        };

        console.log('data', data);
        eventEmitterTask.default.emit('notify_add_task', data);
        return res.status(201).json(APIResponseFormat._ResDataCreated('Tasks', [Newtask]));
      }
    } catch (error) {
      console.log('error', error);
      next(error);
      FileService._deleteFile(BasePath.default.WORKSPACE_PATH, req.files['documents']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public updateTasks = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._taskDocumentStorage,
        fileFilter: MulterService._fileFilter,
      }).fields([{ name: 'documents', maxCount: 30 }]);
      const TaskId = Encryption._doDecrypt(req.headers.id as string);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }
          const { project_id, type, title, assignee, parent_task_id } = req.body;

          if (!project_id) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Please select a project.'));
          }

          if (parent_task_id && parent_task_id != 'null') {
            let task = await thisI.taskService._getTasksById({ id: parent_task_id });
            task = JSON.parse(JSON.stringify(task));
            if (task.project_id != project_id) {
              return res.status(409).send(APIResponseFormat._ResMessage(409, false, 'Perent task project and subtask project not match'));
            }
          }

          if (!type || !title || !assignee) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Task Type , Title Or Assignee'));
          }
          //check task exist or not
          let task = await thisI.taskService._getTasksById({ id: TaskId });
          task = JSON.parse(JSON.stringify(task));
          if(task.parent_task_id){
            let parent_task = await thisI.taskService._getTasksById({ id: task.parent_task_id });
            parent_task = JSON.parse(JSON.stringify(parent_task));
            task.parent_task=parent_task.title;
          }
          let is_team_member = await thisI.taskService._getProjectTeamById({ project_id: task.project_id, user_id: req.user.id });
          is_team_member = JSON.parse(JSON.stringify(is_team_member));
          if (!is_team_member) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
          }
          if (!task) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(409).json(APIResponseFormat._ResDataNotFound('task'));
          }

          // find required custom fields
          const costomeFields = await thisI.taskService._getAllCustomeFieldByProjectId(project_id);
          const requiredFieldsError = [];
          const customFieldArray = [];
          for (const field of JSON.parse(JSON.stringify(costomeFields))) {
            field.label.trim();
            const CustomFieldsArray = req.body.TaskCustomFieldValue ? JSON.parse(req.body.TaskCustomFieldValue) : [];
            const fieldT = CustomFieldsArray?.find((e) => e.TaskCustomFieldLabelData.trim() == field.label.trim());
            // console.log(fieldT, 'fieldT',JSON.parse(JSON.stringify(costomeFields)));
            
            if (field.is_required) {
              if (!fieldT || !fieldT.value || fieldT.value == undefined || fieldT.value == null || fieldT.value === '') {
                requiredFieldsError.push(field.label);
              } else {
                if (fieldT.id) {
                  if(field.type==='dropdown'||field.type==='radio-btn'){
                    customFieldArray.push({
                      id: fieldT.id,
                      task_custom_field_id: field.id,
                      task_id: fieldT.task_id,
                      value: fieldT.value,
                      updated_by: Number(req.user.id),
                      type: field.type,
                      options: field.options,
                      select_value: field.options.find((e)=>e.id===fieldT.value)?.value||''
                    });
                  }else{
                  customFieldArray.push({
                    id: fieldT.id,
                    task_custom_field_id: field.id,
                    task_id: fieldT.task_id,
                    value: fieldT.value,
                    updated_by: Number(req.user.id),
                    type: field.type,
                  });
                }
                } else {
                  if(field.type==='dropdown'||field.type==='radio-btn'){
                    customFieldArray.push({
                      id: fieldT.id,
                      task_custom_field_id: field.id,
                      task_id: fieldT.task_id,
                      value: fieldT.value,
                      updated_by: Number(req.user.id),
                      type: field.type,
                      options: field.options,
                      select_value: field.options.find((e)=>e.id===fieldT.value)?.value||''
                    });
                  }else{
                  customFieldArray.push({
                    task_custom_field_id: field.id,
                    task_id: fieldT.task_id,
                    value: fieldT.value,
                    created_by: Number(req.user.id),
                    updated_by: Number(req.user.id),
                  });
                }
                }
                // customFieldArray.push({...fieldT,updated_by:Number(req.user.id)});
              }
            } else {
              if (fieldT) {
                // if (!fieldT.value || fieldT.value == undefined || fieldT.value == null || fieldT.value === '') {
                //   //
                // } else {
                if (fieldT.id) {
                  if(field.type==='dropdown'||field.type==='radio-btn'){
                    customFieldArray.push({
                      id: fieldT.id,
                      task_custom_field_id: field.id,
                      task_id: fieldT.task_id,
                      value: fieldT.value,
                      updated_by: Number(req.user.id),
                      type: field.type,
                      options: field.options,
                      select_value: field.options.find((e)=>e.id===fieldT.value)?.value||''
                    });
                  }else{
                  customFieldArray.push({
                    id: fieldT.id,
                    task_custom_field_id: field.id,
                    task_id: fieldT.task_id,
                    value: fieldT.value,
                    updated_by: Number(req.user.id),
                  });
                }
                } else {
                  if(field.type==='dropdown'|| field.type==='radio-btn'){
                    customFieldArray.push({
                      id: fieldT.id,
                      task_custom_field_id: field.id,
                      task_id: fieldT.task_id,
                      value: fieldT.value,
                      updated_by: Number(req.user.id),
                      type: field.type,
                      options: field.options,
                      select_value: field.options.find((e)=>e.id===fieldT.value)?.value||''
                    });
                  }else{
                  customFieldArray.push({
                    task_custom_field_id: field.id,
                    task_id: fieldT.task_id,
                    value: fieldT.value,
                    created_by: Number(req.user.id),
                    updated_by: Number(req.user.id),
                  });
                }
                }
                // customFieldArray.push({...fieldT,updated_by:Number(req.user.id)});
                // }
              }
            }
          }

          // validate required custom fields
          if (requiredFieldsError.length > 0 && req.headers.islist != 'true') {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(409).send(APIResponseFormat._ResMissingRequiredField(requiredFieldsError.join(',')));
          }

          //Store Labels
          const tasks_labels_array = req.body.labels ? JSON.parse(req.body.labels) : [];
          const labels = await Promise.all(
            tasks_labels_array.map((label) => {
              const newlabel = thisI.taskService._findOrCreateLabel(label);
              return newlabel;
            })
          );

          // remove documents from existing which are in deleted document array
          const newDocuments =
            task.documents && req.body.deletedDocuments
              ? JSON.parse(JSON.stringify(task.documents)).filter((el) => !JSON.parse(JSON.stringify(req.body.deletedDocuments)).includes(el))
              : JSON.parse(JSON.stringify(task.documents)) || [];

          if (req.files?.['documents']?.length) {
            req.files['documents'].forEach((el) => newDocuments.push(`uploads/taskDocuments/${el.filename}`));
          }
          let task_details = {
            ...req.body,
            subscribers: req.body.subscribers ? JSON.parse(req.body.subscribers) : [],
            parent_task_id: req.body.parent_task_id || null,
            project_id: Number(project_id),
            labels: labels,
            documents: newDocuments,
            updated_by: Number(req.user.id),
          };
          if ((!task.reporter || task.reporter == null) && req.body.reporter) {
            const ProjectDetails = await thisI.taskService._getProjectData({ id: project_id });
            task_details = { ...task_details, reporter: ProjectDetails.responsible_person };
            if (project_id !== task.project_id) {
              task_details = { ...task_details, task_key_prefix: ProjectDetails.project_key };
              eventEmitterTask.default.emit('sub_task_project_change', { ...task_details, taskId: TaskId });
              eventEmitterTask.default.emit('change_biling_houres', { new_project_id:project_id, old_project_id:task.project_id,taskId: TaskId });
            }
          } else if (project_id !== task.project_id) {
            const ProjectDetails = await thisI.taskService._getProjectData({ id: project_id });
            task_details = { ...task_details, task_key_prefix: ProjectDetails.project_key };
            eventEmitterTask.default.emit('sub_task_project_change', { ...task_details, taskId: TaskId });
            eventEmitterTask.default.emit('change_biling_houres', { new_project_id:project_id, old_project_id:task.project_id,taskId: TaskId });
          }
          if (task.state.toLowerCase() === 'completed' && req.body.state.toLowerCase() != 'completed') {
            const user_id = req.body.assignee || task.assignee;
            let is_team_member = await thisI.taskService._getProjectTeamById({ project_id: project_id, user_id: user_id });
            is_team_member = JSON.parse(JSON.stringify(is_team_member));
            if (!is_team_member) {
              task_details = { ...task_details, assignee: null };
            }
            const report_to = req.body.reporter || task.reporter;
            let is_team_member_reporter = await thisI.taskService._getProjectTeamById({ project_id: project_id, user_id: report_to });
            is_team_member_reporter = JSON.parse(JSON.stringify(is_team_member_reporter));
            if (!is_team_member_reporter) {
              task_details = { ...task_details, reporter: null };
            }
            const assigned_by = req.body.assigned_by || task.assigned_by;
            let is_team_member_assigned_by = await thisI.taskService._getProjectTeamById({ project_id: project_id, user_id: assigned_by });
            is_team_member_assigned_by = JSON.parse(JSON.stringify(is_team_member_assigned_by));
            if (!is_team_member_assigned_by) {
              task_details = { ...task_details, assigned_by: null };
            }
          }
          if (task.state?.toLowerCase() !== 'completed' && req.body.state?.toLowerCase() === 'completed') {
            task_details = { ...task_details, assignee: task.reporter, assigned_by: task.assignee };
          }
          Object.keys(task_details).forEach((key) => {
            if (task_details[key] === 'null') {
              task_details[key] = null;
            }
          });
          const Update_Task = await thisI.taskService._updateTasks(task_details, { id: TaskId });

          // if req.body.state = completed then update all subtasks state by completed
          // get all sub task by taskId

          // if(req.body.state.toLowerCase() == 'completed'){
          //   const Subtasks = await thisI.taskService._getAllTaskByParentId({ parent_task_id: TaskId })
          //   Subtasks.forEach(async (el) => {
          //     await thisI.taskService._updateTasks({ state: 'completed',status: req.body.status ? Number(req.body.status) : null, updated_by: req.user.id }, { id: el.id });
          //   })
          // }

          if (req.body.state?.toLowerCase() == 'completed') {
            const Subtasks = await thisI.taskService._getAllTaskByParentId({ parent_task_id: TaskId });
            Subtasks.forEach(async (el) => {
              if (task.state?.toLowerCase() !== 'completed') {
                await thisI.taskService._updateTasks(
                  {
                    state: 'completed',
                    assignee: el.reporter,
                    assigned_by: el.assignee,
                    status: req.body.status ? Number(req.body.status) : null,
                    updated_by: req.user.id,
                  },
                  { id: el.id }
                );
              } else {
                await thisI.taskService._updateTasks(
                  { state: 'completed', status: req.body.status ? Number(req.body.status) : null, updated_by: req.user.id },
                  { id: el.id }
                );
              }
            });
          }

          if (!Update_Task) {
            FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
            return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Tasks'));
          } else if (Update_Task) {
            //custom field value added
            if (customFieldArray.length > 0) {
              await thisI.taskService._createTasksFields(customFieldArray);
            }

            //check updated field
            const deference = await thisI.taskService._compareObjects(
              {
                ...task,
                start_date: task.start_date ? thisI.taskService._convertToDDMMYYYYNew(task.start_date) : null,
                due_date: task.due_date ? thisI.taskService._convertToDDMMYYYYNew(task.due_date) : null,
              },
              {
                ...task_details,
                parent_task: task_details.parent_task_title,
                id: task.id,
                TaskCustomFieldValue: customFieldArray,
                start_date: task_details.start_date
                  ? thisI.taskService._convertToDDMMYYYYNew(task_details.start_date)
                  : task.start_date
                  ? thisI.taskService._convertToDDMMYYYYNew(task.start_date)
                  : null,
                due_date: task_details.due_date
                  ? thisI.taskService._convertToDDMMYYYYNew(task_details.due_date)
                  : task.due_date
                  ? thisI.taskService._convertToDDMMYYYYNew(task.due_date)
                  : null,
                task_key: task.task_key,
                running_status: task.running_status,
                created_by: task.created_by,
              }
            );

            const logBody = {
              user_id: req.user.id,
              user_name: `${req.user.first_name} ${req.user.last_name}`,
              user_profile: req.user.user_image,
              task_id: TaskId,
              action: 'Task updated',
              updated_values: deference,
              // action:req.body.state==='completed'?`Task updated ${deference.join(',')} and task has completed`:`Task updated ${deference.join(',')}`,
            };

            console.log(deference, 'Darshit');

            //task update log added
            await thisI.taskChangeLogService._create(logBody);

            // //task timer stop
            // if (req.body.state === 'completed') {
            //   await thisI.taskTimeLogsService._update({ task_id: TaskId, end_time: null }, { end_time: Date.now() });
            //   await thisI.taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: req.user.id, task_id: TaskId });
            //   const ongoing = await thisI.taskService._getTaskStatus({ task_id: TaskId, running_status: 'Ongoing' });
            //   const data = await thisI.taskTimeLogsService._getTaskHistoryData({ task_id: TaskId });
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
            //   if (ongoing.length <= 0) {
            //     await thisI.taskService._updateTasks(
            //       {
            //         running_status: 'Stop',
            //         total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            //           .toString()
            //           .padStart(2, '0')}`,
            //       },
            //       { id: TaskId }
            //     );
            //   } else {
            //     await thisI.taskService._updateTasks(
            //       {
            //         total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            //           .toString()
            //           .padStart(2, '0')}`,
            //       },
            //       { id: TaskId }
            //     );
            //   }
            // }

            let newTask = await thisI.taskService._getTasksById({ id: TaskId });
            newTask = JSON.parse(JSON.stringify(newTask));
            // console.log(newTask.assigneeUser , "assigneeUser")
            const subscribers_array = req.body.subscribers ? JSON.parse(req.body.subscribers) : [];
            const subscribers_array_string = subscribers_array.map((el) => el.toString());

            const commonEventData = {
              task_id: TaskId,
              assigned_to: [assignee],
              subscribers: subscribers_array_string,
              reporting_person: [req.body.reporter],
              task_title: title,
              projectId: project_id ? project_id : null,
              action_by: req.user.first_name + ' ' + req.user.last_name,
              action_by_profile: req.user.user_image,
              assigned_to_name: newTask.assigneeUser ? newTask.assigneeUser?.first_name + ' ' + newTask.assigneeUser?.last_name : '',
              assigned_by_name: newTask.assignedByUser ? newTask.assignedByUser?.first_name + ' ' + newTask.assignedByUser?.last_name : '',
              priority: newTask.priority,
              project_name: newTask.projects.name,
              due_date: newTask.due_date,
              subscribers_name: newTask.assignedByUser
                ? `${newTask.assignedByUser?.first_name} ${newTask.assignedByUser?.last_name}`
                : '' + newTask.reportToUser
                ? `${newTask.reportToUser?.first_name} ${newTask.reportToUser?.last_name}`
                : '',
            };

            const stateChange = await thisI.taskService._checkKeyExists(deference, 'state');
            console.log('stateChange', stateChange);
            if (stateChange) {
              const data = {
                ...commonEventData,
                new_task_status: thisI.taskService._formatStatus(req.body.state),
              };
              // eventEmitterTask.default.emit('notify_change_task_status', data);
            }

            const subscriberChange = await thisI.taskService._checkKeyExists(deference, 'subscribers');
            console.log('subscriber change', JSON.parse(JSON.stringify(subscriberChange)));
            if (subscriberChange) {
              const data = {
                ...commonEventData,
              };
              eventEmitterTask.default.emit('notify_subscriber_added', data);
            }

            const statusChange = await thisI.taskService._checkKeyExists(deference, 'status');
            console.log('statusChange', statusChange);
            if (statusChange) {
              const status = await thisI.taskService._getProjectStatusData({ id: req.body.status });
              const data = {
                ...commonEventData,
                new_task_state: status.title,
              };
              eventEmitterTask.default.emit('notify_change_task_state', data);
            }
            const dueDateChange = await thisI.taskService._checkKeyExists(deference, 'due_date');
            console.log('dueDateChange', dueDateChange);
            if (dueDateChange) {
              const data = {
                ...commonEventData,
                // new_due_date: thisI.taskService._convertToYYYYMMDD(task_details.due_date),
                new_due_date: moment(task_details.due_date).format('DD/MM/YYYY'),
              };
              eventEmitterTask.default.emit('notify_due_date_changed', data);
            }
            const assigneeChange = await thisI.taskService._checkKeyExists(deference, 'assignee');
            console.log('assigneeChange', assigneeChange);
            if (assigneeChange) {
              const data = {
                ...commonEventData,
                new_assignee: newTask.assigneeUser ? newTask.assigneeUser?.first_name + ' ' + newTask.assigneeUser?.last_name : '',
              };
              if (data.new_assignee) {
                eventEmitterTask.default.emit('notify_assignee_changed', data);
              }
            }

            //task timer stop
            if (stateChange || statusChange) {
              const timer = await thisI.taskTimeLogsService._getSingleData({ task_id: TaskId, end_time: null });
              const update = await thisI.taskTimeLogsService._update({ task_id: TaskId, end_time: null }, { end_time: Date.now() });
              console.log('timer', timer);

              if (timer) {
                const logBody = {
                  user_id: req.user.id,
                  user_name: `${req.user.first_name} ${req.user.last_name}`,
                  user_profile: req.user.user_image,
                  end_time: Date.now(),
                  task_id: TaskId,
                  action: 'Timer Stop',
                };
                await thisI.taskChangeLogService._create(logBody);
              }
              await thisI.taskService._updateTaskStatus({ running_status: 'Stop' }, { task_id: TaskId });
              const ongoing = await thisI.taskService._getTaskStatus({ task_id: TaskId, running_status: 'Ongoing' });
              const data = await thisI.taskTimeLogsService._getTaskHistoryData({ task_id: TaskId });
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
              if (ongoing.length <= 0) {
                await thisI.taskService._updateTasks(
                  {
                    running_status: 'Stop',
                    total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
                      .toString()
                      .padStart(2, '0')}`,
                  },
                  { id: TaskId }
                );
              } else {
                await thisI.taskService._updateTasks(
                  {
                    total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
                      .toString()
                      .padStart(2, '0')}`,
                  },
                  { id: TaskId }
                );
              }
              // const logBody = {
              //   user_id: req.user.id,
              //   user_name: `${req.user.first_name} ${req.user.last_name}`,
              //   user_profile: req.user.user_image,
              //   task_id: TaskId,
              //   action: 'Timer Stop',
              //   };
              //   await thisI.taskChangeLogService._create(logBody);
            }
            return res.status(201).json(APIResponseFormat._ResDataUpdated('Tasks'));
          }
        } catch (error) {
          console.log('error', error);
          FileService._deleteFile(BasePath.default.TASK_DOCUMENT_PATH, req.files['documents']);
          next(error);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
        }
      });
      // return res.status(200).json(APIResponseFormat._ResDataUpdated('Task'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public updateMultipleTasks = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      if (req.body.taskIds.length > 0) {
        for (const TaskId of req.body.taskIds) {
          let task = await this.taskService._getTasksById({ id: TaskId });
          task = JSON.parse(JSON.stringify(task));
          //Store Labels

          let task_details = {
            ...req.body,
            updated_by: Number(req.user.id),
          };
          if (req.body.labels) {
            const tasks_labels_array = req.body.labels ? JSON.parse(req.body.labels) : [];
            let labels = await Promise.all(
              tasks_labels_array.map((label) => {
                const newlabel = this.taskService._findOrCreateLabel(label);
                return newlabel;
              })
            );
            if (task.labels.length > 0) {
              labels = [...task.labels, ...labels];
              labels = [...new Set(labels)];
            }
            task_details = { ...task_details, labels: labels };
          }
          if (req.body.state&&!req.body.status) {
            let status = await this.taskService._getProjectStatusData({ state: req.body.state.toLowerCase(), project_id: task.project_id });
            status = JSON.parse(JSON.stringify(status));
            task_details = { ...task_details, status: status.id };
          }
          if (task.state?.toLowerCase() === 'completed' && req.body.state?.toLowerCase() != 'completed') {
            const user_id = req.body.assignee || task.assignee;
            let is_team_member = await this.taskService._getProjectTeamById({ project_id: task.project_id, user_id: user_id });
            is_team_member = JSON.parse(JSON.stringify(is_team_member));
            if (!is_team_member) {
              task_details = { ...task_details, assignee: null };
            }
            const report_to = req.body.reporter || task.reporter;
            let is_team_member_reporter = await this.taskService._getProjectTeamById({ project_id: task.project_id, user_id: report_to });
            is_team_member_reporter = JSON.parse(JSON.stringify(is_team_member_reporter));
            if (!is_team_member_reporter) {
              task_details = { ...task_details, reporter: null };
            }
            const assigned_by = req.body.assigned_by || task.assigned_by;
            let is_team_member_assigned_by = await this.taskService._getProjectTeamById({ project_id: task.project_id, user_id: assigned_by });
            is_team_member_assigned_by = JSON.parse(JSON.stringify(is_team_member_assigned_by));
            if (!is_team_member_assigned_by) {
              task_details = { ...task_details, assigned_by: null };
            }
          }
          if (task.state?.toLowerCase() !== 'completed' && req.body.state?.toLowerCase() === 'completed') {
            task_details = { ...task_details, assignee: task.reporter, assigned_by: task.assignee };
          }
          Object.keys(task_details).forEach((key) => {
            if (task_details[key] === 'null') {
              task_details[key] = null;
            }
          });
          const Update_Task = await this.taskService._updateTasks(task_details, { id: TaskId });

          // if req.body.state = completed then update all subtasks state by completed
          // get all sub task by taskId

          if (req.body.state?.toLowerCase() == 'completed') {
            const Subtasks = await this.taskService._getAllTaskByParentId({ parent_task_id: TaskId });
            Subtasks.forEach(async (el) => {
              if (task.state?.toLowerCase() !== 'completed') {
                await this.taskService._updateTasks(
                  {
                    state: 'completed',
                    assignee: el.reporter,
                    assigned_by: el.assignee,
                    status: req.body.status ? Number(req.body.status) : null,
                    updated_by: req.user.id,
                  },
                  { id: el.id }
                );
              } else {
                await this.taskService._updateTasks(
                  { state: 'completed', status: req.body.status ? Number(req.body.status) : null, updated_by: req.user.id },
                  { id: el.id }
                );
              }
            });
          }

          if (!Update_Task) {
            return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Tasks'));
          } else if (Update_Task) {
            //check updated field
            const deference = await this.taskService._compareObjects(
              {
                ...task,
                start_date: task.start_date ? this.taskService._convertToDDMMYYYYNew(task.start_date) : null,
                due_date: task.due_date ? this.taskService._convertToDDMMYYYYNew(task.due_date) : null,
              },
              {
                ...task_details,
                id: task.id,
                start_date: task_details.start_date
                  ? this.taskService._convertToDDMMYYYYNew(task_details.start_date)
                  : task.start_date
                  ? this.taskService._convertToDDMMYYYYNew(task.start_date)
                  : null,
                due_date: task_details.due_date
                  ? this.taskService._convertToDDMMYYYYNew(task_details.due_date)
                  : task.due_date
                  ? this.taskService._convertToDDMMYYYYNew(task.due_date)
                  : null,
                task_key: task.task_key,
                running_status: task.running_status,
                created_by: task.created_by,
              }
            );

            const logBody = {
              user_id: req.user.id,
              user_name: `${req.user.first_name} ${req.user.last_name}`,
              user_profile: req.user.user_image,
              task_id: TaskId,
              action: 'Task updated',
              updated_values: deference,
              // action:req.body.state==='completed'?`Task updated ${deference.join(',')} and task has completed`:`Task updated ${deference.join(',')}`,
            };
            //task update log added
            await this.taskChangeLogService._create(logBody);

            // //task timer stop
            // if (req.body.state === 'completed') {
            //   await thisI.taskTimeLogsService._update({ task_id: TaskId, end_time: null }, { end_time: Date.now() });
            //   await thisI.taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: req.user.id, task_id: TaskId });
            //   const ongoing = await thisI.taskService._getTaskStatus({ task_id: TaskId, running_status: 'Ongoing' });
            //   const data = await thisI.taskTimeLogsService._getTaskHistoryData({ task_id: TaskId });
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
            //   if (ongoing.length <= 0) {
            //     await thisI.taskService._updateTasks(
            //       {
            //         running_status: 'Stop',
            //         total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            //           .toString()
            //           .padStart(2, '0')}`,
            //       },
            //       { id: TaskId }
            //     );
            //   } else {
            //     await thisI.taskService._updateTasks(
            //       {
            //         total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            //           .toString()
            //           .padStart(2, '0')}`,
            //       },
            //       { id: TaskId }
            //     );
            //   }
            // }

            let newTask = await this.taskService._getTasksById({ id: TaskId });
            newTask = JSON.parse(JSON.stringify(newTask));
            // console.log(newTask.assigneeUser , "assigneeUser")
            const subscribers_array = req.body.subscribers ? JSON.parse(req.body.subscribers) : [];
            const subscribers_array_string = subscribers_array.map((el) => el.toString());

            const commonEventData = {
              task_id: TaskId,
              assigned_to: [newTask.assignee],
              subscribers: subscribers_array_string,
              reporting_person: [newTask.reporter],
              task_title: newTask.title,
              projectId: newTask.project_id ? newTask.project_id : null,
              action_by: req.user.first_name + ' ' + req.user.last_name,
              action_by_profile: req.user.user_image,
              assigned_to_name: newTask.assigneeUser ? newTask.assigneeUser?.first_name + ' ' + newTask.assigneeUser?.last_name : '',
              assigned_by_name: newTask.assignedByUser ? newTask.assignedByUser?.first_name + ' ' + newTask.assignedByUser?.last_name : '',
              priority: newTask.priority,
              project_name: newTask.projects.name,
              due_date: newTask.due_date,
              subscribers_name: newTask.assignedByUser
                ? `${newTask.assignedByUser?.first_name} ${newTask.assignedByUser?.last_name}`
                : '' + newTask.reportToUser
                ? `${newTask.reportToUser?.first_name} ${newTask.reportToUser?.last_name}`
                : '',
            };

            const stateChange = await this.taskService._checkKeyExists(deference, 'state');
            console.log('deference', deference);
            console.log('stateChange', stateChange);
            if (stateChange) {
              const data = {
                ...commonEventData,
                new_task_status: this.taskService._formatStatus(req.body.state),
              };
              // eventEmitterTask.default.emit('notify_change_task_status', data);
            }

            const statusChange = await this.taskService._checkKeyExists(deference, 'status');
            console.log('statusChange', statusChange);
            if (statusChange) {
              const status = await this.taskService._getProjectStatusData({ id: task_details.status });
              const data = {
                ...commonEventData,
                new_task_state: status.title,
              };
              eventEmitterTask.default.emit('notify_change_task_state', data);
            }
            const dueDateChange = await this.taskService._checkKeyExists(deference, 'due_date');
            console.log('dueDateChange', dueDateChange);
            if (dueDateChange) {
              const data = {
                ...commonEventData,
                // new_due_date: thisI.taskService._convertToYYYYMMDD(task_details.due_date),
                new_due_date: moment(task_details.due_date).format('DD/MM/YYYY'),
              };
              eventEmitterTask.default.emit('notify_due_date_changed', data);
            }

            const assigneeChange = await this.taskService._checkKeyExists(deference, 'assignee');
            console.log('assigneeChange', assigneeChange);
            if (assigneeChange) {
              const data = {
                ...commonEventData,
                new_assignee: newTask.assigneeUser ? newTask.assigneeUser?.first_name + ' ' + newTask.assigneeUser?.last_name : '',
              };
              if (data.new_assignee) {
                eventEmitterTask.default.emit('notify_assignee_changed', data);
              }
            }

            //task timer stop
            if (stateChange || statusChange) {
              const timer = await this.taskTimeLogsService._getSingleData({ task_id: TaskId, end_time: null });
              const update = await this.taskTimeLogsService._update({ task_id: TaskId, end_time: null }, { end_time: Date.now() });
              if (timer) {
                const logBody = {
                  user_id: req.user.id,
                  user_name: `${req.user.first_name} ${req.user.last_name}`,
                  user_profile: req.user.user_image,
                  end_time: Date.now(),
                  task_id: TaskId,
                  action: 'Timer Stop',
                };
                await this.taskChangeLogService._create(logBody);
              }
              await this.taskService._updateTaskStatus({ running_status: 'Stop' }, { task_id: TaskId });
              const ongoing = await this.taskService._getTaskStatus({ task_id: TaskId, running_status: 'Ongoing' });
              const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: TaskId });
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
              if (ongoing.length <= 0) {
                await this.taskService._updateTasks(
                  {
                    running_status: 'Stop',
                    total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
                      .toString()
                      .padStart(2, '0')}`,
                  },
                  { id: TaskId }
                );
              } else {
                await this.taskService._updateTasks(
                  {
                    total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
                      .toString()
                      .padStart(2, '0')}`,
                  },
                  { id: TaskId }
                );
              }
              // const logBody = {
              //   user_id: req.user.id,
              //   user_name: `${req.user.first_name} ${req.user.last_name}`,
              //   user_profile: req.user.user_image,
              //   task_id: TaskId,
              //   action: 'Timer Stop',
              // };
              // await this.taskChangeLogService._create(logBody);
            }
          }
        }
        return res.status(201).json(APIResponseFormat._ResDataUpdated('Tasks'));
      }
      // return res.status(200).json(APIResponseFormat._ResDataUpdated('Task'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public deleteTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const id = req.headers.id;
      // const TaskId = Encryption._doDecrypt(req.headers.id as string);

      // if (!id) {
      //   return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Holiday Id'));
      // }

      // const data = await this.Holiday._delete({ id });

      // if (!data) {
      //   return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Holiday'));
      // }

      return res.status(200).json(APIResponseFormat._ResDataDeleted('Task'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public SetPriorityForTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const id = req.headers.id;
      const TaskId = Encryption._doDecrypt(req.headers.id as string);
      const priority = req.headers.priority == 'null' ? null : req.headers.priority;
      if (!TaskId) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Tasks'));
      }
      let task = await this.taskService._updateTasks({ priority: priority }, { id: TaskId });

      return res.status(201).json(APIResponseFormat._ResDataUpdated('Tasks'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getTasksList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const {
        project_ids,
        filter_by_section,
        filter_by_labels,
        filter_by_status,
        filter_by_state,
        user_ids,
        search,
        filter_by_from_date,
        filter_by_to_date,
        group_by,
        is_completed,
        is_unassigned,
        full_status,
        full_section,
        full_assignee,
        full_assigned_by,
        full_reporter,
        full_labels,
        full_subscribers,
        group_limit,
        limit,
        sort_by,
        order_by,
        dynamic_filter,
      } = req.body;

      // if(!dynamic_filter){
      //   dynamic_filter = [];
      // }

  
      const result: iTasksObj[] = (await this.taskService._getTasksList(
        req.user.id,
        project_ids,
        filter_by_section,
        filter_by_labels,
        filter_by_status,
        filter_by_state,
        is_completed,
        is_unassigned,
        search,
        user_ids,
        filter_by_from_date,
        filter_by_to_date,
        group_by,
        full_status,
        full_section,
        full_assignee,
        full_assigned_by,
        full_reporter,
        full_labels,
        full_subscribers,
        group_limit || 3,
        limit,
        sort_by,
        order_by,
        dynamic_filter || [],
      )) as iTasksObj[];
      let groupedData = {};
      if (group_by && group_by !== '') {
        // console.log(result,"P_D");

        groupedData = result.reduce((result, item) => {
          const group = item['group_by'];
          if (!result[group]) {
            result[group] = {
              data: [],
              total_task: 0,
            };
          }
          // result[group].push(item);
          result[group].data.push(item);
          result[group].total_task = item.total_task;

          return result;
        }, {});
        // console.log(groupedData,"PD");

        // Sort the data arrays for each group based on running_status
        // for (const group in groupedData) {
        //   if (Object.prototype.hasOwnProperty.call(groupedData, group)) {
        //     groupedData[group].data.sort((a, b) => {
        //       const statusOrder = {
        //         'Ongoing': 1,
        //         'Stop': 3,
        //         'Not Started Yet': 2,
        //       };

        //       return statusOrder[a.running_status] - statusOrder[b.running_status];
        //     });
        //   }
        // }
      } else {
        // result.sort((a, b) => {
        //   const statusOrder = {
        //     'Ongoing': 1,
        //     'Stop': 2,
        //     'Not Started Yet': 3,
        //   };

        //   return statusOrder[a.running_status] - statusOrder[b.running_status];
        // });
        groupedData = { list: result, total_task: result.length > 0 ? result[0].total_task_all : 0 };
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(groupedData));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getProjectTaskSection = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const projectId = Number(Encryption._doDecrypt(req.headers.id as string));
      const Get_Sections = await this.taskService._getTaskSection({ project_id: projectId });

      if (!Get_Sections) {
        return res.status(500).json(APIResponseFormat._ResDataNotFound('Project Task Section'));
      }
      return res.status(201).json(APIResponseFormat._ResDataFound(Get_Sections));
    } catch (error) {
      console.log('error', error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public createProjectTaskSection = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const { project_id, title } = req.body;
      if (!project_id || !title) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('project_id , Title'));
      }
      const section_details = {
        project_id: project_id,
        title: title,
        created_by: req.user.id,
        updated_by: req.user.id,
      };
      const Create_Section = await this.taskService._createTaskSection(section_details);

      if (!Create_Section) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Project Task Section'));
      }
      return res.status(201).json(APIResponseFormat._ResDataCreated('Project Task Section', Create_Section));
    } catch (error) {
      console.log('error', error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public updateProjectTaskSection = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      // const id = req.headers.id;
      const id = Encryption._doDecrypt(req.headers.id as string);
      // const { project_id,title} = req.body;
      if (!id) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('id'));
      }
      const section_details = {
        ...req.body,
        updated_by: req.user.id,
      };
      const Update_Section = await this.taskService._updateTaskSection(section_details, { id: id });

      if (!Update_Section) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Project Task Section'));
      }
      return res.status(201).json(APIResponseFormat._ResDataUpdated('Project Task Section'));
    } catch (error) {
      console.log('error', error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public deleteProjectTaskSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const id = req.headers.id;
      const id = Encryption._doDecrypt(req.headers.id as string);
      // const { project_id,title} = req.body;
      if (!id) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('id'));
      }
      const Update_Section = await this.taskService._deleteTaskSection({ id: id });

      if (!Update_Section) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Project Task Section'));
      }
      return res.status(201).json(APIResponseFormat._ResDataDeleted('Project Task Section'));
    } catch (error) {
      console.log('error', error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public changeLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortby, orderby } = req.headers;
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      // console.log(task_id, '00K');

      const count = await this.taskService._ChangeLogCount({ task_id: task_id });
      // count = count[0]?.count || 0;
      // // if (!year) {
      // //   return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Year'));
      // // }
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.taskService._getAllChangeLog(+page, +limit, sortby as string, orderby as string, { task_id: Number(task_id) });
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getDashboardTaskList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;
      const user = req.user;
      const state = req.body.state;
      const project_ids = req.body.project_ids;
      const group_limit = req.body.group_limit || 11;
      const assigneeIds = req.body?.assigneeIds;
      const is_assigned_by=req.body?.is_assigned_by||false;
      const tasksData: any = await this.taskService._getDashboardTaskList({ user, user_id, state, project_ids, group_limit, assigneeIds,is_assigned_by });

      const getAllAssignee = [... new Set(tasksData?.map((item) => item?.assignee))] ;

      const preprocessTasksData = (data) => {
        // Create an object to store tasks grouped by assignee
        const tasksByUser = {};
        // Loop through the tasks data
        data.forEach((task) => {
          const assignee_id = task[is_assigned_by?'assigned_by':'assignee'];
          const firstName = `${task.assignee_first_name} `;
          const lastName = `${task.assignee_last_name}`;
          const workingUser = {
            id: task.working_user_id,
            user_id: task.working_user_id,
            avatar: task.working_user_avatar,
            last_name: task.working_user_last_name,
            first_name: task.working_user_first_name,
            updated_at: task.working_user_updated_at,
            running_status: task.working_user_running_status,
          };

          // Check if the project_id of the task is included in project_ids
          // Check if the user is already in the tasksByUser object
          if (!tasksByUser[assignee_id]) {
            // If not, create an entry for the user
            tasksByUser[assignee_id] = {
              assignee_id,
              firstName,
              lastName,
              tasks: [],
            };
          }

          const taskObject = {
            task_id: task.id,
            assignee: task[is_assigned_by?'assigned_by':'assignee'],
            parent_task_id: task.parent_task_id,
            project_id: task.project_id,
            project_name: task.project_name,
            type: task.type,
            title: task.title,
            description: task.description,
            state: task.state,
            status: task.status,
            assigned_by: task.assigned_by,
            reporter: task.reporter,
            start_date: task.start_date,
            due_date: task.due_date,
            priority: task.priority,
            running_status: task.running_status,
            eta: task.eta,
            created_by: task.created_by,
            updated_by: task.updated_by,
            subscribers: task.subscribers,
            documents: task.documents,
            section: task.section,
            task_key_prefix: task.task_key_prefix,
            task_unique_key: task.task_unique_key,
            task_key: task.task_key,
            total_worked_hours: task.total_worked_hours,
            row_num: task.row_num,
            created_at: task.created_at,
            updated_at: task.updated_at,
            deleted_at: task.deleted_at,
            labels: task.labels,
            working_users: [], // Initialize an empty array for working users
          };

          const existsTask = tasksByUser[assignee_id]?.tasks?.find((task: any) => task.task_id === taskObject.task_id);

          if (existsTask && workingUser.id ) {
            existsTask.working_users.push(workingUser);
          } else {
            if (workingUser.id ) {
              taskObject.working_users.push(workingUser);
            }
            const checkTaskExistOrNot = tasksByUser[assignee_id]?.tasks.find((task: any) => task.task_id === taskObject.task_id);
            if(!checkTaskExistOrNot){
              tasksByUser[assignee_id]?.tasks?.push(taskObject);
            }
          }
          if(assigneeIds?.includes(workingUser.id)&&workingUser.running_status=='Ongoing'){
            const checkAssigneeExistOrNot = tasksByUser[workingUser.id]?.tasks;
            if(checkAssigneeExistOrNot){
              const checkTaskExistOrNot = tasksByUser[workingUser.id]?.tasks.find((task: any) => task.task_id === taskObject.task_id);
              if(!checkTaskExistOrNot){
                tasksByUser[workingUser.id]?.tasks?.push(taskObject);
              }
            }else{
              tasksByUser[workingUser.id] = {
                assignee_id:workingUser.id,
                firstName:workingUser.first_name,
                lastName:workingUser.last_name,
                tasks: [],
              };
              tasksByUser[workingUser.id]?.tasks?.push(taskObject);
            }
          }
          // if(getAllAssignee?.includes(workingUser.id)){
          //   const existingWorkingUserTask = tasksByUser[workingUser.id]?.tasks.find((task: any) => task.task_id === taskObject.task_id);
          //   if(!existingWorkingUserTask){
          //     // Create a new entry for the working user's tasks
          //     if (!tasksByUser[workingUser.id]) {
          //       tasksByUser[workingUser.id] = {
          //         assignee_id: workingUser.id,
          //         firstName: workingUser.first_name,
          //         lastName: workingUser.last_name,
          //         tasks: [],
          //       };
          //     }
          //     tasksByUser[workingUser.id].tasks.push(taskObject);
          //   }
          // }
        });
        // Convert the tasksByUser object to an array of user objects
        const usersArray = Object.values(tasksByUser);
        return usersArray;
      };

      const assignees : any = preprocessTasksData(tasksData);

      if (!assignees) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      if (assignees.length > 0) {
        for(let i=0; i<assignees.length; i++){
          const assigneesTasks = assignees[i]?.tasks;
          for(let j=0; j<assigneesTasks.length; j++){
             for(let k=i+1; k<assignees.length; k++){
                // compare the assigneeTask element id with other assignees tasks id
                const nextAssignee = assignees[k]?.tasks;
                for(let l=0; l<nextAssignee?.length; l++){
                  if(assigneesTasks[j]?.task_id === nextAssignee[l]?.task_id){
                    assigneesTasks[j].working_users = assigneesTasks[j]?.working_users.concat(nextAssignee[l]?.working_users);
                    // remove duplicate 
                    const workingUsersForAssignee = [...new Set(assigneesTasks[j].working_users)];
                    const workingUsersForNextAssignee = [...new Set(assigneesTasks[j].working_users)]
                    assigneesTasks[j].working_users = workingUsersForAssignee.filter((item : any) => item.id != assignees[i].assignee_id);
                    nextAssignee[l].working_users = workingUsersForNextAssignee.filter((item : any) => item.id != assignees[k].assignee_id);
                  }
                }
             }
          }

        }
      }

      assignees.sort(function(a, b) {
        const firstNameA = a.firstName.toUpperCase(); // ignore case
        const firstNameB = b.firstName.toUpperCase();
      
        if (firstNameA < firstNameB) {
          return -1;
        }
        if (firstNameA > firstNameB) {
          return 1;
        }

        // names must be equal
        return 0;
      });

      return res.status(200).json(APIResponseFormat._ResDataFound(assignees));
    } catch (error) {
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public assigneeDropDown = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const project_ids = req.body.project_ids;
      const user_id = req.user.id;
      const user = req.user;
      const data : any = await this.taskService._assigneeDropDown({project_ids , user_id, user});
      if (!data) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const newData = data.filter((item) => item.id != user_id);

      return res.status(200).json(APIResponseFormat._ResDataFound(newData));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  }

  public getAllSubTasks = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      const count = await this.taskService._count({ parent_task_id: task_id });
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.taskService._getAllTasks({ parent_task_id: task_id }, +page, +limit, sortBy as string, orderBy as string);
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getComolatedTasks = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;
      const visible_date: string = req.headers.visible_date as string;
      console.log(visible_date, 'visible_date');

      const count = await this.taskService._count({
        state: 'completed',
        updated_at: { [Op.gte]: new Date(visible_date.replace(' ', 'T')) },
        assignee: req.user.id,
      });
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, 0 as number);
      return res.status(200).json(APIResponseFormat._ResDataFound({ count }));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default TaskController;
