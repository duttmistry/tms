export interface IAddProjectDataModel {
  name: string;
  workspace_id: string;
  tags: any;
  start_date: string;
  estimated_end_date: string;
  description: string;
  team: any;
  project_key: string;
  responsible_person: string;
  avatarFile: any;
}

export interface ITagsResModel {
  id: number;
  name: string;
}

export interface IProjectResDataModel {
  currentPage: number;
  limit: number;
  list: IProjectListDataModel[];
  totalPages: number;
  totalRecords: number;
}

export interface IProjectListDataModel {
  project_title: string;
  id: number;
  tagId: string;
  list: any;
  project_team_count: number;
  project_task_count: number;
  project_complete_task_count: number;
  projectStatus: string;
  ProjectTeam: {
    id: number;
    project_id: number;
    user: {
      id: number;
      firstname: string;
      lastname: string;
      avatar: string;
    };
    user_id: number;
  }[];
  projectWorkspace: {
    id: number;
    project_id: number;
    workspace: {
      id: string;
      name: string;
    };
    workspace_id: number;
  };
  project_tags: any;
  // project_tags: {
  //   id: number;
  //   tag_id: number;
  //   project_id: number;
  //   tag: {
  //     id: number;
  //     title: string;
  //   };
  // }[] ;
  project_key: string;
  created_date: string;
  deleted_date: string;
  updated_date: string;
  estimatedDate: string;
  start_date: string;
  description: string;
  otherTags?: string;
  project_workspace: string;
  project_workspace_id: number;
}

export interface ISingleProjectResDataModel {
  name: string;
  ProjectDocuments: any;
  projectTeam: ITeamData[];
  projectTag: {
    id: number;
    tag_id: number;
    project_id: number;
    tag: {
      id: number;
      title: string;
    };
  }[];
  projectWorkspace: {
    id: number;
    // project_id: number;
    workspace: {
      id: number;
      title: string;
    };
  };
  created_by: number;
  description: string;
  estimated_end_date: string;
  id: number;
  project_key: string;
  start_date: string;
  responsible_person: number;
}

interface ITeamData {
  id: number;
  project_id: number;
  user: IUserData;
  user_id: number;
}
interface IUserData {
  id: number;
  first_name: string;
  last_name: string;
  employee_image: string;
}

export interface ITeamMembersData {
  id: number;
  name: string;
  avatar: string;
  isShowCloseButton?: boolean;
  role_id: number;
  manuallySelected?: boolean;
}

export interface ProjectKeyRequestBody {
  key: string;
}

export interface ProjectKeyResponseModel {
  data: object;
  message: string;
  status: boolean;
  success: boolean;
}

export interface ProjectReportRequestBody {
  projectIds: any[] | null;
  fromMonth: string;
  toMonth: string;
}
