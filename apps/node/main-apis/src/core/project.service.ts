import { Query } from '@tms-workspace/apis-core';
import { Op, WhereOptions, Sequelize } from 'sequelize';
import { iProject, iProjectBillingConfigration, iProjectTeam, iProjectWorkspace } from '../app/database/interface/projects.interface';
import { iWorkspace } from '../app/database/interface/workspace.interface';
import _DB from '../app/database/models';


const _projectbillingconfigrations = _DB.ProjectBillingConfigration;
const _project_status=_DB.ProjectStatus;
const _projects = _DB.Projects;
const _projectsTeam = _DB.ProjectTeam;
const _workspace = _DB.Workspace;
const _projectWorkspace = _DB.ProjectWorkspace;
const _projectWorkspaceTeam = _DB.WorkspaceTeam;
class BillingConfigrationService {
  public _createProjectStatus = async (data:iProjectBillingConfigration) => {
    return new Promise<iProjectBillingConfigration>((resolve) => {
      const result = _projectbillingconfigrations.create(data);
      resolve(result);
    });
  };
  public _updateProjectStatus = async (query:WhereOptions,data:iProjectBillingConfigration) => {
    return new Promise((resolve) => {
      const result = _projectbillingconfigrations.update(data,{
        where: query,
      });
      resolve(result);
    });
  };
  public _createProjectStatusData = async (projectStatusData: object) => {
    return new Promise((resolve, reject) => {
      const data = _project_status.create(projectStatusData);
      resolve(data);
    });
  };
  public _getProjects = async (query: WhereOptions) => {
    return new Promise<iProject[]>((resolve, reject) => {
      const data = _projects.findAll({
        include: [
          {
            as: 'projectWorkspace',
            model: _projectWorkspace,
            attributes: ['id'],
            where: query,
          },
        ],
      });
      resolve(data);
    });
  };

  public _getAllProjects = async () => {
    return new Promise<iProject[]>((resolve, reject) => {
      const data = _projects.findAll();
      resolve(data);
    });
  };

  public _getAllWorkspaces = async () => {
    return new Promise<iWorkspace[]>((resolve, reject) => {
      const data = _workspace.findAll();
      resolve(data);
    });
  };
  
  public _getProjectTeam = async (query: WhereOptions) => {
    return new Promise<iProjectTeam>((resolve, reject) => {
      const data = _projectsTeam.findOne({where: query});
      resolve(data);
    });
  };

  public _createProjectTeam = async (Team) => {
    return new Promise(async(resolve, reject) => {
      for (const teamMember of Team) {
        const existingTeamMember = await _projectsTeam.findOne({
          where: {
            user_id: teamMember.user_id,
            project_id: teamMember.project_id,
          },
        });

        if (!existingTeamMember) {
          await _projectsTeam.create(teamMember);
        }
      }

      resolve("Success");
    });
  };

  public _createWorkspaceTeam = async (Team) => {
    return new Promise(async(resolve, reject) => {
      for (const teamMember of Team) {
        const existingTeamMember = await _projectWorkspaceTeam.findOne({
          where: {
            user_id: teamMember.user_id,
            workspace_id: teamMember.workspace_id,
          },
        });

        if (!existingTeamMember) {
          await _projectWorkspaceTeam.create(teamMember);
        }
      }

      resolve("Success");
    });
  };
  
  
}

export default BillingConfigrationService;