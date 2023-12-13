import { APIResponseFormat } from '@tms-workspace/apis-core';
import { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { MyEnum } from '../../database/interface/leave.interface';
import { Leave_Manual_Enum, Leave_Type } from '@tms-workspace/enum-data';
import _DB from '../../database/models';
import { Op, QueryTypes, Sequelize, WhereOptions, where } from 'sequelize';
import * as config from '@uss/site-settings';
import * as Preference from '@tms-workspace/preference';
import { sendEmail } from 'libs/preference/src/lib/core/sendEmail';

class NotifyTl {


  public getTime = async () => {
    const data = await config._GetByIdentifier(`inactive_user_time`);
    return data;
  }

  public notifytlcontroller = async () => {
    try {

      let time = await this.getTime();
      time = JSON.parse(JSON.stringify(time)).data.value;

      const rawQueryForUsersEmail = 
      `
       SELECT id , first_name  , last_name , cybercom_email  FROM tm_users
       WHERE id in (:userId);
      `

      const rawQueryForLead = `
            SELECT
            tl.id AS user_id,
            tu.team_lead AS id,
            GROUP_CONCAT(tu.id ORDER BY tu.first_name ASC) AS report_to,
            GROUP_CONCAT(CONCAT(tu.first_name, ' ', tu.last_name) ORDER BY tu.first_name ASC) AS user_names,
            GROUP_CONCAT(DISTINCT CONCAT(tl.first_name, ' ', tl.last_name) ORDER BY tl.first_name ASC) AS team_lead_names
          FROM
            tm_users tu
          LEFT JOIN tm_users tl ON
            tu.team_lead = tl.employee_id
          WHERE
            tu.team_lead IS NOT NULL AND tu.deleted_at IS NULL AND tu.status != 'ex-employee' AND NOT EXISTS (
              SELECT 1
              FROM tm_users tle
              WHERE tle.employee_id = tu.team_lead
                  AND tle.status = 'ex-employee'
          )
          GROUP BY
            tu.team_lead
            
          UNION ALL
          
          SELECT
            pm.id AS user_id,
            tu.project_manager AS id,
            GROUP_CONCAT(tu.id ORDER BY tu.first_name ASC) AS report_to,
            GROUP_CONCAT(CONCAT(tu.first_name, ' ', tu.last_name) ORDER BY tu.first_name ASC) AS user_names,
            GROUP_CONCAT(DISTINCT CONCAT(pm.first_name, ' ', pm.last_name) ORDER BY pm.first_name ASC) AS project_manager_names
          FROM
            tm_users tu
          LEFT JOIN tm_users pm ON
            tu.project_manager = pm.employee_id
          WHERE
            tu.project_manager IS NOT NULL AND tu.deleted_at IS NULL AND tu.status != 'ex-employee' AND NOT EXISTS (
              SELECT 1
              FROM tm_users tle
              WHERE tle.employee_id = tu.team_lead
                  AND tle.status = 'ex-employee'
          )
          GROUP BY
            tu.project_manager;
        `;

      const rawQuery = `
        SELECT
            DISTINCT tul.user_id ,
            tu.first_name ,
            tu.last_name
        FROM
          tm_user_logs tul
        LEFT JOIN tm_tasks_running_status_mapping trsm ON
          tul.user_id = trsm.user_id
        LEFT JOIN tm_user_with_roles ur ON
          tul.user_id = ur.user_id
        LEFT JOIN tm_user_roles r ON
          ur.role_id = r.id
        JOIN tm_users tu ON
          tul.user_id = tu.id
        WHERE
          (
              (tul.action = 'BACK_FROM_BREAK'
            AND tul.action_end_date IS NULL)
          OR (tul.action = 'LOGIN'
            AND tul.action_end_date IS NULL)
            )
          AND tul.user_id IN (
          SELECT
            user_id
          FROM
            tms_development.tm_tasks_running_status_mapping x
          WHERE
            x.running_status != 'On going'
            AND (NOW() - x.updated_at) >= ${time}
          group by
            user_id
          order by
            user_id
            )
          AND r.title != 'Super Admin';
      `;

      const data: any = await _DB.sequelize.query(rawQuery, {
        type: QueryTypes.SELECT,
        replacements: {},
      });

      const leaddata: any = await _DB.sequelize.query(rawQueryForLead, {
        type: QueryTypes.SELECT,
        replacements: {},
      });

    
      leaddata.forEach((element) => {
        element.report_to = element?.report_to?.split(',').map(Number);
        element.user_names = element?.user_names?.split(',').map(String);
      });

      for (let i=0; i<leaddata.length; i++) {
        for (let j=i + 1; j<leaddata.length; j++) {
            if (leaddata[i].id === leaddata[j]?.id){
                let newArray = leaddata[i]?.report_to?.concat(leaddata[j]?.report_to);
                newArray = [... new Set(newArray)];
                let newArrayUserName = leaddata[i]?.user_names?.concat(leaddata[j]?.user_names);
                newArrayUserName = [... new Set(newArrayUserName)];
                leaddata[i].report_to = newArray;
                leaddata[j].report_to = newArray;
                leaddata[i].user_names = newArrayUserName;
                leaddata[j].user_names = newArrayUserName;
            }
        }
      }

      const groupedDataMap = new Map();
 
      for (const item of leaddata) {
          const userId = item.id;
          if (!groupedDataMap.has(userId) && userId != null) {
                 groupedDataMap.set(userId, item);
           }
      }

      const groupedData = Array.from(groupedDataMap.values());
    
      const userMap = new Map();

      const teamLeadFreeUserData = groupedData.map(lead => {
          if(lead?.report_to && lead?.report_to.length > 0){
              for(let i=0; i<data.length; i++){
                  if(lead.report_to.includes(data[i].user_id)){
                      if (userMap.has(lead.id)) {
                        // If yes, update the existing object
                          const existingObj = userMap.get(lead.id);
                          existingObj.free_user_ids.push(data[i]);
                      } else {
                          // If no, create a new object and add it to the map
                          const newObj = { ...lead, free_user_ids: [data[i]] };
                          userMap.set(lead.id, newObj);
                      }
                  }
              }
          }
      });

            // Convert the values of the map to an array
      const consolidatedArr = Array.from(userMap.values());
      
      let userIdsString = [];
      
      if (consolidatedArr.length > 0) {
        for (const user of consolidatedArr) {
          userIdsString = [...userIdsString, user?.user_id.toString()];
        }
      }
      
      const userDeviceToken = await Preference._getUsersDeviceTokenLead(userIdsString);
      
      // sending emails;
      const userId = consolidatedArr.map((item) => item.user_id);
      // console.log('userIDs: ', userId);
      
      const replacementsforlead = {
        userId: userId.length > 0 ? userId : ''
      };
      
      
      const useremialData: any = await _DB.sequelize.query(rawQueryForUsersEmail, {
        type: QueryTypes.SELECT,
        replacements: replacementsforlead,
      });
      
      for (let i = 0 ; i < useremialData.length ; i ++) {
        for ( let j =0 ; j < consolidatedArr.length ; j ++) {
            if (useremialData[i].id === consolidatedArr[j].user_id) {
                useremialData[i].free_users = consolidatedArr[j].free_user_ids
              }
        }
      }
          
      // console.log('useremialData: ', useremialData);
      
      const emailTemplate = await Preference._getTemplateByActionName('Team Lead Notify');
      // console.log('emailTemplate: ', emailTemplate);
  
      useremialData?.map(async (item) => {
        await sendEmail({
          from: 'no-reply@cybercomcreation.com',
          to: [item.cybercom_email],
          subject: emailTemplate?.emailTemplateId?.subject,
          html: emailTemplate?.emailTemplateId?.content.replace(/free_users_name/g , item?.free_users?.map((user , item) => `${item + 1}.  ${user.first_name} ${user.last_name}`).join(', ')).replace(/team_lead_name/g, `${item.first_name} ${item.last_name}`).replace(/@/g, '')
        });
      })

    } catch (error) {
      console.log(error);
    }
  };
}

export default NotifyTl;