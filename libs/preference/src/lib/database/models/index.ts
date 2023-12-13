import userModel from './user.model';
import Template from './Template';
import InstanceVariable from './instance_variable.model';
import { connect, set } from 'mongoose';
import { dbConnection } from './mongoConnection';
import { TimeLogs } from './task_time_logs.model';
import TaskModel from './tasks.model';
import SQLUserModel from './sqlUser.model';
import WorkspaceModel from './workspace.model';
import ProjectTeamModel from './project_team.model';
import ProjectsModel from './projects.model';
import WorkspaceTeamModel from './workspace_team.model';
import ProjectDocumentModel from './tm_project_documents.model';

import NotificationLog from './notification_log.model';
import TaskRunningStatusModel from './task_running_status.model';
import * as Sequelize from 'sequelize';
import { developmentDBConfig, productionDBConfig, stagingDBConfig } from '@tms-workspace/configurations';
import * as Enviornment from '../../../enviornment';
import Action from './actions.model';
import ActionEmailTemplateBind from './actionEmailTemplateBind';
import { TaskChangeLog } from './task_change_log.model';

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
  logging: _NODE_ENV === 'development' ? true : false,
  benchmark: true,
});
sequelize
  .authenticate()
  .then(() => {
    console.log('MySQL Database Connected Successfully');
    console.log(`MySQL Used ${_MYSQL_DB_DATABASE} Database for Preference`);
  })
  .catch((err) => {
    console.log(`MySQL Database not connected properly bcz ${err.message}`);
  });

connect(dbConnection.url)
  .then(() => {
    console.log('MongoDB Database Connection for Preference Successfully', dbConnection.url);
  })
  .catch((err) => {
    console.log(`MongoDB Database not connected properly bcz ${err.message}`);
  });

const _DB = {
  userModel: userModel,
  TimeLogs: TimeLogs,
  TaskChangeLog: TaskChangeLog,
  Template: Template,
  InstanceVariable: InstanceVariable,
  NotificationLog: NotificationLog,
  Action: Action,
  ActionEmailTemplateBind: ActionEmailTemplateBind,
  Tasks: TaskModel(sequelize),
  TaskRunningStatus: TaskRunningStatusModel(sequelize),
  User: SQLUserModel(sequelize),
  Workspace: WorkspaceModel(sequelize),
  WorkspaceTeam: WorkspaceTeamModel(sequelize),
  Projects: ProjectsModel(sequelize),
  ProjectTeam: ProjectTeamModel(sequelize),
  ProjectDocument: ProjectDocumentModel(sequelize),
  sequelize,
  Sequelize,
};

// Projects
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

_DB.Projects.belongsTo(_DB.User, {
  foreignKey: 'responsible_person',
  as: 'projectResponsiblePerson',
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

// Workspace
_DB.Workspace.belongsTo(_DB.User, {
  foreignKey: 'responsible_person',
  as: 'responsiblePerson',
});

_DB.Workspace.hasMany(_DB.WorkspaceTeam, {
  foreignKey: 'workspace_id',
  as: 'team',
});

_DB.WorkspaceTeam.belongsTo(_DB.User, {
  as: 'user',
  foreignKey: 'user_id',
});

_DB.Projects.hasMany(_DB.ProjectDocument, {
  foreignKey: 'project_id',
  as: 'ProjectDocument',
});

_DB.ProjectDocument.belongsTo(_DB.Projects, {
  foreignKey: 'project_id',
  as: 'project',
});

export default _DB;
