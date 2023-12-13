import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  PostQuickTaskRequstModel,
  PostQuickTaskResponseModel,
  PostTaskSectionModel,
  PostTaskSectionResponseModel,
  ProjectNameModel,
  ProjectTeamMember,
  ProjectsRequestDataModel,
  SectionObjectModel,
  SectionResponseModel,
  TaskStateAndStatusModel,
  taskStateListEnumModel,
  taskStatusListModel,
  taskTypeListEnumModel,
} from '../../../core/model/task/task.model';
import { Task_State_Enum, Task_Type_Enum, Task_Type_Enum_Color_Codes } from '@tms-workspace/enum-data';
import {
  CREATE_MESSAGES_IN_POPUP,
  DATE_FORMAT_CONSTANTS,
  DEFAULT_LABEL_COLOR_CONSTANTS,
  DEFAULT_TASK_TYPE_CONSTANT,
  ERROR_MESSAGE_CONSTANTS,
  QUICK_TASK_ERROR_MESSAGE,
  QUICK_TASK_FORM_CONTROLS,
  TASK_GROUP_BY_FILTER_CONSTANTS,
  TASK_PRIORITY_CONSTANTS,
} from '../../../core/services/common/constants';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { environment } from './../../../../environments/environment';
import { UserService } from '../../../core/services/module/users/users.service';
import { Encryption } from '@tms-workspace/encryption';
import { Utility } from '../../../core/utilities/utility';
import { GlobalService } from '../../../core/services/common/global.service';
import moment from 'moment';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { LeaveService } from '../../../core/services/module/leave/leave.service';
import { StatusService } from '../../../core/services/module/projects/status.service';

@Component({
  selector: 'main-app-tms-workspace-quick-add-task',
  templateUrl: './quick-add-task.component.html',
  styleUrls: ['./quick-add-task.component.scss'],
})
export class QuickAddTaskComponent implements OnInit, OnChanges {
  //#region properties
  isLabelsChanged = false;
  quickAddTaskFormGroup!: FormGroup;
  isOverlayTaskState = false;
  isDisableTaskStateOverlay = false;
  isDisableAssignedToOverlay = false;
  isOverlayOpenForAssignTo = false;
  isOverlayProjectSelection = false;
  isOverlayOpenForSections = false;
  isOverlayTaskStatus = false;
  isTaskSubmitted = false;
  subscriptions: Subscription[] = [];

  taskStatusList: taskStatusListModel[] = [];
  taskStateEnum = Task_State_Enum;
  taskTypeEnum = Task_Type_Enum;
  projectDetailResponse: any;
  projectTeamMembers: ProjectTeamMember[] = [];
  @Input() selectedProjectId!: number;
  @Input() newTaskStateAndStatus!: TaskStateAndStatusModel;
  @Input() groupByFilterValue!: string;
  @Input() projectObjectInput: any;
  @Output() emitTaskStatusEvent: EventEmitter<any> = new EventEmitter();
  @Input() showAsListItem = true;
  @Input() parentTaskId!: string;

  baseURL = environment.base_url;
  loggedInUserId!: number;
  projectResponsiblePersonId!: number;
  taskTypeList: taskTypeListEnumModel[] = [];
  getProjectsRequestModel!: ProjectsRequestDataModel;
  projectNameList: ProjectNameModel[] = [];
  projectsDataList: any = [];
  allProjectResponseData: any = [];
  taskStateSVGURL = '/assets/images/task_state.svg';
  quickTaskSaveSVGURL = '/assets/images/quick_task_save.svg';
  quickTaskCancelSVGURL = '/assets/images/quick_task_cancel.svg';
  sectionsList: SectionObjectModel[] = [];
  createSectionForMessage = CREATE_MESSAGES_IN_POPUP.CREATE_SECTION_FOR;
  currentProjectId!: number | string;
  currentGroupByUserId!: number | string;
  currentTaskStateId!: number | string;
  currentTaskStatusId!: number | string;
  currentSectionId!: number | string;
  isOverlayOpenForTaskLabels = false;
  presetColors: string[];
  displayEtaSelection = false;
  public items = Utility.stateList.map((state: any) => {
    return { name: state.title, ...state };
  });
  PRIORITY = TASK_PRIORITY_CONSTANTS;
  priorityList: any = [];
  openQuickTaskLabelsSection = false;
  toggle = false;
  color = '#800101';
  availableProjectLabels: any = [];
  createLabelForMessage = CREATE_MESSAGES_IN_POPUP.CREATE_LABEL_FOR;
  filteredSubStatusList: any = [];
  tempLabelStorage: any = [];
  filteredAvailableLabels: any = [];
  filteredProjectTeam: any = [];
  showAssigneeCloseIocn = false;
  showEtaCloseicon = false;
  taskStateList = Utility.stateList.map((state: any) => {
    return {
      name: state.title,
      id: state.title.length + 1,
      color: state.color,
      value: state.value,
    };
  });

  public reaponsiblePerson: any;
  //#endregion

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private taskService: TaskService,
    private userService: UserService,
    private globalService: GlobalService,
    private tasksService: TaskService,
    private statusService: StatusService
  ) {
    this.presetColors = this.globalService.presetColors;
    this.setPriorityList();
    this.initializeQuickAddTask();
    this.loggedInUserId = this.userService.getLoggedInUserId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedProjectId']) {
      this.setInitialGroupById();
      this.findSelectedProject();
    }
  }
  toggleLabelColorPicker() {
    this.toggle = !this.toggle;
  }

  ngOnInit(): void {
    // field permissions are pending to implement
    //this.setInitialGroupById();
    this.setInitialGroupById();
    this.getEnumData();
    this.getProjectsRequestModel = new ProjectsRequestDataModel();
    this.getProjectsList();
    // check group by filter
  }

  setPriorityList() {
    if (this.priorityList) {
      Object.values({ ...this.PRIORITY }).forEach((task: string) => {
        if (task) {
          this.priorityList.push({ id: this.priorityList.length + 1, name: task, priorityImg: task.toLowerCase() + '-priority.svg' });
        }
      });
    }
  }
  onPriorityChange(taskPriorityObject: any) {
    this.quickAddTaskFormGroup.controls['priorityFormControl'].patchValue(taskPriorityObject);
  }

  clearPriority() {
    this.quickAddTaskFormGroup.controls['priorityFormControl'].setValue('');
  }
  // initialize form group
  initializeQuickAddTask() {
    this.quickAddTaskFormGroup = this.formBuilder.group({
      title: ['', Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(512)])],
      project: ['', Validators.required],
      taskState: [{ name: 'To Do' }],
      taskStatus: ['', Validators.required],
      section: [''],
      taskType: ['', Validators.required],
      assignTo: [''],
      priorityFormControl: [this.priorityList[0]],
      labels: [[]],
      dueDate: [new Date()],
      eta: ['', Validators.required],
    });
  }

  // getter methods
  get _quickAddTask() {
    return this.quickAddTaskFormGroup.controls;
  }

  setInitialGroupById() {
    if (this.groupByFilterValue) {
      if (this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.PROJECT.toLowerCase()) {
        this.currentProjectId = this.selectedProjectId;
      } else if (this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.ASSIGNEE.toLowerCase()) {
        this.currentGroupByUserId = this.selectedProjectId;
      } else if (this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.STATE.toLowerCase()) {
        this.currentTaskStateId = this.selectedProjectId;
      } else if (this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.STATUS.toLowerCase()) {
        this.currentTaskStatusId = this.selectedProjectId;
      } else if (this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.SECTION.toLowerCase()) {
        this.currentSectionId = this.selectedProjectId;
      }
    }
  }

  toggleOverlayTaskStateSelection() {
    // if (!this.isDisableTaskStateOverlay) {
    this.isOverlayTaskState = !this.isOverlayTaskState;
    // }
  }

  toggleOverlayProjectSelection() {
    // first check if permissions are granted
    // if (!this.isDisableProjectOverlay) {
    if (!this.parentTaskId) {
      this.isOverlayProjectSelection = !this.isOverlayProjectSelection;
    }
    // }
  }

  toggleOverlayTaskStatusSelection() {
    // first check if permission is there for task status or not
    // if (!this.isDisableTaskStatusOverlay) {
    if (!this.isOverlayTaskStatus) {
      if (!this._quickAddTask['project'].value) {
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: { message: ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST },
          duration: 45000,
        });
      } else if (this.taskStatusList && this.taskStatusList.length == 0) {
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: { message: `No substatus is found for ${this._quickAddTask['taskState'].value.name} status.` },
          duration: 45000,
        });
      } else {
        this.isOverlayTaskStatus = !this.isOverlayTaskStatus;
      }
    } else {
      this.isOverlayTaskStatus = !this.isOverlayTaskStatus;
    }
    // }
  }

  getEnumData() {
    // Task State Enum

    // if (this.taskStateEnum) {
    //   Object.values(this.taskStateEnum).forEach((taskState: string) => {
    //     if (taskState) {
    //       this.taskStateList.push({ id: this.taskStateList.length + 1, name: taskState });
    //     }
    //   });
    // }
    // Task Type Enum
    if (this.taskTypeEnum) {
      Object.values(this.taskTypeEnum).forEach((taskType: string) => {
        if (taskType) {
          this.taskTypeList.push({ id: this.taskTypeList.length + 1, name: taskType });
        }
      });
    }
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

  onSelectState(state: any) {
    this.setFormControlValue('taskState', state);
    this.toggleOverlayTaskStateSelection();
    this._quickAddTask['taskStatus'].reset();
    this.resetDropdownOfSubStatus();
    // check if task state is changed in case of group by status filter, then remove taskstatus value
    if (this.newTaskStateAndStatus && this.newTaskStateAndStatus.taskStatudId) {
      // find project which has this status
      const findProjectWithStatus = this.projectsDataList.find((projectObject: any) => {
        if (projectObject && projectObject.projectStatus && projectObject.projectStatus.length > 0) {
          return projectObject.projectStatus.find((projectStatusObject: any) => projectStatusObject.id == this.newTaskStateAndStatus.taskStatudId);
        }
      });
      if (findProjectWithStatus) {
        if (findProjectWithStatus.projectStatus && findProjectWithStatus.projectStatus.length > 0) {
          const findTaskStatusObject = findProjectWithStatus.projectStatus.find(
            (projectStatusObject: any) => projectStatusObject.title.toLowerCase() == state.name.toLowerCase().replaceAll(' ', '')
          );
          // check if selected state and state from group by filter is different then remove status value
          if (findTaskStatusObject?.state !== state.name.toLowerCase().replaceAll(' ', '')) {
            this._quickAddTask['taskStatus'].reset();
          } else if (findTaskStatusObject?.state == state.name.toLowerCase().replaceAll(' ', '')) {
            const statusObject = {
              id: findTaskStatusObject.id,
              name: findTaskStatusObject.title,
            };
            this.setFormControlValue('taskStatus', statusObject);
          }
        }
      }
    } else {
      // find project object
      const projectId = this._quickAddTask['project'].value.id || '';
      if (projectId) {
        const selectedProject = this.projectsDataList.find((tempProjectObject: any) => tempProjectObject.id == projectId);
        if (selectedProject) {
          // prepare status list based on task state
          this.prepareStatusList(selectedProject);
        }
      }
    }
  }

  getSelectedProject(event: any) {
    this.setFormControlValue('project', event);
    this.setFormControlValue('taskState', { name: 'To Do' });
    if (event.id) {
      this.selectedProjectId = event.id;
      this.currentProjectId = event.id;
      this.findSelectedProject();
    }
    this.toggleOverlayProjectSelection();
  }

  toggleOverlayAssignedTo() {
    // first check if permissions are granted
    // if (!this.isDisableAssignedToOverlay) {
    // if (!this.isOverlayOpenForAssignTo) {
    // if (!this.selectedProject) {
    //   this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
    // } else {
    //   this.isOverlayOpenForAssignTo = !this.isOverlayOpenForAssignTo;
    // }
    // } else {
    const selectedProject = this._quickAddTask['project'].value;
    if (selectedProject) {
      this.isOverlayOpenForAssignTo = !this.isOverlayOpenForAssignTo;
    } else {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST },
        duration: 45000,
      });
    }

    // }
    // }
  }

  // get project list API
  getProjectsList() {
    this.getProjectsRequestModel.status = true;
    this.getProjectsRequestModel.custom_fields = false;
    this.getProjectsRequestModel.tag = false;
    this.getProjectsRequestModel.team = true;
    this.getProjectsRequestModel.billing_configuration = false;
    this.getProjectsRequestModel.documents = false;
    this.getProjectsRequestModel.workspace = false;
    this.subscriptions.push(
      this.taskService.getProjectListv2().subscribe({
        next: (response: any) => {
          if (response) {
            if (response.data) {
              this.allProjectResponseData = response.data;
              if (this.allProjectResponseData.list && this.allProjectResponseData.list.length > 0) {
                this.projectsDataList = this.allProjectResponseData.list || [];
                this.projectsDataList.forEach((project: any) => {
                  // prepare project name list
                  this.projectNameList.push({
                    id: project.id,
                    key: project.project_key,
                    name: project.name,
                  });
                });
                this.projectNameList.sort((_project1: any, _project2: any) => {
                  const project1 = _project1.name.toLowerCase(),
                    project2 = _project2.name.toLowerCase();

                  if (project1 < project2) {
                    return -1;
                  }
                  if (project1 > project2) {
                    return 1;
                  }
                  return 0;
                });
                // check if task is being created with selected project
                this.findSelectedProject();
              }
            }
          }
        },
      })
    );
  }

  // check if task is being created with selected project
  findSelectedProject() {
    if (this.groupByFilterValue) {
      if (this.currentProjectId) {
        const selectedProject = this.projectsDataList.find((projectObject: any) => projectObject.id == this.currentProjectId);
        if (selectedProject) {
          // set selectedProject as default selected in project form control
          this.setFormControlValue('project', { id: selectedProject.id, name: selectedProject.name, key: selectedProject.project_key });
          // check for responsible person
          this.setProjectTeam(selectedProject);
          // prepare status list based on task state
          this.prepareStatusList(selectedProject);

          // get task section list based on selected project
          this.getTaskSectionsFromProject(selectedProject.id);
        }
      } else if (this.currentTaskStateId) {
        const findStateObject = this.taskStateList.find(
          (stateObject: taskStateListEnumModel) => stateObject.name.replace(' ', '').toLocaleLowerCase() == this.currentTaskStateId
        );
        if (findStateObject) {
          this.setFormControlValue('taskState', findStateObject);
        }

        if (this.projectObjectInput.options.singleProjectSelected) {
          //check if project form control has value
          const selectedProject = this.projectsDataList.find((projectObject: any) => projectObject.id == this.projectObjectInput.options.project_id);
          if (selectedProject) {
            this.setFormControlValue('project', {
              id: selectedProject.id,
              key: selectedProject.project_key,
              name: selectedProject.name,
            });
            // check for responsible person
            this.setProjectTeam(selectedProject);
            // prepare status list based on task state
            this.prepareStatusList(selectedProject);
            // get task section list based on selected project
            this.getTaskSectionsFromProject(selectedProject.id);
          }
        }
      } else if (this.currentGroupByUserId) {
        if (this.projectObjectInput.options.singleProjectSelected) {
          //check if project form control has value
          const selectedProject = this.projectsDataList.find((projectObject: any) => projectObject.id == this.projectObjectInput.options.project_id);
          if (selectedProject) {
            this.setFormControlValue('project', {
              id: selectedProject.id,
              key: selectedProject.project_key,
              name: selectedProject.name,
            });
            // check for responsible person
            this.setProjectTeam(selectedProject);
            // prepare status list based on task state
            this.prepareStatusList(selectedProject);
            // get task section list based on selected project
            this.getTaskSectionsFromProject(selectedProject.id);
          }
        }
        // const selectedProject = this.projectsDataList.find((projectObject: any) => projectObject.id == this.projectObjectInput.options.project_id);
        // if (selectedProject) {
        // set selectedProject as default selected in project form control
        //   this.setFormControlValue('project', { id: selectedProject.id, name: selectedProject.name, key: selectedProject.project_key });
        //   // check for responsible person
        //   this.setProjectTeam(selectedProject);
        //   // prepare status list based on task state
        //   this.prepareStatusList(selectedProject);
        //   // get task section list based on selected project
        //   this.getTaskSectionsFromProject(selectedProject.id);
        //}
      }
      // check if group by section is selected
      else if (
        this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.STATUS.toLowerCase() ||
        this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.SECTION.toLowerCase()
      ) {
        if (this.projectObjectInput && this.projectObjectInput.options && this.projectObjectInput.options.project_id) {
          const selectedProject = this.projectsDataList.find((projectObject: any) => projectObject.id == this.projectObjectInput.options.project_id);
          if (selectedProject) {
            this.setFormControlValue('project', { id: selectedProject.id, name: selectedProject.name, key: selectedProject.project_key });
            // check for responsible person
            this.setProjectTeam(selectedProject);
            // prepare status list based on task state
            this.prepareStatusList(selectedProject);
            // get task section list based on selected project
            this.getTaskSectionsFromProject(selectedProject.id);
          }
        }
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
                if (this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.SECTION.toLowerCase()) {
                  if (this.projectObjectInput && this.projectObjectInput.groupId) {
                    this.findAndSetSectionFromResponse(this.projectObjectInput.groupId);
                  }
                }
              } else {
                this.sectionsList = [];
                this._quickAddTask['section'].reset();
              }
            }
          },
          error: (error: any) => {
            console.log('error:', error);
          },
        })
      );
    }
  }

  // set section form control value
  setSectionFormControlValue(sectionObject: { id: number; title: string }) {
    this.setFormControlValue('section', {
      id: sectionObject.id || '',
      title: sectionObject.title || '',
    });
  }

  findAndSetSectionFromResponse(sectionId: number) {
    if (this.sectionsList && this.sectionsList.length > 0) {
      const findSectionFromResponse = this.sectionsList.find((sectionObject: SectionObjectModel) => sectionObject.id == sectionId);
      if (findSectionFromResponse) {
        this.setSectionFormControlValue({ id: findSectionFromResponse.id, title: findSectionFromResponse.title });
      } else {
        this._quickAddTask['section'].reset();
      }
    }
  }
  setProjectTeam(selectedProject: any) {
    if (selectedProject && selectedProject?.id) {
      this.projectTeamMembers = [];
      this.taskService.getProjectTeam(selectedProject?.id ? [selectedProject?.id] : []).subscribe((response: any) => {
        if (response?.data && Array.isArray(response?.data)) {
          try {
            const teamDetails = response?.data;
            this.reaponsiblePerson = response?.data[0]?.responsible_person || '';
            if (teamDetails && teamDetails[0] && teamDetails[0].projectTeam) {
              teamDetails[0].projectTeam?.forEach((projectTeamMember: any) => {
                this.projectTeamMembers.push({
                  employee_image: projectTeamMember.user.employee_image || projectTeamMember.user.avatar,
                  first_name: projectTeamMember.user.first_name || '',
                  last_name: projectTeamMember.user.last_name || '',
                  id: projectTeamMember.user.id,
                  name: projectTeamMember.user.first_name + ' ' + projectTeamMember.user.last_name,
                  login_capture_data: projectTeamMember?.user?.login_capture_data,
                });
              });
              if (this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.ASSIGNEE.toLowerCase()) {
                if (this.currentGroupByUserId) {
                  const groupedUser = this.projectTeamMembers.find((user: any) => user.id.toString() === this.currentGroupByUserId.toString());
                  if (groupedUser) {
                    this.setFormControlValue('assignTo', groupedUser);
                  } else {
                    this.assignTaskToSelf();
                  }
                } else {
                  this.assignTaskToSelf();
                }
              } else {
                this.assignTaskToSelf();
              }
              this.filteredProjectTeam = [
                ...this.projectTeamMembers.sort((assigne1: any, assignee2: any) => {
                  const assignee1Name = assigne1.name.toLowerCase(),
                    assignee2Name = assignee2.name.toLowerCase();

                  if (assignee1Name < assignee2Name) {
                    return -1;
                  }
                  if (assignee1Name > assignee2Name) {
                    return 1;
                  }
                  return 0;
                }),
              ];
            }
          } catch (error: any) {
            this.snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'An error occured while loading data related project.' },
              duration: 45000,
            });
          }
        } else {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'An error occured while loading data related project.' },
            duration: 45000,
          });
        }
        this.filteredProjectTeam = [
          ...this.projectTeamMembers.sort((assigne1: any, assignee2: any) => {
            const assignee1Name = assigne1.name.toLowerCase(),
              assignee2Name = assignee2.name.toLowerCase();

            if (assignee1Name < assignee2Name) {
              return -1;
            }
            if (assignee1Name > assignee2Name) {
              return 1;
            }
            return 0;
          }),
        ];
      });
      // else if (this.groupByFilterValue.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.ASSIGNEE.toLowerCase()) {
      //   this.currentGroupByUserId = this.selectedProjectId;
      // }
    }
  }

  assignTaskToSelf() {
    if (this.projectTeamMembers && this.projectTeamMembers.length > 0) {
      if (this.loggedInUserId) {
        const loggedInUserFromTeam = this.projectTeamMembers.find(
          (teamMemberObject: ProjectTeamMember) => teamMemberObject.id == this.loggedInUserId
        );
        if (loggedInUserFromTeam) {
          this.setFormControlValue('assignTo', loggedInUserFromTeam);
        } else {
          this._quickAddTask['assignTo'].reset();
        }
      }
    }
  }
  getSelectedTaskStatus(status: any) {
    this.setFormControlValue('taskStatus', status);
    this.setStateValue(status);
    console.log(this._quickAddTask['taskState'].value);
    this.toggleOverlayTaskStatusSelection();
  }

  // Prepare status list based on selected state and selected project
  prepareStatusList(selectedProject: any) {
    if (selectedProject && selectedProject?.id) {
      const currentState = this._quickAddTask['taskState'].value;
      this.statusService.getAllStatuses(selectedProject?.id?.toString()).subscribe((response: any) => {
        if (response?.data && response?.data?.length > 0) {
          try {
            const projStatusList = response?.data;
            if (currentState && projStatusList && projStatusList?.length > 0) {
              const statusList = projStatusList || [];
              if (statusList && statusList.length > 0) {
                this.taskStatusList = statusList;
                this.filteredSubStatusList = [];
                statusList.forEach((statusObject: any) => {
                  // if (statusObject.state === currentState.name.toString().toLowerCase().replaceAll(' ', '')) {
                  this.filteredSubStatusList.push({
                    id: statusObject.id || '',
                    name: statusObject.title || '',
                    color: statusObject.color || '',
                    state: statusObject.state,
                  });
                  // }
                });
                if (this.filteredSubStatusList && this.filteredSubStatusList?.length > 0) {
                  this.filteredSubStatusList = this.filteredSubStatusList.sort((item1: any, item2: any) => {
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
                if (this.taskStatusList && this.taskStatusList.length > 0) {
                  this.bindDefaultStatusObject(currentState);
                }
              }
            } else {
              this.filteredSubStatusList = [];
              this.taskStatusList = [];
            }
          } catch {
            this.snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'An error occured while loading data related project.' },
              duration: 45000,
            });
          }
        } else {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'An error occured while loading data related project.' },
            duration: 45000,
          });
        }
      });
    }
  }
  resetDropdownOfSubStatus() {
    const currentState = this._quickAddTask['taskState'].value;
    if (this.taskStatusList && this.taskStatusList.length > 0) {
      this.filteredSubStatusList = [];
      this.taskStatusList.forEach((statusObject: any) => {
        // if (statusObject.state === currentState.name.toString().toLowerCase().replaceAll(' ', '')) {
        this.filteredSubStatusList.push({
          id: statusObject.id || '',
          name: statusObject.title || '',
          color: statusObject.color || '',
          state: statusObject.state,
        });
        // }
      });
      if (this.filteredSubStatusList && this.filteredSubStatusList.length > 0) {
        this.bindDefaultStatusObject(currentState);
      }
    }
  }

  // This method will bind default status for state
  bindDefaultStatusObject(currentState: any) {
    const findDefaultStatusObject = this.filteredSubStatusList.find(
      (statusObject: any) => statusObject.state.toLowerCase() == currentState.name.replaceAll(' ', '').toLowerCase()
    );
    if (findDefaultStatusObject) {
      this.setFormControlValue('taskStatus', findDefaultStatusObject);
    }
  }

  // This method will set form control value based on form control name
  setFormControlValue(formControlName: string, formControlValue: any) {
    this._quickAddTask[formControlName].setValue(formControlValue);
  }

  setTaskStatusFromProject(selectedProject: any) {
    if (selectedProject && selectedProject.projectStatus && selectedProject.projectStatus.length > 0) {
      const findTaskStatusObject = selectedProject.projectStatus.find(
        (projectStatusObject: any) => projectStatusObject.id == this.newTaskStateAndStatus.taskStatudId
      );
      if (findTaskStatusObject) {
        // find state using status object
        this.setFormControlValue('taskStatus', findTaskStatusObject.id || '');
        this.setStateValue(findTaskStatusObject);
      }
    }
  }

  setStateValue(statusObject: any) {
    if (statusObject && this.taskStateList && this.taskStateList.length > 0) {
      const findStateIndex = this.taskStateList.findIndex(
        (taskStateObject: taskStateListEnumModel) => taskStateObject.name.replace(' ', '').toLocaleLowerCase() == statusObject.state.toLowerCase()
      );
      if (findStateIndex > -1) {
        this.setFormControlValue('taskState', this.taskStateList[findStateIndex]);
      }
    }
  }

  //#region get selected values when overlay gets closed
  getSelectedAssignedTo(event: any) {
    if (event) {
      this.setFormControlValue('assignTo', event);
    }
    this.toggleOverlayAssignedTo();
  }

  removeAssignTo(formControlName: string) {
    // if (!this.isDisableAssignedToOverlay) {
    this.resetFormControl(formControlName);
    // }
  }

  // reset form control based on form control name
  resetFormControl(formControlName: string) {
    this._quickAddTask[formControlName].reset();
  }
  isDisableSaveButton = false;
  // post task API Integration if task is valid
  onSaveTask() {
    this.isTaskSubmitted = true;
    if (this.quickAddTaskFormGroup.valid) {
      const formValue = this.quickAddTaskFormGroup.getRawValue();
      const selectedProject = this.projectsDataList.find((proj: any) => proj.id === formValue.project.id);
      formValue.labels?.forEach((label: any) => (label.project_id = formValue.project.id));
      const postQuickTaskRequestBody: PostQuickTaskRequstModel = {
        title: formValue.title || '',
        type: formValue.taskType || DEFAULT_TASK_TYPE_CONSTANT,
        project_id: formValue.project.id,
        assignee: formValue.assignTo ? formValue.assignTo.id : '',
        state: formValue.taskState.name.toString().toLowerCase().replaceAll(' ', '') || '',
        status: formValue.taskStatus.id || '',
        section: formValue.section && formValue.section.id ? formValue.section.id : null,
        priority: formValue.priorityFormControl ? formValue.priorityFormControl.name : '',
        eta: formValue.eta ? formValue.eta : null,
        due_date: formValue.dueDate ? (moment(formValue.dueDate).utc().format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD)) : null,
        labels: JSON.stringify(formValue.labels ? formValue.labels : []),
        //reporter: selectedProject?.responsible_person ,
        reporter: this.reaponsiblePerson,
        subscribers: [
          formValue.assignTo ? formValue.assignTo.id : '',
          this.reaponsiblePerson && formValue?.assignTo?.id !== this.reaponsiblePerson ? this.reaponsiblePerson : '',
        ],
      };
      if (this.parentTaskId) {
        const decryptedId = Encryption._doDecrypt(this.parentTaskId);
        postQuickTaskRequestBody.parent_task_id = +decryptedId;
      }

      // create task
      this.isDisableSaveButton = true;
      this.subscriptions.push(
        this.taskService.postQuickTask(postQuickTaskRequestBody).subscribe({
          next: (response: PostQuickTaskResponseModel) => {
            this.isDisableSaveButton = false;
            if (response) {
              if (response.status && response.success) {
                this.snackBar.openFromComponent(SnackbarComponent, {
                  data: { message: response.message || '' },
                });

                this.isTaskSubmitted = false;
                this.resetFormGroup();
                if (response.data && response.data.length > 0) this.emitTaskCreatedEvent(response.data[0]);
              }
            }
          },
          error: (error: any) => {
            this.isDisableSaveButton = false;

            console.log('error:', error);
          },
        })
      );
    } else {
      let isErrorMessageShown = false;
      for (const key in this.quickAddTaskFormGroup.controls) {
        const control = this.quickAddTaskFormGroup.get(key);
        if (!control?.valid) {
          if (!isErrorMessageShown) {
            let fieldName = key;
            let errorMessage = '';
            if (fieldName.toLowerCase() == QUICK_TASK_FORM_CONTROLS.TASK_TYPE.toLowerCase()) {
              fieldName = 'Task Type';
            } else if (fieldName.toLowerCase() == QUICK_TASK_FORM_CONTROLS.ASSIGNTO.toLowerCase()) {
              fieldName = QUICK_TASK_FORM_CONTROLS.ASSIGN_SPACE_TO;
            } else if (fieldName.toLowerCase() == QUICK_TASK_FORM_CONTROLS.TITLE.toLowerCase()) {
              if (control?.errors?.['minlength']) {
                errorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_MINLENGTH;
              } else if (control?.errors?.['maxlength']) {
                errorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_MAXLENGTH;
              } else if (control?.errors?.['required']) {
                errorMessage = QUICK_TASK_ERROR_MESSAGE.TITLE_REQUIRED;
              }
            }
            this.snackBar.openFromComponent(SnackbarComponent, {
              data: {
                message: errorMessage
                  ? errorMessage
                  : (fieldName == 'taskStatus' ? 'Task status' : fieldName == 'eta' ? 'ETA' : fieldName) + ' is required',
              },
              duration: 45000,
            });

            isErrorMessageShown = true;
            errorMessage = '';
          }
        }
      }
    }
  }

  resetFormGroup() {
    this.resetFormControl('title');
    this.resetFormControl('taskType');
    this._quickAddTask['taskState'].setValue({ name: 'To Do' });
    this._quickAddTask['priorityFormControl'].setValue('');
    this._quickAddTask['labels'].setValue([]);
    this.resetFormControl('dueDate');
    this.resetFormControl('eta');
    this.assignTaskToSelf();
  }

  onTaskTypeChange(taskTypeObject: any) {
    this.setFormControlValue('taskType', taskTypeObject.name);
  }

  // pass isTaskCancelled = true in event emmiter
  onCancelTask() {
    this.emitTaskStatusEvent.emit({
      isTaskCancelled: true,
    });
    if (this.parentTaskId) {
      this.resetFormGroup();
    }
  }

  // pass isTaskCancelled = true along with createdTaskDetail response
  emitTaskCreatedEvent(taskObject: any) {
    this.emitTaskStatusEvent.emit({
      isTaskCreated: true,
      createdTaskDetail: taskObject,
    });
  }

  // check if event.id is not there, means need to create new section, otherwise set selected section
  onSectionSelect(event: any) {
    console.log('event:', event);
    if (event) {
      if (!event.id) {
        const sectionRequestBody: PostTaskSectionModel = {
          project_id: this._quickAddTask['project'].value.id || '',
          title: event || '',
        };

        this.subscriptions.push(
          this.taskService.postTaskSection(sectionRequestBody).subscribe({
            next: (response: PostTaskSectionResponseModel) => {
              if (response) {
                if (response.data) {
                  this.setSectionFormControlValue({ id: response.data.id, title: response.data.title });
                }
              }
            },
            error: (error: any) => {
              console.log('error:', error);
            },
            complete: () => {
              this.toggleOverlayForTaskSections();
            },
          })
        );
      } else if (event.id && event.title) {
        this.setSectionFormControlValue({ id: event.id, title: event.title });
        this.toggleOverlayForTaskSections();
      }
    }
  }

  // this will reset task section form control
  onRemoveTaskSection() {
    this._quickAddTask['section'].reset();
  }

  toggleOverlayForTaskSections() {
    // first check if permission is granted
    //  if (!this.isDisableTaskLabelOverlay) {
    if (!this.isOverlayOpenForSections) {
      const selectedProject = this._quickAddTask['project'].value;
      if (!selectedProject) {
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: { message: ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST },
          duration: 45000,
        });
      } else {
        this.isOverlayOpenForSections = !this.isOverlayOpenForSections;
      }
    } else {
      this.isOverlayOpenForSections = !this.isOverlayOpenForSections;
    }
    // }
  }
  getTaskColor(taskState: any) {
    if (taskState.name) {
      const taskStyle = this.items.find((item: any) => item.title === taskState.name);
      return taskStyle.color || 'black';
    }
    return 'black';
  }

  onRemoveTaskLabel(eventArgs: any) {
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

  onLabelColorChange(evnetArgs: any) {
    const items = this.tempLabelStorage || [];
    if (items.length > 0) {
      items[items.length - 1].color = evnetArgs;
    }
    this.tempLabelStorage = items;
    this.toggleLabelColorPicker();
  }
  editTaskLables() {
    if (this.quickAddTaskFormGroup.controls['project']?.value?.id) {
      this.tempLabelStorage = JSON.parse(JSON.stringify(this.quickAddTaskFormGroup.controls['labels'].value));
      this.isLabelsChanged = true;
      this.tasksService.getTaskLabels(this.quickAddTaskFormGroup.controls['project']?.value?.id).subscribe(
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
            project_id: eventArgs && eventArgs.project_id ? eventArgs.project_id : this.quickAddTaskFormGroup.controls['project'].value.id || '',
            color: eventArgs && eventArgs.color ? eventArgs.color : Utility.getLabelColorDetails(),
          });

          this.isLabelsChanged = true;
          this.tempLabelStorage = items;
          this.resetFilteredLabels();
        }
      }
    } else {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'You cannot add more than 5 labels.' },
        duration: 45000,
      });
    }
    this.isOverlayOpenForTaskLabels = false;
  }

  updateDueDate(eventArgs: any) {
    const dueDate = eventArgs?.value?.format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
    this.quickAddTaskFormGroup.controls['dueDate'].patchValue(eventArgs.value);
  }
  removeEtaFromTask() {
    this.quickAddTaskFormGroup.controls['eta'].patchValue('');
  }
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
      this.quickAddTaskFormGroup.controls['eta'].patchValue(ETAToPass);
      this.displayEtaSelection = false;
    }
  }
  getSelectedResponsiblePerson(eventArgs: any) {
    this.quickAddTaskFormGroup.controls['assignTo'].patchValue(eventArgs);
    this.isOverlayOpenForAssignTo = false;
  }
  saveLabels() {
    if (this.isLabelsChanged) {
      this.quickAddTaskFormGroup.controls['labels'].patchValue(this.tempLabelStorage);
      this.openQuickTaskLabelsSection = false;
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
  filterprojectBasedOnSearchText(eventArgs: any) {
    this.filteredProjectTeam = this.projectTeamMembers.filter(
      (member: any) =>
        member.first_name.toLowerCase().includes(eventArgs.target.value?.toLowerCase()) ||
        member.last_name.toLowerCase().includes(eventArgs.target.value?.toLowerCase())
    );
  }
}
