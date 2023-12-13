import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import SiteSettingService from '../services/site_setting.service';
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

class SiteSettingController {
  public siteSetting = new SiteSettingService();
  public userService = new UserService();
  public permissionService = new PermissionService();

  public getSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.name) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Site Setting Name'));
      }

      const data = await this.siteSetting._getSingleData({ name: { [Op.like]: req.headers.name } });
      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.name) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Site Setting Name'));
      }

      const data = await config._GetByName(`${req.headers.name}`);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getByIdentifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.identifier) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Site Setting Identifier'));
      }

      const data = await config._GetByIdentifier(`${req.headers.identifier}`);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getByModule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.module) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Site Setting Module'));
      }

      const data = await config._GetByModule(`${req.headers.module}`);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getBySimilarName = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.headers.name) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Site Setting Name'));
      }

      const data = await config._GetBySimilarName(`${req.headers.name}`);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await config._GetAll();
      return res.status(200).json(data);
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public setSingleField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await config._SetSingleField(req.body);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public setModulewiseField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await config._SetModulewiseField(req.body);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  /**
   * saveData: This function is used to save and update the site setting.
   */
  public saveData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestBodyData = req.body;
      let checkValidation = true;
      if (req.body.length < 1) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Some fields'));
      } else {
        requestBodyData.forEach((bodyData: any) => {
          const name = bodyData?.name;
          const value = bodyData?.value;
          const identifier = bodyData?.identifier;
          const module = bodyData?.module;
          if (!name || !value || !identifier || !module) {
            checkValidation = false;
          }
        });
        if (checkValidation) {
          requestBodyData.forEach(async (bodyData: any) => {
            const id = bodyData?.id || null;
            const name = bodyData?.name;
            const value = bodyData?.value;
            const identifier = bodyData?.identifier;
            const module = bodyData?.module;
            if (id === null) {
              const data = await this.siteSetting._create({
                name,
                value,
                identifier,
                module,
              });
              if (!data) {
                return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Site Setting'));
              }
              if (data.name === 'SequelizeUniqueConstraintError') {
                return res.status(500).json({
                  status: 500,
                  success: false,
                  message: 'identifier must be unique',
                  type: 'unique violation',
                });
              }

              return res.status(201).json(APIResponseFormat._ResDataUpdated('Site Setting'));
            } else {
              const data = await this.siteSetting._update(
                { id },
                {
                  name,
                  value,
                  identifier,
                  module,
                }
              );
              if (!data) {
                return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Site Setting'));
              }

              return res.status(201).json(APIResponseFormat._ResDataUpdated('Site Setting'));
            }
          });
        } else {
          return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Some fields'));
        }
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getCeoField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.headers.id;
      if (!id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('Ceo Id'));
      }
      const data = await this.siteSetting._getCeoDetails({ id: id });
      return res.status(200).json(data);
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public setCeoField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userid = Number(req.headers.user_id);

      if (!userid) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField('User Id'));
      }

      const permission = await this.permissionService._checkModulePermission(req.user.id, 'site_settings.user_config', 'update');

      if (!permission) {
        return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      }

      // check wether the given userId 's user is exist in tm_users or not ?

      const existOrNot = await this.userService._getUserDataById(userid);
      const user = JSON.parse(JSON.stringify(existOrNot));

      if (!existOrNot) {
        return res.status(409).json(APIResponseFormat._ResDataNotUpdated('User Id'));
      }

      const senddata = {
        user_id: userid,
        name: user.first_name + user.last_name,
        profile: user.employee_image,
      };

      const data = await this.siteSetting._ceoFindOrCreate(senddata);

      if (!data) {
        return res.status(409).json(APIResponseFormat._ResDataNotUpdated('Ceo details'));
      }

      return res.status(201).json(APIResponseFormat._ResDataUpdated('Ceo details'));

      // const newUpload = multer({
      //   storage: MulterService._ceoProfileStorage,
      //   fileFilter: MulterService._imageFileFilter,
      // }).fields([{ name: 'ceoFile', maxCount: 1 }]);

      //  newUpload(req, res, async(err: any) => {

      //   if (err && err.message) {
      //     return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
      //   }

      //     const data = {
      //       profile: req.files['ceoFile'][0].filename,
      //       name: req.body.ceo_name
      //     }

      //     const ceoDetails = await this.siteSetting._ceoFindOrCreate({id} , data);
      //     console.log("ceoDetails" , ceoDetails)

      //     if(!ceoDetails){
      //       return res.status(400).send(APIResponseFormat._ResDataNotCreated("Ceo details"));
      //     }

      //     return res.status(201).json(APIResponseFormat._ResDataUpdated("Ceo details"));
      // })

      // return res.status(200).json({receive : "data"});
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default SiteSettingController;
