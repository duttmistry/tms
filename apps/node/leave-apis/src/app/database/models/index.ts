import Sequelize from 'sequelize';
import { developmentDBConfig, stagingDBConfig, productionDBConfig } from '@tms-workspace/configurations';
import LeaveHistoryModel from './leave_history.model';
import LeaveHistoryLogModel from './leave_history_log.model';
import HolidayModel from './holiday.model';
import LeaveSubjectModel from './leave_subjects.model';
import LeaveApprovalModel from './leave_approval.model';
import UserModel from './user.model';
import LeaveBalance from './leave_balance.model';
import LeaveTransectionHistoryModel from './leave_transection_history.model';
import LeaveOpeningBalanceModel from './leave_opening_balance.model';
import LeaveManualUpdatesLogModel from './leave_manual_update_log';
import LeaveManualUpdatesDraftDataModel from './leave_manual_update_draft_data';
import LeaveHistoryLeaveTypeModel from './leave_history_leave_type';
import SiteSettingModel from './site_settings.model';
import ProjectTeamModel from './project_team.model';
import ProjectsModel from './projects.model';
import ProjectBillingConfigrationModel from './biling_configuration.model';

import * as Enviornment from '../../../enviornment.js';

// global variables
const _NODE_ENV = Enviornment.default.state || 'development';
const _MYSQL_HOST =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MYSQL.HOST
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MYSQL.HOST
    : productionDBConfig.default.MYSQL.HOST;
const _MYSQL_DB_DATABASE =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MYSQL.DATABASE
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MYSQL.DATABASE
    : productionDBConfig.default.MYSQL.DATABASE;
const _MYSQL_PORT =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MYSQL.PORT
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MYSQL.PORT
    : productionDBConfig.default.MYSQL.PORT;
const _MYSQL_DB_USER =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MYSQL.USERNAME
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MYSQL.USERNAME
    : productionDBConfig.default.MYSQL.USERNAME;
const _MYSQL_DB_PASSWORD =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MYSQL.PASSWORD
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MYSQL.PASSWORD
    : productionDBConfig.default.MYSQL.PASSWORD;

const sequelize = new Sequelize.Sequelize(_MYSQL_DB_DATABASE, _MYSQL_DB_USER, _MYSQL_DB_PASSWORD, {
  dialect: 'mysql',
  host: _MYSQL_HOST,
  port: _MYSQL_PORT,
  timezone: '+05:30',
  define: {
    // underscored: true,
    freezeTableName: true,
    hooks: {
      beforeFind: (model) => {
        model.attributes = { exclude: ['created_at', 'deleted_at', 'updated_at'] };
      },
    },
  },
  pool: {
    min: 0,
    max: 5,
  },
  logQueryParameters: _NODE_ENV === 'development',
  logging: _NODE_ENV === 'development' ? true : false,
  benchmark: true,
});

sequelize
  .authenticate()
  .then(() => {
    console.log('MySQL Database Connected Successfully');
    console.log(`MySQL Used ${_MYSQL_DB_DATABASE} Database`);
  })
  .catch((err) => {
    console.log(`MySQL Database not connected properly bcz ${err.message}`);
  });

const _DB = {
  User: UserModel(sequelize),
  LeaveBalance: LeaveBalance(sequelize),
  LeaveHistory: LeaveHistoryModel(sequelize),
  LeaveHistoryLeaveType: LeaveHistoryLeaveTypeModel(sequelize),
  LeaveHistoryLog: LeaveHistoryLogModel(sequelize),
  Holiday: HolidayModel(sequelize),
  LeaveSubject: LeaveSubjectModel(sequelize),
  LeaveApproval: LeaveApprovalModel(sequelize),
  ProjectTeam: ProjectTeamModel(sequelize),
  LeaveTransectionHistory: LeaveTransectionHistoryModel(sequelize),
  LeaveOpeningBalance: LeaveOpeningBalanceModel(sequelize),
  LeaveManualUpdateLog: LeaveManualUpdatesLogModel(sequelize),
  LeaveManualUpdatesDraftData: LeaveManualUpdatesDraftDataModel(sequelize),
  SiteSetting: SiteSettingModel(sequelize),
  Projects: ProjectsModel(sequelize),
  ProjectBillingConfigration: ProjectBillingConfigrationModel(sequelize),
  sequelize,
  Sequelize,
};

_DB.User.belongsTo(_DB.User, {
  targetKey: 'employee_id',
  foreignKey: 'team_lead',
  as: 'team_lead_name',
});

_DB.User.belongsTo(_DB.User, {
  targetKey: 'employee_id',
  foreignKey: 'project_manager',
  as: 'project_manager_name',
});

_DB.LeaveHistory.hasMany(_DB.LeaveHistoryLog, {
  foreignKey: 'leave_history_id',
  as: 'leaveHistoryLog',
});

_DB.LeaveHistory.belongsTo(_DB.LeaveSubject, {
  foreignKey: 'leave_subject',
  as: 'leaveSubject',
});

_DB.LeaveHistory.hasMany(_DB.LeaveApproval, {
  foreignKey: 'leave_history_id',
  as: 'leaveApproval',
});

_DB.LeaveHistory.hasMany(_DB.LeaveApproval, {
  foreignKey: 'leave_history_id',
  as: 'leaveApprovalData',
});

_DB.LeaveApproval.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.LeaveHistory.hasMany(_DB.LeaveHistoryLeaveType, {
  foreignKey: 'leave_history_id',
  as: 'leaveTypes',
});

_DB.LeaveHistoryLeaveType.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.ProjectTeam.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.User.hasMany(_DB.LeaveHistory, {
  foreignKey: 'user_id',
  as: 'leaveHistory',
});

_DB.LeaveHistory.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.User.hasMany(_DB.LeaveTransectionHistory, {
  foreignKey: 'user_id',
  as: 'LeaveHistoryTransection',
});

_DB.LeaveTransectionHistory.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.LeaveTransectionHistory.belongsTo(_DB.User, {
  foreignKey: 'created_by',
  as: 'CreatedByUser',
});

_DB.LeaveBalance.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.User.hasMany(_DB.LeaveBalance, {
  foreignKey: 'user_id',
  as: 'leaveBalance',
});

_DB.LeaveHistoryLog.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.LeaveHistoryLog.belongsTo(_DB.User, {
  foreignKey: 'action_by',
  as: 'actionBy',
});

_DB.LeaveHistoryLog.belongsTo(_DB.LeaveHistory, {
  foreignKey: 'leave_history_id',
  as: 'leave',
});

_DB.User.hasMany(_DB.LeaveOpeningBalance, {
  foreignKey: 'user_id',
  as: 'leaveOpeningClosingBalance',
});

//Leave Manual Update Log & Data Assocation

_DB.LeaveManualUpdateLog.belongsTo(_DB.User, {
  foreignKey: 'created_by',
  as: 'createdBy',
});

_DB.LeaveManualUpdateLog.belongsTo(_DB.User, {
  foreignKey: 'updated_by',
  as: 'updatedBy',
});

_DB.LeaveManualUpdateLog.hasMany(_DB.LeaveManualUpdatesDraftData, {
  foreignKey: 'leave_manual_log_id',
  as: 'leaveManualUpdateDraftData',
});

_DB.LeaveManualUpdatesDraftData.belongsTo(_DB.LeaveManualUpdateLog, {
  foreignKey: 'leave_manual_log_id',
  as: 'leaveManualUpdateLog`',
});

_DB.LeaveManualUpdatesDraftData.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'userDetails',
});

_DB.LeaveManualUpdatesDraftData.belongsTo(_DB.User, {
  foreignKey: 'created_by',
  as: 'createdBy',
});

_DB.LeaveManualUpdatesDraftData.belongsTo(_DB.User, {
  foreignKey: 'updated_by',
  as: 'updatedBy',
});

_DB.Projects.hasOne(_DB.ProjectBillingConfigration, {
  foreignKey: 'project_id',
  as: 'projectBillingConfigration',
});

_DB.ProjectBillingConfigration.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

_DB.ProjectTeam.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'teamProjectData',
});

export default _DB;
