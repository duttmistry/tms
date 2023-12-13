import fs from 'fs';
import moment from 'moment';
import TinyURL from 'shefin-tinyurl';
import multer from 'multer';
import path from 'path';
import { NextFunction, Request, Response } from 'express';

import { BasePath, FileService, MulterService } from '@tms-workspace/file-upload';
import { Encryption } from '@tms-workspace/encryption';
import { APIResponseFormat } from '@tms-workspace/apis-core';

import ProjectDocumentsService from '../services/project_documents.service';

import {
  iUser,
  iUserCertificates,
  iUserEducation,
  iUserAddress,
  iUserEmail,
  iRequestWithUser,
  iUserLog,
} from '../../../database/interface/user.interface';

/**convert the path into URL. */
async function shorterUrl(url: any) {
  const responseUrl = await TinyURL.shorten(`http://${url}`).then(
    function (res: any) {
      return res;
    },
    function (err: any) {
      console.log(err);
    }
  );
  return responseUrl;
}

/** Used to encrypted URL into path. */
async function resolveURL(url: any) {
  const resolvedResponseUrl = await TinyURL.resolve(url).then(
    function (res: any) {
      return res;
    },
    function (err: any) {
      console.log(err);
      return err;
    }
  );
  return resolvedResponseUrl;
}

class ProjectDocumentsController {
  public projectDocumentsService = new ProjectDocumentsService();

  /** Used to add add the updated comtent in project document log table. */
  public addDocumentLog = async (body: any, updatedContent: Text, updatedBy: number) => {
    const { id, doc_content } = body;
    return await this.projectDocumentsService._addDocument(id, doc_content, updatedContent, updatedBy);
  };

  /** This function is used to check that the user who requests to download is authorized or not to download that file. */
  public findAuthorizedUsers = async (url: string, userId: number) => {
    return await this.projectDocumentsService._findAuthorizedUsers(url, userId);
  };

  /** Use to add a entry for project document in table. */
  public createProjectDocuments = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const newUpload = multer({
        storage: MulterService._projectDocumentStorage,
        fileFilter: MulterService._fileDocumentFilter,
      }).fields([{ name: 'uploadDocuments', maxCount: 10 }]);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisI = this;
      newUpload(req, res, async function (err) {
        try {
          if (err && err.message) {
            return res.status(400).send(APIResponseFormat._ResUploadError(err.message));
          }

          const workspace_id = Number(req.body.workspace_id);
          const project_id = Number(req.body.project_id);
          let createDocuments = req.body.createDocuments ? JSON.parse(req.body.createDocuments) : [];
          const team_member = req.body.team_member ? JSON.parse(req.body.team_member) : [];
          let uploadDocuments = req.files?.['uploadDocuments'] || [];
          const userId = req.user.id;
          if(createDocuments.length>0){
          const validate=await thisI.projectDocumentsService._getProjectDocumentById(project_id,createDocuments[0]?.doc_title)
          if(validate){
            FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['uploadDocuments']);
            return res.status(409).json(APIResponseFormat._ResDataExists('Documents', 'Title'));
          }
        }
          createDocuments = createDocuments.map((doc) => {
            return {
              ...doc,
              project_id,
              workspace_id,
              created_by: userId,
              last_edited_by: userId,
            };
          });

          uploadDocuments = uploadDocuments.map((el) => {
            return {
              project_id,
              workspace_id,
              doc_url: `uploads/project/documents/${el.filename}`,
              authorized_users: team_member,
              created_by: userId,
              last_edited_by: userId,
            };
          });

          const projectDocuments = [...createDocuments, ...uploadDocuments];

          console.log('projectDocuments', projectDocuments);
          const data = await thisI.projectDocumentsService._createProjectDocument(projectDocuments);

          console.log('data', data);

          return res.status(201).json(APIResponseFormat._ResDataCreated('The project document', data));
        } catch (error) {
          console.log('🚀 ~ file: project.controller.ts:237 ~ ProjectController ~ error:', error);

          FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['uploadDocuments']);
          next(error);
          return res.status(500).json(APIResponseFormat._ResIntervalServerError());
        }
      });
    } catch (error) {
      console.log('🚀 ~ file: project.controller.ts:244 ~ ProjectController ~ createProject= ~ error:', error);

      next(error);
      FileService._deleteFile(BasePath.default.PROJECT_PATH, req.files['uploadDocuments']);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }

    // let checkValidation = true;
    // let successResp: any;
    // let createResponse: any;
    // if (request.body.length < 1) {
    //   res.status(409).json(APIResponseFormat._ResMissingRequiredField('Some fields'));
    // } else {
    //   request.body.forEach((documentData: any) => {
    //     const workspaceId = documentData?.workspace_id;
    //     const projectId = documentData?.project_id;
    //     const docTitle = documentData?.doc_title;
    //     const docContent = documentData?.doc_content;
    //     if (workspaceId == undefined || projectId == undefined || docTitle == undefined || docContent == undefined) {
    //       checkValidation = false;
    //     }
    //   });
    //   if (checkValidation) {
    //     request.body.forEach(async (documentData: any) => {
    //       let URL: any;
    //       const workspaceId = documentData?.workspace_id;
    //       const projectId = documentData?.project_id;
    //       const docTitle = documentData?.doc_title;
    //       const docContent = documentData?.doc_content;
    //       const authorizedUsers = documentData?.authorized_users;
    //       // const datetime = moment().format('DDMMYYYYhmmssSS');
    //       // fs.appendFile(`./apps/node/project-documents-api/documents/${docTitle}${datetime}.docx`, docContent, function (err: any) {
    //       //   if (err) throw err;
    //       //   console.log('File is created successfully.');
    //       // });
    //       // const docPath = path.join('./apps/node/project-documents-api/documents', `${docTitle}${datetime}.docx`);
    //       // URL = await shorterUrl(docPath);
    //       createResponse = await this.projectDocumentsService._createProjectDocument(
    //         workspaceId,
    //         projectId,
    //         docTitle,
    //         docContent,
    //         authorizedUsers,
    //         request.user.id,
    //         request.user.id,
    //         URL,
    //         request.body.length
    //       );
    //       if (createResponse != null) {
    //         res.status(200).json(APIResponseFormat._ResDataCreated('Project Document', createResponse));
    //       } else {
    //         res.status(500).json(APIResponseFormat._ResIntervalServerError());
    //       }
    //     });
    //   } else {
    //     res.status(409).json(APIResponseFormat._ResMissingRequiredField('Some fields'));
    //   }
    // }
  };

  /** Use to update a entry for project document in table. */
  public updateProjectDocuments = async (request: iRequestWithUser, res: Response, next: NextFunction) => {
    if (request.headers.documentid != null) {
      const encryptedDocumentId = Encryption._doEncrypt(String(request.headers.documentid));
      const workspaceId = request.body?.workspace_id;
      const projectId = request.body?.project_id;
      const docTitle = request.body?.doc_title;
      const docContent = request.body?.doc_content;
      const authorizedUsers = request.body?.authorized_users;
      const decryptedDocumentId = Encryption._doDecrypt(encryptedDocumentId);
      const created_by = request.user.id;
      const documentData = await this.projectDocumentsService._getDocumentData(Number(decryptedDocumentId));
      if (documentData !== null) {
        if (workspaceId != undefined && projectId != undefined && docTitle != undefined && docContent != undefined) {
          await this.addDocumentLog(documentData, docContent, created_by);
          const reciveUpdateddData = {
            workspace_id: workspaceId,
            project_id: projectId,
            doc_title: docTitle,
            doc_content: docContent,
            authorized_users: authorizedUsers,
            // created_by: request.user.id,
            last_edited_by: request.user.id,
          };
          this.projectDocumentsService
            ._updateProjectDocuments(reciveUpdateddData, Number(decryptedDocumentId))
            .then(async () => {
              const updatedDocument = await this.projectDocumentsService._getDocumentData(Number(decryptedDocumentId));

              res.status(200).json(APIResponseFormat._ResDataUpdated('The project document', updatedDocument));
            })
            .catch((err) => {
              res.status(500).json(APIResponseFormat._ResIntervalServerError(err));
            });
        } else {
          res.status(409).json(APIResponseFormat._ResMissingRequiredField('Some fields'));
        }
      } else {
        res.status(404).json(APIResponseFormat._ResDataNotFound(null));
      }
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Document Id'));
    }
  };

  /** Use to get the list of all project document. */
  public getProjectDocuments = async (request: iRequestWithUser, res: Response, next: NextFunction) => {
    if (request.headers.projectid != null || request.headers.documentid != null) {
      const encryptedProjectId = Encryption._doEncrypt(String(request.headers.projectid));
      const encryptedDocumentId = Encryption._doEncrypt(String(request.headers.documentid));
      const decryptedProjectId = Encryption._doDecrypt(encryptedProjectId);
      const decryptedDocumentId = Encryption._doDecrypt(encryptedDocumentId);
      this.projectDocumentsService
        ._getAllData(Number(decryptedProjectId), Number(decryptedDocumentId), Number(request.user.id))
        .then((response) => {
          res.status(200).json(APIResponseFormat._ResDataFound(response));
        })
        .catch((err) => {
          next(err);
          res.status(500).json(APIResponseFormat._ResIntervalServerError(err));
        });
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Project Id or Document Id'));
    }
  };

  /** Use to update a specific feild i.e. authorized user for project document in table. */
  public updateAuthorizedUserProjectDocuments = async (request: Request, res: Response, next: NextFunction) => {
    if (request.headers.documentid != null) {
      const encryptedDocumentId = Encryption._doEncrypt(String(request.headers.documentid));
      const decryptedDocumentId = Encryption._doDecrypt(encryptedDocumentId);
      const documentData = await this.projectDocumentsService._getDocumentData(Number(decryptedDocumentId));
      if (documentData !== null) {
        const authorizedUsers = request.body?.authorized_users;
        if (authorizedUsers !== undefined) {
          const reciveUpdateddData = {
            authorized_users: authorizedUsers,
          };
          this.projectDocumentsService
            ._updateAuthorizedUser(reciveUpdateddData, Number(decryptedDocumentId))
            .then(() => {
              res.status(200).json(APIResponseFormat._ResDocumentSharingListUpdated());
            })
            .catch((err) => {
              res.status(500).json(APIResponseFormat._ResIntervalServerError(err));
            });
        } else {
          res.status(409).json(APIResponseFormat._ResMissingRequiredField('Document sharing list'));
        }
      } else {
        res.status(404).json(APIResponseFormat._ResDataNotFound(null));
      }
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Document Id'));
    }
  };

  /** Used to download the content of given url. */
  public downloadProjectDocuments = async (request: Request, res: Response, next: NextFunction) => {
    if (request.headers.url != null) {
      const data = await this.findAuthorizedUsers(String(request.headers.url), Number(request.headers.userid));
      const url = await resolveURL(request.headers.url);
      if (data === null) {
        res.status(404).json(APIResponseFormat._ResDataNotFound(null));
      } else if (data) {
        const docPath = path.join('./apps/node/project-documents-api/documents/', path.basename(url));
        res.download(docPath, path.basename(url), function (err) {
          if (err) {
            // if the file download fails, we throw an error
            res.status(404).json(APIResponseFormat._ResDataNotFound(null));
          }
        });
      } else {
        res.json(APIResponseFormat._ResUnauthrized(401));
      }
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Url'));
    }
  };

  /** Deleting a project document. */
  public deleteProjectDocuments = async (request: Request, res: Response, next: NextFunction) => {
    if (request.headers.documentid != null) {
      const encryptedDocumentId = Encryption._doEncrypt(String(request.headers.documentid));
      const decryptedDocumentId = Encryption._doDecrypt(encryptedDocumentId);
      this.projectDocumentsService
        ._deleteProjectDocuments(Number(decryptedDocumentId))
        .then((response) => {
          res.status(200).json(response);
        })
        .catch((err) => {
          next(err);
          res.status(500).json(APIResponseFormat._ResIntervalServerError(err));
        });
    } else {
      res.status(500).json(APIResponseFormat._ResMissingRequiredField('Document Id'));
    }
  };

   /** Use to update a entry for project document in table. */
   public updateUploadedProjectDocuments = async (request: iRequestWithUser, res: Response, next: NextFunction) => {
    if (request.body.documentids&&request.body.documentids.length>0) {
      const docIds = request.body?.documentids;
      const authorizedUsers = request.body?.authorized_users;
      this.projectDocumentsService
      ._updateProjectDocuments({authorized_users: authorizedUsers},docIds)
      .then(async () => {
        res.status(200).json(APIResponseFormat._ResDataUpdated('The project document'));
      })
      .catch((err) => {
        res.status(500).json(APIResponseFormat._ResIntervalServerError(err));
      });
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Document Id'));
    }
  };

}

export default ProjectDocumentsController;
