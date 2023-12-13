import { iUser } from './user.interface';
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
  priority: Task_Prioriry_Enum;
  running_status: Task_Running_Status_Enum;
  eta: string;
  subscribers: Array<number>;
  created_by?: number;
  updated_by?: number;
}


export interface iTaskLabel {
  id?: number;
  project_id: number;
  title: string;
  created_by?: number;
  updated_by?: number;
}

export interface iTaskCustomFieldValue {
  id?: number;
  task_custom_field_id: number;
  task_id: number;
  value: string;
  created_by?: number;
  updated_by?: number;
}
