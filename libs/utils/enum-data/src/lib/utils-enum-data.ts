// export function utilsEnumData() {
//   return {
//    emailRegEx :
//     /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
// passwordRegEx : /^[a-zA-Z0-9!@#$%^&*]{6,16}$/
//   };
// }
export const Utility = {
  emailRegEx:
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  passwordRegEx: /^[a-zA-Z0-9!@#$%^&*]{6,16}$/,
};

export enum Task_Type_Enum {
  Task = 'Task',
  Bug = 'Bug',
  Epic = 'Epic',
}
export enum Task_Type_Enum_Color_Codes {
  Task = '#0052cc',
  Bug = '#ff5959',
  Epic = '#8b63cf',
}

export enum Task_State_Enum {
  Todo = 'To Do',
  InProgress = 'In Progress',
  OnHold = 'On Hold',
  Completed = 'Completed',
}

export enum Task_Prioriry_Enum {
  Urgent = 'Urgent',
  High = 'High',
  Normal = 'Normal',
  Low = 'Low',
}

export enum Task_Running_Status_Enum {
  'Ongoing',
  'Stop',
  'Not Started Yet',
}

// Leave Type

export enum Leave_Type {
  CL = 'CL',
  PL = 'PL',
  LWP = 'LWP',
}

// Leave Manual Update Status

export enum Leave_Manual_Enum {
  InProcess = 'In Process',
  Draft = 'Draft',
  Saved = 'Saved',
}
