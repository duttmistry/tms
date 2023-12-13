import { IUser , IProject } from '../database/interface/user.interface';
import _DB from '../database/models';
import NotificationLog from '../database/models/notification_log.model';
import { sendEmail  } from '../core/sendEmail';
import { sendNotificationToMultipleDevice } from '../core/sendNotification';

class PreferenceService {

    
    public _findUserById = async (userId : string) => { 
    try {
        const user = await _DB.userModel.findOne({ userId: userId });
        return user;
        } catch (error) {
        throw new Error('Error finding user');
        }
    }
 
    // get all users device token 

    public _getUsersDeviceToken = async (userIds : string [] , where : string) => {
      try {
        const users = await _DB.userModel.find({ 
          userId: { $in: userIds },
          $where: where
        });
        
        let usersDeviceTokens : any = [];
          if(users && users.length > 0) {
          // get all users device token 
          users.forEach((user : any) => {
            usersDeviceTokens = [...usersDeviceTokens, ...user.userDeviceToken];
          });
        }
        return usersDeviceTokens;
      } catch (error) {
        throw new Error('Error getting all user device token');
      }
    }

    public _getUsersDeviceTokenForCron = async (userIds : string []) => {
      try {
        const users = await _DB.userModel.find({ 
          userId: { $in: userIds },
        });
        
        let usersDeviceTokens : any = [];
          if(users && users.length > 0) {
          // get all users device token 
          users.forEach((user : any) => {
            usersDeviceTokens = [...usersDeviceTokens, ...user.userDeviceToken];
          });
        }

        await sendNotificationToMultipleDevice(
          usersDeviceTokens,
          'Add/Resume the task', 
          'Administrator'
        )

        return usersDeviceTokens;
      } catch (error) {
        throw new Error('Error getting all user device token');
      }
    }

    public _getUsersDeviceTokenForLeads = async (userIds : string []) => {
      try {
        const users = await _DB.userModel.find({ 
          userId: { $in: userIds },
        });
        
        let usersDeviceTokens : any = [];
          if(users && users.length > 0) {
          // get all users device token 
          users.forEach((user : any) => {
            usersDeviceTokens = [...usersDeviceTokens, ...user.userDeviceToken];
          });
        }

        await sendNotificationToMultipleDevice(
          usersDeviceTokens,
          'Some team members have no ongoing tasks. Please check and assign tasks accordingly.',
          'Administrator'
        )

        return usersDeviceTokens;
      } catch (error) {
        throw new Error('Error getting all user device token');
      }
    }

    public _getUsersDeviceTokenForProject = async (userIds : string [] , projectId : string , condition : (project: IProject) => boolean ) => {
      try {
        const users = await _DB.userModel.find({
          userId: { $in: userIds } ,
        });
        // get all users device token
        let usersDeviceTokens : string [] = [];
        users.forEach((user : IUser) => {
           const projects = user.projects.forEach((project : any) => {
              if(project.projectId === projectId && project.notify_project_update === true && project.notify_project_push === true && condition(project) === true) {
                  usersDeviceTokens = [...usersDeviceTokens, ...user.userDeviceToken];
              }
            });
        });
        return usersDeviceTokens;
      } catch (error) {
        throw new Error('Error getting all user device token');
      }
    }

    public _emailPermissionCheckforProject = async (userIds : string [] , projectId : string , condition : (project: IProject) => boolean ) => {
      try {
        const users = await _DB.userModel.find({
          userId: { $in: userIds } ,
        });

        const usersEmails : string [] = [];
        users?.forEach((user : IUser) => {
            const projects = user.projects.forEach((project : any) => {
              if(project.projectId === projectId && project.notify_project_update === true && project.notify_project_email === true && condition(project) === true) {
                  if(user.email) {
                    usersEmails.push(user.email);
                  }
              }
            });
        });

        return usersEmails;

      } catch (error) {
        throw new Error('Error getting all user email');
      }
    }

    public _emailPermissionCheckforLeave = async (userIds : string [] ,where : string) => {
      try {
        const users = await _DB.userModel.find({
          userId: { $in: userIds } ,
          $where: where
        });

        const usersEmails : string [] = [];

        users?.forEach((user : IUser) => {
            if(user.email) {
              usersEmails.push(user.email);
            }
        });
        return usersEmails;
        
      } catch (error) {
        throw new Error('Error getting all user email');
      }
    }

    public _emailPermissionLead = async (userIds : string []) => {
      try {
        const users = await _DB.userModel.find({
          userId: { $in: userIds }
        });
        const usersEmails : string [] = [];

        users?.forEach((user : IUser) => {
            if(user.email) {
              usersEmails.push(user.email);
            }
        });
        return usersEmails;
        
      } catch (error) {
        throw new Error('Error getting all user email');
      }
    }

    public _createUser = async (user : IUser) => {
      try{
        const newUser = await _DB.userModel.create(user);
        return newUser;
      } catch (error) {
        throw new Error('Error creating user');
      }
    } 

    public _updateUser = async (userId : string , user : IUser) => {
    try {
        const updateUser = await _DB.userModel.updateOne({ userId: userId }, user);
        return updateUser;
        } catch (error) {
        throw new Error('Error updating user');
    }
   }

   public _getUserToken = async (userId : string) => {
    try {
      const user = await _DB.userModel.findOne({ userId: userId });
      return user?.userDeviceToken;
    }catch(err) {
      throw new Error('Error getting user token');
    }
  }

  public _updateUserPreference = async (userId : string, preference : IUser) => {
    try {
      const updateUser = await _DB.userModel.findOneAndUpdate(
        { userId: userId },
        preference,
        { new: true }
      );
      return updateUser;
    }catch(err) {
      throw new Error('Error updating user preference');
    }
  }

  public _getUserPreference = async (userId : string) => {
    try {
      const user = await _DB.userModel.findOne({ userId: userId });
      return user;
    }catch(err) {
      throw new Error('Error getting user preference');
    }
  }

  public _updateProject = async (userId : number , project_id : number) => {
    try {
        const updateUser = await _DB.userModel.updateOne({ userId: userId },{ $pull: { projects: { projectId: project_id } } });
        return updateUser;
        } catch (error) {
        throw new Error('Error updating user');
    }
   }



   public _updateProjectsFields = async (userId: string, projectUpdates: any) => {
    try {
      const updatedUser = await Promise.all(
        projectUpdates.map(async (projectUpdate: any) => {
          const projectId = projectUpdate.projectId;
          let updateFields = projectUpdate.updateFields;
          const updateObj = {};
  
          // Check if "allaction" is true, then set default values and negelect the projectUpdate.updateFields values for the following fields 
          if (projectUpdate.allaction === 0) {

            // empty the updateFields object 
            updateFields = {};

            updateFields.notify_project_update = true;
            updateFields.notify_project_email = true;
            updateFields.notify_project_push = true;
            updateFields.notify_project_chat = true;
            updateFields.taskPreferences = {
              notify_add_task: true,
              notify_change_task_status: true,
              notify_change_task_state: true,
              notify_due_date_changed: true,
              notify_assignee_changed: true,
              notify_comment_added: true,
            };
          }

          if(projectUpdate.allaction === 1) {

            // empty the updateFields object
            updateFields = {};

            updateFields.notify_project_update = false;
            updateFields.notify_project_email = false;
            updateFields.notify_project_push = false;
            updateFields.notify_project_chat = false;
            updateFields.taskPreferences = {
              notify_add_task: false,
              notify_change_task_status: false,
              notify_change_task_state: false,
              notify_due_date_changed: false,
              notify_assignee_changed: false,
              notify_comment_added: false,
            };
          }

          for (const field in updateFields) {
            updateObj[`projects.$[project].${field}`] = updateFields[field];
          }

          const updateUser = await _DB.userModel.updateMany(
            { 'projects.projectId': projectId },
            { $set: updateObj },
            { arrayFilters: [{ 'project.projectId': projectId }] }
          );
        })
      );
  
      return updatedUser;
    } catch (error) {
      throw new Error('Error updating user');
    }
  };
  
  
   // email template

  public _createTemplate = async (Template : any) => { 
    try {
      const newEmailTemplate = await _DB.Template.create(Template);
      return newEmailTemplate;
    } catch (error) {
      throw new Error('Error creating email template');
    }
  }

  public _getTemplateByName = async (templateName : any) => {
    try {
      const emailTemplate = await _DB.Template.findOne({ name: templateName });
      return emailTemplate;
    } catch (error) {
      throw new Error('Error getting email template');
    }
  }

   public _getTemplate = async ({page , limit}) => {
    try {
      const emailTemplate = await _DB.Template.find().skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 });
      return emailTemplate;
    } catch (error) {
      throw new Error('Error getting email template');
    }
  } 

  public _getTemplateById = async (templateId : string) => {
    try {
      const emailTemplate = await _DB.Template.findOne({ _id: templateId });
      return emailTemplate;
    } catch (error) {
      throw new Error('Error getting email template');
    }
  }

  public _updateTemplate = async (templateId : string , Template : any) => {
    try {
      const updateEmailTemplate = await _DB.Template.updateOne({ _id: templateId }, Template);
      return updateEmailTemplate;
    } catch (error) {
      throw new Error('Error updating email template');
    }
  }

  public _deleteTemplate = async (templateId : string) => {
    try {
      const deleteEmailTemplate = await _DB.Template.deleteOne({ _id: templateId });
      return deleteEmailTemplate;
    } catch (error) {
      throw new Error('Error deleting email template');
    }
  }


  public _insertNotificationLogTasks = async (userIds : string [] , notificationObjectTasks : any) => {
    try {

      const maxCount = 100;

      for (const userId of userIds) {

        const isUserExist = await _DB.NotificationLog.findOne({ userId  });

        if(isUserExist){

          const availabilitySlot = maxCount - isUserExist?.notificationObjectSchemaTask.length;

          if (availabilitySlot > 0) {
            const updateNotificationLog = await _DB.NotificationLog.updateOne(
              { userId },
              { $push: { notificationObjectSchemaTask: notificationObjectTasks } }
            );
          } else {
            // get the last log
            const updateNotificationLogremove = await _DB.NotificationLog.updateOne(
              { userId },
              { $pop: { notificationObjectSchemaTask: -1 } }, // Remove the oldest log
            )
            const updateNotificationLogadd = await _DB.NotificationLog.updateOne(
              { userId },
              { $push: { notificationObjectSchemaTask: notificationObjectTasks } },
            )
          }
        }
      }
    }
    catch (error) {
      throw new Error('Error inserting notification log');
    }
  }


  public _insertNotificationLogLeaves = async (userIds : string [] , notificationObjectLeaves : any) => {
    try {

      const maxCount = 100;

      for (const userId of userIds) {

        const isUserExist = await _DB.NotificationLog.findOne({ userId  });

        if(isUserExist){

          const availabilitySlot = maxCount - isUserExist?.notificationObjectSchemaLeave.length;

          if (availabilitySlot > 0) {
            const updateNotificationLog = await _DB.NotificationLog.updateOne(
              { userId },
              { $push: { notificationObjectSchemaLeave: notificationObjectLeaves } }
            );
          }
          else {
            // get the last log
            const updateNotificationLogremove = await _DB.NotificationLog.updateOne(
              { userId },
              { $pop: { notificationObjectSchemaLeave: -1 } }, // Remove the oldest log
            )
            const updateNotificationLogadd = await _DB.NotificationLog.updateOne(
              { userId },
              { $push: { notificationObjectSchemaLeave: notificationObjectLeaves } },
            )
          }
        }
      }

    }
    catch (error) {
      throw new Error('Error inserting notification log');
    }
  
  }

  public _getNotificationLog = async (userId : string , Leavepage : number , Leavelimit : number , Taskpage : number , Tasklimit : number) => {
    try {

      const userNotificationLog = await NotificationLog.findOne({ userId });

      if (!userNotificationLog) {
          return []; // Return an empty array if user notification log doesn't exist
      }

      const notificationTasksCount = userNotificationLog?.notificationObjectSchemaTask.length;
      const notificationLeavesCount = userNotificationLog?.notificationObjectSchemaLeave.length;
      let notifcationTasks = [];
      let notifcationLeaves = [];

      if(Leavepage && Leavelimit){
        // Retrieve notifications with sorting by createdAt in descending order
        const LeavePageNotification = await NotificationLog.findOne(
          { userId }
        );

        notifcationLeaves = LeavePageNotification?.notificationObjectSchemaLeave;

        // sort notification by createdAt in descending order
        notifcationLeaves = notifcationLeaves?.sort((a, b) => {
          return b.createdAt - a.createdAt;
        });

        notifcationLeaves = notifcationLeaves?.slice((Leavepage - 1) * Leavelimit, Leavelimit * Leavepage);

      }

      if(Taskpage && Tasklimit){

        // Retrieve notifications with sorting by createdAt in descending order
        const TaskPageNotification = await NotificationLog.findOne({ userId })

        notifcationTasks = TaskPageNotification?.notificationObjectSchemaTask; 

        // sort notification by createdAt in descending order
        notifcationTasks = notifcationTasks?.sort((a, b) => {
          return b.createdAt - a.createdAt;
        });
          
        notifcationTasks = notifcationTasks?.slice((Taskpage - 1) * Tasklimit, Tasklimit * Taskpage);

      }

      return { notifcationTasks , notifcationLeaves , notificationTasksCount , notificationLeavesCount };
      
    } catch (error) {
      throw new Error('Error getting notification log');
    }
  }

  public _getInstanceVariable = async () => {
    try {
      const instanceVariable = await _DB.InstanceVariable.find();
      return instanceVariable;
    } catch (error) {
      throw new Error('Error getting instance variable');
    }
  }

  public _createInstanceVariable = async (instanceVariable : string) => {
    try {
      const newInstanceVariable = await _DB.InstanceVariable.create({
        name : instanceVariable
      });
      
      return newInstanceVariable;
    } catch (error) {
      throw new Error('Error creating instance variable');
    }
  }

  public _getUserisExistinNotificationLog = async (userId : string) => {
    try {

      const isUserExist = await _DB.NotificationLog.findOne({ userId });

      return isUserExist;
    
    }
    catch (error) {
      throw new Error('Error getting user in notification log');
    }

  }

  public _createNotificationLogUser = async ( userId : string) => {
    try{

      const newNotificationLog = await _DB.NotificationLog.create({
        userId,
        notificationObjectSchemaLeave : [],
        notificationObjectSchemaTask : []
      });

      return newNotificationLog;


    }catch (error) {
      throw new Error('Error creating notification log user');
    }
  } 

  // get template by action id
  public _getTemplateByActionId = async (actionId : string) => {
    try {
      const actionEmailTemplateBind = await _DB.ActionEmailTemplateBind.findOne({ actionId }).populate('emailTemplateId').populate('actionId');
      return actionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error getting template by action id');
    }
  }

  // get template by action Name 
  public _getTemplateByActionName = async (actionName : string) => {
    try {
      const action = await _DB.Action.findOne({ name : actionName });
      const actionEmailTemplateBind = await _DB.ActionEmailTemplateBind.findOne({ actionId : action?._id }).populate('emailTemplateId').populate('actionId') as any;
      return actionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error getting template by action name');
    }
  }

  public _createActionforworkFlow = async (action : string ) => {
    try {
      const newAction = await _DB.Action.create({
        name : action
      });
      return newAction;
    } catch (error) {
      throw new Error('Error creating action for workflow');
    }
  }

  public _getActionforworkFlow = async () => {
    try {
      const action = await _DB.Action.find();
      return action;
    } catch (error) {
      throw new Error('Error getting action for workflow');
    }
  }

  public _getActionforworkFlowById = async (actionId : string) => {
    try{
      const action = await _DB.Action.findOne({ _id : actionId });
      return action;
    }
    catch (error) {
      throw new Error('Error getting action for workflow by id');
    }
  }

  public _getEmailTemplateByTemplateId = async (templateId : string) => {
    try {
      const template = await _DB.Template.findOne({ _id : templateId });
      return template;
    } catch (error) {
      throw new Error('Error getting email template by template id');
    }
  }

  public _updateActionforworkFlow = async (actionId : string , action : string) => {
    try {
      const updateAction = await _DB.Action.updateOne({ _id : actionId },{ name : action });
      return updateAction;
    } catch (error) {
      throw new Error('Error updating action for workflow');
    }
  }

  public _deleteActionforworkFlow = async (actionId : string) => {
    try {
      const deleteAction = await _DB.Action.deleteOne({ _id : actionId });
      return deleteAction;
    } catch (error) {
      throw new Error('Error deleting action for workflow');
    }
  }

  // post email template id and action id from actionEmailTemplateBind table 

  public _createActionEmailTemplateBind = async (emailTemplateId : string , actionId : string) => {
    try {
      const newActionEmailTemplateBind = await _DB.ActionEmailTemplateBind.create({
        emailTemplateId,
        actionId
      });
      return newActionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error creating action email template bind');
    }
  }

  public _getActionEmailTemplateBind = async () => {
    try {
      const actionEmailTemplateBind = await _DB.ActionEmailTemplateBind.find().populate('emailTemplateId').populate('actionId');
      return actionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error getting action email template bind');
    }
  }

  public _getActionEmailTemplateBindByActionId = async (actionId : string) => {
    try {
      const actionEmailTemplateBind = await _DB.ActionEmailTemplateBind.find({ actionId }).populate('emailTemplateId').populate('actionId');
      return actionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error getting action email template bind by action id');
    }
  }

  public _getActionEmailTemplateBindByEmailTemplateId = async (emailTemplateId : string) => {
    try {
      const actionEmailTemplateBind = await _DB.ActionEmailTemplateBind.find({ emailTemplateId }).populate('emailTemplateId').populate('actionId');
      return actionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error getting action email template bind by email template id');
    }
  }

  public _getActionEmailTemplateBindById = async (actionEmailTemplateBindId : string) => {
    try {
      const actionEmailTemplateBind = await _DB.ActionEmailTemplateBind.findOne({ _id : actionEmailTemplateBindId }).populate('emailTemplateId').populate('actionId');
      return actionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error getting action email template bind by id');
    }
  }

  public _updateActionEmailTemplateBind = async (actionEmailTemplateBindId : string , emailTemplateId : string , actionId : string) => {
    try {

      // check whether action email template bind is exist or not
      const isActionEmailTemplateBindExist = await _DB.ActionEmailTemplateBind.findOne({ _id : actionEmailTemplateBindId });
      if(!isActionEmailTemplateBindExist) {
        throw new Error('Action email template bind not exist');
      }

      const updateActionEmailTemplateBind = await _DB.ActionEmailTemplateBind.updateOne({ _id : actionEmailTemplateBindId },{ emailTemplateId , actionId });
      return updateActionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error updating action email template bind');
    }
  }

  public _deleteActionEmailTemplateBind = async (actionEmailTemplateBindId : string) => {
    try {
      const deleteActionEmailTemplateBind = await _DB.ActionEmailTemplateBind.deleteOne({ _id : actionEmailTemplateBindId });
      return deleteActionEmailTemplateBind;
    } catch (error) {
      throw new Error('Error deleting action email template bind');
    }
  }

}

export default PreferenceService;

