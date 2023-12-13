import { FileFilterCallback } from 'multer';
import * as fs from 'fs';
import { Express, Request } from 'express';
import * as BasePath from './config/config';
import * as multer from 'multer';

const imageFileFilterExt = ['jpg', 'jpeg', 'png', 'gif'];
const fileFilterExt = ['txt', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'pdf', 'xls', 'xlsx', 'json', 'ppt', 'pptx'];
const excelFileFilterExt = ['xls', 'xlsx'];
const fileDocumentFileFilterExt = ['txt', 'doc', 'docx', 'pdf', 'ppt', 'pptx'];

export type DestinationCallback = (error: Error | null, destination: string) => void;

export type FileNameCallback = (error: Error | null, filename: string) => void;

export const _DocumentStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.PROJECT_DOCUMENT_PATH)) {
      fs.mkdirSync(BasePath.default.PROJECT_DOCUMENT_PATH, { recursive: true });
    }
    cb(null, BasePath.default.PROJECT_DOCUMENT_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const workspaceDocumentStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.WORKSPACE_DOCUMENT_PATH)) {
      fs.mkdirSync(BasePath.default.WORKSPACE_DOCUMENT_PATH, { recursive: true });
    }
    cb(null, BasePath.default.WORKSPACE_DOCUMENT_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _workspaceStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.WORKSPACE_PATH)) {
      fs.mkdirSync(BasePath.default.WORKSPACE_PATH, { recursive: true });
    }
    cb(null, BasePath.default.WORKSPACE_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _workspaceImportStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.WORKSPACE_IMPORT_PATH)) {
      fs.mkdirSync(BasePath.default.WORKSPACE_IMPORT_PATH, { recursive: true });
    }
    cb(null, BasePath.default.WORKSPACE_IMPORT_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _taskDocumentStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.TASK_DOCUMENT_PATH)) {
      fs.mkdirSync(BasePath.default.TASK_DOCUMENT_PATH, { recursive: true });
    }
    cb(null, BasePath.default.TASK_DOCUMENT_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _leaveDocumentStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.LEAVE_DOCUMENT_PATH)) {
      fs.mkdirSync(BasePath.default.LEAVE_DOCUMENT_PATH, { recursive: true });
    }
    cb(null, BasePath.default.LEAVE_DOCUMENT_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _userStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.USER_PATH)) {
      fs.mkdirSync(BasePath.default.USER_PATH, { recursive: true });
    }
    cb(null, BasePath.default.USER_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _projectStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.PROJECT_PATH)) {
      fs.mkdirSync(BasePath.default.PROJECT_PATH, { recursive: true });
    }
    cb(null, BasePath.default.PROJECT_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _ceoProfileStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.CEO_PROFILE_PATH)) {
      fs.mkdirSync(BasePath.default.CEO_PROFILE_PATH, { recursive: true });
    }
    cb(null, BasePath.default.CEO_PROFILE_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
})

export const _projectDocumentStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.PROJECT_DOCUMENT_PATH)) {
      fs.mkdirSync(BasePath.default.PROJECT_DOCUMENT_PATH, { recursive: true });
    }
    cb(null, BasePath.default.PROJECT_DOCUMENT_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _leaveBalanceExcel = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.LEAVE_BALANCE_EXCEL_PATH)) {
      fs.mkdirSync(BasePath.default.LEAVE_BALANCE_EXCEL_PATH, { recursive: true });
    }
    cb(null, BasePath.default.LEAVE_BALANCE_EXCEL_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _leaveOpeningBalanceExcel = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.LEAVE_OPENING_BALANCE_EXCEL_PATH)) {
      fs.mkdirSync(BasePath.default.LEAVE_OPENING_BALANCE_EXCEL_PATH, { recursive: true });
    }
    cb(null, BasePath.default.LEAVE_OPENING_BALANCE_EXCEL_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _leaveDataExcel = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: DestinationCallback): void {
    if (!fs.existsSync(BasePath.default.LEAVE_DATA_PATH)) {
      fs.mkdirSync(BasePath.default.LEAVE_DATA_PATH, { recursive: true });
    }
    cb(null, BasePath.default.LEAVE_DATA_PATH);
  },
  filename: function (req: Request, file, cb: FileNameCallback): void {
    //cb(null, Date.now() + '-' + file.originalname);
    const originalname = file.originalname;
    const extension = originalname.split('.').pop();
    const timestamp = Date.now();
    const modifiedFilename = originalname.replace(`.${extension}`, `-${timestamp}.${extension}`);
    cb(null, modifiedFilename);
  },
});

export const _imageFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    return cb(new Error(`${imageFileFilterExt.join(', ')} extensions are allowed only.`));
  }
  cb(null, true);
};

export const _fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (!file.originalname.match(/\.(txt|TXT|jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|pdf|PDF|doc|DOC|DOCX|docx|xls|xlsx|XLS|XLSX|ppt|PPT|pptx|PPTX)$/)) {
    return cb(new Error(`${fileFilterExt.join(', ')} extensions are allowed only.`));
  }
  cb(null, true);
};

export const _excelFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (!file.originalname.match(/\.(xls|xlsx|XLS|XLSX)$/)) {
    return cb(new Error(`${excelFileFilterExt.join(', ')} extensions are allowed only.`));
  }
  cb(null, true);
};

export const _fileDocumentFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (!file.originalname.match(/\.(txt|TXT|pdf|PDF|doc|DOC|DOCX|docx|ppt|PPT|pptx|PPTX)$/)) {
    return cb(new Error(`${fileDocumentFileFilterExt.join(', ')} extensions are allowed only.`));
  }
  cb(null, true);
};

// Error handling middleware for Multer

export const _handleMulterError = (err, req, res, next) => {
  console.log('Error', err);
  console.log('req', req);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const errorMessage = `File size limit exceeded. Max file size is 5 MB.`;
      return res.status(400).json({ error: errorMessage });
    }
    return res.status(400).json({ error: 'An error occurred during file upload.' });
  }

  next();
};
