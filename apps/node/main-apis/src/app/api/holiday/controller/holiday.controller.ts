import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import HolidayService from '../services/holiday.service';
import UserService from '../../user/services/user.service';
import { Pagination } from '@tms-workspace/apis-core';
import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import { log } from 'console';

class HolidayController {
  public Holiday = new HolidayService();
  public UserService = new UserService();

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, year, month, search, isHoliday } = req.query;

      const where = { year, month, search, isHoliday };

      const count = await this.Holiday._allDatacount(where);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }

      const data = await this.Holiday._getAllHolidayData(where, +page, +limit, sortBy as string, orderBy as string);

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count as number);

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count as number, pageNumber));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getAllUpcommingHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy, year } = req.query;

      // if (!year) {
      //   return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Year'));
      // }

      const todayDate = new Date();

      let where = {};

      if (year) {
        where = {
          [Op.and]: [
            {
              [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('holiday_date')), {
                [Op.gte]: new Date(todayDate).toISOString().slice(0, 10),
                // [Op.gte]: dateToCheck, // Find records with date on or after dateToCheck
              }),
            },
            { isHoliday: 1 },
          ],
        };
      }

      const count = await this.Holiday._count(where);
      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }
      const data = await this.Holiday._getAllData(where, +page, +limit, sortBy as string, orderBy as string);
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
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Holiday Id'));
      }

      const data = await this.Holiday._getSingleData({ id: req.headers.id });

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
      const { title, holiday_date } = req.body;
      console.log('req.body', req.body);

      if (!title || !holiday_date) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      // if (moment(to_date).isBefore(moment(from_date))) {
      //   const errorResp = {
      //     status: 409,
      //     success: false,
      //     message: `Please ensure that the To Date is greater than or equal to the From Date.`,
      //   };
      //   return res.status(409).json(errorResp);
      // }

      // From date and To date should not be exits in existing holiday's range
      // Title should not be same
      let isValidate = true;
      let err = '';
      let existingHolidays = await this.Holiday._getAllData();

      existingHolidays = JSON.parse(JSON.stringify(existingHolidays));

      existingHolidays.forEach((el) => {
        if (moment(holiday_date).isSame(moment(el.holiday_date))) {
          isValidate = false;
          err = 'Holiday Date';
        } else if (title == el.title) {
          isValidate = false;
          err = 'Title';
        }
      });

      if (!isValidate) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Holiday', err));
      }

      const data = await this.Holiday._create({
        title,
        holiday_date,
      });

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Holiday'));
      }

      return res.status(201).json(APIResponseFormat._ResDataCreated('Holiday'));
    } catch (error) {
      console.log('🚀 ~ file: holiday.controller.ts:98 ~ HolidayController ~ create= ~ error:', error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, holiday_date } = req.body;
      const id = req.headers.id;

      if (!title || !holiday_date || !id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }

      // if (moment(to_date).isBefore(moment(from_date))) {
      //   const errorResp = {
      //     status: 409,
      //     success: false,
      //     message: `Please ensure that the To Date is greater than or equal to the From Date.`,
      //   };
      //   return res.status(409).json(errorResp);
      // }

      // From date and To date should not be exits in existing holiday's range
      // Title should not be same
      let isValidate = true;
      let err = '';
      const where = { id: { [Op.ne]: id } };
      let existingHolidays = await this.Holiday._getAllData(where);
      existingHolidays = JSON.parse(JSON.stringify(existingHolidays));

      existingHolidays.forEach((el) => {
        if (moment(holiday_date).isSame(moment(el.holiday_date))) {
          isValidate = false;
          err = 'holiday Date';
        } else if (title == el.title) {
          isValidate = false;
          err = 'Title';
        }
      });

      if (!isValidate) {
        return res.status(409).json(APIResponseFormat._ResDataExists('Holiday', err));
      }

      const data = await this.Holiday._update(
        { id },
        {
          title,
          holiday_date,
        }
      );

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Holiday'));
      }

      return res.status(200).json(APIResponseFormat._ResDataUpdated('Holiday'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.headers.id;

      if (!id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Holiday Id'));
      }

      const data = await this.Holiday._delete({ id });

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Holiday'));
      }

      return res.status(200).json(APIResponseFormat._ResDataDeleted('Holiday'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public syncHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.Holiday._getSyncHoliday().then(async (response) => {
        await this.Holiday._getAllHoliday().then(async (holidays) => {
          const HolidayData = response.map((data) => {
            const OldHoliday = holidays.find((oldH) => oldH.title === data.title && oldH.holiday_date === data.startDate);

            if (OldHoliday) {
              return {
                id: OldHoliday.id,
                title: data.title,
                holiday_date: data.startDate,
                isHoliday: data.isHoliday,
              };
            }

            return {
              title: data.title,
              holiday_date: data.startDate,
              isHoliday: data.isHoliday,
            };
          });

          await this.Holiday._createAllHoliday(HolidayData).then(() => {
            return res.status(201).json(APIResponseFormat._ResDataSync());
          });
        });
      });
    } catch (error) {
      console.log('🚀 ~ file: holiday.controller.ts:98 ~ HolidayController ~ create= ~ error:', error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public syncHrmsHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.headers.type;

      let holiday;
      let holidayData;
      const data = req.body;
      const holidays = await this.Holiday._getAllHoliday();

      const OldHoliday = holidays.find((oldH) => oldH.title === data.title && oldH.holiday_date === data.startDate);

      if (OldHoliday) {
        holidayData = {
          id: OldHoliday.id,
          title: data.title,
          holiday_date: data.startDate,
          isHoliday: data.isHoliday,
        };
      } else {
        holidayData = {
          title: data.title,
          holiday_date: data.startDate,
          isHoliday: data.isHoliday,
        };
      }

      if (type == 'update') {
        holiday = await this.Holiday._updateHoliday(holidayData);
      } else if (type == 'add') {
        let isValidate = true;
        let err = '';
        let existingHolidays = await this.Holiday._getAllData();

        existingHolidays = JSON.parse(JSON.stringify(existingHolidays));

        existingHolidays.forEach((el) => {
          if (moment(holidayData.holiday_date).isSame(moment(el.holiday_date))) {
            isValidate = false;
            err = 'Holiday Date';
          } else if (holidayData.title == el.title) {
            isValidate = false;
            err = 'Title';
          }
        });

        if (!isValidate) {
          return res.status(409).json(APIResponseFormat._ResDataExists('Holiday', err));
        }

        holiday = await this.Holiday._createAllHoliday([holidayData]);
      } else if (type == 'delete') {
        holiday = await this.Holiday._deleteHoliday(holidayData);
      } else {
        return res.status(400).json(APIResponseFormat._ResBadRequest('Invalid Operation Type Found'));
      }

      if (!holiday) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Holiday'));
      }

      return res.status(200).json(APIResponseFormat._ResDataUpdated('Holiday'));
    } catch (error) {
      console.log('🚀 ~ file: holiday.controller.ts:98 ~ HolidayController ~ create= ~ error:', error);

      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getDashboardRemindersData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const { page, limit, sortBy, orderBy, year, month, search, isHoliday } = req.query;

      const todayDate = moment().format('YYYY-MM-DD');
      const weekDate = moment().add(7, 'd').format('YYYY-MM-DD');

      const where = { todayDate, weekDate };

      const count = await this.Holiday._getDashBoardRemindersCount(where);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataFound([]));
      }

      const remindersData = await this.Holiday._getDashBoardRemindersData(where);

      return res.status(200).json(APIResponseFormat._ResDataFound({ count, remindersData }));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default HolidayController;
