import { APIResponseFormat } from '@tms-workspace/apis-core';
import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import SiteSettingService from '../../site_setting/services/site_setting.service';
import UserRolesService from '../services/user_roles.service';

class UserRolesController {
  public userRolesService = new UserRolesService();
  public siteSetting = new SiteSettingService();
  public getUserRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await this.userRolesService._getUserRoles();
      res.status(200).json(APIResponseFormat._ResDataFound(roles));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public createUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const title = req.body.title;
      if (!title) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Role title'));
      }

      const validation = await this.userRolesService._getUserRolesByTitle(title);
      if (validation) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Role', 'title'));
      }
      const permissionObject = await this.siteSetting._getSingleData({ name: { [Op.like]: 'Permission Object' } });
      // const permission = permissionObject.dataValues.value;
      const permission = JSON.parse(JSON.stringify(permissionObject)).value;
      const roleData = { title,permission };

      const data = await this.userRolesService._createUserRole(roleData);

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('User Role'));
      }

      res.status(201).json(APIResponseFormat._ResDataCreated('User Role', data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = Number(req.headers.id);
      const title = req.body.title;
      if (!roleId) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Role id'));
      }

      const roleData = { title };

      const validation = await this.userRolesService._getUserRolesById(roleId);
      if (!validation) {
        return res.status(409).json(APIResponseFormat._ResDataNotFound('Role'));
      }

      const validationTitle = await this.userRolesService._getUserRolesByTitle(title);
      if (validationTitle) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Role', 'title'));
      }

      const data = await this.userRolesService._updateUserRolePermission(roleId, roleData);
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('User Role'));
      }

      res.status(201).json(APIResponseFormat._ResDataUpdated('User Role'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public deleteUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const roleId = Number(req.headers.id);
      if (!roleId) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Role id'));
      }

      const validation = await this.userRolesService._getUserRolesById(roleId);
      if (!validation) {
        return res.status(409).json(APIResponseFormat._ResDataNotFound('Role'));
      }
    
      // Add Validation that if role is assigned to any user then it can not be deleted 
      const checkUserRole = await this.userRolesService._checkUserRole(roleId);
      
      if (checkUserRole) {
        return res.status(409).json(APIResponseFormat._ResRoleCanNotDelete());
      }

      const data = await this.userRolesService._deleteUserRole(roleId);
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('User Role'));
      }

      res.status(200).json(APIResponseFormat._ResDataDeleted('User Role'));
      
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public updateRolePermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permissionArray = JSON.parse(JSON.stringify(req.body.permission));
      for (const permissionObject of permissionArray) {
        const permission = permissionObject.value;
        const roleId = permissionObject.id;
        const roleData = { permission };
        await this.userRolesService._updateUserRolePermission(roleId, roleData);
      }
      res.status(200).json(APIResponseFormat._ResDataUpdated('User Role Permission'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getRoleWithPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleWithPermission: any = await this.userRolesService._getUserRolePermission();
      const newFormat = [];
      if (!roleWithPermission) {
        return res.status(409).json(APIResponseFormat._ResDataNotFound('Role'));
      } else {
        // create an object to keep track of the fields for each module
        const fieldsObj = {};

        // loop through each object in the input array
        roleWithPermission.forEach((obj) => {
          // obj = obj.dataValues;
          obj=JSON.parse(JSON.stringify(obj));
          // loop through each key in the permission object
          Object.keys(obj.permission).forEach((key) => {
            // get the name of the module
            const moduleName =
              Object.keys(obj.permission[key])[0] == 'actions' ? Object.keys(obj.permission[key])[1] : Object.keys(obj.permission[key])[0];

            // check if a module with this name exists in newFormat array
            const moduleIndex = newFormat.findIndex((el) => el.moduleName === moduleName);
            if (moduleIndex === -1) {
              // if module does not exist, create it and add to the newFormat array
              newFormat.push({
                moduleName: moduleName,
                isExpandModule: false,
                moduleControls: [],
                actions: [],
              });
              // initialize fields object for this module
              fieldsObj[moduleName] = {};
            }

            // add the object details to the appropriate module in the newFormat array
            const index = newFormat.findIndex((el) => el.moduleName === moduleName);
            const actions = obj.permission[key].actions;
            actions.forEach((action) => {
              const actionName = Object.keys(action)[0]==='fields'?Object.keys(action)[1]:Object.keys(action)[0];
              const actionIndex = newFormat[index].actions.findIndex((el) => el.actionName === actionName);
              if (actionIndex === -1) {
                newFormat[index].actions.push({
                  actionName: actionName,
                  isExpandAction: false,
                  actionControls: [],
                  fields: [], // add empty fields array to action object
                });
              }

              // add fields to the fields array for the action object if it does not already exist
              const newActionIndex = newFormat[index].actions.findIndex((el) => el.actionName === actionName);
              // const fields = action[actionName].fields;
              const fields = action.fields;  
              // Object.keys(fields).forEach((fieldName) => {
                fields.forEach((fieldObj) => {
                  const fieldName=Object.keys(fieldObj)[0]==='is_required'?Object.keys(fieldObj)[1]:Object.keys(fieldObj)[0]
                const fieldIndex = newFormat[index].actions[newActionIndex].fields.findIndex((el) => el.name === fieldName);
                if (fieldIndex === -1) {
                  newFormat[index].actions[newActionIndex].fields.push({
                    name: fieldName,
                    value: fieldObj[fieldName],
                    fieldControls: [], // initialize empty fieldControls array
                  });
                }

                // add the field control object to the appropriate field in the newFormat array
                const newFieldIndex = newFormat[index].actions[newActionIndex].fields.findIndex((el) => el.name === fieldName);
                newFormat[index].actions[newActionIndex].fields[newFieldIndex].fieldControls.push({
                  id: obj.id,
                  roleTypeId: obj.id,
                  roleType: obj.title,
                  checked: fieldObj[fieldName],
                  is_required: fieldObj['is_required'],
                });
              });

              // add the action control object to the appropriate action in the newFormat array
              newFormat[index].actions[newActionIndex].actionControls.push({
                id: obj.id,
                roleTypeId: obj.id,
                roleType: obj.title,
                checked: action[actionName],
              });
            });
            Object.keys(obj.permission[key]).forEach((property) => {
              if (property !== 'actions') {
                newFormat[index].moduleControls.push({
                  id: obj.id,
                  roleTypeId: obj.id,
                  roleType: obj.title,
                  checked: obj.permission[key][property],
                });
              }
            });
          });
        });
      }
      res.status(200).json(APIResponseFormat._ResDataFound(newFormat));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default UserRolesController;
