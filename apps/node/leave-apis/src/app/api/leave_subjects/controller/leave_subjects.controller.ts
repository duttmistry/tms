import { APIResponseFormat } from '@tms-workspace/apis-core';
import { NextFunction, Request, Response } from 'express';
import LeaveSubjectsService from '../services/leave_subjects.service';

class LeaveController {
  public leaveSubjectsService = new LeaveSubjectsService();

  public getLeaveSubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.leaveSubjectsService._getLeaveSubjects();
      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      console.log(error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };
}

export default LeaveController;
