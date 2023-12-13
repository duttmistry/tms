import { iUser } from './user.interface';
import { iTag } from './tag.interface';

export interface iProject {
  id?: number;
  project_key: string;
  name: string;
  description: string;
  responsible_person: number;
  start_date: Date;
  estimated_end_date: Date;
  avatar: string;
  projectTag?: Array<iProjectTag>;
  projectTeam?: Array<iProjectTeam>;
  projectWorkspace?: iProjectWorkspace;
  created_by?: number;
  updated_by?: number;
}
export interface iProjectStatus {
  id?: number;
  project_id: number;
  title: string;
  state: MyEnum;
  color: string;
  created_by?: number;
  updated_by?: number;
}
export interface iProjectBillingConfigration {
  id?: number;
  project_id: number;
  project_status:billingEnum;
  is_billable:boolean;
}

export interface iProjectWorkspace {
  id?: number;
  workspace_id: number;
  project_id: number;
}

export interface iProjectTeam {
  id?: number;
  user_id: number;
  project_id: number;
  report_to: Array<number>;
  user?: iUser;
}

export interface iProjectTag {
  id?: number;
  tag_id: number;
  project_id: number;
  tag?: iTag;
}

export interface iProjectCustomFieldsMapping {
  id?: number,
  project_id: number;
  custom_field_id:number;
  created_by:number;
}

export enum MyEnum {
  'todo',
  'inprogress',
  'onhold',
  'completed',
}
export enum billingEnum {
  'ongoing', 
  'undermaintenance', 
  'closed'
}

export interface iProjectStatus {
  id?: number;
  project_id: number;
  title: string;
  state: MyEnum;
  color: string;
  created_by?: number;
  updated_by?: number;
}
export interface iProjectSection {
  id?: number;
  project_id: number;
  title: string;
  created_by?: number;
  updated_by?: number;
}
