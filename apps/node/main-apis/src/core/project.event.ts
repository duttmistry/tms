import { EventEmitter } from 'events';
import { billingEnum, iProjectStatus,MyEnum } from '../app/database/interface/projects.interface';
import BillingConfigrationService from './project.service';
import taskEventEmitter from './task.event';
const eventEmitter = new EventEmitter();
const billingConfigrationService = new BillingConfigrationService();

//#region [ADD LEAVE BY USER]
eventEmitter.on('createProjectStatus', async (id:number,project_id:number, project_status:billingEnum, is_billable:boolean,quoted_hours) => {
  try{
  if(id&&id!==null){  
    if(project_status===billingEnum.closed){

      taskEventEmitter.emit('projectTaskStatusComplated',project_id);
    }
    await billingConfigrationService._updateProjectStatus({id:id},{project_id:project_id,project_status:project_status,is_billable:is_billable,quoted_hours})

  }else{
    await billingConfigrationService._createProjectStatus({project_id:project_id,project_status:project_status,is_billable:is_billable,quoted_hours})
  }
}catch (error) {
  console.log('error', error);
}
  });


eventEmitter.on('createProjectStatusWithState', async (userId,project_id:number) => {
    const states=[{title:'To Do',state:'todo'},{title:'In Progress',state:'inprogress'},{title:'On Hold',state:'onhold'},{title:'Completed',state:'completed'}]
    try{
    if(project_id&&project_id!==null){  
      for(const state of states){
        const projectStatus= {
          project_id: project_id,
          title: state.title.trim(),
          state:state.state.trim(),
          color: '#282828',
          created_by: userId,
          updated_by: userId,
        };
        await billingConfigrationService._createProjectStatusData(projectStatus)
      }
    }
  }catch (error) {
    console.log('error', error);
  }
    });

eventEmitter.on('workspaceProjectStatusClose', async (workspace_id:number) => {
  try{
    if(workspace_id&&workspace_id!==null){
      let projects=await billingConfigrationService._getProjects({ workspace_id: workspace_id })
      projects=JSON.parse(JSON.stringify(projects));
      for(const project of projects){
        await billingConfigrationService._updateProjectStatus({project_id:project.id},{project_status:billingEnum.closed})
        taskEventEmitter.emit('projectTaskStatusComplated',project.id);
      }
    }
  }catch (error) {
    console.log('error', error);
  }
});


eventEmitter.on('addAdminInProjectTeam', async (userId) => {
  try{
  let projects=await billingConfigrationService._getAllProjects();
  projects=JSON.parse(JSON.stringify(projects));
  const projectTeam=[];
  for(const project of projects){
    projectTeam.push({
      user_id:userId,
      report_to:[],
      project_id:project.id
    })
  }
  await billingConfigrationService._createProjectTeam(projectTeam)
}catch (error) {
  console.log('error', error);
  }
});

eventEmitter.on('addAdminInWorkspaceTeam', async (userId) => {
  try{
  let workspaces=await billingConfigrationService._getAllWorkspaces();
  workspaces=JSON.parse(JSON.stringify(workspaces));
  const workspaceTeam=[];
  for(const workspace of workspaces){
    workspaceTeam.push({
      user_id:userId,
      report_to:[],
      workspace_id:workspace.id
    })
  }
  await billingConfigrationService._createWorkspaceTeam(workspaceTeam)
  
}catch (error) {
  console.log('error------------->', error);
  }
});

  export default eventEmitter;