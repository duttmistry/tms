import mongoose from 'mongoose';
import { developmentDBConfig, stagingDBConfig, productionDBConfig } from '@tms-workspace/configurations';
import * as Enviornment from '../../../enviornment';

// global variables
const _NODE_ENV = Enviornment.default.state || "development";
//const _NODE_ENV = 'DEVELOPMENT';
const _MONGO_HOST =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MONGO.HOST
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MONGO.HOST
    : productionDBConfig.default.MONGO.HOST;
const _MONGO_DB_DATABASE =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MONGO.DATABASE
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MONGO.DATABASE
    : productionDBConfig.default.MONGO.DATABASE;
const _MONGO_PORT =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MONGO.PORT
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MONGO.PORT
    : productionDBConfig.default.MONGO.PORT;

// const _MYSQL_DB_USER =
//   _NODE_ENV == 'DEVELOPMENT'
//     ? developmentDBConfig.default.MYSQL.USERNAME
//     : _NODE_ENV == 'STAGING'
//     ? stagingDBConfig.default.MYSQL.USERNAME
//     : productionDBConfig.default.MYSQL.USERNAME;
// const _MYSQL_DB_PASSWORD =
//   _NODE_ENV == 'DEVELOPMENT'
//     ? developmentDBConfig.default.MYSQL.PASSWORD
//     : _NODE_ENV == 'STAGING'
//     ? stagingDBConfig.default.MYSQL.PASSWORD
//     : productionDBConfig.default.MYSQL.PASSWORD;

// Mongo DB Connection String
export const dbConnection = {
  url: `mongodb://${_MONGO_HOST}:${_MONGO_PORT}/${_MONGO_DB_DATABASE}`,
};
