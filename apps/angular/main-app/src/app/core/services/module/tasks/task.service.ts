import { BehaviorSubject, Subject } from 'rxjs';
import { _doEncrypt } from './../../../../../../../../../libs/utils/encryption/src/lib/utils-encryption';
import { environment } from './../../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GetTaskTimeHistoryRequestModel,
  ProjectsRequestDataModel,
  TaskListRequestBody,
  TaskChangeLogRequestModel,
  TaskChangeLogResponseModel,
  TaskTimeHistoryResponseModel,
  TaskTimerRequestModel,
  TaskWorkedHoursResponseModel,
  toggleTaskTimerResponseModel,
  PostQuickTaskResponseModel,
  SectionResponseModel,
  PostTaskSectionModel,
  PostTaskSectionResponseModel,
  UpdateTaskWorkHistoryModel,
  GetSubTaskListRequestModel,
} from '../../../model/task/task.model';
@Injectable({
  providedIn: 'root',
})
export class TaskService {

  private filterDataSource = new BehaviorSubject<any>('');
  currentFilteredData = this.filterDataSource.asObservable();
  private _projectList = new BehaviorSubject<any>([]);
  private _projectList$ = this._projectList.asObservable();

  // This behavior subject will be used to get projects which have checked = true;
  private _projectWiseTasks = new Subject<any>();
  private _projectWiseTasks$ = this._projectWiseTasks.asObservable();

  private reFetchProjectTasks = new BehaviorSubject<boolean>(false);
  private reFetchProjectTasks$ = this.reFetchProjectTasks.asObservable();

  private viewAllTasks = new BehaviorSubject<any>(null);
  private viewAllTasks$ = this.viewAllTasks.asObservable();


  workspaceId!: string;
  _base_url = environment.base_url;
  _project_url = environment.project_url;
  _task_base_url = environment.task_base_url;
  _projects_by_workspace = environment.projects_by_workspace;
  _get_all_projects = environment.project_url;
  _get_workspace_with_project_list = environment.workspace_with_project_list;
  _get_tasks_workspace = environment.tasks_workspace;
  _get_projects_url = environment.get_projects_url;
  _post_task_url = environment.post_task_url;
  _get_task_labels_url = environment.get_task_labels_url;
  _get_task_by_id_url = environment.get_task_by_id_url;
  _start_task_timer_url = environment.start_task_timer_url;
  _stop_task_timer_url = environment.stop_task_timer_url;
  _get_task_total_time = environment.get_task_total_time;
  _get_task_by_project = environment.get_tasks_by_project;
  _get_working_users_list = environment.get_working_users_list;
  _get_free_users_list = environment.get_free_users_list;
  _get_logged_out_users_list = environment.get_logged_out_users_list;
  _get_not_logged_in_users_list = environment.get_not_logged_in_users_list;
  _get_on_leave_users_list = environment.get_on_leave_users_list;
  _get_task_list_url = environment.get_task_list_url;
  _timehistory_url = environment.timehistory_url;
  _get_change_logs_url = environment.get_change_logs_url;
  _post_quick_task = environment.post_quick_task;
  _task_section_url = environment.task_section_url;
  _get_sub_task_url = environment.get_sub_task_url;
  _get_project_list_url = environment.get_project_list;
  _get_project_team_url = environment.get_project_team;
  _get_project_task_count = environment.get_project_task_count;
  _projectlistForUsersActivev2 = environment.project_list_for_users_active_v2;
  _bulk_project_inactive = environment.bulk_project_inactive;

  bulk_task_update_url = environment.bulk_task_update_url;
  check_completed_task_url = environment.check_completed_task_url;
  get_task_labels_by_project_url = environment.get_task_labels_by_project_url;
  constructor(private httpClient: HttpClient) {}


  setFilterData(message: any) {
    this.filterDataSource.next(message);
  }

  getProjectList() {
    return this._projectList$;
  }

  setProjectList(projectList: any[]) {
    this._projectList.next(projectList);
  }

  getProjectWiseTasks() {
    return this._projectWiseTasks$;
  }

  getViewAllTaks() {
    return this.viewAllTasks$;
  }

  setViewAllTasks(groupDetails: any) {
    this.viewAllTasks.next(groupDetails);
  }

  getReFetchProjectWiseTasks() {
    return this.reFetchProjectTasks$;
  }

  setRefetchProjectWiseTask(flag: boolean) {
    this.reFetchProjectTasks.next(flag);
  }

  setProjectWiseTasks(taskWiseProjectList: any[]) {
    this._projectWiseTasks.next(taskWiseProjectList);
  }

  getProjectByWorkspace(_id: any) {
    return this.httpClient.get(this._base_url + this._projects_by_workspace, {
      headers: {
        id: _id,
      },
    });
  }

  getMyTeamMembers(project_ids: any) {
    return this.httpClient.post(this._task_base_url + 'tasks/teamdropdown', {
      project_ids,
    });
  }

  getAllProjects() {
    const headers = new HttpHeaders().set('isdropdown', 'true');
    return this.httpClient.get(this._base_url + this._get_all_projects, { headers });
  }

  getWorkspaceWithProjectList() {
    return this.httpClient.get(this._base_url + this._get_workspace_with_project_list);
  }

  getTasksWorksapce() {
    return this.httpClient.get(this._task_base_url + this._get_tasks_workspace);
  }

  getProjectWiseTasksList(body: any, currentPage: number, limit: number) {
    return this.httpClient.post(this._task_base_url + this._get_task_by_project + '/free' + `?page=${currentPage}&limit=${limit}`, body);
  }

  /**
   *
   * @param body - Request Body Of Type TaskListRequestBody
   * @returns List Of Tasks
   * @description Common Api for task list in app
   */
  getTaskList(body: TaskListRequestBody) {
    return this.httpClient.post(this._task_base_url + this._get_task_list_url, body);
  }

  getProjectsData(requestBody: ProjectsRequestDataModel) {
    const headers = new HttpHeaders().set('isdropdown', 'true');
    return this.httpClient.post(this._base_url + this._get_projects_url, requestBody, { headers });
  }

  getProjectsStatusById(body: any) {
    return this.httpClient.post(this._base_url + this._project_url + '/substatus', body);
  }

  getProjectsTeamMembers(body: any) {
    return this.httpClient.post(this._base_url + this._project_url + '/team', body);
  }

  getProjectsCustomFieldsById(body: any) {
    return this.httpClient.post(this._base_url + this._project_url + '/customfields', body);
  }

  getSingleProjectsData(headers: any) {
    // const headers = new HttpHeaders().set('isdropdown', 'true');
    return this.httpClient.get(this._base_url + this._get_projects_url + '/single', { headers });
  }
  getProjectsList() {
    // const headers = new HttpHeaders().set('isdropdown', 'true');
    return this.httpClient.get(this._base_url + this._get_projects_url + '/v2');
  }

  postTask(requestBody: any) {
    return this.httpClient.post(this._task_base_url + this._post_task_url, requestBody);
  }

  updateTask(requestBody: any, taskId: string, islist = 'false') {
    return this.httpClient.put(this._task_base_url + this._post_task_url, requestBody, {
      headers: {
        id: taskId,
        islist: islist,
      },
    });
  }

  getTaskLabels(projectId: string) {
    return this.httpClient.get(this._task_base_url + this._get_task_labels_url, {
      headers: {
        project: projectId.toString(),
      },
    });
  }

  getTaskById(taskId: string) {
    return this.httpClient.get(this._task_base_url + this._get_task_by_id_url, {
      headers: {
        id: taskId,
      },
    });
  }

  startTaskTimer(requestBody: TaskTimerRequestModel) {
    return this.httpClient.post<toggleTaskTimerResponseModel>(this._task_base_url + this._start_task_timer_url, requestBody);
  }

  stopTaskTimer(requestBody: TaskTimerRequestModel) {
    return this.httpClient.post<toggleTaskTimerResponseModel>(this._task_base_url + this._stop_task_timer_url, requestBody);
  }

  getTaskTotalTime(taskId: string) {
    return this.httpClient.get<TaskWorkedHoursResponseModel>(this._task_base_url + this._get_task_total_time, {
      headers: {
        id: taskId,
      },
    });
  }

  // Get working  list from the server
  getWorkingUsersList() {
    return this.httpClient.get(this._task_base_url + this._get_working_users_list);
  }

  // Get free users list from the server
  getFreeUsersList() {
    return this.httpClient.get(this._task_base_url + this._get_free_users_list);
  }

  // Get logged out users list from the server
  getLoggedOutUsersList() {
    return this.httpClient.get(this._task_base_url + this._get_logged_out_users_list);
  }

  // Get not logged in users list from the server
  getNotLoggedInUsersList() {
    return this.httpClient.get(this._task_base_url + this._get_not_logged_in_users_list);
  }

  // Get on leave users list from the server
  getOnLeaveUsersList() {
    return this.httpClient.get(this._task_base_url + this._get_on_leave_users_list);
  }

  // get task time history
  getTaskTimeHistory(getTaskTimeHistoryRequestModel: GetTaskTimeHistoryRequestModel) {
    return this.httpClient.get<TaskTimeHistoryResponseModel>(this._task_base_url + this._timehistory_url, {
      headers: {
        task_id: getTaskTimeHistoryRequestModel.task_id,
        page: getTaskTimeHistoryRequestModel.page ? getTaskTimeHistoryRequestModel.page.toString() : '',
        limit: getTaskTimeHistoryRequestModel.limit ? getTaskTimeHistoryRequestModel.limit.toString() : '',
        orderby: getTaskTimeHistoryRequestModel.orderby,
        sortby: getTaskTimeHistoryRequestModel.sortby,
      },
    });
  }

  // update task work history
  updateTaskWorkHistory(updateTaskWorkHistoryModel: UpdateTaskWorkHistoryModel, timeStampId: string) {
    return this.httpClient.put(this._task_base_url + this._timehistory_url, updateTaskWorkHistoryModel, {
      headers: {
        id: timeStampId,
      },
    });
  }

  // delete task work history
  deleteTaskWorkHistory(taskId: string, id: string) {
    return this.httpClient.delete(this._task_base_url + this._timehistory_url, {
      headers: {
        id: id,
        task_id: taskId,
      },
    });
  }

  // get task change logs
  getTaskChangeLogs(taskChangeLogRequest: TaskChangeLogRequestModel) {
    return this.httpClient.get<TaskChangeLogResponseModel>(this._task_base_url + this._get_change_logs_url, {
      headers: {
        task_id: taskChangeLogRequest.task_id,
        page: taskChangeLogRequest.page.toString(),
        limit: taskChangeLogRequest.limit.toString(),
        orderby: taskChangeLogRequest.orderby,
        sortby: taskChangeLogRequest.sortby,
      },
    });
  }

  postQuickTask(requestBody: any) {
    return this.httpClient.post<PostQuickTaskResponseModel>(this._task_base_url + this._post_quick_task, requestBody);
  }

  getTaskSectionsFromProject(projectId: string) {
    return this.httpClient.get<SectionResponseModel>(this._task_base_url + this._task_section_url, {
      headers: {
        id: projectId,
      },
    });
  }

  postTaskSection(requestBody: PostTaskSectionModel) {
    return this.httpClient.post<PostTaskSectionResponseModel>(this._task_base_url + this._task_section_url, requestBody);
  }

  getSubTaskList(getSubTaskListRequestModel: GetSubTaskListRequestModel) {
    return this.httpClient.get(
      `${this._task_base_url}${this._get_sub_task_url}?page=${getSubTaskListRequestModel.page}&limit=${getSubTaskListRequestModel.limit}&sortBy=${getSubTaskListRequestModel.sortBy}&orderBy=${getSubTaskListRequestModel.orderBy}`,
      {
        headers: {
          task_id: getSubTaskListRequestModel.taskId,
        },
      }
    );
  }

  // return file names from file path
  getDocumentsName(fileNames: any) {
    if (fileNames && fileNames.length > 0) {
      const tempFileNames: string[] = [];
      fileNames.forEach((fileNameObject: string) => {
        if (fileNameObject.includes('-')) {
          tempFileNames.push(fileNameObject.substring(fileNameObject.lastIndexOf('-') + 1));
        }
      });
      return tempFileNames;
    } else {
      return [];
    }
  }

  // return key after replacing underscore with space
  getKeyName(keyName: string) {
    return keyName.replace('_', ' ');
  }

  // This method will check if editor has only spaces then reset it and return false otherwise return true
  checkIfEditorHasNoSpace(value: string) {
    if (value) {
      const div: any = document.createElement('div');
      div.innerHTML = value.trim();
      if (div.firstChild && div.firstChild.firstChild.data && div.firstChild.firstChild.data.trim().length == 0) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  getProjectListv2() {
    return this.httpClient.get(this._base_url + this._get_project_list_url);
  }
  getProjectTeam(projectIds: number[]) {
    return this.httpClient.post(this._base_url + this._get_project_team_url, {
      project_id: projectIds,
    });
  }
  getProjectTaskCount() {
    return this.httpClient.get(this._base_url + this._get_project_task_count);
  }
  projectListForUsersActive(id: any) {
    return this.httpClient.get(this._base_url + this._projectlistForUsersActivev2, {
      headers: {
        user_id: id,
      },
    });
  }
  inactiveBulkProjects(body: any, id: any) {
    return this.httpClient.post(this._base_url + this._bulk_project_inactive, body, {
      headers: {
        user_id: id,
      },
    });
  }
  updateMassTasks(requestBody: any) {
    return this.httpClient.put(this._task_base_url + this.bulk_task_update_url, requestBody);
  }
  checkFetchCompletedTaskstatus(timestamp: string) {
    return this.httpClient.get(this._task_base_url + this.check_completed_task_url, {
      headers: {
        visible_date: timestamp,
      },
    });
  }
  getFilterLabels(body: any) {
    return this.httpClient.post(this._task_base_url + this.get_task_labels_by_project_url, body);
  }
}
