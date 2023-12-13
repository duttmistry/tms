import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../../src/environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { StorageService } from '../../common/storage.service';
import { STORAGE_CONSTANTS } from '../../common/constants';
import { Encryption } from '@tms-workspace/encryption';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  _base_url = environment.base_url;
  _project_url = environment.project_url;
  _task_base_url = environment.task_base_url;
  _leave_base_url = environment.leave_base_url;
  _get_my_team_tasks_list = environment.get_my_team_tasks_list;
  _get_all_my_tasks_list = environment.get_all_my_tasks_list;
  _get_leave_teams_dashboard = environment.get_leave_teams_dashboard;
  _get_remider_dashboard = environment.get_remider_dashboard;
  _get_project_dashboard_list = environment.get_project_dashboard_list;

  private _projectsIds = new Subject<any>();
  private _myTaskFlag = new Subject<any>();
  private _myTeamTaskFlag = new Subject<any>();
  private _showMyTeamTask = new BehaviorSubject<any>(true);

  constructor(private httpClient: HttpClient, private storageService: StorageService) {
    const getDashboardView = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.REPORTER_STATUS);
    if (getDashboardView) {
      const decryptedDetails = Encryption._doDecrypt(getDashboardView);
      const finalResult = decryptedDetails ? JSON.parse(decryptedDetails) : false;
      this.setShowMyTeamTask(finalResult);
    }
  }

  // Get all my team tasks from the server
  getMyTeamTasksList(state: string, projectsIds: any, userIds: any,is_assigned_by?:any) {
    const body = {
      state: state,
      project_ids: projectsIds,
      assigneeIds: userIds,
      is_assigned_by:is_assigned_by
      // group_limit: 100,
    };
    return this.httpClient.post(this._task_base_url + this._get_my_team_tasks_list, body);
  }

  // Get all tasks from the server
  getAllMyTasksList(state: string, projectid: any, userId: any, taskPermission: any) {
    const hasOnlyMyTaskPermission = taskPermission.hasOnlyMyTaskPermission;
    const body: any = {
      project_ids: projectid,
      filter_by_status: null,
      filter_by_state: [state],
      user_ids: [userId],
      filter_by_from_date: '',
      filter_by_to_date: '',
      search: '',
      group_by: '',
      group_limit: 100,
      limit: null,
      sort_by: 'id',
      order_by: 'ASC',
      full_status: false,
      full_section: true,
      full_assignee: true,
      full_assigned_by: hasOnlyMyTaskPermission ? true : false,
      full_reporter: false,
      full_labels: hasOnlyMyTaskPermission ? true : false,
      full_subscribers: false,
      is_unassigned: false,
    };
    return this.httpClient.post(this._task_base_url + this._get_all_my_tasks_list, body);
  }

  //Get leave teams details from the
  getLeaveTeamsDashboard() {
    return this.httpClient.get(this._leave_base_url + this._get_leave_teams_dashboard);
  }

  // Get reminder details from the server
  getReminderDetails() {
    return this.httpClient.get(this._base_url + this._get_remider_dashboard);
  }

  // Get general activity details from the server
  getGeneralActivityDetails() {
    return this.httpClient.get(this._leave_base_url + '');
  }

  getProjectList() {
    return this.httpClient.get(this._base_url + this._get_project_dashboard_list, {
      params: {
        page: 1,
        limit: 10,
        orderBy: '',
        sortBy: '',
      },
    });
  }
  setProjectIds(projectIsd: any) {
    this._projectsIds.next(projectIsd);
  }

  getProjectsIds() {
    return this._projectsIds.asObservable();
  }
  setMyTaskFlag(myTask: any) {
    this._myTaskFlag.next(myTask);
  }

  getMyTaskFlag() {
    return this._myTaskFlag.asObservable();
  }

  setMyTeamTaskFlag(myTeamTask: any) {
    this._myTeamTaskFlag.next(myTeamTask);
  }

  getMyTeamTaskFlag() {
    return this._myTeamTaskFlag.asObservable();
  }
  setShowMyTeamTask(myTeamTask: any) {
    this._showMyTeamTask.next(myTeamTask);
  }

  getShowMyTeamTask() {
    return this._showMyTeamTask.asObservable();
  }
}
