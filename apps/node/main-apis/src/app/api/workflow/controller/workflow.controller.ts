import { NextFunction, Response } from 'express';
import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import * as Preference from '@tms-workspace/preference';

class WorkflowController {

    public async createActionforworkFlow(req: any, res: Response, next: NextFunction) {
        try {
            const action = req.body.action;
            if(!action) {
                res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.')); 
            }
            const data = await Preference._createActionforworkFlow(action);
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }

    public async getActionforworkFlow(req: any, res: Response, next: NextFunction) {
        try {
            const data = await Preference._getActionforworkFlow();
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }

    public async getActionforworkFlowById(req: any, res: Response, next: NextFunction) {
        try {
            const actionId = req.headers.actionid;
            if(!actionId) {
                res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }
            const data = await Preference._getActionforworkFlowById(actionId);
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }

    public async updateActionforworkFlow(req: any, res: Response, next: NextFunction) {
        try {
            const actionId = req.headers.actionid;
            const action = req.body.action;
            if(!actionId) {
                res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }
            if(!action) {
                res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }
            const data = await Preference._updateActionforworkFlow(actionId , action);
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }

    public async deleteActionforworkFlow(req: any, res: Response, next: NextFunction) {
        try {
            const actionId = req.headers.actionid;
            if(!actionId) {
                res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }
            const data = await Preference._deleteActionforworkFlow(actionId);
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }

    public async createActionEmailTemplateBind(req: any, res: Response, next: NextFunction) {
        try {
            const { emailTemplateId , actionId } = req.body;

            if(!emailTemplateId) {
               return  res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }
            if(!actionId) {
               return  res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }
 
            const getWorkFlowByActionId = await Preference._getActionEmailTemplateBindByActionId(actionId);
            
            // if this action has already one email template then throw error that one action does not have more than one email template
            if(getWorkFlowByActionId.length > 0) {
                return res.status(400).json(APIResponseFormat._ResBadRequest('One action does not have more than one email template'));
            }

            const data = await Preference._createActionEmailTemplateBind(emailTemplateId , actionId);
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }

    public async getActionEmailTemplateBind(req: any, res: Response, next: NextFunction) {
        try {
            const data = await Preference._getActionEmailTemplateBind();
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }

    public async getActionEmailTemplateBindById(req: any, res: Response, next: NextFunction) {
        try {
            const actionEmailTemplateBindId = req.headers.actionemailtemplatebindid;
            if(!actionEmailTemplateBindId) {
                res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }

            const data = await Preference._getActionEmailTemplateBindById(actionEmailTemplateBindId);
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }

    public async updateActionEmailTemplateBind(req: any, res: Response, next: NextFunction) {
        try {
            const actionEmailTemplateBindId = req.headers.actionemailtemplatebindid;
            const { emailTemplateId , actionId } = req.body;

            if(!actionEmailTemplateBindId) {
               return res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }

            if(!emailTemplateId) {
               return res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }

            if(!actionId) {
               return res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }

        
            // get workflow by actionEmailTemplateBindId 
            const getWorkFlowByActionEmailTemplateBindId = await Preference._getActionEmailTemplateBindById(actionEmailTemplateBindId);
            if(!getWorkFlowByActionEmailTemplateBindId) {
                return res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }

            const data = await Preference._updateActionEmailTemplateBind(actionEmailTemplateBindId , emailTemplateId , actionId);
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }
        catch (error) {
            next(error);
        }
    }

    public async deleteActionEmailTemplateBind(req: any, res: Response, next: NextFunction) {
        try {
            const actionEmailTemplateBindId = req.headers.actionemailtemplatebindid;
            if(!actionEmailTemplateBindId) {
                res.status(400).json(APIResponseFormat._ResBadRequest('There is an issue with your request contact administrator.'));
            }

            const data = await Preference._deleteActionEmailTemplateBind(actionEmailTemplateBindId);
            res.status(200).json(APIResponseFormat._ResDataFound(data));
        }catch (error) {
            next(error);
        }
    }
    
}

export default WorkflowController;