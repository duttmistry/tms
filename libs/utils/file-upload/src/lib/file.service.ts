import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

interface fileResponse {
  status: boolean;
  message: string;
}

export const _deleteFile = (basePath: string, files: any[]): fileResponse => {
  try {
    if (files?.length) {
      // eslint-disable-next-line prefer-const
      for (let file of files) {
        if (fs.existsSync(path.join(basePath, file.filename))) {
          fs.unlinkSync(path.join(basePath, file.filename));
        }
      }
    }
    return { status: true, message: 'success' };
  } catch (err) {
    return { status: false, message: err.message };
  }
};

export const _deleteDocuments = (basePath: string, files: any = []): fileResponse => {
  try {
    if (files.length) {
      for (const file of files) {
        if (fs.existsSync(path.join(basePath, file.document_path))) {
          fs.unlinkSync(path.join(basePath, file.document_path));
        }
      }
    }
    return { status: true, message: 'success' };
  } catch (err) {
    return { status: false, message: err.message };
  }
};

export const _deleteSingleFile = (basePath: string, files = []) => {
  try {
    if (files.length) {
      for (const file of files) {
        if (fs.existsSync(path.join(basePath, file))) {
          fs.unlinkSync(path.join(basePath, file));
        }
      }
    }
    return { status: true, message: 'success' };
  } catch (err) {
    return { status: false, message: err.message };
  }
};

export const _employeeImageSync = (url: string, dest: string) => {
  // console.log('dest', dest);
  // console.log('url', url.split('/'));

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const urlArray = url.split('/');
  const urlArrayLength = url.split('/').length;

  const filename = urlArray[urlArrayLength - 1];

  const file = fs.createWriteStream(`${dest}/${filename}`);
  return new Promise((resolve, reject) => {
    let responseSent = false; // flag to make sure that response is sent only once.
    http
      .get(url, (response) => {
        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            if (responseSent) return;
            responseSent = true;
            resolve(`uploads/employee/${filename}`);
          });
        });
      })
      .on('error', (err) => {
        if (responseSent) return;
        responseSent = true;
        reject(err);
      });
  });
};

export const _employeeCertificateSync = (url: string, dest: string) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const urlArray = url.split('/');
  const urlArrayLength = url.split('/').length;

  const filename = urlArray[urlArrayLength - 1];

  const file = fs.createWriteStream(`${dest}/${filename}`);
  return new Promise((resolve, reject) => {
    let responseSent = false; // flag to make sure that response is sent only once.
    http
      .get(url, (response) => {
        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            if (responseSent) return;
            responseSent = true;
            resolve(`uploads/employeeCertificates/${filename}`);
          });
        });
      })
      .on('error', (err) => {
        if (responseSent) return;
        responseSent = true;
        reject(err);
      });
  });
};
