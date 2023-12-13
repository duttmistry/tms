import { APIResponseFormat } from "@tms-workspace/apis-core";
import { NextFunction, Request, Response } from "express";
import UserRolesService from "../services/user_roles.service";

class UserRolesController {
  public userRolesService = new UserRolesService();

  public getUserRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await this.userRolesService._getUserRoles();
      res.status(200).json(APIResponseFormat._ResDataFound(roles));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  }

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

      const roleData = { title }
      const data = await this.userRolesService._createUserRole(roleData)
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('User Role'));
      }
      
      res.status(201).json(APIResponseFormat._ResDataCreated('User Role', data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  }

  public updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = Number(req.headers.id);
      const title = req.body.title;
      if (!roleId) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Role id'));
      }

      const roleData = { title }
      const data = await this.userRolesService._updateUserRolePermission(roleId, roleData)
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('User Role'));
      }
      
      res.status(201).json(APIResponseFormat._ResDataUpdated('User Role'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  }

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

      await this.userRolesService._deleteUserRole(roleId);

      res.status(200).json(APIResponseFormat._ResDataDeleted('User Role'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  }
  
  public updateRolePermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = Number(req.headers.id);
      const permission = req.body.permission;
      if (!roleId) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Role id'));
      }

      const roleData = { permission }
      const data = await this.userRolesService._updateUserRolePermission(roleId, roleData)
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('User Role'));
      }
      
      res.status(200).json(APIResponseFormat._ResDataUpdated('User Role Permission'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  }

  public getRoleWithPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = Number(req.headers.id);
      if (!roleId) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Role id'));
      }

      const roleWithPermission = await this.userRolesService._getUserRolesById(roleId).then(res => {
        if(!res) return;
        return {
          id: res.id,
          title: res.title,
          permission: res.permission
        }
      });
      if (!roleWithPermission) {
        return res.status(409).json(APIResponseFormat._ResDataNotFound('Role'));
      }
      
      res.status(200).json(APIResponseFormat._ResDataFound(roleWithPermission));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  }
}

export default UserRolesController;