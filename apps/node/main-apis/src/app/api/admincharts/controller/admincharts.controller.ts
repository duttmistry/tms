import { APIResponseFormat } from '@tms-workspace/apis-core';
import { Request, Response, NextFunction } from 'express';
import { iRequestWithUser, iUser } from '../../../database/interface/user.interface';
import _ from 'lodash';
import moment from 'moment';
import AdministrationchartsService from '../services/admincharts.service';
import { Op, Sequelize, where } from 'sequelize';
import { log } from 'console';

class AdminchartsController {
  public administrationService = new AdministrationchartsService();

  public _pieCharts = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { userId, month, year, fromDate, toDate } = req.body;
      let role = await this.administrationService._getUserRole(req.user.id);
      role = JSON.parse(JSON.stringify(role));

      const notloggedInuser = await this.administrationService._getNotLoginUserReport(req.user.isAdmin, req.user.id, role.user_role.title);
      const onLeaveUsers = await this.administrationService._getOnLeaveUserReport(req.user.isAdmin, req.user.id, role.user_role.title);
      const loggedInuser = await this.administrationService._getLoggedInUserReport();

      return res.status(200).json(APIResponseFormat._ResDataFound([
         { name : 'LoggedIn' , count : loggedInuser.length}, 
         { name : 'Not-LoggedIn' , count : notloggedInuser.length}, 
         { name : 'On Leave' , count : onLeaveUsers.length}
      ]));
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default AdminchartsController;
