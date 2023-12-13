import { Query } from '@tms-workspace/apis-core';
import { Op, QueryTypes, Sequelize, WhereOptions } from 'sequelize';
import { iPWReport } from '../../../database/interface/task_report.interface';
import { iUser, iUserWithRole } from '../../../database/interface/user.interface';
import { ITimeLogs } from '../../../database/interface/time_logs.interface';
import { TimeLogs } from '../../../database/models/task_time_logs.model';
import _DB from '../../../database/models';

class TaskReportService {
  public _getRunningTaskReport = async (isAdmin, user_id: number, role: string) => {
    if (role.toLocaleLowerCase().trim() === 'hr') {
      isAdmin = true;
    }
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT 
        ${isAdmin ? `u.id,` : `ptm.id,ptm.report_to,`}
        t.project_id, 
        u.id AS user_id, 
        u.first_name AS user_first_name, 
        u.last_name AS user_last_name,
        (
          SELECT login_capture_data
          FROM tm_user_logs
          WHERE user_id = u.id
              AND DATE(action_start_date) = CURDATE() AND action = 'LOGIN' ORDER BY id DESC
          LIMIT 1
      ) AS login_capture_data,
        u.active_sessionid AS active_sessionid,
        ur.title AS role,
        t.id AS task_id,
        t.external_link AS external_link,
        t.title AS task_title,
        t.running_status AS task_running_status,
        t.due_date AS task_due_date,
        t.priority AS task_priority,
        t.eta AS task_eta,
        ab.first_name AS assigned_by_first_name, 
        ab.last_name AS assigned_by_last_name,
        ulogin.action_start_date AS loginAt,
        ut.first_name AS team_lead_first_name, 
        ut.last_name AS team_lead_last_name,
        upm.first_name AS project_manager_first_name, 
        upm.last_name AS project_manager_last_name,
        CASE
      WHEN DATE(ubreak.action_end_date) > DATE(ubreak.action_start_date) THEN 'OnBreak'
      ELSE ''
      END AS breakAt,
        ta.assign_task_count AS assign_task_count,
        IF(pb.project_status <> 'close', p.name, NULL) AS project_name
        ${
          isAdmin
            ? ` FROM tm_users AS u`
            : ` FROM 
        tm_project_team AS ptm
    LEFT JOIN 
        tm_users AS u ON ptm.user_id = u.id AND u.deleted_at IS NULL`
        }
    LEFT JOIN 
        tm_users AS ut ON u.team_lead = ut.employee_id AND ut.deleted_at IS NULL
    LEFT JOIN 
        tm_users AS upm ON u.project_manager = upm.employee_id AND upm.deleted_at IS NULL
    LEFT JOIN 
        tm_user_with_roles AS uwr ON uwr.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN
        tm_user_roles AS ur ON ur.id = uwr.role_id
    LEFT JOIN 
        (
            SELECT COUNT(*) AS assign_task_count, assignee
            FROM tm_tasks
            WHERE state != 'completed'
            GROUP BY assignee
        ) AS ta ON u.id = ta.assignee
    LEFT JOIN
          tm_tasks_running_status_mapping AS trs ON u.id = trs.user_id AND trs.running_status = 'Ongoing'
    LEFT JOIN 
          tm_tasks AS t ON (trs.task_id = t.id)
    LEFT JOIN 
        tm_users AS ab ON t.assigned_by = ab.id 
    LEFT JOIN 
        tm_projects AS p ON t.project_id = p.id
    LEFT JOIN
        (
          SELECT user_id, MAX(action_start_date) AS action_start_date,MAX(action_end_date) AS action_end_date
          FROM tm_user_logs
          WHERE DATE(action_end_date) = CURDATE()
              AND action = 'BREAK_TIME'
            GROUP BY user_id
        ) AS ubreak ON u.id = ubreak.user_id
        LEFT JOIN
        (
            SELECT user_id, MIN(action_start_date) AS action_start_date,MAX(action_start_date) AS max_action_start_date,(
              SELECT sessionid 
              FROM tm_user_logs AS sub
              WHERE sub.user_id = tm_user_logs.user_id
                  AND sub.action_start_date = MAX(tm_user_logs.action_start_date)
                  AND sub.action = 'Login'
                  AND DATE(sub.action_start_date) = CURDATE()
              LIMIT 1
          ) AS login_sessionid
            FROM tm_user_logs
            WHERE DATE(action_start_date) = CURDATE()
              AND action = 'Login'
            GROUP BY user_id
        ) AS ulogin ON u.id = ulogin.user_id
        LEFT JOIN
        (
            SELECT user_id,sessionid
            FROM tm_user_logs
            WHERE action = 'Logout'
            GROUP BY user_id, sessionid
        ) AS ulogout ON ulogin.login_sessionid = ulogout.sessionid
    LEFT JOIN 
        tm_biling_configurations AS pb ON t.project_id = pb.project_id
    WHERE 
        ${isAdmin ? `u.deleted_at IS NULL` : `(ptm.deleted_at IS NULL AND (JSON_CONTAINS(ptm.report_to, '${user_id}') OR ptm.user_id = ${user_id}))`}
        AND LOWER(ur.title) <> 'super admin' AND trs.id IS NOT NULL AND ulogout.sessionid IS NULL AND ulogin.max_action_start_date IS NOT NULL GROUP BY ${
          isAdmin ? 'u.id' : `ptm.user_id`
        } ORDER BY u.first_name ASC`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getFreeUserReport = async (isAdmin, user_id: number, role: string) => {
    if (role.toLocaleLowerCase().trim() === 'hr') {
      isAdmin = true;
    }
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT 
        ${isAdmin ? `u.id,` : `ptm.id,`}
        u.id AS user_id, 
        u.first_name AS user_first_name, 
        u.last_name AS user_last_name,
        (
          SELECT login_capture_data
          FROM tm_user_logs
          WHERE user_id = u.id
            AND DATE(action_start_date) = CURDATE() AND action = 'LOGIN' ORDER BY id DESC
          LIMIT 1
      ) AS login_capture_data,
        ur.title AS role,
        u.active_sessionid AS active_sessionid,
        t.id AS task_id,
        ulogin.action_start_date AS loginAt,
        ta.assign_task_count AS assign_task_count,
        CASE
      WHEN ubreak.action_end_date IS NULL AND ubreak.action_start_date IS NOT NULL THEN 'OnBreak'
      ELSE ''
      END AS breakAt,
      ut.first_name AS team_lead_first_name, 
        ut.last_name AS team_lead_last_name,
        upm.first_name AS project_manager_first_name, 
        upm.last_name AS project_manager_last_name
        ${
          isAdmin
            ? ` FROM tm_users AS u`
            : ` FROM 
        tm_project_team AS ptm
    LEFT JOIN 
        tm_users AS u ON ptm.user_id = u.id AND u.deleted_at IS NULL`
        }
    LEFT JOIN 
        tm_users AS ut ON u.team_lead = ut.employee_id AND ut.deleted_at IS NULL
    LEFT JOIN 
        tm_users AS upm ON u.project_manager = upm.employee_id AND upm.deleted_at IS NULL
    LEFT JOIN 
        tm_user_with_roles AS uwr ON uwr.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN
        tm_user_roles AS ur ON ur.id = uwr.role_id
    LEFT JOIN 
        (
            SELECT COUNT(*) AS assign_task_count, assignee
            FROM tm_tasks
            WHERE state != 'completed'
            GROUP BY assignee
        ) AS ta ON u.id = ta.assignee
    LEFT JOIN 
        (
            SELECT id,assignee
            FROM tm_tasks
            WHERE running_status = 'Ongoing'
        ) AS t ON u.id = t.assignee
    LEFT JOIN
        tm_tasks_running_status_mapping AS trs ON u.id = trs.user_id AND trs.running_status = 'Ongoing'
    LEFT JOIN
    (
      SELECT user_id,action_start_date, action_end_date
FROM tm_user_logs
WHERE DATE(action_start_date) = CURDATE() AND action_end_date IS NULL
  AND action = 'BREAK_TIME' ORDER BY id DESC
      ) AS ubreak ON u.id = ubreak.user_id
LEFT JOIN
    (
        SELECT user_id, MIN(action_start_date) AS action_start_date,MAX(action_start_date) AS max_action_start_date,(
          SELECT sessionid 
          FROM tm_user_logs AS sub
          WHERE sub.user_id = tm_user_logs.user_id
              AND sub.action_start_date = MAX(tm_user_logs.action_start_date)
              AND sub.action = 'Login'
              AND DATE(sub.action_start_date) = CURDATE()
          LIMIT 1
      ) AS login_sessionid
        FROM tm_user_logs
        WHERE DATE(action_start_date) = CURDATE()
          AND action = 'Login'
        GROUP BY user_id
    ) AS ulogin ON u.id = ulogin.user_id
    LEFT JOIN
    (
        SELECT user_id,sessionid
        FROM tm_user_logs
        WHERE action = 'Logout'
        GROUP BY user_id, sessionid
    ) AS ulogout ON ulogin.login_sessionid = ulogout.sessionid
    WHERE 
    ${isAdmin ? `u.deleted_at IS NULL` : `(ptm.deleted_at IS NULL AND (JSON_CONTAINS(ptm.report_to, '${user_id}') OR ptm.user_id = ${user_id}))`}
    AND LOWER(ur.title) <> 'super admin' AND trs.id IS NULL AND ulogout.sessionid IS NULL AND ulogin.max_action_start_date IS NOT NULL GROUP BY ${
      isAdmin ? 'u.id' : `ptm.user_id`
    } ORDER BY u.first_name ASC`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getLogOutUserReport = async (isAdmin, user_id: number, role: string) => {
    if (role.toLocaleLowerCase().trim() === 'hr') {
      isAdmin = true;
    }
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT 
        ${isAdmin ? `u.id,` : `ptm.id,`}
        u.id AS user_id, 
        u.first_name AS user_first_name, 
        u.last_name AS user_last_name,
        (
          SELECT login_capture_data
          FROM tm_user_logs
          WHERE user_id = u.id
              AND DATE(action_start_date) = CURDATE() AND action = 'LOGIN' ORDER BY id DESC
          LIMIT 1
      ) AS login_capture_data,
        ur.title AS role,
        ta.assign_task_count AS assign_task_count,
        ut.first_name AS team_lead_first_name, 
        ut.last_name AS team_lead_last_name,
        upm.first_name AS project_manager_first_name, 
        upm.last_name AS project_manager_last_name,
        ulogin.action_start_date AS loginAt,
        ulogout.action_end_date AS logoutAt
        ${
          isAdmin
            ? ` FROM tm_users AS u`
            : ` FROM 
        tm_project_team AS ptm
    LEFT JOIN 
        tm_users AS u ON ptm.user_id = u.id AND u.deleted_at IS NULL`
        }
    LEFT JOIN 
        tm_users AS ut ON u.team_lead = ut.employee_id AND ut.deleted_at IS NULL
    LEFT JOIN 
        tm_users AS upm ON u.project_manager = upm.employee_id AND upm.deleted_at IS NULL
    LEFT JOIN 
        tm_user_with_roles AS uwr ON uwr.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN
        tm_user_roles AS ur ON ur.id = uwr.role_id
    LEFT JOIN 
        (
            SELECT COUNT(*) AS assign_task_count, assignee
            FROM tm_tasks
            WHERE state != 'completed'
            GROUP BY assignee
        ) AS ta ON u.id = ta.assignee
        LEFT JOIN
        (
            SELECT user_id, MIN(action_start_date) AS action_start_date,MAX(action_start_date) AS max_action_start_date,(
              SELECT sessionid 
              FROM tm_user_logs AS sub
              WHERE sub.user_id = tm_user_logs.user_id
                  AND sub.action_start_date = MAX(tm_user_logs.action_start_date)
                  AND sub.action = 'Login'
                  AND DATE(sub.action_start_date) = CURDATE()
              LIMIT 1
          ) AS login_sessionid
            FROM tm_user_logs
            WHERE DATE(action_start_date) = CURDATE()
              AND action = 'Login'
            GROUP BY user_id
        ) AS ulogin ON u.id = ulogin.user_id
        LEFT JOIN 
        (
            SELECT COUNT(*) AS leave_count, user_id
            FROM tm_leave_history
            WHERE DATE(from_date) <= CURDATE() AND CURDATE() <= DATE(to_date) AND status = 'APPROVED'
            GROUP BY user_id
        ) AS tlh ON u.id = tlh.user_id
        LEFT JOIN
        (
            SELECT user_id,sessionid,action_end_date
            FROM tm_user_logs
            WHERE action = 'Logout'
            GROUP BY user_id, sessionid
        ) AS ulogout ON ulogin.login_sessionid = ulogout.sessionid
    WHERE  
    ${isAdmin ? `tlh.leave_count <= 0 AND u.deleted_at IS NULL ` : `(ptm.deleted_at IS NULL AND (JSON_CONTAINS(ptm.report_to, '${user_id}') OR ptm.user_id = ${user_id}))`}
    AND LOWER(ur.title) <> 'super admin' AND ulogout.sessionid IS NOT NULL GROUP BY ${isAdmin ? 'u.id' : `ptm.user_id`} ORDER BY u.first_name ASC`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getNotLoginUserReport = async (isAdmin, user_id: number, role: string) => {
    if (role.toLocaleLowerCase().trim() === 'hr') {
      isAdmin = true;
    }
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT 
        ${isAdmin ? `u.id,` : `ptm.id,`}
    u.id AS user_id, 
    u.first_name AS user_first_name, 
    u.last_name AS user_last_name,
    ur.title AS role,
    ta.assign_task_count AS assign_task_count,
    ut.first_name AS team_lead_first_name, 
    ut.last_name AS team_lead_last_name,
    upm.first_name AS project_manager_first_name, 
    upm.last_name AS project_manager_last_name,
    tlh.from_date AS from_date, 
    tlh.leave_from_slot AS leave_from_slot,
    tlh.to_date AS to_date, 
    tlh.leave_to_slot AS leave_to_slot,
    CASE
        WHEN tls.title IS NOT NULL THEN tls.title
        WHEN tlh.leave_subject_text IS NOT NULL THEN tlh.leave_subject_text
        ELSE NULL
    END AS leave_subject,
    CASE
      WHEN DATE(tlh.from_date) = CURDATE() THEN tlh.leave_from_slot
      WHEN DATE(tlh.to_date) = CURDATE() THEN tlh.leave_to_slot
      WHEN CURDATE() BETWEEN tlh.from_date AND tlh.to_date THEN 'FD'
      ELSE ''
      END AS today_slot
    ${
      isAdmin
        ? ` FROM tm_users AS u`
        : ` FROM 
    tm_project_team AS ptm
LEFT JOIN 
    tm_users AS u ON ptm.user_id = u.id AND u.deleted_at IS NULL AND u.status != 'ex-employee'`
    }
LEFT JOIN 
    tm_users AS ut ON u.team_lead = ut.employee_id AND ut.deleted_at IS NULL
LEFT JOIN 
    tm_users AS upm ON u.project_manager = upm.employee_id AND upm.deleted_at IS NULL   
LEFT JOIN 
    tm_user_with_roles AS uwr ON uwr.user_id = u.id AND u.deleted_at IS NULL
LEFT JOIN
    tm_user_roles AS ur ON ur.id = uwr.role_id
LEFT JOIN 
    (
        SELECT user_id, MAX(action_start_date) AS max_start_date
        FROM tm_user_logs
        GROUP BY user_id
    ) AS ul ON u.id = ul.user_id
LEFT JOIN 
    (
        SELECT COUNT(*) AS assign_task_count, assignee
        FROM tm_tasks
        WHERE state != 'completed'
        GROUP BY assignee
    ) AS ta ON u.id = ta.assignee
LEFT JOIN 
    (
        SELECT id,user_id,from_date,leave_from_slot,to_date,leave_to_slot,status,leave_subject,leave_subject_text
        FROM tm_leave_history
        WHERE DATE(from_date) <= CURDATE() AND CURDATE() <= DATE(to_date) AND status = 'APPROVED'
        GROUP BY user_id
    ) AS tlh ON u.id = tlh.user_id
LEFT JOIN 
    tm_leave_subjects AS tls ON tlh.leave_subject = tls.id 
WHERE 
${
  isAdmin
    ? `u.deleted_at IS NULL AND u.status != 'ex-employee'`
    : `(ptm.deleted_at IS NULL AND (JSON_CONTAINS(ptm.report_to, '${user_id}') OR ptm.user_id = ${user_id}))`
} AND LOWER(ur.title) <> 'super admin' AND (DATE(ul.max_start_date) != CURDATE() OR ul.max_start_date IS NULL OR tlh.id IS NOT NULL) GROUP BY ${
          isAdmin ? 'u.id' : `ptm.user_id`
        } ORDER BY u.first_name ASC`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getOnLeaveUserReport = async (isAdmin, user_id: number, role: string) => {
    if (role.toLocaleLowerCase().trim() === 'hr') {
      isAdmin = true;
    }
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT 
        ${isAdmin ? `u.id,` : `ptm.id,`}
        u.id AS user_id, 
        u.first_name AS user_first_name, 
        u.last_name AS user_last_name,
        ut.first_name AS team_lead_first_name, 
        ut.last_name AS team_lead_last_name,
        tlh.from_date AS from_date, 
        tlh.leave_from_slot AS leave_from_slot,
        tlh.to_date AS to_date, 
        tlh.leave_to_slot AS leave_to_slot,
        ta.assign_task_count AS assign_task_count,
        CASE
            WHEN DATE(tlh.from_date) = CURDATE() THEN tlh.leave_from_slot
            WHEN DATE(tlh.to_date) = CURDATE() THEN tlh.leave_to_slot
            ELSE 'FD'
        END AS today_slot
        ${
          isAdmin
            ? ` FROM tm_users AS u`
            : ` FROM 
        tm_project_team AS ptm
    LEFT JOIN 
        tm_users AS u ON ptm.user_id = u.id AND u.deleted_at IS NULL`
        }
    LEFT JOIN 
        tm_users AS ut ON u.team_lead = ut.employee_id AND ut.deleted_at IS NULL
    LEFT JOIN 
        (
            SELECT user_id, MAX(action_start_date) AS max_start_date
            FROM tm_user_logs
            GROUP BY user_id
        ) AS ul ON u.id = ul.user_id
    LEFT JOIN 
        (
            SELECT COUNT(*) AS assign_task_count, assignee
            FROM tm_tasks
            WHERE state != 'completed'
            GROUP BY assignee
        ) AS ta ON u.id = ta.assignee
    LEFT JOIN 
        (
            SELECT id, user_id, from_date, leave_from_slot, to_date, leave_to_slot, status
            FROM tm_leave_history
            WHERE DATE(from_date) <= CURDATE() AND CURDATE() <= DATE(to_date) AND status = 'APPROVED'
            GROUP BY user_id
        ) AS tlh ON u.id = tlh.user_id
    WHERE 
    ${isAdmin ? `u.deleted_at IS NULL` : `(ptm.deleted_at IS NULL AND (JSON_CONTAINS(ptm.report_to, '${user_id}') OR ptm.user_id = ${user_id}))`} 
        AND DATE(ul.max_start_date) != CURDATE() 
        AND tlh.id IS NOT NULL GROUP BY ${isAdmin ? 'u.id' : `ptm.user_id`};
`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getProjectsCountWorkReport = async (query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _DB.Projects.count({
        where: query,
        include: [
          {
            model: _DB.ProjectTeam,
            as: 'projectTeam',
            attributes: ['user_id', 'report_to'],
          },
          {
            model: _DB.ProjectWorkspace,
            as: 'projectWorkspace',
            attributes: ['id', 'workspace_id'],
            include: [
              {
                model: _DB.Workspace,
                as: 'workspace',
                attributes: ['id', 'title', 'is_active'],
              },
            ],
          },
          {
            model: _DB.ProjectBillingConfigration,
            as: 'projectBillingConfigration',
            attributes: ['id', 'project_id', 'project_status', 'is_billable', 'quoted_hours'],
            // where:{project_status:{[Op.in]:['ongoing', 'undermaintenance', 'closed']}}
            where: { project_status: { [Op.in]: ['ongoing', 'undermaintenance'] } },
          },
        ],
        distinct: true,
      });
      resolve(count);
    });
  };

  public _getAllProjectWorkReport = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'name', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });
    return new Promise<iPWReport[]>((resolve) => {
      const data = _DB.Projects.findAll({
        where: query,
        order,
        limit: limit > 0 ? limit : null,
        offset: offset > 0 ? offset : null,
        subQuery: false,
        include: [
          {
            model: _DB.ProjectTeam,
            as: 'projectTeam',
            attributes: ['user_id', 'report_to'],
          },
          {
            model: _DB.ProjectWorkspace,
            as: 'projectWorkspace',
            attributes: ['id', 'workspace_id'],
            include: [
              {
                model: _DB.Workspace,
                as: 'workspace',
                attributes: ['id', 'title', 'is_active'],
              },
            ],
          },
          {
            model: _DB.ProjectBillingConfigration,
            as: 'projectBillingConfigration',
            attributes: ['id', 'project_id', 'project_status', 'is_billable', 'quoted_hours'],
            // where:{project_status:{[Op.in]:['ongoing', 'undermaintenance', 'closed']}}
            where: { project_status: { [Op.in]: ['ongoing', 'undermaintenance'] } },
          },
        ],
        group: ['id'],
      }).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });
      resolve(data);
    });
  };

  // Get User Role
  public _getUserRole = async (id: number) => {
    return new Promise<iUserWithRole>((resolve, reject) => {
      const res = _DB.UserWithRole.findOne({
        where: { user_id: id },
        include: {
          as: 'user_role',
          model: _DB.UserRoles,
          attributes: ['title', 'permission'],
        },
      });
      resolve(res);
    });
  };

  public _toUpperCamelCase = (inputString) => {
    const words = inputString.split(/\s+/); // Split the string into words using spaces as separators
    const upperCamelCaseWords = words.map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    return upperCamelCaseWords.join(' ');
  };

  public _getUserTimeLineReport = async (startDate: string | null, endDate: string | null, userIDs: number[] | null) => {
    try {
      
      let sqlQuery = `
      SELECT
      tu.id,
      tu.first_name,
      tu.last_name,
      tul.user_id,
      tul.action,
      tul.action_start_date,
      tul.action_end_date,
      tul.time
      FROM tm_users tu
      LEFT JOIN tm_user_logs tul ON tu.id = tul.user_id
      WHERE tu.status != 'ex-employee' AND tu.deleted_at IS NULL
      `;
      const replacements: any = {};

      if (userIDs !== null && userIDs.length > 0) {
        sqlQuery += 'AND tu.id IN (:userIDs) ';
        replacements.userIDs = userIDs;
      } 
      if (startDate !== null && endDate !== null) {
        sqlQuery += 'AND ( ( tul.action_start_date >= :startDate AND tul.action_start_date <= :endDate ) OR tul.action_start_date IS NULL )';
        replacements.startDate = startDate;
        replacements.endDate = endDate;
      }
      // if (endDate !== null) {
      //   sqlQuery += 'AND ( tul.action_end_date <= :endDate OR tul.action_end_date IS NULL )';
      //   replacements.endDate = endDate;
      // }

      const data = await _DB.sequelize.query(sqlQuery, {
        type: QueryTypes.SELECT,
        replacements,
      });

      return data;
    } catch (err) {
      throw new Error(err);
    }
  };

  public _getUsersDropDownForTimeLine = async () => {
    try{
      const sqlQuery = 
      `
      SELECT tu.id , tu.first_name , tu.last_name from tm_users tu WHERE tu.status != 'ex-employee' AND tu.deleted_at IS NULL;
      `
      const data = await _DB.sequelize.query(sqlQuery, {
        type: QueryTypes.SELECT,
      });
      return data;
    }catch(err) {
      throw new Error(err);
    }
  }

  public _getAllApprovedLeaves = async (startDate: any, endDate: any, userIDs: any) => {
    try {
      // Create the base SQL query
      let sqlQuery = `
        SELECT from_date, to_date, user_id, no_of_days
        FROM tm_leave_history tlh
        WHERE 1 = 1`;

      if (Array.isArray(userIDs) && userIDs.length > 0) {
        // Generate a comma-separated list of userIDs for the IN clause
        const userIDsList = userIDs.join(', ');
        sqlQuery += ` AND user_id IN (${userIDsList})`;
      }

      if (startDate !== null) {
        sqlQuery += ` AND from_date >= :startDate`;
      }

      if (endDate !== null) {
        sqlQuery += ` AND to_date <= :endDate`;
      }

      const replacements = {
        startDate: startDate,
        endDate: endDate,
      };

      // Execute the SQL query using Sequelize
      const data = await _DB.sequelize.query(sqlQuery, {
        type: QueryTypes.SELECT,
        replacements,
      });

      return data;
    } catch (err) {
      throw new Error(err);
    }
  };

  public getDailyHours = async () => {
    try {
      const data = await _DB.sequelize.query(
        `SELECT * from tm_site_settings tss
         where name = 'Daily Hours';    
        `,
        {
          type: QueryTypes.SELECT,
        }
      );
      return data;
    } catch (err) {
      throw new Error(err);
    }
  };

  public _getLeadDropDown = async () => {
    try {
      const rawQuery = 
      `
        SELECT
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

      const data = await _DB.sequelize.query(rawQuery, {
        type: QueryTypes.SELECT,
        replacements: {},
      });

      return data;
    } catch (err) {
      throw new Error(err);
    }
  };

  // Get All User Data
  public _getUserData = async () => {
    return new Promise<iUser[]>((resolve) => {
      const users = _DB.User.findAll({}).then((res) => JSON.parse(JSON.stringify(res)));
      resolve(users);
    });
  };

  // public _getUserTaskReport = async (isAdmin, user_id: number) => {
  //   return new Promise<object[]>((resolve, reject) => {
  //     const result = _DB.sequelize.query(
  //       `SELECT
  //       ${isAdmin ? `ass.id,` : `ptm.user_id,`}
  //       ass.first_name,
  //       ass.last_name,
  //       CASE
  //       WHEN COUNT(t.id) > 0 THEN JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'title', t.title,'assignee_first_name',ass.first_name,'assignee_last_name',ass.last_name,'assigned_by_first_name',ass_b.first_name,'assigned_by_last_name',ass_b.last_name))
  //       ELSE JSON_ARRAY()
  //     END AS tasks
  //        ${
  //         isAdmin
  //           ? ` FROM tm_users AS ass`
  //           : ` FROM
  //       tm_project_team AS ptm
  //   LEFT JOIN
  //       tm_users AS ass ON ptm.user_id = ass.id AND ass.deleted_at IS NULL`
  //       }
  //       LEFT JOIN
  //       (
  //           SELECT *
  //           FROM tm_tasks
  //       ) AS t ON  ${isAdmin ? `ass.id = t.assignee`:`ptm.user_id = t.assignee`}
  //   LEFT JOIN
  //       tm_users AS ass_b ON t.assigned_by  = ass_b.id AND ass_b.deleted_at IS NULL
  //   WHERE
  //   ${isAdmin ? `ass.deleted_at IS NULL` : `(ptm.deleted_at IS NULL AND (JSON_CONTAINS(ptm.report_to, '${user_id}') OR ptm.user_id = ${user_id}))`} GROUP BY ${
  //     isAdmin ? 'ass.id' : `ptm.user_id`
  //   }`,
  //       { type: QueryTypes.SELECT }
  //     );
  //     resolve(result);
  //   });
  // };
}

export default TaskReportService;
