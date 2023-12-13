import moment from 'moment';
import _DB from '../../../database/models';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import { iUser } from '../../../database/interface/user.interface';
import { iHoliday } from '../../../database/interface/holiday.interface';
import { Op, WhereOptions, Sequelize } from 'sequelize';

const _projectTeam = _DB.ProjectTeam;
const _user = _DB.User;
const _userTimeLog = _DB.UserLog;
const _holidays = _DB.Holiday;
const _leaveHistory = _DB.Leave;
const _leaveSubject = _DB.LeaveSubject;
const _sequelize = _DB.sequelize;

class AdministrationService {
  // GET Holidays
  public _getHolidays = async (year: number[], month: number[]) => {
    return new Promise<iHoliday[]>((resolve) => {
      const data = _holidays
        .findAll({
          where: {
            [Op.and]: [
              Sequelize.literal(`EXTRACT(YEAR FROM  HolidayModel.holiday_date) IN (${year})`),
              Sequelize.literal(`EXTRACT(MONTH FROM  HolidayModel.holiday_date) IN (${month})`),
              {
                isHoliday: 1,
              },
            ],
          },
          attributes: ['holiday_date', 'title'],
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  public _getAllApprovedLeaves = async (where: WhereOptions) => {
    return new Promise<any[]>((resolve) => {
      const data = _leaveHistory
        .findAll({
          attributes: ['id', 'user_id', 'from_date', 'to_date', 'leave_from_slot', 'leave_to_slot'],
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['first_name', 'last_name', 'designation'],
            },
          ],
          where,
        })
        .then((resp) => {
          return JSON.parse(JSON.stringify(resp));
        });

      resolve(data);
    });
  };

  public _getReportingUser = async (query: WhereOptions) => {
    return new Promise<iProjectTeam[]>((resolve) => {
      const data = _projectTeam
        .findAll({
          attributes: {
            exclude: ['project_id', 'report_to'],
          },
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['first_name', 'last_name', 'designation', 'employee_image'],
            },
          ],
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getEmployees = async (where: WhereOptions, where2: WhereOptions, where3: WhereOptions) => {
    return new Promise<iUser[]>((resolve) => {
      const data = _user
        .findAll({
          include: [
            {
              model: _leaveHistory,
              as: 'leaveHistory',
              where: where2,
              required: false,
              attributes: [
                'id',
                'requested_date',
                'from_date',
                'to_date',
                'leave_from_slot',
                'leave_to_slot',
                'no_of_days',
                'leave_subject',
                'leave_subject_text',
              ],
              include: [
                {
                  as: 'leaveSubject',
                  model: _leaveSubject,
                  attributes: ['id', 'title'],
                },
              ],
            },
            {
              model: _userTimeLog,
              as: 'UsersTimeLog',
              where: where3,
              required: false,
            },
          ],
          where,
          attributes: ['id', 'first_name', 'last_name', 'employee_image', 'employee_id', 'designation'],
        })
        .then((res) => JSON.parse(JSON.stringify(res)));

      resolve(data);
    });
  };
}

export default AdministrationService;
