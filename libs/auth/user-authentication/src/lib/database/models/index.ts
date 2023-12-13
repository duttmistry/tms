import * as Sequelize from 'sequelize';
import { developmentDBConfig, productionDBConfig, stagingDBConfig } from '@tms-workspace/configurations';

// Models
import UserModel from './user.model';
import UserLogModel from './user_log.model';

import * as Enviornment from '../../../enviornment';

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
    console.log(`MySQL Used ${_MYSQL_DB_DATABASE} Database for Authentication Middleware`);
  })
  .catch((err) => {
    console.log(`MySQL Database not connected properly bcz ${err.message}`);
  });

const _DB = {
  User: UserModel(sequelize),
  UserLog: UserLogModel(sequelize),
  sequelize,
  Sequelize,
};

// Associations

_DB.UserLog.belongsTo(_DB.User, {
  as: 'user',
  foreignKey: 'user_id',
});

_DB.User.hasMany(_DB.UserLog, {
  foreignKey: 'user_id',
  as: 'UsersTimeLog',
});

export default _DB;
