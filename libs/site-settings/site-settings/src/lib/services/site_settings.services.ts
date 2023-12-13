import { WhereOptions } from 'sequelize';
import { iSiteSetting } from '../database/interface/site_settings.interface';
import { iLeaveHistory, iLeaveApproval } from '../database/interface/leave.interface';
import _DB from '../database/models';

const siteSetting = _DB.SiteSetting;
const leaveHistory = _DB.LeaveHistory;
const leaveApproval = _DB.LeaveApproval;

class SiteSettingService {
  // GET SINGLE Site Setting
  public _getSingleData = async (query: WhereOptions) => {
    return new Promise<iSiteSetting>((resolve, reject) => {
      const data = siteSetting.findOne({
        where: query,
      });
      resolve(data);
    });
  };

  // GET SINGLE Site Setting
  public _getMultiData = async (query: WhereOptions) => {
    return new Promise<iSiteSetting[]>((resolve, reject) => {
      const data = siteSetting.findAll({
        where: query,
      });
      resolve(data);
    });
  };
  // GET ALL Site Setting
  public _getAllData = async () => {
    return new Promise<iSiteSetting[]>((resolve, reject) => {
      const data = siteSetting.findAll();
      resolve(data);
    });
  };

  // CREATE SITE SETTINGS
  public _create = async (createObj) => {
    return new Promise<iSiteSetting>((resolve, reject) => {
      siteSetting
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
    return new Promise((resolve, reject) => {
      siteSetting
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

  public _getPendingLeaveByLRP = async (query: WhereOptions) => {
    return new Promise<iLeaveHistory[]>((resolve, reject) => {
      const data = leaveHistory
        .findAll({
          where: query,
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  public _updateleaveData = async (leaveData: iLeaveHistory, query: WhereOptions) => {
    return new Promise((resolve, reject) => {
      const data = leaveHistory.update(leaveData, {
        where: query,
      });
      resolve(data);
    });
  };

  public _createLeaveApproval = async (leaveApprovalData: iLeaveApproval) => {
    return new Promise((resolve, reject) => {
      const data = leaveApproval.create(leaveApprovalData);
      resolve(data);
    });
  };

  public _deleteLeaveApproval = async (query: WhereOptions) => {
    return new Promise((resolve, reject) => {
      const data = leaveApproval.destroy({
        where: query,
      });
      resolve(data);
    });
  };
}

export default SiteSettingService;
