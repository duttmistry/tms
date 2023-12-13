import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import SampleService from '../services/sample.service';
import { MulterService, FileService } from '@tms-workspace/file-upload'; // multer service
import { Encryption } from '@tms-workspace/encryption'; // Ecnryption Service

// MulterService._fileFilter; // usage
// Encryption._doDecrypt('encrypted-string'); //usage
// FileService._deleteFile('base-path', 'files'); //usage

class SampleController {
  public sampleService = new SampleService();

  public getSample = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      //res.status(200).json('data');
      // SERVICE CALL & HANDLE PROMISES
      this.sampleService
        ._getAllData()
        .then((dbResponse) => {
          // SET QUERY, FILTER, PAGINATION CODE HERE
          // ...
          ///

          res.status(200).json(APIResponseFormat._ResDataFound(dbResponse));
        })
        .catch((err) => {
          console.log('error ---->> ', err);
          res.status(500).json(APIResponseFormat._ResIntervalServerError(err));
        });
    } catch (error) {
      next(error);
      console.log('error ---->> ', error);
      return res.status(500).json(error);
    }
  };
}

export default SampleController;
