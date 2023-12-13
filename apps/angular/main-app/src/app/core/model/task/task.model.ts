import { ORDER_BY_DESC_VALUE, SORT_BY_ID_VALUE } from '../../services/common/constants';

export interface StatusModel {
  id?: string;
  status: string;
  statusColor: string;
}

export interface UserModel {
  avatar: string;
  id: number;
  name: string;
}

export class ProjectsRequestDataModel {
  status!: boolean;
  custom_fields!: boolean;
  billing_configuration!: boolean;
  documents!: boolean;
  team!: boolean;
  tag!: boolean;
  workspace!: boolean;
}

export class ProjectNameModel {
  id!: number;
  name!: string;
  key!: string;
}

export class ProjectTeam {
  id!: number;
  report_to!: number[];
  user!: ProjectTeamMember;
  user_id!: number;
  name?: string;
}

export class ProjectTeamMember {
  employee_image!: string;
  first_name!: string;
  id!: number;
  last_name!: string;
  name?: string;
  login_capture_data!: any;
}

export class TaskLabelModel {
  id!: number | string;
  project_id!: number;
  title!: string;
  color!: string;
}

export interface TaskTimerRequestModel {
  task_id: string;
  comment?: string;
}

export interface taskPriorityListEnumModel {
  id: number;
  name: string;
  priorityImg: string;
}

export interface taskTypeListEnumModel {
  id: number;
  name: string;
}

export interface taskStateListEnumModel {
  id: number;
  name: string;
}

export interface taskStatusListModel {
  id: number;
  name: string;
  color: string;
  state: string;
}

export interface customFieldsModel {
  fieldType: string;
  id: number;
  identifier: string;
  is_active: boolean;
  is_required: boolean;
  label: string;
  options: OptionModel[];
  type: string;
}

export interface OptionModel {
  id: number;
  value: string;
}

export interface customFieldToBeUpdatedModel {
  id: number;
  task_custom_field_id: number;
  task_id: number;
  value: string;
  TaskCustomFieldLabelData: TaskCustomFieldLabelDataModel;
}

export interface TaskCustomFieldLabelDataModel {
  fieldType: string;
  id: number;
  label: string;
}

export interface TaskWorkedHoursResponseModel {
  data: TaskWorkedHoursDataModel;
  message: string;
  status: number;
  success: boolean;
}

export interface TaskWorkedHoursDataModel {
  total_time: string;
}

export interface toggleTaskTimerResponseModel {
  data: object;
  message: string;
  status: boolean;
  success: boolean;
}

export interface TaskTimeHistoryResponseModel {
  data: {
    currentPage: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
    list: TaskTimeHistoryResponseObjectModel[];
  };
  message: string;
  status: boolean;
  success: boolean;
}

export interface TaskTimeHistoryResponseObjectModel {
  end_time: string;
  start_time: string;
  task_id: number;
  user_id: number;
  user_name: string;
  user_profile: string;
  _id: string;
  User?: string;
  ['Start time']?: string;
  ['End time']?: string;
  ['Total time']?: string;
}

export class GetTaskTimeHistoryRequestModel {
  task_id!: string;
  page?= 1;
  limit?= 5;
  orderby = ORDER_BY_DESC_VALUE;
  sortby = SORT_BY_ID_VALUE;
}

export class GetTaskTimeHistoryForPrintRequestModel {
  task_id!: string;
  orderby = ORDER_BY_DESC_VALUE;
  sortby = SORT_BY_ID_VALUE;
}

export class TaskChangeLogRequestModel {
  task_id!: string;
  page = 1;
  limit = 10;
  orderby = ORDER_BY_DESC_VALUE;
  sortby = SORT_BY_ID_VALUE;
}

export interface TaskChangeLogResponseModel {
  data: {
    currentPage: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
    list: any[];
  };
  message: string;
  status: boolean;
  success: boolean;
}

export interface TaskChangeLogResponseObjectModel {
  action: string;
  created_at: string;
  updatedAt: string;
  task_id: number;
  updated_values: UpdatedValuesModel[];
  user_id: number;
  user_name: string;
  user_profile: string;
  _id: string;
}

export interface UpdatedValuesModel {
  key: string;
  oldValue: string[];
  newValue: string[];
}

export interface TaskChangeLogListToBindModel {
  logStatement: string;
  logTime: string;
  key: string;
  old_value: any;
  new_value: any;
}

export class TaskListRequestBody {
  project_ids: any[] = [];
  filter_by_status: any = null;
  filter_by_state: any = '';
  user_ids: any[] = [];
  filter_by_from_date: any = '';
  filter_by_to_date: any = '';
  group_by: any = '';
  group_limit: any = 10;
  limit: any = null;
  sort_by: any = 'id';
  order_by: any = 'ASC';
  full_status: any = true;
  full_section: any = true;
  full_assignee: any = true;
  full_assigned_by: any = true;
  full_reporter: any = false;
  full_labels: any = true;
  full_subscribers: any = false;
  search: any = '';
  filter_by_section: any = '';
  is_completed: any = false;
  is_unassigned: any = false;
  dynamic_filter:any = []
}

export interface PostQuickTaskRequstModel {
  project_id: string;
  type: string;
  title: string;
  assignee: number;
  state: string;
  status: number;
  section: number;
  priority: string | null;
  eta: string | null;
  due_date: string | null;
  labels: any;
  parent_task_id?: number;
  reporter: number;
  subscribers: any[];
}

export interface PostQuickTaskResponseModel {
  data: any[];
  message: string;
  status: number;
  success: boolean;
}

export class TaskStateAndStatusModel {
  taskState!: string;
  taskStatudId!: number;
}

export interface SectionResponseModel {
  data: SectionObjectModel[];
  message: string;
  status: number;
  success: boolean;
}

export interface SectionObjectModel {
  created_by?: number;
  id: number;
  project_id: number;
  title: string;
  updated_by?: number;
}

export interface PostTaskSectionModel {
  project_id: number;
  title: string;
}

export interface PostTaskSectionResponseModel {
  data: {
    id: number;
    project_id: number;
    title: string;
  };
  message: string;
  status: number;
  success: boolean;
}

export interface TaskCreatedUpdatedLogModel {
  createdBy: string;
  createdOn: string;
  updatedOn: string;
}

export interface TasksByProjectRequestModel {
  projects: number[];
  search: string;
}

export interface UpdateTaskWorkHistoryModel {
  start_time: any;
  end_time: any;
  comment: string;
}

export class GetSubTaskListRequestModel {
  page = 1;
  limit = 10;
  sortBy = 'id';
  orderBy = 'desc';
  taskId!: string;
}
