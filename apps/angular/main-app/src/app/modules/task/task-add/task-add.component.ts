/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, Renderer2, HostListener } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalService } from '../../../core/services/common/global.service';
import { ReplaySubject, Subject, Subscription, interval, takeUntil } from 'rxjs';
import {
  PostTaskSectionModel,
  PostTaskSectionResponseModel,
  ProjectNameModel,
  ProjectTeam,
  ProjectTeamMember,
  SectionObjectModel,
  SectionResponseModel,
  TaskChangeLogListToBindModel,
  TaskChangeLogRequestModel,
  TaskChangeLogResponseModel,
  TaskChangeLogResponseObjectModel,
  TaskCreatedUpdatedLogModel,
  TaskLabelModel,
  customFieldToBeUpdatedModel,
  customFieldsModel,
  taskPriorityListEnumModel,
  taskStateListEnumModel,
  taskStatusListModel,
  taskTypeListEnumModel,
} from '../../../core/model/task/task.model';
import { Task_Prioriry_Enum, Task_State_Enum, Task_Type_Enum } from '@tms-workspace/enum-data';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { ProjectsRequestDataModel } from '../../../core/model/task/task.model';
import { UserService } from '../../../core/services/module/users/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { environment } from './../../../../environments/environment';
import moment from 'moment';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import {
  CUSTOM_FIELDS_CONSTANTS,
  DATE_FORMAT_CONSTANTS,
  ERROR_MESSAGE_CONSTANTS,
  CUSTOM_FIELD_TYPE_CONSTANTS,
  DEFAULT_LABEL_COLOR_CONSTANTS,
  TASK_REQUEST_KEYS_CONSTANTS,
  PERMISSION_CONSTANTS,
  MODULE_CONSTANTS,
  ACTION_CONSTANTS,
  CREATE_MESSAGES_IN_POPUP,
  PROJECT_ID_QUERY_PARAM_CONSTANT,
  TEMP_CONSTANT,
  QUICK_TASK_ERROR_MESSAGE,
  TASK_DETAIL_ROUTE,
} from '../../../core/services/common/constants';
import 'mousetrap';
import Mousetrap from 'mousetrap';
import { Encryption } from '@tms-workspace/encryption';
import 'quill-mention';
import Quill from 'quill';
import { PostCommentRequestModel } from '../../../core/model/comment/comment.model';
import { CommentService } from '../../../core/services/module/comments/comment.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { PostCommitRequestModel } from '../../../core/model/commit/commit.model';
import { CommitService } from '../../../core/services/module/commit/commit/commit.service';
import { CommentsComponent } from '../comments/comments.component';
import { CommitsComponent } from '../commits/commits.component';
import { MatDatepicker } from '@angular/material/datepicker';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { Utility } from '../../../core/utilities/utility';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'main-app-task-add',
  templateUrl: './task-add.component.html',
  styleUrls: ['./task-add.component.scss'],
})
export class TaskAddComponent implements OnInit, OnDestroy, AfterViewInit {
  //#region properties
  name = 'ng2-ckeditor';
  ckeConfig: any;
  mycontent: any;
  log: any = '';
  @ViewChild('ckeditor') ckeditor: any;
  addTaskForm: FormGroup;
  addSubTaskForm: FormGroup;
  attachedDocuments: File[] | any[] = [];
  subscriptions: Subscription[] = [];
  tempLabelStorage: any = [];
  availableProjectLabels: any = [];
  filteredAvailableLabels: any = [];
  isOverlayOpenForAssignTo = false;
  isOverlayOpenForAssignedBy = false;
  isOverlayOpenForReportTo = false;
  // isOverlayOpenForPriority = false;
  isOverlayTaskStatus = false;
  isOverlayOpenForETA = false;
  isOverlayTaskState = false;
  isTaskSubmitted = false;
  isOverlayOpenForSections = false;
  isOverlayOpenForTaskLabels = false;
  isOverlayOpenForLabelPopup = false;
  isTaskStartedByMultipleUsers = false;
  isSectionControlVisible = false;
  isSectionControlFocusedOut = true;
  isDueDateControlVisible = false;
  isStartDateControlVisible = false;
  isAssignToMeVisible = true;
  isShowParentTaskListModal = false;
  isExternalTaskLinkControlVisible = false;
  openQuickTaskLabelsSection = false;
  isLabelsChanged = false;
  projectsDataList: any = [];
  taskLabels: TaskLabelModel[] = [];
  taskPriorityEnum = Task_Prioriry_Enum;
  taskTypeEnum = Task_Type_Enum;
  taskStateEnum = Task_State_Enum;
  taskPriorityList: taskPriorityListEnumModel[] = [];
  taskTypeList: taskTypeListEnumModel[] = [];
  // taskStateList: taskStateListEnumModel[] = [];
  taskStatusList: any[] = [];
  getProjectsRequestModel!: ProjectsRequestDataModel;
  projectNameList: ProjectNameModel[] = [];
  projectTeam: any;
  projectTeamMembers: ProjectTeam[] = [];
  reportToBindList: ProjectTeamMember[] = [];
  descriptiveFields: customFieldsModel[] = [];
  contextFields: customFieldsModel[] = [];
  sectionsList: SectionObjectModel[] = [];
  taskCreatedUpdatedObject!: TaskCreatedUpdatedLogModel;
  createSectionForMessage = CREATE_MESSAGES_IN_POPUP.CREATE_SECTION_FOR;
  baseURL = environment.base_url;
  selectedProject: any;
  color = '#800101';
  toggle = false;
  isOverlayOpenForSubscriber = false;
  presetColors: string[];
  taskTeamMemberSource = interval(200);
  taskTeamMemberSubscription!: Subscription;
  selectSectionSource = interval(100);
  selectSectionSubscription!: Subscription;
  dueDatePickerSource = interval(100);
  dueDatePickerSubscription!: Subscription;
  startDatePickerSource = interval(100);
  startDatePickerSubscription!: Subscription;
  taskBaseURL = environment.task_base_url;
  deletedDocuments: string[] = [];
  customFieldsToBeUpdatedList: customFieldToBeUpdatedModel[] = [];
  atValues: { id: number; value: string }[] = [];
  quill!: Quill;
  QuillConfiguration = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'], // link and image, video
      ['clean'], // remove formatting button
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ font: [] }],
      [{ align: [] }],
    ],
    mention: {
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      mentionDenotationChars: ['@', '#'],
      source: (searchTerm: any, renderList: any, mentionChar: any) => {
        let values;
        if (mentionChar === '@') {
          values = this.atValues;
        }
        if (searchTerm.length === 0) {
          renderList(values, searchTerm);
        } else {
          const matches = [];
          if (values && values.length > 0) {
            for (let i = 0; i < values.length; i++) if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) matches.push(values[i]);
            renderList(matches, searchTerm);
          }
        }
      },
    },
  };
  isSubscriberModified = false;
  isDocumentsModified = false;
  quillConfiguration = this.QuillConfiguration;
  timerInterval = 1000;
  timerSource = interval(1000);
  timerSourceSubscription!: Subscription;
  actionPermissionData: any;
  isDisableTaskStateOverlay = false;
  isDisableTaskStatusOverlay = false;
  isDisableAssignedToOverlay = false;
  isDisableAssignedByOverlay = false;
  isDisableReportToOverlay = false;
  isDisableTaskSubscribersOverlay = false;
  isDisableTaskPriorityOverlay = false;
  isDisableETAOverlay = false;
  isDisableDocumentsUpload = false;
  isShowCreateNewSection = false;
  taskChangeLogTotalRecords = 0;
  completedString = 'Completed';
  todoString = 'To Do';
  notCompletedTaskSVGPath = '/assets/images/tick-square.svg';
  completedTaskSVGPath = '/assets/images/reopen-task.svg';
  notEligibleForThisActionErrorMessage = 'You can not perform this action, because this task is not assigned to you';
  loggedInUserId!: number;
  createLabelForMessage = CREATE_MESSAGES_IN_POPUP.CREATE_LABEL_FOR;
  taskChangeLogsResponseList: TaskChangeLogResponseObjectModel[] = [];
  taskChangeLogBindList: TaskChangeLogListToBindModel[] = [];
  temporaryTaskLabels: any[] = [];
  projectIdFromURL!: number | string;
  taskChangeLogRequestModel: TaskChangeLogRequestModel = new TaskChangeLogRequestModel();
  temporaryCommentsToBePosted: any = [];
  temporaryCommitsToBePosted: any = [];
  taskStartedByUsersList: any = [];
  @ViewChild('commentsComponentReference') commentsComponent!: CommentsComponent;
  @ViewChild('commitsComponentReference') commitsComponent!: CommitsComponent;
  @ViewChild('sectionselect') sectionSelectControl!: any;
  @ViewChild('taskDueDatePicker') dueDatePickerControl!: MatDatepicker<Date>;
  @ViewChild('taskStartDatePicker') startDatePickerControl!: MatDatepicker<Date>;
  @ViewChild('container') container: any;
  taskTitleMinLengthErrorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_MINLENGTH;
  taskTitleMaxLengthErrorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_MAXLENGTH;
  taskTitleRequiredErrorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_REQUIRED;

  projectSearchControl = new FormControl();
  sectionSearchControl = new FormControl();

  public filteredProjects: ReplaySubject<{ id: number; name: string; key: string }[]> = new ReplaySubject<
    { id: number; name: string; key: string }[]
  >(1);

  public filteredSections: ReplaySubject<{ id: number; title: string }[]> = new ReplaySubject<{ id: number; title: string }[]>(1);
  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();
  public return_url = '/tasks/list';
  public isTaskStateDisabled = false;
  createdTaskId = null;

  public isResponsiblePerson = false;
  statusSelectionOpen = false;
  selectedStatusToDisplay: any = '';
  isStatusSelectionDisabled = true;
  //#endregion
  constructor(
    private globalService: GlobalService,
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private router: Router,
    private dialog: MatDialog,
    private spinnerService: SpinnerService,
    private route: ActivatedRoute,
    private commentService: CommentService,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private commitService: CommitService
  ) {
    // console.log('this.subscriptions', this.subscriptions);
    this.presetColors = this.globalService.presetColors;
    this.addTaskForm = this.initializeAddTaskForm();
    this.addSubTaskForm = this.initializeAddSubTaskForm();
    this.checkIfURLHasProjectId();
  }
  routerSubscription!: Subscription;
  onCurrentRoute = false;
  ngOnInit(): void {
    window.scroll(0, 0);
    this.ckeConfig = {
      toolbar: [
        ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-'],
        ['Undo', 'Redo'],
        ['NumberedList', 'BulletedList', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
        ['Image', 'Table'],
        ['Styles', 'Format', 'Font', 'FontSize'],
        ['TextColor', 'BGColor'],
      ],
      extraPlugins: 'uploadimage',
      uploadUrl: `${environment.base_url}project/upload/file`,

      // Configure your file manager integration. This example uses CKFinder 3 for PHP.
      filebrowserBrowseUrl: `${environment.base_url}project/upload/file`,
      filebrowserImageBrowseUrl: `${environment.base_url}project/upload/file`,
      filebrowserUploadUrl: `${environment.base_url}project/upload/file`,
      filebrowserImageUploadUrl: `${environment.base_url}project/upload/file`,
    };
    this.getProjectsRequestModel = new ProjectsRequestDataModel();
    if (
      this.route.snapshot.queryParams['r_url'] &&
      (this.route.snapshot.queryParams['r_url'] === 'board' || this.route.snapshot.queryParams['r_url'] === 'list')
    ) {
      this.return_url = `/tasks/${this.route.snapshot.queryParams['r_url']}`;
    }else if(
      this.route.snapshot.queryParams['r_url'] &&
      (this.route.snapshot.queryParams['r_url'] === 'dashboard')){
        this.return_url = '/dashboard';
      }
    this.getEnumData();

    this.getProjectsList();
    //this.getProjectsData();
    this.setFieldPermissions();
    this.getLoggedInUser();

    // listen for search field value changes
    this.projectSearchControl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.filterProjects();
    });

    this.sectionSearchControl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.getFilteredSections();
    });

    this.filteredSections.subscribe((response) => {
      if (response.length == 0 && this.sectionSearchControl.value) {
        this.isShowCreateNewSection = true;
      } else {
        this.isShowCreateNewSection = false;
      }
    });

    // close task check unsaved changes

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        /* write your own condition here */
        if (!this.onCurrentRoute && (this.addTaskForm.dirty || this.isLabelsChanged || this.isSubscriberModified || this.isDocumentsModified)) {
          if (confirm('You have unsaved changes. Are you sure you want to leave this page?')) {
            // NA
          } else {
            this.onCurrentRoute = true;
            this.router.navigate(['/tasks/add'], { skipLocationChange: true }).then(() => {
              this.onCurrentRoute = false;
            });
          }
        }
      }
    });
  }

  // listen to Alt + l to open task label overlay
  // @HostListener('window:keydown.tab.t', ['$event'])
  // handleKeyBoardEvent(event: KeyboardEvent) {
  //   console.log('tab t presses');

  //   if (event) {
  //     event.preventDefault();
  //     if (this.isOverlayOpenForETA) {
  //       this.toggleETAOverlay();
  //     }
  //   }
  // }

  // listen to Shift + e to open ETA Overlay
  // @HostListener('window:keydown.Tab.t', ['$event'])
  // handleETAEvent(event: KeyboardEvent) {
  //   if (event) {
  //     event.preventDefault();
  //     if (this.isOverlayOpenForTaskLabels) {
  //     }
  //     this.toggleETAOverlay();
  //   }
  // }

  ngAfterViewInit(): void {
    this.resizableQuillEditor();
    // const mouseTrap = new Mousetrap(this.elementRef.nativeElement);
    // mouseTrap.bind('tab+t', (event: any) => {
    //   event.stopPropagation();
    //   if (this.isOverlayOpenForETA) {
    //     this.toggleETAOverlay();
    //   }
    // });
  }
  resizableQuillEditor() {
    // console.log('this.container: ', this.container);
    // this.container.nativeElement.scrollTop = 0;
    const resizeHandle = document.querySelector('.resize-handle') as HTMLElement;
    // console.log('resizeHandle: ', resizeHandle);
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', this.startResize.bind(this));
    }
  }
  initializeAddSubTaskForm() {
    return this.formBuilder.group({
      subTaskTitle: ['', Validators.required],
      subTaskTags: [''],
      subTaskReporter: [''],
      subTaskAssignedTo: [''],
      subTaskDueDate: [''],
    });
  }

  initializeAddTaskForm() {
    return this.formBuilder.group(
      {
        title: ['', Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(512)])],
        description: [''],
        taskType: ['', Validators.required],
        taskState: [{ name: 'To Do' }],
        taskStatus: ['', Validators.required],
        assignTo: [''],
        assignedBy: [''],
        reportTo: [''],
        taskSubscribers: [''],
        taskPriority: [''],
        taskStartDate: ['', Validators.required],
        taskDueDate: ['', Validators.required],
        estimatedTime: ['', Validators.required],
        project: ['', Validators.required],
        taskLabelControl: [[]],
        descriptiveFormFieldArray: this.formBuilder.array([]),
        contextFormFieldArray: this.formBuilder.array([]),
        section: [''],
        parentTask: [''],
        externalTaskLinkInput: ['', Validators.pattern(this.globalService.URLRegEx)],
      },
      {
        validator: this.validateTaskDueDate('taskStartDate', 'taskDueDate'),
      }
    );
  }

  // custom validator to check if task start date is greater than task due date
  validateTaskDueDate(taskStartDate: string, taskDueDate: string) {
    return (formGroup: FormGroup) => {
      if (formGroup.controls[taskStartDate].value && formGroup.controls[taskDueDate].value) {
        const startDateControlValue = moment(formGroup.controls[taskStartDate].value).format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
        const dueDateControlValue = moment(formGroup.controls[taskDueDate].value).format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
        const isStartDateGreaterThanDueDate = moment(startDateControlValue).isAfter(dueDateControlValue);
        if (isStartDateGreaterThanDueDate) {
          formGroup.controls[taskStartDate].setErrors({
            isStartDateGreaterThanDueDate: true,
          });
        } else {
          formGroup.controls[taskStartDate].setErrors(null);
        }
      }
    };
  }

  getLoggedInUser() {
    const loggedInUser: any = this.userService.getUserDataFromLS();
    if (loggedInUser && loggedInUser.user_id) {
      this.loggedInUserId = loggedInUser.user_id;
    }
  }

  // get Enum data
  getEnumData() {
    // Task priority Enum
    if (this.taskPriorityEnum) {
      Object.values(this.taskPriorityEnum).forEach((task: string) => {
        if (task) {
          this.taskPriorityList.push({ id: this.taskPriorityList.length + 1, name: task, priorityImg: task.toLowerCase() + '-priority.svg' });
        }
      });

      const Normal = this.taskPriorityList.find((list) => list.name == 'Normal');
      this._addTaskForm['taskPriority'].setValue(Normal);
    }
    // Task Type Enum
    if (this.taskTypeEnum) {
      Object.values(this.taskTypeEnum).forEach((taskType: string) => {
        if (taskType) {
          this.taskTypeList.push({ id: this.taskTypeList.length + 1, name: taskType });
        }
      });
    }

    // // Task State Enum
    // if (this.taskStateEnum) {
    //   Object.values(this.taskStateEnum).forEach((taskState: string) => {
    //     if (taskState) {
    //       this.taskStateList.push({ id: this.taskStateList.length + 1, name: taskState });
    //     }
    //   });
    // }
  }

  //#region form getter methods
  get _addTaskForm() {
    return this.addTaskForm.controls;
  }

  get descriptiveFormFieldArray(): any {
    return this.addTaskForm.get('descriptiveFormFieldArray') as FormArray;
  }

  get contextFormFieldArray(): any {
    return this.addTaskForm.get('contextFormFieldArray') as FormArray;
  }

  //#endregion

  filterProjects() {
    if (!this.projectNameList) {
      return;
    }
    // get the search keyword
    let search = this.projectSearchControl.value;
    if (!search) {
      this.filteredProjects.next(this.projectNameList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the projects
    this.filteredProjects.next(this.projectNameList.filter((project) => project.name.toLowerCase().indexOf(search) > -1));
  }

  getFilteredSections() {
    if (!this.sectionsList) {
      return;
    }
    // get the search keyword
    let search = this.sectionSearchControl.value;
    if (!search) {
      this.filteredSections.next(this.sectionsList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter sections
    this.filteredSections.next(this.sectionsList.filter((sectionObject) => sectionObject.title.toLowerCase().indexOf(search) > -1));
  }

  // this method will add and remove subscribers based on the selection of assignto, assignedby, reportto
  setTaskSubscribers(removedUserObject?: any) {
    const taskSubscribers = this._addTaskForm['taskSubscribers'].value || [];
    // set assign to in task subscribers
    const assignToFormControlValue = this._addTaskForm['assignTo'].value || '';
    if (assignToFormControlValue) {
      const findTaskAssignedToIndex = taskSubscribers.findIndex(
        (subscriberObject: any) => subscriberObject.isTaskAssignedTo == true && !subscriberObject.isTaskAssignedBy && !subscriberObject.isTaskReportTo
      );
      if (findTaskAssignedToIndex > -1) {
        if (taskSubscribers[findTaskAssignedToIndex].id != assignToFormControlValue.id) {
          taskSubscribers.splice(findTaskAssignedToIndex, 1);
          assignToFormControlValue.isTaskAssignedTo = true;
          // check if the user already exists in the array,
          const findUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.id == assignToFormControlValue.id);
          if (findUserIndex > -1) {
            taskSubscribers[findUserIndex].isTaskAssignedTo = true;
          } else {
            taskSubscribers.push(assignToFormControlValue);
          }
          taskSubscribers.forEach((subscriberObject: any) => {
            if (assignToFormControlValue.id != subscriberObject.id) {
              delete subscriberObject.isTaskAssignedTo;
            }
          });
        }
      } else {
        assignToFormControlValue.isTaskAssignedTo = true;
        taskSubscribers.forEach((subscriberObject: any) => {
          if (subscriberObject.isTaskAssignedTo) {
            delete subscriberObject.isTaskAssignedTo;
          }
        });
        // check if user does not exist then push in array;
        const findExistingUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.id == assignToFormControlValue.id);
        if (findExistingUserIndex == -1) {
          taskSubscribers.push(assignToFormControlValue);
        } else {
          taskSubscribers[findExistingUserIndex].isTaskAssignedTo = true;
        }
      }
    } else {
      // check if assignedTo is removed
      if (removedUserObject && removedUserObject.isAssignedToRemoved) {
        // find subscriber having isTaskASsignedTo flag = true;
        const findAssignedToUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.isTaskAssignedTo == true);
        if (findAssignedToUserIndex > -1) {
          if (!taskSubscribers[findAssignedToUserIndex].isTaskAssignedBy && !taskSubscribers[findAssignedToUserIndex].isTaskReportTo) {
            taskSubscribers.splice(findAssignedToUserIndex, 1);
          }
        }
      }
    }

    // set assigned by in task subscribers
    const assignedByFormControlValue = this._addTaskForm['assignedBy'].value || '';
    if (assignedByFormControlValue) {
      const findTaskAssignedByIndex = taskSubscribers.findIndex(
        (subscriberObject: any) => subscriberObject.isTaskAssignedBy == true && !subscriberObject.isTaskAssignedTo && !subscriberObject.isTaskReportTo
      );
      if (findTaskAssignedByIndex > -1) {
        if (taskSubscribers[findTaskAssignedByIndex].id != assignedByFormControlValue.id) {
          taskSubscribers.splice(findTaskAssignedByIndex, 1);
          assignedByFormControlValue.isTaskAssignedBy = true;
          // check if user already exists in the array;
          const findUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.id == assignedByFormControlValue.id);
          if (findUserIndex > -1) {
            taskSubscribers[findUserIndex].isTaskAssignedBy = true;
          } else {
            taskSubscribers.push(assignedByFormControlValue);
          }
          taskSubscribers.forEach((subscriberObject: any) => {
            if (assignedByFormControlValue.id != subscriberObject.id) {
              delete subscriberObject.isTaskAssignedBy;
            }
          });
        }
      } else {
        assignedByFormControlValue.isTaskAssignedBy = true;
        taskSubscribers.forEach((subscriberObject: any) => {
          if (subscriberObject.isTaskAssignedBy) {
            delete subscriberObject.isTaskAssignedBy;
          }
        });
        // check if user does not exist then push in array;
        const findExistingUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.id == assignedByFormControlValue.id);
        if (findExistingUserIndex == -1) {
          taskSubscribers.push(assignedByFormControlValue);
        } else {
          taskSubscribers[findExistingUserIndex].isTaskAssignedBy = true;
        }
        // taskSubscribers.push(assignedByFormControlValue);
      }
    } else {
      // check if assignedby is removed
      if (removedUserObject && removedUserObject.isAssignedByRemoved) {
        // find subscriber having isTaskAssignedBy flag = true;
        const findAssignedByUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.isTaskAssignedBy == true);
        if (findAssignedByUserIndex > -1) {
          if (!taskSubscribers[findAssignedByUserIndex].isTaskASsignedTo && !taskSubscribers[findAssignedByUserIndex].isTaskReportTo) {
            taskSubscribers.splice(findAssignedByUserIndex, 1);
          }
        }
      }
    }
    // set report to in task subscribers
    const reportToFormControlValue = this._addTaskForm['reportTo'].value || '';
    if (reportToFormControlValue) {
      const findTaskReportToIndex = taskSubscribers.findIndex(
        (subscriberObject: any) => subscriberObject.isTaskReportTo == true && !subscriberObject.isTaskAssignedTo && !subscriberObject.isTaskAssignedBy
      );
      if (findTaskReportToIndex > -1) {
        if (taskSubscribers[findTaskReportToIndex].id != reportToFormControlValue.id) {
          taskSubscribers.splice(findTaskReportToIndex, 1);
          reportToFormControlValue.isTaskReportTo = true;
          // check if user already exists in the array;
          const findUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.id == reportToFormControlValue.id);
          if (findUserIndex > -1) {
            taskSubscribers[findUserIndex].isTaskReportTo = true;
          } else {
            taskSubscribers.push(reportToFormControlValue);
          }
          taskSubscribers.forEach((subscriberObject: any) => {
            if (reportToFormControlValue.id != subscriberObject.id) {
              delete subscriberObject.isTaskReportTo;
            }
          });
        }
      } else {
        reportToFormControlValue.isTaskReportTo = true;
        taskSubscribers.forEach((subscriberObject: any) => {
          if (subscriberObject.isTaskReportTo) {
            delete subscriberObject.isTaskReportTo;
          }
        });
        // check if user does not exist then push in array;
        const findExistingUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.id == reportToFormControlValue.id);
        if (findExistingUserIndex == -1) {
          taskSubscribers.push(reportToFormControlValue);
        } else {
          taskSubscribers[findExistingUserIndex].isTaskReportTo = true;
        }
      }
    } else {
      // check if reportTo is removed
      if (removedUserObject && removedUserObject.isReportToRemoved) {
        // find subscriber having isTaskReportTo flag = true;
        const findReportToUserIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.isTaskReportTo == true);
        if (findReportToUserIndex > -1) {
          if (!taskSubscribers[findReportToUserIndex].isTaskAssignedBy && !taskSubscribers[findReportToUserIndex].isTaskAssignedTo) {
            taskSubscribers.splice(findReportToUserIndex, 1);
          }
        }
      }
    }
    this.setFormControlValue('taskSubscribers', taskSubscribers);
  }

  removeUserFromTaskSubscribers(subscriberObject: any) {
    const taskSubscribers = this._addTaskForm['taskSubscribers'].value || [];
    if (taskSubscribers && taskSubscribers.length > 0) {
      // find subscriber object which needs to be removed
      const findSubscriberIndex = taskSubscribers.findIndex((tempSubscriberObject: any) => tempSubscriberObject.id == subscriberObject.id);
      if (findSubscriberIndex > -1) {
        taskSubscribers.splice(findSubscriberIndex, 1);
        this.setFormControlValue('taskSubscribers', taskSubscribers);
      }
    }
  }

  // This method will check if logged in used has set assigned to as self then it will
  // hide assign to me link otherwise it will show assign to me link
  checkIsTaskAssignedToSelf() {
    const assignedToFormControlValue = this._addTaskForm['assignTo'].value || '';
    if (assignedToFormControlValue && assignedToFormControlValue.id && this.loggedInUserId) {
      if (this.loggedInUserId !== assignedToFormControlValue.id) {
        this.isAssignToMeVisible = true;
      } else {
        this.isAssignToMeVisible = false;
      }
    }
  }

  //#region get selected values when overlay gets closed
  getSelectedAssignedTo(event: any) {
    if (event) {
      this.setFormControlValue('assignTo', event);
      this.addTaskForm.markAsDirty();
      this.setTaskSubscribers();
      this.checkIsTaskAssignedToSelf();
    }
    this.toggleOverlayAssignedTo();
  }

  getSelectedAssignedBy(event: any) {
    this.setFormControlValue('assignedBy', event);
    this.addTaskForm.markAsDirty();

    this.toggleOverlayForAssignedBy();
    this.setTaskSubscribers();
  }

  getSelectedReportTo(event: any) {
    this.setFormControlValue('reportTo', event);
    this.addTaskForm.markAsDirty();

    this.toggleOverlayForReportTo();
    this.setTaskSubscribers();
  }

  getSelectedProject(event: any) {
    this.setFormControlValue('project', event.value);
    this.addTaskForm.markAsDirty();

    this.populateTaskDataBasedonProjectSelected(event.value);
  }

  getSelectedTaskState(event: any) {
    this.setFormControlValue('taskState', event);
    this.addTaskForm.markAsDirty();

    this.toggleOverlayTaskStateSelection();
  }

  getSelectedTaskStatus(status: any) {
    this.setFormControlValue('taskStatus', status.value);
    this.addTaskForm.markAsDirty();

    //this.toggleOverlayTaskStatusSelection();
  }

  // get selected ETA and calculate to convert into hours and minutes depending on the time entered
  getSelectedETA(event: any) {
    // check if emmited time includes 'Minutes'
    if (event) {
      let ETAToPass = '';
      if (event.includes('')) {
        const ETAArray = event.split(' ') || [];
        let ETAHours: any = '';
        let ETAMinutes: any = '';
        // check if event includes minutes then calculate minutes to hours
        if (event.includes('M')) {
          if (ETAArray[2] && !isNaN(ETAArray[2])) {
            ETAHours = Math.floor(ETAArray[2] / 60);
            ETAMinutes = ETAArray[2] % 60;
          } else if (ETAArray[0] && !isNaN(ETAArray[0])) {
            ETAHours = Math.floor(ETAArray[0] / 60);
            ETAMinutes = ETAArray[0] % 60;
          }
        }
        if (ETAArray && ETAArray.length > 0) {
          // check if hours exist in array;
          if (ETAArray.join('').includes('H')) {
            if (ETAArray[0] && !isNaN(ETAArray[0])) {
              ETAToPass = `${+ETAArray[0] + ETAHours}h`;
            }
          } else if (ETAHours) {
            ETAToPass = `${ETAHours}h`;
          }
          if (ETAArray.join('').includes('M')) {
            ETAToPass = `${ETAToPass} ${ETAMinutes ? ETAMinutes + 'm' : ''}`;
          }
        }
      }
      this.setFormControlValue('estimatedTime', ETAToPass || '');
      this.addTaskForm.markAsDirty();

      this.toggleETAOverlay();
    }
  }

  // set subscriber list in form control
  getSelectedSubscribers(event: any) {
    // check first if subscriber is already selected
    const taskSubscriberList = this._addTaskForm['taskSubscribers'].value || [];
    this.isSubscriberModified = true;
    if (taskSubscriberList && taskSubscriberList.length > 0) {
      const findSubscriberIndex: any = taskSubscriberList.findIndex((taskSubscriberObject: any) => taskSubscriberObject.id == event.id);
      // if task subscriber is already there in array, remove it
      if (findSubscriberIndex > -1) {
        taskSubscriberList.splice(findSubscriberIndex, 1);
      } else {
        // if task subscriber is not found, add it
        taskSubscriberList.push(event);
      }
    } else {
      taskSubscriberList.push(event);
    }
    this.setFormControlValue('taskSubscribers', taskSubscriberList);
    this.addTaskForm.markAsDirty();
  }
  //#endregion

  // on project select, bind assign to, assigned by, report to,
  // bind descriptive and custom fields in formArray
  populateTaskDataBasedonProjectSelected(project: ProjectNameModel) {
    if (project && this.projectsDataList && this.projectsDataList.length > 0) {
      this.selectedProject = this.projectsDataList.find((projectObject: any) => projectObject.id == project.id);
      if (this.selectedProject) {
        //get team members

        this.taskService
          .getProjectsTeamMembers({
            project_id: [this.selectedProject.id],
          })
          .subscribe((response: any) => {
            // find team members
            // console.log(this.loggedInUserId);
            if (response.data && response.data.length && response.data[0].projectTeam) {
              const loggedInUser: any = this.userService.getUserDataFromLS();
              // console.log('response.data: ', response.data);
              this.projectTeam = response.data[0];
              this.projectTeamMembers = response.data[0].projectTeam;
              this.reportToBindList = this.projectTeamMembers.map((teamMemberObject: ProjectTeam) => {
                teamMemberObject.user.name = this.globalService.getFullName(
                  teamMemberObject.user.first_name || '',
                  teamMemberObject.user.last_name || ''
                );
                return teamMemberObject.user;
              });
              this._addTaskForm['taskStartDate'].setValue(new Date())

              if (this.reportToBindList && this.reportToBindList.length > 0) {
                // set team members in mention user list
                // const mentionList: any = [];
                this.reportToBindList.forEach((teamMember: ProjectTeamMember) => {
                  this.atValues.push({
                    id: teamMember.id,
                    value: teamMember.name || '',
                  });
                });

                // set report to person
                if (this.projectTeamMembers && this.projectTeamMembers.length > 0) {
                  // console.log('this.projectTeamMembers: ', this.projectTeamMembers);
                  // console.log('this.projectTeam.responsible_person: ', this.projectTeam);
                  const reportToUser = this.reportToBindList.find(
                    (teamMemberObject: any) => teamMemberObject.id == this.projectTeam.responsible_person
                  );
                  // console.log('reportToUser: ', reportToUser);
                  if (reportToUser) {
                    this.setFormControlValue('reportTo', reportToUser);
                  } else {
                    this.setFormControlValue('reportTo', null);
                  }

                  // This logic used for disabled reportTo control
                  if (reportToUser?.id && reportToUser?.id !== this.loggedInUserId) {
                    this.isResponsiblePerson = true;
                  } else {
                    this.isResponsiblePerson = false;
                  }
                }

                // set assignTo, assignedBy, and Task Subscribers
                // By default logged in user will be in assignTo, assignedBy and in task subscribers only if new task is being created
                if (loggedInUser) {
                  const userRole = loggedInUser.user_role;
                  const assignToUser: any = this.reportToBindList.find(
                    (assignToObject: ProjectTeamMember) => assignToObject.id == loggedInUser.user_id
                  );
                  // console.log('assignToUser: ', assignToUser);
                  if (assignToUser || userRole === 'Super Admin') {
                    const taskSubscribers: ProjectTeamMember[] = [];
                    if (assignToUser) {
                      assignToUser.isTaskAssignedTo = true;
                      this.setFormControlValue('assignTo', assignToUser);
                      this.checkIsTaskAssignedToSelf();
                      assignToUser.isTaskAssignedBy = true;
                      this.setFormControlValue('assignedBy', assignToUser);
                      taskSubscribers.push(assignToUser);
                    } else {
                      // If assignToUser is undefined, clear the form controls
                      this.setFormControlValue('assignTo', null);
                      this.setFormControlValue('assignedBy', null);
                    }
                    // assignToUser.isTaskAssignedTo = true;
                    // this.setFormControlValue('assignTo', assignToUser);
                    // this.checkIsTaskAssignedToSelf();
                    // // delete assignToUser.isTaskAssignedTo;
                    // assignToUser.isTaskAssignedBy = true;
                    // this.setFormControlValue('assignedBy', assignToUser);
                    // taskSubscribers.push(assignToUser);
                    // check if report to person is available
                    const reportToPerson = this._addTaskForm['reportTo'].value;
                    if (reportToPerson) {
                      // check if report to person not already available in task subscribers
                      const findReportToPersonFromTaskSubscribers = taskSubscribers.find(
                        (taskSubscriberObject: any) => taskSubscriberObject.id == reportToPerson.id
                      );
                      if (!findReportToPersonFromTaskSubscribers) {
                        reportToPerson.isTaskReportTo = true;
                        this._addTaskForm['reportTo'].setValue(reportToPerson);
                        taskSubscribers.push(reportToPerson);
                      }
                    }
                    this.setFormControlValue('taskSubscribers', taskSubscribers);
                  }
                }
              }
            }
          });

        // get project custom fields (descriptive fields and context fields);

        this.taskService
          .getProjectsCustomFieldsById({
            project_id: [this.selectedProject.id],
          })
          .subscribe((response: any) => {
            if (
              response.data &&
              response.data.length &&
              response.data[0].projectCustomFieldsMapping &&
              response.data[0].projectCustomFieldsMapping.length > 0
            ) {
              this.descriptiveFields = [];
              this.contextFields = [];
              this.removeCustomFieldsFormArrayControls();
              response.data[0].projectCustomFieldsMapping.forEach((fieldObject: any) => {
                if (fieldObject && fieldObject.customField && fieldObject.customField.fieldType) {
                  fieldObject.customField.custom_field_id = fieldObject.custom_field_id || '';
                  if (fieldObject.customField.fieldType.toLowerCase() === CUSTOM_FIELDS_CONSTANTS.CONTEXT) {
                    this.contextFields.push(fieldObject.customField);
                  } else if (fieldObject.customField.fieldType.toLowerCase() === CUSTOM_FIELDS_CONSTANTS.DESCRIPTIVE) {
                    this.descriptiveFields.push(fieldObject.customField);
                  }
                }
              });
              // create descriptive fields
              if (this.descriptiveFields && this.descriptiveFields.length > 0) {
                this.descriptiveFields.forEach((fieldObject: any) => {
                  fieldObject.type = this.getfieldType(fieldObject.type);
                  const descriptiveFormGroup: FormGroup = this.formBuilder.group({
                    fieldControl: ['', fieldObject.is_required ? Validators.required : ''],
                    otherFieldProperties: [fieldObject],
                  });
                  this.descriptiveFormFieldArray.push(descriptiveFormGroup);
                });
              }
              // create context fields
              if (this.contextFields && this.contextFields.length > 0) {
                this.contextFields.forEach((fieldObject: any) => {
                  fieldObject.type = this.getfieldType(fieldObject.type);
                  const descriptiveFormGroup: FormGroup = this.formBuilder.group({
                    fieldControl: ['', fieldObject.is_required ? Validators.required : ''],
                    otherFieldProperties: [fieldObject],
                  });
                  this.contextFormFieldArray.push(descriptiveFormGroup);
                });
              }
            } else {
              this.descriptiveFields = [];
              this.contextFields = [];
              this.removeCustomFieldsFormArrayControls();
            }
          });

        // prepare status list
        this.prepareStatusList();
        // get labels from particular project
        this.getLabelsByProject();
        // get sections by project
        this.getTaskSectionsFromProject(this.selectedProject.id);
      }
    }
  }

  getTaskSectionsFromProject(projectId: number) {
    // here this.selectedProjectId is section ID
    if (projectId) {
      this.subscriptions.push(
        this.taskService.getTaskSectionsFromProject(Encryption._doEncrypt(projectId.toString())).subscribe({
          next: (response: SectionResponseModel) => {
            if (response) {
              if (response.data && response.data.length > 0) {
                this.sectionsList = response.data;
              } else {
                this.sectionsList = [];
              }
              this.filteredSections.next(this.sectionsList);
            }
          },
          error: (error: any) => {
            console.log('error:', error);
          },
        })
      );
    }
  }

  // remove form controls from form Array
  removeCustomFieldsFormArrayControls() {
    while (this.descriptiveFormFieldArray.length != 0) {
      this.descriptiveFormFieldArray.removeAt(0);
    }
    while (this.contextFormFieldArray.length != 0) {
      this.contextFormFieldArray.removeAt(0);
    }
  }

  getSelectedSubTaskReporter(data: any) { }

  addNewSubTask() { }

  //handle attached document   -----start-----

  @HostListener('document:dragover', ['$event'])
  @HostListener('drop', ['$event'])
  onDragDropFileVerifyZone(event: any) {
    event.preventDefault();
    event.dataTransfer.effectAllowed = 'none';
    event.dataTransfer.dropEffect = 'none';
  }

  onDragover(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  // Dragleave listener
  onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  // Drop listener
  onDrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();

    if (evt.dataTransfer.files?.length + this.attachedDocuments?.length > 10) {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'You are not allowed to add more than 10 documents.' },
        duration: 45000,
      });
      return;
    }
    this.isDocumentsModified = true;
    for (const file of evt.dataTransfer.files) {
      if (file instanceof File) {
        if (this.attachedDocuments.length > 9) {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'You are not allowed to add more than 10 documents.' },
            duration: 45000,
          });
          return;
        }
        if (this.attachedDocuments.find((item: any) => item.name == file.name)) {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: { message: `A file with the same name has already been uploaded.` },
            duration: 45000,
          });
          return;
        }
        const isValid =
          this.globalService.checkFileSize(file, 5) && this.globalService.checkFileType(file, this.globalService.expectedDocumentsFileTypes);

        if (isValid) {
          this.attachedDocuments.push(file);
        }
      }
    }
  }

  documentFileBrowseHandler(e: any) {
    if (e?.target?.files?.length + this.attachedDocuments?.length > 10) {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'You are not allowed to add more than 10 documents.' },
        duration: 45000,
      });
      return;
    }
    this.isDocumentsModified = true;
    for (const file of e.target.files) {
      if (file instanceof File) {
        if (this.attachedDocuments.length > 9) {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'You are not allowed to add more than 10 documents.' },
            duration: 45000,
          });

          return;
        }
        if (this.attachedDocuments.find((item: any) => item.name == file.name)) {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: { message: `A file with the same name has already been uploaded.` },
            duration: 45000,
          });
          return;
        }
        const isValid =
          this.globalService.checkFileSize(file, 5) && this.globalService.checkFileType(file, this.globalService.expectedDocumentsFileTypes);

        if (isValid) {
          this.attachedDocuments.push(file);
        }
      }
    }
  }

  //handle attached document   -------end---------

  // Make POST API call to create task if form is valid
  onSubmitTask() {
    this.isTaskSubmitted = true;
    if (this.addTaskForm.valid) {
      const formValue = this.addTaskForm.getRawValue();
      const formData = new FormData();
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.PROJECT_ID, this.selectedProject.id.toString() || null);
      formData.append(
        TASK_REQUEST_KEYS_CONSTANTS.PARENT_TASK_ID,
        (formValue.parentTask && formValue.parentTask.id ? formValue.parentTask.id.toString() : '') || null
      );
      formData.append(
        TASK_REQUEST_KEYS_CONSTANTS.PARENT_TASK_TITLE,
        (formValue.parentTask && formValue.parentTask.title ? formValue.parentTask.title.toString() : '') || null
      );
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.TYPE, formValue.taskType || '');
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.TITLE, formValue.title || '');
      if (formValue.description) {
        // if (this.taskService.checkIfEditorHasNoSpace(formValue.description)) {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.DESCRIPTION, formValue.description || '');
        // } else {
        //   formData.append(TASK_REQUEST_KEYS_CONSTANTS.DESCRIPTION, '');
        // }
      } else {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.DESCRIPTION, '');
      }
      if (formValue.taskState && formValue.taskState.name) {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.STATE, formValue.taskState.name.toString().toLowerCase().replaceAll(' ', ''));
      } else {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.STATE, '');
      }
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.STATUS, formValue.taskStatus ? formValue.taskStatus.id || null : null);
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.ASIGNEE, formValue.assignTo ? formValue.assignTo.id.toString() || null : null);
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.ASSIGNED_BY, formValue.assignedBy ? formValue.assignedBy.id.toString() || null : null);
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.REPORTER, formValue.reportTo ? formValue.reportTo.id.toString() || null : null);
      if (formValue.taskLabelControl && formValue.taskLabelControl.length > 0) {
        // remove ids which inclues 'temp'
        formValue.taskLabelControl.map((labelObject: TaskLabelModel) => {
          if (labelObject.id.toString().includes(TEMP_CONSTANT)) {
            labelObject.id = '';
          }
        });
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.LABELS, JSON.stringify(formValue.taskLabelControl || []));
      } else {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.LABELS, JSON.stringify([]));
      }
      if (formValue.taskStartDate) {
        const taskStartDate = moment(formValue.taskStartDate).format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.START_DATE, taskStartDate || JSON.stringify(null));
      } else {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.START_DATE, formValue.xyz || JSON.stringify(null));
      }
      if (formValue.taskDueDate) {
        const taskDueDate = moment(formValue.taskDueDate).format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.DUE_DATE, taskDueDate || JSON.stringify(null));
      } else {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.DUE_DATE, JSON.stringify(null));
      }
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.PRIORITY, formValue.taskPriority ? formValue.taskPriority.name : '');
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.ETA, formValue.estimatedTime || '');
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.SECTION, formValue.section && formValue.section.id ? formValue.section.id.toString() : null);
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.EXTERNAL_LINK, formValue.externalTaskLinkInput || '');
      if (this._addTaskForm['taskSubscribers'].value && this._addTaskForm['taskSubscribers'].value.length > 0) {
        const teamMemberIdArray: number[] = [];
        this._addTaskForm['taskSubscribers'].value.forEach((teamMemberObject: any) => {
          teamMemberIdArray.push(teamMemberObject.id);
        });
        // pass assigned by, reporter id in task subscribers
        if (formValue.assignedBy && formValue.assignedBy.id) {
          if (!teamMemberIdArray.includes(formValue.assignedBy.id)) {
            teamMemberIdArray.push(formValue.assignedBy.id);
          }
        }
        if (formValue.reportTo && formValue.reportTo.id) {
          if (!teamMemberIdArray.includes(formValue.reportTo.id)) {
            teamMemberIdArray.push(formValue.reportTo.id);
          }
        }
        if (teamMemberIdArray && teamMemberIdArray.length > 0) {
          formData.append(TASK_REQUEST_KEYS_CONSTANTS.SUBSCRIBERS, JSON.stringify(teamMemberIdArray || []));
        } else {
          formData.append(TASK_REQUEST_KEYS_CONSTANTS.SUBSCRIBERS, JSON.stringify([]));
        }
      } else {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.SUBSCRIBERS, JSON.stringify([]));
      }
      // append documents, show error if more than 30 files are selected
      if (this.attachedDocuments && this.attachedDocuments.length > 0) {
        this.attachedDocuments.forEach((document: File) => {
          formData.append(TASK_REQUEST_KEYS_CONSTANTS.DOCUMENTS, document);
        });
      } else {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.DOCUMENTS, JSON.stringify([]));
      }
      // append descriptive and context fields values
      if (formValue.descriptiveFormFieldArray && formValue.descriptiveFormFieldArray.length > 0) {
        formValue.descriptiveFormFieldArray.forEach((formControl: any) => {
          if (formControl.fieldControl instanceof Date) {
            const dateValue = moment(formControl.fieldControl).format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
            formData.append(formControl.otherFieldProperties.label, dateValue || '');
          } else if (formControl.otherFieldProperties.type === 'radio') {
            if (formControl.otherFieldProperties.options && formControl.otherFieldProperties.options.length > 0) {
              const selectedOption: { id: number; value: string } = formControl.otherFieldProperties.options.find(
                (optionObject: { id: number; value: string }) => optionObject.value === formControl.fieldControl
              );
              if (selectedOption) {
                formData.append(formControl.otherFieldProperties.label, selectedOption.value || '');
              }
            }
          } else {
            formData.append(formControl.otherFieldProperties.label, formControl.fieldControl.toString() || '');
          }
        });
      }
      if (formValue.contextFormFieldArray && formValue.contextFormFieldArray.length > 0) {
        formValue.contextFormFieldArray.forEach((formControl: any) => {
          if (formControl.fieldControl instanceof Date) {
            const dateValue = moment(formControl.fieldControl).format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
            formData.append(formControl.otherFieldProperties.label, dateValue || '');
          } else if (formControl.otherFieldProperties.type === 'radio') {
            if (formControl.otherFieldProperties.options && formControl.otherFieldProperties.options.length > 0) {
              const selectedOption: { id: number; value: string } = formControl.otherFieldProperties.options.find(
                (optionObject: { id: number; value: string }) => optionObject.value === formControl.fieldControl
              );
              if (selectedOption) {
                formData.append(formControl.otherFieldProperties.label, selectedOption.value || '');
              }
            }
          } else {
            formData.append(formControl.otherFieldProperties.label, formControl.fieldControl.toString() || '');
          }
        });
      }
      // if (this.currentTaskId && this.customFieldsToBeUpdatedList && this.customFieldsToBeUpdatedList.length > 0) {
      //   formData.append(TASK_REQUEST_KEYS_CONSTANTS.TASK_CUSTOM_FIELD_VALUE, JSON.stringify(this.customFieldsToBeUpdatedList || []));
      // }
      this.spinnerService.showSpinner();
      // create task
      this.subscriptions.push(
        this.taskService.postTask(formData).subscribe({
          next: (response: any) => {
            if (response) {
              this.spinnerService.hideSpinner();
              if (response.status && response.success) {
                this.createdTaskId = response.data[0].id;
                this.snackBar.open(response.message || '');
                // check if there are any temporary stored comments then call POST comments API
                if (this.temporaryCommentsToBePosted && this.temporaryCommentsToBePosted.length > 0) {
                  if (response.data && response.data.length > 0 && response.data[0].id) {
                    const requestBody: PostCommentRequestModel = {
                      task_id: response.data[0].id,
                      commentsList: this.temporaryCommentsToBePosted,
                    };

                    // pass true to navigate to task list page
                    this.spinnerService.showSpinner();
                    this.subscriptions.push(
                      this.commentService.postComment(requestBody).subscribe({
                        next: (response: any) => {
                          if (response) {
                            if (response.success) {
                              if (this.temporaryCommitsToBePosted && this.temporaryCommitsToBePosted.length == 0) {
                                this.routerSubscription.unsubscribe();
                                this.navigateToViewTaskTab(this.createdTaskId);
                              }
                            }
                          }
                        },
                        error: (error: any) => {
                          console.log('error:', error);
                        },
                        complete: () => {
                          this.spinnerService.hideSpinner();
                        },
                      })
                    );
                  }
                }
                if (this.temporaryCommitsToBePosted && this.temporaryCommitsToBePosted.length > 0) {
                  if (response.data && response.data.length > 0 && response.data[0].id) {
                    const requestBody: PostCommitRequestModel = {
                      task_id: response.data[0].id,
                      commitList: this.temporaryCommitsToBePosted,
                    };
                    // pass true to navigate to task list page
                    this.spinnerService.showSpinner();
                    this.subscriptions.push(
                      this.commitService.postCommit(requestBody).subscribe({
                        next: (response: any) => {
                          if (response) {
                            if (response.success) {
                              this.onCurrentRoute = true;
                              this.navigateToViewTaskTab(this.createdTaskId);
                            }
                          }
                        },
                        error: (error: any) => {
                          console.log('error:', error);
                        },
                        complete: () => {
                          this.spinnerService.hideSpinner();
                        },
                      })
                    );
                  }
                } else {
                  this.spinnerService.hideSpinner();
                  this.onCurrentRoute = true;
                  this.navigateToViewTaskTab(this.createdTaskId);
                }
              }
            }
          },
          error: (error: any) => {
            this.spinnerService.hideSpinner();
            console.log('error:', error);
          },
        })
      );
    } else {
      this.snackBar.open(ERROR_MESSAGE_CONSTANTS.REQUIRED_AND_INVALID_FORM);
    }
  }

  navigateToTaskList() {
    this.router.navigate([this.return_url]);
  }
  resetSectionField() {
    this._addTaskForm['section'].reset();
  }

  onCloseTask() {
    if (this.addTaskForm.dirty || this.isLabelsChanged || this.isSubscriberModified || this.isDocumentsModified) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: 'You have unsaved changes. Are you sure you want to leave this page?',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.routerSubscription.unsubscribe();
          this.navigateToTaskList();
        }
      });
    } else {
      this.navigateToTaskList();
    }
  }
  navigateToViewTaskTab(taskId: any) {
    const encTaskId = Encryption._doEncrypt(taskId.toString());
    this.router.navigate(['/tasks/view', encTaskId]);
  }

  toggleOverlayAssignedTo() {
    // first check if permissions are granted
    if (!this.isDisableAssignedToOverlay) {
      if (!this.isOverlayOpenForAssignTo) {
        if (!this.selectedProject) {
          this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
        } else {
          this.isOverlayOpenForAssignTo = !this.isOverlayOpenForAssignTo;
        }
      } else {
        this.isOverlayOpenForAssignTo = !this.isOverlayOpenForAssignTo;
      }
    }
  }

  toggleOverlayForAssignedBy() {
    // first check if permissions are granted
    if (!this.isDisableAssignedByOverlay) {
      if (!this.isOverlayOpenForAssignedBy) {
        if (!this.selectedProject) {
          this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
        } else {
          this.isOverlayOpenForAssignedBy = !this.isOverlayOpenForAssignedBy;
        }
      } else {
        this.isOverlayOpenForAssignedBy = !this.isOverlayOpenForAssignedBy;
      }
    }
  }

  toggleOverlayForReportTo() {
    // first check if permissions are granted
    if (!this.isDisableReportToOverlay) {
      if (!this.isOverlayOpenForReportTo) {
        if (!this.selectedProject) {
          this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
        } else {
          this.isOverlayOpenForReportTo = !this.isOverlayOpenForReportTo;
        }
      } else {
        this.isOverlayOpenForReportTo = !this.isOverlayOpenForReportTo;
      }
    }
  }

  // toggleOverlayForPriority() {
  //   // first check if permissions are granted
  //   if (!this.isDisableTaskPriorityOverlay) {
  //     this.isOverlayOpenForPriority = !this.isOverlayOpenForPriority;
  //   }
  // }

  toggleETAOverlay() {
    // first check if permissions are granted
    if (!this.isDisableETAOverlay) {
      this.isOverlayOpenForETA = !this.isOverlayOpenForETA;
    }
  }

  toggleOverlayTaskStateSelection() {
    if (!this.isDisableTaskStateOverlay) {
      this.isOverlayTaskState = !this.isOverlayTaskState;
    }
  }

  clearPriority() {
    this._addTaskForm['taskPriority'].reset();
  }

  // toggleOverlayTaskStatusSelection() {
  //   // first check if permission is there for task status or not
  //   if (!this.isDisableTaskStatusOverlay) {
  //     if (!this.isOverlayTaskStatus) {
  //       if (!this._addTaskForm['project'].value) {
  //         this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
  //       } else if (this.taskStatusList && this.taskStatusList.length == 0) {
  //         this.snackBar.open(`No substatus is found for ${this._addTaskForm['taskState'].value.name} status. `);
  //       } else {
  //         this.isOverlayTaskStatus = !this.isOverlayTaskStatus;
  //       }
  //     } else {
  //       this.isOverlayTaskStatus = !this.isOverlayTaskStatus;
  //     }
  //   }
  // }

  // toggle color picker
  toggleLabelColorPicker() {
    this.toggle = !this.toggle;
  }

  toggleSubscriberOverlay() {
    // first check if permission is granted
    if (!this.isDisableTaskSubscribersOverlay) {
      if (!this.isOverlayOpenForSubscriber) {
        if (!this.selectedProject) {
          this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
        } else {
          this.isOverlayOpenForSubscriber = !this.isOverlayOpenForSubscriber;
        }
      } else {
        this.isOverlayOpenForSubscriber = !this.isOverlayOpenForSubscriber;
      }
    }
  }

  // reset form control based on form control name
  resetFormControl(formControlName: string) {
    this._addTaskForm[formControlName].reset();
  }

  checkIfUserHasPermission(formControlName: string) {
    if (formControlName === 'reportTo') {
      if (!this.isDisableReportToOverlay) {
        this.resetFormControl(formControlName);
        this.setTaskSubscribers({
          isReportToRemoved: true,
        });
      }
    } else if (formControlName === 'assignedBy') {
      if (!this.isDisableAssignedByOverlay) {
        this.resetFormControl(formControlName);
        this.setTaskSubscribers({
          isAssignedByRemoved: true,
        });
      }
    } else if (formControlName === 'assignTo') {
      if (!this.isDisableAssignedToOverlay) {
        // this.removeUserFromTaskSubscribers(this._addTaskForm['assignTo'].value);
        this.resetFormControl(formControlName);
        this.setTaskSubscribers({
          isAssignedToRemoved: true,
        });
      }
    } else if (formControlName === 'taskPriority') {
      if (!this.isDisableTaskPriorityOverlay) {
        this.resetFormControl(formControlName);
      }
    } else if (formControlName === 'estimatedTime') {
      if (!this.isDisableETAOverlay) {
        this.resetFormControl(formControlName);
      }
    } else if (formControlName == 'externalTaskLinkInput') {
      this.resetFormControl(formControlName);
    }
  }

  // remove task label
  onRemoveTaskLabel(eventArgs: TaskLabelModel) {
    this.isLabelsChanged = true;
    const items = this.tempLabelStorage || [];
    let updatedItems = items;
    if (eventArgs.id) {
      updatedItems = items?.filter((item: any) => item.id !== eventArgs.id) || [];
    } else {
      updatedItems = items?.filter((item: any) => item.title !== eventArgs.title) || [];
    }
    this.tempLabelStorage = updatedItems;
    this.resetFilteredLabels();
  }

  // this will reset section form control
  onRemoveTaskSection() {
    this._addTaskForm['section'].reset();
  }

  getSelectedTaskPriority(event: any) {
    this.setFormControlValue('taskPriority', event);
  }

  getSelectedTaskType(event: any) {
    this.setFormControlValue('taskType', event.value.name);
  }

  attributeDisplayForTaskType(attribute1: any, attribute2: any) {
    if (attribute1.name.toLowerCase() == attribute2.toLowerCase()) {
      return attribute1.name;
    } else {
      return '';
    }
  }

  attributeDisplayForTaskSection(attribute1: any, attribute2: any) {
    if (attribute1.title && attribute2.title && attribute1.title.toLowerCase() == attribute2.title.toLowerCase()) {
      return attribute1.title;
    } else {
      return '';
    }
  }

  attributeDisplayForTaskStatus(attribute1: any, attribute2: any) {
    if (attribute1.name && attribute2.name && attribute1.name.toLowerCase() == attribute2.name.toLowerCase()) {
      return attribute1.name;
    } else {
      return '';
    }
  }

  // onSelectState(state: any) {
  //   this.setFormControlValue('taskState', state.value);
  //   this.resetFormControl('taskStatus');
  //   this.prepareStatusList();
  //   this.toggleOverlayTaskStateSelection();
  // }

  // returns field type
  getfieldType(fieldType: any) {
    let fieldTypeToReturn = 'text';
    if (fieldType) {
      fieldType = fieldType.toLowerCase();
      if (fieldType === CUSTOM_FIELD_TYPE_CONSTANTS.INPUT_TEXT) {
        fieldTypeToReturn = 'text';
      } else if (fieldType === CUSTOM_FIELD_TYPE_CONSTANTS.TEXT_AREA) {
        fieldTypeToReturn = 'textarea';
      } else if (fieldType === CUSTOM_FIELD_TYPE_CONSTANTS.DATE) {
        fieldTypeToReturn = 'date';
      } else if (fieldType === CUSTOM_FIELD_TYPE_CONSTANTS.INPUT_NUMBER) {
        fieldTypeToReturn = 'number';
      } else if (fieldType === CUSTOM_FIELD_TYPE_CONSTANTS.DROPDOWN) {
        fieldTypeToReturn = 'dropdown';
      } else if (fieldType === CUSTOM_FIELD_TYPE_CONSTANTS.CHECKBOX) {
        fieldTypeToReturn = 'checkbox';
      } else if (fieldType === CUSTOM_FIELD_TYPE_CONSTANTS.RADIO_BUTTON) {
        fieldTypeToReturn = 'radio';
      } else if (fieldType === CUSTOM_FIELD_TYPE_CONSTANTS.INPUT_URL) {
        fieldTypeToReturn = 'url';
      }
    }
    return fieldTypeToReturn;
  }

  previewFile(file: File | any) {
    if (file instanceof File) {
      const objectURL = URL.createObjectURL(file);
      const documentFile: any = this.sanitizer.bypassSecurityTrustUrl(objectURL);

      this.router.navigate([]).then((result) => {
        window.open(documentFile.changingThisBreaksApplicationSecurity, '_blank');
      });
    }
  }

  removeDocument(index: number) {
    if (this.attachedDocuments && this.attachedDocuments.length > 0) {
      this.attachedDocuments = Array.from(this.attachedDocuments);
      if (this.attachedDocuments[index].url) {
        this.deletedDocuments.push(this.attachedDocuments[index].url);
      }
      this.attachedDocuments.splice(index, 1);
    }
  }

  // Prepare status list based on selected state and selected project
  prepareStatusList() {
    this.isStatusSelectionDisabled = true;
    if (this.selectedProject) {
      this.taskService
        .getProjectsStatusById({
          project_id: [this.selectedProject.id],
        })
        .subscribe((response: any) => {
          const currentState = this._addTaskForm['taskState'].value;
          if (currentState && response.data && response.data.length && response.data[0].projectStatus && response.data[0].projectStatus.length > 0) {
            const statusList = response.data[0].projectStatus || [];
            if (statusList && statusList.length > 0) {
              this.isStatusSelectionDisabled = false;
              this.taskStatusList = [];
              statusList.forEach((statusObject: any) => {
                this.taskStatusList.push({
                  id: statusObject.id || '',
                  name: statusObject.title || '',
                  color: statusObject.color || '',
                  state: statusObject.state || '',
                });
              });
              if (this.taskStatusList && this.taskStatusList?.length > 0) {
                this.taskStatusList = this.taskStatusList.sort((item1: any, item2: any) => {
                  const valItem1 = Utility.stateList.findIndex((item: any) => item?.value === item1?.state);
                  const valItem2 = Utility.stateList.findIndex((item: any) => item?.value === item2?.state);
                  if (valItem1 < valItem2) {
                    return -1;
                  }
                  if (valItem1 > valItem2) {
                    return 1;
                  }
                  return 0;
                });
              }

              // bind default status in case of create task
              this.bindDefaultStatusObject(currentState);
            }
          } else {
            this.taskStatusList = [];
          }
        });
    }
  }

  // This method will set form control value based on form control name
  setFormControlValue(formControlName: string, formControlValue: any) {
    this._addTaskForm[formControlName].setValue(formControlValue);
  }

  // This method will bind default status for state
  bindDefaultStatusObject(currentState: any) {
    // const findDefaultStatusObject = this.taskStatusList.find(
    //   (statusObject: any) => statusObject.name.replaceAll(' ', '').toLowerCase() == currentState.name.replaceAll(' ', '').toLowerCase()
    // );
    const findDefaultStatusObject = this.taskStatusList[0];
    if (findDefaultStatusObject) {
      this.setFormControlValue('taskStatus', findDefaultStatusObject);
      this.setFormControlValue('taskState', { name: findDefaultStatusObject.state });
      this.selectedStatusToDisplay = findDefaultStatusObject?.name;
    }
  }

  // get labels by project
  getLabelsByProject() {
    if (this.selectedProject && this.selectedProject.id) {
      this.subscriptions.push(
        this.taskService.getTaskLabels(this.selectedProject.id).subscribe({
          next: (response: any) => {
            if (response) {
              if (response.data && response.data.length > 0) {
                this.taskLabels = response.data || [];
              } else {
                this.taskLabels = [];
              }
              this.resetFormControl('taskLabelControl');
              this._addTaskForm['taskLabelControl'].setValue([]);
              this.temporaryTaskLabels = [];
            }
          },
          error: (error: any) => {
            console.log('error:', error);
          },
        })
      );
    }
  }

  validateDate(event: any) {
    console.log('event:', event);
  }

  onSelectionChange(event: any) {
    console.log('event:', event);
  }

  onTaskDateChange() { }

  onLabelColorChange(event: any) {
    const taskLabelControlValue: TaskLabelModel[] = this.temporaryTaskLabels || [];
    taskLabelControlValue[taskLabelControlValue.length - 1].color = event;
    // this.setFormControlValue('taskLabelControl', taskLabelControlValue);
    this.temporaryTaskLabels = taskLabelControlValue;
    this.toggleLabelColorPicker();
  }

  onTaskLabelSelect(eventArgs: any) {
    const items = this.tempLabelStorage || [];
    const labelvalue = (eventArgs.title || eventArgs || '').trim();
    if (items?.length + 1 <= 5) {
      if (labelvalue) {
        const existingLocation = items.findIndex((label: any) => label.title === labelvalue);
        if (existingLocation === -1) {
          items?.push({
            id: eventArgs && eventArgs.id ? eventArgs.id : '',
            title: labelvalue,
            project_id: eventArgs && eventArgs.project_id ? eventArgs.project_id : this._addTaskForm['project'].value.id || '',
            color: eventArgs && eventArgs.color ? eventArgs.color : Utility.getLabelColorDetails(),
          });

          this.isLabelsChanged = true;
          this.tempLabelStorage = items;
          this.resetFilteredLabels();
        }
      }
    } else {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'You cannot add more than 5 Labels.' },
        duration: 45000,
      });
    }
    this.isOverlayOpenForTaskLabels = false;
  }

  // get unique labels array
  getUniqueLabelsArray() {
    const uniqueLabelsArray = Object.values(
      this.temporaryTaskLabels.reduce((acc: any, obj: TaskLabelModel) => {
        acc[obj.id] = obj;
        return acc;
      }, {})
    );
    return uniqueLabelsArray;
  }

  // check if event.id is not there, means need to create new section, otherwise set selected section
  onSectionSelect(event: any) {
    console.log('event:', event);
    if (event) {
      if (!event.value) {
        const projectId = this._addTaskForm['project'].value.id || '';
        if (projectId) {
          const sectionRequestBody: PostTaskSectionModel = {
            project_id: projectId,
            title: this.sectionSearchControl.value || '',
          };

          this.subscriptions.push(
            this.taskService.postTaskSection(sectionRequestBody).subscribe({
              next: (response: PostTaskSectionResponseModel) => {
                if (response) {
                  if (response.data) {
                    this.setSectionFormControlValue({ id: response.data.id, title: response.data.title });
                    this.sectionsList.push(response.data);
                    this.filteredSections.next(this.sectionsList);
                  }
                }
              },
              error: (error: any) => {
                console.log('error:', error);
              },
            })
          );
        } else {
          this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
        }
      } else if (event.value) {
        this.setSectionFormControlValue({ id: event.value.id, title: event.value.title });
      }
    }
  }

  // set section form control value
  setSectionFormControlValue(sectionObject: { id: number; title: string }) {
    this.setFormControlValue('section', {
      id: sectionObject.id || '',
      title: sectionObject.title || '',
    });
  }

  getProjectsList() {
    // console.log('getProjectsList');

    this.taskService.getProjectsList().subscribe((response: any) => {
      if (response.data) {
        const responseData = response.data;
        if (responseData.list && responseData.list.length > 0) {
          this.projectsDataList = responseData.list || [];
          this.projectsDataList.forEach((project: any) => {
            // prepare project name list
            this.projectNameList.push({
              id: project.id,
              key: project.project_key,
              name: project.name,
            });
          });
          this.filteredProjects.next(this.projectNameList);
          // find and set project if query parameter is having project id
          if (this.projectIdFromURL && this.projectNameList && this.projectNameList.length > 0) {
            this.projectIdFromURL = Encryption._doDecrypt(this.projectIdFromURL.toString());
            const findProjectFromQueryParam = this.projectNameList.find(
              (projectObject: ProjectNameModel) => projectObject.id == this.projectIdFromURL
            );
            if (findProjectFromQueryParam) {
              this.setFormControlValue('project', findProjectFromQueryParam);
              this.populateTaskDataBasedonProjectSelected(findProjectFromQueryParam);
            }
          }
        }
      }
    });
  }

  // getProjectsData() {
  //   this.getProjectsRequestModel.status = true;
  //   this.getProjectsRequestModel.custom_fields = true;
  //   this.getProjectsRequestModel.tag = true;
  //   this.getProjectsRequestModel.team = true;
  //   this.getProjectsRequestModel.billing_configuration = false;
  //   this.getProjectsRequestModel.documents = false;
  //   this.getProjectsRequestModel.workspace = false;
  //   this.subscriptions.push(
  //     this.taskService.getProjectsData(this.getProjectsRequestModel).subscribe({
  //       next: (response: any) => {
  //         if (response) {
  //           if (response.data) {
  //             const responseData = response.data;
  //             if (responseData.list && responseData.list.length > 0) {
  //               this.projectsDataList = responseData.list || [];
  //               this.projectsDataList.forEach((project: any) => {
  //                 // prepare project name list
  //                 this.projectNameList.push({
  //                   id: project.id,
  //                   key: project.project_key,
  //                   name: project.name,
  //                 });
  //               });
  //               this.filteredProjects.next(this.projectNameList);
  //               // find and set project if query parameter is having project id
  //               if (this.projectIdFromURL && this.projectNameList && this.projectNameList.length > 0) {
  //                 this.projectIdFromURL = Encryption._doDecrypt(this.projectIdFromURL.toString());
  //                 const findProjectFromQueryParam = this.projectNameList.find(
  //                   (projectObject: ProjectNameModel) => projectObject.id == this.projectIdFromURL
  //                 );
  //                 if (findProjectFromQueryParam) {
  //                   this.setFormControlValue('project', findProjectFromQueryParam);
  //                   this.populateTaskDataBasedonProjectSelected(findProjectFromQueryParam);
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       },
  //     })
  //   );
  // }

  // this method will reset form control and clear validation
  resetAndClearFormControlValidations(formControlName: string) {
    this._addTaskForm[formControlName].reset();
    this._addTaskForm[formControlName].clearValidators();
    this._addTaskForm[formControlName].updateValueAndValidity();
  }
  // check if user selects mention user, and if project is not selected, show error message
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEditorContentChange(event: any) {
    this.adjustEditorHeight();
    // if (event) {
    //   if (event.html == '<p>@</p>') {
    //     if (this.reportToBindList && this.reportToBindList.length == 0) {
    //       this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
    //       this.addTaskForm.reset();
    //     }
    //   } else if (event.html && this.reportToBindList && this.reportToBindList.length == 0) {
    //   }
    // }
  }

  // This method checks if only empty space is there in editor, then removes empty space
  checkContentOnBlur() {
    const div: any = document.createElement('div');
    div.innerHTML = this._addTaskForm['description'].value.trim();
    if (div.firstChild && div.firstChild.firstChild.data && div.firstChild.firstChild.data.trim().length == 0) {
      this._addTaskForm['description'].reset();
    }
  }

  // get Task change Logs API
  getTaskChangeLogs() {
    if (this.taskChangeLogRequestModel.task_id) {
      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.taskService.getTaskChangeLogs(this.taskChangeLogRequestModel).subscribe({
          next: (response: TaskChangeLogResponseModel) => {
            if (response) {
              if (response.data) {
                const responseData = response.data || '';
                if (responseData.totalRecords) {
                  this.taskChangeLogTotalRecords = responseData.totalRecords || 0;
                }
                if (responseData.list && responseData.list.length > 0) {
                  this.taskChangeLogsResponseList = this.taskChangeLogsResponseList.concat(responseData.list);
                }
              }
            }
          },
          error: (error: any) => {
            console.log('error:', error);
          },
          complete: () => {
            this.spinnerService.hideSpinner();
          },
        })
      );
    }
  }

  // this method will restrict user based on the permissions on each below mentioned form control
  // based on add/edit action
  setFieldPermissions() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      // get create permission
      this.actionPermissionData = this.permissionService.getModuleActionPermissionData(permission, MODULE_CONSTANTS.TASKS, ACTION_CONSTANTS.CREATE);

      // check for permissions to disable controls
      // task title
      const taskTitleObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['title'] !== undefined);
      taskTitleObject && !taskTitleObject.title ? (taskTitleObject.is_required ? '' : this._addTaskForm['title'].disable()) : '';

      // task description
      const descriptionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['description'] !== undefined);
      descriptionObject && !descriptionObject.description ? (descriptionObject.is_required ? '' : this._addTaskForm['description'].disable()) : '';

      // task type
      const taskTypeObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['task type'] !== undefined);
      taskTypeObject && !taskTypeObject['task type'] ? (taskTypeObject.is_required ? '' : this._addTaskForm['taskType'].disable()) : '';

      // task state
      const taskStateObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['task state'] !== undefined);
      taskStateObject && taskStateObject['task state'] ? (taskStateObject.is_required ? '' : (this.isDisableTaskStateOverlay = true)) : '';

      if (taskStateObject && !taskStateObject['task state']) {
        if (!taskStateObject.is_required) {
          this._addTaskForm['taskState'].disable(); // Disable the control
          this._addTaskForm['taskStatus'].disable(); // Disable the control
          this.isTaskStateDisabled = true; // Set the flag
        }
      }

      // task status
      const taskStatusObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['task status'] !== undefined);
      taskStatusObject && !taskStatusObject['task status'] ? (taskStateObject.is_required ? '' : (this.isDisableTaskStatusOverlay = true)) : '';

      // assign to
      const assignedToObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['assign to'] !== undefined);
      assignedToObject && !assignedToObject['assign to'] ? (assignedToObject.is_required ? '' : (this.isDisableAssignedToOverlay = true)) : '';

      // assigned by
      const assignedByObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['assigned by'] !== undefined);
      assignedByObject && !assignedByObject['assigned by'] ? (assignedByObject.is_required ? '' : (this.isDisableAssignedByOverlay = true)) : '';

      // report to
      const reportToObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['report to'] !== undefined);
      reportToObject && !reportToObject['report to'] ? (reportToObject.is_required ? '' : (this.isDisableReportToOverlay = true)) : '';

      // task subscribers
      const taskSubscribersObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['task subscribers'] !== undefined);
      taskSubscribersObject && !taskSubscribersObject['task subscribers']
        ? taskSubscribersObject.is_required
          ? ''
          : (this.isDisableTaskSubscribersOverlay = true)
        : '';

      // task priority
      const taskPriorityPermissionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['task priority'] !== undefined);
      taskPriorityPermissionObject && !taskPriorityPermissionObject['task priority']
        ? taskPriorityPermissionObject.is_required
          ? ''
          : (this.isDisableTaskPriorityOverlay = true)
        : '';

      // task startDate
      const taskStartDatePermissionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['task startDate'] !== undefined);
      taskStartDatePermissionObject && !taskStartDatePermissionObject['task startDate']
        ? taskStartDatePermissionObject.is_required
          ? ''
          : this._addTaskForm['taskStartDate'].disable()
        : '';

      // task dueDate
      const taskDueDatePermissionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['task dueDate'] !== undefined);
      taskDueDatePermissionObject && !taskDueDatePermissionObject['task dueDate']
        ? taskDueDatePermissionObject.is_required
          ? ''
          : this._addTaskForm['taskDueDate'].disable()
        : '';

      // estimated time
      const ETAPermissionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['estimated time'] !== undefined);
      ETAPermissionObject && !ETAPermissionObject['estimated time'] ? (ETAPermissionObject.is_required ? '' : (this.isDisableETAOverlay = true)) : '';

      // project
      const projectPermissionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['project'] !== undefined);
      projectPermissionObject && !projectPermissionObject['project']
        ? projectPermissionObject.is_required
          ? ''
          : this._addTaskForm['project'].disable()
        : '';

      // task labels
      const taskLabelPermissionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['task labels'] !== undefined);
      taskLabelPermissionObject && !taskLabelPermissionObject['task labels']
        ? taskLabelPermissionObject.is_required
          ? ''
          : this._addTaskForm['taskLabelControl'].disable()
        : '';

      // documents
      const documentsObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['documents'] !== undefined);
      documentsObject && !documentsObject['documents'] ? (documentsObject.is_required ? '' : (this.isDisableDocumentsUpload = true)) : '';
    }
  }

  // call Task activity APIs based on tab changes
  onTaskActivityTabChanged(event: any) {
    if (event) {
      // check for comments index
      if (event.index == 0) {
        this.commentsComponent.commentsListToBind = [];
        this.commentsComponent.getAllCommentsByTaskId();
      }
      // check for commits index
      if (event.index == 1) {
        this.commitsComponent.commitListToBind = [];
        this.commitsComponent.getCommitListRequestModel.page = 1;
        this.commitsComponent.getTaskCommits();
      }
      // check for change log tab (index = 3)
      if (event.index == 3) {
        this.getTaskChangeLogs();
      }

      // set changelog array and pagination to initial values to resolve duplicate change logs issue
      if (event.index != 3) {
        this.taskChangeLogTotalRecords = 0;
        this.taskChangeLogRequestModel.page = 1;
        this.taskChangeLogsResponseList = [];
      }
    }
  }

  onLoadMoreChangeLogs(event: any) {
    if (event && event.loadMoreRecords) {
      this.taskChangeLogRequestModel.page += 1;
      this.getTaskChangeLogs();
    }
  }

  // check if query param 'p_id' exists in URL
  checkIfURLHasProjectId() {
    if (this.route.snapshot.queryParams[PROJECT_ID_QUERY_PARAM_CONSTANT]) {
      this.projectIdFromURL = this.route.snapshot.queryParams[PROJECT_ID_QUERY_PARAM_CONSTANT];
    }
  }

  // push comment to temporary array
  // onCommentsToBePosted(event: any) {
  //   if (event) {
  //     if (event.commentsToPost && event.commentsToPost.length > 0) {
  //       this.temporaryCommentsToBePosted = event.commentsToPost;
  //     }
  //   }
  // }

  // push commits to temporary array
  // onCommitsToBePosted(event: any) {
  //   if (event) {
  //     if (event.commitsToPost && event.commitsToPost.length > 0) {
  //       this.temporaryCommitsToBePosted = event.commitsToPost;
  //     }
  //   }
  // }

  saveLabels() {
    if (this.isLabelsChanged) {
      this._addTaskForm['taskLabelControl'].patchValue(this.tempLabelStorage);
      this.openQuickTaskLabelsSection = false;
    }
  }

  openLabelPopup() {
    if (this.selectedProject) {
      this.isOverlayOpenForLabelPopup = true;
    } else {
      this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
    }
  }

  // on outside click of label pop up, it will reset labels
  closeAndResetLabelPopup() {
    this.isOverlayOpenForTaskLabels = false;
    const taskLabelsFromForm = this._addTaskForm['taskLabelControl'].value;
    if (taskLabelsFromForm && taskLabelsFromForm.length > 0 && this.taskLabels && this.taskLabels.length > 0) {
      this.temporaryTaskLabels = [];
      taskLabelsFromForm.forEach((taskLabelFromFormObject: TaskLabelModel) => {
        const findLabelObject = this.taskLabels.find((taskLabelObject: TaskLabelModel) => taskLabelObject.id == taskLabelFromFormObject.id);
        if (findLabelObject) {
          this.temporaryTaskLabels.push(findLabelObject);
        }
      });
      if (this.temporaryTaskLabels && this.temporaryTaskLabels.length > 0) {
        this.setFormControlValue('taskLabelControl', this.temporaryTaskLabels);
      }
    }
  }

  // toggle select section control
  openSelectSectionControl() {
    // check if project is selected then only toggle select control
    const projectId = this._addTaskForm['project'].value || '';
    if (projectId) {
      this.isSectionControlVisible = true;
      this.selectSectionSubscription = this.selectSectionSource.subscribe(() => {
        if (this.sectionSelectControl) {
          this.sectionSelectControl.open();
          this.selectSectionSubscription.unsubscribe();
        }
      });
    } else {
      this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
    }
  }

  sectionClosed() {
    this.isSectionControlFocusedOut = !this.isSectionControlFocusedOut;
    if (this.isSectionControlFocusedOut) {
      this.isSectionControlVisible = !this.isSectionControlVisible;
    }
  }

  // This will toggle date label with start date picker control and will open datepicker
  openStartDatePickerControl() {
    this.isStartDateControlVisible = true;
    this.startDatePickerSubscription = this.startDatePickerSource.subscribe(() => {
      if (this.startDatePickerControl) {
        this.startDatePickerControl.open();
        this.startDatePickerSubscription.unsubscribe();
      }
    });
  }

  // This will toggle date label with due date picker control and will open datepicker
  openDueDatePickerControl() {
    this.isDueDateControlVisible = true;
    this.dueDatePickerSubscription = this.dueDatePickerSource.subscribe(() => {
      if (this.dueDatePickerControl) {
        this.dueDatePickerControl.open();
        this.dueDatePickerSubscription.unsubscribe();
      }
    });
  }

  closeDueDatePickerControl() {
    this.isDueDateControlVisible = !this.isDueDateControlVisible;
  }

  closeStartDatePickerControl() {
    this.isStartDateControlVisible = !this.isStartDateControlVisible;
  }

  onAssignToMe() {
    // find loggedIn user from project team data
    if (this.projectTeamMembers && this.projectTeamMembers.length > 0) {
      const loggedInUserFromTeam = (this.projectTeamMembers as any).find(
        (teamMemberObject: any) => teamMemberObject.user_id === this.loggedInUserId
      )?.user;
      if (loggedInUserFromTeam) {
        loggedInUserFromTeam.isTaskASsignedTo = true;
        this.setFormControlValue('assignTo', loggedInUserFromTeam);
        this.setTaskSubscribers();
        this.checkIsTaskAssignedToSelf();
      }
    }
  }

  openParentTaskModal() {
    // check if project is selected or not
    if (this._addTaskForm['project'].value.id) {
      this.isShowParentTaskListModal = true;
    } else {
      this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
    }
  }

  onParentTaskListModalClose(event: any) {
    if (event) {
      if (event.isModalCancelled) {
        this.isShowParentTaskListModal = false;
      } else if (event.isTaskSelected && event.taskObject) {
        const taskId = Encryption._doEncrypt(event.taskObject.id.toString());
        event.taskObject.taskURL = location.origin + `${TASK_DETAIL_ROUTE}${encodeURIComponent(taskId)}`;
        this.setFormControlValue('parentTask', event.taskObject);
        this.isShowParentTaskListModal = false;
      }
    }
  }

  removeParentTask() {
    this.resetFormControl('parentTask');
  }

  toggleExternalTaskLinkControl() {
    this.isExternalTaskLinkControlVisible = !this.isExternalTaskLinkControlVisible;
  }

  // check if task title is having only empty space
  onTaskTitleBlur() {
    const taskTitleValue = this._addTaskForm['title'].value;
    if (taskTitleValue && !taskTitleValue.trim()) {
      this.resetFormControl('title');
      this._addTaskForm['title'].markAllAsTouched();
    }
  }

  editTaskLables() {
    if (this._addTaskForm['project']?.value?.id) {
      this.tempLabelStorage = JSON.parse(JSON.stringify(this._addTaskForm['taskLabelControl'].value));
      this.isLabelsChanged = true;
      this.taskService.getTaskLabels(this._addTaskForm['project']?.value?.id).subscribe(
        (response: any) => {
          if (response && response.data) {
            this.availableProjectLabels = response.data;
            this.filteredAvailableLabels = response.data;
          } else {
            this.availableProjectLabels = [];
            this.filteredAvailableLabels = [];
          }
          this.resetFilteredLabels();
          this.openQuickTaskLabelsSection = true;
        },
        (err) => {
          console.log(err);
          this.resetFilteredLabels();
          this.availableProjectLabels = [];
          this.filteredAvailableLabels = [];
        }
      );
    } else {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST },
        duration: 45000,
      });
    }
  }

  resetFilteredLabels() {
    const selectedLabels = this.tempLabelStorage || [];
    if (selectedLabels) {
      this.filteredAvailableLabels = this.availableProjectLabels.filter(
        (label: any) => selectedLabels.findIndex((item: any) => item.title === label.title) === -1
      );
    }
  }
  startResize(e: MouseEvent) {
    const quillContainer = document.querySelector('.ql-container') as HTMLElement;
    if (quillContainer) {
      const startY = e.clientY;
      const startHeight = parseInt(getComputedStyle(quillContainer).height, 10);

      const onMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        const newHeight = startHeight + deltaY;

        // Ensure the new height doesn't go below the minimum of 50px
        quillContainer.style.height = Math.min(Math.max(newHeight, 50), 700) + 'px';
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  }
  adjustEditorHeight() {
    const quillContainer = document.querySelector('.ql-container') as HTMLElement;
    if (quillContainer) {
      quillContainer.style.minHeight = '130px';
      quillContainer.style.height = 'auto';
    }
  }

  // unsubscribe observables
  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this._onDestroy.next();
    this._onDestroy.complete();
  }
  onChange(event: any): void {
    console.log(event);
    console.log(this.mycontent);
    this._addTaskForm['description'].setValue(event);
    //this.log += new Date() + "<br />";
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _onSelectedStatusChange(eventArgs: any) {
    this.selectedStatusToDisplay = eventArgs?.name;
    this.statusSelectionOpen = false;
    this.setFormControlValue('taskStatus', eventArgs);
    this.setFormControlValue('taskState', { name: eventArgs?.state });
  }
  _onClickStatuSelection() {
    if (!this.isStatusSelectionDisabled) {
      this.statusSelectionOpen = true;
    } else {
      this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
    }
  }

  /////task background Color

  getTaskBackgroundColor() {
    const color = Utility.stateList.find((item: any) => item.value == this._addTaskForm['taskStatus'].value.state)?.color;
    return color;
  }

  ////
}
