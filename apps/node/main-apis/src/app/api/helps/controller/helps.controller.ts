import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import HelpService from '../services/helps.services';
import PermissionService from '../../../service/permissionCheck';
import UserService from '../../user/services/user.service';
import * as config from '@uss/site-settings';
import { Op } from 'sequelize';
import { MulterService } from '@tms-workspace/file-upload';
import multer from 'multer';

declare module 'express' {
  export interface Request {
    user: any;
  }
}

class HelpsController {
  public helpService = new HelpService();
  public userService = new UserService();
  public permissionService = new PermissionService();

  public getSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = req.headers.category;

      const where: any = {}; // Initialize an empty where object

      // Check if the 'category' header exists in the request
      if (category) {
        where.category = category;
      }

      const data = await this.helpService._getSingleData(where);
      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  // public createHelp = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { category, title, description, url } = req.body;

  //     if (!category || !title || !url) {
  //       return res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
  //     }

  //     // Check whether category is exist or not ?
  //     const categoryExists = await this.helpService._checkCategoryExistORNot(category);

  //     if (!categoryExists) {
  //       const videoObj = {
  //         title,
  //         description,
  //         url
  //       }

  //       let getCategory = await this.helpService._getSingleData(category);
  //       getCategory = JSON.parse(JSON.stringify(getCategory));
  //       console.log('getCategory: ', getCategory);

  //     }

  //     // const data = await this.helpService._createData(req.body);

  //     // if (!data) {
  //     //   return res.status(404).json(APIResponseFormat._ResDataNotFound());
  //     // }
  //     return res.status(200).json(categoryExists);
  //   } catch (error) {
  //     next(error);
  //     return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
  //   }
  // };
}

export default HelpsController;
