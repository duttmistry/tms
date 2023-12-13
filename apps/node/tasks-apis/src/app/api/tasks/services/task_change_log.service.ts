import { ITaskLog } from '../../../database/interface/task_change_log.interface';
import { TaskChangeLog } from '../../../database/models/task_change_log.model';

class TaskChangeLogService {
  public _create = async (obj) => {
    return new Promise((resolve, reject) => {
      const data = TaskChangeLog.create(obj);
      resolve(data);
    });
  };
}

export default TaskChangeLogService;
