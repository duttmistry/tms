import { iTasks } from "./task.interface"

export interface iTasksReports {
    id: number,
    user_id: number,
    project_id: number,
    report_to: Array<number>,
    user_first_name: string,
    role?:string,
    user_last_name: string,
    task_id: number,
    task_title: string,
    task_running_status: string,
    task_due_date: Date,
    task_priority: string,
    assigned_by_first_name: string,
    assigned_by_last_name: string,
    loginAt: Date,
    team_lead_first_name: string,
    team_lead_last_name: string,
    project_name: string,
    task_eta:string
  }

  export interface iUserTasksReports {
    user_id: number,
    first_name: string,
    role?:string,
    last_name: string,
    tasks:iTasks[],
    
  }

  export interface iPWReport{
    id: number,
    name:string,
    role?:string,
    workspace_id?:number,
    workspace_name?:string
  }
  export interface iFreeUserReports {
    id: number,
    user_id: number,
    project_id: number,
    user_first_name: string,
    role?:string,
    user_last_name: string,
    task_id: number,
    loginAt: Date,
    team_lead_first_name: string,
    team_lead_last_name: string,
  }  

  export interface iLogoutUserReports {
    id: number,
    user_id: number,
    project_id: number,
    user_first_name: string,
    role?:string,
    user_last_name: string,
    loginAt: Date,
    logoutAt:Date,
    team_lead_first_name: string,
    team_lead_last_name: string,
  }  