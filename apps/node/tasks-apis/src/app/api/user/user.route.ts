import { Router } from 'express';
import User from './controller/user.controller';
import Auth from './controller/auth.controller';
import UserRoles from './controller/user_roles.controller';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication';

class UserRoute implements Routes {
  public router = Router();
  public controller = new User();
  public authController = new Auth();
  public userRolesController = new UserRoles();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // User Routes
    this.router.get(`/user`, auth.default, this.controller.getUserById);
    this.router.put(`/user/description/update/`, auth.default, this.controller.updateSkillDescription);
    this.router.post(`/users/sync`, this.controller.employeeSync);
    this.router.post(`/hrms/sync/user`, this.controller.syncHrmsData);
    this.router.get(`/user/pending/time`, auth.default, this.controller.userPendingTime);
    this.router.put(`/user/role/update`, auth.default, this.controller.updateUserRole);
    this.router.put(`/users/role/update`, auth.default, this.controller.updateUserRoleMultiple);
    this.router.post(`/user/list`, auth.default, this.controller.getUserList);

    // Auth Routes
    this.router.post(`/login`, this.authController.login);
    this.router.post(`/logout`, auth.default, this.authController.logout);
    this.router.post(`/system/logout`, auth.default, this.authController.systemLogout);
    this.router.post(`/break`, auth.default, this.authController.break);
    this.router.post(`/system/auto/logout`, auth.default, this.authController.systemAutoLogout);

    // User Roles Routes
    this.router.get(`/user/roles`, auth.default, this.userRolesController.getUserRoles);
    this.router.post(`/user/role`, auth.default, this.userRolesController.createUserRole);
    this.router.put(`/user/role`, auth.default, this.userRolesController.updateUserRole);
    this.router.delete(`/user/role`, auth.default, this.userRolesController.deleteUserRole);
    this.router.get(`/user/role/permission`, auth.default, this.userRolesController.getRoleWithPermission);
    this.router.put(`/user/role/permission`, auth.default, this.userRolesController.updateRolePermission);

    // Reporting Persons Routes
    this.router.get(`/user/report/persons`, auth.default, this.controller.getReportingPersons);
    this.router.get(`/user/report/persons/leaves`, auth.default, this.controller.getReportingPersonsLeaves);

    // Leave Approver Person
    this.router.get(`/user/leave/approver/`, auth.default, this.controller.getLeaveApproverPersons);
  }
}

export default UserRoute;
