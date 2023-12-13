import { WhereOptions } from 'sequelize';
import { iSiteSetting } from '../../../database/interface/site_setting.interface';
import _DB from '../../../database/models';
import { query } from 'express';

const siteSetting = _DB.SiteSetting;

class SiteSettingService {
  // GET SINGLE Site Setting
  public _getSingleData = async (query: WhereOptions) => {
    return new Promise<iSiteSetting>((resolve, reject) => {
      const data = siteSetting
        .findOne({
          where: query,
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  // CREATE SITE SETTINGS
  public _create = async (createObj) => {
    return new Promise<iSiteSetting>(async (resolve, reject) => {
      await siteSetting
        .create(createObj)
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          resolve(err);
        });
    });
  };

  // UPDATE SITE SETTINGS
  public _update = async (query: WhereOptions, updateObj) => {
    return new Promise(async (resolve, reject) => {
      await siteSetting
        .update(updateObj, { where: query })
        .then((data) => {
          console.warn(data);
          resolve(data);
        })
        .catch((err) => {
          resolve(err);
        });
    });
  };

  public _ceoFindOrCreate = async (createObj) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const data = await _DB.Ceo.update(createObj, { where: { id: '1' } });
      return data;
    } catch (error) {
      throw error;
    }
  };

  // get ceo details
  public _getCeoDetails = async (query: WhereOptions) => {
    try {
      const data = await _DB.Ceo.findOne({
        where: query,
        include: [
          {
            model: _DB.User,
            as: 'ceo',
          },
        ],
      });

      return data;
    } catch (error) {
      throw error;
    }
  };
}

export default SiteSettingService;
