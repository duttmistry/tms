import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import { NextFunction, Response } from 'express';
import { Op } from 'sequelize';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import CustomFieldsService from '../services/custom_fields.service';


class CustomFieldsController {
  public customFieldsService = new CustomFieldsService();

  public getCustomFields = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.query;

      // const permission: any = await this.projectService._getProjectPermission(req.user.id, 'view');
      // if (!Object.keys(permission).length) {
      //   return res.status(401).json(APIResponseFormat._ResUnauthrized());
      // }

      const where = {};

      //  req.user.isAdmin
      //   ? {
      //       [Op.or]: [
      //         {
      //           '$projectTeam.user_id$': req.user.id,
      //         },
      //         Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
      //       ],
      //     }
      //   : {
      //       [Op.or]: [
      //         {
      //           '$projectTeam.user_id$': req.user.id,
      //         },
      //         Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
      //       ],
      //     };


      const count = await this.customFieldsService._getCustomFieldsCount(where);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const customFieldsData = await this.customFieldsService._getAllCustomField(where, +page, +limit, sortBy as string, orderBy as string);

      const customFields = customFieldsData.map((cf) => {
        const tm = cf?.projectCustomFields.map((p) => {
          return p.project_id;
        });
        delete cf.projectCustomFields;
        return { ...cf, projects: tm };
      });

      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);
      const data = { customFields };

      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(data, totalPages, limit as string, count, pageNumber));


    } catch (error) {
       next(error);
       return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }

  };

  public createCustomFields = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const customFields = req.body.custom_fields;
      const projectId = Number(req.body.project_id);
      const userId = req.user.id;

      const projectCustomFields = {
        project_id: projectId,
        created_by: userId,
      };

      const data = customFields.map((field) => ({ ...field, created_by: userId, projectCustomFields }));

      // Check duplicate identifier
      const validation = await Promise.all(
        data.map(async (payload) => {

          const where = { identifier: payload?.identifier };
          if (payload?.id) {
            where['id'] = { [Op.ne]: payload.id };
          }
          console.log('payload', payload);
          
          console.log('where', where);
          

          const field = await this.customFieldsService._getCustomField(where);
          return field ? false : true;
        })
      );

      console.log('validation', validation);


      if (validation.includes(false)) {
        return res
          .status(409)
          .json(
            APIResponseFormat._ResCustomRequest(
              'The identifier with this name already exists in the library. Please create a new one with a different name or use the existing one.'
            )
          );
      }

      await Promise.all(
        data.map(async (payload) => {
          if (payload.id) {
            if(payload.projects.length<=1){
            const fieldsWhere = { id: payload.id };
            await this.customFieldsService._updateCustomFields(fieldsWhere, payload);

            const mappingWhere = { project_id: projectId, custom_field_id: payload.id };
            const isMappingExist = await this.customFieldsService._getProjectCustomFieldMapping(mappingWhere);

            if (!isMappingExist) {
              await this.customFieldsService._createProjectCustomFieldsMapping({...mappingWhere,created_by: userId});
            }
          }
            return null;
          }

          const resp = await this.customFieldsService._createCustomFields(payload);

          if (!resp) {
            return res.status(500).json(APIResponseFormat._ResDataNotCreated('Custom Fields'));
          }
          return resp;
        })
      );
      return res.status(200).json(APIResponseFormat._ResDataUpdated('Custom Fields'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

public updateCustomFields = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const customFieldsId = Number(req.body.id);
      // const projectId = Number(req.body.custom_fields_id);
      const userId = req.user.id;
      if(req.body.created_by!==userId){
        return res.status(500).json(APIResponseFormat._ResCustomRequest('You are not authorized for this operation'));
      }else if(req.body.projects.length>1){
        return res.status(500).json(APIResponseFormat._ResCustomRequest("This field can not be modified because it is used in multiple projects."));
      }else{
        const resp =await this.customFieldsService._updateCustomFields({id:customFieldsId,created_by: userId}, req.body);
        if(!resp){
          return res.status(200).json(APIResponseFormat._ResDataNotUpdated('Custom Fields'));
        }
        return res.status(200).json(APIResponseFormat._ResDataUpdated('Custom Fields'));
      }
      // const customFields = await this.customFieldsService._getCustomField({created_by:userId});
      // if(!customFields){
      //   return res.status(500).json(APIResponseFormat._ResCustomRequest('You are not authorized for this operation'));
      // }
      // const where = { custom_field_id:customFieldsId};
      // let field = await this.customFieldsService._getCustomFieldsMapping(where);
      // field=JSON.parse(JSON.stringify(field));
      // if(field&&field.length){

      //   const projectId=field.map((e)=>e.project_id);
      //   const validation=[...new Set(projectId)].length>1;
      //   if(!validation){
      //     const resp =await this.customFieldsService._updateCustomFields({id:customFieldsId,created_by: userId}, req.body);
      //     if(resp)
      //     return res.status(200).json(APIResponseFormat._ResDataUpdated('Custom Fields'));
      //   }else{
      //     return res.status(500).json(APIResponseFormat._ResCustomRequest('You are not authorized for this operation'));
      //   }
      // }else{
      //   return res.status(500).json(APIResponseFormat._ResCustomRequest('You are not authorized for this operation'));
      // }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default CustomFieldsController;