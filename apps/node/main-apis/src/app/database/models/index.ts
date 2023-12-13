import Sequelize from 'sequelize';
import { developmentDBConfig, stagingDBConfig, productionDBConfig } from '@tms-workspace/configurations';

// Leave API Module

// import LeaveHistoryModel from './leave_history.model';
// import LeaveHistoryLogModel from './leave_history_log.model';

// Main API Module
import UserModel from './user.model';
import UserLogModel from './user_log.model';
import UserRolesModel from './user_roles.model';
import UserWithRoleModel from './user_with_role.model';

import WorkspaceModel from './workspace.model';
import WorkspaceTeamModel from './workspace_team.model';
import ProjectWorkspaceModel from './project_workspace.model';

import ProjectsModel from './projects.model';
import ProjectTagModel from './project_tag.model';
import ProjectTeamModel from './project_team.model';
import ProjectStatusModel from './project_status.model';

import HolidayModel from './holiday.model';
import SpecialDaysModel from './specialdays.model';
import SampleModel from './sample.model';
import CmsModel from './tm_cms.model';
import SiteSettingModel from './site_setting';
import TagModel from './tag.model';
import LeaveHistoryModel from './leave_history.model';
import LeaveSubjectModel from './leave_subjects.model';
import LeaveBalanceModel from './leave_balance.model';
import LeaveTransectionHistoryModel from './leave_transection_history.model';
import LeaveOpeningBalanceModel from './leave_opening_balance.model';
import CustomFieldsModel from './custom_fields.model';
import ProjectCustomFieldsMappingModel from './project_custom_fields_mapping.model';
import ProjectBillingConfigrationModel from './biling_configuration.model';
import ProjectDocumentModel from './tm_project_dovuments.model';
import ProjectTaskModel from './tasks.model';
import CeoModel from './tm_ceo';
import HelpsModel from './helps';
import * as Enviornment from '../../../enviornment';

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
        model.attributes = {
          exclude: [ 'deleted_at', 'updated_at'],
        };
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
    console.log(`MySQL Used ${_MYSQL_DB_DATABASE} Database for Main App`);
  })
  .catch((err) => {
    console.log(`MySQL Database not connected properly bcz ${err.message}`);
  });

const _DB = {
  User: UserModel(sequelize),
  UserLog: UserLogModel(sequelize),
  UserRoles: UserRolesModel(sequelize),
  UserWithRole: UserWithRoleModel(sequelize),
  Workspace: WorkspaceModel(sequelize),
  WorkspaceTeam: WorkspaceTeamModel(sequelize),
  ProjectWorkspace: ProjectWorkspaceModel(sequelize),
  Projects: ProjectsModel(sequelize),
  ProjectTags: ProjectTagModel(sequelize),
  ProjectTeam: ProjectTeamModel(sequelize),
  ProjectStatus: ProjectStatusModel(sequelize),
  Holiday: HolidayModel(sequelize),
  SpecialDays: SpecialDaysModel(sequelize),
  Sample: SampleModel(sequelize),
  CMS: CmsModel(sequelize),
  SiteSetting: SiteSettingModel(sequelize),
  Tag: TagModel(sequelize),
  Leave: LeaveHistoryModel(sequelize),
  LeaveBalance: LeaveBalanceModel(sequelize),
  LeaveSubject: LeaveSubjectModel(sequelize),
  LeaveTransectionHistory: LeaveTransectionHistoryModel(sequelize),
  LeaveOpeningBalance: LeaveOpeningBalanceModel(sequelize),
  CustomFields: CustomFieldsModel(sequelize),
  ProjectCustomFieldsMapping: ProjectCustomFieldsMappingModel(sequelize),
  ProjectBillingConfigration: ProjectBillingConfigrationModel(sequelize),
  ProjectDocument: ProjectDocumentModel(sequelize),
  ProjectTask: ProjectTaskModel(sequelize),
  Ceo: CeoModel(sequelize),
  Helps : HelpsModel(sequelize),
  sequelize,
  Sequelize,
};

// CEO table
// Ceo Model
_DB.User.hasOne(_DB.Ceo, {
  foreignKey: 'user_id', // Define the foreign key as 'user_id'
  as: 'user', // Alias for the association, if needed
});

// User Model
_DB.Ceo.belongsTo(_DB.User, {
  foreignKey: 'user_id', // Define the foreign key as 'user_id'
  as: 'ceo', // Alias for the association, if needed
});

// Projects
_DB.Projects.hasMany(_DB.ProjectTags, {
  foreignKey: 'project_id',
  as: 'projectTag',
  hooks: true,
});

_DB.ProjectTags.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'tags',
});

_DB.ProjectTags.belongsTo(_DB.Tag, {
  foreignKey: 'tag_id',
  as: 'tag',
});

_DB.Projects.hasMany(_DB.ProjectTeam, {
  foreignKey: 'project_id',
  as: 'projectTeam',
});

_DB.ProjectTeam.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'teamProject',
});

_DB.Projects.hasMany(_DB.ProjectTeam, {
  foreignKey: 'project_id',
  as: 'projectTeamData',
});

_DB.ProjectTeam.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'teamProjectData',
});

_DB.ProjectTeam.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.Projects.hasOne(_DB.ProjectWorkspace, {
  foreignKey: 'project_id',
  as: 'projectWorkspace',
});

_DB.ProjectWorkspace.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

_DB.Projects.hasOne(_DB.ProjectBillingConfigration, {
  foreignKey: 'project_id',
  as: 'projectBillingConfigration',
});

_DB.ProjectBillingConfigration.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

_DB.Projects.belongsTo(_DB.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });


_DB.Projects.belongsTo(_DB.User, {
  foreignKey: 'responsible_person',
  as: 'projectResponsiblePerson',
});

_DB.ProjectWorkspace.belongsTo(_DB.Workspace, {
  foreignKey: 'workspace_id',
  as: 'workspace',
});

_DB.ProjectTeam.belongsTo(_DB.Leave, {
  targetKey: 'user_id',
  foreignKey: 'user_id',
  as: 'leave',
});

_DB.Projects.hasMany(_DB.ProjectStatus, {
  foreignKey: 'project_id',
  as: 'projectStatus',
});

_DB.ProjectStatus.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

// User Association

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

_DB.User.hasOne(_DB.UserWithRole, {
  foreignKey: 'user_id',
  as: 'user_with_role',
});

_DB.UserWithRole.belongsTo(_DB.UserRoles, {
  foreignKey: 'role_id',
  as: 'user_role',
});

_DB.User.hasMany(_DB.Leave, {
  foreignKey: 'user_id',
  as: 'leaveHistory',
});

_DB.Leave.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User log Association

_DB.UserLog.belongsTo(_DB.User, {
  as: 'user',
  foreignKey: 'user_id',
});

_DB.User.hasMany(_DB.UserLog, {
  foreignKey: 'user_id',
  as: 'UsersTimeLog',
});

_DB.LeaveBalance.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'user',
});

_DB.User.hasMany(_DB.LeaveBalance, {
  foreignKey: 'user_id',
  as: 'leaveBalance',
});

// _DB.UserLog.belongsTo(_DB.User, {
//   as: 'action_user',
//   foreignKey: 'action_by',
// });

// _DB.User.hasOne(_DB.UserLog, {
//   foreignKey: 'action_by',
//   as: 'UserActionLog',
// });

// Workspace
_DB.Workspace.belongsTo(_DB.User, {
  foreignKey: 'responsible_person',
  as: 'responsiblePerson',
});

_DB.Workspace.hasMany(_DB.WorkspaceTeam, {
  foreignKey: 'workspace_id',
  as: 'team',
});

_DB.Workspace.hasMany(_DB.ProjectWorkspace, {
  foreignKey: 'workspace_id',
  as: 'workspaceProject',
});

_DB.WorkspaceTeam.belongsTo(_DB.User, {
  as: 'user',
  foreignKey: 'user_id',
});

// Custom Fields
_DB.CustomFields.hasMany(_DB.ProjectCustomFieldsMapping, {
  foreignKey: 'custom_field_id',
  as: 'projectCustomFields',
});
_DB.ProjectCustomFieldsMapping.belongsTo(_DB.CustomFields, {
  foreignKey: 'custom_field_id',
  as: 'customField',
});

_DB.Projects.hasMany(_DB.ProjectCustomFieldsMapping, {
  foreignKey: 'project_id',
  as: 'projectCustomFieldsMapping',
});

_DB.ProjectCustomFieldsMapping.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

_DB.Projects.hasMany(_DB.ProjectDocument, {
  foreignKey: 'project_id',
  as: 'ProjectDocument',
});

_DB.ProjectDocument.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

_DB.Projects.hasMany(_DB.ProjectTask, {
  foreignKey: 'project_id',
  as: 'ProjectTasks',
});

_DB.ProjectTask.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

_DB.Leave.belongsTo(_DB.LeaveSubject, {
  foreignKey: 'leave_subject',
  as: 'leaveSubject',
});

export default _DB;
