import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Order } from 'sequelize';
import LeaveBalanceService from '../services/leave_balance.service';
import { Query, Pagination, APIResponseFormat } from '@tms-workspace/apis-core';
import { map } from 'rxjs';
import { FileService, MulterService, BasePath } from '@tms-workspace/file-upload';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import { Op, Sequelize } from 'sequelize';
import * as excelJS from 'exceljs';
import readXlsxFile from 'read-excel-file/node';
import eventEmitter from '../../../../core/leave-txn-events';
import { iLeaveHistory, iLeaveHistoryLog, iLeaveBalance, iLeaveApproval, iLeaveOpeningBalance } from '../../../database/interface/leave.interface';
import { Leave_Type } from '@tms-workspace/enum-data';
import LeaveService from '../../leave/services/leave.service';

class LeaveBalanceController {
  public leaveBalanceService = new LeaveBalanceService();
  public leaveService = new LeaveService();

  //Personal Leave API's
  public getBalanceLeave = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.headers.id ? Number(req.headers.id) : req.user.id;

      const leaveBalance = await this.leaveBalanceService._getleaveBalance({
        user_id: user_id,
      });

      if (!leaveBalance) return res.status(404).json(APIResponseFormat._ResDataNotFound());

      res.status(200).json(APIResponseFormat._ResDataFound(leaveBalance));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  //Get All Leave Balance

  public getAllLeaveBalance = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const leaveBalance = await this.leaveBalanceService._getAllUserWithLeaveBalance();

      if (!leaveBalance) return res.status(404).json(APIResponseFormat._ResDataNotFound());

      res.status(200).json(APIResponseFormat._ResDataFound(leaveBalance));
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public updateLeaveBalance = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;

      const getLeaveResponsiblePerson = await this.leaveBalanceService._getLeaveResponsiblePersons();

      if (!req.user.isAdmin) {
        if (!getLeaveResponsiblePerson.includes(user_id)) {
          return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
        }
      }

      const employee_id = Number(req.headers.id);

      if (!employee_id) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('employee_id'));
      }

      // {
      //   current_CL,
      //   current_PL,
      //   current_LWP,
      //   Comments
      // }

      const getBalance = await this.leaveService._getleaveBalance({ user_id: employee_id });

      const oldCLData = getBalance.find((lb) => lb.leave_type.toString() === Leave_Type.CL.toString()).current_balance;
      const oldPLData = getBalance.find((lb) => lb.leave_type.toString() === Leave_Type.PL.toString()).current_balance;
      const oldLWPData = getBalance.find((lb) => lb.leave_type.toString() === Leave_Type.LWP.toString()).current_balance;

      const { current_CL, current_PL, current_LWP, Comments } = req.body;

      if (!Comments) {
        return res.status(409).send(APIResponseFormat._ResMissingRequiredField('Leave Data'));
      }

      const clLeaveData = { current_balance: current_CL === '' ? 0 : Number(current_CL) };

      const updateCLLeave = await this.leaveBalanceService._updateleaveBalance(clLeaveData, { user_id: employee_id, leave_type: 'CL' });

      const plLeaveData = { current_balance: current_PL === '' ? 0 : Number(current_PL) };
      const updatePLLeave = await this.leaveBalanceService._updateleaveBalance(plLeaveData, { user_id: employee_id, leave_type: 'PL' });

      const lwpLeaveData = { current_balance: current_LWP === '' ? 0 : Number(current_LWP) };
      const updateLWPLeave = await this.leaveBalanceService._updateleaveBalance(lwpLeaveData, { user_id: employee_id, leave_type: 'LWP' });

      if (!updateCLLeave && !updatePLLeave && !updateLWPLeave) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Balance'));
      }

      // console.log('EventObject', EventObject);
      await eventEmitter.emit(
        'updateLeaveBySuperiority',
        oldCLData,
        current_CL === '' ? 0 : Number(current_CL),
        'CL',
        Comments,
        employee_id,
        user_id
      );

      await eventEmitter.emit(
        'updateLeaveBySuperiority',
        oldPLData,
        current_PL === '' ? 0 : Number(current_PL),
        'PL',
        Comments,
        employee_id,
        user_id
      );

      await eventEmitter.emit(
        'updateLeaveBySuperiority',
        oldLWPData,
        current_LWP === '' ? 0 : Number(current_LWP),
        'LWP',
        Comments,
        employee_id,
        user_id
      );

      return res.status(200).json(APIResponseFormat._ResDataUpdated('Leave Balance'));
    } catch (error) {
      console.log(error, error);
      
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getLeaveBalanceImport = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    const newUpload = multer({
      storage: MulterService._leaveBalanceExcel,
      fileFilter: MulterService._excelFilter,
    }).fields([{ name: 'file', maxCount: 1 }]);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisI = this;
    newUpload(req, res, async function (err) {
      try {
        if (err && err.message) {
          return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
        }

        console.log('FILES', req.files['file'][0].path);

        const filePath = req.files['file'][0].path;

        const map = {
          id: 'id',
          user_id: 'user_id',
          leave_type: 'leave_type',
          current_balance: 'current_balance',
          applied_balance: 'applied_balance',
          reserved_balance: 'reserved_balance',
        };

        const { rows } = await readXlsxFile(filePath, {
          map,
          dateFormat: 'yyyy-mm-dd',
        });

        console.log('Data', rows);

        const updateBalance = await thisI.leaveBalanceService._importleaveBalance(rows as iLeaveBalance[]);

        if (!updateBalance) {
          return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Balance'));
        }
        // const options = {};
        // const workbookReader = new excelJS.stream.xlsx.WorkbookReader(req.files['file'][0].path, options);
        // workbookReader.read();

        // workbookReader.on('worksheet', (worksheet) => {
        //   worksheet.on('row', (row) => {
        //     console.log(row.values);
        //   });
        // });

        // const workbook = new excelJS.Workbook();

        // const sheet = await workbook.xlsx.readFile(req.files['file'][0].path).then(() => {
        //   const worksheet = workbook.getWorksheet('Employee Leave Balance');
        //   return JSON.parse(JSON.stringify(worksheet));
        // });

        // console.log('sheet', sheet);

        // workbook.xlsx.readFile(req.files['file'][0].path).then(function () {
        //   const worksheet = workbook.getWorksheet('Employee Leave Balance');

        //   // console.log('worksheet', worksheet);

        //   worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        //     console.log(`row ${rowNumber}`, row.values);

        //     // console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
        //   });
        // });

        return res.status(201).json(APIResponseFormat._ResDataUpdated('Leave Balance'));
      } catch (error) {
        FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['file']);
        next(error);
        return res.status(500).json(APIResponseFormat._ResIntervalServerError());
      }
    });
  };

  public getLeaveBalanceExport = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;

      const leaveBalance = await this.leaveBalanceService._getleaveBalance({});

      if (!leaveBalance) return res.status(404).json(APIResponseFormat._ResDataNotFound());

      const workbook = new excelJS.Workbook(); // Create a new workbook
      const worksheet = workbook.addWorksheet('Employee Leave Balance'); // New Worksheet
      const path = BasePath.default.LEAVE_BALANCE_EXCEL_PATH; // Path to download excel
      // Column for data in excel. key must match data key
      worksheet.columns = [
        { header: 'id', key: 'id', width: 10 },
        { header: 'user_id', key: 'user_id', width: 10 },
        { header: 'leave_type', key: 'leave_type', width: 10 },
        { header: 'current_balance', key: 'current_balance', width: 10 },
        { header: 'applied_balance', key: 'applied_balance', width: 10 },
        { header: 'reserved_balance', key: 'reserved_balance', width: 10 },
      ];
      // Looping through User data
      let counter = 1;
      leaveBalance.forEach((user) => {
        user.id = counter;
        worksheet.addRow(user); // Add data in worksheet
        counter++;
      });
      // Making first line in excel bold
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });
      try {
        const data = await workbook.xlsx.writeFile(`${path}/LeaveBalance.xlsx`).then(() => {
          return res.status(200).json(
            APIResponseFormat._ResDataFound({
              status: 'success',
              message: 'file successfully downloaded',
              path: `uploads/leaveBalance/LeaveBalance.xlsx`,
            })
          );
        });
      } catch (err) {
        console.log(err);

        return res.status(500).json(APIResponseFormat._ResIntervalServerError());
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getLeaveOpeningBalanceImport = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    const newUpload = multer({
      storage: MulterService._leaveOpeningBalanceExcel,
      fileFilter: MulterService._excelFilter,
    }).fields([{ name: 'file', maxCount: 1 }]);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisI = this;
    newUpload(req, res, async function (err) {
      try {
        if (err && err.message) {
          return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
        }

        console.log('FILES', req.files['file'][0].path);

        const filePath = req.files['file'][0].path;

        const map = {
          id: 'id',
          user_id: 'user_id',
          leave_type: 'leave_type',
          opening_balance: 'opening_balance',
          closing_balance: 'closing_balance',
          month: 'month',
          year: 'year',
        };

        const { rows } = await readXlsxFile(filePath, {
          map,
          dateFormat: 'yyyy-mm-dd',
        });

        console.log('Data', rows);

        const updateBalance = await thisI.leaveBalanceService._importleaveOpeningBalance(rows as iLeaveOpeningBalance[]);

        if (!updateBalance) {
          return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Leave Balance'));
        }

        return res.status(201).json(APIResponseFormat._ResDataUpdated('Leave Opening Balance'));
      } catch (error) {
        console.log('error', error);

        FileService._deleteFile(BasePath.default.LEAVE_OPENING_BALANCE_EXCEL_PATH, req.files['file']);
        next(error);
        return res.status(500).json(APIResponseFormat._ResIntervalServerError());
      }
    });
  };

  public getLeaveOpeningBalanceExport = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user.id;

      const { month } = req.headers;

      const where = {
        month,
      };

      const leaveOpeningBalance = await this.leaveBalanceService._getleaveOpeningBalance(where);

      if (!leaveOpeningBalance) return res.status(404).json(APIResponseFormat._ResDataNotFound());

      const workbook = new excelJS.Workbook(); // Create a new workbook
      const worksheet = workbook.addWorksheet(`Employee Leave ${month} Balance`); // New Worksheet
      const path = BasePath.default.LEAVE_OPENING_BALANCE_EXCEL_PATH; // Path to download excel
      // Column for data in excel. key must match data key
      worksheet.columns = [
        { header: 'id', key: 'id', width: 10 },
        { header: 'user_id', key: 'user_id', width: 10 },
        { header: 'leave_type', key: 'leave_type', width: 10 },
        { header: 'opening_balance', key: 'opening_balance', width: 10 },
        { header: 'closing_balance', key: 'closing_balance', width: 10 },
        { header: 'month', key: 'month', width: 10 },
      ];
      // Looping through User data
      let counter = 1;
      leaveOpeningBalance.forEach((user) => {
        user.id = counter;
        worksheet.addRow(user); // Add data in worksheet
        counter++;
      });
      // Making first line in excel bold
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });
      try {
        const data = await workbook.xlsx.writeFile(`${path}/LeaveOpeningBalance(${month}).xlsx`).then(() => {
          return res.status(200).json(
            APIResponseFormat._ResDataFound({
              status: 'success',
              message: 'file successfully downloaded',
              path: `uploads/leaveOpeningBalance/LeaveOpeningBalance(${month}).xlsx`,
            })
          );
        });
      } catch (err) {
        console.log(err);

        return res.status(500).json(APIResponseFormat._ResIntervalServerError());
      }
    } catch (error) {
      console.log('ERROR', error);

      next(error);

      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  // Dev API's For Direct Changes
  public addBalanceLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const Employee = await this.leaveBalanceService._getAllUser();

      let employeeLeaveBalance = [];

      await Promise.all(
        Employee.map(async (emp) => {
          const leaveBalance = await this.leaveBalanceService._getleaveBalance({
            user_id: emp.user_id,
          });

          const UsedData = await this.leaveBalanceService._getLeaveHistoryMonthCount({
            status: 'APPROVED',
            user_id: emp.user_id,
          });

          const AppliedData = await this.leaveBalanceService._getLeaveHistoryMonthCount({
            status: 'PENDING',
            user_id: emp.user_id,
          });

          let PlId = 0;
          let ClId = 0;

          let currentCLBalance = 0;
          let currentPLBalance = 0;

          let UsedCL = 0;
          let UsedPL = 0;
          let UsedLWP = 0;

          let PendingCL = 0;
          let PendingPL = 0;
          let PendingLWP = 0;

          ClId = leaveBalance.find((leave) => leave.leave_type.toString() === Leave_Type.CL.toString())?.id || null;
          PlId = leaveBalance.find((leave) => leave.leave_type.toString() === Leave_Type.PL.toString())?.id || null;

          currentCLBalance = leaveBalance.find((leave) => leave.leave_type.toString() === Leave_Type.CL.toString())?.current_balance || 0;
          currentPLBalance = leaveBalance.find((leave) => leave.leave_type.toString() === Leave_Type.PL.toString())?.current_balance || 0;
          UsedData.forEach((userleave) => {
            UsedCL += userleave.leaveTypes
              .filter((leave) => leave.leave_type.toString() === Leave_Type.CL.toString())
              .reduce((sum, item) => sum + item.leave_days, 0);
            UsedPL += userleave.leaveTypes
              .filter((leave) => leave.leave_type.toString() === Leave_Type.PL.toString())
              .reduce((sum, item) => sum + item.leave_days, 0);
            UsedLWP += userleave.leaveTypes
              .filter((leave) => leave.leave_type.toString() === Leave_Type.LWP.toString())
              .reduce((sum, item) => sum + item.leave_days, 0);
          });

          AppliedData.forEach((userleave) => {
            PendingCL += userleave.leaveTypes
              .filter((leave) => leave.leave_type.toString() === Leave_Type.CL.toString())
              .reduce((sum, item) => sum + item.leave_days, 0);
            PendingPL += userleave.leaveTypes
              .filter((leave) => leave.leave_type.toString() === Leave_Type.PL.toString())
              .reduce((sum, item) => sum + item.leave_days, 0);
            PendingLWP += userleave.leaveTypes
              .filter((leave) => leave.leave_type.toString() === Leave_Type.LWP.toString())
              .reduce((sum, item) => sum + item.leave_days, 0);
          });

          employeeLeaveBalance = [
            ...employeeLeaveBalance,
            {
              id: ClId,
              user_id: emp.user_id,
              leave_type: Leave_Type.CL.toString(),
              current_balance: currentCLBalance,
              applied_balance: UsedCL,
              reserved_balance: PendingCL,
            },
            {
              id: PlId,
              user_id: emp.user_id,
              leave_type: Leave_Type.PL.toString(),
              current_balance: currentPLBalance,
              applied_balance: UsedPL,
              reserved_balance: PendingPL,
            },

            {
              user_id: emp.user_id,
              leave_type: Leave_Type.LWP.toString(),
              current_balance: 0,
              applied_balance: 0,
              reserved_balance: 0,
            },
          ];
        })
      );

      const AddEmployeeBalance = this.leaveBalanceService._importleaveBalance(employeeLeaveBalance as iLeaveBalance[]);

      if (!AddEmployeeBalance) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('AddEmployeeBalance'));
      }

      // console.log('Employee', Employee);
      res.status(200).json(APIResponseFormat._ResDataFound(employeeLeaveBalance));
    } catch (error) {
      // console.log('🚀 ~ file: leave.controller.ts:249 ~ LeaveController ~ addBalanceLeave= ~ error:', error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default LeaveBalanceController;
