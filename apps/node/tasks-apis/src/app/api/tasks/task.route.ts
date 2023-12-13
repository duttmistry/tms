import TaskController from './controller/task.controller';
import TaskCommentController from './controller/task_comment.controller';
import TaskCommitController from './controller/task_commit.controller';
import TaskTimeLogsController from './controller/task_time_logs.controller';
import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class TaskRoute implements Routes {
  public router = Router();
  public controller = new TaskController();
  public taskCommentController = new TaskCommentController();
  public taskTimeLogsController = new TaskTimeLogsController();
  public taskCommitController = new TaskCommitController();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    
    // Task List Page APIs
    this.router.get(`/tasks/workspace`, auth.default, this.controller.getAllWorkspace);
    this.router.get(`/tasks`, auth.default, this.controller.getAllTasks);
    this.router.get(`/task/single`, auth.default, this.controller.getTaskById);
    this.router.get(`/task/subtask`, auth.default, this.controller.getAllSubTasks);
    this.router.get(`/tasks/project/team`, auth.default, this.controller.getProjectTeam);
    this.router.get(`/tasks/labels`, auth.default, this.controller.getTasksLabels);
    this.router.post(`/tasks/labels/byprojects`, auth.default, this.controller.getTasksLabelsByProjects);
    this.router.post(`/tasks/taskbyprojects`, auth.default, this.controller.getAllTasksByProjects);
    this.router.post(`/tasks/taskbyprojects/free`, auth.default, this.controller.getAllFreeTasksByProjects);
    this.router.post(`/tasks/list`, auth.default, this.controller.getTasksList);
    this.router.get(`/tasks/listbyuser`, auth.default, this.controller.getTaskByUser);
    this.router.get(`/tasks/complated`, auth.default, this.controller.getComolatedTasks);
    
    // Task Crud APIs
    this.router.post(`/task`, auth.default, this.controller.createTasks);
    this.router.post(`/task/quick`, auth.default, this.controller.createQuickTasks);
    this.router.put(`/task`, auth.default, this.controller.updateTasks);
    this.router.put(`/task/multi`, auth.default, this.controller.updateMultipleTasks);
    this.router.delete(`/task`, auth.default, this.controller.deleteTasks);
    this.router.get(`/task/setpriority`, auth.default, this.controller.SetPriorityForTask);

    // Task section Apis
    this.router.get(`/task/section`, auth.default, this.controller.getProjectTaskSection);
    this.router.post(`/task/section`, auth.default, this.controller.createProjectTaskSection);
    this.router.put(`/task/section`, auth.default, this.controller.updateProjectTaskSection);
    this.router.delete(`/task/section`, auth.default, this.controller.deleteProjectTaskSection);

    // Task Time Log  APIs
    this.router.post(`/tasks/start`, auth.default, this.taskTimeLogsController.startTime);
    this.router.get(`/tasks/timehistory`, auth.default, this.taskTimeLogsController.getAllWorkTimeHistory);
    this.router.post(`/tasks/stop`, auth.default, this.taskTimeLogsController.stopTime);
    this.router.post(`/user/tasks/stop`, auth.default, this.taskTimeLogsController.stopTimeByTL);
    this.router.get(`/tasks/totaltime`, auth.default, this.taskTimeLogsController.taskTotalTime);
    this.router.get(`/tasks/timehistory/single`, auth.default, this.taskTimeLogsController.getSingleWorkTimeHistory);
    this.router.put(`/tasks/timehistory`, auth.default, this.taskTimeLogsController.update);
    this.router.delete(`/tasks/timehistory`, auth.default, this.taskTimeLogsController.delete);

    // Task Change Log
    
    this.router.get(`/tasks/changeLogs`, auth.default, this.controller.changeLogs);

    // Task Comment APIs
    this.router.post(`/tasks/comment`, auth.default, this.taskCommentController.create);
    this.router.get(`/tasks/comment`, auth.default, this.taskCommentController.getAllComments);
    this.router.get(`/tasks/comment/single`, auth.default, this.taskCommentController.getSingle);
    this.router.put(`/tasks/comment`, auth.default, this.taskCommentController.update);
    this.router.delete(`/tasks/comment`, auth.default, this.taskCommentController.delete);
    this.router.post(`/tasks/dashboardlist` , auth.default , this.controller.getDashboardTaskList)
    this.router.post(`/tasks/teamdropdown`, auth.default, this.controller.assigneeDropDown);

    // Task Commit APIs
    this.router.post(`/tasks/commit`, auth.default, this.taskCommitController.create);
    this.router.get(`/tasks/commit`, auth.default, this.taskCommitController.getAllCommits);
    this.router.get(`/tasks/commit/single`, auth.default, this.taskCommitController.getSingle);
    this.router.put(`/tasks/commit`, auth.default, this.taskCommitController.update);
    this.router.delete(`/tasks/commit`, auth.default, this.taskCommitController.delete);

    // Task Get All Activities
    this.router.get(`/tasks/allactivity`, auth.default, this.controller.allActivity);
  }
}

export default TaskRoute;
