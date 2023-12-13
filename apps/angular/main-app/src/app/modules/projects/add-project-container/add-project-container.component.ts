import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IWorkspaceListModel } from '../../../core/model/workspace/workspace.model';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { TagService } from '../../../core/services/module/projects/tag.service';
import { UserService } from '../../../core/services/module/users/users.service';
import { WorkspaceService } from '../../../core/services/module/workspace/workspace.service';

@Component({
  selector: 'app-add-project-container',
  templateUrl: './add-project-container.component.html',
  styleUrls: ['./add-project-container.component.scss'],
})
export class AddProjectContainerComponent implements OnInit, OnDestroy {
  teamMembersList!: any;
  workspaceResListData!: IWorkspaceListModel[];
  allTags: any;
  subscriptions: Subscription[] = [];
  constructor(
    private userService: UserService,
    private workspaceService: WorkspaceService,
    private tagService: TagService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    // console.log('project container');
    this.getTeamMembersData();
    this.getWorkspaceData();
    this.getAllTagData();
  }

  getTeamMembersData() {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.userService.getAllUsers().subscribe(
        (response: any) => {
          if (response) {
            const responseData = response.data || '';
            if (responseData && responseData.list && responseData.list.length > 0) {
              this.teamMembersList = responseData.list || [];
            }
            this.spinnerService.hideSpinner();
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error', error);
        }
      )
    );
  }

  getAllTagData() {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.tagService.getAllTagData().subscribe(
        (response: any) => {
          this.spinnerService.hideSpinner();
          if (response && response.data) {
            this.allTags = response.data.map((item: any) => ({
              id: item.id,
              name: item.title,
            }));
          } else {
            this.allTags = [];
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error', error);
        }
      )
    );
  }

  getWorkspaceData() {
    this.subscriptions.push(
      this.workspaceService.getAllWorkspaceForDropdown().subscribe(
        (data: any) => {
          this.spinnerService.hideSpinner();
          if (data && data.list && data.list.length > 0) {
            this.workspaceResListData = data.list;
          } else {
            this.workspaceResListData = [];
          }
        },
        (error: any) => {
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
