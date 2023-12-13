/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { Task_Prioriry_Enum, Task_Type_Enum, Task_State_Enum, Task_Type_Enum_Color_Codes } from '@tms-workspace/enum-data';
import { environment } from './../../../../environments/environment';
import moment from 'moment';
import { QuillEditorComponent } from 'ngx-quill';
import Quill from 'quill';
import { Subscription, interval, ReplaySubject, Subject, takeUntil } from 'rxjs';
import {
  TaskLabelModel,
  taskPriorityListEnumModel,
  taskTypeListEnumModel,
  taskStateListEnumModel,
  taskStatusListModel,
  ProjectsRequestDataModel,
  ProjectNameModel,
  ProjectTeam,
  ProjectTeamMember,
  customFieldsModel,
  SectionObjectModel,
  TaskCreatedUpdatedLogModel,
  customFieldToBeUpdatedModel,
  TaskTimeHistoryResponseObjectModel,
  TaskChangeLogResponseObjectModel,
  TaskChangeLogListToBindModel,
  TaskChangeLogRequestModel,
  GetTaskTimeHistoryRequestModel,
  SectionResponseModel,
  PostTaskSectionModel,
  PostTaskSectionResponseModel,
  TaskTimerRequestModel,
  toggleTaskTimerResponseModel,
  TaskWorkedHoursResponseModel,
  TaskWorkedHoursDataModel,
  TaskTimeHistoryResponseModel,
  TaskChangeLogResponseModel,
  GetTaskTimeHistoryForPrintRequestModel,
  TaskStateAndStatusModel,
  GetSubTaskListRequestModel,
} from '../../../core/model/task/task.model';
import {
  CREATE_MESSAGES_IN_POPUP,
  TASK_TIMER_DEFAULT_VALUE,
  QUICK_TASK_ERROR_MESSAGE,
  INPROGRESS_TASK_STATE_STATUS,
  CUSTOM_FIELDS_CONSTANTS,
  DATE_FORMAT_CONSTANTS,
  TASK_REQUEST_KEYS_CONSTANTS,
  TEMP_CONSTANT,
  ERROR_MESSAGE_CONSTANTS,
  CUSTOM_FIELD_TYPE_CONSTANTS,
  DEFAULT_LABEL_COLOR_CONSTANTS,
  TASK_TIMER_CONSTANTS,
  PERMISSION_CONSTANTS,
  MODULE_CONSTANTS,
  ACTION_CONSTANTS,
  PROJECT_ID_QUERY_PARAM_CONSTANT,
  TASK_DETAIL_ROUTE,
  TASK_TIMER_TOGGLE_MESSAGE,
  STORAGE_CONSTANTS,
  USER_ROLES,
} from '../../../core/services/common/constants';
import { GlobalService } from '../../../core/services/common/global.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { UserService } from '../../../core/services/module/users/users.service';
import { CommentsComponent } from '../comments/comments.component';
import { CommitsComponent } from '../commits/commits.component';
import { CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
import { SnackbarComponent } from 'libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { Utility } from '../../../core/utilities/utility';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DocumentsService } from '../../../core/services/module/documents/documents.service';

@Component({
  selector: 'main-app-tms-workspace-view-update-task',
  templateUrl: './view-update-task.component.html',
  styleUrls: ['./view-update-task.component.scss'],
})
export class ViewUpdateTaskComponent implements OnInit, OnDestroy, AfterViewInit {
  //#region properties

  addTaskForm: FormGroup;
  addSubTaskForm: FormGroup;
  attachedDocuments: any = [];
  subscriptions: Subscription[] = [];
  tempLabelStorage: any = [];
  availableProjectLabels: any = [];
  filteredAvailableLabels: any = [];
  isOverlayOpenForAssignTo = false;
  isDescriptionEditable = false;
  isOverlayOpenForAssignedBy = false;
  isOverlayOpenForReportTo = false;
  isOverlayOpenForPriority = false;
  isOverlayTaskStatus = false;
  isOverlayOpenForETA = false;
  isOverlayTaskState = false;
  isTaskSubmitted = false;
  isOverlayOpenForSections = false;
  isShowTaskLinkCopied = false;
  isOverlayOpenForTaskLabels = false;
  isOverlayOpenForLabelPopup = false;
  isTaskStartedByMultipleUsers = false;
  isCallComments = false;
  isCallCommits = false;
  isTaskCompleted = false;
  isSectionControlVisible = false;
  isSectionControlFocusedOut = true;
  isDueDateControlVisible = false;
  isStartDateControlVisible = false;
  isProjectControlVisible = false;
  isTaskTypeControlVisible = false;
  isAssignToMeVisible = true;
  isTaskTitleControlVisible = false;
  isShowParentTaskListModal = false;
  isExternalTaskLinkControlVisible = false;
  // canShowWorkHistoryCommentPopupVisible = false;
  isWorkHistoryCommentPopupVisible = false;
  isTaskTimerToggled = false;
  isLabelsChanged = false;
  openQuickTaskLabelsSection = false;
  isShowLoadMoreSubtasks = false;
  public userIsIntBreak = false;
  alertIndicate = false;
  projectsDataList: any = [];
  allStatusList: any = [];
  taskLabels: TaskLabelModel[] = [];
  taskPriorityEnum = Task_Prioriry_Enum;
  taskTypeEnum = Task_Type_Enum;
  taskStateEnum = Task_State_Enum;
  taskPriorityList: taskPriorityListEnumModel[] = [];
  taskTypeList: taskTypeListEnumModel[] = [];
  taskStateList: taskStateListEnumModel[] = [];
  taskStatusList: taskStatusListModel[] = [];
  getProjectsRequestModel!: ProjectsRequestDataModel;
  projectNameList: ProjectNameModel[] = [];
  projectTeamMembers: ProjectTeam[] = [];
  reportToBindList: ProjectTeamMember[] = [];
  descriptiveFields: customFieldsModel[] = [];
  contextFields: customFieldsModel[] = [];
  sectionsList: SectionObjectModel[] = [];
  subTasksList: any = [];
  taskCreatedUpdatedObject!: TaskCreatedUpdatedLogModel;
  createSectionForMessage = CREATE_MESSAGES_IN_POPUP.CREATE_SECTION_FOR;
  baseURL = environment.base_url;
  selectedProject: any;
  color = '#800101';
  toggle = false;
  pending_time_hours_minutes = '0h';

  isSubscriberModified = false;
  isDocumentsModified = false;
  isOverlayOpenForSubscriber = false;
  presetColors: string[];
  currentTaskId!: string;
  projectSource = interval(500);
  projectSubscription!: Subscription;
  taskSubscribersSource = interval(500);
  taskSubscriberSubscription!: Subscription;
  taskTeamMemberSource = interval(200);
  taskTeamMemberSubscription!: Subscription;
  selectSectionSource = interval(100);
  selectSectionSubscription!: Subscription;
  dueDatePickerSource = interval(100);
  dueDatePickerSubscription!: Subscription;
  startDatePickerSource = interval(100);
  startDatePickerSubscription!: Subscription;
  selectedProjectSource = interval(100);
  selectedProjectSubscription!: Subscription;
  descriptionEditorSource = interval(100);
  descriptionEditorSubscription!: Subscription;
  projectControlSource = interval(100);
  projectControlSubscription!: Subscription;
  taskTypeControlSource = interval(100);
  taskTypeControlSubscription!: Subscription;
  quillEditorSource = interval(100);
  quillEditorSubscription!: Subscription;
  commitComponentSource = interval(100);
  commitSourceSubscription!: Subscription;
  commentsComponentSource = interval(100);
  commentsSourceSubscription!: Subscription;
  taskKey!: string;
  taskDetailResponseData!: any;
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
  quillConfiguration = this.QuillConfiguration;
  isTaskTimerRunning = false;
  timerCount = TASK_TIMER_DEFAULT_VALUE;
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
  isDescriptionControlVisible = true;
  isWorkTimeHistoryPrintClicked = false;
  canDeleteTimeSlot = false;
  timeHistoryTotalRecords = 0;
  taskChangeLogTotalRecords = 0;
  completedString = 'Completed';
  todoString = 'To Do';
  notCompletedTaskSVGPath = '/assets/images/tick-square.svg';
  completedTaskSVGPath = '/assets/images/reopen-task.svg';
  copyTaskURLSVGPath = '/assets/images/copy_task.svg';
  notEligibleForThisActionErrorMessage = 'You can not perform this action, because this task is not assigned to you';
  loggedInUserId!: number;
  taskWorkHistoryHeadings = ['User', 'comment', 'Start time', 'End time', 'Total time'];
  createLabelForMessage = CREATE_MESSAGES_IN_POPUP.CREATE_LABEL_FOR;
  taskWorkHistoryBindList: TaskTimeHistoryResponseObjectModel[] = [];
  temporaryTaskWorkHistoryBindList: TaskTimeHistoryResponseObjectModel[] = [];
  taskChangeLogsResponseList: TaskChangeLogResponseObjectModel[] = [];
  taskChangeLogBindList: TaskChangeLogListToBindModel[] = [];
  temporaryTaskLabels: any[] = [];
  projectIdFromURL!: number | string;
  @ViewChild('countUpRef', { static: false }) countUpRef!: ElementRef;
  taskChangeLogRequestModel: TaskChangeLogRequestModel = new TaskChangeLogRequestModel();
  getTaskTimeHistoryRequestModel: GetTaskTimeHistoryRequestModel = new GetTaskTimeHistoryRequestModel();
  getTaskTimeHistoryRequestModelForPrint: GetTaskTimeHistoryForPrintRequestModel = new GetTaskTimeHistoryForPrintRequestModel();
  getSubTasksRequestModel: GetSubTaskListRequestModel = new GetSubTaskListRequestModel();
  newTaskStateAndStatus: TaskStateAndStatusModel = new TaskStateAndStatusModel();
  temporaryCommentsToBePosted: any = [];
  temporaryCommitsToBePosted: any = [];
  taskStartedByUsersList: any = [];
  @ViewChild('commentsComponentReference') commentsComponent!: CommentsComponent;
  @ViewChild('commitsComponentReference') commitsComponent!: CommitsComponent;
  @ViewChild('sectionselect') sectionSelectControl!: any;
  @ViewChild('taskDueDatePicker') dueDatePickerControl!: MatDatepicker<Date>;
  @ViewChild('taskStartDatePicker') startDatePickerControl!: MatDatepicker<Date>;
  @ViewChild('descriptionEditor') descriptionEditor!: QuillEditorComponent;
  @ViewChild('editorDiv') editorDiv!: any;

  @ViewChild('projectControl') projectControl: any;
  @ViewChild('taskTypeSelect') taskTypeControl: any;
  @ViewChild('container') container: any;
  @ViewChild(CommonTableComponent) workTimeHistoryComponent!: CommonTableComponent;
  taskTitleMinLengthErrorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_MINLENGTH;
  taskTitleMaxLengthErrorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_MAXLENGTH;
  taskTitleRequiredErrorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_REQUIRED;
  pendingTimeTaskData = {};
  isSubTaskPending = false;
  projectSearchControl = new FormControl();
  sectionSearchControl = new FormControl();
  name = 'ng2-ckeditor';
  ckeConfig: any;
  mycontent: any;
  log: any = '';
  @ViewChild('ckeditor') ckeditor: any;
  plainTextData = '';
  editorData = '<p>Hello</p>';

  taskTypeData: any;
  public filteredProjects: ReplaySubject<{ id: number; name: string; key: string }[]> = new ReplaySubject<
    { id: number; name: string; key: string }[]
  >(1);

  public filteredSections: ReplaySubject<{ id: number; title: string }[]> = new ReplaySubject<{ id: number; title: string }[]>(1);
  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();
  public return_url = '/tasks/list';
  stoppedTimeSlotByUser!: any;
  onGoingTaskHistoryLog: any;
  // editableWorkHistoryObject: any;
  userRole!: string;
  public isTaskStateDisabled = false;
  groupByFilterValue = 'project_id';
  public items = Utility.stateList.map((state: any) => {
    return { name: state.title, ...state };
  });
  public messageShown = false;
  public showSpinner = true;
  routerCallCount = 0;

  previousTaskStatusType: any;
  newTaskStatusType: any; //#endregion
  canShowWorkHistoryCommentPopupVisible = false;

  public isResponsiblePerson = false;
  isSetResposiblePersone = false;
  statusSelectionOpen = false;
  selectedStatusToDisplay: any = '';
  isStatusSelectionDisabled = true;
  routerSubscription!: Subscription;

  onCurrentRoute = false;
  afterStopTask = false;
  afterStopUpdateTimeHistory = '';

  constructor(
    private globalService: GlobalService,
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private router: Router,
    private spinnerService: SpinnerService,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private location: Location,
    private dialog: MatDialog,
    private documentService: DocumentsService
  ) {
    this.presetColors = this.globalService.presetColors;
    this.addTaskForm = this.initializeAddTaskForm();
    this.addSubTaskForm = this.initializeAddSubTaskForm();
    this.route.params.subscribe((res: any) => {
      this.routerCallCount += 1;
      this.currentTaskId = decodeURIComponent(res.id || '');
      if (this.routerCallCount == 2) {
        this.router
          .navigateByUrl(`/index`, {
            skipLocationChange: true,
          })
          .then(() => {
            this.router.navigate(['/tasks/view', this.currentTaskId]);
          });
      }
      // this.currentTaskId = this.route.snapshot.params['id'] || '';

      //project id will be never there from url
      // this.checkIfURLHasProjectId();

      const decryptedId = Encryption._doDecrypt(this.currentTaskId); // To avoid ids which are not properly encrypted, Member Accessing This Page Who is Not Part / Removed From Project
      if (this.currentTaskId && decryptedId) {
        this.getTaskDetailByTaskId(this.currentTaskId);
        // this.getTaskWorkedHours(this.currentTaskId);

        this.getTaskTimeHistoryRequestModel.task_id = this.currentTaskId || '';
        this.taskChangeLogRequestModel.task_id = this.currentTaskId || '';
        this.getSubTasksRequestModel.taskId = this.currentTaskId || '';
      } else {
        //Member Accessing This Page Who is Not Part / Removed From Project
        if (this.currentTaskId) {
          this.location.back();
        }
      }
    });
  }

  // @HostListener('document:click', ['$event'])
  // onGlobalClick(event: any): void {
  //   if (this.editorDiv && !this.editorDiv.nativeElement.contains(event.target) && this.isDescriptionControlVisible) {
  //     this.checkContentOnBlur();
  //   }
  // }

  ngOnInit(): void {
    // removePlugins : 'save,newPage,print,templates,preview,cut,copy,paste,find,replace,basicstyles,smiley,forms',
    this.ckeConfig = {
      stylesSet: [
        { name: 'Italic', element: 'em' },
        { name: 'Subtitle', element: 'h2', attributes: { class: 'subtitle' } },
        { name: 'SpecialContainer', element: 'div', styles: { 'background-color': '#EEEEEE', 'font-size': '20px' } },
        { name: 'big', element: 'big' },
        { name: 'small', element: 'small' },
        { name: 'typewriter', element: 'tt' },
        { name: 'computerCode', element: 'code' },
        { name: 'keyboardPhase', element: 'kbd' },
        { name: 'sampleText', element: 'samp' },
        { name: 'variable', element: 'var' },
        { name: 'deletedText', element: 'del' },
        { name: 'insertedText', element: 'ins' },
        { name: 'citedWork', element: 'cite' },
        { name: 'inlineQuotation', element: 'q' },
      ],
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
      // filebrowserBrowseUrl: `${environment.base_url}project/upload/file`,
      // filebrowserImageBrowseUrl: `${environment.base_url}project/upload/file`,
      filebrowserUploadUrl: `${environment.base_url}project/upload/file`,
      filebrowserImageUploadUrl: `${environment.base_url}project/upload/file`,
    };
    this.getProjectsRequestModel = new ProjectsRequestDataModel();
    if (
      this.route.snapshot.queryParams['r_url'] &&
      (this.route.snapshot.queryParams['r_url'] === 'board' || this.route.snapshot.queryParams['r_url'] === 'list')
    ) {
      this.return_url = `/tasks/${this.route.snapshot.queryParams['r_url']}`;
    }
    if (this.route.snapshot.queryParams['r_url'] && this.route.snapshot.queryParams['r_url'] === 'dashboard') {
      this.return_url = 'dashboard';
    }
    this.subscriptions.push(
      this.userService.getBreakTimeStatusProvider().subscribe((value: any) => {
        if (value) {
          // this.timerStartedTaskId = null;
          this.timerCount = TASK_TIMER_DEFAULT_VALUE;
          this.timerSourceSubscription?.unsubscribe();
          this.userIsIntBreak = true;
          this.isTaskTimerRunning = false;
          this.getTaskWorkHistory();
          // this.getTaskDetailByTaskId(this.currentTaskId);
          // setTimeout(() => {
          //   this.tasksService.setRefetchProjectWiseTask(true);
          // }, 1000);
        } else {
          this.userIsIntBreak = false;
        }
      })
    );
    this.getEnumData();
    this.getProjectsList();
    // this.getProjectsData();
    // this.getSingleProjectsData();
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
            //NA
          } else {
            this.onCurrentRoute = true;
            this.router.navigate(['/tasks/view', this.currentTaskId], { skipLocationChange: true }).then(() => {
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
    this.container.nativeElement.scrollTop = 0;
    const resizeHandle = document.querySelector('.resize-handle') as HTMLElement;
    // console.log('resizeHandle: ', resizeHandle);
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', this.startResize.bind(this));
    }
  }
  setTaskTimer(start_time: string) {
    this.timerSourceSubscription?.unsubscribe();
    this.timerSourceSubscription = this.timerSource.subscribe(() => {
      const currentCount = this.incrementTaskTimerCount(start_time);
      this.timerCount = currentCount;
      this.renderer.setProperty(this.countUpRef.nativeElement, 'innerText', currentCount);
    });
  }

  setTaskStateAndStatusToRunning() {
    const taskStateValue = this._addTaskForm['taskState'].value || '';
    const taskStatusValue = this._addTaskForm['taskStatus'].value || '';
    if (taskStateValue && taskStatusValue) {
      if (
        taskStateValue.name.replaceAll(' ', '').toLowerCase() != INPROGRESS_TASK_STATE_STATUS ||
        taskStatusValue.name.replaceAll(' ', '').toLowerCase() != INPROGRESS_TASK_STATE_STATUS
      ) {
        if (this.taskStateList && this.taskStateList.length > 0) {
          const findInProgressState = this.taskStateList.find(
            (stateObject: taskStateListEnumModel) => stateObject.name.replace(' ', '').toLowerCase() == INPROGRESS_TASK_STATE_STATUS
          );
          if (findInProgressState) {
            this.setFormControlValue('taskState', findInProgressState);
            this.prepareStatusList();
            this.onSubmitTask({ navigateToTaskList: false });
          }
        }
      }
    }
  }

  getLoggedInUser() {
    const loggedInUser: any = this.userService.getUserDataFromLS();
    if (loggedInUser && loggedInUser.user_id) {
      this.loggedInUserId = loggedInUser.user_id;
    }

    let getLoggedInUser: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA);
    getLoggedInUser = getLoggedInUser ? JSON.parse(Encryption._doDecrypt(getLoggedInUser)) : '';
    if (getLoggedInUser && getLoggedInUser.user_role) {
      this.userRole = getLoggedInUser.user_role || '';
    }
    if (this.userRole && this.userRole === USER_ROLES.SUPER_ADMIN) {
      this.canDeleteTimeSlot = true;
    } else if (
      this._addTaskForm['reportTo'].value &&
      this._addTaskForm['reportTo'].value.id &&
      getLoggedInUser &&
      getLoggedInUser.id == this._addTaskForm['reportTo'].value.id
    ) {
      this.canDeleteTimeSlot = true;
    } else {
      this.canDeleteTimeSlot = false;
    }
  }

  setEventListenerForQuillEditor() {
    this.quillEditorSubscription = this.quillEditorSource.subscribe(() => {
      if (this.descriptionEditor && this.descriptionEditor.quillEditor) {
        this.adjustEditorHeight();
        this.quillEditorSubscription.unsubscribe();
        this.descriptionEditor.quillEditor.getModule('toolbar').container.addEventListener('mousedown', (e: any) => {
          e.preventDefault();
        });
      }
    });
  }

  // increment the seconds and check for seconds and minutes, increment hours accoringly
  incrementTaskTimerCount(start_time: string) {
    // const [hours, minutes, seconds] = this.timerCount.split(':');
    // let hoursValue = parseInt(hours);
    // let minutesValue = parseInt(minutes);
    // let secondsValue = parseInt(seconds);
    // secondsValue++;

    // if (secondsValue === 60) {
    //   secondsValue = 0;
    //   minutesValue++;
    //   if (minutesValue === 60) {
    //     hoursValue++;
    //     minutesValue = 0;
    //   }
    // }

    // const formattedHours = this.padNumber(hoursValue);
    // const formattedMinutes = this.padNumber(minutesValue);
    // const formattedSeconds = this.padNumber(secondsValue);
    //return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

    return this.getTimerValue(0, 0, moment().diff(start_time, 'seconds'));
  }

  getTimerValue(hrs: number, mins: number, secs: number) {
    if (secs >= 60) {
      mins += secs / 60;
      secs = secs % 60;
    }
    if (mins >= 60) {
      hrs += mins / 60;
      mins = mins % 60;
    }
    const formattedHours = this.padNumber(parseInt(hrs.toString()));
    const formattedMinutes = this.padNumber(parseInt(mins.toString()));
    const formattedSeconds = this.padNumber(parseInt(secs.toString()));
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  padNumber(number: number) {
    return number.toString().padStart(2, '0');
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
    }
    // Task Type Enum
    if (this.taskTypeEnum) {
      Object.values(this.taskTypeEnum).forEach((taskType: string, index: any) => {
        if (taskType) {
          this.taskTypeList.push({ id: this.taskTypeList.length + 1, name: taskType });
        }
      });
    }

    // Task State Enum
    if (this.taskStateEnum) {
      Object.values(this.taskStateEnum).forEach((taskState: string) => {
        if (taskState) {
          this.taskStateList.push({ id: this.taskStateList.length + 1, name: taskState });
        }
      });
    }
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

  getSelectedTaskSubStatus(status: any) {
    this.setFormControlValue('taskStatus', status._value);
    this.addTaskForm.markAsDirty();

    this.toggleOverlayTaskStatusSelection();
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
        // prepare status list
        this.prepareStatusList();

        // get team members

        this.taskService
          .getProjectsTeamMembers({
            project_id: [this.selectedProject.id],
          })
          .subscribe((response: any) => {
            if (response.data && response.data.length && response.data[0].projectTeam && response.data[0].projectTeam.length > 0) {
              this.projectTeamMembers = response.data[0].projectTeam;
              this.reportToBindList = this.projectTeamMembers.map((teamMemberObject: ProjectTeam) => {
                teamMemberObject.user.name = this.globalService.getFullName(
                  teamMemberObject.user.first_name || '',
                  teamMemberObject.user.last_name || ''
                );
                return teamMemberObject.user;
              });
            }

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
              // if (response.data[0].responsible_person) {
              if (!this.isSetResposiblePersone) {
                if (this.taskDetailResponseData && this.taskDetailResponseData.reportToUser && this.currentTaskId) {
                  this.taskDetailResponseData.reportToUser.name =
                    this.taskDetailResponseData.reportToUser.first_name + ' ' + this.taskDetailResponseData.reportToUser.last_name;
                  this.setFormControlValue('reportTo', this.taskDetailResponseData.reportToUser);
                  this.isSetResposiblePersone = true;
                  if (this.taskDetailResponseData.reportToUser.id !== this.loggedInUserId) {
                    this.isResponsiblePerson = true;
                  } else {
                    this.isResponsiblePerson = false;
                  }
                }
              } else {
                const filterReportPerson = this.reportToBindList.find((user) => user.id === response.data[0]?.responsible_person);
                if (filterReportPerson) {
                  const reportPerson = {
                    id: filterReportPerson.id,
                    first_name: filterReportPerson.first_name,
                    last_name: filterReportPerson.last_name,
                    name: filterReportPerson.name,
                  };
                  this.setFormControlValue('reportTo', reportPerson);
                  this.setTaskSubscribers();
                } else {
                  this.setFormControlValue('reportTo', null);
                }
                if (filterReportPerson && filterReportPerson.id !== this.loggedInUserId) {
                  this.isResponsiblePerson = true;
                } else {
                  this.isResponsiblePerson = false;
                }
              }

              //  }
              // set assignTo, assignedBy, and Task Subscribers
              // By default logged in user will be in assignTo, assignedBy and in task subscribers only if new task is being created
              // otherwise need to bind task detail data
              if (this.currentTaskId && this.taskDetailResponseData) {
                if (this.taskDetailResponseData.assigneeUser) {
                  this.taskDetailResponseData.assigneeUser.name =
                    this.taskDetailResponseData.assigneeUser.first_name + ' ' + this.taskDetailResponseData.assigneeUser.last_name;
                  this.setFormControlValue('assignTo', this.taskDetailResponseData.assigneeUser);
                  this.checkIsTaskAssignedToSelf();
                }
                // bind assigned by
                if (this.taskDetailResponseData.assignedByUser) {
                  this.taskDetailResponseData.assignedByUser.name =
                    this.taskDetailResponseData.assignedByUser.first_name + ' ' + this.taskDetailResponseData.assignedByUser.last_name;
                  this.setFormControlValue('assignedBy', this.taskDetailResponseData.assignedByUser);
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
            console.log('%c  response:', 'color: #0e93e0;background: #aaefe5;', response);
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

              // if task is in edit mode, bind data in custom fields
              if (this.currentTaskId) {
                if (this.taskDetailResponseData.TaskCustomFieldValue && this.taskDetailResponseData.TaskCustomFieldValue.length > 0) {
                  this.taskDetailResponseData.TaskCustomFieldValue.forEach((customFieldObject: any) => {
                    if (customFieldObject.task_custom_field_id) {
                      // set descriptive form fields value
                      if (this.descriptiveFormFieldArray && this.descriptiveFormFieldArray.length > 0) {
                        this.descriptiveFormFieldArray.controls.forEach((descriptiveFormControlObject: any) => {
                          if (
                            descriptiveFormControlObject.value.otherFieldProperties.id === customFieldObject.task_custom_field_id &&
                            descriptiveFormControlObject.value.otherFieldProperties.fieldType === customFieldObject.TaskCustomFieldLabelData.fieldType
                          ) {
                            if (!isNaN(Date.parse(customFieldObject.value)) && customFieldObject.value.includes('/')) {
                              const date = this.globalService.convertToISO(customFieldObject.value);
                              descriptiveFormControlObject.controls.fieldControl.patchValue(date);
                            } else {
                              descriptiveFormControlObject.controls.fieldControl.patchValue(
                                +customFieldObject.value ? +customFieldObject.value : customFieldObject.value
                              );
                            }
                          }
                        });
                      }
                      // set context form fields value
                      if (this.contextFormFieldArray && this.contextFormFieldArray.length > 0) {
                        this.contextFormFieldArray.controls.forEach((contextFormControlObject: any) => {
                          if (
                            contextFormControlObject.value.otherFieldProperties.id === customFieldObject.task_custom_field_id &&
                            contextFormControlObject.value.otherFieldProperties.fieldType === customFieldObject.TaskCustomFieldLabelData.fieldType
                          ) {
                            if (!isNaN(Date.parse(customFieldObject.value))) {
                              const date = this.globalService.convertToISO(customFieldObject.value);
                              contextFormControlObject.controls.fieldControl.patchValue(date);
                            } else {
                              contextFormControlObject.controls.fieldControl.patchValue(customFieldObject.value);
                            }
                          }
                        });
                      }
                    }
                  });
                }
              }
            } else {
              this.descriptiveFields = [];
              this.contextFields = [];
              this.removeCustomFieldsFormArrayControls();
            }
          });

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
                // check if task is in edit mode, then bind particular section from sectionsList
                if (this.currentTaskId && this.taskDetailResponseData && this.taskDetailResponseData.section) {
                  const sectionToBindFromList = this.sectionsList.find(
                    (sectionObject: SectionObjectModel) => sectionObject.id == this.taskDetailResponseData.section
                  );
                  if (sectionToBindFromList) {
                    // this._addTaskForm['section'].setValue({ title: sectionToBindFromList.title });
                    this.setSectionFormControlValue({ id: sectionToBindFromList.id, title: sectionToBindFromList.title });
                    console.log('this.addTaskForm:', this.addTaskForm);
                    console.log('%c  sectionToBindFromList:', 'color: #0e93e0;background: #aaefe5;', sectionToBindFromList);
                  }
                }
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

  getSelectedSubTaskReporter(data: any) {}

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

  addNewSubTask() {}

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

    // if (evt.dataTransfer.files?.length >= 0) {
    //   const isValid =
    //     this.globalService.checkFileType(evt.dataTransfer.files[0], this.globalService.expectedDocumentsFileTypes) &&
    //this.globalService.checkFileSize(evt.dataTransfer.files[0], 5);
    //   if (isValid) {
    //     this.attachedDocuments.push(evt.dataTransfer.files[0]);
    //   }
    // }
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
  //Check if any subtak if pending or not
  checkIfSubTaskPending() {
    let count = 0;
    this.subTasksList?.forEach((subTaskObject: any) => {
      // console.log('subTaskObject: ', subTaskObject);
      if (subTaskObject?.state == 'completed') {
        count++;
      }
    });
    if (count == this.subTasksList?.length) {
      this.isSubTaskPending = true;
    } else {
      this.isSubTaskPending = false;
    }
    // this.taskService.getTaskById(this.currentTaskId).subscribe({
    //   next: (response: any) => {
    //     if (response) {
    //       this.spinnerService.hideSpinner();
    //       if (response.data) {
    //         this.pendingTimeTaskData = response.data;
    //         console.log('this.pendingTimeTaskData: ', this.pendingTimeTaskData);
    //       }
    //     }
    //   },
    //   error: (error: any) => {
    //     this.spinnerService.hideSpinner();
    //     console.log('error:', error);
    //   },
    //   complete: () => {
    //     this.spinnerService.hideSpinner();
    //   },
    // });
  }

  //handle attached document   -------end---------

  // Make POST API call to create task if form is valid
  onSubmitTask(optionalObject?: { navigateToTaskList: boolean }) {
    this.isSetResposiblePersone = false;
    this.messageShown = false;
    this.isTaskSubmitted = true;
    if (this.addTaskForm.valid) {
      const formValue = this.addTaskForm.getRawValue();
      console.log('%c  formValue:', 'color: #0e93e0;background: #aaefe5;', formValue);
      const formData = new FormData();
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.PROJECT_ID, this.selectedProject.id.toString() || null);
      formData.append(
        TASK_REQUEST_KEYS_CONSTANTS.PARENT_TASK_ID,
        formValue.parentTask && formValue.parentTask.id ? formValue.parentTask.id.toString() : null
      );
      formData.append(
        TASK_REQUEST_KEYS_CONSTANTS.PARENT_TASK_TITLE,
        formValue.parentTask && formValue.parentTask.title ? formValue.parentTask.title : null
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
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.PRIORITY, formValue.taskPriority ? formValue.taskPriority.name : null);
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
      this.customFieldsToBeUpdatedList = [];
      if (formValue.descriptiveFormFieldArray && formValue.descriptiveFormFieldArray.length > 0) {
        formValue.descriptiveFormFieldArray.forEach((formControl: any) => {
          if (formControl.fieldControl instanceof Date) {
            if (this.currentTaskId) {
              const customFieldObject: any = this.getCustomFieldObject(formControl, CUSTOM_FIELDS_CONSTANTS.DESCRIPTIVE);
              this.customFieldsToBeUpdatedList.push(customFieldObject);
            }
          } else if (formControl.otherFieldProperties.type === 'radio') {
            if (formControl.otherFieldProperties.options && formControl.otherFieldProperties.options.length > 0) {
              const selectedOption: { id: number; value: string } = formControl.otherFieldProperties.options.find(
                (optionObject: { id: number; value: string }) => optionObject.value === formControl.fieldControl
              );
              if (selectedOption) {
                if (this.currentTaskId) {
                  const customFieldObject: any = this.getCustomFieldObject(formControl, CUSTOM_FIELDS_CONSTANTS.DESCRIPTIVE);
                  this.customFieldsToBeUpdatedList.push(customFieldObject);
                }
              }
            }
          } else {
            if (this.currentTaskId) {
              const customfieldObject: any = this.getCustomFieldObject(formControl, CUSTOM_FIELDS_CONSTANTS.DESCRIPTIVE);
              this.customFieldsToBeUpdatedList.push(customfieldObject);
            }
          }
        });
      }
      if (formValue.contextFormFieldArray && formValue.contextFormFieldArray.length > 0) {
        formValue.contextFormFieldArray.forEach((formControl: any) => {
          if (formControl.fieldControl instanceof Date) {
            if (this.currentTaskId) {
              const customFieldObject: any = this.getCustomFieldObject(formControl, CUSTOM_FIELDS_CONSTANTS.CONTEXT);
              this.customFieldsToBeUpdatedList.push(customFieldObject);
            }
          } else if (formControl.otherFieldProperties.type === 'radio') {
            if (formControl.otherFieldProperties.options && formControl.otherFieldProperties.options.length > 0) {
              const selectedOption: { id: number; value: string } = formControl.otherFieldProperties.options.find(
                (optionObject: { id: number; value: string }) => optionObject.value === formControl.fieldControl
              );
              if (selectedOption) {
                if (this.currentTaskId) {
                  const customFieldObject: any = this.getCustomFieldObject(formControl, CUSTOM_FIELDS_CONSTANTS.CONTEXT);
                  this.customFieldsToBeUpdatedList.push(customFieldObject);
                }
              }
            }
          } else {
            if (this.currentTaskId) {
              const customFieldObject: any = this.getCustomFieldObject(formControl, CUSTOM_FIELDS_CONSTANTS.CONTEXT);
              this.customFieldsToBeUpdatedList.push(customFieldObject);
            }
          }
        });
      }

      if (this.currentTaskId && this.customFieldsToBeUpdatedList && this.customFieldsToBeUpdatedList.length > 0) {
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.TASK_CUSTOM_FIELD_VALUE, JSON.stringify(this.customFieldsToBeUpdatedList || []));
      }

      // console.log('this.newTaskStatusType: ', this.newTaskStatusType);
      // console.log('this.previousTaskStatusType: ', this.previousTaskStatusType);
      if (this.newTaskStatusType?.name && this.previousTaskStatusType) {
        const tast_status_body = { oldvalue: this.previousTaskStatusType, newvalue: this.newTaskStatusType?.name };
        // console.log('tast_status_body: ', tast_status_body);
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.SUB_STAUS, JSON.stringify(tast_status_body));
      }
      if (this.currentTaskId) {
        // check if task is in edit mode and documents are removed
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.DELETED_DOCUMENTS, this.deletedDocuments ? JSON.stringify(this.deletedDocuments) : '');

        // pass assigneeUser,assignedByUser,reportToUser in case of edit task
        const assigneeUser = this._addTaskForm['assignTo'].value || '';
        const assignedByUser = this._addTaskForm['assignedBy'].value || '';
        const reportToUser = this._addTaskForm['reportTo'].value || '';

        formData.append(TASK_REQUEST_KEYS_CONSTANTS.ASSIGNEE_USER, JSON.stringify(assigneeUser) || '');
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.ASSIGNED_BY_USER, JSON.stringify(assignedByUser) || '');
        formData.append(TASK_REQUEST_KEYS_CONSTANTS.REPORT_TO_USER, JSON.stringify(reportToUser) || '');
        // console.log('this.subTasksList: ', this.subTasksList);
        this.checkIfSubTaskPending();
        // console.log('this.isSubTaskPending: ', this.isSubTaskPending);
        if (!this.isSubTaskPending && formValue?.taskState?.name == 'Completed') {
          const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            data: {
              title: 'Are you sure about this?',
              content: 'Completing the parent task will automatically mark all its subtasks as completed.',
            },
          });
          dialogRef.afterClosed().subscribe((result) => {
            if (result) {
              this.spinnerService.showSpinner();

              this.subscriptions.push(
                this.taskService.updateTask(formData, this.currentTaskId).subscribe({
                  next: (response: any) => {
                    if (response) {
                      this.spinnerService.hideSpinner();
                      if (response.status === 200 && response.success) {
                        this.snackBar.open(response.message);
                        if (!this.isTaskTimerToggled && !this.messageShown) {
                          // this.snackBar.open(response.message);
                        } else if (this.isTaskTimerToggled && !this.messageShown) {
                          this.messageShown = true;
                          this.isTaskTimerToggled = false;
                        }
                        if (this.isTaskCompleted) {
                          this.isTaskCompleted = false;
                          this.isTaskTimerRunning = false;
                          this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
                        }
                        this.isLabelsChanged = false;
                        this.isSubscriberModified = false;
                        this.isDocumentsModified = false;
                        Object.keys(this.addTaskForm.controls).forEach((i) => {
                          this.addTaskForm.controls[i].markAsPristine();
                        });

                        this.getTaskDetailByTaskId(this.currentTaskId);
                      }
                    }
                  },
                  error: (error: any) => {
                    console.log('error:', error);
                    this.spinnerService.hideSpinner();
                  },
                })
              );
            }
          });
        } else {
          this.spinnerService.showSpinner();
          this.subscriptions.push(
            this.taskService.updateTask(formData, this.currentTaskId).subscribe({
              next: (response: any) => {
                if (response) {
                  this.spinnerService.hideSpinner();
                  if (response.status === 200 && response.success) {
                    this.snackBar.open(response.message);
                    if (!this.isTaskTimerToggled && !this.messageShown) {
                      // this.snackBar.open(response.message);
                    } else if (this.isTaskTimerToggled && !this.messageShown) {
                      this.messageShown = true;
                      this.isTaskTimerToggled = false;
                    }
                    if (this.isTaskCompleted) {
                      this.isTaskCompleted = false;
                      this.isTaskTimerRunning = false;
                      this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
                    }
                    this.isLabelsChanged = false;
                    this.isSubscriberModified = false;
                    this.isDocumentsModified = false;
                    Object.keys(this.addTaskForm.controls).forEach((i) => {
                      this.addTaskForm.controls[i].markAsPristine();
                    });
                    this.getTaskDetailByTaskId(this.currentTaskId);
                    // if (optionalObject) {
                    //   if (optionalObject.navigateToTaskList) {
                    //     this.router.navigate([this.return_url]);
                    //   }
                    // } else {
                    //   this.router.navigate([this.return_url]);
                    // }
                  }
                }
              },
              error: (error: any) => {
                console.log('error:', error);
                this.spinnerService.hideSpinner();
              },
            })
          );
        }

        // update task
      }
    } else {
      this.snackBar.open(ERROR_MESSAGE_CONSTANTS.REQUIRED_AND_INVALID_FORM);
    }
  }

  navigateToTaskList() {
    this.router.navigate([this.return_url]);
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

  toggleOverlayTaskStatusSelection() {
    // first check if permission is there for task status or not
    if (!this.isDisableTaskStatusOverlay) {
      if (!this.isOverlayTaskStatus) {
        if (!this._addTaskForm['project'].value) {
          this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
        } else if (this.taskStatusList && this.taskStatusList.length == 0) {
          this.snackBar.open(`No substatus is found for ${this._addTaskForm['taskState'].value.name} status.`);
        } else {
          this.isOverlayTaskStatus = !this.isOverlayTaskStatus;
        }
      } else {
        this.isOverlayTaskStatus = !this.isOverlayTaskStatus;
      }
    }
  }

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
    // this.toggleOverlayForPriority();
  }

  getSelectedTaskType(event: any) {
    // this.setFormControlValue('taskType', event.value.name);
    this.setFormControlValue('taskType', event);
    this.taskTypeData.type = event;
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

  onSelectState(state: any) {
    // console.log(state._value);
    this.newTaskStatusType = state._value;
    this.setFormControlValue('taskState', state._value);
    this.resetFormControl('taskStatus');
    this.prepareStatusList();
    this.toggleOverlayTaskStateSelection();
  }

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
    } else {
      this.documentService.getDocumentFile(file.url).subscribe((file: any) => {
        const objectURL = URL.createObjectURL(file);
        const documentFile: any = this.sanitizer.bypassSecurityTrustUrl(objectURL);

        this.router.navigate([]).then((result) => {
          window.open(documentFile.changingThisBreaksApplicationSecurity, '_blank');
        });
      });
      // window.open(this.taskBaseURL + file.url, '_blank');
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
    if (this.selectedProject) {
      this.isStatusSelectionDisabled = true;
      //get project status
      this.taskService
        .getProjectsStatusById({
          project_id: [this.selectedProject.id],
        })
        .subscribe((response: any) => {
          const currentState = this._addTaskForm['taskState'].value;
          if (currentState && response.data && response.data.length && response.data[0].projectStatus && response.data[0].projectStatus.length > 0) {
            const statusList = response.data[0].projectStatus || [];
            this.allStatusList = statusList;
            if (statusList && statusList.length > 0) {
              this.taskStatusList = [];
              this.isStatusSelectionDisabled = false;
              statusList.forEach((statusObject: any) => {
                // if (statusObject.state === currentState.name.toString().toLowerCase().replaceAll(' ', '')) {
                this.taskStatusList.push({
                  id: statusObject.id || '',
                  name: statusObject.title || '',
                  color: statusObject.color || '',
                  state: statusObject.state || '',
                });
                // }
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
              // bind status in case of edit task

              if (this.currentTaskId) {
                if (this.taskDetailResponseData && this.taskDetailResponseData.status) {
                  if (this.taskStatusList && this.taskStatusList.length > 0) {
                    const selectedStatus = this.taskStatusList.find((statusObject: any) => statusObject.id == this.taskDetailResponseData.status);
                    if (selectedStatus) {
                      this.setFormControlValue('taskStatus', selectedStatus);
                      this.selectedStatusToDisplay = selectedStatus?.name;
                    } else {
                      this.bindDefaultStatusObject(currentState);
                    }
                  }
                } else {
                  this.bindDefaultStatusObject(currentState);
                }
              }
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
      console.log(this.selectedStatusToDisplay);
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
                // check if task is in edit mode, bind task labels
                if (
                  this.currentTaskId &&
                  this.taskDetailResponseData &&
                  this.taskDetailResponseData.labels &&
                  this.taskDetailResponseData.labels.length > 0
                ) {
                  const taskLabels: any = [];
                  this.taskDetailResponseData.labels.forEach((labelObject: number) => {
                    const taskLabelFindIndex = this.taskLabels.findIndex((taskLabel: any) => taskLabel.id === labelObject);
                    if (taskLabelFindIndex > -1) {
                      taskLabels.push(this.taskLabels[taskLabelFindIndex]);
                    }
                  });
                  if (taskLabels && taskLabels.length > 0) {
                    this.setFormControlValue('taskLabelControl', taskLabels);
                    this.temporaryTaskLabels = taskLabels;
                  }
                }
              } else {
                this.taskLabels = [];
              }
              // this.resetFormControl('taskLabelControl');
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
    // console.log('event:', event);
  }

  onSelectionChange(event: any) {
    // console.log('event:', event);
  }
  cancelCustumFieldValue(event: any) {
    console.log(event);
  }
  onTaskDateChange() {}

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
    // console.log('event:', event);
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

  resetSectionField() {
    this._addTaskForm['section'].reset();
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

          // project_id
          // if (this.projectIdFromURL && this.projectNameList && this.projectNameList.length > 0) {
          //   this.projectIdFromURL = Encryption._doDecrypt(this.projectIdFromURL.toString());
          //   const findProjectFromQueryParam = this.projectNameList.find(
          //     (projectObject: ProjectNameModel) => projectObject.id == this.projectIdFromURL
          //   );
          //   if (findProjectFromQueryParam) {
          //     this.setFormControlValue('project', findProjectFromQueryParam);
          //     this.populateTaskDataBasedonProjectSelected(findProjectFromQueryParam);
          //   }
          // }
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
  //                   console.log('bind project from url id');
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

  // get task details to bind into form
  getTaskTypeDataColor(data: any) {
    const taskTypeIndicator = {
      Bug: '#ff5959',
      Task: '#0052cc',
      Epic: '#8b63cf',
    };
    this.taskTypeData = data;
    this.taskTypeData = {
      ...this.taskTypeData,
      taskTypeIndicator: taskTypeIndicator,
    };
  }
  getTaskDetailByTaskId(taskId: string) {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.taskService.getTaskById(taskId).subscribe({
        next: (response: any) => {
          if (response) {
            this.spinnerService.hideSpinner();
            if (response.data) {
              this.taskDetailResponseData = response.data;
              this.taskDetailResponseData['pending_time_minutes'] = this.getPendingTime(response?.data?.total_worked_hours, response?.data?.eta);
              this.previousTaskStatusType = this.taskDetailResponseData?.TaskStatus?.state;
              this.mycontent = response?.data?.description;
              this.getTaskTypeDataColor(response.data);
              this.bindTaskDetail();
              this.reviewTaskTimer();
              this.getTaskWorkHistory();
              this.getSubTasks();
              this.isCallComments = true;
              this.isCallCommits = true;
            }
          }
        },
        error: (error: any) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
        },
        complete: () => {
          this.spinnerService.hideSpinner();
        },
      })
    );
  }

  // This method will check if task is running or stopped, will set task status image based on it
  // also checks if task is started by multiple users then shows group image
  reviewTaskTimer() {
    // check for task timer status => if it is ongoing, set isTaskTimerRunning = true
    // if it is stop (stopped), set isTaskTimerRunning = false
    const loggedInUser = this.userService.getLoggedInUserId();
    this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : null;
    this.isTaskTimerRunning = false;

    if (this.taskDetailResponseData.TaskRunningStatus && this.taskDetailResponseData.TaskRunningStatus.length > 0) {
      const taskRunningStatus = this.taskDetailResponseData.TaskRunningStatus || [];
      // check if single user is running task, array length is 1;
      if (taskRunningStatus.length == 1) {
        // check if logged in user is running task
        if (loggedInUser == taskRunningStatus[0].user_id) {
          if (taskRunningStatus[0].running_status.toLowerCase() == TASK_TIMER_CONSTANTS.STOP.toLowerCase()) {
            this.isTaskTimerRunning = false;
          } else if (taskRunningStatus[0].running_status.toLowerCase() == TASK_TIMER_CONSTANTS.ONGOING.toLowerCase()) {
            this.isTaskTimerRunning = true;
          }
        } else {
          this.isTaskTimerRunning = false;
        }
      } else {
        // check if logged in user is running task then show running status
        const findLoggedInUser = taskRunningStatus.find((taskRunningStatusObject: any) => taskRunningStatusObject.user_id == loggedInUser);
        if (findLoggedInUser) {
          // check task running status
          if (findLoggedInUser.running_status.toLowerCase() == TASK_TIMER_CONSTANTS.ONGOING.toLowerCase()) {
            this.isTaskTimerRunning = true;
          }
        }
        // check if task timer is started by more than 1 user
        let taskStartedCount = 0;
        taskRunningStatus.forEach((taskRunningStatusObject: any) => {
          if (taskRunningStatusObject.running_status.toLowerCase() == TASK_TIMER_CONSTANTS.ONGOING.toLowerCase()) {
            if (taskRunningStatusObject.user_id != findLoggedInUser.user_id) {
              taskStartedCount += 1;
              this.taskStartedByUsersList.push(taskRunningStatusObject.user_id);
            }
          }
        });
        if (taskStartedCount !== 0 && taskStartedCount >= 1) {
          this.isTaskStartedByMultipleUsers = true;
        }
        if (this.taskStartedByUsersList && this.taskStartedByUsersList.length > 0) {
          //find from project team members
          this.taskTeamMemberSubscription = this.taskTeamMemberSource.subscribe(() => {
            if (this.projectTeamMembers && this.projectTeamMembers.length > 0) {
              this.taskTeamMemberSubscription.unsubscribe();
              const tempTaskStartedByUsersList: any = [];
              this.taskStartedByUsersList.forEach((taskStartedByUserObject: number) => {
                const findUserFromTeamObject = this.projectTeamMembers.find((userObject: any) => userObject.user_id === taskStartedByUserObject);
                if (findUserFromTeamObject) {
                  tempTaskStartedByUsersList.push(findUserFromTeamObject.user);
                }
              });
              if (tempTaskStartedByUsersList && tempTaskStartedByUsersList.length > 0) {
                this.taskStartedByUsersList = tempTaskStartedByUsersList;
              } else {
                this.taskStartedByUsersList = [];
              }
            }
          });
        }
      }

      // set task timer based on the status and previous time spent
      if (this.taskDetailResponseData && this.taskDetailResponseData.TaskRunningStatus && this.taskDetailResponseData.TaskRunningStatus.length > 0) {
        // find current user's running status
        const findUserRunningStatus = this.taskDetailResponseData.TaskRunningStatus.find(
          (runningStatusObject: any) => runningStatusObject.user_id == loggedInUser
        );
        if (findUserRunningStatus && findUserRunningStatus.running_status.toLowerCase() == TASK_TIMER_CONSTANTS.ONGOING.toLowerCase()) {
          const dateOnTaskStarted = findUserRunningStatus.updated_at;
          this.timerCount = this.getTimerValue(0, 0, moment().diff(dateOnTaskStarted, 'seconds'));
          this.setTaskTimer(findUserRunningStatus.updated_at);
        }
      }

      // check if task is paused then show total time
      if (!this.isTaskTimerRunning && this.taskDetailResponseData.total_worked_hours) {
        this.timerCount = this.taskDetailResponseData.total_worked_hours;
        this.renderer.setProperty(this.countUpRef.nativeElement, 'innerText', this.timerCount);
      }
    }
  }

  // bind task detail to show current task details
  bindTaskDetail() {
    if (this.taskDetailResponseData) {
      this.addTaskForm.patchValue({
        description: this.taskDetailResponseData.description || '',
        title: this.taskDetailResponseData.title || '',
        taskType: this.taskDetailResponseData.type,
        taskStartDate: this.taskDetailResponseData.start_date ? this.taskDetailResponseData.start_date : '',
        taskDueDate: this.taskDetailResponseData.due_date ? this.taskDetailResponseData.due_date : '',
        estimatedTime: this.taskDetailResponseData.eta ? this.taskDetailResponseData.eta : '',
        parentTask: this.taskDetailResponseData.parentTask || '',
        externalTaskLinkInput: this.taskDetailResponseData.external_link || '',
      });

      if (this.taskDetailResponseData.parentTask) {
        const encryptedTaskId = Encryption._doEncrypt(this.taskDetailResponseData.parentTask.id.toString());
        const parentTaskObject = {
          id: this.taskDetailResponseData.parentTask.id,
          title: this.taskDetailResponseData.parentTask.title,
          taskURL: location.origin + `${TASK_DETAIL_ROUTE}${encodeURIComponent(encryptedTaskId)}`,
        };
        this.setFormControlValue('parentTask', parentTaskObject);
      }
      if (this.taskDetailResponseData.description) {
        this.hideDescriptionControl();
      }
      // bind task state
      if (this.taskDetailResponseData.state) {
        const stateString: any = this.taskStateList.find(
          (state: any) => state.name.toLowerCase().replaceAll(' ', '') === this.taskDetailResponseData.state
        );
        if (stateString) {
          this.setFormControlValue('taskState', { name: stateString.name });
        }
      }

      // bind project
      this.projectSubscription = this.projectSource.subscribe(() => {
        if (this.projectNameList && this.projectNameList.length > 0 && this.taskDetailResponseData.project_id) {
          this.projectSubscription.unsubscribe();
          const taskOfWhichProject = this.projectNameList.find((project: ProjectNameModel) => project.id === this.taskDetailResponseData.project_id);
          if (taskOfWhichProject) {
            this.setFormControlValue('project', taskOfWhichProject);
            this.populateTaskDataBasedonProjectSelected(taskOfWhichProject);
          }
        }
      });

      // if (this.taskDetailResponseData.task_key) {
      // }
      if (this.taskDetailResponseData.task_key_prefix && this.taskDetailResponseData.task_unique_key) {
        this.taskKey = this.taskDetailResponseData.task_key_prefix + '-' + this.taskDetailResponseData.task_unique_key || '';
      } else {
        this.taskKey = this.taskDetailResponseData.task_key || '';
      }
      // bind task priority
      if (this.taskDetailResponseData.priority && this.taskPriorityList && this.taskPriorityList.length > 0) {
        const taskPriorityObject = this.taskPriorityList.find(
          (taskPriorityObject: any) => taskPriorityObject.name == this.taskDetailResponseData.priority
        );
        if (taskPriorityObject && taskPriorityObject.name) {
          this.setFormControlValue('taskPriority', taskPriorityObject);
        }
      }

      // bind task subscribers
      this.taskSubscriberSubscription = this.taskSubscribersSource.subscribe(() => {
        if (this.reportToBindList && this.reportToBindList.length > 0) {
          if (this.taskDetailResponseData.subscribers && this.taskDetailResponseData.subscribers.length > 0) {
            this.taskSubscriberSubscription.unsubscribe();
            const subscribersArray: ProjectTeamMember[] = [];
            this.taskDetailResponseData.subscribers.forEach((subscriberObject: any) => {
              const subscriberFindIndex = this.reportToBindList.findIndex(
                (reportToObject: ProjectTeamMember) => reportToObject.id === subscriberObject
              );
              if (subscriberFindIndex > -1) {
                subscribersArray.push(this.reportToBindList[subscriberFindIndex]);
              }
            });
            if (subscribersArray && subscribersArray.length > 0) {
              this.setFormControlValue('taskSubscribers', subscribersArray);
            }
          }
        }
      });

      // bind task documents
      if (this.taskDetailResponseData.documents && this.taskDetailResponseData.documents.length > 0) {
        this.attachedDocuments = [];
        this.taskDetailResponseData.documents.forEach((documentObject: string) => {
          const taskDocumentObject: any = {
            url: documentObject || '',
            name: documentObject.split('/').pop(),
          };
          this.attachedDocuments.push(taskDocumentObject);
        });
      }
      //  task unique key pending to bind,

      // check if taskDetailResponseData has no start dat or due date, then remove default selected date from form control
      if (!this.taskDetailResponseData.start_date) {
        this.resetAndClearFormControlValidations('taskStartDate');
      }
      if (!this.taskDetailResponseData.due_date) {
        this.resetAndClearFormControlValidations('taskDueDate');
      }

      // bind createdBy and createdOn
      this.selectedProjectSubscription = this.selectedProjectSource.subscribe(() => {
        if (this.selectedProject) {
          const taskCreatedByUserId = this.taskDetailResponseData.created_by || '';
          if (taskCreatedByUserId && this.projectTeamMembers && this.projectTeamMembers.length > 0) {
            const userName = this.projectTeamMembers.find((teamMemberObject: any) => teamMemberObject.user_id == taskCreatedByUserId);
            if (userName) {
              this.selectedProjectSubscription.unsubscribe();
              const taskCreatedUpdatedLog: TaskCreatedUpdatedLogModel = {
                createdBy: userName.user.first_name + ' ' + userName.user.last_name,
                createdOn: moment(this.taskDetailResponseData.created_at).format(DATE_FORMAT_CONSTANTS.DD_MM_YYYY) || '',
                updatedOn: this.taskDetailResponseData.updated_at || '',
              };
              this.taskCreatedUpdatedObject = taskCreatedUpdatedLog;
            }
          }
        }
      });
      this.adjustEditorHeight();
    }
  }

  // this method will reset form control and clear validation
  resetAndClearFormControlValidations(formControlName: string) {
    this._addTaskForm[formControlName].reset();
    //  this._addTaskForm[formControlName].clearValidators();
    this._addTaskForm[formControlName].updateValueAndValidity();
  }

  getCustomFieldObject(formControl: any, customFieldType: string) {
    let currentTaskId;
    if (this.currentTaskId) {
      currentTaskId = Encryption._doDecrypt(this.currentTaskId);
    }
    if (customFieldType == CUSTOM_FIELDS_CONSTANTS.DESCRIPTIVE) {
      if (this.descriptiveFormFieldArray && this.descriptiveFormFieldArray.value && this.descriptiveFormFieldArray.value.length > 0) {
        const taskCustomFieldObject: any = this.descriptiveFormFieldArray.value.find(
          (taskObject: any) =>
            taskObject.otherFieldProperties.fieldType === formControl.otherFieldProperties.fieldType &&
            taskObject.otherFieldProperties.id === formControl.otherFieldProperties.id
        );
        if (taskCustomFieldObject) {
          const customObjectForCustoField = {
            id: taskCustomFieldObject.otherFieldProperties.id || '',
            task_custom_field_id: taskCustomFieldObject.otherFieldProperties.custom_field_id || '',
            value: formControl.fieldControl || '',
            task_id: currentTaskId || '',
            TaskCustomFieldLabelData: taskCustomFieldObject.otherFieldProperties.label,
          };
          return customObjectForCustoField;
        } else {
          return '';
        }
      } else {
        return '';
      }
    } else if (customFieldType == CUSTOM_FIELDS_CONSTANTS.CONTEXT) {
      if (this.contextFormFieldArray && this.contextFormFieldArray.value && this.contextFormFieldArray.value.length > 0) {
        const taskCustomFieldObject: any = this.contextFormFieldArray.value.find(
          (taskObject: any) =>
            taskObject.otherFieldProperties.fieldType === formControl.otherFieldProperties.fieldType &&
            taskObject.otherFieldProperties.id === formControl.otherFieldProperties.id
        );
        if (taskCustomFieldObject) {
          const customObjectForCustoField = {
            id: taskCustomFieldObject.id || '',
            task_custom_field_id: taskCustomFieldObject.task_custom_field_id || '',
            value: formControl.fieldControl || '',
            task_id: currentTaskId || '',
            TaskCustomFieldLabelData: taskCustomFieldObject.otherFieldProperties.label,
          };
          return customObjectForCustoField;
        } else {
          return '';
        }
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  // check if user selects mention user, and if project is not selected, show error message
  onEditorContentChange(event: any) {
    this.adjustEditorHeight();
    // if (event) {
    //   if (event.html == '<p>@</p>') {
    //     if (this.reportToBindList && this.reportToBindList.length == 0) {
    //       this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
    //       this.addTaskForm.reset();
    //     }
    //   } else if (event.html && this.reportToBindList && this.reportToBindList.length == 0) {
    //     if (!this.currentTaskId) {
    //       this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
    //       this.addTaskForm.reset();
    //     }
    //   }
    // }
  }

  // This method checks if only empty space is there in editor, then removes empty space
  checkContentOnBlur() {
    const div: any = document.createElement('div');
    div.innerHTML = this._addTaskForm['description'].value ? this._addTaskForm['description'].value.trim() : '';
    if (div.firstChild && div.firstChild.firstChild.data && div.firstChild.firstChild.data.trim().length == 0) {
      this._addTaskForm['description'].reset();
    }

    // check if task is in edit mode then toggle hide description editor, show description only
    if (this.currentTaskId) {
      if (this._addTaskForm['description'].value) {
        this.hideDescriptionControl();
      }
    }
  }

  stopTask() {
    const timerRequestBody: TaskTimerRequestModel = {
      task_id: Encryption._doDecrypt(this.currentTaskId),
    };
    this.spinnerService.showSpinner();
    // Check If task timer is running (this.isTaskTimerRunning), then stop task timer and vice versa
    if (this.isTaskTimerRunning) {
      this.subscriptions.push(
        this.taskService.stopTaskTimer(timerRequestBody).subscribe({
          next: (response: toggleTaskTimerResponseModel) => {
            if (response) {
              this.spinnerService.hideSpinner();
              if (response.success) {
                this.afterStopTask = false;
                this.updateTimeHistory(this.afterStopUpdateTimeHistory);
                this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
                this.isTaskTimerRunning = !this.isTaskTimerRunning;
                this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK, Encryption._doEncrypt(JSON.stringify(0)));
                if (response.data) {
                  const responseData: any = response.data;
                  if (responseData.total_worked_hours) {
                    this.taskDetailResponseData.total_worked_hours = responseData.total_worked_hours;
                  }
                  if (responseData.pendingTime) {
                    this.taskDetailResponseData.pendingTime = responseData.pendingTime;
                  }
                  if (responseData.total_worked_hours && this.taskDetailResponseData.eta) {
                    this.taskDetailResponseData['pending_time_minutes'] = this.getPendingTime(responseData?.total_worked_hours, responseData?.eta);
                  }
                  if (!this.isTaskTimerRunning && this.taskDetailResponseData.total_worked_hours) {
                    this.timerCount = this.taskDetailResponseData.total_worked_hours;
                    this.renderer.setProperty(this.countUpRef.nativeElement, 'innerText', this.timerCount);
                  }
                }

                // this.canShowWorkHistoryCommentPopupVisible = true;
                this.getTaskWorkHistory();
              }
            }
          },
          error: (error: any) => {
            console.log('error:', error);
            this.spinnerService.hideSpinner();
          },
        })
      );
    }
  }
  // toggle task timer and based on the flag, make API calls
  toggleTaskTimer() {
    if (this.currentTaskId) {
      const timerRequestBody: TaskTimerRequestModel = {
        task_id: Encryption._doDecrypt(this.currentTaskId),
      };
      this.spinnerService.showSpinner();
      // Check If task timer is running (this.isTaskTimerRunning), then stop task timer and vice versa
      if (this.isTaskTimerRunning) {
        // this.stopTask();
        this.onGoingTaskHistoryLog.end_time = new Date().toISOString();
        this.stoppedTimeSlotByUser = this.onGoingTaskHistoryLog;
        this.isWorkHistoryCommentPopupVisible = true;
        this.afterStopTask = true;
      } else {
        this.renderer.setProperty(this.countUpRef.nativeElement, 'innerText', TASK_TIMER_DEFAULT_VALUE);
        this.timerCount = TASK_TIMER_DEFAULT_VALUE;
        this.subscriptions.push(
          this.taskService.startTaskTimer(timerRequestBody).subscribe({
            next: (response: toggleTaskTimerResponseModel) => {
              if (response) {
                this.spinnerService.hideSpinner();
                if (response.success) {
                  this.isTaskTimerRunning = !this.isTaskTimerRunning;
                  this.isTaskTimerToggled = true;
                  this.onGoingTaskHistoryLog = response.data;
                  // this.snackBar.open(response.message || TASK_TIMER_TOGGLE_MESSAGE.TIMER_STARTED);
                  // console.log('startTaskTimer', response);

                  this.setTaskTimer((response.data as any).updatedAt);
                  this.setFormControlValue(
                    'taskState',
                    this.taskStateList.find((state: any) => state.name === this.taskStateEnum.InProgress)
                  );

                  const currentState = this._addTaskForm['taskState'].value;
                  if (currentState && this.allStatusList && this.allStatusList.length) {
                    if (this.allStatusList && this.allStatusList.length > 0) {
                      this.taskStatusList = [];
                      this.allStatusList.forEach((statusObject: any) => {
                        // if (statusObject.state === currentState.name.toString().toLowerCase().replaceAll(' ', '')) {
                        this.taskStatusList.push({
                          id: statusObject.id || '',
                          name: statusObject.title || '',
                          color: statusObject.color || '',
                          state: statusObject.state,
                        });
                        this.isStatusSelectionDisabled = false;
                        // }
                      });
                    }
                  }

                  const updatedStatus = this.taskStatusList?.filter((status: any) => {
                    return status.state === currentState.name.toString().toLowerCase().replaceAll(' ', '');
                  });

                  if (updatedStatus && updatedStatus?.length > 0) {
                    this.selectedStatusToDisplay = updatedStatus[0]?.name;
                    this.setFormControlValue('taskStatus', updatedStatus[0]);
                  }

                  //this.resetFormControl('taskStatus');

                  // this.prepareStatusList();
                  // if (!this._addTaskForm['taskStatus'].value) {
                  //   const selectedStatus = this.taskStatusList?.sort((status1: any, status2: any) => status1.id - status2.id);
                  //   if (selectedStatus) {
                  //     this.setFormControlValue('taskStatus', selectedStatus[0]);
                  //   }
                  // }

                  // if (selectedStatus) {

                  // }
                  // this.setTaskStateAndStatusToRunning();
                  // this.addUserToTaskSubscribers();
                  this.getTaskWorkHistory();
                  this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK, Encryption._doEncrypt(timerRequestBody?.task_id));
                } else {
                  this.snackBar.open(response.message);
                  this.router.navigate(['/unauthorized-access']);
                }
              }
            },
            error: (error: any) => {
              console.log('error:', error);
              this.spinnerService.hideSpinner();
            },
          })
        );
      }
    }
  }

  // This method is used to set the user in task subscribers array, as that user has started the task timer
  addUserToTaskSubscribers() {
    const taskSubscribers = this._addTaskForm['taskSubscribers'].value || [];
    if (this.selectedProject && this.projectTeamMembers && this.projectTeamMembers.length > 0 && this.loggedInUserId) {
      const findLoggedInUserObject = this.projectTeamMembers.find((userObject: any) => userObject.user_id == this.loggedInUserId)?.user || '';
      if (findLoggedInUserObject) {
        // at first check if logged in user (current user) is already in task subscribers then no need to add user to task subscribers
        if (taskSubscribers && taskSubscribers.length > 0) {
          const findUserFromTaskSubscribersIndex = taskSubscribers.findIndex((subscriberObject: any) => subscriberObject.id == this.loggedInUserId);
          if (findUserFromTaskSubscribersIndex == -1) {
            taskSubscribers.push(findLoggedInUserObject);
          }
        } else {
          taskSubscribers.push(findLoggedInUserObject);
        }
        this.setFormControlValue('taskSubscribers', taskSubscribers);
        this.onSubmitTask({ navigateToTaskList: false });
      } else {
        this.globalService.navigateToUnAuthorizedPage();
      }
    }
    // console.log('taskSubscribers:', taskSubscribers);
  }

  // get task's worked hours and bind it to timer
  // start timer if task timer is running
  // getTaskWorkedHours(taskId: string) {
  //   this.spinnerService.showSpinner();
  //   this.subscriptions.push(
  //     this.taskService.getTaskTotalTime(taskId).subscribe({
  //       next: (response: TaskWorkedHoursResponseModel) => {
  //         if (response) {
  //           if (response.data) {
  //             const responseData: TaskWorkedHoursDataModel = {
  //               total_time: response.data.total_time || '',
  //             };
  //             this.timerCount = responseData.total_time || TASK_TIMER_DEFAULT_VALUE;
  //             if (this.timerCount !== TASK_TIMER_DEFAULT_VALUE) {
  //               this.renderer.setProperty(this.countUpRef.nativeElement, 'innerText', this.timerCount);
  //               if (this.isTaskTimerRunning) {
  //                 this.setTaskTimer();
  //               }
  //             }
  //           }
  //           this.spinnerService.hideSpinner();
  //         }
  //       },
  //       error: (error: any) => {
  //         console.log('error:', error);
  //         this.spinnerService.hideSpinner();
  //       },
  //     })
  //   );
  // }

  // this method is used to get task work history
  getTaskWorkHistory() {
    if (this.getTaskTimeHistoryRequestModel.task_id) {
      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.taskService
          .getTaskTimeHistory(this.isWorkTimeHistoryPrintClicked ? this.getTaskTimeHistoryRequestModelForPrint : this.getTaskTimeHistoryRequestModel)
          .subscribe({
            next: (response: TaskTimeHistoryResponseModel) => {
              if (response) {
                if (this.isWorkTimeHistoryPrintClicked) {
                  this.isWorkTimeHistoryPrintClicked = false;
                  if (response.data) {
                    const responseData = response.data;
                    if (responseData.list && responseData.list.length > 0) {
                      const workTimeList = responseData.list || [];
                      if (workTimeList && workTimeList.length > 0) {
                        workTimeList.forEach((taskWorkHistoryObject: TaskTimeHistoryResponseObjectModel) => {
                          // 'User', 'Start time', 'End time', 'Total time'
                          taskWorkHistoryObject.User = taskWorkHistoryObject.user_name;

                          const duration = moment(taskWorkHistoryObject.end_time ? taskWorkHistoryObject.end_time : new Date()).diff(
                            taskWorkHistoryObject.start_time
                          );
                          const tempTime = moment.duration(duration, 'milliseconds');
                          const hours = Math.floor(tempTime.asHours());
                          const mins = Math.floor(tempTime.asMinutes()) - hours * 60;
                          const formattedTimeDifference = hours + ' : ' + mins;
                          // below fields are for mat table heading, need to keep it as it is
                          taskWorkHistoryObject['Total time'] = formattedTimeDifference;
                          taskWorkHistoryObject.start_time = moment(taskWorkHistoryObject.start_time).format(
                            DATE_FORMAT_CONSTANTS.DD_MM_YYYY_hh_mm_A
                          );
                          taskWorkHistoryObject['Start time'] = taskWorkHistoryObject.start_time;
                          if (taskWorkHistoryObject.end_time) {
                            taskWorkHistoryObject.end_time = moment(taskWorkHistoryObject.end_time).format(DATE_FORMAT_CONSTANTS.DD_MM_YYYY_hh_mm_A);
                            taskWorkHistoryObject['End time'] = taskWorkHistoryObject.end_time;
                          } else {
                            taskWorkHistoryObject['End time'] = '-';
                          }
                        });
                        this.workTimeHistoryComponent.printTableRecords(workTimeList);
                      }
                    }
                  }
                } else {
                  if (response.data) {
                    const responseData = response.data;
                    if (responseData.totalRecords) {
                      this.timeHistoryTotalRecords = responseData.totalRecords;
                    }
                    if (responseData.list && responseData.list.length > 0) {
                      this.taskWorkHistoryBindList = responseData.list || [];
                      if (this.taskWorkHistoryBindList && this.taskWorkHistoryBindList.length > 0) {
                        this.temporaryTaskWorkHistoryBindList = JSON.parse(JSON.stringify(this.taskWorkHistoryBindList));
                        this.taskWorkHistoryBindList.forEach((taskWorkHistoryObject: TaskTimeHistoryResponseObjectModel) => {
                          // 'User', 'Start time', 'End time', 'Total time'
                          if (!taskWorkHistoryObject.end_time) {
                            this.onGoingTaskHistoryLog = { ...taskWorkHistoryObject };
                          }
                          taskWorkHistoryObject.User = taskWorkHistoryObject.user_name;

                          const duration = moment(taskWorkHistoryObject.end_time ? taskWorkHistoryObject.end_time : new Date()).diff(
                            taskWorkHistoryObject.start_time
                          );

                          let formattedTimeDifference = '0' + ' : ' + '0';
                          if (duration > 0) {
                            const tempTime = moment.duration(duration, 'milliseconds');
                            const hours = Math.floor(tempTime.asHours());
                            const mins = Math.floor(tempTime.asMinutes()) - hours * 60;
                            formattedTimeDifference = hours + ' : ' + mins;
                          }

                          // below fields are for mat table heading, need to keep it as it is
                          taskWorkHistoryObject['Total time'] = formattedTimeDifference;
                          taskWorkHistoryObject.start_time = moment(taskWorkHistoryObject.start_time).format(
                            DATE_FORMAT_CONSTANTS.DD_MM_YYYY_hh_mm_A
                          );
                          taskWorkHistoryObject['Start time'] = taskWorkHistoryObject.start_time;
                          if (taskWorkHistoryObject.end_time) {
                            taskWorkHistoryObject.end_time = moment(taskWorkHistoryObject.end_time).format(DATE_FORMAT_CONSTANTS.DD_MM_YYYY_hh_mm_A);
                            taskWorkHistoryObject['End time'] = taskWorkHistoryObject.end_time;
                          }
                        });
                        // if (this.canShowWorkHistoryCommentPopupVisible) {
                        //   this.canShowWorkHistoryCommentPopupVisible = false;
                        //   this.isWorkHistoryCommentPopupVisible = true;
                        // }
                      }
                    } else {
                      this.taskWorkHistoryBindList = [];
                    }
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

  // get sub tasks list
  getSubTasks() {
    if (this.currentTaskId) {
      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.taskService.getSubTaskList(this.getSubTasksRequestModel).subscribe({
          next: (response: any) => {
            if (response) {
              if (response.data) {
                const responseData = response.data || '';
                if (responseData.list && responseData.list.length > 0) {
                  if (this.getSubTasksRequestModel.page > 1) {
                    this.subTasksList = this.subTasksList.concat(responseData.list) || [];
                  } else {
                    this.subTasksList = responseData.list;
                  }
                  if (
                    this.subTasksList &&
                    this.subTasksList.length > 0 &&
                    responseData.totalRecords &&
                    responseData.totalRecords > this.subTasksList.length
                  ) {
                    this.isShowLoadMoreSubtasks = true;
                  } else {
                    this.isShowLoadMoreSubtasks = false;
                  }
                } else {
                  this.isShowLoadMoreSubtasks = false;
                  this.subTasksList = [];
                }
              }
              // console.log('response:', response);
              this.spinnerService.hideSpinner();
            }
          },
          error: (error) => {
            console.log('error:', error);
            this.spinnerService.hideSpinner();
          },
          complete: () => {
            this.spinnerService.hideSpinner();
          },
        })
      );
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
      if (this.currentTaskId) {
        // get edit permission
        this.actionPermissionData = this.permissionService.getModuleActionPermissionData(permission, MODULE_CONSTANTS.TASKS, ACTION_CONSTANTS.EDIT);
      }

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
      taskStateObject && !taskStateObject['task state'] ? (taskStateObject.is_required ? '' : (this.isDisableTaskStateOverlay = true)) : '';

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

  onCompleteTask() {
    if (this._addTaskForm['taskState'].value.name === this.completedString) {
      this.setFormControlValue('taskState', { name: this.todoString });
      // Change related update status of task along with state #Start
      this.resetFormControl('taskStatus');
      this.prepareStatusList();
      // Change related update status of task along with state #End
    } else {
      const stateNames = this.taskStateList.map((stateObject: taskStateListEnumModel) => {
        if (stateObject.name != this.completedString) {
          return stateObject.name;
        } else return;
      });
      if (stateNames.includes(this._addTaskForm['taskState'].value.name)) {
        this.setFormControlValue('taskState', { name: this.completedString });
        // Change related update status of task along with state #Start
        this.resetFormControl('taskStatus');
        this.prepareStatusList();
        // Change related update status of task along with state #End
      }
    }
    this.isTaskCompleted = true;
    this.onSubmitTask({ navigateToTaskList: false });
  }

  // on page change event get task work history
  onWorkTimeHistoryPageChange(event: { page: number; pageSize: number }) {
    this.getTaskTimeHistoryRequestModel.page = event.page;
    this.getTaskTimeHistoryRequestModel.limit = event.pageSize;
    this.getTaskWorkHistory();
  }

  // call Task activity APIs based on tab changes
  onTaskActivityTabChanged(event: any) {
    if (event && this.currentTaskId) {
      // check for comments index
      if (event.index == 0) {
        this.commentsSourceSubscription = this.commentsComponentSource.subscribe(() => {
          if (this.commentsComponent) {
            this.commentsSourceSubscription.unsubscribe();
            this.commentsComponent.commentsListToBind = [];
            this.commentsComponent.currentIndex = 0;
            this.commentsComponent.getAllCommentsByTaskId();
          }
        });
      }
      // check for commits index
      if (event.index == 1) {
        this.commitSourceSubscription = this.commitComponentSource.subscribe(() => {
          if (this.commitsComponent) {
            this.commitSourceSubscription.unsubscribe();
            this.commitsComponent.commitListToBind = [];
            this.commitsComponent.currentIndex = 0;
            this.commitsComponent.getCommitListRequestModel.page = 1;
            this.commitsComponent.getTaskCommits();
          }
        });
      }
      // check for change log tab (index = 3)
      if (event.index == 2) {
        this.getTaskChangeLogs();
      }

      // set changelog array and pagination to initial values to resolve duplicate change logs issue
      if (event.index != 2) {
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
  // checkIfURLHasProjectId() {
  //   if (this.route.snapshot.queryParams[PROJECT_ID_QUERY_PARAM_CONSTANT]) {
  //     this.projectIdFromURL = this.route.snapshot.queryParams[PROJECT_ID_QUERY_PARAM_CONSTANT];
  //   }
  // }

  // push comment to temporary array
  onCommentsToBePosted(event: any) {
    if (event) {
      if (event.commentsToPost && event.commentsToPost.length > 0) {
        this.temporaryCommentsToBePosted = event.commentsToPost;
      }
    }
  }

  // push commits to temporary array
  onCommitsToBePosted(event: any) {
    if (event) {
      if (event.commitsToPost && event.commitsToPost.length > 0) {
        this.temporaryCommitsToBePosted = event.commitsToPost;
      }
    }
  }

  afterPostingComment(event: any) {
    console.log('afterPostingComment', event);
    const subscribersArray: ProjectTeamMember[] = this._addTaskForm['taskSubscribers'].value || [];
    event &&
      event.forEach((subscriberObject: any) => {
        const subscriberFindIndex = this.reportToBindList.findIndex((reportToObject: ProjectTeamMember) => reportToObject.id == subscriberObject.id);
        if (subscriberFindIndex > -1) {
          subscribersArray.push(this.reportToBindList[subscriberFindIndex]);
        }
      });
    if (subscribersArray && subscribersArray.length > 0) {
      this.setFormControlValue('taskSubscribers', subscribersArray);
    }
  }

  onCopyCurrentTaskLink() {
    const dummyHTMLElement = document.createElement('input');
    const currentURL = window.location.href;
    document.body.appendChild(dummyHTMLElement);
    dummyHTMLElement.value = currentURL;
    dummyHTMLElement.select();
    document.execCommand('copy');
    document.body.removeChild(dummyHTMLElement);
    this.isShowTaskLinkCopied = true;
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: { message: 'Task link copied' },
      duration: 4000,
    });
    return;
  }

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

  makeDescriptionControlVisible(event: any) {
    event.stopPropagation();
    this.isDescriptionControlVisible = true;
    this.descriptionEditorSubscription = this.descriptionEditorSource.subscribe(() => {
      if (this.descriptionEditor && this.descriptionEditor.quillEditor) {
        this.descriptionEditorSubscription.unsubscribe();
        if (this._addTaskForm['description'].value.length) {
          this.descriptionEditor.quillEditor.setSelection(this.descriptionEditor.quillEditor.getLength(), 0);
          // this.onEditorContentChange({});
          this.resizableQuillEditor();

          this.setEventListenerForQuillEditor();
        }
      }
    });
  }

  hideDescriptionControl() {
    this.isDescriptionControlVisible = false;
  }

  onAssignToMe() {
    // find loggedIn user from project team data
    if (this.selectedProject && this.projectTeamMembers && this.projectTeamMembers.length > 0) {
      const loggedInUserFromTeam: any = this.projectTeamMembers.find(
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

  openProjectControl() {
    this.projectControlSubscription = this.projectControlSource.subscribe(() => {
      if (this.taskDetailResponseData && this.taskDetailResponseData.parentTask) {
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: { message: "Please change parent task's project." },
          duration: 45000,
        });
        this.projectControlSubscription.unsubscribe();
      } else {
        this.isProjectControlVisible = true;
        if (this.projectControl) {
          this.projectControl.open();
          this.projectControlSubscription.unsubscribe();
        }
      }
    });
  }

  onCloseProjectDropdown() {
    this.isProjectControlVisible = !this.isProjectControlVisible;
  }

  openTaskTypeControl() {
    this.isTaskTypeControlVisible = true;
    this.taskTypeControlSubscription = this.taskTypeControlSource.subscribe(() => {
      if (this.taskTypeControl) {
        this.taskTypeControl.open();
        this.taskTypeControlSubscription.unsubscribe();
      }
    });
  }

  onCloseTaskTypeDropdown() {
    this.isTaskTypeControlVisible = !this.isTaskTypeControlVisible;
  }

  // toggle input control
  // check if control is empty then remove empty space
  toggleTaskTitleControl() {
    const taskTitleValue = this._addTaskForm['title'].value;
    if (taskTitleValue && !taskTitleValue.trim()) {
      this.resetFormControl('title');
      this._addTaskForm['title'].markAllAsTouched();
    } else {
      if (taskTitleValue) {
        this.isTaskTitleControlVisible = !this.isTaskTitleControlVisible;
      }
    }
  }

  removeParentTask() {
    this.resetFormControl('parentTask');
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

  // This method will set selected task status visible
  attributeDisplayForTaskStatus(attribute1: any, attribute2: any) {
    if (attribute1.name && attribute2.name && attribute1.name.toLowerCase() == attribute2.name.toLowerCase()) {
      return attribute1.name;
    } else {
      return '';
    }
  }

  // This method will set selected task sub status visible
  attributeDisplayForTaskSubStatus(attribute1: any, attribute2: any) {
    if (attribute1.name && attribute2.name && attribute1.name.toLowerCase() == attribute2.name.toLowerCase()) {
      return attribute1.name;
    } else {
      return '';
    }
  }

  // This method will call all records of work time history and set isWorkTimeHistoryPrintClicked to true
  // to print all records of work time history
  onWorkTimeHistoryPrint() {
    this.isWorkTimeHistoryPrintClicked = true;
    this.getTaskTimeHistoryRequestModelForPrint.task_id = this.currentTaskId || '';
    this.getTaskWorkHistory();
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

  onCloseWorkHistoryPopup(event: any) {
    this.afterStopTask = false;
    this.isWorkHistoryCommentPopupVisible = false;
    this.stoppedTimeSlotByUser = '';
    this.getTaskWorkHistory();
  }

  updateTimeHistory(data: any) {
    if (this.afterStopTask) {
      this.stopTask();

      this.afterStopUpdateTimeHistory = data;
    } else {
      this.taskService.updateTaskWorkHistory(data.taskWorkHistory, data.id).subscribe({
        next: (response: any) => {
          this.isWorkHistoryCommentPopupVisible = false;
          this.stoppedTimeSlotByUser = '';

          const responseData = response.data;
          if (responseData.total_worked_hours) {
            this.taskDetailResponseData.total_worked_hours = responseData.total_worked_hours;
          }
          if (responseData.pendingTime) {
            this.taskDetailResponseData.pendingTime = responseData.pendingTime;
          }

          if (!this.isTaskTimerRunning && this.taskDetailResponseData.total_worked_hours) {
            this.timerCount = this.taskDetailResponseData.total_worked_hours;
            this.renderer.setProperty(this.countUpRef.nativeElement, 'innerText', this.timerCount);
          }

          this.getTaskWorkHistory();
        },
        error: (error) => {
          console.log('error:', error);
        },
      });
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

  onWorkHistoryEdit(event: any) {
    // console.log('event:', event);
    if (event && event.record) {
      // this.editableWorkHistoryObject = event.record || '';
      this.stoppedTimeSlotByUser = this.temporaryTaskWorkHistoryBindList.find((workHistoryObject: any) => workHistoryObject._id == event.record._id);
      this.isWorkHistoryCommentPopupVisible = true;
    }
  }

  onWorkHistoryDelete(event: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Are you sure you want to remove work time history log ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.taskService.deleteTaskWorkHistory(this.currentTaskId, event.recordId).subscribe({
            next: (response: any) => {
              if (response) {
                if (response.success) {
                  // this.snackBar.open(response.message || TASK_TIMER_TOGGLE_MESSAGE.TIMELOG_DELETED);
                  if (response.data) {
                    const findIndex = this.taskWorkHistoryBindList.findIndex((workHistoryObject: any) => workHistoryObject._id == event.recordId);
                    if (findIndex > -1) {
                      this.taskWorkHistoryBindList.splice(findIndex, 1);
                      if (this.taskWorkHistoryBindList && this.taskWorkHistoryBindList.length > 0) {
                        this.taskWorkHistoryBindList = JSON.parse(JSON.stringify(this.taskWorkHistoryBindList));
                      } else {
                        this.renderer.setProperty(this.countUpRef.nativeElement, 'innerText', TASK_TIMER_DEFAULT_VALUE);
                      }
                      this.temporaryTaskWorkHistoryBindList.splice(findIndex, 1);
                    }
                    this.taskDetailResponseData.total_worked_hours = response.data.total_worked_hours || TASK_TIMER_DEFAULT_VALUE;
                    this.taskDetailResponseData.pendingTime = response.data.pendingTime || TASK_TIMER_DEFAULT_VALUE;
                    this.taskDetailResponseData['pending_time_minutes'] = this.getPendingTime(
                      response?.data?.total_worked_hours,
                      response?.data?.eta
                    );
                  }
                }
              }
            },
            error: (error) => {
              console.log('error:', error);
            },
          })
        );
      }
    });
  }

  clearPriority() {
    this._addTaskForm['taskPriority'].reset();
  }

  // check if isTaskCreated = true, then add created task response at 0 index in sub task list
  onEmmitTaskStatusEventChanged(event: any) {
    if (event && event.isTaskCreated && event.createdTaskDetail) {
      this.subTasksList.unshift(event.createdTaskDetail);
      this.getTaskDetailByTaskId(this.currentTaskId);
    }
  }

  getTaskColor(task: any) {
    if (task.state) {
      const taskStyle = this.items.find((item: any) => item.value === task.state);
      return taskStyle.color;
    }
    return 'black';
  }
  getTypeBaseColor(taskType: any) {
    switch (taskType) {
      case Task_Type_Enum.Epic:
        return Task_Type_Enum_Color_Codes.Epic;
      case Task_Type_Enum.Task:
        return Task_Type_Enum_Color_Codes.Task;
      case Task_Type_Enum.Bug:
        return Task_Type_Enum_Color_Codes.Bug;
      default:
        return '';
    }
  }

  navigateToTaskDetail(taskId: any) {
    if (taskId) {
      this.container.nativeElement.scrollTop = 0;
      taskId = Encryption._doEncrypt(taskId.toString());

      this.router
        .navigateByUrl(`/index`, {
          skipLocationChange: true,
        })
        .then(() => {
          this.router.navigate(['/tasks/view', taskId]);
        });
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

  onLoadMoreSubtasks() {
    this.getSubTasksRequestModel.page += 1;
    this.getSubTasks();
  }
  adjustEditorHeight() {
    const quillContainer = document.querySelector('.ql-container') as HTMLElement;
    if (quillContainer) {
      quillContainer.style.minHeight = '56px';
      quillContainer.style.height = 'auto';
    }
  }

  public swapAssignUser() {
    const assigneeUser = this._addTaskForm['assignTo'].value || '';
    const assignedByUser = this._addTaskForm['assignedBy'].value || '';
    this._addTaskForm['assignTo'].setValue(assignedByUser);
    this._addTaskForm['assignedBy'].setValue(assigneeUser);
    this.addTaskForm.markAsDirty();
    this.checkIsTaskAssignedToSelf();
  }

  //Ck Editor functions

  onEditorChange(event: any) {
    console.log(event);
  }

  onChange(event: any): void {
    console.log(event);
    console.log(this.mycontent);
    this._addTaskForm['description'].setValue(event);
    console.log('this.addTaskForm.value', this.addTaskForm.value);
    //this.log += new Date() + "<br />";
  }

  // unsubscribe observables
  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
    this.taskTeamMemberSubscription ? this.taskTeamMemberSubscription.unsubscribe() : '';
    this._onDestroy.next();
    this._onDestroy.complete();
  }
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

  //////task background Color

  getTaskBackgroundColor() {
    const color = Utility.stateList.find((item: any) => item.value == this._addTaskForm['taskStatus'].value.state)?.color;
    return color;
  }

  /////

  //////Due Date Fun ////////
  getDueDate(date: any) {
    if (date) {
      const dueDateObj = moment(date).format('DD/MM/YYYY');
      const today = moment().format('DD/MM/YYYY');
      const tomorrow = moment().add(1, 'day').format('DD/MM/YYYY');
      const yesterday = moment().subtract(1, 'day').format('DD/MM/YYYY');
      if (dueDateObj === today) {
        return 'Today'; // If the date is today, display 'Today'
      } else if (dueDateObj === tomorrow) {
        return 'Tomorrow'; // If the date is tomorrow, display 'Tomorrow'
      } else if (dueDateObj === yesterday) {
        this.alertIndicate = true;
        return 'Yesterday';
      } else {
        if (moment().isAfter(moment(date))) {
          this.alertIndicate = true;
          return dueDateObj; // Otherwise, display the date in 'yyyy-MM-dd' format
        }
        return dueDateObj; // Otherwise, display the date in 'yyyy-MM-dd' format
      }
    } else {
      return '--';
    }
  }
  ///////

  ////Task Timing  /////////
  getPendingTime(total_worked_hours: any, eta: any) {
    const formattedEta = this.convertEtaToHhMmSs(eta);
    const workedMoment = total_worked_hours?.split(':');
    const worked_hours = parseInt(workedMoment?.[0], 10);
    const worked_minutes = parseInt(workedMoment?.[1], 10);

    const workedDuration = moment.duration(`${worked_hours}:${worked_minutes}`).asMinutes();

    const difference = formattedEta - workedDuration;
    // console.log('difference: ', difference);
    this.formatDuration(Math.abs(difference));
    return difference;
  }

  convertEtaToHhMmSs(eta: any) {
    const parts = eta?.split(' ');

    let hours = 0;
    let minutes = 0;

    for (const part of parts) {
      if (part.includes('h')) {
        hours += parseInt(part.replace('h', ''), 10);
      } else if (part.includes('m')) {
        minutes += parseInt(part.replace('m', ''), 10);
      }
    }

    const duration = moment.duration(`${hours}:${minutes}`);
    const formattedEta = duration.asMinutes();
    return formattedEta;
  }

  formatDuration(minutes: any) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    console.log('remainingMinutes: ', remainingMinutes);

    let formattedDuration = '';

    if (hours > 0) {
      formattedDuration += `${hours}h `;
    }

    if (remainingMinutes > 0) {
      formattedDuration += `${remainingMinutes}m`;
    }
    this.pending_time_hours_minutes = formattedDuration;
    // console.log('formattedDuration: ', formattedDuration);
    return formattedDuration?.trim();
  }

  /////////////////////////


  ///////Edit Description ///////

  onEditDescription() {
    this.isDescriptionEditable = true
  }
  onCancelDescription() {
    this.isDescriptionEditable = false
  }

  ///////////////
}
