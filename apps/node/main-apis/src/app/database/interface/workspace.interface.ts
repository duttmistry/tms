import { iProject } from './projects.interface';
import { iUser } from './user.interface';
export interface iWorkspace {
  id?: number;
  title: string;
  avatar: string;
  description: string;
  responsible_person: number;
  documents: string;
  notes: string;
  is_active: boolean;
  created_by: number;
  updated_by: number;
  team?: Array<iWorkspaceTeamMember>;
  workspaceProject?: Array<iWorkspaceProject>;
  projects?: Array<iProject>;
}

export interface iWorkspaceTeamMember {
  id?: number;
  workspace_id: number;
  user_id: number;
  report_to: Array<number>;
  user?: iUser;
  reporter?: Array<iUser>;
}

export interface iWorkspaceProject {
  id?: number;
  workspace_id?: number;
  project_id?: number;
  project?: iProject;
}
