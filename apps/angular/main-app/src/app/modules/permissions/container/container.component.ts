import { Component, OnDestroy, OnInit } from '@angular/core';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'main-app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss'],
})
export class ContainerComponent implements OnInit, OnDestroy {
  subscription!: Subscription;
  sidebarSectionList = [
    {
      title: 'Users',
      route: 'users',
      moduleName: 'permissions.users',
    },
    {
      title: 'Permissions',
      route: 'permissions',
      moduleName: 'permissions.permissions',
    },
    {
      title: 'Roles',
      route: 'roles',
      moduleName: 'permissions.roles',
    },
  ];
  activeLink = this.sidebarSectionList[0].title;
  constructor(private storageService: StorageService, private router: Router, private permissionService: PermissionService) {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.sidebarSectionList = this.sidebarSectionList.filter((section) =>
        this.permissionService.getModuleActionPermission(permission, section.moduleName, 'view')
      );
    }

    if (this.router.url == '/permissions') {
      if (this.sidebarSectionList.length) {
        this.activeLink = this.sidebarSectionList[0].title;
        this.router.navigate(['permissions', this.sidebarSectionList[0].route]);
      } else {
        this.router.navigate(['unauthorized-access']);
      }
    }

    this.subscription = this.router.events.subscribe((val) => {
      // see also
      if (val instanceof NavigationEnd) {
        if (val.url == '/permissions') {
          if (this.sidebarSectionList.length) {
            this.activeLink = this.sidebarSectionList[0].title;
            this.router.navigate(['permissions', this.sidebarSectionList[0].route]);
          } else {
            this.router.navigate(['unauthorized-access']);
          }
        }
      }
    });
  }
  ngOnDestroy(): void {
    this.subscription ? this.subscription.unsubscribe() : '';
  }
  ngOnInit(): void {}
}
