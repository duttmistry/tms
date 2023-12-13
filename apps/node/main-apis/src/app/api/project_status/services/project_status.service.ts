import { Query } from '@tms-workspace/apis-core';
import { Op, WhereOptions, Sequelize } from 'sequelize';
import { iProjectStatus } from '../../../database/interface/projects.interface';
import UserService from '../../user/services/user.service';
import ProjectService from '../../project/services/project.service';
import _DB from '../../../database/models';

const _projects = _DB.Projects;
const _project_status = _DB.ProjectStatus;
const _user = _DB.User;

const userService = new UserService();

class ProjectStatusService {
  // GET ALL DATA
  public _getProjectStatusData = async (query: WhereOptions) => {
    return new Promise((resolve, reject) => {
      const data: Promise<iProjectStatus[]> = _project_status
        .findAll({
          where: query,
        })
        .then((res) => {
          return JSON.parse(JSON.stringify(res));
        });
      resolve(data);
    });
  };

  public _getSingleProjectStatusData = async (query: WhereOptions) => {
    return new Promise((resolve, reject) => {
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

  public _getSingleProjectStatusColorData = async (query: WhereOptions) => {
    return new Promise<iProjectStatus>((resolve) => {
      const data = _project_status
      .findOne({
        where: query,
      })
      resolve(data);
    });
  };
  public _createProjectStatusData = async (projectStatusData: object) => {
    return new Promise((resolve, reject) => {
      const data = _project_status.create(projectStatusData);
      resolve(data);
    });
  };

  public _updateProjectStatusData = async (projectStatusData: iProjectStatus) => {
    return new Promise((resolve, reject) => {
      const data = _project_status.update(projectStatusData, {
        where: { id: projectStatusData.id },
      });
      resolve(data);
    });
  };

  public _updateProjectStatusColorData = async (projectStatusData,query) => {
    return new Promise((resolve, reject) => {
      const data = _project_status.update(projectStatusData, {
        where: query,
      });
      resolve(data);
    });
  };
  public _deleteProjectStatusData = async (id: number) => {
    return new Promise((resolve, reject) => {
      const data = _project_status.destroy({
        where: { id },
      });
      resolve(data);
    });
  };

  public _getProjectStateData = async (query: WhereOptions) => {
    return new Promise<iProjectStatus[]>((resolve) => {
      const data = _project_status
      .findAll({
        where: query,
        group: ['state']
      })
      resolve(data);
    });
  };
}

export default ProjectStatusService;
