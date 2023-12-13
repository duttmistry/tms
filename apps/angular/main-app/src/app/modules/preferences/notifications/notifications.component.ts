import { Component, OnInit } from '@angular/core';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { PreferencesService } from '../../../core/services/module/preferences/preferences.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'main-app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  notificationPrefList: any;
  constructor(private preferenceService: PreferencesService, private _snackBar: MatSnackBar, private spinnerService: SpinnerService) {}
  ngOnInit(): void {
    this.getPreferenceList();
  }

  getPreferenceList() {
    try {
      this.preferenceService.getPreferenceList().subscribe((res: any) => {
        // let projPref;
        //   if (res && res.data) {
        //     this.preferenceList.push(res.data);
        //     const { Projects } = res.data;
        //     projPref = Projects.map((m: any, index: number) => {
        //       return {
        //         module_name: 'project',
        //         id: 'project_' + index,
        //         notify: m.is_notify || false,
        //         children: m.children.map((child: any, ind: number) => {
        //           return {
        //             module_name: child.action_name,
        //             notify: child.is_notify || false,
        //             id: this.generateNodeId(child.action_name) + '_' + ind,
        //           };
        //         }),
        //       };
        //     });
        //     console.log('PROJ PREF', projPref[0]);
        //     this.dataSource.data = [projPref[0]];
        //   }
        // });
        if (res && res.data) {
          if (res.data.Notifications) {
            const { Notifications } = res.data;
            this.notificationPrefList = Notifications;
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  onCancelClick() {
    this.getPreferenceList();
  }

  async onSaveClick() {
    this.spinnerService.showSpinner();
    const result = this.notificationPrefList.reduce((obj: any, item: any) => {
      obj[item.key] = item.is_notify;
      return obj;
    }, {});
    await this.updateNotificationPref(result);
  }

  updateNotificationPref(reqBody: any) {
    this.preferenceService.updateNotificationPreference(reqBody).subscribe(async (res: any) => {
      if (res && res.data) {
        this._snackBar.open(res.message);
        await this.getPreferenceList();
      }
      this.spinnerService.hideSpinner();
    });
  }
}
