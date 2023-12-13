import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IProjectListDataModel } from '../../../core/model/projects/project.model';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { UserService } from '../../../core/services/module/users/users.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-view-workspace-container',
  templateUrl: './add-workspace-container.component.html',
  styleUrls: ['./add-workspace-container.component.scss'],
})
export class AddWorkspaceContainerComponent implements OnInit, OnDestroy {
  teamMembersList!: any;
  workspaceId: string | null = null;
  unlinkedProjectList: IProjectListDataModel[] = [];
  subscriptions: Subscription[] = [];
  constructor(
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private projectService: ProjectsService,
    private spinnerService: SpinnerService
  ) {
    this.workspaceId = this.activatedRoute.snapshot.paramMap.get('id');
    this.getTeamMembersData();
    this.getUnlinkedProjectList();
  }
  ngOnInit(): void {}

  getTeamMembersData() {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.userService.getAllUsers().subscribe(
        (response: any) => {
          this.spinnerService.hideSpinner();
          if (response) {
            const responseData = response.data || '';
            if (responseData.list && responseData.list.length > 0) {
              this.teamMembersList = responseData.list || [];
            }
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
        }
      )
    );
  }

  getUnlinkedProjectList() {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.projectService.getUnlinkedProjects(this.workspaceId || '').subscribe(
        (response: any) => {
          this.spinnerService.hideSpinner();
          if (response) {
            if (response.data && response.data.list && response.data.list.length > 0) {
              this.unlinkedProjectList = response.data ? response.data.list : [];
            } else {
              this.unlinkedProjectList = [];
            }
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
