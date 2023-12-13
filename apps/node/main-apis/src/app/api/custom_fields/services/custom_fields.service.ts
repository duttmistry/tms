import { Query } from '@tms-workspace/apis-core';
import { WhereOptions } from 'sequelize';
import { iCustomFields } from '../../../database/interface/custom_fields.interface';
import { iProjectCustomFieldsMapping } from '../../../database/interface/projects.interface';
import _DB from '../../../database/models';

const _customFields = _DB.CustomFields;
const _projectCustomFieldsMapping = _DB.ProjectCustomFieldsMapping;

class CustomFieldsService {
  public _getCustomFieldsCount = async (query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const data = _customFields.count({
        where: query,
      });
      resolve(data);
    });
  };

  public _getAllCustomField = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'desc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });

    return new Promise<iCustomFields[]>((resolve) => {
      const data = _customFields.findAll({
        include: [
          {
            as: 'projectCustomFields',
            model: _projectCustomFieldsMapping,
            attributes: ['id', 'project_id'],
          },
        ],
        where: query,
        limit: limit > 0 ? limit : null,
        offset: offset > 0 ? offset : null,
        order,
      }).then(res => {
        return JSON.parse(JSON.stringify(res));
      });
      resolve(data);
    });
  };

  public _createCustomFields = async (fields: object) => {
    return new Promise((resolve) => {
      const data = _customFields.create(fields, {
        include: ['projectCustomFields'],
      });
      resolve(data);
    });
  };

  public _getCustomField = async (query: WhereOptions) => {
    return new Promise<iCustomFields>((resolve) => {
      const data = _customFields.findOne({
        where: query,
        
      });
      resolve(data);
    });
  };

  public _getProjectCustomFieldMapping = async (query: WhereOptions) => {
    return new Promise<iProjectCustomFieldsMapping>((resolve) => {
      const data = _projectCustomFieldsMapping.findOne({
        where: query,
      });
      resolve(data);
    });
  };

  public _updateCustomFields = async (query: WhereOptions, payload: object) => {
    return new Promise((resolve) => {
      const data = _customFields.update(payload, {
        where: query,
      });
      resolve(data);
    });
  };

  public _createProjectCustomFieldsMapping = async (payload: iProjectCustomFieldsMapping) => {
    return new Promise((resolve) => {
      const data = _projectCustomFieldsMapping.create(payload);
      resolve(data);
    });
  };

  public _getCustomFieldsMapping = async (query: WhereOptions) => {
    return new Promise<iProjectCustomFieldsMapping[]>((resolve) => {
      const data = _projectCustomFieldsMapping.findAll({
        where: query,
      });
      resolve(data);
    });
  };


}

export default CustomFieldsService;
