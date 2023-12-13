import moment from 'moment';
import _DB from '../../../database/models';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import { iUser } from '../../../database/interface/user.interface';
import { Op, WhereOptions, Sequelize } from 'sequelize';

const _projectTeam = _DB.ProjectTeam;
const _user = _DB.User;
const _holidays = _DB.Holiday;
const _leaveHistory = _DB.LeaveHistory;
const _sequelize = _DB.sequelize;
const _projects = _DB.Projects;
const _projectBillingConfigration = _DB.ProjectBillingConfigration;

class AttendanceService {
  // GET Holidays
  public _getHolidays = async (year: number) => {
    return new Promise<string[]>((resolve) => {
      const data = _holidays
        .findAll({
          where: _sequelize.where(_sequelize.fn('YEAR', _sequelize.col('holiday_date')), year),
          attributes: ['holiday_date'],
        })
        .then((resp) => {
          return resp.map((item) => moment(item.dataValues.holiday_date).utc().format('MM/DD/YYYY'));
        });
      resolve(data);
    });
  };

  public _getAllApprovedLeaves = async (where: WhereOptions) => {
    return new Promise<any[]>((resolve) => {
      // const data = _projectTeam
      //   .findAll({
      //     attributes: ['id', 'user_id'],
      //     include: [
      //       {
      //         model: _user,
      //         as: 'user',
      //         attributes: ['first_name', 'last_name', 'designation'],
      //         include: [
      //           {
      //             model: _leaveHistory,
      //             as: 'leaves',
      //             where: { status: 'APPROVED' },
      //             required: false,
      //             attributes: ['from_date', 'to_date', 'leave_from_slot', 'leave_to_slot'],
      //           },
      //         ],
      //       },
      //     ],
      //     where: query,
      //   })
      //   .then(async (res) => {
      //     let result = JSON.parse(JSON.stringify(res));
      //     result = await result.map((d) => {
      //       delete d.project_id;
      //       delete d.report_to;

      //       return d;
      //     });

      //     return result;
      //   });
      // resolve(data);

      const data = _leaveHistory
        .findAll({
          attributes: ['id', 'user_id', 'from_date', 'to_date', 'leave_from_slot', 'leave_to_slot'],
          include: [
            {
              model: _user,
              as: 'user',
              attributes: ['first_name', 'last_name', 'designation', 'employee_image'],
            },
          ],
          where,
        })
        .then((resp) => {
          // return resp.map((item) => ({
          //   ...item,
          //   from_date: moment(item.dataValues.from_date).format('MM/DD/YYYY'),
          //   to_date: moment(item.dataValues.to_date).format('MM/DD/YYYY'),
          // }));
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
            {
              model: _projects,
              as: 'teamProjectData',
              include: [
                {
                  model: _projectBillingConfigration,
                  as: 'projectBillingConfigration',
                },
              ],
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

  public _getUsers = async (query: WhereOptions) => {
    return new Promise<iUser[]>((resolve) => {
      const data = _user
        .findAll({
          attributes: ['id', 'first_name', 'last_name', 'designation', 'employee_image'],
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };
}

export default AttendanceService;
