import _DB from '../../../database/models';
import { Query } from '@tms-workspace/apis-core';
import { Op, WhereOptions, Sequelize, QueryTypes } from 'sequelize';
import { iWorkspace } from '../../../database/interface/workspace.interface';
import { iTasks, iTaskLabel, iTasksObj, iTaskRunningStatus, iTaskRes } from './../../../database/interface/task.interface';
import UserService from '../../user/services/user.service';
import { iProject, iProjectSection,iProjectStatus, iProjectTeam } from '../../../database/interface/projects.interface';
import { TimeLogs } from '../../../database/models/task_time_logs.model';
import { Commits } from '../../../database/models/commits.model';
import TaskCommentsService from './task_comments.service';
import { Comments } from '../../../database/models/comments.model';
import { iCustomFields } from '../../../database/interface/custom_fields.interface';
import { TaskChangeLog } from '../../../database/models/task_change_log.model';
import userModel from '../../../database/models/user.model';

const _projects = _DB.Projects;
const _workspace = _DB.Workspace;
const _workspaceTeam = _DB.WorkspaceTeam;
const _projectWorkspace = _DB.ProjectWorkspace;
const _projectTeam = _DB.ProjectTeam;
const _customField=_DB.CustomFields;
const _project_status = _DB.ProjectStatus;
const _projectCustomFieldsMapping=_DB.ProjectCustomFieldsMapping;
const _projectBillingConfigration=_DB.ProjectBillingConfigration;
const _user = _DB.User;
const _tasks = _DB.Tasks;
const _tasksRunningStatus = _DB.TaskRunningStatus;
const _projectTaskSection=_DB.ProjectTaskSection;
const _tasks_labels = _DB.TaskLabel;
const _tasks_custom_field = _DB.TaskCustomFieldValue
const userService = new UserService();

class TaskService {

  public _addTaskStatus = async (taskData) => {
    return new Promise<iTaskRunningStatus>((resolve) => {
      const data = _tasksRunningStatus.findOrCreate({where: {
        user_id: taskData.user_id,
        task_id: taskData.task_id
      },
      defaults: {
        running_status: taskData.running_status
      }}).then(([record, created]) => {
        if (!created) {
          // Update the existing record
          return record.update({ running_status: taskData.running_status });
        }    
        return record;
      }).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });

      resolve(data);
    });
  };

  public _updateTaskStatus = async (taskData,query) => {
    return new Promise((resolve) => {
      const data = _tasksRunningStatus.update(taskData,{ where: query });
      resolve(data);
    });
  };

  public _getTaskStatus = async (query: WhereOptions) => {
    return new Promise<iTaskRunningStatus[]>((resolve) => {
      const data = _tasksRunningStatus
        .findAll({
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getTaskSingleStatus = async (query: WhereOptions) => {
    return new Promise<iTaskRunningStatus>((resolve) => {
      const data = _tasksRunningStatus
        .findOne({
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  // Workspace Dropdown
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
            required: false,
            include: [
              {
                as: 'project',
                model: _projects,
                attributes: ['id', 'name'],
                include:[{
                  as: 'projectTeam',
                  model: _projectTeam,
                  attributes: ['id'],
                  include: [
                    {
                      as: 'user',
                      model: _user,
                      attributes: ['id', 'first_name', 'last_name', 'employee_image'],
                    },
                  ],
                },{
                  as: 'projectBillingConfigration',
                  model: _projectBillingConfigration,
                  where:{project_status:{[Op.ne]:'closed'}},
                  attributes:['id','project_status']
                }]
              },
            ],
          },
        ],
      });
      resolve(data);
    });
  };

  public _getProjectStatusData = async (query: WhereOptions) => {
    return new Promise<iProjectStatus>((resolve, reject) => {
      const data: Promise<iProjectStatus> = _project_status
        .findOne({
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getProjectData = async (query: WhereOptions) => {
    return new Promise<iProject>((resolve) => {
      const data = _projects
        .findOne({
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getProjectTeam = async (query: WhereOptions) => {
    return new Promise<iProject[]>((resolve) => {
      const data = _projects
        .findAll({
          where: query,
          attributes: ['project_key'],
          include: [
            {
              as: 'projectTeam',
              model: _projectTeam,
              attributes: ['id', 'report_to', 'user_id'],
              include: [
                {
                  as: 'user',
                  model: _user,
                  attributes: ['id', 'first_name', 'last_name', 'employee_image'],
                },
              ],
            },
          ],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getProjectLabels = async (query: WhereOptions) => {
    return new Promise<iTaskLabel[]>((resolve) => {
      const data = _tasks_labels
        .findAll({
          where: query,
          order: [['created_at', 'DESC']],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getProjectLabelsWithFullData = async (query: WhereOptions) => {
    return new Promise<any[]>((resolve) => {
      const data = _projects
        .findAll({
          where: query,
          include: [
            {
              as:'projectLabel',
              model: _tasks_labels,
            }
          ],
          attributes: ['id', 'name'],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getLastTaskProjectData = async (query: WhereOptions) => {
    return new Promise<iTasks>((resolve) => {
      const data = _tasks
        .findOne({
          where: query,
          order: [['id', 'DESC']],
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _findOrCreateLabel = async (labelData) => {
    return new Promise<number>((resolve) => {
      const data = _tasks_labels
        .findOrCreate({
          where: { title: labelData.title,project_id: labelData.project_id,color:labelData.color },
          defaults: {
            project_id: labelData.project_id,
          },
        })
        .then((res) => {
          const re = JSON.parse(JSON.stringify(res[0]));
          return re.id;
        });

      resolve(data);
    });
  };

  public _createTasks = async (taskData) => {
    return new Promise<iTasks>((resolve) => {
      const data = _tasks.create(taskData).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });

      resolve(data);
    });
  };

  public _createTasksFields = (TaskCustomFieldValue) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const tasksPromises = TaskCustomFieldValue.map(async (custom_field) => {
        const [record, created] = await _tasks_custom_field.findOrCreate({
          where: {
            task_custom_field_id: custom_field.task_custom_field_id,
            task_id: custom_field.task_id,
          },
          defaults: {
            value: custom_field.value,
          },
        });
        if (!created) {
          // Update the existing record
          await record.update({ value: custom_field.value });
        }
  
        return JSON.parse(JSON.stringify(record));
      });
      const taskResults = await Promise.all(tasksPromises);
      resolve(taskResults);
    });
  };
  
  public _updateTasks = async (taskData,query) => {
    return new Promise((resolve) => {
      const data = _tasks.update(taskData,{ where: query });
      resolve(data);
    });
  };

  public _count = async (query: WhereOptions) => {
    return new Promise<number>((resolve, reject) => {
      const data = _tasks.count({
        where: query,
      });
      resolve(data);
    });
  };

  public _getAllTasks = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: Number(l),
      sortBy,
      orderBy,
    });
    return new Promise<iTasks[]>((resolve, reject) => {
      const data = _tasks.findAll({where: query,limit: limit > 0 ? limit : null,
        offset: offset > 0 ? offset : null,
        order,include: [
        {
          as: 'projects',
          model: _projects,
          attributes: ['id', 'name'],
        } , 
        {
          as: 'assigneeUser',
          model: _user,
          attributes:['id','first_name','last_name','employee_image'],
        } , 
        {
          as: 'TaskStatus',
          model: _project_status,
          attributes: ['id','title','color'],
        }
      ]});
      resolve(data);
    });
  };

  public _getAllCustomeFieldByProjectId = async (project_id:number) => {
    return new Promise<iCustomFields[]>((resolve, reject) => {
      const data = _customField.findAll({
        attributes: ['id', 'label'],
        // where:{is_required:1},
        include: [
          {
            as:'projectCustomFields',
            model: _projectCustomFieldsMapping,
            attributes: [],
            where: { project_id: project_id},
            required: true
          }
        ]
      });
      resolve(data);
    });
  };

  public _getTasksById = async (query: WhereOptions) => {
    return new Promise<iTaskRes>((resolve, reject) => {
      const data = _tasks.findOne({where:query,include:[{
        as: 'TaskCustomFieldValue',
        model: _tasks_custom_field,
        attributes:['id','task_custom_field_id','value','task_id'],
        include:[{
          as:'TaskCustomFieldLabelData',
          model:_customField,
          attributes:['id','label','fieldType']
        }]
      },
      {
        as:'TaskRunningStatus',
        model:_tasksRunningStatus,
      },
      {
        as:'TaskStatus',
        model:_project_status,
      },{
        as:'assigneeUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'assignedByUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'reportToUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'parentTask',
        model:_tasks,
        attributes:['id','title']
      },{
        as:'projects',
        model:_projects,
        attributes:['id','name']
      }
    ]});
      resolve(data);
    });
  };

  public _getTasksByUserId = async (query: WhereOptions) => {
    return new Promise<iTaskRes[]>((resolve, reject) => {
      const data = _tasks.findAll({where:query,include:[
      {
        as:'assigneeUser',
        model:_user,
        include:[
          {
            as:'team_lead_name',
            model:_user,
            attributes:['id','first_name','last_name']
          },
        ],
        attributes:['id','first_name','last_name','employee_id']
      },{
        as:'assignedByUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'reportToUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'projects',
        model:_projects,
        include:[
          {
            as:'projectWorkspace',
            model:_projectWorkspace
          },
        ],
        attributes:['id','name']
      }
    ]});
      resolve(data);
    });
  };

  public _getTasksList = async (user_id:number,project_ids:number[],
    filter_by_section:number,
    filter_by_labels:number[],
    filter_by_status:number,
    filter_by_state:string[],
    is_completed:boolean,
    is_unassigned:boolean,
    search:string,
    user_ids:number[],
    filter_by_from_date:string,
    filter_by_to_date:string,
    group_by:string,
    full_status:boolean,
    full_section:boolean,
    full_assignee:boolean,
    full_assigned_by:boolean,
    full_reporter:boolean,
    full_labels:boolean,
    full_subscribers:boolean,
    group_limit=3,
    limit,
    sort_by:string,
    order_by:string,
    dynamic_filter) => {
    return new Promise<object[]>((resolve, reject) => {
      console.log(user_ids,"P_D");
      
      let status_constrain = '';
      const working_users_constrain =`,CASE WHEN COUNT(trs.id) > 0 
      THEN CAST(CONCAT('[', GROUP_CONCAT(DISTINCT JSON_OBJECT('id', trs.id, 'user_id', trs.user_id,'running_status',trs.running_status,'updated_at',trs.updated_at)), ']')as JSON)
      ELSE JSON_ARRAY()
      END AS working_users`;
      let section_constrain = '';
      let project_constrain='';
      let state_constrain='';
      let assignee_constrain = '';
      let assigned_by_constrain = '';
      let reporter_constrain = '';
      let labels_constrain = '';
      let subscribers_constrain = '';
      let status_join = '';
      const working_users_join = `LEFT JOIN tm_tasks_running_status_mapping AS trs ON  t.id=trs.task_id`;
      let section_join = '';
      let assignee_join = '';
      let date_join = '';
      let assigned_by_join = '';
      let reporter_join = '';
      let labels_join = '';
      let subscribers_join = '';
      let where = '';
      let outer_where='';
      // const group_limit=3;
      // const limit=10;
      if(search&&search!==''){
        where += `t.title LIKE "%${search.replace(/"/g, '')}%"`;
      }else{
        where += `t.title LIKE "%${search.replace(/"/g, '')}%"`;
      }
      if (project_ids && project_ids.length > 0) {
        where += `AND t.project_id IN (${project_ids.join(',')}) `;
      }else{
        where += `AND t.project_id IN (-1) `;
      }
      if(filter_by_section&&filter_by_section!==null){
        if(filter_by_section===-1){
          where += ` AND t.section IS NULL`;
        }else{
          where += ` AND t.section = ${filter_by_section} `;
        }
      }
      if(filter_by_labels&&filter_by_labels!==null&&filter_by_labels.length>0){
        const placeholders = filter_by_labels.map(element =>`JSON_CONTAINS(t.labels, '${element}')`).join(' OR ');
        where += ` AND (${placeholders})`;
      }
      if(dynamic_filter&&dynamic_filter.length>0){
        let inner_whare='';
        for(const filter of dynamic_filter){
          if(filter[1]!=='labels'){
            if(Array.isArray(filter[3])){
              inner_whare += ` ${filter[0]} t.${filter[1]} ${filter[2]} (${filter[3].map(item => `"${item}"`).join(',')})`;
            }else{
              inner_whare += ` ${filter[0]} t.${filter[1]} ${filter[2]} ${filter[3]}`;
            }
          // inner_whare += ` ${filter[0]} t.${filter[1]} ${filter[2]} (${filter[3].map(item => `"${item}"`).join(',')})`;
        }else if(filter[1]==='labels'){
          if(filter[2]==='IN'){
          const placeholders = filter[3].map(element =>`JSON_CONTAINS(t.labels, '${element}')`).join(' OR ');
          inner_whare += ` ${filter[0]} (${placeholders})`;
          }else if(filter[2]==='NOT IN'){
          const placeholders = filter[3].map(element =>`NOT JSON_CONTAINS(t.labels, '${element}')`).join(' AND ');
          inner_whare += ` ${filter[0]} (${placeholders})`;
          }else if(filter[2]==='IS NULL'||filter[2]==='IS NOT NULL'){
            if(filter[2]==='IS NULL'){
              inner_whare += ` ${filter[0]} JSON_LENGTH(t.${filter[1]}) = 0`;
            }else if(filter[2]==='IS NOT NULL'){
              inner_whare += ` ${filter[0]} JSON_LENGTH(t.${filter[1]}) > 0`;
            }
          // inner_whare +=  ` ${filter[0]} t.${filter[1]} ${filter[2]}`;
          }
        }
        where += ` AND (${inner_whare})`;
        }
      }
      if (filter_by_status && filter_by_status !== null) {
        if(filter_by_status===-1){
          where += ` AND t.status IS NULL`;
        }else{
          where += ` AND t.status = ${filter_by_status} `;
        }
      }
      if (filter_by_state && filter_by_state.length > 0) {
        // where += is_completed?` AND (t.state = "${filter_by_state}" OR t.state = "completed")`:` AND t.state = "${filter_by_state}"`;
        where += ` AND t.state IN (${filter_by_state.map(item => `"${item}"`).join(',')})`;
      }else{
        // where += is_completed?'':` AND t.state != "completed" `;
        where += ``;
      }
      if (user_ids && user_ids.length > 0) {
        if(is_unassigned){
          if(user_ids&&user_ids.length===1&&user_ids[0]==null){
            where += ` AND (t.assignee IS NULL)`;
          }else{
          where += ` AND (t.assignee IN (${user_ids.join(',')}) OR t.assignee IS NULL)`;
          }
        }else{
          where += ` AND t.assignee IN (${user_ids.join(',')})`;
        }
        
        // outer_where=` (JSON_CONTAINS(tp.report_to, '${user_id}') OR tp.user_id=${user_id}) AND t.row_num <= ${group_limit}`
        outer_where=` t.row_num <= ${group_limit}`
      } else {
        // where += `assignee = ${user_id}`;
        // outer_where=` t.row_num <= ${group_limit}`
        // outer_where=` (JSON_CONTAINS(tp.report_to, '${user_id}') OR tp.user_id=${user_id}) AND t.row_num <= ${group_limit}`
        outer_where=` t.row_num <= ${group_limit}`

      }
      if (filter_by_from_date && filter_by_from_date !== '') {
        date_join = ` LEFT JOIN tm_tasks_running_status_mapping AS trsm ON  t.id=trsm.task_id`;
        where += ` AND (trsm.created_at >= "${filter_by_from_date}" OR t.created_at >= "${filter_by_from_date}" OR t.start_date >= "${filter_by_from_date}" OR t.due_date >= "${filter_by_from_date}")`;
      }
      if (filter_by_to_date && filter_by_to_date !== '') {
        if(date_join===''){
          date_join = ` LEFT JOIN tm_tasks_running_status_mapping AS trsm ON  t.id=trsm.task_id`;
        }
        where += ` AND (trsm.created_at <= "${filter_by_to_date}" OR t.created_at <= "${filter_by_to_date}" OR t.start_date <= "${filter_by_to_date}" OR t.due_date <= "${filter_by_to_date}")`;
      }
      if (full_status||group_by==='status') {
        status_constrain = `,CASE WHEN ts.id IS NOT NULL
        THEN JSON_OBJECT('id', ts.id, 'title', ts.title,'color',ts.color)
        ELSE JSON_OBJECT()
        END AS task_status
        ${group_by==='status'?`,
        CASE WHEN ts.id IS NOT NULL
        THEN ts.title
        ELSE '' END AS group_by`:''}`;
        status_join = ` LEFT JOIN tm_project_status AS ts ON  t.status=ts.id`;
      }
      if (full_section||group_by==='section') {
        section_constrain =`,CASE WHEN tse.id IS NOT NULL 
        THEN JSON_OBJECT('id', tse.id, 'title', tse.title)
        ELSE JSON_OBJECT()
        END AS task_section
        ${group_by==='section'?`,
        CASE WHEN tse.id IS NOT NULL
        THEN tse.title
        ELSE '' END AS group_by`:''}`;
        section_join = ` LEFT JOIN tm_tasks_sections AS tse ON  t.section=tse.id`;
      }
      if (group_by==='project_id') {
        project_constrain =`,CASE WHEN tpo.id IS NOT NULL
        THEN tpo.name
        ELSE '' END AS group_by`;
      }
      if (group_by==='state') {
        state_constrain =`,t.state AS group_by`;
      }
      if (full_assignee||group_by==='assignee') {
        assignee_constrain = `,CASE WHEN ta.id IS NOT NULL 
        THEN JSON_OBJECT('id', ta.id, 'first_name', ta.first_name,'last_name',ta.last_name,'avatar',ta.employee_image,'login_capture_data', (
          SELECT login_capture_data
          FROM tm_user_logs
          WHERE user_id = ta.id
              AND DATE(action_start_date) = CURDATE() AND action = 'LOGIN'
              ORDER BY action_start_date DESC
          LIMIT 1 
      ))
        ELSE JSON_OBJECT() END AS task_assignee
        ${group_by==='assignee'?`,
        CASE WHEN ta.id IS NOT NULL
        THEN CONCAT(ta.first_name, ' ', ta.last_name,'_',ta.id)
        ELSE '' END AS group_by`:''}`;
        assignee_join = ` LEFT JOIN tm_users AS ta ON  t.assignee=ta.id`;
      }
      if (full_assigned_by) {
        assigned_by_constrain = `,CASE WHEN tab.id IS NOT NULL 
        THEN JSON_OBJECT('id', tab.id, 'first_name', tab.first_name,'last_name',tab.last_name,'avatar',tab.employee_image)
        ELSE JSON_OBJECT()
        END AS task_assigned_by`;
        assigned_by_join = ` LEFT JOIN tm_users AS tab ON  t.assigned_by=tab.id`;
      }
      if (full_reporter) {
        reporter_constrain = `,CASE WHEN tr.id IS NOT NULL 
        THEN JSON_OBJECT('id', tr.id, 'first_name', tr.first_name,'last_name',tr.last_name,'avatar',tr.employee_image)
        ELSE JSON_OBJECT()
        END AS task_assigned_by`;
        reporter_join = ` LEFT JOIN tm_users AS tr ON  t.reporter=tr.id`;
      }
      if (full_labels) {
        labels_constrain = `,CASE
        WHEN COUNT(l.id) > 0 THEN CAST(CONCAT('[', GROUP_CONCAT(DISTINCT JSON_OBJECT('id', l.id, 'title', l.title, 'color', l.color, 'project_id', l.project_id)), ']') AS JSON)
        ELSE JSON_ARRAY()
      END AS task_labels`;
        // THEN JSON_ARRAYAGG(JSON_OBJECT('id', l.id, 'title', l.title,'color',l.color,'project_id',l.project_id))
        labels_join = ` LEFT JOIN tm_task_labels AS l ON JSON_CONTAINS(t.labels, CAST(l.id AS JSON))`;
      }
      if (full_subscribers) {
        subscribers_constrain = `,CASE WHEN COUNT(s.id) > 0 
        THEN JSON_ARRAYAGG(JSON_OBJECT('id', s.id, 'first_name', s.first_name,'last_name',s.last_name,'avatar',s.employee_image))
        ELSE JSON_ARRAY()
        END AS task_subscribers`;
        subscribers_join = ` LEFT JOIN tm_users AS s ON JSON_CONTAINS(t.subscribers, CAST(s.id AS JSON))`;
      }
      // const result =_DB.sequelize.query(
      //   `SELECT t.*,COUNT(t.id) OVER() AS total_task_all,tpo.name AS project_name${state_constrain}${project_constrain}${status_constrain}${section_constrain}${assignee_constrain}${assigned_by_constrain}${reporter_constrain}${labels_constrain}${subscribers_constrain} FROM(
      //     SELECT t.*,
      //         ROW_NUMBER() OVER (PARTITION BY t.${group_by||'id'}${group_by?`,(JSON_CONTAINS(tt.report_to, "${user_id}") OR tt.user_id = ${user_id})`:''} ORDER BY t.id) AS row_num${group_by?`,COUNT(*) OVER (PARTITION BY t.${group_by||'id'}, (JSON_CONTAINS(tt.report_to, '${user_id}') OR tt.user_id = ${user_id})) AS total_task`:''}
      //     FROM tm_tasks AS t ${group_by?`JOIN tm_project_team tt ON t.assignee = tt.user_id AND t.project_id = tt.project_id`:''}
      //     WHERE ${where} ORDER BY t.${sort_by||'id'} ${order_by||'DESC'} 
      // ) t JOIN tm_project_team tp ON t.assignee = tp.user_id AND t.project_id = tp.project_id LEFT JOIN tm_projects AS tpo ON  t.project_id=tpo.id ${status_join}${section_join}${assignee_join}${assigned_by_join}${reporter_join}${labels_join}${subscribers_join} WHERE ${outer_where} GROUP BY t.id ORDER BY t.${sort_by||'id'} ${order_by||'DESC'} ${group_by===''&&limit?`LIMIT ${limit}`:''}`,
      //   { type: QueryTypes.SELECT }
      // );
      // const result =_DB.sequelize.query(
      //   `SELECT t.*,COUNT(t.id) OVER() AS total_task_all,tpo.name AS project_name${working_users_constrain}${state_constrain}${project_constrain}${status_constrain}${section_constrain}${assignee_constrain}${assigned_by_constrain}${reporter_constrain}${labels_constrain}${subscribers_constrain} FROM(
      //     SELECT t.*,
      //         ROW_NUMBER() OVER (PARTITION BY t.${group_by||'id'} ORDER BY t.id) AS row_num${group_by?`,COUNT(*) OVER (PARTITION BY t.${group_by||'id'}) AS total_task`:''}
      //     FROM tm_tasks AS t ${group_by?`JOIN tm_project_team tt ON t.assignee = tt.user_id AND t.project_id = tt.project_id`:''}
      //     WHERE ${where} GROUP BY t.id ORDER BY t.${sort_by||'id'} ${order_by||'DESC'} 
      // ) t JOIN tm_project_team tp ON t.assignee = tp.user_id AND t.project_id = tp.project_id LEFT JOIN tm_projects AS tpo ON  t.project_id=tpo.id ${working_users_join}${status_join}${section_join}${assignee_join}${assigned_by_join}${reporter_join}${labels_join}${subscribers_join} WHERE ${outer_where} GROUP BY t.id ORDER BY t.${sort_by||'id'} ${order_by||'DESC'} ${group_by===''&&limit?`LIMIT ${limit}`:''}`,
      //   { type: QueryTypes.SELECT }
      // );

      // const result =_DB.sequelize.query(
      //   `SELECT t.*,COUNT(t.id) OVER() AS total_task_all,tpo.name AS project_name${working_users_constrain}${state_constrain}${project_constrain}${status_constrain}${section_constrain}${assignee_constrain}${assigned_by_constrain}${reporter_constrain}${labels_constrain}${subscribers_constrain} FROM(
      //     SELECT t.*,
      //         ROW_NUMBER() OVER (PARTITION BY t.${group_by||'id'} ORDER BY t.id) AS row_num${group_by?`,COUNT(*) OVER (PARTITION BY t.${group_by||'id'}) AS total_task`:''}
      //     FROM tm_tasks AS t ${group_by=='assignee'?`JOIN tm_project_team tt ON t.assignee = tt.user_id AND t.project_id = tt.project_id`:''}
      //     WHERE ${where} GROUP BY t.id ORDER BY t.${sort_by||'running_status'} ${order_by||'DESC'} 
      // ) t JOIN tm_projects AS tpo ON  t.project_id=tpo.id ${working_users_join}${status_join}${section_join}${assignee_join}${assigned_by_join}${reporter_join}${labels_join}${subscribers_join} WHERE ${outer_where} GROUP BY t.id ORDER BY t.${sort_by||'running_status'} ${order_by||'DESC'} ${group_by===''&&limit?`LIMIT ${limit}`:''}`,
      //   { type: QueryTypes.SELECT }
      // );
      const result =_DB.sequelize.query(
        `SELECT t.*,COUNT(t.id) OVER() AS total_task_all,tpo.name AS project_name${working_users_constrain}${state_constrain}${project_constrain}${status_constrain}${section_constrain}${assignee_constrain}${assigned_by_constrain}${reporter_constrain}${labels_constrain}${subscribers_constrain} FROM(
          SELECT t.*,
              ROW_NUMBER() OVER (PARTITION BY t.${group_by||'id'} ORDER BY t.updated_at DESC) AS row_num${group_by?`,COUNT(*) OVER (PARTITION BY t.${group_by||'id'}) AS total_task`:''}
          FROM tm_tasks AS t ${date_join}
          WHERE ${where} GROUP BY t.id ORDER BY t.${sort_by||'running_status'} ${order_by||'DESC'} 
      ) t JOIN tm_projects AS tpo ON  t.project_id=tpo.id ${working_users_join}${status_join}${section_join}${assignee_join}${assigned_by_join}${reporter_join}${labels_join}${subscribers_join}${outer_where&&outer_where!==''?`WHERE ${outer_where}`:''} GROUP BY t.id ORDER BY
      CASE
          WHEN t.running_status = 'Ongoing' THEN 1
          ELSE 2
      END,t.updated_at DESC ${group_by===''&&limit?`LIMIT ${limit}`:''}`,
        { type: QueryTypes.SELECT }
      );
      resolve(result);
    });
  };

  public _getWorkSpacePermission = async (id: number, operation: string) => {
    return new Promise((resolve) => {
      userService._getUserRole(id).then((data) => {
        data = JSON.parse(JSON.stringify(data));

        let permission = data.user_role?.permission && JSON.parse(JSON.stringify(data.user_role.permission));
        permission = permission && permission.find((el) => el.workspace)?.actions;
        permission = permission && permission.find((el) => el[operation])?.fields;
        resolve(permission || {});
      });
    });
  };

  public _getTaskPermission = async (id: number, operation: string) => {
    return new Promise((resolve) => {
      userService._getUserRole(id).then((data) => {
        data = JSON.parse(JSON.stringify(data));

        let permission = data.user_role?.permission && JSON.parse(JSON.stringify(data.user_role.permission));
        permission = permission && permission.find((el) => el.task)?.actions;
        permission = permission && permission.find((el) => el[operation])?.fields;
        resolve(permission || {});
      });
    });
  };

  // GET All Task Activity
  public _getAllActivity = async (p = 0, l = 0, sortBy = 'id', orderBy = 'asc', query) => {
    const { offset, limit } = Query.getQuery({
      page: p,
      limit: Number(l),
      sortBy,
      orderBy,
    });
    const sortObj = {};
    sortObj[sortBy || 'created_at'] = orderBy === 'desc' ? -1 : 1;
    return new Promise((resolve) => {
      const data = Comments.aggregate([
        {
          $match: query,
        },
        {
          $unionWith: {
            coll: 'tm_task_time_logs',
            pipeline: [
              {
                $match: query,
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: 'tm_task_commits',
            pipeline: [
              {
                $match: query,
              },
            ],
          },
        },
        {
          $sort: sortObj,
        },
        {
          $skip: offset,
        },
        {
          $limit: limit,
        },
      ]);
      resolve(data);
    });
  };

  // GET Count Task Activity
  public _ActivityCount = async (query) => {
    return new Promise((resolve, reject) => {
      const data = Comments.aggregate([
        {
          $match: query,
        },
        {
          $unionWith: {
            coll: 'tm_task_time_logs',
            pipeline: [
              {
                $match: query,
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: 'tm_task_commits',
            pipeline: [
              {
                $match: query,
              },
            ],
          },
        },
        {
          $count: 'count',
        },
      ]);
      resolve(data);
    });
  };

  // Task Change log
  public _ChangeLogCount = async (query) => {
    return new Promise<number>((resolve, reject) => {
      const data = TaskChangeLog.count(query);
      resolve(data);
    });
  };

  public _getAllChangeLog = async (p = 0, l = 0, sortBy = 'id', orderBy = 'asc', query) => {
    const { offset, limit } = Query.getQuery({
      page: p,
      limit: Number(l),
      sortBy,
      orderBy,
    });
    const sortObj = {};
    sortObj[sortBy || 'id'] = orderBy === 'asc' ? 1 : -1;
    return new Promise((resolve, reject) => {
      // console.log(query,"PD_0");
      const data = TaskChangeLog.find(query).limit(Number(limit)).skip(Number(offset)).sort(sortObj);
      resolve(data);
    });
  };

// Task Project Section
public _createTaskSection = async (sectionData) => {
  return new Promise<iProjectSection>((resolve) => {
    const data = _projectTaskSection.create(sectionData).then((res) => {
      return JSON.parse(JSON.stringify(res));
    });

    resolve(data);
  });
};

  public _updateTaskSection = async (sectionData,query) => {
    return new Promise((resolve) => {
      const data = _projectTaskSection.update(sectionData,{ where: query });
      resolve(data);
    });
  };

  public _getTaskSection = async (query) => {
    return new Promise<iProjectSection[]>((resolve) => {
      const data = _projectTaskSection.findAll({ where: query });
      resolve(data);
    });
  };

  public _getAllTasksData = async (query: WhereOptions = {}) => {
    return new Promise<iTasks[]>((resolve, reject) => {
      const data = _tasks.findAll({where: query,
        include: [
        {
          as: 'projects',
          model: _projects,
          attributes: ['id', 'name'],
        }
      ]});
      resolve(data);
    });
  };

  public _deleteTaskSection = async (query) => {
    return new Promise((resolve) => {
      const data = _projectTaskSection.destroy({ where: query });
      resolve(data);
    });
  };

  public _arraysEqual = <T>(arr1: T[], arr2: T[]): boolean => {
    if (arr1.length !== arr2.length) {
      return false;
    }
  
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
  
    return true;
  };

  public _formatStatus=(status)=> {
    switch (status.toLowerCase()) {
      case 'inprogress':
        return 'In Progress';
      case 'todo':
        return 'To Do';
      case 'onhold':
        return 'On Hold';
      case 'completed':
        return 'Completed';
      default:
        return 'Invalid Status';
    }
  }

  public _findStatusName=async({val1,val2})=> {
    let label1=await this._getProjectStatusData({id:val1});
    let label2=await this._getProjectStatusData({id:val2});
    if(label1){
      label1=JSON.parse(JSON.stringify(label1));
    }
    if(label2){
      label2=JSON.parse(JSON.stringify(label2));
    }
    return {
      label1:label1.title||'',
      label2:label2.title||''
    }
  }

  public _compareObjects =<T extends Record<string, unknown>>(
    obj1: T,
    obj2: T = {} as T
  ): Array<{ key: keyof T; oldValue: unknown; newValue: unknown }> => {
    const differentFields: Array<{ key: keyof T; oldValue: unknown; newValue: unknown }> = [];
    for (const key in obj2) {
      if(key==='assigneeUser'||key==='assignedByUser'||key==='reportToUser'||key==='TaskCustomFieldValue'||key==='task_key_prefix'||key==='task_unique_key'||key==='updated_by'||key==='parent_task_id'||key==='parent_task_title'||key==='taskIds'||key === 'state'||(key === 'deletedDocuments'&&(!obj1['deletedDocuments']||!obj2['deletedDocuments']))){
        console.log(obj1[key],"ddd_111",obj2[key]);
        console.log(key,"key");
        
        if(key==='TaskCustomFieldValue'){
          console.log(key,"key_enter");
          const value1: object[] = obj1[key] as object[];
          const value2: object[] = obj2[key] as object[];
          for (const custom_field of value1) {    
            let newValue = value2.find(
              (e) => e['task_custom_field_id'] == custom_field['task_custom_field_id']
            )
            if(newValue&&(newValue['type'] == 'dropdown'||newValue['type'] == 'radio-btn')){
              if(custom_field['value']!=newValue['value']){
                const letest=newValue?newValue['select_value']:''
                differentFields.push({
                  key: custom_field['TaskCustomFieldLabelData']['label'],
                  oldValue: newValue['options']?.find((e)=>e.id==custom_field['value'])?.value,
                  newValue: letest,
                }); 
              }
            }else{
              newValue=newValue?newValue['value']:'';
              if(custom_field['value']!=newValue){
                differentFields.push({
                  key: custom_field['TaskCustomFieldLabelData']['label'],
                  oldValue: custom_field['value'],
                  newValue: newValue,
                }); 
              }
            }
          
          }
        }

      }else{
        console.log(key,obj1[key],"ddd_111__999",obj2[key]);
        
      if (Object.prototype.hasOwnProperty.call(obj1, key)||Object.prototype.hasOwnProperty.call(obj2, key)) {
        const value1 = obj1[key];
        const value2 = obj2[key];
  
        if (Array.isArray(value1) && Array.isArray(value2)) {
          if (!this._arraysEqual(value1, value2)) {
            differentFields.push({ key, oldValue: value1, newValue: value2 });
          }
        } else if (
          typeof value1 === 'object' &&
          typeof value2 === 'object' &&
          value1 !== null &&
          value2 !== null
        ) {
          if (!this._compareObjects(value1 as Record<string, unknown>, value2 as Record<string, unknown>).length) {    
            differentFields.push({ key, oldValue: value1, newValue: value2 });
          }
        } else if (String(value1).toLowerCase() != String(value2).toLowerCase()) {
          if (key === 'assignee') {
            if (obj2.assigneeUser && typeof obj2.assigneeUser === 'string') {
              const parsedAssigneeUser = JSON.parse(obj2.assigneeUser);
              if (parsedAssigneeUser) {
                differentFields.push({
                  key,
                  oldValue: obj1?.assigneeUser?`${obj1?.assigneeUser['first_name']} ${obj1?.assigneeUser['last_name']}`:null,
                  newValue: `${parsedAssigneeUser['first_name']} ${parsedAssigneeUser['last_name']}`,
                });
              }else if(obj1&&obj1.assigneeUser&&obj1.assigneeUser['first_name']){
                differentFields.push({
                  key:'assignee',
                  oldValue: obj1?.assigneeUser?`${obj1?.assigneeUser['first_name']} ${obj1?.assigneeUser['last_name']}`:null,
                  newValue: null,
                });
              }
            }else{
              differentFields.push({ key, oldValue: value1, newValue: value2 });
            }
          } else if (key === 'assigned_by') {
            if (obj2.assignedByUser && typeof obj2.assignedByUser === 'string') {
              const parsedAssignedByUser = JSON.parse(obj2.assignedByUser);
              if (parsedAssignedByUser) {
                differentFields.push({
                  key,
                  oldValue: obj1?.assignedByUser?`${obj1?.assignedByUser['first_name']} ${obj1?.assignedByUser['last_name']}`:null,
                  newValue: `${parsedAssignedByUser['first_name']} ${parsedAssignedByUser['last_name']}`,
                });
              }else if(obj1&&obj1.assignedByUser&&obj1.assignedByUser['first_name']){
                differentFields.push({
                  key:'assigned_by',
                  oldValue: obj1?.assignedByUser?`${obj1?.assignedByUser['first_name']} ${obj1?.assignedByUser['last_name']}`:null,
                  newValue: null,
                });
              }
            }
          } else if (key === 'reporter') {
            if (obj2.reportToUser && typeof obj2.reportToUser === 'string') {
              const parsedReportToUser = JSON.parse(obj2.reportToUser);
              if (parsedReportToUser) {
                differentFields.push({
                  key:'report_to',
                  oldValue: obj1?.reportToUser?`${obj1?.reportToUser['first_name']} ${obj1?.reportToUser['last_name']}`:null,
                  newValue: `${parsedReportToUser['first_name']} ${parsedReportToUser['last_name']}`,
                });
              }else if(obj1&&obj1.reportToUser&&obj1.reportToUser['first_name']){
                differentFields.push({
                  key:'report_to',
                  oldValue: obj1?.reportToUser?`${obj1?.reportToUser['first_name']} ${obj1?.reportToUser['last_name']}`:null,
                  newValue: null,
                });
              }
            }
          } else if (key === 'state') {
            differentFields.push({ key, oldValue: this._formatStatus(value1), newValue: this._formatStatus(value2) });
          }
          // else if (key === 'status') {
          //   let status=this._findStatusName(value1,value2);
          //   differentFields.push({ key, oldValue: status?.label1||'', newValue: status?.label2||'' });
          // }
          else {
            differentFields.push({ key, oldValue: value1, newValue: value2 });
          }
        }
      }
    }
    }
  
    return differentFields;
  };
  
  public _checkKeyExists = async(array, key)=>{
    for (let i = 0; i < array.length; i++) {
      // if (key in array[i]) {
        if(array[i].key === key){
          return true
        }
    }
    return false;
  }


  public _getDashboardTaskList = async (query) => {
    return new Promise((resolve, reject) => {
      const assigneeIdsCondition = query?.assigneeIds?.length > 0 ? `AND ${query.is_assigned_by?'t.assigned_by':'t.assignee'} IN (:assigneeIds)` : '';

      const queryText = !query.user.isAdmin?`
        SELECT
            subquery.${query.is_assigned_by?'assigned_by':'assignee'},
            subquery.id,
            subquery.parent_task_id,
            subquery.project_id,
            p.name AS project_name,
            subquery.type,
            subquery.title,
            subquery.description,
            subquery.state,
            subquery.status,
            subquery.assigned_by,
            subquery.reporter,
            subquery.labels,
            subquery.start_date,
            subquery.due_date,
            subquery.priority,
            subquery.running_status,
            subquery.eta,
            subquery.created_by,
            subquery.updated_by,
            subquery.deleted_at,
            subquery.created_at,
            subquery.updated_at,
            subquery.subscribers,
            subquery.documents,
            subquery.section,
            subquery.task_key_prefix,
            subquery.task_unique_key,
            subquery.task_key,
            subquery.total_worked_hours,
            subquery.row_num,
            working_users.id AS working_user_id,
            working_users.first_name AS working_user_first_name,
            working_users.last_name AS working_user_last_name,
            working_users.employee_image AS working_user_avatar,
            working_users.updated_at AS working_user_updated_at,
            working_users.running_status AS working_user_running_status,
            u.first_name AS assignee_first_name,
            u.last_name AS assignee_last_name
        FROM (
            SELECT t.*,
                ROW_NUMBER() OVER (PARTITION BY ${query.is_assigned_by?'t.assigned_by':'t.assignee'} ORDER BY t.id) AS row_num
            FROM tm_tasks t
            JOIN (
                SELECT DISTINCT user_id
                FROM tm_project_team
                WHERE JSON_CONTAINS(report_to, :userId)
            ) AS u ON ${query.is_assigned_by?'t.assigned_by':'t.assignee'} = u.user_id
            WHERE t.state = :state
            AND t.project_id IN (:projectIds)
            ${assigneeIdsCondition}
        ) AS subquery
        JOIN tm_users u ON subquery.${query.is_assigned_by?'assigned_by':'assignee'} = u.id
        LEFT JOIN tm_projects p ON subquery.project_id = p.id 
        LEFT JOIN (
            SELECT
                trsm.task_id,
                tu.id,
                tu.first_name,
                tu.last_name,
                tu.employee_image,
                trsm.updated_at,
                trsm.running_status
            FROM tm_tasks_running_status_mapping trsm
            JOIN tm_users tu ON trsm.user_id = tu.id
        ) AS working_users ON subquery.id = working_users.task_id
        WHERE subquery.row_num <= ${query.group_limit||11}
        ORDER BY
        CASE
            WHEN subquery.running_status = 'Ongoing' THEN 1
            WHEN subquery.running_status = 'Stop' THEN 2
            ELSE 3
        END;
      `:`
      SELECT
          subquery.${query.is_assigned_by?'assigned_by':'assignee'},
          subquery.id,
          subquery.parent_task_id,
          subquery.project_id,
          p.name AS project_name,
          subquery.type,
          subquery.title,
          subquery.description,
          subquery.state,
          subquery.status,
          subquery.assigned_by,
          subquery.reporter,
          subquery.labels,
          subquery.start_date,
          subquery.due_date,
          subquery.priority,
          subquery.running_status,
          subquery.eta,
          subquery.created_by,
          subquery.updated_by,
          subquery.deleted_at,
          subquery.created_at,
          subquery.updated_at,
          subquery.subscribers,
          subquery.documents,
          subquery.section,
          subquery.task_key_prefix,
          subquery.task_unique_key,
          subquery.task_key,
          subquery.total_worked_hours,
          subquery.row_num,
          working_users.id AS working_user_id,
          working_users.first_name AS working_user_first_name,
          working_users.last_name AS working_user_last_name,
          working_users.employee_image AS working_user_avatar,
          working_users.updated_at AS working_user_updated_at,
          working_users.running_status AS working_user_running_status,
          u.first_name AS assignee_first_name,
          u.last_name AS assignee_last_name
      FROM (
          SELECT t.*,
              ROW_NUMBER() OVER (PARTITION BY ${query.is_assigned_by?'t.assigned_by':'t.assignee'} ORDER BY t.id) AS row_num
          FROM tm_tasks t
          WHERE t.state = :state
          AND t.project_id IN (:projectIds)
          ${assigneeIdsCondition}
      ) AS subquery
      JOIN tm_users u ON (subquery.${query.is_assigned_by?'assigned_by':'assignee'} = u.id AND u.id != :userId)
      LEFT JOIN tm_projects p ON subquery.project_id = p.id 
      LEFT JOIN (
          SELECT
              trsm.task_id,
              tu.id,
              tu.first_name,
              tu.last_name,
              tu.employee_image,
              trsm.updated_at,
              trsm.running_status
          FROM tm_tasks_running_status_mapping trsm
          JOIN tm_users tu ON trsm.user_id = tu.id
      ) AS working_users ON subquery.id = working_users.task_id
      WHERE subquery.row_num <= ${query.group_limit||11}
      ORDER BY
      CASE
          WHEN subquery.running_status = 'Ongoing' THEN 1
          WHEN subquery.running_status = 'Stop' THEN 2
          ELSE 3
      END;
    `;

      const replacements = {
        userId: JSON.stringify(query.user_id),
        state: query.state,
        projectIds: query.project_ids.length > 0 ? query.project_ids : '',
        assigneeIds : query.assigneeIds && query.assigneeIds.length > 0 ? query.assigneeIds : ''
      };
    
      _DB.sequelize
        .query(queryText, {
          replacements,
          type: QueryTypes.SELECT,
        })
        .then((tasks) => {
          resolve(tasks);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  public _assigneeDropDown = async (query) => {
    return new Promise((resolve, reject) => {
      const queryText = query.user.isAdmin?
      `
      SELECT id, first_name, last_name
      FROM tm_users
      WHERE id IN (
          SELECT DISTINCT assignee
          FROM tm_tasks
          WHERE project_id IN (:projectIds)
     )
     ORDER BY first_name, last_name;
    ` :
    `
      SELECT tu.id, tu.first_name, tu.last_name
      from tm_users tu WHERE id in (
        SELECT DISTINCT user_id
        from tm_project_team tpt
        WHERE JSON_CONTAINS(tpt.report_to, :userId)
        AND tpt.project_id IN  (:projectIds)
      )
      order by tu.first_name , tu.last_name;
    `;

      const replacements = {
        projectIds: query.project_ids.length > 0 ? query.project_ids : '',
        userId: query.user_id ? '' + query.user_id : ''
      };
  
      _DB.sequelize
        .query(queryText, {
          replacements,
          type: QueryTypes.SELECT,
        })
        .then((tasks) => {
          resolve(tasks);
        })
        .catch((error) => {
          reject(error);
        });
    });
    
  }
  
//   AND t.project_id IN (
//     SELECT project_id
//     from tm_project_team tpt 
//     WHERE JSON_CONTAINS(report_to, '${query.user_id}')
//  )

  public _convertToYYYYMMDD(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  public _convertToDDMMYYYY(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return day + '-' + month + '-' + year;
  }

  public _convertToDDMMYYYYNew(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return day + '/' + month + '/' + year;
  }

  public _timeToMinutes(timeString) {
    console.log(timeString,"P_0");
    if(timeString==null){
      return 0;
    }else{
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
    }
  } 

  public _convertTimeToMinutes(timeString) {
    const hoursRegex = /(\d+)h/;
    const minutesRegex = /(\d+)m/;
    let totalMinutes = 0;
    const hoursMatch = timeString.match(hoursRegex);
    const minutesMatch = timeString.match(minutesRegex);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10);
      totalMinutes += hours * 60;
    }
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1], 10);
      totalMinutes += minutes;
    }
    return totalMinutes;
  }

  // Helper function to convert minutes to time in "hh:mm:ss" format
  public _minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const remainingSeconds = Math.round((minutes - Math.floor(minutes)) * 60);
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  public _countPendingTime(eta,working_time) {
    
    // Convert ETA and working hours to minutes
    const etaMinutes = this._convertTimeToMinutes(eta);
    const workingMinutes = this._timeToMinutes(working_time);

    // Calculate pending minutes
    const pendingMinutes = etaMinutes - workingMinutes;
  
    if (pendingMinutes <= 0) {
      return "00:00:00";
    }
  
    // Convert pending minutes to "hh:mm:ss" format
    return this._minutesToTime(pendingMinutes);
  }

  public _getProjectTeamById = async (query) => {
    return new Promise<iProjectTeam>((resolve) => {
      const data = _projectTeam.findOne({ where: query });
      resolve(data);
    });
  };

  public _getSingleTasks = async (query: WhereOptions) => {
    return new Promise<iTaskRes>((resolve, reject) => {
      const data = _tasks.findOne({where:query,include:[{
        as:'assigneeUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'assignedByUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'reportToUser',
        model:_user,
        attributes:['id','first_name','last_name']
      }
    ]});
      resolve(data);
    });
  };

  // get all task by parent id 
  public _getAllTaskByParentId = async (query) => {
    return new Promise<iTaskRes[]>((resolve, reject) => {
      const data = _tasks.findAll({where:query,include:[{
        as:'assigneeUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'assignedByUser',
        model:_user,
        attributes:['id','first_name','last_name']
      },{
        as:'reportToUser',
        model:_user,
        attributes:['id','first_name','last_name']
      }
    ]});
      resolve(data);
    });
  }

}



export default TaskService;
