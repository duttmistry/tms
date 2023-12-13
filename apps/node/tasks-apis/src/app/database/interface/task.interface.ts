import { iTag } from './tag.interface';

import { Task_Type_Enum, Task_State_Enum, Task_Prioriry_Enum, Task_Running_Status_Enum } from '@tms-workspace/enum-data';

export interface iTasks {
  id?: number;
  parent_task_id: number;
  project_id: number;
  task_key: string;
  task_unique_key:string;
  external_link:string;
  task_key_prefix: string;
  total_worked_hours:string;
  type: Task_Type_Enum;
  title: string;
  description: string;
  state: Task_State_Enum;
  status: number;
  section:number;
  assignee: number;
  assigned_by: number;
  reporter: number;
  labels: Array<number>;
  documents:Array<string>;
  start_date: Date;
  due_date: Date;
  priority: Task_Prioriry_Enum | null;
  running_status: Task_Running_Status_Enum;
  eta: string;
  subscribers: Array<number>;
  created_by?: number;
  updated_by?: number;
}

export interface iTaskRunningStatus {
  id?: number;
  user_id: number;
  task_id:number;
  running_status: Task_Running_Status_Enum;
}
export interface iTasksObj{
  id?: number;
  parent_task_id?: number,
  project_id?: number;
  type?: string;
  title?: string;
  description?: string;
  state?: string;
  status?: number;
  assignee?: number;
  assigned_by?: number;
  reporter?: number;
  labels: Array<number>;
  documents:Array<string>;
  start_date: Date;
  due_date: Date;
  priority: Task_Prioriry_Enum;
  running_status: Task_Running_Status_Enum;
  eta: string;
  subscribers: Array<number>;
  created_by?: number;
  updated_by?: number;
  section?: number;
  task_key_prefix?: string,
  task_unique_key?: string,
  task_key?: string;
  row_num?: number;
  total_task?: number;
  total_task_all?: number;
  project_name?: string;
  task_status?: object;
  task_section?: object;
  task_assignee?:object;
  group_by?: string;
  task_assigned_by?: object;
  task_labels?: Array<iTaskLabel>;
  task_subscribers?: Array<iUser>;
}

export interface iTaskRes{
  projects? : iProject;
  id?: number;
  parent_task_id: number;
  parent_task?: string;
  project_id: number;
  task_key: string;
  task_unique_key:string;
  task_key_prefix: string;
  total_worked_hours:string;
  type: Task_Type_Enum;
  title: string;
  description: string;
  state: Task_State_Enum;
  status: number;
  section:number;
  assignee: number;
  assigned_by: number;
  reporter: number;
  labels: Array<number>;
  documents:Array<string>;
  start_date: Date;
  due_date: Date;
  priority: Task_Prioriry_Enum;
  running_status: Task_Running_Status_Enum;
  eta: string;
  assigneeUser?:iUser;
  assignedByUser?:iUser;
  reportToUser?:iUser;
  subscribers: Array<number>;
  created_by?: number;
  updated_by?: number;
}

export interface iTaskLabel {
  id?: number;
  project_id: number;
  title: string;
  color:object;
  created_by?: number;
  updated_by?: number;
}
export interface iUser{
  id?: number;
  profile?:string;
  last_name?:string;
  first_name?:string;
}
export interface iTaskCustomFieldValue {
  id?: number;
  task_custom_field_id: number;
  task_id: number;
  value: string;
  created_by?: number;
  updated_by?: number;
}
// projects: { id: 84, name: 'Projectname Test-8' }

export interface iProject {
  id?: number;
  name: string;
}
