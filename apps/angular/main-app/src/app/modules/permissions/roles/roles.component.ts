import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleService } from '../../../core/services/module/settings/role/role.service';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { Encryption } from '@tms-workspace/encryption';
import { Router } from '@angular/router';
import { ACTION_CONSTANTS, PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';

@Component({
  selector: 'main-app-role',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent {
  @ViewChild('searchRole') searchRole!: ElementRef;
  title = new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(50), this.specialCharactersValidator()]);
  userRoles = new MatTableDataSource();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  displayedColumns: string[] = ['roles', 'actions'];

  editRole: any = null;
  isEdit = false;

  public allowDelete!: boolean;
  public allowEdit!: boolean;
  public allowAdd!: boolean;
  public showSpinner = true;
  constructor(
    private roleService: RoleService,
    private dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private router: Router
  ) {
    this.getAllUserRoles();
    this.checkForActionPermission();
    if (!this.allowEdit && !this.allowDelete) {
      this.displayedColumns = ['roles'];
    }
  }

  getAllUserRoles() {
    this.showSpinner = true;
    this.roleService.getAllRoles().subscribe(
      (res: any) => {
        if (res) {
          const roles = res.data;
          this.userRoles = new MatTableDataSource(roles);
        }
        this.showSpinner = false;
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }

  onEditRole(data: any) {
    this.isEdit = true;
    this.editRole = data;
    this.searchRole?.nativeElement.focus();
    this.title.setValue(this.editRole.title);
  }

  onCancel() {
    this.isEdit = false;
    this.editRole = null;

    this.title.reset();
  }
  onDeleteRole(id: number, name: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Are you sure you want to delete ${name} ?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.roleService.deleteRole(id).subscribe((res: any) => {
          this.getAllUserRoles();
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: res.message },
          });
          // console.log(res);
        });
      }
    });
  }

  onSave() {
    if (this.title.valid) {
      const roleTitle = this.title.value as string;
      const isExist = this.userRoles.filteredData.some((role: any) => role.title.trim() === roleTitle.trim());
      if (isExist) {
        this.isEdit = true;
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'A role with this title already exists.' },
          duration: 45000,
        });
        return;
      }
      if (this.isEdit) {
        this.roleService.updateRole({ title: roleTitle }, this.editRole.id).subscribe(
          (res: any) => {
            this.isEdit = false;
            this.editRole = null;
            this.title.reset();
            this.getAllUserRoles();
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: res.message },
            });
          },
          (error) => {
            this.isEdit = true;
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: error.error.message },
              duration: 45000,
            });
          }
        );
      } else {
        this.roleService.addRole(roleTitle).subscribe(
          (res: any) => {
            this.title.reset();
            this.getAllUserRoles();
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: res.message },
            });
          },
          (error) => {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: error.error.message },
              duration: 45000,
            });
          }
        );
      }
    } else {
      this.title.markAsTouched();
    }
  }
  // This method used for allows only the characters "." and "&" as special characters while disallowing whitespace.
  public specialCharactersValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value: string = control.value;
      const regex = /^(?!\s)[A-Za-z0-9&\s]*\.?[A-Za-z0-9&\s]*$/;
      if (!regex.test(value)) {
        return { specialCharacters: true };
      }
      return null;
    };
  }

  public checkForActionPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowAdd = this.permissionService.getModuleActionPermission(permission, 'permissions.roles', ACTION_CONSTANTS.CREATE);
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, 'permissions.roles', ACTION_CONSTANTS.EDIT);
      this.allowDelete = this.permissionService.getModuleActionPermission(permission, 'permissions.roles', ACTION_CONSTANTS.DELETE);
    } else {
      this.router.navigate(['unauthorized-access']);
    }
  }
}
