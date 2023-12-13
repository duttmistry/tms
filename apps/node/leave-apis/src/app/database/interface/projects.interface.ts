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
  projectTeamData?: Array<iProjectTeam>;
  ProjectTasks?: Array<iProjectTask>;
  projectWorkspace?: iProjectWorkspace;
  projectBillingConfigration?: iProjectBillingConfigration;
  created_by?: number;
  updated_by?: number;
}

export interface iProjectWorkspace {
  id?: number;
  workspace_id: number;
  project_id: number;
}

export interface iProjectBillingConfigration {
  id?: number;
  project_id?: number;
  project_status?: billingEnum;
  is_billable?: boolean;
  quoted_hours?: string;
}

export interface iProjectTeam {
  id?: number;
  user_id: number;
  project_id: number;
  team_count?: number;
  report_to: Array<number>;
  user?: iUser;
}
export interface iProjectTask {
  id?: number;
  total_task?: number;
  complete_task_count?: number;
  pending_task_count?: number;
}

export interface iProjectTag {
  id?: number;
  tag_id: number;
  project_id: number;
  tag?: iTag;
}

export interface iProjectCustomFieldsMapping {
  id?: number;
  project_id: number;
  custom_field_id: number;
  created_by?: number;
}

export enum MyEnum {
  'todo',
  'inprogress',
  'onhold',
  'completed',
}

export enum billingEnum {
  ongoing = 'ongoing',
  undermaintenance = 'undermaintenance',
  closed = 'closed',
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

export interface iProjectDocuments {
  id?: number;
  workspace_id: number;
  project_id: number;
  doc_title: string;
  doc_content: Text;
  doc_url: string;
  authorized_users: Array<number>;
  created_by: number;
  last_edited_by: number;
}

export interface ITimeLogs extends Document {
  task_id: number;
  user_id: number;
  user_name: string;
  user_profile: string;
  start_time: Date;
  end_time: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
}
