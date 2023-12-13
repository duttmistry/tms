export const ACTION_CONSTANTS = {
  CREATE: 'create',
  EDIT: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  TASKS: 'tasks',
  SETTINGS: 'settings',
};

export const MODULE_CONSTANTS = {
  PROJECT: 'project',
  WORKSPACE: 'workspace',
  TASKS: 'tasks',
};

export const PERMISSION_CONSTANTS = {
  PERMISSION: 'pm',
};

export const STORAGE_CONSTANTS = {
  ACCESS_TOKEN: 'at',
  REMAINING_TIME: 'rt',
  USER_DATA: 'ud',
  BREAK_STATUS: 'bs',
  FIREBASE_CLOUD_MESSAGING: 'fcm',
  RELOAD_COUNTS: 'rc',
  VISITED_PAGES: 'vp',
  TASK_FILTERS: 'tafi',
  LEAVE_APPROVAL_FILTERS: 'lvfi',
  SET_PREFERENCE: '_pr',
  SESSION_ID: 'si',
  IS_SIDEBAR_OPENED: 'sb',
  REPORTER_STATUS: 'dv',
  DASHBOARD_PREF: 'pd',
  IS_MODAL_OPENED: 'mo',
  ACCOUNT: 'ac',
  NOTIFICATION: 'nf',
  BREAK_TIME_TASK: 'bt',
  IS_BREAK_TIME: 'br',
  BREAK_TIME_TIMER: 'br_t',
  BREAK_TIMER: 'bt_t',
  COMPLETED_TASK_TIMESTAMPP: 'cots',
};

export const CUSTOM_FIELDS_CONSTANTS = {
  CONTEXT: 'context',
  DESCRIPTIVE: 'descriptive',
};

export const CUSTOM_FIELD_TYPE_CONSTANTS = {
  RADIO_BUTTON: 'radio-btn',
  INPUT_TEXT: 'input-text',
  INPUT_URL: 'input-url',
  DROPDOWN: 'dropdown',
  CHECKBOX: 'checkbox',
  INPUT_NUMBER: 'input-number',
  DATE: 'date',
  TEXT_AREA: 'textarea',
};

export const PROJECT_STATUS_OPTIONS = [
  {
    title: 'Ongoing',
    value: 'ongoing',
  },
  {
    title: 'Under Maintenance',
    value: 'undermaintenance',
  },
  {
    title: 'Closed',
    value: 'closed',
  },
];
export const PROJECT_STATUS_CONSTANTS = {
  UNDER_MAINTENANCE: 'undermaintenance',
  ON_GOING: 'ongoing',
  CLOSED: 'closed',
};

export const DATE_FORMAT_CONSTANTS = {
  YYYY_MM_DD: 'YYYY/MM/DD',
  DD_MM_YYYY_hh_mm_A: 'DD/MM/YYYY hh:mm A',
  hh_mm_A: 'hh:mm A',
  DD_MM_YYYY: 'DD/MM/YYYY',
};

export const DEFAULT_LABEL_COLOR_CONSTANTS = {
  color: '#e8e5e4',
};

export const PENDING = 'PENDING';
export const APPROVED = 'APPROVED';
export const CANCELLED = 'CANCELLED';
export const REJECTED = 'REJECTED';
export const ALL = 'ALL';
export const LEAVE_STATUS_FILTER_OPTIONS = [
  {
    title: 'Approved',
    value: 'APPROVED',
  },
  {
    title: 'Pending',
    value: 'PENDING',
  },
  {
    title: 'Rejected',
    value: 'REJECTED',
  },
  {
    title: 'Cancelled',
    value: 'CANCELLED',
  },
  {
    title: 'All',
    value: 'ALL',
  },
];

export const ERROR_MESSAGE_CONSTANTS = {
  SELECT_PROJECT_FIRST: 'Please select project first',
  REQUIRED_AND_INVALID_FORM: 'Please fill in required fields with correct information.',
};

export const TASK_REQUEST_KEYS_CONSTANTS = {
  PROJECT_ID: 'project_id',
  PARENT_TASK_ID: 'parent_task_id',
  PARENT_TASK_TITLE: 'parent_task_title',
  TYPE: 'type',
  TITLE: 'title',
  DESCRIPTION: 'description',
  STATE: 'state',
  STATUS: 'status',
  ASIGNEE: 'assignee',
  ASSIGNED_BY: 'assigned_by',
  REPORTER: 'reporter',
  LABELS: 'labels',
  START_DATE: 'start_date',
  DUE_DATE: 'due_date',
  PRIORITY: 'priority',
  ETA: 'eta',
  SUBSCRIBERS: 'subscribers',
  DOCUMENTS: 'documents',
  SECTION: 'section',
  DELETED_DOCUMENTS: 'deletedDocuments',
  TASK_CUSTOM_FIELD_VALUE: 'TaskCustomFieldValue',
  ASSIGNEE_USER: 'assigneeUser',
  ASSIGNED_BY_USER: 'assignedByUser',
  REPORT_TO_USER: 'reportToUser',
  EXTERNAL_LINK: 'external_link',
  SUB_STAUS: 'subStatus',
};

export const DEFAULT_TASK_TYPE_CONSTANT = 'Task';

export const TASK_TIMER_CONSTANTS = {
  ONGOING: 'Ongoing',
  Not_Started_Yet: 'Not Started Yet',
  STOP: 'Stop',
};

export const TASK_TIMER_DEFAULT_VALUE = '00:00:00';

export const UNAUTHORIZED_PAGE_NAME = 'unauthorized-access';

export const ORDER_BY_DESC_VALUE = 'desc';

export const SORT_BY_ID_VALUE = '_id';

export const TASK_CHANGE_LOG_CONSTANTS = {
  TASK_UPDATED: 'Task updated',
  TASK_CREATED: 'Task created',
  TIMER_START: 'Timer Start',
  TIMER_STOP: 'Timer Stop',
  TIMER_HAS_STOPPED: 'The timer has been stopped.',
  STARTED_TIMER: 'started timer',
  STOPPED_TIMER: 'stopped timer',
  FOR_THIS_TASK: 'for this task',
  CHANGED: 'changed',
  ADDED: 'added',
  REMOVED: 'removed',
  CREATED: 'created',
  TASK: 'task',
  YOU: 'You',
  SUBSCRIBERS: 'subscriber(s)',
  DOCUMENTS: 'document(s)',
  LABELS: 'label(s)',
  COMMENT_ADDED: 'Comment Added',
  COMMENT_EDITED: 'Comment Edited',
  COMMENT_DELETED: 'Comment Deleted',
  COMMIT_ADDED: 'Commit Added',
  COMMIT_EDITED: 'Commit Edited',
  COMMIT_DELETED: 'Commit Deleted',
  COMMENT: 'comment',
  EDITED: 'edited',
  DELETED: 'deleted',
  COMMIT: 'commit',
};

export const CHANGE_LOG_FIELDS_CONSTANTS = {
  DOCUMENTS: 'documents',
  SUBSCRIBERS: 'subscribers',
  STATE: 'state',
  STATUS: 'status',
  SUB_STATUS: 'substatus',
  LABELS: 'labels',
  DESCRIPTION: 'description',
  START_DATE: 'start date',
  DUE_DATE: 'due date',
  SECTION: 'section',
  PROJECT_ID: 'project id',
  EXTERNAL_LINK: 'external link',
};

export const TASK_PRIORITY_CONSTANTS = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  HIGH: 'High',
  LOW: 'Low',
};

export const TASK_PRIORITY_COLOR_CONSTANTS = {
  NORMAL_PRIORITY_COLOR: 'skyblue',
  HIGH_PRIORITY_COLOR: 'orange',
  URGENT_PRIORITY_COLOR: 'red',
  LOW_PRIORITY_COLOR: 'gray',
};

export const TASK_GROUP_BY_FILTER_CONSTANTS = {
  PROJECT: 'project_id',
  STATE: 'state',
  ASSIGNEE: 'assignee',
  STATUS: 'status',
  SECTION: 'section',
};

export const CREATE_MESSAGES_IN_POPUP = {
  CREATE_LABEL_FOR: 'Create label for',
  CREATE_SECTION_FOR: 'Create section for',
};

export const PROJECT_ID_QUERY_PARAM_CONSTANT = 'p_id';

export const QUICK_TASK_FORM_CONTROLS = {
  TASK_TYPE: 'taskType',
  TASK_SPACE_TYPE: 'task type',
  ASSIGNTO: 'assignTo',
  ASSIGN_SPACE_TO: 'assign to',
  TITLE: 'title',
};

export const QUICK_TASK_ERROR_MESSAGE = {
  TITLE_MINLENGTH: 'Task title should be of at least 5 characters',
  TITLE_MAXLENGTH: 'Task title can not be greater than 512 characters',
  TITLE_REQUIRED: 'Task title is required',
};

export const INPROGRESS_TASK_STATE_STATUS = 'inprogress';

export const TEMP_CONSTANT = 'temporary';

export const TASK_DETAIL_ROUTE = '/tasks/view/';

export const TASK_TIMER_TOGGLE_MESSAGE = {
  TIMER_STARTED: 'Task timer has been started..',
  TIMELOG_DELETED: 'Task timer has been deleted.',
};

export const ACTION_COLUMN = 'Action';

export const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
};
