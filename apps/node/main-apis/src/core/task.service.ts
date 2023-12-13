import { WhereOptions } from "sequelize";
import { iProjectStatus } from "../app/database/interface/projects.interface";
import { iTasks } from "../app/database/interface/task.interface";
import _DB from '../app/database/models';
// import { TimeLogs } from "../app/database/models/task_time_logs.model";

const _tasks = _DB.ProjectTask;
const _project_status=_DB.ProjectStatus;
class TaskService {
 
  public _updateTasks = async (query:WhereOptions,value) => {
    return new Promise((resolve) => {
      const data = _tasks.update(value,{ where: query });
      resolve(data);
    });
  };
  public _getAllTasks = async (query:WhereOptions) => {
    return new Promise<iTasks[]>((resolve, reject) => {
      const data = _tasks.findAll({ where: query });
      resolve(data);
    });
  
  };
  public _getAllProjectStatusByProject = async (project_id: number) => {
    return new Promise<iProjectStatus>((resolve, reject) => {
      const data = _project_status.findOne({where:{project_id:project_id,title:"completed",state:"completed"}});
      resolve(data);
    });
  };
}



export default TaskService;
