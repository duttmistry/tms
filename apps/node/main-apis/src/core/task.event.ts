import { EventEmitter } from 'events';
import TaskService from './task.service';
import { eventEmitterTask } from '@tms-workspace/preference';

const taskEventEmitter = new EventEmitter();
const taskService = new TaskService();

//#region [ADD LEAVE BY USER]
taskEventEmitter.on('projectTaskStatusComplated', async (project_id:number) => {
  try{
    let ProjectStatus=await taskService._getAllProjectStatusByProject(project_id);
    ProjectStatus=JSON.parse(JSON.stringify(ProjectStatus));
    await taskService._updateTasks({project_id:project_id},{state:'completed',status:ProjectStatus.id})
    let tasks=await taskService._getAllTasks({project_id:project_id});
    tasks=JSON.parse(JSON.stringify(tasks));
    const taskIds=tasks.map((e)=>e.id);
    eventEmitterTask.default.emit('task_time_stop', taskIds);
}catch (error) {
  console.log('error', error);
}
  });
export default taskEventEmitter;