import { Router } from 'express';
import { Routes } from '@tms-workspace/apis-core';
import { auth } from '@tms-workspace/auth/user-authentication'
import WorkflowController from './controller/workflow.controller';

class WorkflowRoute implements Routes {
    public router = Router();
    public controller = new WorkflowController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`/workflow/action`, auth.default, this.controller.createActionforworkFlow);
        this.router.get(`/workflow/action`, auth.default, this.controller.getActionforworkFlow);
        this.router.get(`/workflow/actionById`, auth.default, this.controller.getActionforworkFlowById);
        this.router.put(`/workflow/action`, auth.default, this.controller.updateActionforworkFlow);
    
        this.router.post(`/workflow/actionEmailTemplateBind`, auth.default, this.controller.createActionEmailTemplateBind);
        this.router.get(`/workflow/actionEmailTemplateBind`, auth.default, this.controller.getActionEmailTemplateBind);
        this.router.get(`/workflow/actionEmailTemplateBindById`, auth.default, this.controller.getActionEmailTemplateBindById);
        this.router.put(`/workflow/actionEmailTemplateBind`, auth.default, this.controller.updateActionEmailTemplateBind);
        this.router.delete(`/workflow/actionEmailTemplateBind`, auth.default, this.controller.deleteActionEmailTemplateBind);
    }
}

export default WorkflowRoute;