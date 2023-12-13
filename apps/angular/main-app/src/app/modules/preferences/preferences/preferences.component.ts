import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { PreferencesService } from '../../../core/services/module/preferences/preferences.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ILeaveNotificationUpdate {
  notify_leave: boolean;
  notify_add_leave_by_team: TeamNotification;
  notify_leave_date_changed: DateChangedNotification;
  notify_leave_status_changed: StatusChangedNotification;
}

interface TeamNotification {
  // notify_add_leave_by_team: boolean;
  notify_leave_email: boolean;
  notify_leave_push: boolean;
  notify_leave_chat: boolean;
}

interface DateChangedNotification {
  // notify_leave_date_changed: boolean;
  notify_leave_date_changed_email: boolean;
  notify_leave_date_changed_push: boolean;
  notify_leave_date_changed_chat: boolean;
}
interface StatusChangedNotification {
  // notify_leave_status_changed: boolean;
  notify_leave_status_changed_email: boolean;
  notify_leave_status_changed_push: boolean;
  notify_leave_status_changed_chat: boolean;
}

export interface ITaskPreferences {
  notify_add_task: boolean;
  notify_change_task_status: boolean;
  notify_change_task_state: boolean;
  notify_due_date_changed: boolean;
  notify_assignee_changed: boolean;
  notify_comment_added: boolean;
}

@Component({
  selector: 'main-app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
})
export class PreferencesComponent implements OnInit {
  actionPermissionData: any;
  subscription!: Subscription;
  selectedField: any;
  isAllowStatus = true;
  isAllowCustomFields = true;
  sidebarSectionList = [
    {
      title: 'Notification',
      route: 'notifications',
      moduleName: 'preferences.notifications',
    },
    {
      title: 'Task',
      route: 'task',
      moduleName: 'preferences.task',
    },
    {
      title: 'Leaves',
      route: 'leaves',
      moduleName: 'preferences.leaves',
    },
  ];
  projectList: any[] = [];
  leavesPreferenceList: any;
  projectPreferenceList: any;
  preferenceHeader = [
    {
      label: 'Email',
      key: 'is_notify_email',
      allowAllNotification: false,
      tooltip_message: 'Receive email notification',
      isGrayBackground: true,
      isForLeave: true,
    },
    {
      label: 'Push',
      key: 'is_notify_push',
      allowAllNotification: false,
      tooltip_message: 'Receive push notification',
      isGrayBackground: true,
      isForLeave: true,
    },
    {
      label: 'Chat',
      key: 'is_notify_chat',
      allowAllNotification: false,
      tooltip_message: 'Receive chat notification',
      isGrayBackground: true,
      isForLeave: true,
    },
    {
      label: 'Task',
      key: 'notify_add_task',
      allowAllNotification: false,
      tooltip_message: 'Notification on new task creation',
      isGrayBackground: false,
      isForLeave: false,
    },
    // {
    //   label: 'SubStatus',
    //   key: 'notify_change_task_status',
    //   allowAllNotification: false,
    //   tooltip_message: `Notification on task's SubStatus update`,
    //   isGrayBackground: false,
    //   isForLeave: false,
    // },
    {
      label: 'Status',
      key: 'notify_change_task_state',
      allowAllNotification: false,
      tooltip_message: `Notificaion on task's status update`,
      isGrayBackground: false,
      isForLeave: false,
    },
    {
      label: 'Due Date',
      key: 'notify_due_date_changed',
      allowAllNotification: false,
      tooltip_message: 'Notification on changes in Due Date',
      isGrayBackground: false,
      isForLeave: false,
    },
    {
      label: 'Assignee',
      key: 'notify_assignee_changed',
      allowAllNotification: false,
      tooltip_message: 'Notification on changes in assignee',
      isGrayBackground: false,
      isForLeave: false,
    },
    {
      label: 'Comment',
      key: 'notify_comment_added',
      allowAllNotification: false,
      tooltip_message: 'Notification on new comments',
      isGrayBackground: false,
      isForLeave: false,
    },
  ];
  preferenceLeaveHeader = [
    {
      label: 'Email',
      key: 'is_notify_email',
      allowAllNotification: false,
      tooltip_message: 'Receive email notification.',
    },
    {
      label: 'Push',
      key: 'is_notify_push',
      allowAllNotification: false,
      tooltip_message: 'Receive push notification.',
    },
    {
      label: 'Chat',
      key: 'is_notify_chat',
      allowAllNotification: false,
      tooltip_message: 'Receive chat notification.',
    },
  ];
  resultObject: any;
  showSpinner = true;
  constructor(
    private preferenceService: PreferencesService,
    private spinnerService: SpinnerService,
    private projectService: ProjectsService,
    private _snackBar: MatSnackBar,
    private _cdf: ChangeDetectorRef
  ) {
    this.selectedField = 'status';
  }

  ngOnInit(): void {
    this.getPreference();
  }

  getPreference() {
    this.showSpinner = true;
    try {
      this.preferenceService.getPreferenceList().subscribe(
        async (res: any) => {
          if (res && res.data) {
            const { Leave, Projects } = res.data;
            this.projectPreferenceList = Projects;
            this.leavesPreferenceList = Leave;
            await this.getProjectList();
            await this.initializeActionClick();
            await this.initializeLeaveActionClick();
            this.showSpinner = false;
          } else {
            this.projectPreferenceList = [];
            this.leavesPreferenceList = [];
            this.showSpinner = false;
          }
        },
        (err: any) => {
          console.error(err);
          this.showSpinner = false;
        }
      );
    } catch (error) {
      console.warn(error);
      this.showSpinner = false;
    }
  }
  initializeLeaveActionClick() {
    if (this.leavesPreferenceList.actions.length) {
      this.preferenceLeaveHeader.forEach((headerObj: any) => {
        this.leavesPreferenceList.actions.forEach((dataObj: any) => {
          // eslint-disable-next-line no-prototype-builtins
          if (dataObj.hasOwnProperty(headerObj.key) && dataObj[headerObj.key]) {
            headerObj.allowAllNotification = true;
            return true;
          } else {
            headerObj.allowAllNotification = false;
            return false;
          }
        });
      });
    }
  }

  initializeActionClick() {
    if (this.projectPreferenceList.length) {
      const data = [...this.projectPreferenceList];
      this.preferenceHeader.forEach((headerObj: any) => {
        const shouldCheckActions = !(headerObj.key == 'is_notify_email' || headerObj.key == 'is_notify_push' || headerObj.key == 'is_notify_chat');
        if (shouldCheckActions) {
          data.some((dataObj: any) => {
            if (dataObj?.actions && dataObj?.actions.length) {
              const findAction = dataObj?.actions.find((m: any) => m.key == headerObj?.key);
              if (findAction && findAction.is_notify) {
                headerObj.allowAllNotification = true;
                return true;
              } else {
                headerObj.allowAllNotification = false;
                return false;
              }
            }
            return false;
          });
        } else {
          data.some((dataObj: any) => {
            // eslint-disable-next-line no-prototype-builtins
            if (dataObj.hasOwnProperty(headerObj.key) && dataObj[headerObj.key]) {
              headerObj.allowAllNotification = true;
              return true;
            } else {
              headerObj.allowAllNotification = false;
              return false;
            }
          });
        }

        // If no matching condition was met, set the flag to false
        // eslint-disable-next-line no-prototype-builtins
        if (!headerObj.hasOwnProperty('allowAllNotification')) {
          headerObj.allowAllNotification = false;
        }
      });

      //// sort by Project Name 
      this.projectPreferenceList.sort((a: any, b: any) =>
        a.project_name.localeCompare(b.project_name));
      //// 
      this._cdf.detectChanges();
    }
  }

  changeLeaveNotificationStatus = (_key: any, updateFor: string) => {
    if (!_key || !updateFor) {
      console.warn('Unable to get key or updateFor');
      return;
    }

    const leavePreference = this.leavesPreferenceList.actions.find((item: any) => item.key === _key);
    if (leavePreference) {
      leavePreference[updateFor] = !leavePreference[updateFor];
      this.updateLeavePreferences();
    }
  };

  changeProjectNotificationStatus = (_projectId: any, updateFor: any) => {
    if (!_projectId || !updateFor) {
      console.warn('unable to get _projectId or updateFor');
      return;
    }

    const projectPreference = this.projectPreferenceList.find((item: any) => item.project_id === _projectId);
    if (projectPreference) {
      projectPreference[updateFor] = !projectPreference[updateFor];
      this.updateSingleProjectPreference(projectPreference, 2);
    }
  };

  changeProjectActionNotificationStatus = (_projectId: any, updateFor: any) => {
    if (!_projectId || !updateFor) {
      console.warn('unable to get _projectId or updateFor');
      return;
    }

    const projectToUpdate = this.projectPreferenceList.find((project: any) => project.project_id === _projectId);
    if (!projectToUpdate) {
      console.warn('Project not found with the given projectId');
      return;
    }
    const actionToUpdate = projectToUpdate.actions.find((action: any) => action.key === updateFor);
    if (!actionToUpdate) {
      console.warn('Action not found with the given updateFor key');
      return;
    }

    actionToUpdate.is_notify = !actionToUpdate.is_notify;

    this.updateSingleProjectPreference(projectToUpdate, 2);
  };

  updateLeavePreferences = () => {
    const leaveNotificationUpdate: ILeaveNotificationUpdate = {
      notify_leave: true,
      notify_add_leave_by_team: {
        // notify_add_leave_by_team: true,
        notify_leave_email: this.leavesPreferenceList.actions[0].is_notify_email,
        notify_leave_push: this.leavesPreferenceList.actions[0].is_notify_push,
        notify_leave_chat: this.leavesPreferenceList.actions[0].is_notify_chat,
      },
      notify_leave_date_changed: {
        // notify_leave_date_changed: true,
        notify_leave_date_changed_email: this.leavesPreferenceList.actions[1].is_notify_email,
        notify_leave_date_changed_push: this.leavesPreferenceList.actions[1].is_notify_push,
        notify_leave_date_changed_chat: this.leavesPreferenceList.actions[1].is_notify_chat,
      },
      notify_leave_status_changed: {
        // notify_leave_status_changed: true,
        notify_leave_status_changed_email: this.leavesPreferenceList.actions[2].is_notify_email,
        notify_leave_status_changed_push: this.leavesPreferenceList.actions[2].is_notify_push,
        notify_leave_status_changed_chat: this.leavesPreferenceList.actions[2].is_notify_chat,
      },
    };

    this.preferenceService.updatePreferenceList({ leave: leaveNotificationUpdate }).subscribe(
      async (res: any) => {
        if (res && res.success) {
          await this.getPreference();
          await this.initializeLeaveActionClick();
        }
      },
      (err) => {
        console.error(err);
      }
    );
  };

  getProjectList() {
    this.spinnerService.showSpinner();
    this.projectService.getAllProjects().subscribe(
      (response: any) => {
        if (response && response.list) {
          this.projectList = response.list || [];
        }
        this.spinnerService.hideSpinner();
      },
      (error) => {
        this.spinnerService.hideSpinner();
        console.error(error);
      }
    );
  }

  getProjectName = (id: any) => {
    const matchedProject = this.projectList.find((project: any) => parseInt(project.id) === parseInt(id));
    return matchedProject ? matchedProject.project_title : '-';
  };

  changeProjectNotification = (item: any) => {
    item.is_notify = !item.is_notify;
    this.updateSingleProjectPreference(item, item.is_notify ? 0 : 1);
  };

  updateSingleProjectPreference = (project?: any, allaction?: any) => {
    const requestBody = {
      projectUpdates: [
        {
          projectId: project?.project_id,
          allaction: allaction, // pass 0 - true all updateFields || pass 1 - false all updateFields || pass 2 - update updateFields and taskPreferences--> applicable only for project preference
          updateFields: {
            notify_project_update: project?.is_notify,
            notify_project_email: project?.is_notify_email,
            notify_project_push: project?.is_notify_push,
            notify_project_chat: project?.is_notify_chat,
            taskPreferences: {
              notify_add_task: this.findNotifyAction(project.actions, 'notify_add_task'),
              notify_change_task_status: this.findNotifyAction(project.actions, 'notify_change_task_status'),
              notify_change_task_state: this.findNotifyAction(project.actions, 'notify_change_task_state'),
              notify_due_date_changed: this.findNotifyAction(project.actions, 'notify_due_date_changed'),
              notify_assignee_changed: this.findNotifyAction(project.actions, 'notify_assignee_changed'),
              notify_comment_added: this.findNotifyAction(project.actions, 'notify_comment_added'),
            },
          },
        },
      ],
    };
    this.preferenceService.updateAllPreference(requestBody).subscribe(
      (res: any) => {
        if (res && res.success) {
          this.getPreference();
        }
      },
      (err) => {
        console.error(err);
      }
    );
  };

  findNotifyAction(actions: any[], key: string): boolean | undefined {
    return actions.find((action: any) => action.key === key)?.is_notify;
  }

  updateAllProjectAction = (item: any) => {
    item.allowAllNotification = !item?.allowAllNotification;
    /// Update email, push, and chat actions in both project and leavesPreferenceList
    if (item.key == 'is_notify_email' || item.key == 'is_notify_push' || item.key == 'is_notify_chat') {
      const allPreference = [...this.projectPreferenceList];
      if (allPreference.length > 0) {
        for (const pref of allPreference) {
          pref[item.key] = item.allowAllNotification;
        }
      }
    } else {
      // Update other actions in the projectPreferenceList
      if (this.projectPreferenceList.length > 0) {
        for (const project of this.projectPreferenceList) {
          for (const action of project.actions) {
            if (action.key == item.key) {
              action.is_notify = item.allowAllNotification;
            }
          }
        }
      }
    }

    this.updateMultipleProjectPreference();
  };

  updateAllLeaveAction(item: any) {
    item.allowAllNotification = !item?.allowAllNotification;
    const allPreference = [...this.leavesPreferenceList.actions];

    if (allPreference.length > 0) {
      for (const pref of allPreference) {
        pref[item.key] = item.allowAllNotification;
      }
    }
    this.updateLeavePreferences();
  }

  updateMultipleProjectPreference() {
    const transformedData = this.projectPreferenceList.map((project: any) => {
      const taskPreferences = project.actions
        .filter((action: any) => action.key && action.is_notify !== undefined)
        .reduce((acc: any, action: any) => {
          acc[action.key] = action.is_notify;
          return acc;
        }, {});

      return {
        projectId: project.project_id,
        allaction: 2,
        updateFields: {
          notify_project_update: project.is_notify,
          notify_project_email: project.is_notify_email,
          notify_project_push: project.is_notify_push,
          notify_project_chat: project.is_notify_chat,
          taskPreferences: taskPreferences,
        },
      };
    });

    this.preferenceService.updateAllPreference({ projectUpdates: transformedData }).subscribe(
      (res: any) => {
        if (res && res.success) {
          this.getPreference();
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }
}
