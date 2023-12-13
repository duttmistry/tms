import { developmentDBConfig, stagingDBConfig, productionDBConfig } from '@tms-workspace/configurations';
import * as Enviornment from '../../../enviornment';

// global variables
const _NODE_ENV = Enviornment.default.state || "development";
//const _NODE_ENV = 'DEVELOPMENT';
console.log(_NODE_ENV, 'NODE_ENV');
const _MONGO_HOST =
  _NODE_ENV == 'development' ? developmentDBConfig.default.MONGO.HOST
    : _NODE_ENV == 'STAGING'
    ? stagingDBConfig.default.MONGO.HOST
    : productionDBConfig.default.MONGO.HOST;
const _MONGO_DB_DATABASE =
  _NODE_ENV == 'development'
    ? developmentDBConfig.default.MONGO.DATABASE
    : _NODE_ENV == 'staging'
    ? stagingDBConfig.default.MONGO.DATABASE
    : productionDBConfig.default.MONGO.DATABASE;
const _MONGO_PORT =_NODE_ENV == 'development' ? developmentDBConfig.default.MONGO.PORT : _NODE_ENV == 'STAGING' ? stagingDBConfig.default.MONGO.PORT : productionDBConfig.default.MONGO.PORT; 
// Mongo DB Connection String

export const dbConnection = {
  url: `mongodb://${_MONGO_HOST}:${_MONGO_PORT}/${_MONGO_DB_DATABASE}`,
};
