import { Query } from '@tms-workspace/apis-core';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import { Op, WhereOptions, Sequelize } from 'sequelize';

import _DB from '../database/models';
import UserService from '../api/user/services/user.service';

const userService = new UserService();

class PermissionService {
  public _checkModulePermission = async (id: number, module: string, operation: string) => {
    return new Promise<any>((resolve, reject) => {
      userService._getUserRole(id).then((data) => {
        data = JSON.parse(JSON.stringify(data));
        let permission = data.user_role?.permission && JSON.parse(JSON.stringify(data.user_role.permission));
        // console.log(permission);

        permission = permission && permission.find((el) => el[module])?.actions;

        console.log('Service1', permission);

        permission = (permission && permission.find((el) => el[operation])) || false;

        console.log('Service2', permission);

        if (permission) {
          resolve(permission.fields);
        } else {
          resolve(permission);
        }
      });
    });
  };
}

export default PermissionService;
