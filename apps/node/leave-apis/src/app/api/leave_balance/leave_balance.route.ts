import { Router } from 'express';
import LeaveBalance from './controller/leave_balance.controller';
import { auth } from '@tms-workspace/auth/user-authentication';
import { Routes } from '@tms-workspace/apis-core';

class LeaveBalanceRoute implements Routes {
  public router = Router();
  public controller = new LeaveBalance();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/leaves/balance', auth.default, this.controller.getBalanceLeave);

    // Import - Export Leave Balance
    this.router.post('/leaves/balance/import', this.controller.getLeaveBalanceImport);
    this.router.get('/leaves/balance/export', this.controller.getLeaveBalanceExport);

    // Import - Export Leave Opening Balance
    this.router.post('/leaves/opening/balance/import', auth.default, this.controller.getLeaveOpeningBalanceImport);
    this.router.get('/leaves/opening/balance/export', auth.default, this.controller.getLeaveOpeningBalanceExport);

    //Get Leave Balance of All Users
    this.router.get('/leaves/balance/all', auth.default, this.controller.getAllLeaveBalance);

    // Edit User Balance Administator
    this.router.put('/leave/balance', auth.default, this.controller.updateLeaveBalance);

    // Dev API's For Direct Changes
    this.router.get('/leaves/balance/add', this.controller.addBalanceLeave);
  }
}

export default LeaveBalanceRoute;
