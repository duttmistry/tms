import { Component, OnDestroy, OnInit } from '@angular/core';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'main-app-site-settings-container',
  templateUrl: './site-settings-container.component.html',
  styleUrls: ['./site-settings-container.component.scss'],
})
export class SiteSettingsContainerComponent implements OnInit, OnDestroy {
  sidebarSectionList = [
    {
      title: 'Leave',
      route: 'leave',
      moduleName: 'site_settings.leave',
    },
    {
      title: 'Timing Configuration',
      route: 'timing-config',
      moduleName: 'site_settings.timing_configuration',
    },
    {
      title: 'Tags',
      route: 'tags',
      moduleName: 'site_settings.tags',
    },
    {
      title: 'Users Configuration',
      route: 'user_configuration',
      moduleName: 'site_settings.user_config',
    },
    {
      title: 'Network Configuration',
      route: 'network_configuration',
      moduleName: 'site_settings.network_configuration',
    },
  ];
  activeLink = this.sidebarSectionList[0].title;

  subscription!: Subscription;
  constructor(private storageService: StorageService, private router: Router, private permissionService: PermissionService) {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));

      this.sidebarSectionList = this.sidebarSectionList.filter((section) =>
        this.permissionService.getModuleActionPermission(permission, section.moduleName, 'view')
      );
      // console.log('url', this.router.url);
      if (this.router.url == '/site-settings') {
        if (this.sidebarSectionList.length) {
          this.activeLink = this.sidebarSectionList[0].title;
          this.router.navigate(['site-settings', this.sidebarSectionList[0].route]);
        } else {
          this.router.navigate(['unauthorized-access']);
        }
      } else if (this.router.url == '/site-settings/leave') {
        this.activeLink = 'Leave';
      } else if (this.router.url == '/site-settings/timing-config') {
        this.activeLink = 'Timing Configuration';
      } else if (this.router.url == '/site-settings/tags') {
        this.activeLink = 'Tags';
      } else if (this.router.url == '/site-settings/user_configuration') {
        this.activeLink = 'User Configuration';
      } else if (this.router.url == '/site-settings/network_configuration') {
        this.activeLink = 'Network Configuration';
      }
      this.subscription = this.router.events.subscribe((val) => {
        // see also
        if (val instanceof NavigationEnd) {
          if (val.url == '/site-settings') {
            if (this.sidebarSectionList.length) {
              this.activeLink = this.sidebarSectionList[0].title;
              this.router.navigate(['site-settings', this.sidebarSectionList[0].route]);
            } else {
              this.router.navigate(['unauthorized-access']);
            }
          }
        }
      });
    }
  }
  ngOnDestroy(): void {
    this.subscription ? this.subscription.unsubscribe() : '';
  }
  ngOnInit(): void {
    console.log();
  }
}
