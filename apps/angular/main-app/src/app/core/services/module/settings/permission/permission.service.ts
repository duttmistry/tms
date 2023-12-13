import { Injectable } from '@angular/core';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../../common/storage.service';
import { LoginService } from '../../../login/login.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor() {}

  getModulePermissionData(permission: any, moduleName: string) {
    if (permission && permission.length > 0) {
      const module = permission.find((item: any) => item.hasOwnProperty(moduleName));
      if (module) {
        return module;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  getModulePermission(permission: any, moduleName: string) {
    const module = this.getModulePermissionData(permission, moduleName);

    if (module) {
      return module[moduleName];
    } else {
      return false;
    }
  }

  getModuleActionPermissionData(permission: any, moduleName: string, actionType: string) {
    const module = this.getModulePermissionData(permission, moduleName);
    if (module) {
      return module.actions.find((action: any) => action.hasOwnProperty(actionType));
    } else {
      return null;
    }
  }
  getModuleActionPermission(permission: any, moduleName: string, actionType: string): any {
    const action = this.getModuleActionPermissionData(permission, moduleName, actionType);
    if (action) {
      return action[actionType];
    } else {
      return false;
    }
  }
}
