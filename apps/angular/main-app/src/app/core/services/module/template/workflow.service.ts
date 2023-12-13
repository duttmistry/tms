import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../../src/environments/environment';

interface IWorkflowBody {
  actionId: string;
  emailTemplateId: string;
}
@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  _base_url = environment.base_url;
  _workflow_url = environment.workflow + '/';
  _action = 'action';
  _action_by_id = 'actionById';
  _action_bind = 'actionEmailTemplateBind';
  _action_bind_by_id = 'actionEmailTemplateBindById';
  constructor(private http: HttpClient) {}

  getWorkflowAction() {
    return this.http.get(this._base_url + this._workflow_url + this._action);
  }

  getWorkFlowActionById(id: string) {
    return this.http.get(this._base_url + this._workflow_url + this._action_by_id, {
      headers: {
        actionid: id,
      },
    });
  }

  addWorkflowAction(body: IWorkflowBody) {
    return this.http.post(this._base_url + this._workflow_url + this._action_bind, body);
  }

  editWorkflowAction(body: IWorkflowBody, id: string) {
    return this.http.put(this._base_url + this._workflow_url + this._action_bind, body, {
      headers: {
        actionemailtemplatebindid: id,
      },
    });
  }

  getWorkFlow() {
    return this.http.get(this._base_url + this._workflow_url + this._action_bind);
  }

  getWorkFlowById(id: string) {
    return this.http.get(this._base_url + this._workflow_url + this._action_bind, {
      headers: {
        actionemailtemplatebindid: id,
      },
    });
  }

  deleteWorkFlow(id: string) {
    return this.http.delete(this._base_url + this._workflow_url + this._action_bind, {
      headers: {
        actionemailtemplatebindid: id,
      },
    });
  }
}
