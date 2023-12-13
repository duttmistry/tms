import { APIResponseFormat } from '@tms-workspace/apis-core';
import { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { MyEnum } from '../../database/interface/leave.interface';
import { Leave_Manual_Enum, Leave_Type } from '@tms-workspace/enum-data';
import _DB from '../../database/models';
import { Op, QueryTypes, Sequelize, WhereOptions, where } from 'sequelize';
import * as Preference from '@tms-workspace/preference';

class InactiveCron {
  public inActiveController = async () => {
    try {
      const rawQuery = `
      SELECT DISTINCT tul.user_id
      FROM tm_user_logs tul
      LEFT JOIN tm_tasks_running_status_mapping trsm ON tul.user_id = trsm.user_id
      LEFT JOIN tm_user_with_roles ur ON tul.user_id = ur.user_id
      LEFT JOIN tm_user_roles r ON ur.role_id = r.id
      WHERE (
        (tul.action = 'BACK_FROM_BREAK' AND tul.action_end_date IS NULL)
        OR (tul.action = 'LOGIN' AND tul.action_end_date IS NULL)
      )
      AND tul.user_id NOT IN (
        SELECT DISTINCT user_id
        FROM tm_tasks_running_status_mapping
        WHERE running_status = 'Ongoing'
      )
      AND r.title != 'Super Admin';
      `;

      const data: any = await _DB.sequelize.query(rawQuery, {
        type: QueryTypes.SELECT,
        replacements: {},
      });

      let userIds = [];

      if (data.length > 0) {
        for (const user of data) {
          userIds = [...userIds, user.user_id.toString()];
        }
      }

      const userDeviceToken = await Preference._getUsersDeviceToken(userIds);
    } catch (error) {
      console.log(error);
    }
  };
}

export default InactiveCron;
