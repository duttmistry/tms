import { NextFunction, Response, Request } from 'express';
import * as jwt from 'jsonwebtoken';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { developmentConfig, stagingConfig, productionConfig } from '@tms-workspace/configurations';

import { APIResponseFormat } from '@tms-workspace/apis-core';
import AuthMiddlewareService from './services/auth-middleware.service';
import * as Enviornment from '../enviornment';
import * as config from '@uss/site-settings';


export interface UserWithRequest extends Request {
  user: any; // or any other type
}

export interface JwtPayload {
  id: number;
}

const _NODE_ENV = Enviornment.default.state || 'development';
// const _NODE_ENV = 'DEVELOPMENT';
const SECRET_KEY =
  _NODE_ENV == 'DEVELOPMENT'
    ? developmentConfig.default.SECRET_KEY
    : _NODE_ENV == 'STAGING'
    ? stagingConfig.default.SECRET_KEY
    : productionConfig.default.SECRET_KEY;

    const _areIPsEqual = (ip1, ip2) => {
      const ip1WithoutPrefix = ip1?.replace('::ffff:', '') || '';
      const ip2WithoutPrefix = ip2?.replace('::ffff:', '') || '';
  
      const ip1Components = ip1WithoutPrefix?.toLowerCase()?.split('.') || [];
      const ip2Components = ip2WithoutPrefix?.toLowerCase()?.split('.') || [];
      let isOffice = true;
      let index = 0;
      for (const ip of ip1Components) {
        if (ip !== 'x') {
          if (ip !== ip2Components[index]) {
            isOffice = false;
          }
        }
        index = index + 1;
      }
      // if (ip1Components.length !== 4 || ip2Components.length !== 4) {
      //   return false; // IP addresses must have four components
      // }
  
      // for (let i = 0; i < 4; i++) {
      //   if (ip1Components[i] !== ip2Components[i] && ip2Components[i] !== 'x') {
      //     return false; // IP components don't match
      //   }
      // }
  
      return isOffice; // IP addresses are the same
    };
const auth = async (req: UserWithRequest, res: Response, next: NextFunction) => {
  const authMiddlewareService = new AuthMiddlewareService();
  try {
    /* 
      ! req?.cookies['authorization'] Not Working in Condition
      ? req?.cookies['authorization'] || req?.headers['authorization'] ? req?.headers['authorization'] : null
    */

    const { ip, sessionid } = req.headers;
    const remortIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress?.replace('::ffff:', '') || '';
    // const remortIp = '10.0.0.11'.replace('::ffff:', '');
    let ipData = await config._GetByName(`Office Ip`);
    console.log('ipData', remortIp);
    
      ipData = JSON.parse(JSON.stringify(ipData));

      let whitelistedIPData = await config._GetByName(`Whitelisted IP`);
      whitelistedIPData = JSON.parse(JSON.stringify(whitelistedIPData));
      const isvaildIp = whitelistedIPData?.data?.value?.fixed?.indexOf(`${remortIp}`) !== -1 || false;
      if (!isvaildIp) {
        let validPattern = false;
        const patterns = whitelistedIPData?.data?.value?.pattern;
        if (patterns) {
          for (const element of patterns) {
            if (element === 'X.X.X.X') {
              validPattern = true;
              break;
            }
            validPattern = await _areIPsEqual(element, remortIp);
            if (validPattern) {
              break; // Exit the loop if a valid pattern is found
            }
          }
        }
        if (!validPattern) {
          return res.status(400).json({
            success: false,
            status: 400,
            message: 'Not login with proper ip',
          });
        }
      }
    const Authorization = req?.headers['authorization'] ? req?.headers['authorization'] : null;

    if (Authorization === null) {
      return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
    }

    const authToken: string = Authorization.split('Bearer ')[1];

    if (!authToken) {
      return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
    }

    const decoded = jwt.verify(authToken, SECRET_KEY) as JwtPayload;
    const user_id = decoded.id;

    const isSessionActive = await authMiddlewareService.checkActiveSession(user_id, sessionid as string);
    
    if (!isSessionActive) {
      return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
    }

    req.user = decoded;
  } catch (error) {
    console.log('error', error);

    return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
  }
  return next();
};

export default auth;
