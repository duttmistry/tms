import { APIResponseFormat } from '@tms-workspace/apis-core';
import { Op, Sequelize } from 'sequelize';
import { iSiteSetting, iSiteSettingMulti } from './database/interface/site_settings.interface';
import SiteSettingService from './services/site_settings.services';

export const _GetByName = async (name: string) => {
  const siteSetting = new SiteSettingService();
  try {
    if (!name && name === '') {
      return APIResponseFormat._ResMissingRequiredField('Site Setting Name');
    }

    const data = await siteSetting._getSingleData({ name: name });
    if (!data) {
      return APIResponseFormat._ResDataNotFound();
    }

    return APIResponseFormat._ResDataFound(data);
  } catch (error) {
    return APIResponseFormat._ResIntervalServerError(error.message);
  }
};

export const _GetByIdentifier = async (identifier: string) => {
  const siteSetting = new SiteSettingService();
  try {
    if (!identifier && identifier === '') {
      return APIResponseFormat._ResMissingRequiredField('Site Setting Name');
    }

    const data = await siteSetting._getSingleData({ identifier: identifier });
    if (!data) {
      return APIResponseFormat._ResDataNotFound();
    }

    return APIResponseFormat._ResDataFound(data);
  } catch (error) {
    return APIResponseFormat._ResIntervalServerError(error.message);
  }
};

export const _GetByModule = async (module: string) => {
  const siteSetting = new SiteSettingService();
  try {
    if (!module && module === '') {
      return APIResponseFormat._ResMissingRequiredField('Site Setting Name');
    }

    const data = await siteSetting._getMultiData({ module: module });
    if (!data) {
      return APIResponseFormat._ResDataNotFound();
    }

    return APIResponseFormat._ResDataFound(data);
  } catch (error) {
    return APIResponseFormat._ResIntervalServerError(error.message);
  }
};

export const _GetBySimilarName = async (name: string) => {
  const siteSetting = new SiteSettingService();
  try {
    if (!name && name === '') {
      return APIResponseFormat._ResMissingRequiredField('Site Setting Name');
    }

    const data = await siteSetting._getMultiData({ name: { [Op.like]: `%${name}%` } });
    if (!data) {
      return APIResponseFormat._ResDataNotFound();
    }

    return APIResponseFormat._ResDataFound(data);
  } catch (error) {
    return APIResponseFormat._ResIntervalServerError(error.message);
  }
};

export const _GetAll = async () => {
  const siteSetting = new SiteSettingService();
  try {
    const data = await siteSetting._getAllData();
    if (!data) {
      return APIResponseFormat._ResDataNotFound();
    }

    return APIResponseFormat._ResDataFound(data);
  } catch (error) {
    return APIResponseFormat._ResIntervalServerError(error.message);
  }
};

export const _SetSingleField = async (body: iSiteSetting) => {
  const siteSetting = new SiteSettingService();
  try {
    const { id } = body;
    if (id) {
      const data = await siteSetting._update({ id: id }, body);
      if (Array.isArray(data)) {
        return APIResponseFormat._ResDataUpdated('Site Setting');
      } else {
        return APIResponseFormat._ResDataNotUpdated('Site Setting');
      }
    } else {
      const data = await siteSetting._create(body);
      if (JSON.parse(JSON.stringify(data)).identifier) {
        return APIResponseFormat._ResDataCreated('Site Setting');
      } else {
        return APIResponseFormat._ResDataNotCreated('Site Setting');
      }
    }
  } catch (error) {
    return APIResponseFormat._ResIntervalServerError(error.message);
  }
};

export const _SetModulewiseField = async (body: iSiteSettingMulti) => {
  const siteSetting = new SiteSettingService();
  try {
    const { module, fields } = body;
    const create = [];
    const update = [];
    for (const element of fields) {
      if (element.id) {
        if (element.identifier === 'leave_reponsible_person') {
          console.log('value', element.value, 'LIB 1');

          const getOldData = await siteSetting._getSingleData({ identifier: element.identifier }).then((res) => {
            return JSON.parse(JSON.stringify(res));
          });

          const newLRP = JSON.parse(JSON.stringify(element.value));
          const oldLRP = JSON.parse(JSON.stringify(getOldData.value));

          console.log('newLRP', newLRP);
          console.log('oldLRP', oldLRP);
          const deletedLRP = oldLRP.filter(
            (el) =>
              !newLRP.find((e) => {
                return e == el;
              })
          );

          if (deletedLRP.length > 0) {
            deletedLRP.forEach(async (LRP) => {
              const getPendingLeaveData = await siteSetting._getPendingLeaveByLRP({
                [Op.and]: [
                  Sequelize.fn('JSON_CONTAINS', Sequelize.col('approved_required_from'), Sequelize.cast(LRP, 'CHAR CHARACTER SET utf8')),
                  {
                    status: 'PENDING',
                  },
                ],
              });

              console.log(getPendingLeaveData, 'getPendingLeaveData');
              if (getPendingLeaveData.length > 0) {
                getPendingLeaveData.forEach(async (leave) => {
                  leave.approved_required_from = leave.approved_required_from.filter((element) => element !== LRP);

                  await siteSetting._updateleaveData(leave, { id: leave.id });
                  await siteSetting._deleteLeaveApproval({
                    user_id: LRP,
                  });
                });
              }
            });
          }

          const newAddedLRP = newLRP.filter(
            (el) =>
              !oldLRP.find((e) => {
                return e == el;
              })
          );

          if (newAddedLRP.length > 0) {
            newAddedLRP.forEach(async (LRP) => {
              const getPendingLeaveData = await siteSetting._getPendingLeaveByLRP({
                status: 'PENDING',
                approved_required_from: {
                  [Op.ne]: null,
                },
              });

              if (getPendingLeaveData.length > 0) {
                getPendingLeaveData.forEach(async (leave) => {
                  leave?.approved_required_from.push(LRP);

                  await siteSetting._updateleaveData(leave, { id: leave.id });
                  await siteSetting._createLeaveApproval({
                    leave_history_id: leave.id,
                    status: 'PENDING',
                    user_id: LRP,
                    action_comment: '',
                    type: 'leave_responsible_person',
                  });
                });
              }
            });
          }

          console.log('deletedLRP', deletedLRP);
          console.log('newAddedLRP', newAddedLRP);
        }
        const data = await siteSetting._update({ id: element.id }, { module, ...element });

        if (!Array.isArray(data)) {
          update.push(element.name);
          // return APIResponseFormat._ResDataNotUpdated('Site Setting');
        }
      } else {
        if (element.identifier === 'leave_reponsible_person') {
          console.log('value', element.value, 'LIB 2');
        }

        const data = await siteSetting._create({ module, ...element });
        if (!JSON.parse(JSON.stringify(data)).identifier) {
          create.push(element.name);
          // return APIResponseFormat._ResDataNotCreated('Site Setting');
        }
      }
    }
    if (create.length == 0 && update.length == 0) {
      return APIResponseFormat._ResDataUpdated('Site Setting');
    } else {
      return APIResponseFormat._ResDataNotCreatedAndUpdated(create, update);
    }
  } catch (error) {
    return APIResponseFormat._ResIntervalServerError(error.message);
  }
};
