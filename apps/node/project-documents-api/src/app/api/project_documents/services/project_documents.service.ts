// import sequelizeObj from '../../../database/connection';
import ProjectDocumentsModel from '../../../../app/database/models/tm_project_documents.model';
import ProjectDocumentChangeLogs from '../../../../app/database/models/tm_project_document_change_logs';
import { Op, Sequelize } from 'sequelize';
import { sequelize } from '../../../database/models';
import UserModel  from '../../../../app/database/models/user.model';

// initialize model & db connection
const _DB = {
  ProjectDocumentsModel: ProjectDocumentsModel(sequelize),
  ProjectDocumentChangeLogsModel: ProjectDocumentChangeLogs(sequelize),
  UserModel:UserModel(sequelize),
  sequelize,
  Sequelize,
};

const projectDocumentsModel = _DB.ProjectDocumentsModel;
const projectDocumentChangeLogs = _DB.ProjectDocumentChangeLogsModel;
const user=_DB.UserModel;
let respData = [];
_DB.ProjectDocumentsModel.belongsTo(_DB.UserModel, {
  foreignKey: 'created_by',
  as: 'createdBy',
});
class ProjectDocumentsService {
  // GET ALL DATA
  public _getAllData = async (decryptedProjectId: number, decryptedDocumentId: number, user_id: number) => {
    return new Promise(async (resolve, reject) => {
      if (decryptedProjectId && decryptedDocumentId) {
        await projectDocumentsModel
          .findAll({
            where: {
              [Op.and]: [
                { project_id: decryptedProjectId },
                { id: decryptedDocumentId },
                {[Op.or]:[Sequelize.fn('JSON_CONTAINS', Sequelize.col('ProjectDocumentsModel.authorized_users'), Sequelize.cast(user_id, 'CHAR CHARACTER SET utf8')),{created_by:user_id}]}
              ],
            },
            include:[
              {
                    as: 'createdBy',
                    model: user,
                    attributes: ['id', 'first_name', 'last_name'],
                  },
            ]
          })
          .then((projectList) => {
            resolve(projectList);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        if (decryptedDocumentId) {
          await projectDocumentsModel
            .findAll({
              where: {
                [Op.and]: [
                  { id: decryptedDocumentId },
                  {[Op.or]:[Sequelize.fn('JSON_CONTAINS', Sequelize.col('ProjectDocumentsModel.authorized_users'), Sequelize.cast(user_id, 'CHAR CHARACTER SET utf8')),{created_by:user_id}]}
                ],
              },
            })
            .then((projectList) => {
              resolve(projectList);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          await projectDocumentsModel
            .findAll({
              where: {
                [Op.and]: [
                  { project_id: decryptedProjectId },
                  {[Op.or]:[Sequelize.fn('JSON_CONTAINS', Sequelize.col('ProjectDocumentsModel.authorized_users'), Sequelize.cast(user_id, 'CHAR CHARACTER SET utf8')),{created_by:user_id}]}
                ],
              },
            })
            .then((projectList) => {
              resolve(projectList);
            })
            .catch((error) => {
              reject(error);
            });
        }
      }
    });
  };

  /** Used to verify that the request user is authorized or not to download the requested file. */
  public _findAuthorizedUsers = async (url: string, userId: number) => {
    return new Promise(async (resolve, reject) => {
      await projectDocumentsModel
        .findOne({
          where: {
            doc_url: url,
          },
        })
        .then((projectData) => {
          if (projectData === null) {
            resolve(null);
          } else {
            if (projectData.dataValues.authorized_users != null) {
              if (projectData.dataValues.authorized_users.includes(userId)) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              resolve(true);
            }
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  // Create a project document file.
  public _createProjectDocument = async (projectDocuments: Array<object>) => {
    return new Promise((resolve, reject) => {
      console.log('projectDocuments', projectDocuments);

      const data = projectDocumentsModel.bulkCreate(projectDocuments).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });

      resolve(data);
      // const newDoc = await projectDocumentsModel.create({
      //   workspace_id: workspaceId,
      //   project_id: projectId,
      //   doc_title: docTitle,
      //   doc_content: docContent,
      //   doc_url: URL,
      //   authorized_users: authorizedUsers,
      //   created_by: createdBy,
      //   last_edited_by: lastEditedBy,
      // });
      // try {
      //   const data = JSON.parse(JSON.stringify(newDoc));
      //   delete data.created_at;
      //   delete data.updated_at;
      //   respData.push(data);

      //   resolve(respData);
      //   if (respData.length == getDataLength) {
      //     respData = [];
      //   }
      // } catch (error) {
      //   console.log('error ---->> ', error);
      // }
    });
  };

  public _getProjectDocumentById = async (project_id:number,title:string) => {
    return new Promise((resolve, reject) => {
      const data = projectDocumentsModel.findOne({where: {project_id:project_id,doc_title:title}}).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });

      resolve(data);
    });
  };

  /** Used to add the updated doc content into document log table. */
  public _addDocument = async (id: number, docContent: string, updatedContent: Text, updatedBy: number) => {
    return new Promise(async (resolve, reject) => {
      await projectDocumentChangeLogs
        .create({
          document_id: id,
          previous_content: docContent,
          updated_content: updatedContent,
          updated_by: updatedBy,
        })
        .then((addDocumentResp) => {
          resolve(addDocumentResp);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  /** Delete a project document single record. */
  public _deleteProjectDocuments = async (decryptedDocumentId: number) => {
    return new Promise(async (resolve, reject) => {
      await projectDocumentsModel
        .destroy({
          where: {
            id: decryptedDocumentId,
          },
        })
        .then((response) => {
          let deleteResponse: object;
          if (response === 0) {
            deleteResponse = {
              message: 'No record found to be delete.',
              status: 200,
            };
          } else {
            deleteResponse = {
              message: 'Project document deleted succesfully.',
              status: 200,
            };
          }
          resolve(deleteResponse);
        });
    });
  };

  /** Used to get the data of single project document. */
  public _getDocumentData = async (decryptedDocumentId: number) => {
    return new Promise(async (resolve, reject) => {
      await projectDocumentsModel
        .findOne({
          where: {
            id: decryptedDocumentId,
          },
        })
        .then((response) => {
          const data = response;
          if (data) {
            resolve(data.dataValues);
          } else {
            resolve(null);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  /** Used to update the project document. */
  public _updateProjectDocuments = async (reciveUpdateddData: object, decryptedDocumentId: number) => {
    return new Promise(async (resolve, reject) => {
      await projectDocumentsModel
        .update(reciveUpdateddData, {
          where: {
            id: decryptedDocumentId,
          },
        })
        .then((resp) => {
          resolve(resp);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  /** Used to update the aurthorized user in the project document. */
  public _updateAuthorizedUser = async (reciveUpdateddData: object, decryptedDocumentId: number) => {
    return new Promise(async (resolve, reject) => {
      await projectDocumentsModel
        .update(reciveUpdateddData, {
          where: {
            id: decryptedDocumentId,
          },
        })
        .then((resp) => {
          resolve(resp);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  /** Used to update the project document. */
  public _updateUploadedProjectDocuments = async (reciveUpdateddData: object, decryptedDocumentIds:number[]) => {
    return new Promise(async (resolve, reject) => {
      await projectDocumentsModel
        .update(reciveUpdateddData, {
          where: {
            id: {[Op.in]: decryptedDocumentIds}
          },
        })
        .then((resp) => {
          resolve(resp);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };
}

export default ProjectDocumentsService;
