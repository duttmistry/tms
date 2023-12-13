import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import SpecialdaysService from '../services/specialdays.service';
import { Pagination } from '@tms-workspace/apis-core';
import moment from 'moment';
import { Op } from 'sequelize';

class SpecialdaysController {
  public Specialday = new SpecialdaysService();

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, year, month } = req.body;
      const count = await this.Specialday._count({});
      if (!year) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Year'));
      }
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.Specialday._getAllData({}, page as number, limit as number, sortBy as string, orderBy as string, year, month);
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Specialday Id'));
      }

      const data = await this.Specialday._getSingleData({ id: req.headers.id });

      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, short_description, from_date, to_date } = req.body;
      if (!title || !from_date || !to_date) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      if (moment(to_date).isBefore(moment(from_date))) {
        const errorResp = {
          status: 409,
          success: false,
          message: `Please ensure that the To Date is greater than or equal to the From Date.`,
        };
        return res.status(409).json(errorResp);
      }

      // From date and To date should not be exits in existing Specialday's range
      // Title should not be same
      let isValidate = true;
      let err = '';
      let existingSpecialdays = await this.Specialday._getAllData();
      existingSpecialdays = JSON.parse(JSON.stringify(existingSpecialdays));
      existingSpecialdays.forEach((el) => {
        if (
          moment(from_date).isBetween(moment(el.from_date), moment(el.to_date), 'dates', '[]') ||
          moment(el.from_date).isBetween(moment(from_date), moment(to_date), 'dates', '[]')
        ) {
          isValidate = false;
          err = 'From Date';
        } else if (
          moment(to_date).isBetween(moment(el.from_date), moment(el.to_date), 'dates', '[]') ||
          moment(el.to_date).isBetween(moment(from_date), moment(to_date), 'dates', '[]')
        ) {
          isValidate = false;
          err = 'To Date';
        } else if (title == el.title) {
          isValidate = false;
          err = 'Title';
        }
      });

      if (!isValidate) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Specialday', err));
      }

      const data = await this.Specialday._create({
        title,
        short_description,
        from_date,
        to_date,
      });

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Specialday'));
      }

      return res.status(201).json(APIResponseFormat._ResDataCreated('Specialday'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, short_description, from_date, to_date } = req.body;
      const id = req.headers.id;

      if (!title || !from_date || !to_date || !id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }

      if (moment(to_date).isBefore(moment(from_date))) {
        const errorResp = {
          status: 409,
          success: false,
          message: `Please ensure that the To Date is greater than or equal to the From Date.`,
        };
        return res.status(409).json(errorResp);
      }

      // From date and To date should not be exits in existing Specialday's range
      // Title should not be same
      let isValidate = true;
      let err = '';
      const where = { id: { [Op.ne]: id } };
      let existingSpecialdays = await this.Specialday._getAllData(where);
      existingSpecialdays = JSON.parse(JSON.stringify(existingSpecialdays));

      existingSpecialdays.forEach((el) => {
        if (
          moment(from_date).isBetween(moment(el.from_date), moment(el.to_date), 'dates', '[]') ||
          moment(el.from_date).isBetween(moment(from_date), moment(to_date), 'dates', '[]')
        ) {
          isValidate = false;
          err = 'From Date';
        } else if (
          moment(to_date).isBetween(moment(el.from_date), moment(el.to_date), 'dates', '[]') ||
          moment(el.to_date).isBetween(moment(from_date), moment(to_date), 'dates', '[]')
        ) {
          isValidate = false;
          err = 'To Date';
        } else if (title == el.title) {
          isValidate = false;
          err = 'Title';
        }
      });

      if (!isValidate) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Specialday', err));
      }

      const data = await this.Specialday._update(
        { id },
        {
          title,
          short_description,
          from_date,
          to_date,
        }
      );

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Specialday'));
      }

      return res.status(200).json(APIResponseFormat._ResDataUpdated('Specialday'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.headers.id;

      if (!id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Specialday Id'));
      }

      const data = await this.Specialday._delete({ id });

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Specialday'));
      }

      return res.status(200).json(APIResponseFormat._ResDataDeleted('Specialday'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default SpecialdaysController;
