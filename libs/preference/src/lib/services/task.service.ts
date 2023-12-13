import { FilterQuery, UpdateWithAggregationPipeline, UpdateQuery } from 'mongoose';
import { WhereOptions } from 'sequelize';
import { iTaskRunningStatus, iTasks } from '../database/interface/task.interface';
import { ITimeLogs } from '../database/interface/time_logs.interface';
import _DB from '../database/models';

const TimeLogs = _DB.TimeLogs;
const _tasksRunningStatus = _DB.TaskRunningStatus;
const _taskChangeLog = _DB.TaskChangeLog;
const _tasks = _DB.Tasks;

class TaskService {
  public _updateTaskTime = async (
    query: FilterQuery<ITimeLogs> | undefined,
    obj: UpdateWithAggregationPipeline | UpdateQuery<ITimeLogs> | undefined
  ) => {
    return new Promise((resolve, reject) => {
      const data = TimeLogs.updateMany(query, obj);
      resolve(data);
    });
  };
  public _getTaskHistoryData = async (query) => {
    return new Promise<ITimeLogs[]>((resolve, reject) => {
      const data = TimeLogs.find(query);
      resolve(data);
    });
  };

  public _create = async (obj) => {
    return new Promise((resolve, reject) => {
      const data = _taskChangeLog.create(obj);
      resolve(data);
    });
  };

  public _addTaskStatus = async (taskData) => {
    return new Promise<iTaskRunningStatus>((resolve) => {
      const data = _tasksRunningStatus.findOrCreate({where: {
        user_id: taskData.user_id,
        task_id: taskData.task_id
      },
      defaults: {
        running_status: taskData.running_status
      }}).then(([record, created]) => {
        if (!created) {
          // Update the existing record
          return record.update({ running_status: taskData.running_status });
        }    
        return record;
      }).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });

      resolve(data);
    });
  };
  public _updateTaskStatus = async (taskData, query) => {
    return new Promise((resolve) => {
      const data = _tasksRunningStatus.update(taskData, { where: query });
      resolve(data);
    });
  };

  public _getTaskStatus = async (query: WhereOptions) => {
    return new Promise<iTaskRunningStatus[]>((resolve) => {
      const data = _tasksRunningStatus
        .findAll({
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };
  public _updateTasks = async (taskData, query) => {
    return new Promise((resolve) => {
      const data = _tasks.update(taskData, { where: query });
      resolve(data);
    });
  };
  public _getTasks = async (query) => {
    return new Promise<iTasks[]>((resolve) => {
      const data = _tasks.findAll({ where: query });
      resolve(data);
    });
  };
}

export default TaskService;
