export interface IAddWorkspaceDataModel {
  name: string;
  description: string;
  avatar: File | null;
  status: Boolean;
  url: string;
}
export interface IWorkspaceResponseModel {
  totalProjectCount: number;
  workspace: IWorkspaceListModel[];
}

export interface IWorkspaceListModel {
  title: string;
  description: string;
  id: number;
  project_count: number;
  workspace_total_task: number;
  avatar: string;
  statas: boolean;
  is_active: boolean;
  workspaceProject: {
    id: number;
    project: {
      id: number;
      name: string;
    };
  }[];
  created_by: number;
  team: {
    id: number;
    user: {
      id: number;
      avatar: string;
      firstname: string;
      lastname: string;
    };
  }[];
}

export interface ISingleWorkspaceDataModel {
  id: number;
  name: string;
  description: string;
  documents: any;
  avatar: string;
  created_by: string;
  responsiblePerson: string;
  workspaceProject: {
    id: number;
    project: {
      id: number;
      name: string;
    };
  }[];
  is_active: boolean;
  team: any;
}
