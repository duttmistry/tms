import { Query } from '@tms-workspace/apis-core';
import { ITimeLogs } from '../../../database/interface/time_logs.interface';
import { TimeLogs } from '../../../database/models/task_time_logs.model';
import TaskService from './task.service';

class TaskTimeLogService {
  public taskService = new TaskService();
  // GET ALL Work History
  public _count = async (query) => {
    return new Promise<number>((resolve, reject) => {
      const data = TimeLogs.count(query);
      resolve(data);
    });
  };

  // GET ALL Work History
  public _getAllData = async (p = 0, l = 0, sortBy = 'id', orderBy = 'asc', query) => {
    const { offset, limit } = Query.getQuery({
      page: p,
      limit: Number(l),
      sortBy,
      orderBy,
    });

    const sortObj = {};
    sortObj[sortBy || 'id'] = orderBy === 'asc' ? 1 : -1;
    return new Promise<ITimeLogs[]>((resolve, reject) => {
      // console.log(query,"PD_0");
      const data = TimeLogs.find(query).limit(Number(limit)).skip(Number(offset)).sort(sortObj);
      resolve(data);
    });
  };

  // GET Time History By Task
  public _getTaskHistoryData = async (query) => {
    return new Promise<ITimeLogs[]>((resolve, reject) => {
      const data = TimeLogs.find(query);
      resolve(data);
    });
  };
  // GET SINGLE Work History
  public _getSingleData = async (query) => {
    return new Promise<ITimeLogs>((resolve, reject) => {
      const data = TimeLogs.findOne(query);
      resolve(data);
    });
  };

  // CREATE Work History
  public _create = async (obj) => {
    return new Promise<ITimeLogs>((resolve, reject) => {
      TimeLogs.updateMany({user_id: obj.user_id, end_time: null },
        { end_time: Date.now() },{ new: true }).then(async(res)=>{
        await this.taskService._updateTasks({running_status:'Stop'}, { assignee: obj.user_id,running_status:'Ongoing'});
        const data = TimeLogs.create(obj);
        resolve(data);
      })
      
    });
  };

  // UPDATE Work History
  public _update = async (query, obj) => {
    return new Promise((resolve, reject) => {

      const data = TimeLogs.updateMany(query, obj);
      // console.log(data,"P_D");

      resolve(data);
    });
  };

  // DELETE Work History
  public _delete = async (query) => {
    return new Promise((resolve, reject) => {
      const data = TimeLogs.deleteOne(query);
      resolve(data);
    });
  };
}

export default TaskTimeLogService;
