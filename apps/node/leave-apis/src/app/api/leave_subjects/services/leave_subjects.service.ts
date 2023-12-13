import _DB from '../../../database/models';
import { iLeaveSubjects } from '../../../database/interface/leave.interface';
import { WhereOptions } from 'sequelize';
const leave_subjects = _DB.LeaveSubject;

class LeaveSubjectsService {
  public _getLeaveSubjects = async () => {
    return new Promise((resolve) => {
      const data = leave_subjects.findAll({
        attributes: {
          include: ['id', 'title'],
        },

        order: [['title', 'asc']],
      });
      resolve(data);
    });
  };

  public _getLeaveSubjectById = async (query: WhereOptions) => {
    return new Promise<iLeaveSubjects>((resolve) => {
      const data = leave_subjects
        .findOne({
          attributes: {
            include: ['id', 'title'],
          },
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };
}
export default LeaveSubjectsService;
