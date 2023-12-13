import PreferenceService from "./services/preference.service";

export const _GetUserDetails = async (userId: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._findUserById(userId);
    return data;
  } catch (error) {
    return error
  }
}

export const _createUser = async (user: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._createUser(user);
    return data;
  }catch(err) {
    return err
  }
}

export const _UpdateUser = async (userId: any , user: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._updateUser(userId , user); 
    return data;
  } catch (error) {
    return error
  }
}

export const _GetUserPreference = async (userId: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getUserPreference(userId);
    return data;
  } catch (error) {
    return error
  }
}

export const _updateUserPreference = async (userId: any, preference: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._updateUserPreference(userId, preference);
    return data;
  } catch (error) {
    return error
  }
}

export const _updateProjectsFields = async (userId: any, projectUpdates: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._updateProjectsFields(userId, projectUpdates);
    return data;
  } catch (error) {
    return error
  }
}


// create controller for email template

export const _createTemplate = async (emailTemplate: any) => {
  const Preference = new PreferenceService();
  try { 
    const data = await Preference._createTemplate(emailTemplate);
    return data;
  } catch (error) {
    return error
  }
}

export const _getTemplateByName = async (templateName: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getTemplateByName(templateName);
    return data;
  } catch (error) {
    return error
  }
}

export const _getTemplateById = async (templateId: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getTemplateById(templateId);
    return data;
  } catch (error) {
    return error
  }
}

export const _updateTemplate = async (templateId: any, emailTemplate: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._updateTemplate(templateId, emailTemplate);
    return data;
  } catch (error) {
    return error
  }
}

export const _getEmailTemplate = async ({page , limit}) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getTemplate({page , limit});
    return data;
  } catch (error) {
    return error
  }
}

export const _deleteEmailTemplate = async (templateId: any) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._deleteTemplate(templateId);
    return data;
  } catch (error) {
    return error
  }
}

export const _getNotificationLogs = async (userId : string , Leavepage : number , Leavelimit : number , Taskpage : number , Tasklimit : number) => { 
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getNotificationLog(userId , Leavepage , Leavelimit , Taskpage , Tasklimit);
    return data;
  }
  catch (error) {
    return error
  }
}

export const _getInstanceVariable = async () => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getInstanceVariable();
    return data;
  } catch (error) {
    return error
  }
}

export const _createInstanceVariable = async (instanceVariable: string) => { 
  const Preference = new PreferenceService();
  try {
    const data = await Preference._createInstanceVariable(instanceVariable);
    
    return data;
  } catch (error) {
    return error
  }
}

export const _createUserNotificationLog = async (userId : string) => {
  const Preference = new PreferenceService();
  try {
    const getUserById = await Preference._getUserisExistinNotificationLog(userId);

    if(!getUserById) {
      const data = await Preference._createNotificationLogUser(userId);
      return data;
    }

  } catch (error) {
    return error
  }
}

export const _createActionforworkFlow = async (action : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._createActionforworkFlow(action);
    return data;
  } catch (error) {
    return error
  }
}

export const _getActionforworkFlow = async () => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getActionforworkFlow();
    return data;
  } catch (error) {
    return error
  }
}

export const _getActionforworkFlowById = async (actionId : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getActionforworkFlowById(actionId);
    return data;
  } catch (error) {
    return error
  }
}

export const _getEmailTemplateById = async (emailTemplateId : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getTemplateById(emailTemplateId);
    return data;
  } catch (error) {
    return error
  }
}

export const _updateActionforworkFlow = async (actionId : string , action : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._updateActionforworkFlow(actionId , action);
    return data;
  } catch (error) {
    return error
  }
}

export const _deleteActionforworkFlow = async (actionId : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._deleteActionforworkFlow(actionId);
    return data;
  } catch (error) {
    return error
  }
}

export const _createActionEmailTemplateBind = async (emailTemplateId : string , actionId : string) => {
  const Preference = new PreferenceService();
  try {

    // get action by id 
    const getActionById = await Preference._getActionforworkFlowById(actionId);
    if(!getActionById) {
      return 'Action is not exist';
    }

    // get email template by id
    const getEmailTemplateById = await Preference._getTemplateById(emailTemplateId);
    if(!getEmailTemplateById) {
      return 'Email Template is not exist';
    }

  
    const data = await Preference._createActionEmailTemplateBind(emailTemplateId , actionId);
    return data;
  } catch (error) {
    return error
  }
}

export const _getActionEmailTemplateBindByActionId = async (actionId : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getActionEmailTemplateBindByActionId(actionId);
    return data;
  } catch (error) {
    return error
  }
}

// get action email template bind by email template id 
export const _getActionEmailTemplateBindByEmailTemplateId = async (emailTemplateId : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getActionEmailTemplateBindByEmailTemplateId(emailTemplateId);
    return data;
  } catch (error) {
    return error
  }
}

export const _getActionEmailTemplateBind = async () => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getActionEmailTemplateBind();
    return data;
  } catch (error) {
    return error
  }
}

export const _getActionEmailTemplateBindById = async (actionEmailTemplateBindId : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getActionEmailTemplateBindById(actionEmailTemplateBindId);
    return data;
  } catch (error) {
    return error
  }
}

export const _updateActionEmailTemplateBind = async (actionEmailTemplateBindId : string , emailTemplateId : string , actionId : string) => {
  const Preference = new PreferenceService();
  try {

    // get action by id
    const getActionById = await Preference._getActionforworkFlowById(actionId);
    if(!getActionById) {
      return 'Action is not exist';
    }

    // get email template by id
    const getEmailTemplateById = await Preference._getTemplateById(emailTemplateId);
    if(!getEmailTemplateById) {
      return 'Email Template is not exist';
    }

    const data = await Preference._updateActionEmailTemplateBind(actionEmailTemplateBindId , emailTemplateId , actionId);
    return data;
  } catch (error) {
    return error
  }
}

export const _deleteActionEmailTemplateBind = async (actionEmailTemplateBindId : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._deleteActionEmailTemplateBind(actionEmailTemplateBindId);
    return data;
  } catch (error) {
    return error
  }
}

// get users device token

export const _getUsersDeviceToken = async (userIds : string[]) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getUsersDeviceTokenForCron(userIds);
    return data;
  } catch (error) {
    return error
  }
}
export const _getUsersDeviceTokenLead = async (userIds : string[]) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getUsersDeviceTokenForLeads(userIds);
    return data;
  } catch (error) {
    return error
  }
}

export const _emailPermissionLead = async (userIds : string[]) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._emailPermissionLead(userIds);
    return data;
  } catch (error) {
    return error
  }
}

export const _getTemplateByActionName = async (template : string) => {
  const Preference = new PreferenceService();
  try {
    const data = await Preference._getTemplateByActionName(template);
    return data;
  } catch (error) {
    return error
  }
}










