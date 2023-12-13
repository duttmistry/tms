import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import {
  ProjectNameModel,
  ProjectTeamMember,
  SectionObjectModel,
  TaskChangeLogListToBindModel,
  TaskChangeLogResponseObjectModel,
  TaskLabelModel,
  UpdatedValuesModel,
  taskStatusListModel,
} from '../../../core/model/task/task.model';
import moment from 'moment';
import { CHANGE_LOG_FIELDS_CONSTANTS, DATE_FORMAT_CONSTANTS, TASK_CHANGE_LOG_CONSTANTS } from '../../../core/services/common/constants';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'main-app-tms-workspace-change-log',
  templateUrl: './change-log.component.html',
  styleUrls: ['./change-log.component.scss'],
})
export class ChangeLogComponent implements OnChanges {
  //#region properties
  @Input() taskChangeLogsResponseList: TaskChangeLogResponseObjectModel[] = [];
  @Input() loggedInUserId!: number;
  @Input() projectTeamData: ProjectTeamMember[] = [];
  @Input() taskChangeLogTotalRecords!: number;
  @Input() taskStatusList: taskStatusListModel[] = [];
  @Input() labelsList: any[] = [];
  @Input() sectionsList: SectionObjectModel[] = [];
  @Input() projectNameList!: ProjectNameModel[];
  @Output() emitLoadMoreEvent: EventEmitter<object> = new EventEmitter();
  taskChangeLogBindList: TaskChangeLogListToBindModel[] = [];
  isShowLoadMoreRecords = false;
  dialogRef: any;
  descriptionStatement: any = "";
  @ViewChild('description') description!: TemplateRef<any>;
  //#endregion

  constructor(private taskService: TaskService, private sanitizer: DomSanitizer, private dialog: MatDialog) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['taskChangeLogsResponseList'] && changes['taskChangeLogsResponseList'].currentValue) {
      this.taskChangeLogsResponseList = changes['taskChangeLogsResponseList'].currentValue;
      if (this.taskChangeLogsResponseList && this.taskChangeLogsResponseList.length > 0) {
        this.taskChangeLogBindList = [];
        this.prepareChangeLogStatements();
        if (
          this.taskChangeLogTotalRecords &&
          this.taskChangeLogsResponseList &&
          this.taskChangeLogTotalRecords > this.taskChangeLogsResponseList.length
        ) {
          this.isShowLoadMoreRecords = true;
        } else {
          this.isShowLoadMoreRecords = false;
        }
      }
    }
  }

  // this method prepares task changelog statements based on the action name and fields
  prepareChangeLogStatements() {
    this.taskChangeLogsResponseList.forEach((changeLogObject: TaskChangeLogResponseObjectModel) => {
      let logStatement: any = '';
      let logStatement2: any = '';
      let isLogStatement2 = false;
      let isSubscribersChanged = false;

      ////Log Changes //////////
      let key: any = "";
      let old_value: any = "";
      let new_value: any = "";
      ////////////////

      const logTime = moment(changeLogObject.updatedAt).format(DATE_FORMAT_CONSTANTS.DD_MM_YYYY_hh_mm_A);
      // check if logged in user and user who performed action are same
      logStatement = this.getActionPerformedByUser(changeLogObject).logStatement;
      logStatement2 = this.getActionPerformedByUser(changeLogObject).logStatement2;
      // console.log('logStatement2: ', logStatement2);
      // console.log('logStatement: ', logStatement);
      if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.TASK_UPDATED.toLowerCase()) {
        if (changeLogObject.updated_values && changeLogObject.updated_values.length > 0) {
          key = ""
          changeLogObject.updated_values.forEach((updatedValueObject: UpdatedValuesModel) => {
            logStatement = this.getActionPerformedByUser(changeLogObject).logStatement;
            logStatement2 = this.getActionPerformedByUser(changeLogObject).logStatement2;

            const keyName = this.taskService.getKeyName(updatedValueObject.key);
            // check if updated field is documents
            if (updatedValueObject.key.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.DOCUMENTS.toLowerCase()) {
              // if oldvalue is blank array or null and newvalue is having data => new doc is added
              if (
                ((updatedValueObject.oldValue && updatedValueObject.oldValue.length == 0) || !updatedValueObject.oldValue) &&
                updatedValueObject.newValue &&
                updatedValueObject.newValue.length > 0
              ) {
                const documentNames = this.taskService.getDocumentsName(updatedValueObject.newValue);
                logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.DOCUMENTS
                  } <b
">${documentNames.join(', ')}</b>`;
              }
              // if oldvalue has data and newvalue is empty array, => doc is removed
              else if (
                updatedValueObject.oldValue &&
                updatedValueObject.oldValue.length > 0 &&
                updatedValueObject.newValue &&
                updatedValueObject.newValue.length == 0
              ) {
                const documentNames = this.taskService.getDocumentsName(updatedValueObject.oldValue);
                logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${TASK_CHANGE_LOG_CONSTANTS.DOCUMENTS
                  } <b
">${documentNames.join(', ')}</b>`;
              }
              // check if newValue array length is greater than oldValue array length, => new docs are added, with old ones
              else if (
                updatedValueObject.oldValue &&
                updatedValueObject.oldValue.length > 0 &&
                updatedValueObject.newValue &&
                updatedValueObject.newValue.length > 0 &&
                updatedValueObject.newValue.length > updatedValueObject.oldValue.length
              ) {
                // find new docs which are not in oldValue array
                const newDocs = updatedValueObject.newValue.filter((fileName: string) => !updatedValueObject.oldValue.includes(fileName));
                if (newDocs && newDocs.length > 0) {
                  const documentNames = this.taskService.getDocumentsName(newDocs);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.DOCUMENTS
                    } <b
">${documentNames.join(', ')}</b>`;
                }
                // find old docs which are removed
                const oldDocs = updatedValueObject.oldValue.filter((fileName: string) => !updatedValueObject.newValue.includes(fileName));
                if (oldDocs && oldDocs.length > 0) {
                  const documentNames = this.taskService.getDocumentsName(oldDocs);
                  logStatement2 = `${logStatement2} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${TASK_CHANGE_LOG_CONSTANTS.DOCUMENTS
                    } <b
">${documentNames.join(', ')}</b>`;
                  isLogStatement2 = true;
                }
              }
              // check if oldValue array length is greater than newValue array length, documents are removed
              else if (
                updatedValueObject.oldValue &&
                updatedValueObject.oldValue.length > 0 &&
                updatedValueObject.newValue &&
                updatedValueObject.newValue.length > 0 &&
                updatedValueObject.oldValue.length > updatedValueObject.newValue.length
              ) {
                // find old docs which are removed
                const removedDocs = updatedValueObject.oldValue.filter((fileName: string) => !updatedValueObject.newValue.includes(fileName));
                if (removedDocs && removedDocs.length > 0) {
                  const documentNames = this.taskService.getDocumentsName(removedDocs);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${TASK_CHANGE_LOG_CONSTANTS.DOCUMENTS
                    } <b
">${documentNames.join(', ')}</b>`;
                }
                // find new docs which are added
                const addedDocs = updatedValueObject.newValue.filter((fileName: string) => !updatedValueObject.oldValue.includes(fileName));
                if (addedDocs && addedDocs.length > 0) {
                  const documentNames = this.taskService.getDocumentsName(addedDocs);
                  logStatement2 = `${logStatement2} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.DOCUMENTS
                    } <b
">${documentNames.join(', ')}</b>`;
                  isLogStatement2 = true;
                }
              }
              // check if oldValue and newValue are of same length, => documents are removed, documents are added
              else if (
                updatedValueObject.oldValue &&
                updatedValueObject.oldValue.length > 0 &&
                updatedValueObject.newValue &&
                updatedValueObject.newValue.length > 0 &&
                updatedValueObject.oldValue.length == updatedValueObject.newValue.length
              ) {
                const removedDocsNames = this.taskService.getDocumentsName(updatedValueObject.oldValue);
                const addedDocsNames = this.taskService.getDocumentsName(updatedValueObject.newValue);
                logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${TASK_CHANGE_LOG_CONSTANTS.DOCUMENTS
                  } <b
">${removedDocsNames.join(', ')}</b>`;
                logStatement2 = `${logStatement2} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.DOCUMENTS
                  } <b
">${addedDocsNames.join(', ')}</b>`;
                isLogStatement2 = true;
              }
            } else {
              if (keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.SUBSCRIBERS.toLowerCase()) {
                if (this.projectTeamData && this.projectTeamData.length > 0) {
                  if (updatedValueObject.oldValue && updatedValueObject.oldValue.length > 0) {
                    const oldValues: string[] = [];
                    updatedValueObject.oldValue.forEach((userId: string | number) => {
                      if (userId) {
                        const userObject = this.projectTeamData.find((userObject: ProjectTeamMember) => userObject.id === userId);
                        if (userObject) {
                          oldValues.push(userObject.name || '');
                        }
                      }
                    });
                    if (oldValues && oldValues.length > 0) {
                      updatedValueObject.oldValue = oldValues;
                    }
                  }
                  if (updatedValueObject.newValue && updatedValueObject.newValue.length > 0) {
                    const newValues: string[] = [];
                    updatedValueObject.newValue.forEach((userId: string | number) => {
                      if (userId) {
                        const userObject = this.projectTeamData.find((userObject: ProjectTeamMember) => userObject.id === userId);
                        if (userObject) {
                          newValues.push(userObject.name || '');
                        }
                      }
                    });
                    if (newValues && newValues.length > 0) {
                      updatedValueObject.newValue = newValues;
                    }
                  }
                  isSubscribersChanged = true;
                }
              }
              // if field name is status and old value is null, (status added first time) then set logstatement action to 'added'
              if (keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.STATUS.toLowerCase()) {
                if (updatedValueObject.oldValue == null) {
                  // find status object from taskStatusList
                  if (this.taskStatusList && this.taskStatusList.length > 0) {
                    const statusObject = this.findStatusFromTaskStatusList(updatedValueObject.newValue.toString());
                    if (statusObject) {
                      logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${CHANGE_LOG_FIELDS_CONSTANTS.STATUS} <b
">${statusObject.name}</b>`;
                    }
                  }
                }
                // if field name is status and has old value and new value then status is updated
                else if (updatedValueObject.oldValue && updatedValueObject.newValue) {
                  // find status object from taskStatusList
                  if (this.taskStatusList && this.taskStatusList.length > 0) {
                    const oldStatusObject: any = this.findStatusFromTaskStatusList(updatedValueObject.oldValue.toString());
                    const newStatusObject: any = this.findStatusFromTaskStatusList(updatedValueObject.newValue.toString());
                    if (oldStatusObject && newStatusObject) {
                      logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${CHANGE_LOG_FIELDS_CONSTANTS.STATUS} from <b
">${oldStatusObject.title}</b> to <b
">${newStatusObject.title}</b>`;
                    }
                  }
                }
              }
              // if field name is description
              else if (keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.DESCRIPTION.toLowerCase()) {
                // if description is changed
                if (updatedValueObject.oldValue && updatedValueObject.newValue) {
                  updatedValueObject.oldValue = this.addStyleToDescriptionTag(updatedValueObject.oldValue);
                  updatedValueObject.newValue = this.addStyleToDescriptionTag(updatedValueObject.newValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${keyName}`;
                  // console.log('TASK_CHANGE_LOG_CONSTANTS.CHANGED: ', TASK_CHANGE_LOG_CONSTANTS.CHANGED);
                  // console.log('keyName: ', keyName);
                  //                   logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${keyName} from <div>
                  // ${updatedValueObject.oldValue} </div> to 
                  // <div>
                  // ${updatedValueObject.newValue} </div>`;
                  key = "description"
                  old_value = updatedValueObject.oldValue
                  new_value = updatedValueObject.newValue
                }
                // check if description is added
                else if (!updatedValueObject.oldValue && updatedValueObject.newValue) {
                  updatedValueObject.newValue = this.addStyleToDescriptionTag(updatedValueObject.newValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${keyName}`;
                  // console.log('TASK_CHANGE_LOG_CONSTANTS.CHANGED: ', TASK_CHANGE_LOG_CONSTANTS.CHANGED);
                  // console.log('keyName: ', keyName);
                  //                   logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${keyName} <b
                  // ">${updatedValueObject.newValue}</b>`;
                  key = "description"
                  old_value = ""
                  new_value = updatedValueObject.newValue
                }
              }
              // if field name is task start date || task due data
              else if (
                keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.START_DATE.toLowerCase() ||
                keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.DUE_DATE.toLowerCase()
              ) {
                // check if start date is added or changed
                if (!updatedValueObject.oldValue && updatedValueObject.newValue) {
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${keyName} <b
">${updatedValueObject.newValue}</b>`;
                } else if (updatedValueObject.oldValue && updatedValueObject.newValue) {
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${keyName} from <b>">${updatedValueObject.oldValue}</b> to <b">${updatedValueObject.newValue}</b>`;
                }
              }
              // if field name is labels and has no old value then lable(s) is(are) added
              else if (keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.LABELS.toLowerCase()) {
                // check if labels are added for the first time
                if (
                  updatedValueObject.oldValue &&
                  updatedValueObject.oldValue.length == 0 &&
                  updatedValueObject.newValue &&
                  updatedValueObject.newValue.length > 0
                ) {
                  const addedLabelsList = this.getLabelNames(updatedValueObject.newValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.LABELS
                    } <b
">${addedLabelsList.join(', ')}</b>`;
                }
                // check if all labels have been removed
                if (
                  updatedValueObject.oldValue &&
                  updatedValueObject.oldValue.length > 0 &&
                  updatedValueObject.newValue &&
                  updatedValueObject.newValue.length == 0
                ) {
                  const removedLabelsList = this.getLabelNames(updatedValueObject.oldValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${TASK_CHANGE_LOG_CONSTANTS.LABELS
                    } <b
">${removedLabelsList.join(', ')}</b>`;
                }
                // only changed
                else if (
                  updatedValueObject.oldValue &&
                  updatedValueObject.oldValue.length > 0 &&
                  updatedValueObject.newValue &&
                  updatedValueObject.newValue.length > 0
                ) {
                  const oldLableList = this.getLabelNames(updatedValueObject.oldValue);
                  const newLabelList = this.getLabelNames(updatedValueObject.newValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${TASK_CHANGE_LOG_CONSTANTS.LABELS
                    } from <b
">${oldLableList.join(', ')}</b> to <b
">${newLabelList.join(', ')}</b>`;
                }
              }
              // check if field name is section
              else if (keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.SECTION.toLowerCase()) {
                // check if section is added or removed
                if (!updatedValueObject.oldValue && updatedValueObject.newValue) {
                  const addedSectionName = this.getSectionName(+updatedValueObject.newValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${keyName} <b
">${addedSectionName}</b>`;
                } else if (updatedValueObject.oldValue && !updatedValueObject.newValue) {
                  const removedSectionName = this.getSectionName(+updatedValueObject.oldValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${keyName} <b
">${removedSectionName}</b>`;
                } else if (updatedValueObject.oldValue && updatedValueObject.newValue) {
                  // section is changed
                  const oldSectionName = this.getSectionName(+updatedValueObject.oldValue);
                  const newSectionName = this.getSectionName(+updatedValueObject.newValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${keyName} from <b
">${oldSectionName}</b> to <b
">${newSectionName}</b>`;
                }
              } else if (keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.PROJECT_ID.toLowerCase()) {
                if (this.projectNameList && this.projectNameList.length > 0) {
                  const oldProjectName = this.getProjectName(+updatedValueObject.oldValue);
                  const newProjectName = this.getProjectName(+updatedValueObject.newValue);
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${keyName} from <b
                  ">${oldProjectName}</b> to <b
                  ">${newProjectName}</b>`;
                }
              } else if (keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.STATE.toLowerCase()) {
                logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${CHANGE_LOG_FIELDS_CONSTANTS.STATUS} from <b
                ">${updatedValueObject.oldValue}</b> to <b
                ">${updatedValueObject.newValue}</b>`;
              } else if (keyName.toLowerCase() == CHANGE_LOG_FIELDS_CONSTANTS.EXTERNAL_LINK.toLowerCase()) {
                // check if external link is added
                if (!updatedValueObject.oldValue && updatedValueObject.newValue) {
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${CHANGE_LOG_FIELDS_CONSTANTS.EXTERNAL_LINK} <b
                  ">${updatedValueObject.newValue}</b>`;
                } else if (updatedValueObject.oldValue && !updatedValueObject.newValue) {
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${CHANGE_LOG_FIELDS_CONSTANTS.EXTERNAL_LINK} <b
                  ">${updatedValueObject.oldValue}</b>`;
                } else if (
                  updatedValueObject.oldValue &&
                  updatedValueObject.newValue &&
                  updatedValueObject.oldValue !== updatedValueObject.newValue
                ) {
                  logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${keyName} from <b">${updatedValueObject.oldValue}</b> to <b">${updatedValueObject.newValue}</b>`;
                }
              } else {
                if (isSubscribersChanged) {
                  // check if oldvalue is there, means subscribers changed
                  if (updatedValueObject.oldValue && updatedValueObject.oldValue.length > 0) {
                    // check if all subscribers are removed
                    if (!updatedValueObject.newValue || (updatedValueObject.newValue && updatedValueObject.newValue.length == 0)) {
                      logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${TASK_CHANGE_LOG_CONSTANTS.SUBSCRIBERS}`;
                    } else if (updatedValueObject.newValue.every((elem) => updatedValueObject.oldValue.includes(elem))) {
                      logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${TASK_CHANGE_LOG_CONSTANTS.SUBSCRIBERS
                        } <b
                              ">${updatedValueObject.oldValue.filter((item) => !updatedValueObject.newValue.includes(item)).join(', ')}</b>`;
                    } else if (updatedValueObject.oldValue.every((elem) => updatedValueObject.newValue.includes(elem))) {
                      logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.SUBSCRIBERS
                        } <b
                              ">${updatedValueObject.newValue.filter((item) => !updatedValueObject.oldValue.includes(item)).join(', ')}</b>`;
                    } else {
                      logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${TASK_CHANGE_LOG_CONSTANTS.SUBSCRIBERS
                        } from <b
">${updatedValueObject.oldValue.join(', ')}</b> to <b
">${updatedValueObject.newValue.join(', ')}</b>`;
                    }
                  } else {
                    // otherwise subscribers added
                    logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.SUBSCRIBERS
                      } <b
">${updatedValueObject.newValue.join(', ')}</b>`;
                  }
                } else {
                  if (updatedValueObject.oldValue && updatedValueObject.newValue) {
                    logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CHANGED} ${keyName} from <b>${updatedValueObject.oldValue}</b> to <b>${updatedValueObject.newValue}</b>`;
                  } else if (updatedValueObject.oldValue && !updatedValueObject.newValue) {
                    logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.REMOVED} ${keyName} <b>${updatedValueObject.oldValue}</b>`;
                  } else if (!updatedValueObject.oldValue && updatedValueObject.newValue) {
                    logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${keyName} <b>${updatedValueObject.newValue}</b>`;
                  }
                }
              }

              isSubscribersChanged ? (isSubscribersChanged = false) : '';
              if (
                logStatement &&
                logStatement !== '' &&
                logStatement !==
                `<b
">${TASK_CHANGE_LOG_CONSTANTS.YOU}</b>` &&
                logStatement !==
                `<b
">${changeLogObject.user_name}</b>`
              ) {
                logStatement = this.sanitizer.bypassSecurityTrustHtml(logStatement) || '';
                this.taskChangeLogBindList.push({
                  logStatement,
                  logTime,
                  key,
                  old_value,
                  new_value,
                });
              }
              logStatement = '';
            }
          });
        }
      } else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.TASK_CREATED.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.CREATED} ${TASK_CHANGE_LOG_CONSTANTS.TASK}`;
      }
      // check if timer is started
      else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.TIMER_START.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.STARTED_TIMER} ${TASK_CHANGE_LOG_CONSTANTS.FOR_THIS_TASK}`;
      }
      // check if timer is stopped
      else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.TIMER_STOP.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.STOPPED_TIMER} ${TASK_CHANGE_LOG_CONSTANTS.FOR_THIS_TASK}`;
      } else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.TIMER_HAS_STOPPED.toLowerCase()) {
        key = ""
        logStatement = `${TASK_CHANGE_LOG_CONSTANTS.TIMER_HAS_STOPPED}`;
      }
      // check if COMMENTS_ADDED
      else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.COMMENT_ADDED.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.COMMENT}`;
      }
      // check if comment updated
      else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.COMMENT_EDITED.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.EDITED} ${TASK_CHANGE_LOG_CONSTANTS.COMMENT}`;
      }
      // check if comment deleted
      else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.COMMENT_DELETED.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.DELETED} ${TASK_CHANGE_LOG_CONSTANTS.COMMENT}`;
      }
      // check if commit added
      else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.COMMIT_ADDED.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.ADDED} ${TASK_CHANGE_LOG_CONSTANTS.COMMIT}`;
      }
      // check if commit updated
      else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.COMMIT_EDITED.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.EDITED} ${TASK_CHANGE_LOG_CONSTANTS.COMMIT}`;
      }
      // check if commit deleted
      else if (changeLogObject.action.toLowerCase() == TASK_CHANGE_LOG_CONSTANTS.COMMIT_DELETED.toLowerCase()) {
        key = ""
        logStatement = `${logStatement} ${TASK_CHANGE_LOG_CONSTANTS.DELETED} ${TASK_CHANGE_LOG_CONSTANTS.COMMIT}`;
      }
      if (
        logStatement &&
        logStatement !== '' &&
        logStatement !==
        `<b
">${TASK_CHANGE_LOG_CONSTANTS.YOU}</b>` &&
        logStatement !==
        `<b
">${changeLogObject.user_name}</b>`
      ) {
        logStatement = this.sanitizer.bypassSecurityTrustHtml(logStatement) || '';
        this.taskChangeLogBindList.push({
          logStatement,
          logTime,
          key,
          old_value,
          new_value,
        });
      }
      if (isLogStatement2) {
        logStatement2 = this.sanitizer.bypassSecurityTrustHtml(logStatement2) || '';
        this.taskChangeLogBindList.push({
          logStatement: logStatement2,
          logTime,
          key,
          old_value,
          new_value,
        });
        isLogStatement2 = false;
      }
    });
    // console.log('this.taskChangeLogBindList:', this.taskChangeLogBindList);
  }

  // this method will return status object from status list of particular project
  findStatusFromTaskStatusList(value: string) {
    return this.taskStatusList.find((tempStatusObj: taskStatusListModel) => tempStatusObj.id === +value);
  }

  // This method will add style to p tag for description as it comes from ngx-quill editor
  addStyleToDescriptionTag(value: any) {
    value = value.replace(/<p><br><\/p>/g, '');
    return value.toString().replace(/<p>/g, '<p>');
  }

  // set user = 'You' if action is performed by logged in user, otherwise set user's name
  getActionPerformedByUser(changeLogObject: TaskChangeLogResponseObjectModel) {
    const logStatementObject: { logStatement: string; logStatement2: string } = { logStatement: '', logStatement2: '' };
    if (changeLogObject.user_id == this.loggedInUserId) {
      logStatementObject.logStatement = `<b
">${TASK_CHANGE_LOG_CONSTANTS.YOU}</b>`;
      logStatementObject.logStatement2 = `<b
">${TASK_CHANGE_LOG_CONSTANTS.YOU}</b>`;
    } else {
      logStatementObject.logStatement =
        `<b
">${changeLogObject.user_name}</b>` || '';
      logStatementObject.logStatement2 =
        `<b;
">${changeLogObject.user_name}</b>` || '';
    }
    return logStatementObject;
  }

  // returns label list with title
  getLabelNames(labelArray: any[]): string[] {
    const labelList: string[] = [];
    if (this.labelsList && this.labelsList.length > 0 && labelArray && labelArray.length > 0) {
      labelArray.forEach((labelObject: TaskLabelModel) => {
        const findLabelObject = this.labelsList.find((tempLabelObject: TaskLabelModel) => +tempLabelObject.id == +labelObject);
        if (findLabelObject) {
          labelList.push(findLabelObject.title);
        }
      });
    }
    return labelList;
  }

  // returns section name
  getSectionName(sectionId: number): string {
    let sectionName = '';
    if (this.sectionsList && this.sectionsList.length > 0) {
      sectionName = this.sectionsList.find((sectionObject: SectionObjectModel) => +sectionObject.id == +sectionId)?.title || '';
    }
    return sectionName;
  }

  // returns project name from projectnamelist array based on project id
  getProjectName(projectId: number) {
    return this.projectNameList.find((projectObject: ProjectNameModel) => +projectObject.id === projectId)?.name;
  }

  // this method emits whenever load more button is clicked
  onLoadMoreChangeLogs() {
    this.emitLoadMoreEvent.emit({ loadMoreRecords: true });
  }

  /////Open Model /////

  modelOnDescription(statement: any, old_value: any, new_value: any) {
    if (old_value === "") {
      this.descriptionStatement = `${statement?.changingThisBreaksApplicationSecurity} <br><b>${new_value}</b>`;
      this.descriptionStatement = this.sanitizer.bypassSecurityTrustHtml(this.descriptionStatement) || '';
    } else {
      this.descriptionStatement = `${statement?.changingThisBreaksApplicationSecurity} from <br><div>
      ${old_value} </div> <b>to</b> 
      <div>
      ${new_value} </div>`;
      this.descriptionStatement = this.sanitizer.bypassSecurityTrustHtml(this.descriptionStatement) || '';
    }
    // console.log('this.descriptionStatement: ', this.descriptionStatement);
    this.dialogRef = this.dialog.open(this.description, {
      hasBackdrop: true,
      disableClose: true,
    });
  }

  closeModel() {
    this.dialogRef.close();
  }
}
