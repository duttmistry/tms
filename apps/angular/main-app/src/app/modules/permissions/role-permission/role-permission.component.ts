import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { RoleService } from '../../../core/services/module/settings/role/role.service';
import { RolePermissionService } from '../../../core/services/module/settings/role-permission/role-permission.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { ACTION_CONSTANTS, PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { el } from '@fullcalendar/core/internal-common';
@Component({
  selector: 'app-role-permission',
  templateUrl: './role-permission.component.html',
  styleUrls: ['./role-permission.component.scss'],
})
export class RolePermissionComponent implements OnInit, OnDestroy {
  // items!: TreeviewItem[];
  userRoles: any;
  // treeData: TreeviewItem[] = [];
  // config = TreeviewConfig.create({
  //   hasAllCheckBox: false,
  //   hasCollapseExpand: false,
  //   hasFilter: false,
  //   decoupleChildFromParent: false,
  // });
  permissionArray: any = [];
  subscriptions: Subscription[] = [];
  public allowEdit!: boolean;
  public originalPermissionArray: any;
  showSpinner = true;
  constructor(
    private roleService: RoleService,
    private rolePermissionService: RolePermissionService,
    private _snackBar: MatSnackBar,
    private spinnerService: SpinnerService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.getUserRolePermission();
    this.getAllUserRoles();
    this.checkForActionPermission();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  // get user role permissions
  getUserRolePermission() {
    this.showSpinner = true;
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.rolePermissionService.getUserRolePermission().subscribe(
        (res: any) => {
          if (res) {
            if (res.data && res.data.length > 0) {
              this.permissionArray = res.data || [];
              this.originalPermissionArray = JSON.parse(JSON.stringify(this.permissionArray));
              this.preProcessData();
            }
            this.spinnerService.hideSpinner();
            this.showSpinner = true;
          }
        },
        (err: any) => {
          this.showSpinner = true;
        }
      )
    );
  }

  preProcessData() {
    let count = 1;
    this.permissionArray.forEach((permissionObject: any) => {
      const newPermissionObect = permissionObject?.moduleControls.filter((data: any) => data.roleType.toLowerCase() !== 'super admin');
      permissionObject.moduleControls = newPermissionObect;
      // set id for module control checkboxes
      if (permissionObject.moduleControls && permissionObject.moduleControls.length > 0) {
        permissionObject.moduleControls.forEach((moduleControlObject: any) => {
          moduleControlObject.id = count;
          count++;
        });
      }
      // set id for action control checkboxes
      if (permissionObject.actions && permissionObject.actions.length > 0) {
        permissionObject.actions.forEach((actionObject: any) => {
          const newActionObject = actionObject?.actionControls.filter((data: any) => data.roleType.toLowerCase() !== 'super admin');
          actionObject.actionControls = newActionObject;
          if (actionObject.actionControls && actionObject.actionControls.length > 0) {
            actionObject.actionControls.forEach((actionControlObject: any) => {
              actionControlObject.id = count;
              count++;
            });
          }

          // set id for field control checkboxes
          if (actionObject.fields && actionObject.fields.length > 0) {
            actionObject.fields.forEach((fieldObject: any) => {
              const newFieldObject = fieldObject?.fieldControls.filter((data: any) => data.roleType.toLowerCase() !== 'super admin');
              fieldObject.fieldControls = newFieldObject;
              if (fieldObject.fieldControls && fieldObject.fieldControls.length > 0) {
                fieldObject.fieldControls.forEach((fieldControlObject: any) => {
                  fieldControlObject.id = count;
                  count++;
                });
              }
            });
          }
        });
      }
    });
  }

  // get user roles to display in table heading
  getAllUserRoles() {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.roleService.getAllRoles().subscribe(
        (res: any) => {
          if (res) {
            if (res.data && res.data.length > 0) {
              // Remove super admin column from table
              this.userRoles = res.data.filter((m: any) => m.title.toLowerCase() !== 'super admin');
              // this.userRoles = res.data;
            }
            this.spinnerService.hideSpinner();
          }
        },
        (error: any) => {
          console.log('error:', error);
          this.spinnerService.hideSpinner();
        }
      )
    );
  }

  // save role permissions
  onSave() {
    const userRoleRequestArray: any = [];
    this.userRoles.forEach((userRoleObject: any, userRoleIndex: number) => {
      const singleUserRole: any = [];
      this.permissionArray.forEach((permissionObject: any) => {
        let requestPermissionObject: any;
        if (permissionObject.moduleControls[userRoleIndex] && permissionObject.moduleControls[userRoleIndex].checked) {
          requestPermissionObject = {
            [permissionObject.moduleName]: true,
          };
        } else {
          requestPermissionObject = {
            [permissionObject.moduleName]: false,
          };
        }
        const actionsArray: any = [];
        permissionObject.actions.forEach((actionObject: any) => {
          let requestActionObject: any;
          if (actionObject.actionControls[userRoleIndex] && actionObject.actionControls[userRoleIndex].checked) {
            requestActionObject = {
              [actionObject.actionName]: true,
            };
          } else {
            requestActionObject = {
              [actionObject.actionName]: false,
            };
          }
          requestActionObject['fields'] = [];
          const fieldsArray: any = [];
          actionObject.fields.forEach((fieldObject: any) => {
            if (fieldObject.fieldControls[userRoleIndex]) {
              fieldsArray.push({
                [fieldObject.name]: fieldObject.fieldControls[userRoleIndex].checked,
                is_required: fieldObject.fieldControls[userRoleIndex].is_required,
              });
            }
          });
          requestActionObject['fields'] = fieldsArray;
          actionsArray.push(requestActionObject);
        });
        requestPermissionObject.actions = actionsArray;
        singleUserRole.push(requestPermissionObject);
      });
      const moduleObject = {
        id: userRoleObject.id || '',
        value: singleUserRole,
      };
      userRoleRequestArray.push(moduleObject);
    });
    if (userRoleRequestArray && userRoleRequestArray.length > 0) {
      const body = {
        permission: userRoleRequestArray,
      };
      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.rolePermissionService.updateUserRolePermission(body).subscribe(
          (response: any) => {
            if (response) {
              if (response.message) {
                // this._snackBar.open(response.message);
                this._snackBar.openFromComponent(SnackbarComponent, {
                  data: { message: response?.message },
                });
              }
              this.spinnerService.hideSpinner();
            }
          },
          (error: any) => {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: error?.message },
              duration: 45000,
            });
            // console.log('error', error);
            this.spinnerService.hideSpinner();
          }
        )
      );
    }
  }

  // Toggle permission module wise
  onModuleStatusChange(event: any, moduleIndex: any, moduleControlIndex: number) {
    this.permissionArray[moduleIndex].moduleControls[moduleControlIndex].checked = event.target.checked;
    this.permissionArray[moduleIndex].actions.forEach((actionObject: any) => {
      actionObject.actionControls[moduleControlIndex].checked = event.target.checked;
      actionObject.fields.forEach((fieldObject: any) => {
        fieldObject.fieldControls[moduleControlIndex].checked = event.target.checked;
      });
    });
  }

  // Toggle permission Action wise
  onActionStatusChange(event: any, moduleIndex: number, actionObjectIndex: number, actionControlIndex: number) {
    this.permissionArray[moduleIndex].actions[actionObjectIndex].actionControls[actionControlIndex].checked = event.target.checked;
    this.permissionArray[moduleIndex].actions[actionObjectIndex].fields.forEach((fieldObject: any) => {
      if (fieldObject.fieldControls && fieldObject.fieldControls.length > 0) {
        fieldObject.fieldControls[actionControlIndex].checked = event.target.checked;
      }
    });
    let count = 0;
    // check if all actions are checked then set module's checked to true;
    if (event.target.checked) {
      this.permissionArray[moduleIndex].actions.forEach((actionObject: any) => {
        if (actionObject.actionControls && actionObject.actionControls.length > 0) {
          if (actionObject.actionControls[actionControlIndex].checked) {
            count++;
          }
        }
      });
      this.permissionArray[moduleIndex].moduleControls[actionControlIndex].checked = event.target.checked;
    } else if (!event.target.checked) {
      // check if all actions are checked to false then update module control of those actions to false
      this.permissionArray[moduleIndex].actions.forEach((actionObject: any) => {
        if (actionObject.actionControls && actionObject.actionControls.length > 0) {
          if (!actionObject.actionControls[actionControlIndex].checked) {
            count++;
          }
        }
      });
    }
    if (count == this.permissionArray[moduleIndex].actions.length) {
      this.permissionArray[moduleIndex].moduleControls[actionControlIndex].checked = event.target.checked;
    }
  }

  // Toggle permission fields wise
  onFieldStatusChange(event: any, moduleIndex: number, actionObjectIndex: number, fieldIndex: number, controlIndex: number) {
    this.permissionArray[moduleIndex].actions[actionObjectIndex].fields[fieldIndex].fieldControls[controlIndex].checked = event.target.checked;
    // check if field is checked then check all fields which are required = true
    this.permissionArray[moduleIndex].actions[actionObjectIndex].fields.forEach((fieldObject: any) => {
      if (fieldObject.fieldControls[controlIndex].is_required) {
        fieldObject.fieldControls[controlIndex].checked = true;
      }
    });
    // check if all fields are checked to true then set action's checked to true;
    let count = 0;
    if (event.target.checked) {
      this.permissionArray[moduleIndex].actions[actionObjectIndex].fields.forEach((fieldObject: any) => {
        if (fieldObject.fieldControls[controlIndex].checked) {
          count++;
        }
      });
      this.permissionArray[moduleIndex].actions[actionObjectIndex].actionControls[controlIndex].checked = event.target.checked;
    } else if (!event.target.checked) {
      // check if all fields are checked to false then update action control of those fields to false
      this.permissionArray[moduleIndex].actions[actionObjectIndex].fields.forEach((fieldObject: any) => {
        if (!fieldObject.fieldControls[controlIndex].checked) {
          count++;
        }
      });
    }
    if (count == this.permissionArray[moduleIndex].actions[actionObjectIndex].fields.length) {
      this.permissionArray[moduleIndex].actions[actionObjectIndex].actionControls[controlIndex].checked = event.target.checked;
    }
  }

  // To confirm that permission changes will be discarded
  onCancelClick() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Are you sure you want to discard changes?`,
      },
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.permissionArray = [];
          this.getUserRolePermission();
        }
      })
    );
  }

  public checkForActionPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, 'permissions.permissions', ACTION_CONSTANTS.EDIT);
    } else {
      this.router.navigate(['unauthorized-access']);
    }
  }

  expandModule(module: any) {
    this.permissionArray.forEach((elm: any) => {
      if (elm.moduleName == module.moduleName) {
        elm.isExpandModule = !elm.isExpandModule;
        if (elm.actions) {
          elm.actions.map((m: any) => (m.isExpandAction = false));
        }
      } else {
        elm.isExpandModule = false;
      }
    });
  }
  expandActionModule(node: any, permissionObject: any) {
    const foundModule = this.permissionArray.find((elm: any) => elm.moduleName === permissionObject.moduleName);
    if (foundModule) {
      foundModule.actions.forEach((elm: any) => {
        elm.isExpandAction = elm.actionName === node.actionName && !elm.isExpandAction;
      });
    }
  }

  expandFieldModule(node: any) {
    // console.log('field node expand', node);
  }

  isFieldControlDisabled(fieldControl: any, permissionObjectIndex: number, actionObjectIndex: number, fieldIndex: number, controlIndex: number) {
    // debugger;
    // console.log('fieldControl:', fieldControl);
    // console.log('permissionObjectIndex:', permissionObjectIndex);
    // console.log('actionObjectIndex:', actionObjectIndex);
    // console.log('fieldIndex:', fieldIndex);
    // console.log('controlIndex:', controlIndex);
    if (!this.permissionArray[permissionObjectIndex].actions[actionObjectIndex].actionControls[controlIndex].checked) {
      return false;
    } else if (this.permissionArray[permissionObjectIndex].actions[actionObjectIndex].actionControls[controlIndex].checked) {
      if (fieldControl.is_required) {
        return true;
      } else {
        return fieldControl.checked;
      }
    } else {
      return fieldControl.checked;
    }
  }

  // This method used for reset the selected|unselect checkbox
  public onReset() {
    this.permissionArray = JSON.parse(JSON.stringify(this.originalPermissionArray));
    this.preProcessData();
  }
}
