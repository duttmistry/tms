import { FlatTreeControl } from '@angular/cdk/tree';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { PreferencesService } from '../../../core/services/module/preferences/preferences.service';
import { MatSnackBar } from '@angular/material/snack-bar';
export interface INotification {
  module_name: string;
  id: string;
  is_notify?: boolean;
  children?: INotification[];
}

interface NotificationFlatNode {
  expandable: boolean;
  module_name: string;
  is_notify: boolean;
  level: number;
}
@Component({
  selector: 'main-app-pref-leaves',
  templateUrl: './pref-leaves.component.html',
  styleUrls: ['./pref-leaves.component.scss'],
})
export class PrefLeavesComponent {
  displayedColumns: string[] = ['module_name', 'notify'];
  treeFlattener: any;
  treeControl = new FlatTreeControl<NotificationFlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );
  dataSource: any;
  leavePrefList: any;
  constructor(private spinnerService: SpinnerService, private preferenceService: PreferencesService, private _snackBar: MatSnackBar) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      (node) => node.level,
      (node) => node.expandable,
      (node) => node.children
    );
    this.getPreferenceList();
  }

  private transformer = (node: INotification, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.module_name,
      id: node.id,
      is_notify: node.is_notify,
      level: level,
    };
  };

  onChangeStatus(event: any) {
    this.dataSource.data.map((elm: any) => {
      if (elm.id === event.id) {
        elm.is_notify = event.is_notify;
      } else if (elm.children) {
        elm.children.map((child: any) => {
          if (child.id === event.id) {
            child.is_notify = event.is_notify;
          }
        });
      }
    });
  }

  getPreferenceList() {
    try {
      this.preferenceService.getPreferenceList().subscribe((res: any) => {
        //   if (res && res.data) {
        //     const { Leave } = res.data;
        //     if (Leave && Leave.children.length) {
        //       const leaveObj = {
        //         module_name: 'Leave',
        //         id: 'leave_0',
        //         is_notify: Leave.is_notify,
        //         children: Leave.children.map((m: any, ind: number) => ({
        //           module_name: m.action_name,
        //           id: this.generateNodeId(m.action_name) + '_' + ind,
        //           is_notify: m.is_notify,
        //         })),
        //       };
        //       this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
        //       this.dataSource.data = [leaveObj];
        //     }
        //   }
        // });

        if (res && res.data) {
          if (res.data.Leave) {
            const { Leave } = res.data;
            this.leavePrefList = Leave;
          } else {
            this.leavePrefList = [];
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  generateNodeId(str: string) {
    return str.replace(/\s+/g, '_').toLowerCase();
  }

  onCancelClick() {
    this.getPreferenceList();
  }

  async onSaveClick() {
    // this.spinnerService.showSpinner();
    // if (this.dataSource.data && this.dataSource.data.length) {
    //   const { data } = this.dataSource;
    //   const finalObject: {
    //     leaveUpdate: boolean;
    //     leave: { [moduleName: string]: boolean };
    //   } = {
    //     leaveUpdate: data[0].is_notify,
    //     leave: {},
    //   };

    //   data[0].children.forEach((child: any) => {
    //     const moduleName = child.module_name.replace(/\s/g, '');
    //     finalObject.leave[moduleName] = child.is_notify;
    //   });

    //   await this.updateLeavePreferenceData(finalObject);
    // }

    const result = this.leavePrefList.actions.reduce(
      (obj: any, item: any) => {
        obj.leave[item.key] = item.is_notify;
        return obj;
      },
      {
        leaveUpdate: this.leavePrefList.is_notify,
        leave: {},
      }
    );
    this.updateLeavePreferenceData(result);
  }

  updateLeavePreferenceData(reqBody: any) {
    this.preferenceService.updateLeavePreference(reqBody).subscribe(async (res: any) => {
      if (res && res.data) {
        this._snackBar.open(res.message);
        await this.getPreferenceList();
      }
      this.spinnerService.hideSpinner();
    });
  }
}
