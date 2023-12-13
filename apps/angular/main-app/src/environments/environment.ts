// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  fireBaseConfig: {
    apiKey: 'AIzaSyBeFkFog0heycnFDqZ29QdXfWKqKrXErWQ',
    authDomain: 'test-project-b6164.firebaseapp.com',
    projectId: 'test-project-b6164',
    storageBucket: 'test-project-b6164.appspot.com',
    messagingSenderId: '1016557614714',
    appId: '1:1016557614714:web:7646d0305b7a4b1f84adc3',
    measurementId: 'G-NQEN4EK4FL',
  },
  production: false,

  /** HTTPS */

  // base_url: 'http://192.168.0.204:3500/', //staging
  // document_base_url: 'http://192.168.0.204:3501/', //staging
  // leave_base_url: 'http://192.168.0.204:3502/', //staging
  // task_base_url: 'http://192.168.0.204:3503/', //staging

  base_url: 'http://192.168.0.204:3500/', //staging
  document_base_url: 'http://192.168.0.204:3501/', //staging
  leave_base_url: 'http://192.168.0.204:3502/', //staging
  task_base_url: 'http://192.168.0.204:3503/', //staging

  leaves_url: 'leaves',
  leave_url: 'leave',
  approver_url: 'approver',
  reporting_users_url: 'getReportingUsers',
  subjects_url: 'subjects',
  balance_url: 'balance',
  workspace_url: 'workspace',
  project_url: 'project',
  getprojects_url: 'getprojects',
  project_by_id_url: 'single',
  bilingconfigrationstatus_url: 'bilingconfigrationstatus',
  single_url: 'single',
  project_status_url: 'status',
  holiday_url: 'holidays',
  login_url: 'login',
  user_url: 'user',
  users_url: 'users',
  user_pending_time_url: 'pending/time',
  user_list_url: 'list',
  team_leave_report_url: 'teamLeaveReport',
  attendance_report_url: 'attendanceReport',
  user_roles_url: 'roles',
  user_skill_desc_url: 'description/update',
  user_role_url: 'role',
  user_permission_url: 'permission',
  update_user_role: 'update',
  document_url: 'document',
  tags_url: 'tags',
  tag_url: 'tag',
  logout_url: 'logout',
  break_url: 'break',
  member_break_url: 'member/break',
  documents_url: 'documents',
  create_document_url: 'create',
  site_setting_url: 'site/setting',
  update_document_url: 'update',
  delete_document_url: 'delete',
  custom_fields: 'custom/fields',
  status_url: 'status',
  projects_by_workspace: 'workspace/projects',
  workspace_with_project_list: 'workspace/task/dropdown',
  tasks_workspace: 'tasks/workspace',
  administration_leaves_report: 'leave/Report',
  update_authorized_users_url: 'update/update-authorized-user',
  transaction: 'transection',
  leave_balance_manual_update_list_url: 'manual/update',
  leave_balance_manual_update_save_draft_url: 'manual/draft',
  leave_balance_manual_update_final_save_url: 'manual/save',
  user_profile_url: 'user/validation',
  time_history_url: 'user/report/persons',
  manul_update_log_list: 'manual/log',
  manul_update_history_details: 'manual/data',
  get_projects_url: 'getprojects',
  post_task_url: 'task',
  get_task_labels_url: 'tasks/labels',
  get_task_by_id_url: 'task/single',
  task_comment_url: 'tasks/comment',
  start_task_timer_url: 'tasks/start',
  stop_task_timer_url: 'tasks/stop',
  get_task_total_time: 'tasks/totaltime',
  get_tasks_by_project: 'tasks/taskbyprojects',
  get_sub_task_url: 'task/subtask',
  get_working_users_list: 'user/report',
  get_free_users_list: 'user/free/report',
  get_logged_out_users_list: 'user/logout/report',
  get_not_logged_in_users_list: 'user/notlogin/report',
  get_on_leave_users_list: 'user/onleave/report',
  get_my_team_tasks_list: 'tasks/dashboardlist',
  get_all_my_tasks_list: 'tasks/list',
  get_project_key_url: 'checkkey',
  get_task_list_url: 'tasks/list',
  commit_url: 'tasks/commit',
  timehistory_url: 'tasks/timehistory',
  preference_url: 'preference',
  get_change_logs_url: 'tasks/changeLogs',
  post_quick_task: 'task/quick',
  get_leave_teams_dashboard: 'leave/Teams/dashboard',
  get_remider_dashboard: 'holidays/dashboard',
  task_section_url: 'task/section',
  template: 'template',
  project_worked_hrs_url: 'project/workedhours',
  login_banners_url: 'users/birthday',
  logout_member: 'user/member/logout',
  stop_task_timer_url_reports: 'user/tasks/stop',
  user_task_report: 'user/task/report',
  user_wise_task_report: 'user/task/report/explore',
  workflow: 'workflow',
  user_id_wise_task_details: 'tasks/listbyuser',
  get_project_list: 'getprojects/v2',
  get_project_team: 'project/team',
  get_project_task_count: 'project/listwithtaskcount/v2',
  set_task_priority: 'task/setpriority',
  get_project_dashboard_list: 'project/dashboard/list',
  get_timing_report: 'user/time/report',
  get_project_dashboard_active_v2: 'project/dashboard/active/v2',
  get_help_details: 'help',
  get_leave_master_data: 'leaves/balance/all',
  update_current_leave: 'leave/balance',
  project_list_for_users_active_v2: 'project/listForUsersActive/v2',
  bulk_project_inactive: 'project/bulk/inactive',
  bulk_task_update_url: 'task/multi',
  check_completed_task_url: 'tasks/complated',
  get_projects_chart_data: 'v1/analytics/get-project-tasks',
  get_activity_chart_data: 'chart/pieChart',
  get_task_labels_by_project_url: 'tasks/labels/byprojects',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
