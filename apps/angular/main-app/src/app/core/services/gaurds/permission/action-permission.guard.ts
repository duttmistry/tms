import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanMatch, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { Observable } from 'rxjs';
import { StorageService } from '../../common/storage.service';
import { LoginService } from '../../login/login.service';

import { PermissionService } from '../../module/settings/permission/permission.service';
import { PERMISSION_CONSTANTS } from '../../common/constants';

@Injectable({
  providedIn: 'root',
})
export class ActionPermissionGuard implements CanMatch {
  constructor(
    private router: Router,
    private permissionService: PermissionService,
    private storageService: StorageService,
    private loginService: LoginService
  ) {}
  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      let data: any = route.data;
      permission = JSON.parse(Encryption._doDecrypt(permission));

      if (this.permissionService.getModuleActionPermission(permission, data.moduleName, data.actionType)) {
        return true;
      } else {
        this.router.navigate(['unauthorized-access']);
        return false;
      }
    } else {
      this.loginService.logout();
      return false;
    }
  }
}
