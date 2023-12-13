import { APIResponseFormat } from '@tms-workspace/apis-core';
import { NextFunction,Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { iRequestWithUser } from '../app/database/interface/user.interface';
import db from '../app/database/models';

const _projectTeam = db.ProjectTeam;
const _project = db.Projects;
const _userRole =db.UserRoles;
const _userWithRole =db.UserWithRole;
const _projectBillingConfigration = db.ProjectBillingConfigration;
const _siteSetting = db.SiteSetting;
// class UserValidation {
//   public validateUser = async (user_id,auth_id) => {
//     return new Promise((resolve) => {
//       const data =_projectTeam.findAll({
//         where: {
//           [Op.and]: [Sequelize.fn('JSON_CONTAINS', Sequelize.col('report_to'), `${auth_id}`),{user_id:user_id}],
//         },
//       }).then((data)=>{
//         const result=JSON.parse(JSON.stringify(data));
//         return result.length>0?true:false
//       })
//       resolve(data);
//     });
//   };
// }
//   export default UserValidation;

// const UserValidation = async (
//   req: iRequestWithUser,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//       _projectTeam.findAll({
//         where: {
//           [Op.and]: [Sequelize.fn('JSON_CONTAINS', Sequelize.col('report_to'), `${req.user.id}`),{user_id:req.headers.id}],
//         }
//       }).then((data)=>{
//         const result=JSON.parse(JSON.stringify(data));
//         if(result.length<=0&&req.user.id!==Number(req.headers.id)){
//           return res.status(200).json(APIResponseFormat._ResCustomRequest("User is not authorized for view this details"));
//         }else{
//           return next();
//         }
//       })
//   } catch (error) {
//     return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
//   }

// };

const UserValidation = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
  try {
    _project
      .findAll({
        where: {
          [Op.and]: [
            Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
            {
              '$projectTeam.user_id$': req.headers.id,
            },
          ],
        },
        include: [
          {
            model: _projectTeam,
            as: 'projectTeam',
            attributes: ['id', 'user_id', 'report_to'],
          },
          {
            model: _projectBillingConfigration,
            as: 'projectBillingConfigration',
            where: { project_status: { [Op.ne]: 'closed' } },
          },
        ],
      })
      .then(async (data) => {
        const result = JSON.parse(JSON.stringify(data));

        let role = await _userWithRole.findOne({
          where: { user_id: req.user.id },
          include: {
            as: 'user_role',
            model: _userRole,
            attributes: ['title', 'permission'],
          },
        });

        const leaveResponsiblePerson = await _siteSetting
          .findOne({
            where: {
              identifier: 'leave_reponsible_person',
            },
          })
          .then((res) => {
            const pArray = JSON.parse(JSON.stringify(res));
            console.log('pArray', pArray);

            return pArray.value;
          });

        role = JSON.parse(JSON.stringify(role));
        if (result.length > 0 || req.user.id === Number(req.headers.id) || leaveResponsiblePerson.includes(req.user.id)) {
          return next();
        }

        if ((role as any)?.user_role?.title.trim().toLowerCase() === 'super admin' || leaveResponsiblePerson.includes(req.user.id)) {
          return next();
        }

        return res.status(200).json(APIResponseFormat._ResCustomRequest('User is not authorized to view this details'));
      });
  } catch (error) {
    return res.status(401).json(APIResponseFormat._ResUnauthrized(401));
  }
};
  
  export default UserValidation;
  