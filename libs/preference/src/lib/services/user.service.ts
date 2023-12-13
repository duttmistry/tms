import { FilterQuery, UpdateWithAggregationPipeline, UpdateQuery } from 'mongoose';
import { WhereOptions, Sequelize, Op } from 'sequelize';
import { iTaskRunningStatus, iTasks } from '../database/interface/task.interface';

import { iUser } from '../database/interface/user.interface';
import { iWorkspace, iWorkspaceTeamMember } from '../database/interface/workspace.interface';
import { iProject } from '../database/interface/projects.interface';
import { ITimeLogs } from '../database/interface/time_logs.interface';
import _DB from '../database/models';

const TimeLogs = _DB.TimeLogs;
const _tasksRunningStatus = _DB.TaskRunningStatus;
const _tasks = _DB.Tasks;
const user = _DB.User;
const project = _DB.Projects;
const projectTeam = _DB.ProjectTeam;
const projectDocument = _DB.ProjectDocument;
const workSpace = _DB.Workspace;
const workspaceTeam = _DB.WorkspaceTeam;

class UserService {
  public _getUserDataById = async (employeeCode: string) => {
    return new Promise<iUser>((resolve, reject) => {
      const userData = user
        .findOne({
          where: {
            employee_id: employeeCode,
          },
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(userData);
    });
  };

  public _getUserWorkspaces = async (userId: number) => {
    return new Promise<iWorkspace[]>((resolve, reject) => {
      const userData = workSpace
        .findAll({
          include: [
            {
              as: 'team',
              model: workspaceTeam,
              required: false,
            },
          ],
          where: {
            [Op.or]: [
              {
                '$team.user_id$': userId,
              },
              Sequelize.fn('JSON_CONTAINS', Sequelize.col('team.report_to'), Sequelize.cast(userId, 'CHAR CHARACTER SET utf8')),

              {
                responsible_person: userId,
              },
            ],
          },
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(userData);
    });
  };

  public _getUserProjects = async (userId: number) => {
    return new Promise<iProject[]>((resolve, reject) => {
      const userData = project
        .findAll({
          include: [
            {
              as: 'projectTeam',
              model: projectTeam,
            },
            {
              as: 'ProjectDocument',
              model: projectDocument,
            },
          ],
          where: {
            [Op.or]: [
              {
                '$projectTeam.user_id$': userId,
              },
              Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(userId, 'CHAR CHARACTER SET utf8')),
              {
                '$ProjectDocument.created_by$': userId,
              },
              Sequelize.fn('JSON_CONTAINS', Sequelize.col('ProjectDocument.authorized_users'), Sequelize.cast(userId, 'CHAR CHARACTER SET utf8')),
              {
                responsible_person: userId,
              },
            ],
          },
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(userData);
    });
  };

  public _getUsers = async (employeeCode: string) => {
    return new Promise<iUser[]>((resolve, reject) => {
      const userData = user
        .findAll({
          where: {
            [Op.or]: [
              {
                team_lead: employeeCode,
              },
              {
                project_manager: employeeCode,
              },
            ],
          },
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(userData);
    });
  };

  public _updateUsers = async (userData) => {
    return new Promise((resolve) => {
      const data = user.update(userData, { where: { id: userData.id } });
      resolve(data);
    });
  };

  public _updateWorkspaces = async (workspaceData) => {
    return new Promise((resolve) => {
      const data = workSpace.update(workspaceData, { where: { id: workspaceData.id } });
      resolve(data);
    });
  };

  public _updateWorkspaceTeam = async (workspaceTeamData: any) => {
    return new Promise((resolve) => {
      const data = workspaceTeam.bulkCreate(workspaceTeamData, { updateOnDuplicate: ['id', 'user_id', 'workspace_id', 'report_to'] });
      resolve(data);
    });
  };

  public _deleteWorkspaceTeam = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = workspaceTeam.destroy({
        where: query,
      });

      resolve(data);
    });
  };

  public _updateProjects = async (projectData) => {
    return new Promise((resolve) => {
      const data = project.update(projectData, { where: { id: projectData.id } });
      resolve(data);
    });
  };

  public _updateProjectTeam = async (projectTeamData: any) => {
    return new Promise((resolve) => {
      const data = projectTeam.bulkCreate(projectTeamData, { updateOnDuplicate: ['id', 'user_id', 'project_id', 'report_to'] });
      resolve(data);
    });
  };

  public _deleteProjectTeam = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = projectTeam.destroy({
        where: query,
      });

      resolve(data);
    });
  };

  public _updateProjectDocuments = async (projectDocumentData: any) => {
    return new Promise((resolve) => {
      const data = projectDocument.bulkCreate(projectDocumentData, {
        updateOnDuplicate: [
          'id',
          'workspace_id',
          'project_id',
          'doc_title',
          'doc_content',
          'doc_url',
          'authorized_users',
          'created_by',
          'last_edited_by',
        ],
      });
      resolve(data);
    });
  };

  // public _updateTaskTime = async (
  //   query: FilterQuery<ITimeLogs> | undefined,
  //   obj: UpdateWithAggregationPipeline | UpdateQuery<ITimeLogs> | undefined
  // ) => {
  //   return new Promise((resolve, reject) => {
  //     const data = TimeLogs.updateMany(query, obj);
  //     resolve(data);
  //   });
  // };
  // public _getTaskHistoryData = async (query) => {
  //   return new Promise<ITimeLogs[]>((resolve, reject) => {
  //     const data = TimeLogs.find(query);
  //     resolve(data);
  //   });
  // };

  // public _addTaskStatus = async (taskData) => {
  //   return new Promise<iTaskRunningStatus>((resolve) => {
  //     const data = _tasksRunningStatus
  //       .findOrCreate({
  //         where: {
  //           user_id: taskData.user_id,
  //           task_id: taskData.task_id,
  //         },
  //         defaults: {
  //           running_status: taskData.running_status,
  //         },
  //       })
  //       .then(([record, created]) => {
  //         if (!created) {
  //           // Update the existing record
  //           return record.update({ running_status: taskData.running_status });
  //         }
  //         return record;
  //       })
  //       .then((res) => {
  //         return JSON.parse(JSON.stringify(res));
  //       });

  //     resolve(data);
  //   });
  // };
  // public _updateTaskStatus = async (taskData, query) => {
  //   return new Promise((resolve) => {
  //     const data = _tasksRunningStatus.update(taskData, { where: query });
  //     resolve(data);
  //   });
  // };

  // public _getTaskStatus = async (query: WhereOptions) => {
  //   return new Promise<iTaskRunningStatus[]>((resolve) => {
  //     const data = _tasksRunningStatus
  //       .findAll({
  //         where: query,
  //       })
  //       .then((res) => {
  //         return JSON.parse(JSON.stringify(res));
  //       });
  //     resolve(data);
  //   });
  // };
  // public _updateTasks = async (taskData, query) => {
  //   return new Promise((resolve) => {
  //     const data = _tasks.update(taskData, { where: query });
  //     resolve(data);
  //   });
  // };
  // public _getTasks = async (query) => {
  //   return new Promise<iTasks[]>((resolve) => {
  //     const data = _tasks.findAll({ where: query });
  //     resolve(data);
  //   });
  // };
}

export default UserService;
