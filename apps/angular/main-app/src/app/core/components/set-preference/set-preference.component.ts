import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PreferencesService } from '../../services/module/preferences/preferences.service';
import { Router } from '@angular/router';
import { StorageService } from '../../services/common/storage.service';
import { STORAGE_CONSTANTS } from '../../services/common/constants';
import { Encryption } from '@tms-workspace/encryption';
import { UserService } from '../../services/module/users/users.service';
import { ProjectsService } from '../../services/module/projects/projects.service';
import { FormBuilder, Validators } from '@angular/forms';
@Component({
  selector: 'main-app-set-preference',
  templateUrl: './set-preference.component.html',
  styleUrls: ['./set-preference.component.scss'],
})
export class SetPreferenceComponent implements OnInit {
  userData: any;
  projectIds: any[] = [];
  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });
  notificationTitle = 'Personalize Your Notifications!';
  notificationDescription =
    "Welcome to Cybercom Task Management System! Customize your notification preferences below to stay informed about the projects that matter most to you.Let us know which projects you'd like to receive notifications from and whether you prefer email, push notifications, or chat. Your choices will help us keep you updated in a way that suits your needs.";
  isLinear = false;
  preferenceHeader = [
    {
      label: 'Email',
      key: 'is_notify_email',
      allowAllNotification: false,
      tooltip_message: 'Receive email notification.',
      isGrayBackground: true,
    },
    {
      label: 'Push',
      key: 'is_notify_push',
      allowAllNotification: false,
      tooltip_message: 'Receive push notification.',
      isGrayBackground: true,
    },
    {
      label: 'Chat',
      key: 'is_notify_chat',
      allowAllNotification: false,
      tooltip_message: 'Receive chat notification.',
      isGrayBackground: true,
    },
    {
      label: 'Task',
      key: 'notify_add_task',
      allowAllNotification: false,
      tooltip_message: 'Receive notifications when new task has been created.',
      isGrayBackground: true,
    },
    {
      label: 'Status',
      key: 'notify_change_task_status',
      allowAllNotification: false,
      tooltip_message: 'Receive notifications when task status has been changed.',
      isGrayBackground: true,
    },
    {
      label: 'State',
      key: 'notify_change_task_state',
      allowAllNotification: false,
      tooltip_message: 'Receive notifications when task state has been changed.',
      isGrayBackground: true,
    },
    {
      label: 'Due Date',
      key: 'notify_due_date_changed',
      allowAllNotification: false,
      tooltip_message: 'Receive notifications when due date has been changed.',
      isGrayBackground: true,
    },
    {
      label: 'Assignee',
      key: 'notify_assignee_changed',
      allowAllNotification: false,
      tooltip_message: 'Receive notifications when assignee has been changed.',
      isGrayBackground: true,
    },
    {
      label: 'Comment',
      key: 'notify_comment_added',
      allowAllNotification: false,
      tooltip_message: 'Receive notifications when any comment has been added to the task.',
      isGrayBackground: true,
    },
  ];
  projectPreferenceList: any[] = [];
  projectActions = [
    {
      action_name: 'Task Created',
      key: 'notify_add_task',
      content: 'Receive notifications when new task has been created',
      is_notify: true,
    },
    {
      action_name: 'Status changed',
      key: 'notify_change_task_status',
      content: 'Receive notifications when task status has been changed.',
      is_notify: true,
    },
    {
      action_name: 'State changed',
      key: 'notify_change_task_state',
      content: 'Receive notifications when task state has been changed',
      is_notify: true,
    },
    {
      action_name: 'Due date changed',
      key: 'notify_due_date_changed',
      content: 'Receive notifications when due date has been changed',
      is_notify: true,
    },
    {
      action_name: 'Assignee changed',
      key: 'notify_assignee_changed',
      content: ' Receive notifications when assignee has been changed',
      is_notify: true,
    },
    {
      action_name: 'Comment added',
      key: 'notify_comment_added',
      content: 'Receive notifications when any comment has been added to the task',
      is_notify: true,
    },
  ];
  constructor(
    private preferenceService: PreferencesService,
    private router: Router,
    private storageService: StorageService,
    private userService: UserService,
    private projectService: ProjectsService,
    private _formBuilder: FormBuilder,
    private _cdf: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.userData = this.userService.getUserDataFromLS();
    this.getAllProject();
  }
  onSubmitPreference() {
    this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(true)));
    this.router.navigate(['/']);
    // console.log('this.projectPreferenceList: ', this.projectPreferenceList);
    // this.updatePreferences(this.projectPreferenceList);
    // const reqBody = {
    //   projectIdArray: this.projectIds,
    //   userDeviceToken: this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.FIREBASE_CLOUD_MESSAGING) || '',
    // };
    // this.preferenceService.createPreference(reqBody).subscribe((res: any) => {
    //   if (res && res.data) {
    //     this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(true)));
    //     // location.reload();
    //   }
    // });
  }

  updatePreferences(data: any) {
    // console.log('data: ', data);
    const updatedPreferencesArr: any = [];
    data?.map((item: any) => {
      if (!item?.is_notify) {
        updatedPreferencesArr.push({
          projectId: item?.id?.toString(),
          allaction: 1,
        });
      } else {
        updatedPreferencesArr.push({
          projectId: item?.id?.toString(),
          allaction: 0,
        });
        // item?.map((action: any) => {
        //   if(action?.is_notify){
        //     updatedPreferencesArr.push({
        //       projectId: action?.id,
        //       allaction: 1,
        //     });
        //   }
        // })
      }
    });
    const reqBody = {
      projectUpdates: updatedPreferencesArr,
    };
    // console.log('reqBody: ', reqBody);
    this.preferenceService.updateAllPreference(reqBody).subscribe(
      (res: any) => {
        if (res && res.success) {
          // this.getPreference();
          this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(true)));
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }
  onCancelPreference() {
    this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(false)));
    location.reload();
  }

  getAllProject() {
    this.projectService.getAllProjects().subscribe((response: any) => {
      if (response?.list) {
        this.projectPreferenceList = response.list.map((project: any) => {
          this.projectIds.push(project.id.toString());
          return {
            ...project,
            is_notify: true,
            is_notify_chat: true,
            is_notify_email: true,
            is_notify_push: true,
            actions: this.projectActions,
          };
        });
        const reqBody = {
          projectIdArray: this.projectIds,
          userDeviceToken: this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.FIREBASE_CLOUD_MESSAGING) || '',
        };
        this.preferenceService.createPreference(reqBody).subscribe((res: any) => {
          if (res && res.data) {
            // this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(true)));
            // location.reload();
          }
        });
        this.initializeActionClick();
      } else {
        this.projectIds = [];
        this.projectPreferenceList = [];
        this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(true)));
        this.router.navigate(['/']);
      }
    });
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
      this._cdf.detectChanges();
    }
  }

  // updateAllProjectAction(item: any) {
  //   item.allowAllNotification = !item?.allowAllNotification;
  //   if (item.key == 'is_notify_email' || item.key == 'is_notify_push' || item.key == 'is_notify_chat') {
  //     for (const project of this.projectPreferenceList) {
  //       project[item.key] = item.allowAllNotification;
  //     }
  //   } else {
  //     for (const project of this.projectPreferenceList) {
  //       for (const action of project.actions) {
  //         if (action.key == item.key) {
  //           action.is_notify = item.allowAllNotification;
  //         }
  //       }
  //     }
  //   }
  // }
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
  changeProjectNotification(item: any) {
    item.is_notify = !item.is_notify;
    this.projectPreferenceList = this.projectPreferenceList.map((project) => {
      if (project.id === item.id) {
        return {
          ...project,
          is_notify: item.is_notify,
          is_notify_chat: item.is_notify,
          is_notify_email: item.is_notify,
          is_notify_push: item.is_notify,
          actions: project.actions.map((action: any) => ({
            ...action,
            is_notify: item.is_notify,
          })),
        };
      }
      return project;
    });
    this.updateSingleProjectPreference(item, item.is_notify ? 0 : 1);
  }

  changeProjectNotificationStatus(_projectId: any, updateFor: any) {
    // item[updateFor] = !item[updateFor];
    // this.initializeActionClick();
    if (!_projectId || !updateFor) {
      console.warn('unable to get _projectId or updateFor');
      return;
    }

    const projectPreference = this.projectPreferenceList.find((item: any) => item.id === _projectId);
    if (projectPreference) {
      projectPreference[updateFor] = !projectPreference[updateFor];
      this.updateSingleProjectPreference(projectPreference, 2);
    }
  }

  changeProjectActionNotificationStatus(_projectId: any, updateFor: any) {
    // Create a deep copy of the projectPreferenceList
    const updatedProjectPreferenceList = JSON.parse(JSON.stringify(this.projectPreferenceList));
    const actionsData = updatedProjectPreferenceList.find((project: any) => project.id === _projectId);
    if (!actionsData) {
      console.warn('project not found with the given item');
      return;
    }

    const actionToUpdate = actionsData.actions.find((action: any) => action.key === updateFor);
    if (!actionToUpdate) {
      console.warn('Action not found with the given updateFor key');
      return;
    }
    actionToUpdate.is_notify = !actionToUpdate.is_notify;
    this.projectPreferenceList = updatedProjectPreferenceList;

    this.initializeActionClick();
    this.updateSingleProjectPreference(actionsData, 2);
  }

  trackByFn(index: number, item: any) {
    return item.id;
  }
  findNotifyAction(actions: any[], key: string): boolean | undefined {
    return actions.find((action: any) => action.key === key)?.is_notify;
  }
  updateSingleProjectPreference = (project?: any, allaction?: any) => {
    const requestBody = {
      projectUpdates: [
        {
          projectId: project?.id?.toString(),
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
          // console.log('res.success: ', res.success);
        }
      },
      (err) => {
        console.error(err);
      }
    );
  };
  updateMultipleProjectPreference() {
    const transformedData = this.projectPreferenceList.map((project: any) => {
      const taskPreferences = project.actions
        .filter((action: any) => action.key && action.is_notify !== undefined)
        .reduce((acc: any, action: any) => {
          acc[action.key] = action.is_notify;
          return acc;
        }, {});

      return {
        projectId: project?.id?.toString(),
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

    // console.log('transformedData: ', transformedData);
    this.preferenceService.updateAllPreference({ projectUpdates: transformedData }).subscribe(
      (res: any) => {
        if (res && res.success) {
          // console.log('res.success: ', res.success);
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }
}
