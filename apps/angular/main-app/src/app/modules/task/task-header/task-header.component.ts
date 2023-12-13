import { TaskService } from './../../../core/services/module/tasks/task.service';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../../core/services/common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { Observable, ReplaySubject, Subject, Subscription, elementAt, map, of, startWith, take, takeUntil } from 'rxjs';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ProjectsRequestDataModel, TaskListRequestBody } from '../../../core/model/task/task.model';
import { Utility } from '../../../core/utilities/utility';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import {
  PROJECT_ID_QUERY_PARAM_CONSTANT,
  STORAGE_CONSTANTS,
  TASK_PRIORITY_COLOR_CONSTANTS,
  TASK_PRIORITY_CONSTANTS,
} from '../../../core/services/common/constants';
import * as moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { v4 as uuidv4 } from 'uuid';
import { ChangeDetectorRef } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatMenuTrigger } from '@angular/material/menu';
@Component({
  selector: 'main-app-task-header',
  templateUrl: './task-header.component.html',
  styleUrls: ['./task-header.component.scss'],
  animations: [
    trigger('valueChange', [
      state(
        'initial',
        style({
          transform: 'translateY(0)',
          opacity: 1,
        })
      ),
      state(
        'changed',
        style({
          transform: 'translateY(-20px)',
          opacity: 0,
        })
      ),
      transition('initial => changed', animate('200ms')),
    ]),
  ],
})
export class TaskHeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  //#region [Data Members]
  public selectedOptions: any;
  public projectsId: any[] = [];
  public projectTasksList: any[] = [];

  @Output() navigationChange = new EventEmitter();
  selectedTab = new FormControl(0);
  workspace_projects = new FormControl(null);
  searchFormControl = new FormControl('');
  userFormControl = new FormControl();
  selectedAssignees: any = [];
  orderByControl = new FormControl('');
  fromDateControl = new FormControl('');
  toDateControl = new FormControl('');
  includeCompleted = new FormControl(false);
  projectList: any[] = [];
  workspaceName = '';
  workspaceId: any;
  decryptedWorkspaceId: any;

  orderByList = ['project', 'title'];
  userList: any[] = [];
  changedSelection = false;
  // if any option is added or removed in below array groupByList, then it needs to be verified in task list component
  groupByList = [
    { value: 'Project', key: 'project_id', projectSpecific: false },
    { value: 'Status', key: 'state', projectSpecific: false },
    { value: 'User', key: 'assignee', projectSpecific: false },
    { value: 'Section', key: 'section', projectSpecific: true },
  ];
  statusList = Utility.stateList;
  statusControl = new FormControl(this.statusList.filter((state: any) => state.value !== 'completed').map((status: any) => status.value));
  tabs = [
    { id: 1, name: 'List', icon: 'list' },
    { id: 2, name: 'Board', icon: 'dashboard' },
    { id: 3, name: 'Documents', icon: 'contact_page' },
  ];
  groupByControl = new FormControl(this.groupByList[0].key);

  isExpandCategory: any[] = [];
  projectRecord: any = [];
  projectControl = new FormControl();
  workspaceList: any;
  selectedProjects: any = [];
  filteredData: any[] = [];
  selectedProjectCount = 0;
  subscriptions: Subscription[] = [];

  selectedProjectID: any = null;
  selectedWorkSpaceId: any = null;
  enableProjSpecificFilters = false;
  encUser_id = '';
  decUser_id = '';
  assigniesList: any[] = [];
  filteredAssigneeList: any = [];
  loggedInUserData: any = null;
  userFilterPrefStorageID = STORAGE_CONSTANTS.TASK_FILTERS;
  PRIORITYCOLOR: any = TASK_PRIORITY_COLOR_CONSTANTS;
  projectSelection: any = [];
  projectSelectionInputList: any = [];
  totalTasksCount = 0;
  statusSelectionChanged = false;
  assigneeSearchControl = new FormControl('');
  ignoreProjectFilter = false;
  selctedFilterOption: any = [];
  moreFilterOptions: any[] = [
    {
      id: uuidv4() as string,
      label: 'Labels',
      value: 'labels',
      what: true,
      where: true,
      isWhereMultiple: true,
      isDatePicker: false,
      whenFilterOptions: [
        {
          label: 'Is',
          value: 'IN',
        },
        {
          label: 'Is not',
          value: 'NOT IN',
        },
        {
          label: 'Is set',
          value: 'IS NOT NULL',
        },
        {
          label: 'Is not set',
          value: 'IS NULL',
        },
      ],
    },
    {
      id: uuidv4() as string,
      label: 'Priority',
      value: 'priority',
      what: true,
      where: true,
      isWhereMultiple: false,
      isDatePicker: false,
      whenFilterOptions: [
        {
          label: 'Is',
          value: 'IN',
        },
        {
          label: 'Is not',
          value: 'NOT IN',
        },
        {
          label: 'Is set',
          value: 'IS NOT NULL',
        },
        {
          label: 'Is not set',
          value: 'IS NULL',
        },
      ],
    },
    {
      id: uuidv4() as string,
      label: 'Due Date',
      value: 'dueDate',
      what: true,
      where: true,
      isWhereMultiple: false,
      isDatePicker: true,
      whenFilterOptions: [
        {
          label: 'Is',
          value: 'IN',
        },
      ],
    },
  ];
  whenFilterOptions: any = [];
  moreFiltersGroup: FormGroup;
  priorityFilterOptions: any[] = [
    {
      label: TASK_PRIORITY_CONSTANTS.HIGH,
      priorityImg: 'high-priority.svg',
    },
    {
      label: TASK_PRIORITY_CONSTANTS.NORMAL,
      priorityImg: 'normal-priority.svg',
    },
    {
      label: TASK_PRIORITY_CONSTANTS.LOW,
      priorityImg: 'low-priority.svg',
    },
    {
      label: TASK_PRIORITY_CONSTANTS.URGENT,
      priorityImg: 'urgent-priority.svg',
    },
  ];
  labelFilterOptions: any = [];
  labelFilterOptionSearch: any = [...this.labelFilterOptions];
  @ViewChild('search') searchTextBox: any;

  selectFormControl = new FormControl();
  searchTextboxControl = new FormControl();
  selectedValues: any = [];
  filteredOptions: any = [];
  indexOfLabelsFilter: any;
  filterByDueDate = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
  });
  minDate = new Date('1900-01-01');
  dynamicFilters: any = [];
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;
  filterCount = 0;
  hideFilterBadge = false;
  //#endregion

  //#region [Member Functions]

  //#region [Skeleton Methods]
  constructor(
    private router: Router,
    private taskService: TaskService,
    private storageService: StorageService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private projectService: ProjectsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.moreFiltersGroup = this.fb.group({
      moreFilters: this.fb.array([]),
      operation: 'AND',
    });
    this.menuTrigger = {} as MatMenuTrigger;
  }
  ngAfterViewInit(): void {
    console.log('');
  }
  ngOnInit() {
    window.scroll(0, 0);
    this.route.queryParams.subscribe((params) => {
      this.selectedWorkSpaceId = params['w_id'];
      this.selectedWorkSpaceId = this.selectedWorkSpaceId ? Encryption._doDecrypt(this.selectedWorkSpaceId) : this.selectedWorkSpaceId;

      this.selectedProjectID = params['p_id'];
      this.selectedProjectID = this.selectedProjectID ? Encryption._doDecrypt(this.selectedProjectID) : this.selectedProjectID;

      this.loggedInUserData = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
      this.decUser_id = this.loggedInUserData?.user_id;
      this.encUser_id = Encryption._doEncrypt(this.loggedInUserData.user_id.toString());
      const paramUserId = this.route.snapshot.queryParams['user_id'];
      this.userFilterPrefStorageID = STORAGE_CONSTANTS.TASK_FILTERS + '_' + (paramUserId || this.encUser_id);
      this.setDefaultAssignees();
      this.selectedAssignees = [this.assigniesList[0]];
      this.userFormControl.patchValue(this.selectedAssignees);
      this.subscriptions.push(
        this.taskService.getReFetchProjectWiseTasks().subscribe((status: boolean) => {
          if (status === true) {
            this.getProjectidsWiseTaskList();
          }
        })
      );

      this.subscriptions.push(
        this.taskService.getViewAllTaks().subscribe((groupDetails: any) => {
          if (groupDetails !== null && groupDetails != false) {
            this.getViewAllForGroup(groupDetails);
          }
        })
      );
      const urlDetails = this.router.url.split('/');
      if (urlDetails[2] === 'board') {
        this.selectedTab.setValue(1);
      } else if (urlDetails[2] === 'docs') {
        this.selectedTab.setValue(2);
      } else {
        this.selectedTab.setValue(0);
      }
      //this.getAllWorkspaceList();
      // this.getProjectsData();
      this.subscriptions.push(
        this.taskService.getProjectWiseTasks().subscribe((response: any) => {
          this.totalTasksCount = 0;
          if (response && response?.length > 0) {
            response.forEach((group: any) => {
              this.totalTasksCount += group.groupTaskCount || 0;
            });
          }
        })
      );
    });

    // more filters group
    this.moreFiltersGroup.valueChanges.subscribe((value: any) => {
      // Iterate through the moreFilters array and set whenFilterOptions for each object
      value.moreFilters.forEach(async (filterObject: any) => {
        filterObject.whenFilterOptions = await this.setWhenFilterOptions(filterObject.filter);
        // this.moreFilterOptions = this.moreFilterOptions.filter((option: any) => option.value !== filterObject.filter);
        if (filterObject.filter == 'labels') {
          this.indexOfLabelsFilter = value.moreFilters.indexOf(filterObject);
        }
        this.selctedFilterOption.push(filterObject.filter);
      });
      this.cdr.detectChanges();
      // console.log('%c   this.whenFilterOptions:', 'color: #0e93e0;background: #aaefe5;', this.whenFilterOptions);
      // console.log(value);
    });
    // this.initializeFilterOptions()
  }
  setWhenFilterOptions(filterValue: any) {
    const option = this.moreFilterOptions.find((option) => option.value == filterValue);
    // console.log('%c  option:', 'color: #0e93e0;background: #aaefe5;', option);

    return option ? option.whenFilterOptions : [];
  }

  ngOnDestroy(): void {
    this.storageService.removeFromLocalStorage('project');
    this.storageService.removeFromLocalStorage('workspace');
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
  //#endregion
  //#region [Data Fetch & pre-process]

  setAssigneeFilter(selectedProjects: any = null) {
    if (this.assigniesList.length < 3) {
      if (selectedProjects) {
        this.userList.forEach((user: any) => {
          user.include = selectedProjects.includes(user.projectId);
        });
      }
      this.setDefaultAssignees();
      this.selectedAssignees = [this.assigniesList[0]];
      this.userFormControl.patchValue(this.selectedAssignees);
      this.userList
        .filter((user) => user.include == true)
        .forEach((user) => {
          const index = this.assigniesList.findIndex((_user: any) => user.user.id === _user.id);
          if (index === -1) {
            this.assigniesList.push({
              name: `${user.user.first_name} ${user.user.last_name}`,
              id: user.user.id,
            });
          }
        });

      this.assigniesList = [
        ...this.assigniesList.slice(0, 2),
        ...this.assigniesList.slice(2).sort((assigne1: any, assignee2: any) => {
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

      this.filteredAssigneeList = [...this.assigniesList];

      const encFilters = localStorage.getItem(this.userFilterPrefStorageID);
      if (encFilters) {
        const filters = Encryption._doDecrypt(encFilters);
        const filterDetails = JSON.parse(filters);

        if (filterDetails.assignee) {
          this.selectedAssignees = filterDetails.assignee
            .map((_assignee: any) => {
              const _index = this.assigniesList.findIndex((__asignee: any) => __asignee.id === _assignee.id);
              if (_index != -1) {
                return this.assigniesList[_index];
              } else {
                return null;
              }
            })
            .filter((__assign: any) => __assign != null);
          this.userFormControl.patchValue([...this.selectedAssignees]);
        }
      }
    }
  }

  setDefaultAssignees() {
    this.assigniesList = [
      {
        name: `Me(${this.loggedInUserData.user_firstname} ${this.loggedInUserData.user_lastname})`,
        id: this.loggedInUserData.user_id,
      },
      {
        name: 'Unassigned',
        id: -1,
      },
    ];
    this.filteredAssigneeList = [...this.assigniesList];
  }
  getAllProjects() {
    this.taskService.getAllProjects().subscribe(
      (response: any) => {
        if (response && response.data) {
          this.projectList = response?.data?.list;
          if (this.projectList && this.projectList.length > 0) {
            this.taskService.setProjectList(this.projectList);
          }
        }
      },
      (error) => {
        console.log('error to get all projects=>', error);
      }
    );
  }

  getProjectsByWorkspace() {
    if (this.workspaceId) {
      this.taskService.getProjectByWorkspace(Encryption._doEncrypt(this.workspaceId.toString())).subscribe(
        (response: any) => {
          if (response && response?.data && response.data.length > 0) {
            this.projectList = response?.data || [];
          }
        },
        (error) => {
          console.log('error to get project by Workspace', error);
        }
      );
    }
  }

  getProjectsData() {
    const requestBody: ProjectsRequestDataModel = {
      status: true,
      custom_fields: false,
      tag: false,
      team: true,
      billing_configuration: false,
      documents: false,
      workspace: true,
    };
    this.subscriptions.push(
      this.taskService.getProjectsData(requestBody).subscribe({
        next: (response: any) => {
          if (response) {
            if (response.data) {
              if (response.data.list) {
                const projectList = response.data.list;
                response.data.list.sort((_project1: any, _project2: any) => {
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
                this.ignoreProjectFilter = false;
                if (this.selectedProjectID) {
                  const filteredRecords = response.data.list.filter((project: any) => project.id.toString() === this.selectedProjectID.toString());
                  if (filteredRecords && filteredRecords.length > 0) {
                    this.ignoreProjectFilter = true;
                    this.projectSelection = [...filteredRecords];
                  } else {
                    this.ignoreProjectFilter = false;
                    this.projectSelection = [{ id: -1 }];
                  }
                } else if (this.selectedWorkSpaceId) {
                  const filteredRecords = response.data.list.filter(
                    (project: any) => project?.projectWorkspace?.workspace?.id.toString() === this.selectedWorkSpaceId.toString()
                  );
                  if (filteredRecords && filteredRecords.length > 0) {
                    this.ignoreProjectFilter = true;
                    this.projectSelection = [...filteredRecords];
                  } else {
                    this.projectSelection = [{ id: -1 }];
                  }
                } else {
                  this.projectSelection = [...response.data.list];
                }
                this.projectSelectionInputList = [...response.data.list];

                this.userList = this.projectSelectionInputList.map((project: any) => {
                  return project.projectTeamData.map((teamDetails: any) => {
                    return {
                      id: teamDetails.id,
                      user: teamDetails.user,
                      projectId: project.id,
                      include: true,
                    };
                  });
                });
                this.userList = this.userList.flat(2);
                this.userList = this.userList.filter((record: any) => record != null);

                this.checkAvailbaleFilters();
                this.getProjectidsWiseTaskList();
              } else {
                this.taskService.setProjectWiseTasks([]);
              }
            } else {
              this.taskService.setProjectWiseTasks([]);
            }
          } else {
            this.taskService.setProjectWiseTasks([]);
          }
        },
        error: (error: any) => {
          this.taskService.setProjectWiseTasks([]);
        },
      })
    );
  }
  getFilterDate() {
    return {
      user: this.userFormControl.value,
      status: this.statusControl.value,
      orderBy: this.orderByControl.value,
      toDate: this.toDateControl.value,
      fromDate: this.fromDateControl.value,
      groupBy: this.groupByControl.value,
      workspaceData: this.projectControl.value,
    };
  }

  setFilteredData() {
    const data = this.getFilterDate();
    this.taskService.setFilterData(data);
  }
  getGroupByValue() {
    return this.groupByList.find((item: any) => item.key === this.groupByControl.value)?.value || '';
  }
  //#endregion

  //#region [Others]
  navigateToGivenPath(path: string) {
    const workspaceFromStorage = this.storageService.getFromLocalStorage('workspace');
    let workspaceId;
    if (workspaceFromStorage) {
      workspaceId = JSON.parse(workspaceFromStorage).id || '';
    }
    this.router.navigate([path, workspaceId || '']);
  }
  // This method will count number of checked projects and also
  // It will set checked projects in session storage
  countSelectedProjects() {
    if (this.projectRecord && this.projectRecord.length > 0) {
      const projectListToBeDisplayed: any = [];
      let selectedProjectCount = 0;
      this.projectRecord.forEach((workspaceObj: any) => {
        workspaceObj.projects.forEach((projectObj: any) => {
          if (projectObj.checked) {
            selectedProjectCount += 1;
            const projectObject = {
              id: projectObj.id,
              projectTitle: projectObj.name,
              workspaceId: workspaceObj.id,
            };
            projectListToBeDisplayed.push(projectObject);
          }
        });
      });
      this.storageService.setIntoSessionStorage(this.storageService.projectsForTasksKey, JSON.stringify(projectListToBeDisplayed));
      this.taskService.setProjectWiseTasks(projectListToBeDisplayed);
      this.selectedProjectCount = selectedProjectCount;
    }
  }

  /**
   * display selected project name on input dropdown
   */
  getSelectedProjectName() {
    return '';
  }

  getWorkspaceWithProjectList() {
    // check if workspace and project list for filter exists in session storage
    let workspaceAndProjectsFromSessionStorage: any = this.storageService.getFromSessionStorage(this.storageService.projectsForTasksKey);
    workspaceAndProjectsFromSessionStorage = workspaceAndProjectsFromSessionStorage ? JSON.parse(workspaceAndProjectsFromSessionStorage) : [];
    if (workspaceAndProjectsFromSessionStorage && workspaceAndProjectsFromSessionStorage.length > 0) {
      this.workspaceList = workspaceAndProjectsFromSessionStorage;
    } else {
      this.subscriptions.push(
        this.taskService.getWorkspaceWithProjectList().subscribe(
          (response: any) => {
            if (response && response.data) {
              response.data.forEach((element: any) => {
                element.checked = false;
              });
              this.workspaceList = response.data.filter((m: any) => m.projects.length > 0);
              // If user has come from the workspace, set default checked = true for all projects along with that workspace
              if (this.workspaceId) {
                const findIndex = this.workspaceList.findIndex((workspaceObject: any) => workspaceObject.id == this.workspaceId);
                if (findIndex > -1) {
                  this.workspaceList[findIndex].checked = true;
                  this.workspaceList[findIndex].projects.forEach((projectObject: any) => {
                    projectObject.checked = true;
                  });
                }
              } else {
                // Else user has come from Project List
                let projectObject: any = this.storageService.getFromLocalStorage('project');
                if (projectObject) {
                  projectObject = JSON.parse(projectObject);
                  this.workspaceList.forEach((workspaceObject: any, workspaceIndex: number) => {
                    workspaceObject.projects.forEach((projectObj: any) => {
                      if (projectObj.id == projectObject.id && projectObj.name == projectObject.title) {
                        projectObj.checked = true;
                        const allProjectsCheckedIndex = this.workspaceList[workspaceIndex].projects.findIndex(
                          (projectObj: any) => !projectObj.checked
                        );
                        if (allProjectsCheckedIndex <= -1) {
                          this.workspaceList[workspaceIndex].checked = true;
                        }
                        const workspaceObj = {
                          id: workspaceObject.id,
                          projects: workspaceObject.projects,
                        };
                        this.projectRecord.push(workspaceObj);
                        // workspaceObject.checked = true;
                      }
                    });
                  });
                  // this.countSelectedProjects();
                } else {
                  // Else user has come from sidebar (tasks), set checked = true for all workspace and projects
                  // let projectCount = 0;
                  this.workspaceList.forEach((workspaceObject: any) => {
                    workspaceObject.checked = true;
                    // projectCount += workspaceObject.projects.length;
                    workspaceObject.projects.forEach((projectObject: any) => {
                      projectObject.checked = true;
                    });
                    const workspaceObj = {
                      id: workspaceObject.id,
                      projects: workspaceObject.projects,
                    };
                    this.projectRecord.push(workspaceObj);
                  });
                  // this.selectedProjectCount = projectCount;
                }
              }
              this.countSelectedProjects();
            }
          },
          (err: any) => {
            console.log('error getWorkspaceWithProjectList=>', err);
          }
        )
      );
    }
  }

  manageProjectData() {
    if (this.projectRecord && this.projectRecord.length) {
      this.projectRecord.forEach((workspace: any) => {
        if (workspace.projects.length) {
          workspace.projects.forEach((proj: any) => {
            if (proj && proj.checked) {
              this.projectControl.setValue(proj);
            }
          });
        }
      });
    } else {
      this.projectRecord = [];
    }
  }
  //#endregion

  //#region [Event Handlers]
  selectAllAsignee() {
    const additionalItems = this.filteredAssigneeList.filter(
      (user: any) => this.selectedAssignees.findIndex((_user: any) => _user.id === user.id) === -1
    );
    this.selectedAssignees = [...this.selectedAssignees, ...additionalItems];

    this.userFormControl.patchValue([...this.selectedAssignees]);
    this.changedSelection = true;
    //this.getProjectidsWiseTaskList();
  }

  unselcteAllAsignee() {
    const itemsAfterRemoved = this.selectedAssignees.filter(
      (user: any) => this.filteredAssigneeList.findIndex((_user: any) => _user.id === user.id) === -1
    );
    this.selectedAssignees = [...itemsAfterRemoved];

    this.userFormControl.patchValue([...this.selectedAssignees]);
    this.changedSelection = true;
    //this.getProjectidsWiseTaskList();
  }
  onChangeTab() {
    const router_path =
      this.selectedTab.value == 0 ? 'tasks/list' : this.selectedTab.value == 1 ? 'tasks/board' : this.selectedTab.value == 2 ? 'tasks/docs' : 'tasks';
    this.navigationChange.emit({ path: router_path });
    if (this.selectedTab.value == 0 || this.selectedTab.value == 1) {
      this.taskService.setRefetchProjectWiseTask(true);
    }
  }
  onSelectProject(event: any) {
    this.setFilteredData();
  }
  onSelectStatus(event: any) {
    this.setFilteredData();
  }

  onSelectOrderBy(event: any) {
    this.setFilteredData();
  }

  onSelectUser($event: any) {
    this.setFilteredData();
  }

  onSelectGroupBy(event: any) {
    // console.log('event:', event);
    this.getProjectidsWiseTaskList();
  }

  onChangeFromDate(event: any) {
    this.setFilteredData();
  }

  onChangeToDate(event: any) {
    this.setFilteredData();
  }
  onShowCompletedChange(eventArgs: any) {
    this.includeCompleted.patchValue(eventArgs.checked);
    // if (this.includeCompleted.value == true && this.statusControl.value !== '') {
    //   this.statusControl.patchValue('');
    // }
    this.getProjectidsWiseTaskList();
  }
  onStatusChange(eventArgs: any) {
    // if (this.statusControl.value !== '') {
    //   this.includeCompleted.patchValue(false);
    // }
    this.getProjectidsWiseTaskList();
  }
  expandDocumentTypes(group: any) {
    this.isExpandCategory[group.title] = !this.isExpandCategory[group.title];
  }

  // This method adds/updates/removes project object based on checked event
  toggleProject(event: any, projectObject: any, workspaceObject: any) {
    if (event.checked) {
      if (this.projectRecord && this.projectRecord.length > 0) {
        const findWorkspaceIndex = this.projectRecord.findIndex((workspaceObj: any) => workspaceObj.id === workspaceObject.id);
        if (findWorkspaceIndex > -1) {
          const findProjectIndex = this.projectRecord[findWorkspaceIndex].projects.findIndex((projectObj: any) => projectObj.id === projectObject.id);
          if (findProjectIndex > -1) {
            this.projectRecord[findWorkspaceIndex].projects[findProjectIndex].checked = true;

            // check if all projects are checked
            const findIndexNotCheckedProject = this.projectRecord[findWorkspaceIndex].projects.findIndex(
              (projectObj: any) => projectObj.checked == false
            );
            if (findIndexNotCheckedProject <= -1) {
              this.projectRecord[findWorkspaceIndex].checked = true;
            } else {
              this.projectRecord[findWorkspaceIndex].checked = false;
            }

            // update workspaceList Array
            const updateWorkspaceIndex = this.workspaceList.findIndex((workspaceObj: any) => workspaceObj.id === workspaceObject.id);
            if (updateWorkspaceIndex > -1) {
              const updateprojectIndex = this.workspaceList[updateWorkspaceIndex].projects.findIndex(
                (projectObj: any) => projectObj.id === projectObject.id
              );
              if (updateprojectIndex > -1) {
                this.workspaceList[updateWorkspaceIndex].projects[updateprojectIndex].checked = true;
                if (findIndexNotCheckedProject <= -1) {
                  this.workspaceList[updateWorkspaceIndex].checked = true;
                } else {
                  this.workspaceList[updateWorkspaceIndex].checked = false;
                }
              }
            }
          }
        }
        this.projectControl.setValue(this.projectRecord);
      }
    } else if (!event.checked) {
      if (this.projectRecord && this.projectRecord.length > 0) {
        const workspaceFindIndex = this.projectRecord.findIndex((workspaceObj: any) => workspaceObj.id == workspaceObject.id);
        if (workspaceFindIndex > -1) {
          this.projectRecord[workspaceFindIndex].checked = event.checked;
          const projectFindIndex = this.projectRecord[workspaceFindIndex].projects.findIndex((projectObj: any) => projectObj.id == projectObject.id);
          if (projectFindIndex > -1) {
            this.projectRecord[workspaceFindIndex].projects[projectFindIndex].checked = event.checked;
            // set updated object in workspaceList
            const updateWorkspaceIndex = this.workspaceList.findIndex((workspaceObj: any) => workspaceObj.id == workspaceObject.id);
            if (updateWorkspaceIndex > -1) {
              this.workspaceList[updateWorkspaceIndex].checked = event.checked;
              const updateProjectFindIndex = this.workspaceList[updateWorkspaceIndex].projects.findIndex(
                (projectObj: any) => projectObj.id == projectObject.id
              );
              if (updateProjectFindIndex) {
                this.workspaceList[updateWorkspaceIndex].projects[updateProjectFindIndex].checked = event.checked;
              }
            }
          }
        }
      }
    }
    this.projectControl.setValue(this.projectRecord);
    this.countSelectedProjects();
  }

  // This method adds/updates/removes workspace object based on checked event
  toggleWorkspace(event: any, optionObject: any) {
    // check if workspace is selected
    if (event.checked) {
      optionObject.projects.forEach((projectObject: any) => {
        projectObject.checked = true;
      });
      const workspaceObject = {
        id: optionObject.id,
        projects: optionObject.projects,
      };

      // if projectRecord.length > 0, check if workspace already exists YES => update workspace, NO => push new workspace
      if (this.projectRecord && this.projectRecord.length > 0) {
        const findIndex = this.projectRecord.findIndex((workspaceObject: any) => workspaceObject.id === optionObject.id);
        if (findIndex > -1) {
          this.projectRecord[findIndex] = workspaceObject;
        } else {
          this.projectRecord.push(workspaceObject);
        }
      } else {
        // If projectRecord is Empty then push workspace object
        this.projectRecord.push(workspaceObject);
      }
    } else if (!event.checked) {
      // remove object from projectRecord array
      if (this.projectRecord && this.projectRecord.length > 0) {
        const findIndex = this.projectRecord.findIndex((workspaceObject: any) => workspaceObject.id === optionObject.id);
        if (findIndex > -1) {
          // this.projectRecord.splice(findIndex, 1);
          this.projectRecord[findIndex].checked = event.checked;
          const findIndexToUncheckProject = this.workspaceList.findIndex((workspaceObject: any) => workspaceObject.id === optionObject.id);
          if (findIndexToUncheckProject > -1) {
            this.workspaceList[findIndexToUncheckProject].checked = event.checked;
            this.workspaceList[findIndexToUncheckProject].projects.forEach((projectObject: any) => {
              projectObject.checked = false;
            });
          }
        }
      }
    }
    this.projectControl.setValue(this.projectRecord);
    this.countSelectedProjects();
  }
  onAssigneeSeracTextChange(eventArgs: any) {
    console.log();
  }
  filterList(eventArgs: any) {
    this.filteredAssigneeList = this.assigniesList.filter((user: any) => user.name.toLowerCase().includes(eventArgs.target.value.toLowerCase()));
    this.userFormControl.patchValue([...this.selectedAssignees]);
  }
  onAssigneeCheckChangeOption(assignee: any) {
    const index = this.selectedAssignees.findIndex((user: any) => user.id === assignee.id);
    if (index !== -1) {
      this.selectedAssignees.splice(index, 1);
    } else {
      this.selectedAssignees.push(assignee);
    }
    this.userFormControl.patchValue([...this.selectedAssignees]);
  }
  clearAssigneeFilter() {
    this.selectedAssignees = [];
    this.userFormControl.patchValue([...this.selectedAssignees]);
  }
  // navigate to add task page
  navigateToAddTask() {
    // check if p_id exists in url then pass project id in add task page query parameters
    if (this.router.url && this.router.url.includes(PROJECT_ID_QUERY_PARAM_CONSTANT)) {
      const project_id = this.route.snapshot.queryParams[PROJECT_ID_QUERY_PARAM_CONSTANT];
      if (project_id) {
        this.router.navigate(['tasks', 'add'], {
          queryParams: { p_id: project_id, r_url: 'list' },
        });
      } else {
        this.router.navigate(['tasks', 'add'], {
          queryParams: { r_url: 'list' },
        });
      }
    } else {
      this.router.navigate(['tasks', 'add'], {
        queryParams: { r_url: 'list' },
      });
    }
  }
  getSelectedProjects(eventArgs: any) {
    const allProjects = eventArgs[1];
    const selectedProjects = eventArgs[0];

    if (allProjects && Array.isArray(allProjects) && allProjects.length > 0) {
      if (!this.projectSelectionInputList || !Array.isArray(this.projectSelectionInputList) || this.projectSelectionInputList.length === 0) {
        const projectList = allProjects && Array.isArray(allProjects) ? allProjects : [];
        this.projectSelection = selectedProjects && Array.isArray(selectedProjects) && selectedProjects.length > 0 ? selectedProjects : allProjects;
        this.projectSelectionInputList = [...projectList];

        this.ignoreProjectFilter = false;
        if (this.selectedProjectID || this.selectedWorkSpaceId) {
          this.ignoreProjectFilter = true;
        }

        this.taskService.getProjectTeam([...projectList.map((prod: any) => prod.id)]).subscribe((response: any) => {
          if (response?.data && Array.isArray(response?.data)) {
            try {
              this.userList = response?.data?.map((project: any) => {
                return project.projectTeam.map((teamDetails: any) => {
                  return {
                    id: teamDetails.id,
                    user: teamDetails.user,
                    projectId: project.id,
                    include: true,
                  };
                });
              });
              this.userList = this.userList.flat(2);
              this.userList = this.userList.filter((record: any) => record != null);
              this.checkAvailbaleFilters();
              this.getProjectidsWiseTaskList();
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
        });
      } else {
        this.projectSelection = selectedProjects && Array.isArray(selectedProjects) && selectedProjects.length > 0 ? selectedProjects : allProjects;
        this.clearFilterAndFetch();
      }
    } else {
      this.taskService.setProjectWiseTasks([]);
    }
  }

  //#endregion

  //#region [Fetch Default Pref]
  checkAvailbaleFilters() {
    const encFilters = localStorage.getItem(this.userFilterPrefStorageID);
    if (encFilters) {
      const filters = Encryption._doDecrypt(encFilters);
      const filterDetails = JSON.parse(filters);
      // if (filterDetails.projects && !this.ignoreProjectFilter) {
      //   this.projectSelection = this.projectSelectionInputList.filter((project: any) => filterDetails.projects.includes(project.id));
      // }
      if (filterDetails.search) {
        this.searchFormControl.patchValue(filterDetails.search);
      }
      if (filterDetails.assignee) {
        this.selectedAssignees = [...filterDetails.assignee];
        this.userFormControl.patchValue(filterDetails.assignee);
      }
      if (filterDetails.state) {
        this.statusControl.patchValue(filterDetails.state); // Status Control Mutiple Changes
      }
      if (filterDetails.fromDate) {
        this.fromDateControl.patchValue(filterDetails.fromDate);
      }
      if (filterDetails.toDate) {
        this.toDateControl.patchValue(filterDetails.toDate);
      }
      if (filterDetails.groupBy) {
        if (this.projectSelection && this.projectSelection?.length > 0) {
          if (filterDetails.groupBy && (filterDetails.groupBy === 'status' || filterDetails.groupBy === 'section')) {
            if (this.projectSelection?.length === 1) {
              this.groupByControl.patchValue(filterDetails.groupBy);
            } else {
              this.groupByControl.patchValue(this.groupByList[0].key);
            }
          } else {
            this.groupByControl.patchValue(filterDetails.groupBy);
          }
        }
      }
      if (filterDetails.dynamicFilters && filterDetails.moreFlterDetails) {
        this.dynamicFilters = filterDetails.dynamicFilters;
        this.moreFilters().patchValue(filterDetails.moreFlterDetails);
        this.filterCount = this.dynamicFilters?.length;
        this.hideFilterBadge = this.filterCount > 0 ? true : false;
      }
    }
  }
  setAvailableFilters() {
    //
    const filters = {
      search: this.searchFormControl.value || '',
      assignee: this.userFormControl.value || [],
      state: this.statusControl.value || [],
      fromDate: this.fromDateControl.value || '',
      toDate: this.toDateControl.value || '',
      groupBy: this.groupByControl.value || '',
      showCompleted: this.includeCompleted.value,
      projects: this.projectSelection.map((proj: any) => {
        return { id: proj?.id };
      }),
      dynamicFilters: this.dynamicFilters,
      moreFlterDetails: this.moreFilters().value,
    };

    localStorage.setItem(this.userFilterPrefStorageID, Encryption._doEncrypt(JSON.stringify(filters)));
  }
  //#endregion

  //#region For Multiselect checkbox dropdawn

  // Get workspace list

  public getSelectedProjectList(eventArgs: any) {
    this.projectSelection = eventArgs;
    this.clearFilterAndFetch();
  }

  statusSelectionChange(eventArgs: any) {
    if (!eventArgs && this.statusSelectionChanged) {
      this.statusSelectionChanged = false;
      this.getProjectidsWiseTaskList();
    }
  }

  public getProjectidsWiseTaskList() {
    this.searchFormControl.setValue(this.searchFormControl.value?.trim() || '');
    if (this.toDateControl.value && (this.fromDateControl.value == '' || this.fromDateControl.value == null)) {
      this.snackBar.open('Please select from date.');
      return;
    }

    this.projectsId =
      this.projectSelection && this.projectSelection.length > 0
        ? this.projectSelection.map((project: any) => project.id)
        : this.projectSelectionInputList.map((project: any) => project.id);
    if (this.projectsId) {
      this.enableProjSpecificFilters = this.projectsId.length === 1 ? true : false;
      const reqData = this.projectsId.map(Number);
      const body = new TaskListRequestBody();
      // Change in getViewAllForGroup as well
      body.project_ids = reqData && reqData.length > 0 ? reqData : [];
      body.group_by = this.enableProjSpecificFilters && this.groupByControl.value === 'state' ? 'status' : this.groupByControl.value;
      body.search = this.searchFormControl.value;
      body.filter_by_state = this.statusControl?.value || []; // Status Control Mutiple Changes
      body.filter_by_from_date = this.fromDateControl.value ? moment(this.fromDateControl.value).format('YYYY-MM-DDTHH:mm:ss.000\\Z') : '';
      body.filter_by_to_date = this.toDateControl.value ? moment(this.toDateControl.value).format('YYYY-MM-DDT23:59:59.000\\Z') : '';
      body.is_completed = this.includeCompleted.value;
      body.user_ids = this.userFormControl.value.map((user: any) => user.id);
      body.is_unassigned = body.user_ids.includes(-1);
      const userIds = body.user_ids.filter((uid: number) => uid !== -1);
      body.user_ids = userIds.length === 0 && body.is_unassigned ? [-1] : userIds;
      body.dynamic_filter = this.dynamicFilters;

      if (body.filter_by_from_date && body.filter_by_to_date) {
        const dateDifference = moment(this.toDateControl.value).diff(this.fromDateControl.value);
        if (dateDifference >= 0) {
          this.getProjectWiseTaskCoreLogic(body);
        } else {
          this.snackBar.open('The To date should be equal or later than the From date.');
        }
      } else {
        this.getProjectWiseTaskCoreLogic(body);
      }
    }
  }

  getProjectWiseTaskCoreLogic(requestBody: any) {
    this.setAvailableFilters();
    this.taskService.getTaskList(requestBody).subscribe(
      (response: any) => {
        if (response && response?.data) {
          const responseData = response.data ? response.data : null;
          const taskList = this.getTaskListGroupWise(responseData, requestBody);
          this.projectTasksList = taskList;
          this.taskService.setProjectWiseTasks(this.projectTasksList);
          this.taskService.setRefetchProjectWiseTask(false);
          this.taskService.setViewAllTasks(null);
          this.setAssigneeFilter(requestBody.project_ids);
        } else {
          this.taskService.setProjectWiseTasks([]);
          this.taskService.setRefetchProjectWiseTask(false);
          this.taskService.setViewAllTasks(null);
        }
      },
      (error: any) => {
        this.taskService.setProjectWiseTasks([]);
        this.taskService.setRefetchProjectWiseTask(false);
        this.taskService.setViewAllTasks(null);
      }
    );
  }
  getTaskListGroupWise(responseData: any, body: TaskListRequestBody) {
    const taskList: any = [];
    this.totalTasksCount = 0;
    for (const ele in responseData) {
      const tasks = responseData[ele].data;
      const task = tasks && tasks.length > 0 ? tasks[0] : null;
      const taskDetails = {
        groupTitle: ele != 'null' && ele != 'undefined' ? ele : `No ${body.group_by}`,
        groupKey: '123',
        groupTaskCount: responseData[ele].total_task || 0,
        isShowNewTask: false,
        groupId: null,
        groupTasks: tasks.map((task: any) => {
          return {
            ...task,
            team: this.userList
              .filter((user: any) => user.projectId === task.project_id)
              .map((user: any) => user.user)
              .sort((assigne1: any, assignee2: any) => {
                const assignee1Name = assigne1.first_name.toLowerCase() + ' ' + assigne1.last_name.toLowerCase(),
                  assignee2Name = assignee2.first_name.toLowerCase() + ' ' + assignee2.last_name.toLowerCase();

                if (assignee1Name < assignee2Name) {
                  return -1;
                }
                if (assignee1Name > assignee2Name) {
                  return 1;
                }
                return 0;
              }),
            priorityImg: task.priority ? task.priority.toLowerCase() + '-priority.svg' : '',
          };
        }),
        groupType: body.group_by,
        options: {
          taskState: task.state || '',
          taskStatudId: task.status || '',
          project_id: task.project_id || '',
          singleProjectSelected: this.projectSelection.length === 1,
        },
        showViewAll: (responseData[ele].total_task || 0) > body.group_limit,
      };
      if (body.group_by === 'project_id') {
        taskDetails.groupId = task.project_id;
      } else if (body.group_by === 'state') {
        taskDetails.groupId = task.state;
        taskDetails.groupTitle = Utility.stateList.find((state) => state.value === taskDetails.groupTitle)?.title || taskDetails.groupTitle;
        taskDetails.groupTitle = taskDetails.groupTitle ? taskDetails.groupTitle : 'No Status';
      } else if (body.group_by === 'assignee') {
        if (task.assignee) {
          taskDetails.groupId = task.assignee;
          const titleParts = taskDetails.groupTitle.split('_');
          const title = titleParts.reduce((prev: any, current: any, index: any) => {
            if (index != titleParts.length - 1) {
              return prev + '_' + current;
            }
            return prev;
          });
          taskDetails.groupTitle = titleParts && titleParts?.length > 0 ? title : taskDetails.groupTitle;
        } else {
          taskDetails.groupTitle = 'Unassigned';
        }
      } else if (body.group_by === 'status') {
        taskDetails.groupId = task.task_status?.id || task.status;
        taskDetails.groupTitle = taskDetails.groupTitle ? taskDetails.groupTitle : 'No Status';
      } else if (body.group_by === 'section') {
        taskDetails.groupId = task.task_section.id || task.section;
        taskDetails.groupTitle = taskDetails.groupTitle ? taskDetails.groupTitle : 'No Section';
      }
      taskList.push(taskDetails);
    }
    return taskList;
  }

  public getViewAllForGroup(groupDetails: any) {
    this.taskService.setViewAllTasks(false);
    if (groupDetails) {
      const reqData = this.projectsId.map(Number);
      const body = new TaskListRequestBody();
      // Change in getProjectWiseTaskCoreLogic as well
      body.project_ids = reqData && reqData.length > 0 ? reqData : [];
      body.group_by = this.groupByControl.value;
      body.search = this.searchFormControl.value;
      body.filter_by_state = this.statusControl?.value || []; // Status Control Mutiple Changes
      body.filter_by_from_date = this.fromDateControl.value ? moment(this.fromDateControl.value).format('YYYY-MM-DDTHH:mm:ss.000\\Z') : '';
      body.filter_by_to_date = this.toDateControl.value ? moment(this.toDateControl.value).format('YYYY-MM-DDT23:59:59.000\\Z') : '';
      body.user_ids = this.userFormControl.value.map((user: any) => user.id);
      body.group_limit = 99999999;
      body.is_completed = this.includeCompleted.value;
      body.dynamic_filter = this.dynamicFilters;
      if (groupDetails.groupType === 'assignee') {
        body.is_unassigned = groupDetails.groupId ? false : true;
      } else {
        body.is_unassigned = body.user_ids.includes(-1);
      }
      const userIds = body.user_ids.filter((uid: number) => uid !== -1);
      body.user_ids = userIds.length === 0 && body.is_unassigned ? [-1] : userIds;

      if (groupDetails.groupType === 'project_id') {
        body.project_ids = [groupDetails.groupId];
      } else if (groupDetails.groupType === 'state') {
        body.filter_by_state = [groupDetails.groupId];
      } else if (groupDetails.groupType === 'assignee') {
        body.user_ids = groupDetails.groupId ? [groupDetails.groupId] : [-1];
      } else if (groupDetails.groupType === 'status') {
        body.filter_by_status = groupDetails.groupId;
      } else if (groupDetails.groupType === 'section') {
        body.filter_by_section = groupDetails.groupId ? groupDetails.groupId : -1;
      }
      this.taskService.getTaskList(body).subscribe((response: any) => {
        if (response && response?.data) {
          const responseData = response.data ? response.data : null;
          const taskList: any[] = this.getTaskListGroupWise(responseData, body);
          const indexOfGroup = this.projectTasksList.findIndex(
            (group: any) => group.groupId === groupDetails.groupId && group.groupType === groupDetails.groupType
          );
          if (indexOfGroup != -1) {
            this.projectTasksList[indexOfGroup] = taskList && taskList?.length > 0 ? taskList[0] : [];
            this.taskService.setProjectWiseTasks(this.projectTasksList);
          }
        }
      });
    }
  }

  clearFilterAndFetch() {
    this.searchFormControl.patchValue('');
    this.groupByControl.patchValue(this.groupByList[0].key);
    this.statusControl.patchValue(this.statusList.filter((state: any) => state.value !== 'completed').map((status: any) => status.value)); // Status Control Mutiple Changes
    this.fromDateControl.patchValue('');
    this.toDateControl.patchValue('');
    this.setDefaultAssignees();
    this.selectedAssignees = [this.filteredAssigneeList[0]];
    this.userFormControl.patchValue([...this.selectedAssignees]);

    this.moreFilters().clear();
    this.dynamicFilters = [];
    this.filterCount = 0;
    this.hideFilterBadge = false;
    this.getProjectidsWiseTaskList();
  }
  assigneeSelectionToggled(eventArgs: any) {
    if (!eventArgs && this.changedSelection) {
      this.changedSelection = false;
      this.getProjectidsWiseTaskList();
      this.assigneeSearchControl.patchValue('');
      this.filteredAssigneeList = [...this.assigniesList];
    }
  }

  // moreFiltersToggle() {
  //   let currentValue;
  //    this.taskService.getMoreFiltersBoolean().subscribe((value: boolean) => (currentValue = value));
  //   console.log('%c  currentValue:', 'color: #0e93e0;background: #aaefe5;', currentValue);
  //   const newValue = !currentValue
  //   this.taskService.setMoreFiltersBoolean(newValue);
  // }

  moreFilters() {
    return this.moreFiltersGroup.get('moreFilters') as FormArray;
  }
  newFilters() {
    return this.fb.group({
      id: uuidv4(),
      filter: '',
      when: 'IN',
      where: '',
      whenFilterOptions: [],
      showPriorityDropdown: false,
      showWhenDropdown: false,
      showLabelsDropdown: false,
      showDateFilterDropdown: false,
    });
  }

  addFilters() {
    this.moreFilters().push(this.newFilters());
  }
  removeFilters(i: number) {
    this.moreFilters()?.removeAt(i);
    if (this.moreFilters()?.controls?.length == 0) {
      this.dynamicFilters = [];
      this.filterCount = this.dynamicFilters?.length;
      this.hideFilterBadge = false;
      this.getProjectidsWiseTaskList();
    }
    // this.selectedValues = []
    // this.selectFormControl.patchValue(this.selectedValues);
    // this.filterByDueDate.reset();  // this.moreFilters().reset(i);
  }
  getFilterOption(index: any) {
    return this.moreFilterOptions?.[index]?.whenFilterOptions;
  }
  getIndex(index: any) {
    return this.moreFilterOptions?.[index]?.whenFilterOptions;
  }
  onMoreFilterChange(event: any, index: any) {
    if (event == 'priority') {
      this.moreFilters().controls[index].get('when')?.setValue('IN');
      this.moreFilters().controls[index].get('showWhenDropdown')?.setValue(true);
      this.moreFilters().controls[index].get('showPriorityDropdown')?.setValue(true);
      this.moreFilters().controls[index].get('showLabelsDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showDateFilterDropdown')?.setValue(false);
    } else if (event == 'dueDate') {
      this.moreFilters().controls[index].get('when')?.setValue('IN');

      this.moreFilters().controls[index].get('showWhenDropdown')?.setValue(true);
      this.moreFilters().controls[index].get('showPriorityDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showLabelsDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showDateFilterDropdown')?.setValue(true);
    } else if (event == 'labels') {
      this.moreFilters().controls[index].get('when')?.setValue('IN');
      this.moreFilters().controls[index].get('showWhenDropdown')?.setValue(true);
      this.moreFilters().controls[index].get('showLabelsDropdown')?.setValue(true);
      this.moreFilters().controls[index].get('showPriorityDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showDateFilterDropdown')?.setValue(false);
      this.getFilterLabels(this.projectsId);
    }
  }
  onWhenFilterChanges(event: any, index: any) {
    // if when filter is set or not set then don't show any where dropdowns
    if (event == 'IS NULL' || event == 'IS NOT NULL') {
      if (this.moreFilters().controls[index].get('filter')?.value == 'labels') {
        this.selectFormControl.reset();
      } else if (this.moreFilters().controls[index].get('filter')?.value == 'dueDate') {
        this.filterByDueDate.reset();
      } else {
        this.moreFilters().controls[index].get('where')?.setValue('');
      }
      this.moreFilters().controls[index].get('showLabelsDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showPriorityDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showDateFilterDropdown')?.setValue(false);
    }
    // otherwise show particular where dropdown based on the filters value
    else if ((event == 'IN' || event == 'NOT IN') && this.moreFilters().controls[index].get('filter')?.value == 'priority') {
      this.moreFilters().controls[index].get('showLabelsDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showPriorityDropdown')?.setValue(true);
      this.moreFilters().controls[index].get('showDateFilterDropdown')?.setValue(false);
    } else if ((event == 'IN' || event == 'NOT IN') && this.moreFilters().controls[index].get('filter')?.value == 'dueDate') {
      this.moreFilters().controls[index].get('showLabelsDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showPriorityDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showDateFilterDropdown')?.setValue(true);
    } else if ((event == 'IN' || event == 'NOT IN') && this.moreFilters().controls[index].get('filter')?.value == 'labels') {
      this.moreFilters().controls[index].get('showLabelsDropdown')?.setValue(true);
      this.moreFilters().controls[index].get('showPriorityDropdown')?.setValue(false);
      this.moreFilters().controls[index].get('showDateFilterDropdown')?.setValue(false);
    }
  }
  // labelFilterSearch(searchValue:any){
  //   if(searchValue == '') {
  //     this.labelFilterOptionSearch = this.labelFilterOptions
  //   }else{
  //     this.labelFilterOptionSearch = this.labelFilterOptions?.filter((option:any) => option.label.toLowerCase().includes(searchValue.toLowerCase()))
  //   }
  //   // }
  // onSelectionChange(event: any, index: number) {
  //   console.log('%c  event:', 'color: #0e93e0;background: #aaefe5;', event);
  //   if (event.isUserInput && event.source.selected == false) {

  //     const index = this.labelFilterOptionSearch.indexOf(event.source.value);
  //     this.labelFilterOptionSearch.splice(index, 1);
  //     // this.employee.patchValue(this.labelFilterOptionSearch);
  //     // this.allEmployee = this.employee.value;
  //   }
  //   if (event.isUserInput && event.source.selected) {
  //     // this.selectedEmployee.push(data);
  //     // this.employee.patchValue(this.selectedEmployee);
  //     // this.allEmployee = this.employee.value;
  //       this.labelFilterOptionSearch.indexOf(event.source.value);
  //   }
  //   // Handle the selection change here
  //   // console.log('Selected items:', event.value);
  //   // this.moreFilters().controls[index].get('where')?.setValue(event.value);
  //   // You can update your form control or perform any other necessary actions
  // }
  dueDateChange(event: any, index: any) {
    // console.log('%c  event:', 'color: #0e93e0;background: #aaefe5;', event.value);
    //
    // this.moreFilters().controls[index].get('where')?.setValue(event.value);
  }

  openedChange(e: any) {
    // Set search textbox value as empty while opening selectbox
    this.searchTextboxControl.patchValue('');
    // Focus to search textbox while clicking on selectbox
    if (e == true) {
      this.searchTextBox.nativeElement.focus();
    }
  }
  clearSearch(event: any) {
    event.stopPropagation();
    this.searchTextboxControl.patchValue('');
    this.filteredOptions = this.labelFilterOptions;
  }
  setSelectedValues() {
    // console.log('selectFormControl', this.selectFormControl.value);
    if (this.selectFormControl.value && this.selectFormControl.value.length > 0) {
      this.selectFormControl.value.forEach((e: any) => {
        if (this.selectedValues.indexOf(e) == -1) {
          this.selectedValues.push(e);
        }
      });
    }
  }
  selectionChange(event: any) {
    if (event.isUserInput && event.source.selected == false) {
      // console.log('%c  event:', 'color: #0e93e0;background: #aaefe5;', event);
      // console.log('%c   this.selectedValues:', 'color: #0e93e0;background: #aaefe5;',  this.selectedValues);
      let index = this.selectedValues.indexOf(event.source.value);
      // console.log('%c  index:', 'color: #0e93e0;background: #aaefe5;', index);
      this.selectedValues.splice(index, 1);
      // console.log('%c   this.selectedValues:', 'color: #0e93e0;background: #aaefe5;',  this.selectedValues);
    }
  }
  private _filter(name: string, index: any): String[] {
    const filterValue = name.toLowerCase();
    // console.log('%c  filterValue:', 'color: #0e93e0;background: #aaefe5;', filterValue);
    // Set selected values to retain the selected checkbox state
    this.setSelectedValues();
    this.selectFormControl.patchValue(this.selectedValues);
    this.moreFilters().controls[index]?.get('where')?.setValue(this.selectedValues);
    // console.log('%c  labelFilterOptions: in filter', 'color: #0e93e0;background: #aaefe5;', this.labelFilterOptions);
    let filteredList = this.labelFilterOptions.filter(
      (option: any) => option?.labelName?.toLowerCase().indexOf(filterValue) === 0 || option?.projectName?.toLowerCase().indexOf(filterValue) === 0
    );
    // console.log('%c  filteredList:', 'color: #0e93e0;background: #aaefe5;', filteredList);
    return filteredList;
  }
  valueChangeAnimation = 'initial';

  toggleOperation() {
    const currentOperation = this.moreFiltersGroup.get('operation')?.value;
    const newOperation = currentOperation === 'AND' ? 'OR' : 'AND';

    this.valueChangeAnimation = 'changed'; // Trigger the animation
    setTimeout(() => {
      this.moreFiltersGroup.get('operation')?.setValue(newOperation);
      this.valueChangeAnimation = 'initial'; // Reset the animation state
    }, 200); // Adjust the duration to match the animation time
  }

  onFilterByDate(event: any, index: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    // if (this.filterByDueDate.controls['startDate'].value && !this.filterByDueDate.controls['endDate'].value) {
    //   this.filterByDueDate.controls['endDate'].setErrors({
    //     endDateReq: true,
    //   });
    //   return;
    // } else {
    //   this.filterByDueDate.controls['endDate'].setErrors(null);
    // }
    // this.params.limit = 10;
    // this.params.page = 1;

    let end_date = this.filterByDueDate.controls['endDate'].value as any;
    let start_date = this.filterByDueDate.controls['startDate'].value as any;
    if (
      start_date &&
      end_date &&
      start_date.isSameOrBefore(end_date) &&
      this.filterByDueDate.controls['startDate'].valid &&
      this.filterByDueDate.controls['endDate'].valid
    ) {
      let startDate = this.filterByDueDate.controls['startDate'].value
        ? (this.filterByDueDate.controls['startDate'].value as any).format('YYYY-MM-DD')
        : '';
      let endDate = this.filterByDueDate.controls['endDate'].value
        ? (this.filterByDueDate.controls['endDate'].value as any).format('YYYY-MM-DD')
        : '';
      this.moreFilters()?.controls[index]?.get('where')?.setValue({
        start_date: startDate,
        end_date: endDate,
      });
    }
    // this.getLeaveHistoryData();
  }

  getFilterLabels(projects: any) {
    const body = { projects: projects };
    // console.log('%c  body:', 'color: #0e93e0;background: #aaefe5;', body);
    this.taskService.getFilterLabels(body).subscribe(async (response: any) => {
      if (response?.data) {
        this.labelFilterOptions = await response?.data?.reduce((acc: any, label: any) => {
          label?.projectLabel?.forEach((element: any) => {
            acc.push({ projectName: label.name, projectId: label.id, labelName: element.title, ...element });
          });
          return acc;
        }, []);
        this.filteredOptions = this.labelFilterOptions;
        // console.log('%c  labelFilterOptions:', 'color: #0e93e0;background: #aaefe5;', this.labelFilterOptions);
      }
    });
    // this.initializeFilterOptions()
  }
  // initializeFilterOptions(){
  //   this.filteredOptions = this.searchTextboxControl.valueChanges
  //   .pipe(
  //     startWith<string>(''),
  //     map((name:any) => this._filter(name,this.indexOfLabelsFilter))
  //   );
  // }
  searchLabels(event: any) {
    // console.log('%c  event:', 'color: #0e93e0;background: #aaefe5;', event);
    this.filteredOptions = this._filter(event, this.indexOfLabelsFilter);

    // console.log('%c  this.selectFormControl.value:', 'color: #0e93e0;background: #aaefe5;', this.selectFormControl.value);
  }
  applyMoreFilters() {
    // if(this.moreFiltersGroup.valid && this.selectFormControl.valid && this.filterByDueDate.valid){
    let dynamic_filters: any = [];
    // console.log('%c   this.moreFilters()?.controls?:', 'color: #0e93e0;background: #aaefe5;', this.moreFilters()?.controls);
    this.moreFilters()?.controls?.map((element: any) => {
      // console.log('%c  element:', 'color: #0e93e0;background: #aaefe5;', element);
      let array = [];
      let elementIndex = this.moreFilters().controls?.indexOf(element);
      if (elementIndex == 0) {
        array.push('');
      } else {
        array.push(this.moreFiltersGroup.get('operation')?.value);
      }

      if (element.get('filter')?.value == 'labels') {
        // array.push(this.moreFiltersGroup.get('operation')?.value)
        array.push(element.get('filter')?.value);
        array.push(element.get('when')?.value);
        const ids =
          this.selectFormControl &&
          this.selectFormControl?.value &&
          Array.isArray(this.selectFormControl?.value) &&
          this.selectFormControl?.value?.map((label: any) => label?.id);
        array.push(ids || '');
      } else if (element.get('filter')?.value == 'dueDate') {
        // array.push(this.moreFiltersGroup.get('operation')?.value)
        array.push('due_date');

        const dateObject = this.filterByDueDate.value;
        let mergedDate;
        if (dateObject?.startDate && dateObject?.endDate) {
          array.push('BETWEEN');
          mergedDate =
            (dateObject?.startDate &&
              dateObject?.endDate &&
              `'${moment(dateObject?.startDate).format('YYYY-MM-DD')}' AND '${moment(dateObject?.endDate).format('YYYY-MM-DD')}'`) ||
            '';
        } else if (dateObject?.startDate) {
          array.push(' >= ');
          mergedDate = `'${moment(dateObject?.startDate).format('YYYY-MM-DD')}'` || '';
        }

        array.push(mergedDate);
      } else if (element.get('filter')?.value == 'priority') {
        // array.push(this.moreFiltersGroup.get('operation')?.value)
        array.push(element.get('filter')?.value);
        array.push(element.get('when')?.value);
        const priorities = (Array.isArray(element.get('where')?.value) && element.get('where')?.value?.map((e: any) => e?.label)) || '';
        array.push(priorities);
      }
      // dynamic_filters.push(array)
      if (array[1] && array[3].length > 0 && array[3] != '') {
        // console.log('%c  array:', 'color: #0e93e0;background: #aaefe5;', array);
        dynamic_filters.push(array);
      } else if (array[2] == 'IS NULL' || array[2] == 'IS NOT NULL') {
        // console.log('%c  array:', 'color: #0e93e0;background: #aaefe5;', array);
        dynamic_filters.push(array);
      }
    });
    this.dynamicFilters = dynamic_filters;
    if (this.dynamicFilters.length > 0) {
      this.getProjectidsWiseTaskList();
      this.filterCount = this.dynamicFilters?.length;
      this.hideFilterBadge = true;
      this.menuTrigger.closeMenu();
    }
    // this.getProjectidsWiseTaskList()
    // }
  }

  //diasbled FIlter///

  disabledSelectedFiter(option: any) {
    const filterData = this.moreFilters()?.controls.filter((element: any) => element?.value?.filter == option?.value);
    if (filterData?.length > 0) {
      return true;
    }
    // console.log('%c  this.moreFilters()?.controls?:', 'color: #0e93e0;background: #aaefe5;', this.moreFilters()?.controls?.[index]);
    // console.log('%c  Index:', 'color: #0e93e0;background: #aaefe5;', Index);
    return false;
  }

  /////
  //#endregion

  //#endregion
}
