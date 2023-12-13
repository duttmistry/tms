import { APIResponseFormat } from './api-response.interface';

// Required fileds Missing Error - Bad Request
export const _ResMissingRequiredField = (name = 'Some required fields'): APIResponseFormat => {
  const pronaounce = name === 'Some required fields' ? 'are' : 'is';
  return {
    status: 409,
    success: false,
    message: `${name} ${pronaounce} missing`,
  };
};

// Error while uploading file using multer
export const _ResUploadError = (err: string): APIResponseFormat => {
  return {
    status: 400,
    success: false,
    message: err,
  };
};

// Invalid Credentials
export const _ResInvalidCredentials = (): APIResponseFormat => {
  return {
    status: 401,
    success: false,
    message: 'Credentials are not valid.',
  };
};

//custom message
export const _ResMessage = (status, flag, message, data = {}): APIResponseFormat => {
  return {
    status: status,
    success: flag,
    message: message,
    data: data || {},
  };
};

// Logout Successfully
export const _ResLogoutSuccess = (): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: 'You have been successfully logged out.',
  };
};

// Un-authorized
export const _ResUnauthrized = (code: number): APIResponseFormat => {
  return {
    status: code,
    success: false,
    message: 'You do not have the authorization for this action.',
  };
};

// Login Successfully
export const _ResLoginSuccess = (data: any): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: 'You have been successfully logged in.',
    data,
  };
};

// Access Token Update Successfully
export const _ResAccessTokenUpdated = (data: any): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: 'The Access Token has been updated successfully.',
    data,
  };
};

// Encrypt Data Successfully
export const _ResDataEncrypted = (): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: 'The user data has been successfully encrypted.',
  };
};

// User Sync Data Successfully
export const _ResDataSync = (data: any = null): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: 'User Data Sync is successful.',
    data,
  };
};

// Data Not Found
export const _ResDataNotFound = (data: any = null): APIResponseFormat => {
  return {
    status: 404,
    success: false,
    message: `No record(s) found`,
    data,
  };
};

// Data Not Found
export const _ResLateLogin = (data: any = null): APIResponseFormat => {
  return {
    status: 200,
    success: false,
    message: `You are late to login`,
    data,
  };
};

// Data Found
export const _ResDataFound = (data: any = null): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: 'Success',
    data,
  };
};

// Data Found
export const _ResDataFoundWithPagination = (
  data: any,
  totalPages: number,
  limit: string,
  totalRecords: number,
  currentPage: number
): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: 'Success',
    data: {
      list: data,
      totalPages,
      limit: parseInt(limit),
      totalRecords,
      currentPage,
    },
  };
};

// Data Not Exits
export const _ResNotExists = (name: string): APIResponseFormat => {
  return {
    status: 409,
    success: false,
    message: `${name} does not exist`,
  };
};

// Data Exits
export const _ResDataExists = (name: string, data: string): APIResponseFormat => {
  return {
    status: 409,
    success: false,
    message: `A ${name} with this ${data} already exists.`,
  };
};

export const _ResTemplatebindwithAction = (name: string): APIResponseFormat => {
  return {
    status: 409,
    success: false,
    message: `${name} Bind with action so it can't be deleted`,
  };
};

export const _ResRoleCanNotDelete = (): APIResponseFormat => {
  return {
    status: 409,
    success: false,
    message: `You can't delete this role because it is assigned to some user(s)`,
  };
};

// Internal Server Error
export const _ResIntervalServerError = (message = 'Something went wrong, please try again.', status = 500): APIResponseFormat => {
  return {
    status,
    success: false,
    message,
  };
};

// Documents Updated Successfully
export const _ResDocumentUpdated = (): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: `Document(s) has been updated successfully.`,
  };
};

// Documents sharing list Updated Successfully
export const _ResDocumentSharingListUpdated = (): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: `Document sharing list has been successfully updated.`,
  };
};

// Data Created Successfully
export const _ResDataCreated = (name: string, data: any = []): APIResponseFormat => {
  return {
    status: 201,
    success: true,
    message: `${name} has been created successfully`,
    data,
  };
};

// Already exist tags
export const _ResAlreadyExistTags = (name: string, data: any = []): APIResponseFormat => {
  return {
    status: 201,
    success: true,
    message: `${name} already exist`,
    data,
  };
};

// Data Created Successfully
export const _ResDataNotCreatedAndUpdated = (create: any[], update: any[]): APIResponseFormat => {
  if (create.length > 0 && update.length > 0) {
    return {
      status: 400,
      success: true,
      message: `An error occurred during ${create.join(',')} creation and ${update.join(',')} updatation`,
    };
  } else if (create.length > 0 && update.length <= 0) {
    return {
      status: 400,
      success: true,
      message: `An error occurred during ${create.join(',')} creation. `,
    };
  } else if (create.length <= 0 && update.length > 0) {
    return {
      status: 400,
      success: true,
      message: `An error occurred during ${update.join(',')} updatation`,
    };
  }
  // return {
  //   status: 400,
  //   success: true,
  //   message: create.length>==0&&update.length>==0?``:`${name} has been created successfully`
  // };
};

// Data Not Created Successfully
export const _ResDataNotCreated = (name: string): APIResponseFormat => {
  return {
    status: 500,
    success: false,
    message: `Something went wrong while creating ${name}`,
  };
};

// Data Updated Successfully
export const _ResDataUpdated = (name: string, data: any = []): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: `${name} has been updated successfully`,
    data,
  };
};

// Data Not Updated Successfully
export const _ResDataNotUpdated = (name: string): APIResponseFormat => {
  return {
    status: 500,
    success: false,
    message: `Something went wrong while updating ${name}`,
  };
};

// Data Deleted Successfully
export const _ResDataDeleted = (name: string): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: `${name} has been deleted successfully`,
  };
};

// Data Not Deleted Successfully
export const _ResDataNotDeleted = (name: string): APIResponseFormat => {
  return {
    status: 500,
    success: false,
    message: `Something went wrong while deleting ${name}.`,
  };
};

// Bad Request
export const _ResBadRequest = (message: string): APIResponseFormat => {
  return {
    status: 400,
    success: false,
    message,
  };
};

// Custom Request
export const _ResCustomRequest = (message: string): APIResponseFormat => {
  return {
    status: 409,
    success: false,
    message,
  };
};

export const _ResProjectIdsAlreadyExists = (message: string): APIResponseFormat => {
  return {
    status: 409,
    success: false,
    message,
  };
};

export const _ResPreferenceNotFound = (data: any = null): APIResponseFormat => {
  return {
    status: 200,
    success: true,
    message: `No record(s) found`,
    data,
  };
};
