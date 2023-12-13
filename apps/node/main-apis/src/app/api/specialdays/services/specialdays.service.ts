import { WhereOptions } from 'sequelize';
import { iSpecialDays } from '../../../database/interface/specialdays.interface';
import _DB from '../../../database/models';
import { Query } from '@tms-workspace/apis-core';
import { Op } from 'sequelize';

const specialDays = _DB.SpecialDays;
const _sequelize = _DB.sequelize;

class SpecialDaysService {
  // GET ALL SpecialDays
  public _count = async (query: WhereOptions) => {
    return new Promise<Number>((resolve, reject) => {
      const data = specialDays.count({
        where: query,
      });
      resolve(data);
    });
  };

  // GET ALL SpecialDays
  public _getAllData = async (
    query: WhereOptions = {},
    p: number = 0,
    l: number = 0,
    sortBy: string = 'id',
    orderBy: string = 'asc',
    year: string = null,
    month: string = null
  ) => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: Number(l),
      sortBy,
      orderBy,
    });

    let validation = {};
    if (Object.keys(query).length) {
      validation = { ...validation, where: query };
    }
    if (year != null) {
      console.warn(query);
      if (month != null) {
        validation = {
          ...validation,
          where: {
            [Op.and]: [
              _sequelize.where(_sequelize.fn('YEAR', _sequelize.col('from_date')), year),
              _sequelize.where(_sequelize.fn('MONTH', _sequelize.col('from_date')), month),
            ],
          },
        };
      } else {
        validation = { ...validation, where: _sequelize.where(_sequelize.fn('YEAR', _sequelize.col('from_date')), year) };
      }
    }
    if (limit > 0) {
      validation = { ...validation, limit };
    }
    if (offset > 0) {
      validation = { ...validation, offset };
    }
    if (order) {
      validation = { ...validation, order };
    }

    return new Promise<iSpecialDays[]>((resolve, reject) => {
      const data = specialDays.findAll(validation);
      resolve(data);
    });
  };

  // GET SINGLE specialDays
  public _getSingleData = async (query: WhereOptions) => {
    return new Promise<iSpecialDays>((resolve, reject) => {
      const data = specialDays.findOne({
        where: query,
      });
      resolve(data);
    });
  };

  // CREATE specialDays
  public _create = async (obj) => {
    return new Promise<iSpecialDays>((resolve, reject) => {
      const data = specialDays.create(obj);
      resolve(data);
    });
  };

  // UPDATE specialDays
  public _update = async (query: WhereOptions, obj) => {
    return new Promise((resolve, reject) => {
      const data = specialDays.update(obj, { where: query });
      resolve(data);
    });
  };

  // DELETE specialDays
  public _delete = async (query: WhereOptions) => {
    return new Promise((resolve, reject) => {
      const data = specialDays.destroy({ where: query });
      resolve(data);
    });
  };
}

export default SpecialDaysService;
