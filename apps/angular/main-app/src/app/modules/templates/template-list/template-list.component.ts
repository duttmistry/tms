import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplateService } from '../../../core/services/module/template/template.service';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { ACTION_CONSTANTS, PERMISSION_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'main-app-template-list',
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.scss'],
})
export class TemplateListComponent {
  displayedColumns: string[] = ['name', 'status', 'subject', 'action'];
  dataSource = new MatTableDataSource();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  requestObject = {
    page: 1,
    limit: 10,
    sortBy: 'first_name',
    orderBy: 'asc',
    search: '',
    role_id: '',
  };
  allowAdd = false;
  allowEdit = false;
  allowDelete = false;
  allowAddWokflow = false;
  showSpinner = true;
  constructor(
    private templateService: TemplateService,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private storageService: StorageService,
    private permissionService: PermissionService
  ) {
    this.getTemplateList();
    this.checkForActionPermission();
    if (!this.allowDelete || !this.allowEdit) {
      this.displayedColumns = ['name', 'status'];
    }
  }

  getTemplateList() {
    this.showSpinner = true;
    this.templateService.getTemplatesList().subscribe(
      (res: any) => {
        if (res && res.data) {
          if (res.data && res.data.length == 0) {
            this.dataSource = new MatTableDataSource<any>([]);
            this.showSpinner = false;
          }
          this.dataSource = new MatTableDataSource<any>(res.data);
          this.showSpinner = false;
        }
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }

  addNewTemplate() {
    this.router.navigate(['/templates/add']);
  }

  onEditTemplate(el: any) {
    this.router.navigate(['templates/edit', Encryption._doEncrypt(el._id)]);
  }

  onDeleteTemplate(el: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Are you sure you want to delete ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.templateService.deleteTemplate(el._id).subscribe((res: any) => {
          if (res && res.status === 200) {
            this.getTemplateList();
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: res.message },
              duration: 45000,
            });
          }
        });
      }
    });
  }

  checkForActionPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowAdd = this.permissionService.getModuleActionPermission(permission, 'templates', ACTION_CONSTANTS.CREATE);
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, 'templates', ACTION_CONSTANTS.EDIT);
      this.allowDelete = this.permissionService.getModuleActionPermission(permission, 'templates', ACTION_CONSTANTS.DELETE);
      this.allowAddWokflow = this.permissionService.getModuleActionPermission(permission, 'templates.workflow', ACTION_CONSTANTS.CREATE);
    } else {
      this.router.navigate(['unauthorized-access']);
    }
  }

  addWorkflow() {
    this.router.navigate(['templates', 'workflow']);
  }
}
