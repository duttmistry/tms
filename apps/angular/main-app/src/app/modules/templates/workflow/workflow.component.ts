import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { WorkflowService } from '../../../core/services/module/template/workflow.service';
import { TemplateService } from '../../../core/services/module/template/template.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { ACTION_CONSTANTS, PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'main-app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
})
export class WorkflowComponent implements OnInit {
  displayedColumns: string[] = ['template', 'actions', 'action'];
  dataSource = new MatTableDataSource();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  requestObject = {
    page: 1,
    limit: 10,
    sortBy: 'name',
    orderBy: 'asc',
    search: '',
    role_id: '',
  };
  allowAdd = false;
  allowEdit = false;
  allowDelete = false;
  actionsList: any[] = [];
  templatesList: any[] = [];
  workflowForm: FormGroup;
  isEditWorkFlow = false;
  editedTemplateId = '';
  showSpinner = true;
  constructor(
    private _wfs: WorkflowService,
    private _tempService: TemplateService,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef
  ) {
    this.checkForActionPermission();
    this.workflowForm = this.fb.group({
      templateControl: [''],
      actionControl: [''],
    });
  }

  ngOnInit() {
    this.getTemplates();
    this.getActionsList();
    this.getWorkFlow();

    if (!this.allowDelete || !this.allowEdit) {
      this.displayedColumns = ['template', 'actions'];
    }
  }
  checkForActionPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowAdd = this.permissionService.getModuleActionPermission(permission, 'templates.workflow', ACTION_CONSTANTS.CREATE); // add template.workflow after permission object update
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, 'templates.workflow', ACTION_CONSTANTS.EDIT);
      this.allowDelete = this.permissionService.getModuleActionPermission(permission, 'templates.workflow', ACTION_CONSTANTS.DELETE);
    } else {
      this.router.navigate(['unauthorized-access']);
    }
  }

  getTemplates() {
    this._tempService.getTemplatesList().subscribe(
      (res: any) => {
        if (res && res?.data) {
          this.templatesList = res.data;
        } else {
          this.templatesList = [];
        }
      },
      (err) => {
        console.log('error', err);
      }
    );
  }

  getWorkFlow() {
    this.showSpinner = true;
    this._wfs.getWorkFlow().subscribe(
      (res: any) => {
        if (res && res?.data) {
          this.dataSource = new MatTableDataSource<any>(res.data);
          this.showSpinner = false;
        } else {
          this.dataSource = new MatTableDataSource<any>([]);
          this.showSpinner = false;
        }
      },
      (err) => {
        console.log('error', err);
        this.showSpinner = false;
      }
    );
  }

  getActionsList() {
    this._wfs.getWorkflowAction().subscribe(
      (res: any) => {
        if (res && res?.data) {
          this.actionsList = res.data;
        }
      },
      (err) => {
        console.log('error', err);
      }
    );
  }
  onEditWorkflow(item: any) {
    console.log('item', item);
    if (item) {
      this.isEditWorkFlow = true;
      this.workflowForm.patchValue({
        templateControl: item?.emailTemplateId?._id,
        actionControl: item?.actionId?._id,
      });
      this.editedTemplateId = item?._id || '';
    }
    this.cdRef.detectChanges();
  }

  onDeleteWorkFlow(item: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Are you sure you want to delete workflow? `,
      },
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this._wfs.deleteWorkFlow(item?._id).subscribe(
          (res: any) => {
            if (res && res.success) {
              this.getWorkFlow();
            }
          },
          (err) => {
            console.log('error', err);
          }
        );
      }
    });
  }

  trackByFn(index: number, item: any) {
    return item.id;
  }

  // onChangeTemplate() {
  //   console.log('onChangeTemplate', this.workflowForm?.value);
  // }

  // onChangeAction() {
  //   console.log('onChangeAction', this.workflowForm?.value);
  // }

  onClickSave() {
    const req_body = {
      emailTemplateId: this.workflowForm?.controls['templateControl'].value || '',
      actionId: this.workflowForm?.controls['actionControl'].value || '',
    };
    const workflowObservable = this.isEditWorkFlow
      ? this._wfs.editWorkflowAction(req_body, this.editedTemplateId)
      : this._wfs.addWorkflowAction(req_body);

    workflowObservable.subscribe(
      (res: any) => {
        this.getWorkFlow();
        this.onClickReset();
      },
      (err) => {
        console.log('error:', err);
      }
    );
  }

  onClickReset() {
    this.workflowForm.reset();
    this.isEditWorkFlow = false;
    this.editedTemplateId = '';
  }
}
