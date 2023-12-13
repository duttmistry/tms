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
import CustomFieldsModel from './custom_fields.model';
import ProjectCustomFieldsMappingModel from './project_custom_fields_mapping.model';
import ProjectBillingConfigrationModel  from './biling_configuration.model';
import TaskModel from './tasks.model';
import TaskLabelModel from './tasks_labels.model';
import TaskCustomFieldValueModel from './tasks_custom_fields_value.model';
import * as Enviornment from '../../../enviornment';
import ProjectTaskSectionModel  from './project_task_section';
import TaskRunningStatusModel from './task_running_status.model';

// global variables
const _NODE_ENV = Enviornment.default.state || "development";
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
          exclude: ['created_at', 'deleted_at', 'updated_at'],
        };
      },
    },
  },
  pool: {
    min: 0,
    max: 5,
  },
  logQueryParameters: _NODE_ENV === 'development',
  logging: console.log,
  benchmark: true,
});

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('MySQL Database Connected Successfully');
//     console.log(`MySQL Used ${_MYSQL_DB_DATABASE} Database`);
//   })
//   .catch(err => {
//     console.log(`MySQL Database not connected properly bcz ${err.message}`);
//   });

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
  CustomFields: CustomFieldsModel(sequelize),
  ProjectCustomFieldsMapping: ProjectCustomFieldsMappingModel(sequelize),
  Tasks: TaskModel(sequelize),
  TaskRunningStatus:TaskRunningStatusModel(sequelize),
  TaskLabel: TaskLabelModel(sequelize),
  TaskCustomFieldValue: TaskCustomFieldValueModel(sequelize),
  ProjectBillingConfigration:ProjectBillingConfigrationModel(sequelize),
  ProjectTaskSection: ProjectTaskSectionModel(sequelize),
  sequelize,
  Sequelize,
};
//Task
_DB.Tasks.belongsTo(_DB.Tasks , {
  foreignKey: 'parent_task_id',
  as: 'parentTask',
})

_DB.Tasks.hasMany(_DB.Tasks , {
  foreignKey: 'id',
  as: 'childTask',
});

_DB.Tasks.hasMany(_DB.TaskCustomFieldValue, {
  foreignKey: 'task_id',
  as: 'TaskCustomFieldValue',
});

_DB.TaskCustomFieldValue.belongsTo(_DB.Tasks, {
  foreignKey: 'task_id',
  as: 'task',
});

_DB.Tasks.hasMany(_DB.TaskRunningStatus, {
  foreignKey: 'task_id',
  as: 'TaskRunningStatus',
});

_DB.TaskRunningStatus.belongsTo(_DB.Tasks, {
  foreignKey: 'task_id',
  as: 'task',
});

_DB.Tasks.hasOne(_DB.User, {
  foreignKey: 'id',
  sourceKey: 'assignee',
  as: 'assigneeUser',
});

// _DB.User.belongsTo(_DB.Tasks, {
//   foreignKey: 'assignee',
//   targetKey: 'id',
//   as: 'assigneeRef',
// });

_DB.Tasks.hasOne(_DB.User, {
  foreignKey: 'id',
  sourceKey: 'assigned_by',
  as: 'assignedByUser',
});

// _DB.User.belongsTo(_DB.Tasks, {
//   foreignKey: 'assigned_by',
//   targetKey: 'id',
//   as: 'assignedBy',
// });

_DB.Tasks.hasOne(_DB.User, {
  foreignKey: 'id',
  sourceKey: 'reporter',
  as: 'reportToUser',
});

// _DB.User.belongsTo(_DB.Tasks, {
//   foreignKey: 'reporter',
//   targetKey: 'id',
//   as: 'reporterRef',
// });

_DB.CustomFields.hasOne(_DB.TaskCustomFieldValue, {
  foreignKey: 'task_custom_field_id',
  as: 'TaskCustomFieldLabel',
});

_DB.TaskCustomFieldValue.belongsTo(_DB.CustomFields, {
  foreignKey: 'task_custom_field_id',
  as: 'TaskCustomFieldLabelData',
});
// Projects
_DB.Projects.hasMany(_DB.ProjectTags, {
  foreignKey: 'project_id',
  as: 'projectTag',
});

_DB.ProjectTags.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'tags',
});

_DB.Projects.hasMany(_DB.TaskLabel, {
  foreignKey: 'project_id',
  as: 'projectLabel',
});

_DB.TaskLabel.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'labels',
});

_DB.Projects.hasMany(_DB.Tasks, {
  foreignKey: 'project_id',
  as: 'projectTasks',
});

_DB.Tasks.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'projects',
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

_DB.Tasks.belongsTo(_DB.ProjectStatus, {
  foreignKey: 'status', // Define the foreign key in ProjectStatus
  as: 'TaskStatus',
});

_DB.ProjectStatus.hasOne(_DB.Tasks, {
  foreignKey: 'status', // Define the foreign key in ProjectStatus
  as: 'TaskStatus',
});

_DB.Projects.hasMany(_DB.ProjectTaskSection, {
  foreignKey: 'project_id',
  as: 'projectTaskSection',
});

_DB.ProjectTaskSection.belongsTo(_DB.Projects, {
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

// User log Association

_DB.UserLog.belongsTo(_DB.User, {
  foreignKey: 'user_id',
  as: 'Users',
});

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

_DB.Projects.hasOne(_DB.ProjectBillingConfigration, {
  foreignKey: 'project_id',
  as: 'projectBillingConfigration',
});

_DB.ProjectBillingConfigration.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

export default _DB;
