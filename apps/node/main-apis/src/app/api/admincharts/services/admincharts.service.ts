import moment from 'moment';
import _DB from '../../../database/models';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import { iUserWithRole } from '../../../database/interface/user.interface';
import { iUser } from '../../../database/interface/user.interface';
import { iHoliday } from '../../../database/interface/holiday.interface';
import { Op, WhereOptions, Sequelize, where, QueryTypes } from 'sequelize';

const _projectTeam = _DB.ProjectTeam;
const _user = _DB.User;
const _userTimeLog = _DB.UserLog;
const _holidays = _DB.Holiday;
const _leaveHistory = _DB.Leave;
const _leaveSubject = _DB.LeaveSubject;
const _sequelize = _DB.sequelize;

class Admincharts {
  // GET Holidays

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

  public _pieCharts = async (where: WhereOptions) => {
    try {
      return true;
    } catch (err) {
      console.log(err);
    }
  };

  public _getNotLoginUserReport = async (isAdmin, user_id: number, role: string) => {
    if (role.toLocaleLowerCase().trim() === 'hr') {
      isAdmin = true;
    }
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `
        SELECT 
    u.id AS user_id, 
    u.first_name AS user_first_name, 
    u.last_name AS user_last_name,
    CASE
        WHEN DATE(tlh.from_date) = CURDATE() THEN tlh.leave_from_slot
        WHEN DATE(tlh.to_date) = CURDATE() THEN tlh.leave_to_slot
        WHEN CURDATE() BETWEEN tlh.from_date AND tlh.to_date THEN 'FD'
        ELSE ''
    END AS today_slot
FROM 
    tm_users AS u
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
        SELECT id, user_id, from_date, leave_from_slot, to_date, leave_to_slot, status, leave_subject
        FROM tm_leave_history
        WHERE DATE(from_date) <= CURDATE() AND CURDATE() <= DATE(to_date) AND status = 'APPROVED'
        GROUP BY user_id
    ) AS tlh ON u.id = tlh.user_id
LEFT JOIN 
    tm_leave_subjects AS tls ON tlh.leave_subject = tls.id 
WHERE 
    u.deleted_at IS NULL AND u.status != 'ex-employee' AND LOWER(ur.title) <> 'super admin' 
    AND (DATE(ul.max_start_date) != CURDATE() OR ul.max_start_date IS NULL) 
GROUP BY 
    u.id;

        `,
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
        `
        SELECT
        tu.id,
        tu.first_name,
        tu.last_name,
        tur.title 
      FROM
        tm_users tu
      JOIN (
        SELECT
          id,
          user_id,
          from_date,
          leave_from_slot,
          to_date,
          leave_to_slot,
          status
        FROM
          tm_leave_history
        WHERE
          DATE(from_date) <= CURDATE()
          AND CURDATE() <= DATE(to_date)
          AND status = 'APPROVED'
        GROUP BY
          user_id
              ) t1 ON
        tu.id = t1.user_id
      JOIN tm_user_with_roles tuwr ON
        tu.id = tuwr.user_id
      JOIN tm_user_roles tur ON
        tuwr.role_id = tur.id
      WHERE
        tur.title != 'Super Admin';
        `,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getLoggedInUserReport = async () => {
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `
        SELECT
        tu.id,
        tu.first_name,
        tu.last_name,
        tuwr.user_id ,
        tuwr.role_id ,
        tur.id ,
        tur.title 
      FROM
        tm_users tu
      JOIN (
        SELECT
          user_id,
          MAX(action_start_date) AS max_start_date
        FROM
          tm_user_logs
        WHERE
          action = 'LOGIN'
          AND DATE(action_start_date) = CURDATE()
        GROUP BY
          user_id
                ) t1 ON tu.id = t1.user_id
      JOIN tm_user_with_roles tuwr ON tu.id = tuwr.user_id 
      JOIN tm_user_roles tur ON tuwr.role_id = tur.id
      WHERE tur.title != 'Super Admin';
        `,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getLeaveDataforCurrentDate = async () => {
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `
        SELECT id , user_id , from_date , to_date, no_of_days , status , leave_from_slot
        FROM tm_leave_history tlh 
        WHERE status = 'APPROVED' 
        AND CURDATE() BETWEEN DATE(from_date) AND DATE(to_date);
        `,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });

  }

  // public _
}

export default Admincharts;
