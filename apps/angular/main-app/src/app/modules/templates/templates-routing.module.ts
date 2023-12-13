import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MessagingTemplatesComponent } from './messaging-templates/messaging-templates.component';
import { TemplateListComponent } from './template-list/template-list.component';
import { WorkflowComponent } from './workflow/workflow.component';

const routes: Routes = [
  {
    path: '',
    component: TemplateListComponent,
  },
  {
    path: 'edit/:id',
    component: MessagingTemplatesComponent,
  },
  {
    path: 'add',
    component: MessagingTemplatesComponent,
  },
  {
    path: 'workflow',
    component: WorkflowComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TemplatesRoutingModule {}
