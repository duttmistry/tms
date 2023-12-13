import { Component } from '@angular/core';
import { PreferencesService } from '../../../core/services/module/preferences/preferences.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'main-app-pref-task',
  templateUrl: './pref-task.component.html',
  styleUrls: ['./pref-task.component.scss'],
})
export class PrefTaskComponent {
  taskPrefList: any[] = [];
  projectList: any[] = [];
  projectControl = new FormControl();
  projects: any[] = [];
  constructor(
    private preferenceService: PreferencesService,
    private spinnerService: SpinnerService,
    private projectService: ProjectsService,
    private _snackBar: MatSnackBar
  ) {
    this.getProjectList();
  }

  getProjectList() {
    this.spinnerService.showSpinner();
    this.projectService.getAllProjects().subscribe(
      (response: any) => {
        if (response && response.list) {
          this.projectList = response.list || [];
          const selectedProj = this.projectList.map((project) => project.id);
          this.projectControl.setValue(selectedProj);
          this.getPreferenceList();
          // this.updatePreferenceProject(); // Note: - commented because not require to call this api as of now.
        } else {
          this.spinnerService.hideSpinner();
        }
      },
      (error) => {
        this.spinnerService.hideSpinner();
        console.log('error:', error);
      }
    );
  }

  getPreferenceList() {
    try {
      this.preferenceService.getPreferenceList().subscribe((res: any) => {
        if (res && res.data) {
          if (res.data.Projects) {
            const { Projects } = res.data;
            Projects.forEach((elm: any) => {
              elm.project_title = this.getProjectName(elm.project_id);
              // elm.is_selected = true; // set default is_selected true
            });
            this.taskPrefList = Projects;
            this.spinnerService.hideSpinner();
          } else {
            this.taskPrefList = [];
          }
        }
      });
    } catch (error) {
      console.log(error);
      this.spinnerService.hideSpinner();
    }
  }

  onCancelClick() {
    this.getPreferenceList();
  }

  onSaveClick() {
    if (this.taskPrefList && this.taskPrefList.length) {
      this.taskPrefList.forEach((elm: any) => {
        const projects = {
          projectId: elm.project_id,
          notify_project_update: elm.is_notify,
          taskPreferences: elm.actions.reduce((obj: any, item: any) => {
            obj[item.key] = item.is_notify;
            return obj;
          }, {}),
        };
        this.projects.push(projects);
      });
      this.updateProjectPref({ projects: this.projects });
    }
  }

  getProjectName(id: any) {
    const matchedProject = this.projectList.find((project: any) => parseInt(project.id) === parseInt(id));
    return matchedProject ? matchedProject.project_title : '-';
  }

  updateProjectPref(reqBody: any) {
    this.preferenceService.updateProjectPreference(reqBody).subscribe(async (res: any) => {
      if (res && res.data) {
        this._snackBar.open(res.message);
        await this.getPreferenceList();
      }
    });
  }

  onSelectProject(evt: any) {
    const { value, selected } = evt.source;
    if (this.taskPrefList && this.taskPrefList.length) {
      this.taskPrefList = this.taskPrefList.map((item: any) => {
        if (parseInt(item.project_id) === parseInt(value)) {
          return { ...item, is_selected: selected };
        }
        return item;
      });
    }
  }

  updatePreferenceProject() {
    const reqBody = this.projectList.map((m: any) => m.id.toString());
    if (reqBody && reqBody.length) {
      this.preferenceService.createProjectPreference({ projectIdArray: reqBody }).subscribe((res: any) => {
        // console.log(res);
      });
    }
  }
}
