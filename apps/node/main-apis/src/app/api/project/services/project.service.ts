import { Query } from '@tms-workspace/apis-core';
import { Op, WhereOptions, Sequelize, QueryTypes } from 'sequelize';
import { iProject, iProjectCustomFieldsMapping, iProjectStatus, iProjectTeam, ITimeLogs } from '../../../database/interface/projects.interface';
// import { iTag } from '../../../database/interface/tag.interface';
import UserService from '../../user/services/user.service';

import _DB from '../../../database/models';
import { TimeLogs } from '../../../database/models/task_time_logs.model';

const _projects = _DB.Projects;
const _workspace = _DB.Workspace;
const _projectTeam = _DB.ProjectTeam;
const _projectTask = _DB.ProjectTask;
const _projectTags = _DB.ProjectTags;
const _projectWorkspace = _DB.ProjectWorkspace;
const _projectStatus = _DB.ProjectStatus;
const _projrctCoustomFields = _DB.CustomFields;
const _projectCustomFieldsMapping = _DB.ProjectCustomFieldsMapping;
const _projectBillingConfigration = _DB.ProjectBillingConfigration;
const _projectDocument = _DB.ProjectDocument;
const _workspaceTeam = _DB.WorkspaceTeam;
const _tags = _DB.Tag;
const userService = new UserService();
const _userWithRole = _DB.UserWithRole;
const _userRole = _DB.UserRoles;
const _user = _DB.User;
const _userLogs = _DB.UserLog;

class ProjectService {
  public _getProjectsCount = async (query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _projects.count({
        where: query,
        include: [
          {
            model: _projectTeam,
            as: 'projectTeam',
            attributes: ['id', 'user_id', 'report_to'],
            include: [
              {
                model: _user,
                as: 'user',
                attributes: ['id', 'first_name', 'last_name', 'employee_image'],
              },
            ],
          },
          {
            model: _projectTags,
            as: 'projectTag',
            attributes: ['id', 'tag_id'],
            required: false,
            include: [
              {
                model: _tags,
                as: 'tag',
                attributes: ['id', 'title'],
              },
            ],
          },
          {
            model: _projectWorkspace,
            as: 'projectWorkspace',
            attributes: ['id', 'workspace_id'],
            required: false,
            include: [
              {
                model: _workspace,
                as: 'workspace',
                attributes: ['id', 'title', 'is_active'],
              },
            ],
          },
          {
            model: _projectBillingConfigration,
            as: 'projectBillingConfigration',
            where: { project_status: { [Op.ne]: 'closed' } },
          },
        ],
        distinct: true,
      });
      resolve(count);
    });
  };

  public _getProjectsWithDataCount = async (query: WhereOptions, data) => {
    const include = [];
    if (data.status) {
      include.push({
        as: 'projectStatus',
        model: _projectStatus,
      });
    }
    if (data.custom_fields) {
      include.push({
        as: 'projectCustomFieldsMapping',
        model: _projectCustomFieldsMapping,
        include: [
          {
            as: 'customField',
            model: _projrctCoustomFields,
          },
        ],
      });
    }
    if (data.documents) {
      include.push({
        as: 'ProjectDocument',
        model: _projectDocument,
      });
    }
    // if(data.billing_configuration){
    include.push({
      as: 'projectBillingConfigration',
      model: _projectBillingConfigration,
      where: { project_status: { [Op.ne]: 'closed' } },
    });
    // }
    if (data.team) {
      include.push({
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
      });
    } else {
      include.push({
        as: 'projectTeam',
        model: _projectTeam,
        attributes: ['id', 'user_id', 'report_to'],
      });
    }
    if (data.tag) {
      include.push({
        as: 'projectTag',
        model: _projectTags,
        attributes: ['id'],
        required: false,
        include: [
          {
            as: 'tag',
            model: _tags,
            attributes: ['id', 'title'],
          },
        ],
      });
    }
    // if(data.workspace){
    include.push({
      as: 'projectWorkspace',
      model: _projectWorkspace,
      attributes: ['id'],
      required: false,
      include: [
        {
          as: 'workspace',
          model: _workspace,
          attributes: ['id', 'title', 'is_active'],
        },
      ],
    });
    // }
    return new Promise<number>((resolve) => {
      const count = _projects.count({
        where: query,
        include: include,
        distinct: true,
        // subQuery: false,
      });
      resolve(count);
    });
  };

  public _getProjectsCountAfterSerch = async (
    query: WhereOptions,
    inner_query: WhereOptions,
    tag_ids: number[],
    workspace_ids: number[],
    billable,
    status: string[]
  ) => {
    return new Promise<number>((resolve) => {
      const count = _projects.count({
        where: query,
        include: [
          {
            model: _projectTeam,
            as: 'projectTeam',
            attributes: ['id', 'user_id', 'report_to'],
            include: [
              {
                model: _user,
                as: 'user',
                attributes: ['id', 'first_name', 'last_name', 'employee_image'],
              },
            ],
          },
          {
            model: _projectTags,
            as: 'projectTag',
            attributes: ['id', 'tag_id'],
            where:
              tag_ids.length > 0
                ? {
                  tag_id: {
                    [Op.in]: tag_ids,
                  },
                }
                : {},
            required: tag_ids.length > 0,
            include: [
              {
                model: _tags,
                as: 'tag',
                attributes: ['id', 'title'],
              },
            ],
          },
          {
            model: _projectWorkspace,
            as: 'projectWorkspace',
            attributes: ['id', 'workspace_id'],
            where: workspace_ids.length > 0 ? { workspace_id: { [Op.in]: workspace_ids } } : {},
            required: workspace_ids.length > 0,
            include: [
              {
                model: _workspace,
                as: 'workspace',
                attributes: ['id', 'title', 'is_active'],
              },
            ],
          },
          {
            model: _projectBillingConfigration,
            as: 'projectBillingConfigration',
            attributes: ['id', 'project_id', 'project_status', 'is_billable', 'quoted_hours'],
            where:
              billable === ''
                ? { project_status: { [Op.in]: status } }
                : { [Op.and]: [{ project_status: { [Op.in]: status } }, { is_billable: billable }] },
          },
        ],
        distinct: true,
      });
      resolve(count);
    });
  };

  public _getAllProjectAfterSerch = async (
    query: WhereOptions = {},
    inner_query: WhereOptions,
    tag_ids: number[],
    workspace_ids: number[],
    billable,
    status: string[],
    p = 0,
    l = 0,
    sortBy = 'name',
    orderBy = 'asc'
  ) => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });
    return new Promise<iProject[]>((resolve) => {
      const data = _projects
        .findAll({
          where: query,
          order,
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          subQuery: false,
          include: [
            {
              model: _projectTeam,
              as: 'projectTeam',
              attributes: [
                'user_id',
                'report_to',
                // [
                //   Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('projectTeam.id'))),
                //   'team_count'
                // ]
              ],
              include: [
                {
                  model: _user,
                  as: 'user',
                  attributes: ['id', 'first_name', 'last_name', 'employee_image'],
                },
              ],
            },
            {
              model: _projectTeam,
              as: 'projectTeamData',
              attributes: [
                'user_id',
                'report_to',
                [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('projectTeamData.id'))), 'team_count'],
              ],
            },
            {
              model: _projectTask,
              as: 'ProjectTasks',
              attributes: [
                [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('ProjectTasks.id'))), 'total_task'],
                [
                  Sequelize.fn('COUNT', Sequelize.literal('DISTINCT CASE WHEN ProjectTasks.state = "completed" THEN ProjectTasks.id END')),
                  'complete_task_count',
                ],
                [
                  Sequelize.fn('COUNT', Sequelize.literal('DISTINCT CASE WHEN ProjectTasks.state <> "completed" THEN ProjectTasks.id END')),
                  'pending_task_count',
                ],
              ],
            },
            {
              model: _projectTags,
              as: 'projectTag',
              attributes: ['id', 'tag_id'],
              where:
                tag_ids.length > 0
                  ? {
                    tag_id: {
                      [Op.in]: tag_ids,
                    },
                  }
                  : {},
              required: tag_ids.length > 0,
              include: [
                {
                  model: _tags,
                  as: 'tag',
                  attributes: ['id', 'title'],
                },
              ],
            },
            {
              model: _projectWorkspace,
              as: 'projectWorkspace',
              attributes: ['id', 'workspace_id'],
              where: workspace_ids.length > 0 ? { workspace_id: { [Op.in]: workspace_ids } } : {},
              required: workspace_ids.length > 0,
              include: [
                {
                  model: _workspace,
                  as: 'workspace',
                  attributes: ['id', 'title', 'is_active'],
                },
              ],
            },
            {
              model: _projectBillingConfigration,
              as: 'projectBillingConfigration',
              attributes: ['id', 'project_id', 'project_status', 'is_billable', 'quoted_hours'],
              // where:{project_status:{[Op.in]:status}}
              // where:{[Op.and]:[{project_status:{[Op.in]:status}},{is_billable:billable}]},
              where:
                billable === ''
                  ? { project_status: { [Op.in]: status } }
                  : { [Op.and]: [{ project_status: { [Op.in]: status } }, { is_billable: billable }] },
            },
          ],
          group: ['id'],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getAllUnlinkProjectsCount = async (query: WhereOptions) => {
    return new Promise<number>((resolve) => {
      const count = _projects.count({
        where: query,
        include: [
          {
            as: 'projectWorkspace',
            model: _projectWorkspace,
            attributes: ['id'],
            required: false,
          },
        ],
        distinct: true,
      });
      resolve(count);
    });
  };
  public _getAllUnlinkProject = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'name', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });

    return new Promise<iProject[]>((resolve) => {
      const data = _projects
        .findAll({
          attributes: ['id', 'name'],
          where: query,
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          order,
          subQuery: false,
          include: [
            {
              as: 'projectWorkspace',
              model: _projectWorkspace,
              attributes: ['id'],
              required: false,
            },
            // {
            //   as: 'projectBillingConfigration',
            //   model: _projectBillingConfigration,
            //   attributes: ['id'],
            //   // required: false,
            //   where:{project_status:{[Op.ne]:'closed'}}
            // }
          ],
          // subQuery: false,
          // group: ['id'],
        })
        .then((res) => {
          // console.log(res);

          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getAllProject = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'name', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });

    return new Promise<iProject[]>((resolve) => {
      const data = _projects
        .findAll({
          where: query,
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          order,
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
              as: 'projectTag',
              model: _projectTags,
              attributes: ['id'],
              required: false,
              include: [
                {
                  as: 'tag',
                  model: _tags,
                  attributes: ['id', 'title'],
                },
              ],
            },
            {
              as: 'projectWorkspace',
              model: _projectWorkspace,
              attributes: ['id'],
              required: false,
              include: [
                {
                  as: 'workspace',
                  model: _workspace,
                  attributes: ['id', 'title', 'is_active'],
                },
              ],
            },
            {
              as: 'projectBillingConfigration',
              model: _projectBillingConfigration,
              // required: false,
              where: { project_status: { [Op.ne]: 'closed' } },
            },
          ],
          // subQuery: false,
          // group: ['id'],
        })
        .then((res) => {
          // console.log(res);

          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getAllProjectData = async (query: WhereOptions = {}, data, p = 0, l = 0, sortBy = 'name', orderBy = 'asc') => {
    const { order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });
    const include = [];
    if (data.status) {
      include.push({
        as: 'projectStatus',
        model: _projectStatus,
      });
    }
    if (data.custom_fields) {
      include.push({
        as: 'projectCustomFieldsMapping',
        model: _projectCustomFieldsMapping,
        include: [
          {
            as: 'customField',
            model: _projrctCoustomFields,
          },
        ],
      });
    }
    if (data.documents) {
      include.push({
        as: 'ProjectDocument',
        model: _projectDocument,
      });
    }
    if (data.billing_configuration) {
      include.push({
        as: 'projectBillingConfigration',
        model: _projectBillingConfigration,
        where: { project_status: { [Op.ne]: 'closed' } },
      });
    } else {
      include.push({
        as: 'projectBillingConfigration',
        model: _projectBillingConfigration,
        attributes: ['id', 'project_status'],
        where: { project_status: { [Op.ne]: 'closed' } },
      });
    }

    if (data.team) {
      include.push({
        as: 'projectTeamData',
        model: _projectTeam,
        attributes: ['id', 'user_id', 'report_to'],
        include: [
          {
            as: 'user',
            model: _user,
            attributes: ['id', 'first_name', 'last_name', ['employee_image', 'avatar']],
          },
        ],
      });
    }
    // else{
    include.push({
      as: 'projectTeam',
      model: _projectTeam,
      attributes: ['id', 'user_id', 'report_to'],
    });
    // }
    if (data.tag) {
      include.push({
        as: 'projectTag',
        model: _projectTags,
        attributes: ['id'],
        required: false,
        include: [
          {
            as: 'tag',
            model: _tags,
            attributes: ['id', 'title'],
          },
        ],
      });
    }
    // if(data.workspace){
    include.push({
      as: 'projectWorkspace',
      model: _projectWorkspace,
      attributes: ['id'],
      required: false,
      include: [
        {
          as: 'workspace',
          model: _workspace,
          attributes: ['id', 'title', 'is_active'],
        },
      ],
    });
    // }
    return new Promise<iProject[]>((resolve) => {
      const data = _projects
        .findAll({
          subQuery: false,
          include: include,
          where: query,
          // limit: limit > 0 ? limit : null,
          // offset: offset > 0 ? offset : null,
          order,
          // subQuery: false,
          // group: ['id'],
        })
        .then((res) => {
          // console.log(res);

          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getProjectDrop = async (query: WhereOptions, user) => {
    return new Promise<object[]>((resolve) => {
      // const data = _projects.findAll({
      //   where: query,
      //   attributes: ['id','project_key','name'],
      //   include: [
      //     {
      //       as: 'projectTeam',
      //       model: _projectTeam,
      //       attributes: ['id', 'user_id', 'report_to'],
      //     },
      //     {
      //       as: 'projectWorkspace',
      //       model: _projectWorkspace,
      //       attributes: ['id'],
      //       required: false,
      //       include: [
      //         {
      //           as: 'workspace',
      //           model: _workspace,
      //           attributes: ['id', 'title', 'is_active'],
      //         },
      //       ],
      //     },
      //     {
      //       model: _projectBillingConfigration,
      //       as: 'projectBillingConfigration',
      //       attributes: ['id','project_status'],
      //       where: { project_status: { [Op.ne]: 'closed' } },
      //     },
      //   ],
      // });
      const result = _DB.sequelize.query(
        `SELECT
        projects.id,
        projects.project_key,
        projects.name,
        workspace.id AS workspace_id,
        workspace.title AS workspace_title,
        workspace.is_active
    FROM
        tm_projects AS projects
    LEFT JOIN
        tm_project_workspace AS projectWorkspace
        ON (projects.id = projectWorkspace.project_id AND projectWorkspace.deleted_at IS NULL)
    LEFT JOIN
        tm_workspace AS workspace
        ON (projectWorkspace.workspace_id = workspace.id AND workspace.deleted_at IS NULL)
    LEFT JOIN
        tm_biling_configurations AS projectBillingConfiguration
        ON (projects.id = projectBillingConfiguration.project_id AND projectBillingConfiguration.deleted_at IS NULL)
   ${user.isAdmin
          ? ''
          : `LEFT JOIN
        tm_project_team AS projectTeam
        ON (projects.id = projectTeam.project_id AND projectTeam.deleted_at IS NULL)`
        }
    WHERE
    ${!user.isAdmin
          ? `(
            (projectWorkspace.id IS NULL OR workspace.is_active = true)
            AND
            (
                projectTeam.user_id = ${user.id}
            )
        )
        AND
        projectBillingConfiguration.project_status <> 'closed' AND projects.deleted_at IS NULL`
          : `projectBillingConfiguration.project_status <> 'closed' AND projects.deleted_at IS NULL`
        } GROUP BY projects.id ORDER BY projects.name ASC`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getProjectWithTaskCount = async (user) => {
    return new Promise<object[]>((resolve) => {
      user.isAdmin = false;
      const result = _DB.sequelize.query(
        `SELECT
        projects.id,
        projects.project_key,
        projects.name,
        workspace.id AS workspace_id,
        workspace.title AS workspace_title,
        workspace.is_active,
        COUNT(DISTINCT pt.id) AS pending_task_count
    FROM
        tm_projects AS projects
    LEFT JOIN
        tm_tasks AS pt ON projects.id = pt.project_id AND pt.state <> 'completed' AND pt.deleted_at IS NULL
    LEFT JOIN
        tm_project_workspace AS projectWorkspace
        ON (projects.id = projectWorkspace.project_id AND projectWorkspace.deleted_at IS NULL)
    LEFT JOIN
        tm_workspace AS workspace
        ON (projectWorkspace.workspace_id = workspace.id AND workspace.deleted_at IS NULL)    
    LEFT JOIN
        tm_biling_configurations AS projectBillingConfiguration
        ON (projects.id = projectBillingConfiguration.project_id AND projectBillingConfiguration.deleted_at IS NULL)
   ${user.isAdmin
          ? ''
          : `LEFT JOIN
        tm_project_team AS projectTeam
        ON (projects.id = projectTeam.project_id AND projectTeam.deleted_at IS NULL)`
        }
    WHERE
    ${!user.isAdmin
          ? `(
            (projectWorkspace.id IS NULL OR workspace.is_active = true)
            AND
            (
                projectTeam.user_id = ${user.id}
                OR
                JSON_CONTAINS(projectTeam.report_to, CAST(${user.id} AS CHAR CHARACTER SET utf8))
            )
        )
        AND
        projectBillingConfiguration.project_status <> 'closed' AND projects.deleted_at IS NULL AND pt.id IS NOT NULL`
          : `projectBillingConfiguration.project_status <> 'closed' AND projects.deleted_at IS NULL AND pt.id IS NOT NULL`
        } GROUP BY projects.id`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getProjectUsersActiveProject = async (user) => {
    return new Promise<object[]>((resolve) => {
      console.log(user.id,"user.id");
      
      const result = _DB.sequelize.query(
        `SELECT
        projects.id,
        projects.project_key,
        projects.name,
        workspace.id AS workspace_id,
        workspace.title AS workspace_title,
        workspace.is_active
    FROM
        tm_projects AS projects
    LEFT JOIN
        tm_project_workspace AS projectWorkspace
        ON (projects.id = projectWorkspace.project_id AND projectWorkspace.deleted_at IS NULL)
    LEFT JOIN
        tm_workspace AS workspace
        ON (projectWorkspace.workspace_id = workspace.id AND workspace.deleted_at IS NULL)
    LEFT JOIN
        tm_project_team AS projectTeam
        ON (projects.id = projectTeam.project_id AND projectTeam.deleted_at IS NULL)    
    WHERE
        projectTeam.user_id = ${user.id} AND projectTeam.deleted_at IS NULL
    GROUP BY projects.id`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getTags = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _projectTags.findAll({
        where: query,
        include: [
          {
            as: 'tag',
            model: _tags,
            attributes: ['id', 'title'],
          },
        ],
      });
      resolve(data);
    });
  };

  public _getProject = async (query: WhereOptions) => {
    return new Promise<iProject>((resolve) => {
      const data = _projects.findOne({
        where: query,
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
            as: 'projectTag',
            model: _projectTags,
            attributes: ['id', 'tag_id'],
            required: false,
            include: [
              {
                as: 'tag',
                model: _tags,
                attributes: ['id', 'title'],
              },
            ],
          },
          {
            as: 'projectWorkspace',
            model: _projectWorkspace,
            attributes: ['id'],
            required: false,
            include: [
              {
                as: 'workspace',
                model: _workspace,
                attributes: ['id', 'title', 'is_active'],
              },
            ],
          },
          {
            model: _projectBillingConfigration,
            as: 'projectBillingConfigration',
            attributes: ['id', 'project_id', 'project_status', 'is_billable', 'quoted_hours']
          },{
            as: 'createdBy',
            model: _user,
            attributes: ['id', 'first_name', 'last_name', 'employee_image']
          },
        ],
      });
      resolve(data);
    });
  };

  public _getProjectData = async (query: WhereOptions) => {
    return new Promise<iProject>((resolve) => {
      const data = _projects.findOne({
        where: query,
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
            as: 'projectTag',
            model: _projectTags,
            attributes: ['id', 'tag_id'],
            required: false,
            include: [
              {
                as: 'tag',
                model: _tags,
                attributes: ['id', 'title'],
              },
            ],
          },
          {
            as: 'projectStatus',
            model: _projectStatus,
          },
          {
            as: 'projectCustomFieldsMapping',
            model: _projectCustomFieldsMapping,
            include: [
              {
                as: 'customField',
                model: _projrctCoustomFields,
              },
            ],
          },
          {
            as: 'projectWorkspace',
            model: _projectWorkspace,
            attributes: ['id'],
            required: false,
            include: [
              {
                as: 'workspace',
                model: _workspace,
                attributes: ['id', 'title', 'is_active'],
              },
            ],
          },
          {
            model: _projectBillingConfigration,
            as: 'projectBillingConfigration',
            attributes: ['id', 'project_id', 'project_status', 'is_billable', 'quoted_hours'],
          },
        ],
      });
      resolve(data);
    });
  };

  public _findOrCreateTag = async (tagData) => {
    return new Promise((resolve) => {
      const data: Promise<{ tag_id: number }> = _tags
        .findOrCreate({
          where: { title: tagData.title },
        })
        .then((res) => {
          const newtag = JSON.parse(JSON.stringify(res[0]));

          return { tag_id: newtag.id };
        });

      resolve(data);
    });
  };

  public _createProject = async (projectData: object) => {
    return new Promise((resolve) => {
      const data = _projects.create(projectData, {
        include: ['projectTeam', 'projectTag', 'projectWorkspace', 'projectBillingConfigration'],
      });
      resolve(data);
    });
  };

  public _updateProject = async (project) => {
    return new Promise((resolve) => {
      console.log('project', project);

      const data = _projects
        .update(project, {
          where: { id: project.id },
        })
        .then(async (res) => {
          await _projectTeam.bulkCreate(project.projectTeam, {
            updateOnDuplicate: ['id', 'report_to', 'user_id', 'project_id'],
          });

          await _projectTags.bulkCreate(project.projectTag, {
            updateOnDuplicate: ['id', 'project_id', 'tag_id'],
          });
          if (project.projectWorkspace != null && project.projectWorkspace.id) {
            _projectWorkspace.update(
              { workspace_id: project.projectWorkspace.workspace_id },
              {
                where: {
                  id: project.projectWorkspace.id,
                },
              }
            );
          } else if (project.projectWorkspace == null || (project.projectWorkspace.id == null && !project.projectWorkspace.workspace_id)) {
            console.log("enter", project.projectWorkspace.id);

            _projectWorkspace.destroy({
              where: {
                project_id: project.id,
              }
            });
          } else {
            await _projectWorkspace.create(project.projectWorkspace);
          }

          return res;
        });

      resolve(data);
    });
  };

  public _deleteProject = async (id: number) => {
    return new Promise((resolve) => {
      const data = _projects.destroy({
        where: { id },
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

  public _updateProjectTeam = async ({user_id, project_ids}) => {
    const query = `
  UPDATE tm_project_team
  JOIN JSON_TABLE(
    report_to,
    '$[*]' COLUMNS(
      idx FOR ORDINALITY,
      val JSON PATH '$'
    )
  ) AS jt
  ON TRUE
  SET report_to = JSON_REMOVE(report_to, CONCAT('$[', jt.idx - 1, ']'))
  WHERE jt.val = :valueToRemove
  AND project_id IN (:projectIds)
`;

    return new Promise((resolve) => {
      const data = _DB.sequelize.query(query, {
        replacements: { valueToRemove: Number(user_id), projectIds: project_ids },
        type: QueryTypes.UPDATE,
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

  public _deleteProjectTags = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _projectTags.destroy({
        where: query,
      });
      resolve(data);
    });
  };

  public _deleteProjectWorkspace = async (query: WhereOptions) => {
    return new Promise((resolve) => {
      const data = _projectWorkspace.destroy({
        where: query,
      });
      resolve(data);
    });
  };

  public _getProjectPermission = async (id: number, operation: string) => {
    return new Promise((resolve) => {
      userService._getUserRole(id).then((data) => {
        data = JSON.parse(JSON.stringify(data));

        let permission = data.user_role?.permission && JSON.parse(JSON.stringify(data.user_role.permission));
        permission = permission && permission.find((el) => el.project)?.actions;
        permission = permission && permission.find((el) => el[operation])?.fields;
        resolve(permission || {});
      });
    });
  };

  // GET Time History By Task
  public _getTaskHistoryData = async (query) => {
    return new Promise<ITimeLogs[]>((resolve, reject) => {
      const data = TimeLogs.find(query);
      resolve(data);
    });
  };

  public _getProjectTeam = async (projectId: number[]) => {
    return new Promise<object[]>((resolve) => {
      const result = _DB.sequelize.query(
        `SELECT 
        projects.id AS id, 
        projects.name AS name,
        projects.responsible_person,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', tpt.id,
                'user_id', tpt.user_id,
                'report_to', (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', users.id,
                            'last_name', users.last_name,
                            'first_name', users.first_name,
                            'employee_image', users.employee_image,
                            'login_capture_data', (
                                SELECT login_capture_data
                                FROM tm_user_logs
                                WHERE user_id = users.id
                                    AND DATE(action_start_date) = CURDATE() AND action = 'LOGIN'
                                    ORDER BY action_start_date DESC
                                LIMIT 1 
                            )
                        )
                    )
                    FROM tm_users AS users
                    WHERE JSON_CONTAINS(tpt.report_to, CAST(users.id AS CHAR CHARACTER SET utf8)) AND users.deleted_at IS NULL
                ),
                'user', JSON_OBJECT(
                    'id', tpt.user_id,
                    'last_name', users.last_name,
                    'first_name', users.first_name,
                    'employee_image', users.employee_image,
                    'login_capture_data', (
                        SELECT login_capture_data
                        FROM tm_user_logs
                        WHERE user_id = tpt.user_id
                            AND DATE(action_start_date) = CURDATE() AND action = 'LOGIN'
                            ORDER BY action_start_date DESC
                        LIMIT 1
                    )
                )
            )
        ) AS projectTeam
    FROM 
        tm_projects AS projects
    LEFT JOIN 
        tm_project_team AS tpt ON (projects.id = tpt.project_id AND tpt.deleted_at IS NULL)
    LEFT JOIN 
        tm_users AS users ON tpt.user_id = users.id AND users.deleted_at IS NULL
    WHERE 
        projects.id IN  (${projectId.join(',')}) AND users.deleted_at IS NULL
    GROUP BY 
        projects.id`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
    // new Promise<iProject[]>((resolve) => {
    //   const data = _projects.findAll({
    //     where: query,
    //     include: [
    //       {
    //         as: 'projectTeam',
    //         model: _projectTeam,
    //         attributes: ['id', 'user_id', 'report_to'],
    //         include: [
    //           {
    //             as: 'user',
    //             model: _user,
    //             attributes: ['id', 'first_name', 'last_name', 'employee_image'],
    //           },
    //         ],
    //       },
    //     ],
    //     attributes: ['id', 'name'],
    //   });
    //   resolve(data);
    // });
  };

  public _getProjectStatus = async (query: WhereOptions) => {
    return new Promise<iProject[]>((resolve) => {
      const data = _projects.findAll({
        where: query,
        include: [
          {
            as: 'projectStatus',
            model: _projectStatus,
          },
        ],
        attributes: ['id', 'name'],
      });
      resolve(data);
    });
  };

  public _getProjectCustomFields = async (query: WhereOptions) => {
    return new Promise<iProject[]>((resolve) => {
      const data = _projects.findAll({
        where: query,
        include: [
          {
            as: 'projectCustomFieldsMapping',
            model: _projectCustomFieldsMapping,
            include: [
              {
                as: 'customField',
                model: _projrctCoustomFields,
              },
            ],
          },
        ],
        attributes: ['id', 'name'],
      });
      resolve(data);
    });
  };


  //   public _getProjectsCountAfterSerchV2 = async (
  //     userData,
  //     searchText,
  //     tag_ids: number[],
  //     workspace_ids: number[],
  //     billable,
  //     status: string[]
  //   ) => { 
  //     return new Promise<object[]>((resolve, reject) => {
  //       const result = _DB.sequelize.query(
  //         `SELECT COUNT(DISTINCT p.id) AS total_count
  //     FROM
  //     tm_projects AS p
  // LEFT JOIN
  //     tm_project_team AS pt ON p.id = pt.project_id 
  // LEFT JOIN
  //     tm_project_tag AS ptags ON p.id = ptags.project_id
  // LEFT JOIN
  //     tm_tag  AS t ON ptags.tag_id = t.id
  // LEFT JOIN
  //     tm_project_workspace AS pw ON p.id = pw.project_id
  // LEFT JOIN
  //     tm_workspace AS w ON pw.workspace_id = w.id 
  // LEFT JOIN
  //     tm_biling_configurations  AS pbc ON p.id = pbc.project_id 
  //     WHERE (t.title LIKE "%${searchText}%" OR p.name LIKE "%${searchText}%") AND ${
  //       billable === ''
  //         ? `pbc.project_status IN ("${status.join('","')}")`
  //         : `pbc.project_status IN ("${status.join('","')}") AND pbc.is_billable = ${billable}`
  //     }${tag_ids.length > 0 ? `AND t.id IN ("${tag_ids.join('","')}")` : ''} ${
  //           workspace_ids.length > 0 ? `AND w.id IN ("${workspace_ids.join('","')}")` : ''
  //         }  ${userData.isAdmin ? `` : `AND (pw.id IS NULL OR w.is_active = 1)`} AND (pt.user_id = ${userData.id} OR JSON_CONTAINS(pt.report_to, CAST(${userData.id} AS CHAR CHARACTER SET utf8)))`,
  //         { type: QueryTypes.SELECT }
  //       );
  //       resolve(result);
  //     });
  //   };


  public _getProjectsCountAfterSerchV2 = async (
    userData,
    searchText,
    tag_ids: number[],
    workspace_ids: number[],
    billable,
    status: string[]
  ) => {
    userData.isAdmin = false;
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT COUNT(DISTINCT p.id) AS total_count
  FROM
  tm_projects AS p
LEFT JOIN
  tm_project_team AS pt ON p.id = pt.project_id AND pt.user_id = ${userData.id} AND pt.deleted_at IS NULL
LEFT JOIN
  tm_project_tag AS ptags ON p.id = ptags.project_id AND ptags.deleted_at IS NULL
LEFT JOIN
  tm_tag  AS t ON ptags.tag_id = t.id AND t.deleted_at IS NULL
LEFT JOIN
  tm_project_workspace AS pw ON p.id = pw.project_id AND pw.deleted_at IS NULL
LEFT JOIN
  tm_workspace AS w ON pw.workspace_id = w.id AND w.deleted_at IS NULL
LEFT JOIN
  tm_biling_configurations  AS pbc ON p.id = pbc.project_id AND pbc.deleted_at IS NULL
  WHERE (t.title LIKE "%${searchText}%" OR p.name LIKE "%${searchText}%") AND ${`pbc.project_status IN ("${status.join('","')}")`}${tag_ids.length > 0 ? `AND t.id IN ("${tag_ids.join('","')}")` : ''} ${workspace_ids.length > 0 ? `AND w.id IN ("${workspace_ids.join('","')}")` : ''
        }  ${userData.isAdmin ? `` : `AND (pw.id IS NULL OR w.is_active = 1)`} AND pt.user_id = ${userData.id} AND p.deleted_at IS NULL`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getProjectsDashboardCountAfterSerchV2 = async (userData) => {
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT COUNT(DISTINCT tp.id) AS total_count
      FROM tm_projects tp 
      LEFT JOIN tm_tasks t ON tp.id = t.project_id
      WHERE t.assignee  = ${userData.id}
      HAVING COUNT(t.id) > 0`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getAllProjectAfterSerchV2 = async (
    userData,
    searchText,
    tag_ids: number[],
    workspace_ids: number[],
    billable,
    status: string[],
    p = 0,
    l = 0,
    sortBy = 'name',
    orderBy = 'asc'
  ) => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT
      p.id AS id,
      p.name AS project_title,
      pbc.is_billable AS projectBillable,
      pbc.quoted_hours AS projectQuotedHours,
      pbc.project_status AS projectStatus,
      pbc.id AS projectStatusId,
      w.title AS project_workspace,
      w.id AS project_workspace_id,
      w.is_active AS project_workspace_is_active,
      p.estimated_end_date AS project_estimated_end_date,
      p.project_key AS project_key,
      CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(t.title)), ']') AS project_tags,
  COUNT(DISTINCT tt.id) AS project_task_count,
  (SELECT COUNT(tpt.id) FROM tm_project_team tpt WHERE tpt.project_id = p.id AND tpt.deleted_at Is NULL) AS project_team_count,
  COUNT(DISTINCT CASE WHEN tt.state = 'completed' THEN tt.id END) AS project_complete_task_count,
  COUNT(DISTINCT CASE WHEN tt.state <> 'completed' THEN tt.id END) AS project_pending_task_count
  FROM
  tm_projects AS p
LEFT JOIN
  tm_project_team AS pt ON p.id = pt.project_id AND pt.user_id = ${userData.id} AND pt.deleted_at IS NULL
LEFT JOIN
  tm_project_tag AS ptags ON p.id = ptags.project_id AND ptags.deleted_at IS NULL
LEFT JOIN
  tm_tasks tt ON p.id = tt.project_id AND tt.deleted_at IS NULL
LEFT JOIN
  tm_tag  AS t ON ptags.tag_id = t.id AND t.deleted_at IS NULL
LEFT JOIN
  tm_project_workspace AS pw ON p.id = pw.project_id AND pw.deleted_at IS NULL
LEFT JOIN
  tm_workspace AS w ON pw.workspace_id = w.id AND w.deleted_at IS NULL
LEFT JOIN
  tm_biling_configurations  AS pbc ON p.id = pbc.project_id AND pbc.deleted_at IS NULL
  WHERE (t.title LIKE "%${searchText}%" OR p.name LIKE "%${searchText}%") AND pt.id IS NOT NULL AND p.deleted_at IS NULL AND pbc.project_status IN ("${status.join('","')}") 
  ${tag_ids.length > 0 ? `AND t.id IN ("${tag_ids.join('","')}")` : ''}
  ${workspace_ids.length > 0 ? `AND w.id IN ("${workspace_ids.join('","')}")` : ''}
  ${userData.isAdmin ? `` : `AND (pw.id IS NULL OR w.is_active = 1)`} 
  GROUP BY
      p.id
  ORDER BY
    ${sortBy} ${orderBy} ${limit > 0 ? `LIMIT ${limit}` : ''} ${offset > 0 ? `OFFSET ${offset}` : ''}`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getAllProjectDashboardAfterSerchV2 = async (
    userData,
    p = 0,
    l = 0,
    sortBy = 'name',
    orderBy = 'asc'
  ) => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT tp.id,tp.name, COUNT(t.id) AS project_complete_task_count,COUNT(CASE WHEN t.state != 'completed' THEN 1 END) AS project_pending_task_count
      FROM tm_projects tp 
      LEFT JOIN tm_tasks t ON tp.id = t.project_id
      WHERE t.assignee  = ${userData.id}
      GROUP BY tp.id
      HAVING COUNT(t.id) > 0 ORDER BY COUNT(t.id) DESC ${limit > 0 ? `LIMIT ${limit}` : ''} ${offset > 0 ? `OFFSET ${offset}` : ''}`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getProjectTasksV2 = async (
    l = 0
  ) => {
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT tp.id,tp.name, COUNT(CASE WHEN t.state = 'inprogress' THEN 1 END) AS In_Progress,COUNT(CASE WHEN t.state = 'todo' THEN 1 END) AS To_Do,COUNT(CASE WHEN t.state = 'onhold' THEN 1 END) AS On_Hold,COUNT(CASE WHEN t.state = 'completed' THEN 1 END) AS Completed
      FROM tm_projects tp 
      LEFT JOIN tm_tasks t ON tp.id = t.project_id
      GROUP BY tp.id
      HAVING COUNT(CASE WHEN t.state != 'completed' THEN 1 END) > 0 ORDER BY COUNT(CASE WHEN t.state != 'completed' THEN 1 END) DESC ${l > 0 ? `LIMIT ${l}` : ''}`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getAllProjectDashboardActionV2 = async (
    userData,
    sortBy = 'name',
    orderBy = 'asc'
  ) => {
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT tp.id,tp.name, COUNT(t.id) AS project_complete_task_count,COUNT(CASE WHEN t.state != 'completed' THEN 1 END) AS project_pending_task_count
      FROM tm_projects tp 
      LEFT JOIN tm_tasks t ON tp.id = t.project_id
      WHERE t.assignee  = ${userData.id}
      GROUP BY tp.id
      HAVING COUNT(CASE WHEN t.state != 'completed' THEN 1 END) > 0 ORDER BY COUNT(CASE WHEN t.state != 'completed' THEN 1 END) DESC`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getAllProjectAfterSerchBillingV2 = async (
    userData,
    searchText,
    tag_ids: number[],
    workspace_ids: number[],
    billable,
    status: string[],
    p = 0,
    l = 0,
    sortBy = 'name',
    orderBy = 'asc'
  ) => {
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
      p.id AS id,
      p.name AS project_title,
      pbc.is_billable AS projectBillable,
      pbc.quoted_hours AS projectQuotedHours,
      pbc.project_status AS projectStatus,
      pbc.id AS projectStatusId,
      w.title AS project_workspace,
      w.id AS project_workspace_id,
      w.is_active AS project_workspace_is_active,
      p.estimated_end_date AS project_estimated_end_date,
      p.project_key AS project_key,
      CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(t.title)), ']') AS project_tags,
  COUNT(DISTINCT tt.id) AS project_task_count,
  (SELECT COUNT(tpt.id) FROM tm_project_team tpt WHERE tpt.project_id = p.id AND tpt.deleted_at Is NULL) AS project_team_count,
  COUNT(DISTINCT CASE WHEN tt.state = 'completed' THEN tt.id END) AS project_complete_task_count,
  COUNT(DISTINCT CASE WHEN tt.state <> 'completed' THEN tt.id END) AS project_pending_task_count
  FROM
  tm_projects AS p
LEFT JOIN
  tm_project_team AS pt ON p.id = pt.project_id AND pt.user_id = ${userData.id} AND pt.deleted_at Is NULL
LEFT JOIN
  tm_project_tag AS ptags ON p.id = ptags.project_id AND ptags.deleted_at Is NULL
LEFT JOIN
  tm_tasks tt ON p.id = tt.project_id AND tt.deleted_at Is NULL
LEFT JOIN
  tm_tag  AS t ON ptags.tag_id = t.id AND t.deleted_at Is NULL
LEFT JOIN
  tm_project_workspace AS pw ON p.id = pw.project_id AND pw.deleted_at Is NULL
LEFT JOIN
  tm_workspace AS w ON pw.workspace_id = w.id AND w.deleted_at Is NULL
LEFT JOIN
  tm_biling_configurations  AS pbc ON p.id = pbc.project_id AND pbc.deleted_at Is NULL 
  WHERE (t.title LIKE "%${searchText}%" OR p.name LIKE "%${searchText}%") AND pt.id IS NOT NULL AND p.deleted_at IS NULL AND pbc.project_status IN ("${status.join('","')}") 
  ${billable !== "" ? `AND pbc.is_billable = ${billable}` : ''}
  ${tag_ids.length > 0 ? `AND t.id IN ("${tag_ids.join('","')}")` : ''}
  ${workspace_ids.length > 0 ? `AND w.id IN ("${workspace_ids.join('","')}")` : ''}
  ${userData.isAdmin ? `` : `AND (pw.id IS NULL OR w.is_active = 1)`} 
  GROUP BY
      p.id
  ORDER BY
    ${sortBy} ${orderBy} ${limit > 0 ? `LIMIT ${limit}` : ''} ${offset > 0 ? `OFFSET ${offset}` : ''}`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getProjectsCountAfterSerchBillingV2 = async (
    userData,
    searchText,
    tag_ids: number[],
    workspace_ids: number[],
    billable,
    status: string[]
  ) => {
    userData.isAdmin = false;
    return new Promise<object[]>((resolve, reject) => {
      const result = _DB.sequelize.query(
        `SELECT COUNT(DISTINCT p.id) AS total_count
  FROM
  tm_projects AS p
LEFT JOIN
  tm_project_team AS pt ON p.id = pt.project_id AND pt.user_id = ${userData.id} AND pt.deleted_at Is NULL
LEFT JOIN
  tm_project_tag AS ptags ON p.id = ptags.project_id AND ptags.deleted_at Is NULL
LEFT JOIN
  tm_tag  AS t ON ptags.tag_id = t.id AND t.deleted_at Is NULL
LEFT JOIN
  tm_project_workspace AS pw ON p.id = pw.project_id AND pw.deleted_at Is NULL
LEFT JOIN
  tm_workspace AS w ON pw.workspace_id = w.id AND w.deleted_at Is NULL
LEFT JOIN
  tm_biling_configurations  AS pbc ON p.id = pbc.project_id AND pbc.deleted_at Is NULL
  WHERE (t.title LIKE "%${searchText}%" OR p.name LIKE "%${searchText}%") AND ${`pbc.project_status IN ("${status.join('","')}")`}${billable !== "" ? `AND pbc.is_billable = ${billable}` : ''}${tag_ids.length > 0 ? `AND t.id IN ("${tag_ids.join('","')}")` : ''} ${workspace_ids.length > 0 ? `AND w.id IN ("${workspace_ids.join('","')}")` : ''
        }  ${userData.isAdmin ? `` : `AND (pw.id IS NULL OR w.is_active = 1)`} AND pt.user_id = ${userData.id} AND p.deleted_at IS NULL`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };
}

export default ProjectService;
