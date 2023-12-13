import { Query } from '@tms-workspace/apis-core';
import { Op, WhereOptions, Sequelize, QueryTypes } from 'sequelize';
import { iProjectTeam } from '../../../database/interface/projects.interface';
import { iWorkspace } from '../../../database/interface/workspace.interface';
import _DB from '../../../database/models';
import UserService from '../../user/services/user.service';

const _projects = _DB.Projects;
const _projectTeam = _DB.ProjectTeam;
const _workspace = _DB.Workspace;
const _workspaceTeam = _DB.WorkspaceTeam;
const _projectWorkspace = _DB.ProjectWorkspace;
const _projectBillingConfigration = _DB.ProjectBillingConfigration;
const _user = _DB.User;
const _userWithRole=_DB.UserWithRole;
const _userRole=_DB.UserRoles;
const _projectTask = _DB.ProjectTask;
const userService = new UserService();

class WorkspaceService {
  public _getProjects = async (query: WhereOptions) => {
    return new Promise((resolve, reject) => {
      const data = _projects.findAll({
        include: [
          {
            as: 'projectWorkspace',
            model: _projectWorkspace,
            attributes: ['id'],
            where: query,
          },
          // {
          //   as: 'projectBillingConfigration',
          //   model: _projectBillingConfigration,
          //   where:{project_status:{[Op.ne]:'closed'}}
          // }
        ],
      });
      resolve(data);
    });
  };

  public _getWorkspaceCount = async (query: WhereOptions, inner_query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _workspace.count({
        where: query,
        include: [
          {
            as: 'team',
            model: _workspaceTeam,
            attributes: ['id', 'report_to', 'user_id'],
            where: inner_query,
          },
          {
            as: 'workspaceProject',
            model: _projectWorkspace,
            attributes: ['id', 'project_id', 'workspace_id'],
          },
        ],
        distinct: true,
      });
      resolve(count);
    });
  };

  public _getWorkspaceCountV2 = async (userData,searchText='',) => {
    userData.isAdmin = false;
    return  new Promise<object>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT COUNT(DISTINCT tw.id) As total_count
        FROM tm_workspace tw
        LEFT JOIN tm_workspace_team twt ON twt.workspace_id = tw.id AND twt.deleted_at IS NULL
        ${userData.isAdmin?`${searchText?'WHERE tw.title LIKE "%'+searchText+'%"':''} AND tw.deleted_at IS NULL`:`WHERE tw.is_active = 1 AND tw.deleted_at IS NULL AND (twt.user_id = ${userData.id} OR JSON_CONTAINS(twt.report_to, CAST(${userData.id} AS CHAR CHARACTER SET utf8))) ${searchText?'AND tw.title LIKE "%'+searchText+'%"':''}`}`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };
  public _getProjectCount = async (query: WhereOptions) => {
    return new Promise<any>((resolve) => {
      const count = _workspace
        .findAll({
          where: query,
          include: [
            {
              as: 'team',
              model: _workspaceTeam,
              attributes: ['id', 'report_to', 'user_id'],
            },
            {
              as: 'workspaceProject',
              model: _projectWorkspace,
              attributes: ['id', 'project_id', 'workspace_id'],
              include: [
                {
                  as: 'project',
                  model: _projects,
                  include: [
                    {
                      as: 'projectTeam',
                      model: _projectTeam,
                      attributes: ['id', 'user_id', 'report_to'],
                      include: [
                        {
                          as: 'user',
                          model: _user,
                          attributes: ['id', 'first_name', 'last_name', 'employee_image'],
                        },
                      ],
                    },
                    {
                      as: 'projectBillingConfigration',
                      model: _projectBillingConfigration,
                      where: { project_status: { [Op.ne]: 'closed' } },
                    },
                    {
                      model: _projectTask,
                      as: 'ProjectTasks',
                      attributes: [
                        'id',
                        'state',
                        // [
                        //   Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('`workspaceProject->project->ProjectTasks`.`id`'))),
                        //   'total_task'
                        // ],
                        // [
                        //   Sequelize.fn('COUNT', Sequelize.literal('DISTINCT CASE WHEN `workspaceProject->project->ProjectTasks`.`state` = "completed" THEN `workspaceProject->project->ProjectTasks`.`id` END')),
                        //   'complete_task_count'
                        // ],
                        // [
                        //   Sequelize.fn('COUNT', Sequelize.literal('DISTINCT CASE WHEN `workspaceProject->project->ProjectTasks`.`state` <> "completed" THEN `workspaceProject->project->ProjectTasks`.`id` END')),
                        //   'pending_task_count'
                        // ]
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        })
        .then((res) => {
          const result = JSON.parse(JSON.stringify(res));

          return result;
        });
      resolve(count);
    });
  };

  public _getAllWorkspacesV2 = async (userData,searchText='', p = 0, l = 0, sortBy = 'title', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });
    userData.isAdmin = false;
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT
        tw.id,
        tw.title,
        tw.description,
        tw.avatar,
        tw.is_active,
        COUNT(DISTINCT tpw.id) AS project_count,
        COUNT(DISTINCT CASE WHEN tt.state = 'completed' THEN tt.id END) AS workspace_complete_task_count,
        COUNT(DISTINCT CASE WHEN tt.state != 'completed' THEN tt.id END) AS workspace_pending_task_count,
        COUNT(DISTINCT tt.id) AS workspace_total_task
    FROM
        tm_workspace tw
    LEFT JOIN
        tm_workspace_team twt ON twt.workspace_id = tw.id AND twt.deleted_at IS NULL
    LEFT JOIN
        tm_project_workspace tpw ON tpw.workspace_id = tw.id AND tpw.deleted_at IS NULL
    LEFT JOIN
        tm_projects tp ON tp.id = tpw.project_id AND tp.deleted_at IS NULL
    LEFT JOIN
        tm_tasks tt ON tt.project_id = tpw.project_id AND tt.deleted_at IS NULL
        ${userData.isAdmin?`${searchText?'WHERE tw.title LIKE "%'+searchText+'%" AND tw.deleted_at IS NULL':''}`:`WHERE tw.is_active = 1 AND (twt.user_id = ${userData.id} OR JSON_CONTAINS(twt.report_to, CAST(${userData.id} AS CHAR CHARACTER SET utf8))) ${searchText?'AND tw.title LIKE "%'+searchText+'%"':''} AND tw.deleted_at IS NULL`}
    GROUP BY
        tw.id ORDER BY ${sortBy} ${orderBy} ${limit>0?`LIMIT ${limit}`:''} ${offset>0?`OFFSET ${offset}`:''}`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getAllWorkspaces = async (query: WhereOptions = {}, inner_query: WhereOptions, p = 0, l = 0, sortBy = 'title', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });

    return new Promise<iWorkspace[]>((resolve, reject) => {
      const data = _workspace.findAll({
        where: query,
        limit: limit > 0 ? limit : null,
        offset: offset > 0 ? offset : null,
        order,
        include: [
          {
            as: 'team',
            model: _workspaceTeam,
            attributes: ['id', 'report_to', 'user_id'],

            where: inner_query,
            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name'],
              },
            ],
          },
          //   {
          //     as: 'workspaceProject',
          //     model: _projectWorkspace,
          //     attributes: ['id'],
          //     where: {
          //       project_id: { [Op.ne]: null },
          //     },
          //     required: false,
          //     include: [
          //       {
          //         as: 'project',
          //         model: _projects,
          //         attributes: ['id', 'name'],
          //       },
          //     ],
          //   },
        ],
        subQuery: false,
        group: ['id'],
      });
      resolve(data);
    });
  };

  public _getAllWorkspacesData = async (query: WhereOptions, data) => {
    const include = [];
    if (data.team) {
      include.push({
        as: 'team',
        model: _workspaceTeam,
        attributes: ['id', 'report_to', 'user_id'],

        include: [
          {
            as: 'user',
            model: _user,
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      });
    } else {
      include.push({
        as: 'team',
        model: _workspaceTeam,
        attributes: ['id', 'report_to', 'user_id'],
        required: false,
      });
    }

    if (data.project) {
      if (data.task) {
        include.push({
          as: 'workspaceProject',
          model: _projectWorkspace,
          attributes: ['id'],

          where: {
            project_id: { [Op.ne]: null },
          },
          include: [
            {
              as: 'project',
              model: _projects,
              attributes: ['id', 'name'],

              include: [
                {
                  as: 'ProjectTasks',
                  model: _projectTask,
                },
                // {
                //   as: 'projectBillingConfigration',
                //   model: _projectBillingConfigration,
                //   where:{project_status:{[Op.ne]:'closed'}}
                // }
              ],
              // required: false
            },
          ],
          // required: false
        });
      } else {
        include.push({
          as: 'workspaceProject',
          model: _projectWorkspace,
          attributes: ['id'],
          where: {
            project_id: { [Op.ne]: null },
          },
          required: false,
          include: [
            {
              as: 'project',
              model: _projects,
              attributes: ['id', 'name'],
              // include:[{
              //   as: 'projectBillingConfigration',
              //   model: _projectBillingConfigration,
              //   where:{project_status:{[Op.ne]:'closed'}}
              // }],
              require: false,
            },
          ],
        });
      }
    }
    return new Promise<iWorkspace[]>((resolve, reject) => {
      const data = _workspace.findAll({
        where: query,
        include: include,
        subQuery: false,
        // group: ['id'],
      });
      resolve(data);
    });
  };

  public _getAllWorkspacesDropdown = async (query: WhereOptions = {}) => {
    return new Promise<iWorkspace[]>((resolve, reject) => {
      const data = _workspace.findAll({
        where: query,
        include: [
          {
            as: 'team',
            model: _workspaceTeam,
            attributes: ['id', 'report_to', 'user_id'],

            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name'],
              },
            ],
          },
          {
            as: 'workspaceProject',
            model: _projectWorkspace,
            attributes: ['id'],

            where: {
              project_id: { [Op.ne]: null },
            },
            include: [
              {
                as: 'project',
                model: _projects,
                attributes: ['id', 'name'],

                // include:[{
                //   as: 'projectBillingConfigration',
                //   model: _projectBillingConfigration,
                //   attributes: ['id', 'project_status'],
                //   where:{project_status:{[Op.ne]:'closed'}}
                // }],
                // required: false
              },
            ],
          },
        ],
      });
      resolve(data);
    });
  };

  public _getAllWorkspacesProjectDropdown = async (query: WhereOptions = {}, userId: number) => {
    return new Promise<iWorkspace[]>((resolve, reject) => {
      const data = _workspace.findAll({
        where: query,
        include: [
          {
            as: 'team',
            model: _workspaceTeam,
            attributes: ['id', 'report_to', 'user_id'],

            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name'],
              },
            ],
          },
          {
            as: 'workspaceProject',
            model: _projectWorkspace,
            attributes: ['id'],

            // where: {
            //   project_id: { [Op.ne]: null },
            // },
            include: [
              {
                as: 'project',
                model: _projects,
                attributes: ['id', 'name'],

                include: [
                  {
                    as: 'projectTeam',
                    model: _projectTeam,
                  },
                  // {
                  //   as: 'projectBillingConfigration',
                  //   model: _projectBillingConfigration,
                  //   where:{project_status:{[Op.ne]:'closed'}}
                  // }
                ],
                // required:false
              },
            ],
            // required: false,
          },
        ],
      });
      resolve(data);
    });
  };

  public _getAllWorkspacesProjectDropdownV2 = async (userData) => {
    userData.isAdmin = false;
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        userData.isAdmin?`SELECT
        tw.id,
        tw.title,
        tw.is_active
    FROM
        tm_workspace tw`:`SELECT
        tw.id,
        tw.title,
        tw.is_active
    FROM
        tm_workspace tw
    WHERE
        tw.is_active = 1
        AND (
            EXISTS (SELECT 1 FROM tm_workspace_team twt WHERE twt.workspace_id = tw.id AND (twt.user_id = ${userData.id} OR JSON_CONTAINS(twt.report_to, CAST(${userData.id} AS CHAR CHARACTER SET utf8))))
            OR EXISTS (SELECT 1 FROM tm_project_workspace tpw WHERE tpw.workspace_id = tw.id AND EXISTS (SELECT 1 FROM tm_project_team tpt WHERE tpt.project_id = tpw.project_id AND tpt.user_id = ${userData.id}))
        );
    `,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getWorkspace = async (query: WhereOptions) => {
    return new Promise<iWorkspace>((resolve) => {
      const data = _workspace.findOne({
        where: query,
        include: [
          {
            as: 'team',
            model: _workspaceTeam,
            attributes: ['id', 'report_to', 'user_id'],
            include: [
              {
                as: 'user',
                model: _user,
                attributes: ['id', 'first_name', 'last_name', 'employee_image'],
                include: [
                  {
                    as: 'user_with_role',
                    model: _userWithRole,
                    attributes: ['id', 'role_id', 'user_id'],
                    include: [
                      {
                        as: 'user_role',
                        model: _userRole,
                        attributes: ['id', 'title'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            as: 'workspaceProject',
            model: _projectWorkspace,
            attributes: ['id', 'project_id', 'workspace_id'],
            include: [
              {
                as: 'project',
                model: _projects,
                attributes: ['id', 'name'],
                include: [
                  // {
                  //   as: 'projectBillingConfigration',
                  //   model: _projectBillingConfigration,
                  //   where:{project_status:{[Op.ne]:'closed'}}
                  // }
                ],
                // required: false,
              },
            ],
            // required: false,
          },
        ],
      });
      resolve(data);
    });
  };

  public _createWorkspace = async (workspaceData: object) => {
    return new Promise((resolve) => {
      const data = _workspace.create(workspaceData, {
        include: ['team', 'workspaceProject'],
      });
      resolve(data);
    });
  };

  public _updateWorkspace = async (workspace) => {
    return new Promise((resolve) => {
      const data = _workspace.update(workspace, {
        where: { id: workspace.id },
      });

      _workspaceTeam.bulkCreate(workspace.team, {
        updateOnDuplicate: ['id', 'report_to', 'user_id', 'workspace_id'],
      });

      _projectWorkspace.bulkCreate(workspace.workspaceProject, {
        updateOnDuplicate: ['id', 'project_id', 'workspace_id'],
      });
      resolve(data);
    });
  };

  // update workspace active status by id change is_active to false or true by id and is_active status
  public _updateWorkspaceActiveStatus = async (id: number, is_active: boolean) => {
    return new Promise((resolve, reject) => {
      const data = _workspace
        .update(
          { is_active },
          {
            where: { id },
          }
        )
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  public _deleteWorkspace = async (id: number) => {
    return new Promise((resolve) => {
      const data = _workspace.destroy({
        where: { id },
      });
      resolve(data);
    });
  };

  public _deleteWorkspaceTeam = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _workspaceTeam.destroy({
        where: query,
      });

      resolve(data);
    });
  };

  public _deleteWorkspaceProject = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _projectWorkspace.destroy({
        where: query,
      });
      resolve(data);
    });
  };

  public _getWorkSpacePermission = async (id: number, operation: string) => {
    return new Promise((resolve) => {
      userService._getUserRole(id).then((data) => {
        data = JSON.parse(JSON.stringify(data));
        let permission = data.user_role?.permission && JSON.parse(JSON.stringify(data.user_role.permission));
        // console.log(permission);

        permission = permission && permission.find((el) => el.workspace)?.actions;

        console.log(permission.find((el) => el[operation]));

        permission = permission && permission.find((el) => el[operation]);

        resolve(permission || {});
      });
    });
  };

  public _importWorkspaces = async (workspaceData) => {
    return new Promise((resolve) => {
      const data = _workspace.bulkCreate(workspaceData, {
        include: [
          'team',
          {
            as: 'workspaceProject',
            model: _projectWorkspace,
          },
        ],
      });
      resolve(data);
    });
  };

  public _addProjectTeam = async (insertData) => {
    return new Promise((resolve) => {
      const data = _projectTeam.bulkCreate(insertData)
      resolve(data);
    });
  };

  public _getProjectTeam = async (query: WhereOptions) => {
    return new Promise<iProjectTeam[]>((resolve) => {
      const data = _projectTeam.findAll({
        where: query,
      });
      resolve(data);
    });
  };

  public _deleteProjectTeam = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _projectTeam.destroy({
        where: query,
      });
      resolve(data);
    });
  };
}

export default WorkspaceService;
