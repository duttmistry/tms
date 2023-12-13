import e, { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import TaskTimeLogsService from '../services/task_time_logs.service';
import { Pagination } from '@tms-workspace/apis-core';
import TaskChangeLogService from '../services/task_change_log.service';
import { iRequestWithUserWithProfile } from '../../../database/interface/user.interface';
import { Encryption } from '@tms-workspace/';
import TaskService from '../services/task.service';

class TaskTimeLogController {
  public taskTimeLogsService = new TaskTimeLogsService();
  public taskChangeLogService = new TaskChangeLogService();
  public taskService = new TaskService();
  public getAllWorkTimeHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortby, orderby } = req.headers;
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const count = await this.taskTimeLogsService._count({ task_id: task_id });
      // // if (!year) {
      // //   return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Year'));
      // // }
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.taskTimeLogsService._getAllData(+page, +limit, sortby as string, orderby as string, { task_id: task_id });
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public startTime = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const { task_id } = req.body;
      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      let task = await this.taskService._getTasksById({ id: task_id });
      task = JSON.parse(JSON.stringify(task));
      let is_team_member = await this.taskService._getProjectTeamById({ project_id: task.project_id, user_id: req.user.id });
      is_team_member = JSON.parse(JSON.stringify(is_team_member));
      if (is_team_member && is_team_member.id) {
        await this.taskTimeLogsService._update({ user_id: req.user.id, end_time: null }, { end_time: Date.now() });
        const reqData = {
          ...req.body,
          project_id: task.project_id,
          user_id: req.user.id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
        };
        // const oldTime = await this.taskTimeLogsService._getSingleData({ task_id: req.body.task_id, user_id: req.user.id, end_time: null });
        // if (oldTime) {
        //   await this.taskService._updateTasks({running_status:'Ongoing'}, { id: req.body.task_id });
        //   return res.status(201).json(APIResponseFormat._ResMessage(200,true,'Task timer has been started.',oldTime));
        // }
        const data = await this.taskTimeLogsService._create(reqData);

        if (!data) {
          return res.status(500).json(APIResponseFormat._ResMessage(200, false, 'Task timer has not been started.'));
        } else {
          const logBody = {
            ...reqData,
            task_id: task_id,
            action: 'Timer Start',
          };
          // await this.taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: req.user.id });
          const currentstatus = await this.taskService._getTaskStatus({ user_id: req.user.id, running_status: 'Ongoing' });
          for (const element of currentstatus) {
            await this.taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: req.user.id });
            const logBody = {
              ...reqData,
              task_id: element.task_id,
              action: 'The timer has been stopped.',
            };
            await this.taskChangeLogService._create(logBody);
            const ongoing = await this.taskService._getTaskStatus({ task_id: element.task_id, running_status: 'Ongoing' });
            const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: element.task_id });
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
                { id: element.task_id }
              );
              
            } else {
              await this.taskService._updateTasks(
                {
                  total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
                    .toString()
                    .padStart(2, '0')}`,
                },
                { id: element.task_id }
              );
            }
          }
          let status = await this.taskService._getProjectStatusData({ state: 'inprogress', project_id: task.project_id });
          status = JSON.parse(JSON.stringify(status));
          if(task.assignee==null){
            // await this.taskService._updateTasks(
            //   { running_status: 'Ongoing', state: 'inprogress', status: status?.id || null, assignee: req.user.id },
            //   { id: req.body.task_id }
            // );
            await this.taskService._updateTasks(
              { running_status: 'Ongoing', assignee: req.user.id },
              { id: req.body.task_id }
            );
          }else{
          // await this.taskService._updateTasks(
          //   { running_status: 'Ongoing', state: 'inprogress', status: status?.id || null },
          //   { id: req.body.task_id }
          // );
          await this.taskService._updateTasks(
            { running_status: 'Ongoing'},
            { id: req.body.task_id }
          );
          }
          await this.taskService._addTaskStatus({ user_id: req.user.id, task_id: task_id, running_status: 'Ongoing' });
          await this.taskChangeLogService._create(logBody);
          return res.status(201).json(APIResponseFormat._ResMessage(200, true, 'Task timer has been started..', data));
        }
      } else {
        return res.status(200).json(APIResponseFormat._ResMessage(200, false, 'You do not have the authorization for this action.'));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public stopTime = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const { task_id,comment } = req.body;

      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const reqData = {
        ...req.body,
        user_id: req.user.id,
        user_name: `${req.user.first_name} ${req.user.last_name}`,
        user_profile: req.user.user_image,
        end_time: Date.now(),
      };
      const data = await this.taskTimeLogsService._update(
        { task_id: req.body.task_id, user_id: req.user.id, end_time: null },
        { end_time: Date.now(),comment: comment }
      );
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResMessage(200, true, 'Task timer has been stopped.'));
      } else {
        const logBody = {
          ...reqData,
          task_id: task_id,
          action: 'Timer Stop',
        };
        await this.taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: req.user.id, task_id: task_id });
        const ongoing = await this.taskService._getTaskStatus({ task_id: task_id, running_status: 'Ongoing' });
        const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: task_id });
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
            { id: req.body.task_id }
          );
        } else {
          await this.taskService._updateTasks(
            {
              total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
                .toString()
                .padStart(2, '0')}`,
            },
            { id: req.body.task_id }
          );
        }
        await this.taskChangeLogService._create(logBody);
        let task = await this.taskService._getTasksById({ id: task_id });
        task = JSON.parse(JSON.stringify(task));
        const pendingTime = await this.taskService._countPendingTime(task.eta, task.total_worked_hours);
        const newTask = { ...task, pendingTime: pendingTime };
        return res.status(200).json(APIResponseFormat._ResMessage(200, true, 'Task timer has been stopped', newTask));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public stopTimeByTL = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const { task_id, user_id } = req.body;

      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const reqData = {
        ...req.body,
        user_id: user_id,
        user_name: `${req.user.first_name} ${req.user.last_name}`,
        user_profile: req.user.user_image,
        end_time: Date.now(),
      };
      const data = await this.taskTimeLogsService._update({ task_id: req.body.task_id, user_id: user_id, end_time: null }, { end_time: Date.now() });
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResMessage(200, true, 'Task timer has been stopped'));
      } else {
        const logBody = {
          ...reqData,
          user_id: req.user.id,
          task_id: task_id,
          action: 'Timer Stop',
        };
        await this.taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: user_id, task_id: task_id });
        const ongoing = await this.taskService._getTaskStatus({ task_id: task_id, running_status: 'Ongoing' });
        const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: task_id });
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
            { id: req.body.task_id }
          );
        } else {
          await this.taskService._updateTasks(
            {
              total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
                .toString()
                .padStart(2, '0')}`,
            },
            { id: req.body.task_id }
          );
        }
        await this.taskChangeLogService._create(logBody);
        return res.status(200).json(APIResponseFormat._ResMessage(200, true, 'Task timer has been stopped'));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public taskTotalTime = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const task_id = Encryption._doDecrypt(req.headers.id as string);
      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Task time log'));
      }
      const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: task_id, user_id: req.user.id });
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
      return res.status(200).json(
        APIResponseFormat._ResDataFound({
          total_time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        })
      );
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public getSingleWorkTimeHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.headers.id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Task time log'));
      }

      const data = await this.taskTimeLogsService._getSingleData({ _id: req.headers.id });

      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public update = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const { start_time, end_time, comment } = req.body;
      const id = req.headers.id;

      if (!start_time || !end_time || !id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const reqData = { user_id: req.user.id, user_name: `${req.user.first_name} ${req.user.last_name}`, user_profile: req.user.user_image };
      let data = {};
      // if (comment && comment !== '') {
      //   // if (req.user.isAdmin) {
      //     data = await this.taskTimeLogsService._update(
      //       { _id: id },
      //       { start_time: new Date(start_time).getTime(), end_time: new Date(end_time).getTime(), comment: comment }
      //     );
      //   // } else {
      //   //   data = await this.taskTimeLogsService._update({ _id: id }, { comment: comment });
      //   // }
      // } else {
      //   // if (req.user.isAdmin) {
      //     data = await this.taskTimeLogsService._update(
      //       { _id: id },
      //       { start_time: new Date(start_time).getTime(), end_time: new Date(end_time).getTime() }
      //     );
      //   // }
      // }
      data = await this.taskTimeLogsService._update(
        { _id: id },
        { start_time: new Date(start_time).getTime(), end_time: new Date(end_time).getTime(), comment: comment }
      );
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Task time log'));
      } else {
        // const logBody = {
        //   ...reqData,
        //   task_id: task_id,
        //   action: 'Time Log Edited',
        // };
        // await this.taskChangeLogService._create(logBody);
        let updatedData = await this.taskTimeLogsService._getSingleData({ _id: req.headers.id });
        updatedData = JSON.parse(JSON.stringify(updatedData));
        const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: updatedData.task_id });
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
        await this.taskService._updateTasks(
          {
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: updatedData.task_id }
        );
        let task = await this.taskService._getTasksById({ id: updatedData.task_id });
        task = JSON.parse(JSON.stringify(task));
        const pendingTime=await this.taskService._countPendingTime(task.eta,task.total_worked_hours);
        const newTask={...task,pendingTime:pendingTime};
        return res.status(200).json(APIResponseFormat._ResDataUpdated('Task time log', newTask));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public delete = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const id = req.headers.id;
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      const reqData = { user_id: req.user.id, user_name: `${req.user.first_name} ${req.user.last_name}`, user_profile: req.user.user_image };
      if (!id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Task time log Id'));
      }
      let deletedData = await this.taskTimeLogsService._getSingleData({ _id: req.headers.id });
      deletedData = JSON.parse(JSON.stringify(deletedData));
      const data = await this.taskTimeLogsService._delete({ _id: id });

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Task time log'));
      } else {
        // const logBody = {
        //   ...reqData,
        //   task_id: task_id,
        //   action: 'Time Log Deleted',
        // };
        // await this.taskChangeLogService._create(logBody);

        const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: deletedData.task_id });
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
        await this.taskService._updateTasks(
          {
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: deletedData.task_id }
        );
        let task = await this.taskService._getTasksById({ id: deletedData.task_id });
        task = JSON.parse(JSON.stringify(task));
        const pendingTime = await this.taskService._countPendingTime(task.eta, task.total_worked_hours);
        const newTask = { ...task, pendingTime: pendingTime };
        // return res.status(200).json(APIResponseFormat._ResDataDeleted('Task time log'));
        return res.status(200).json(APIResponseFormat._ResDataFound(newTask));
      }

      //   return res.status(200).json(APIResponseFormat._ResDataDeleted('Comment'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default TaskTimeLogController;
