/* eslint-disable prefer-const */
import { AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { DynamicDirective } from './dynamic/dynamic.directive';
import { StatusComponent } from './status/status.component';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
import { Encryption } from '@tms-workspace/encryption';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { LoginService } from '../../../core/services/login/login.service';
import { ACTION_CONSTANTS, MODULE_CONSTANTS, PERMISSION_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-project-setting',
  templateUrl: './project-setting.component.html',
  styleUrls: ['./project-setting.component.scss'],
})
export class ProjectSettingComponent implements OnInit, AfterViewInit {
  // @ViewChild(DynamicDirective, { static: true }) private dynamicHost!: DynamicDirective;

  // viewContainerRef!: ViewContainerRef;
  projectId: any;
  projectName: any;
  actionPermissionData: any;
  selectedField: any;
  isAllowStatus = false;
  isAllowCustomFields = false;

  constructor(
    private loginService: LoginService,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectsService,
    private router: Router
  ) {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.actionPermissionData = this.permissionService.getModuleActionPermissionData(
        permission,
        MODULE_CONSTANTS.PROJECT,
        ACTION_CONSTANTS.SETTINGS
      );
    } else {
      this.loginService.logout();
    }
  }

  ngOnInit(): void {
    this.projectId = this.activatedRoute.snapshot.params['id'];
    console.log(this.projectId);
    this.projectService.getProjectById(this.projectId).subscribe((res) => {
      this.projectName = res.name;
    });
  }

  ngAfterViewInit(): void {
    // this.viewContainerRef = this.dynamicHost.viewContainerRef;
    // this.viewContainerRef.clear();
    this.setPermission();
  }

  setPermission() {
    let statusObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['status'] !== undefined);
    this.isAllowStatus = statusObject && statusObject['status'] ? true : false;
    let customFieldObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['custom_fields'] !== undefined);
    this.isAllowCustomFields = customFieldObject && customFieldObject['custom_fields'] ? true : false;
    // if (this.isAllowStatus) {
    //   this.selectField('status');
    // } else if (this.isAllowCustomFields) {
    //   this.selectField('custom_fields');
    // }
  }

  // selectField(field: string) {
  //   if (field == 'status') {
  //     this.selectedField = 'status';
  //     this.viewContainerRef.clear();

  //     const componentRef = this.viewContainerRef.createComponent<StatusComponent>(StatusComponent);
  //   } else if (field == 'custom_fields') {
  //     this.selectedField = 'custom_fields';

  //     this.viewContainerRef.clear();

  //     const componentRef = this.viewContainerRef.createComponent<CustomFieldsComponent>(CustomFieldsComponent);
  //   }
  //   console.log('filed::', field);
  // }

  navigateToEditProject() {
    this.router.navigate(['project', 'edit', this.projectId]);
  }
}
