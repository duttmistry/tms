import { NextFunction, Response } from 'express';
import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import * as Preference from '@tms-workspace/preference';
import UserService from '../../user/services/user.service';
import _DB from '../../../database/models';
import { Op, QueryTypes, Sequelize, WhereOptions, where } from 'sequelize';

class PrefereceController{

    public UserService = new UserService();

  
    public getPreference = async (req: any, res: Response, next: NextFunction) => {
        try {

            const rawQuery = `
            SELECT id , name FROM tm_projects tp WHERE deleted_at is NULL;
            `

            const data: any = await _DB.sequelize.query(rawQuery, {
                type: QueryTypes.SELECT
            });

            const user = req.user;
            const preference = await Preference._GetUserPreference(user.id);

            const findProjectName = (projectId) => {
                for (let i = 0; i < data.length; i++) {
                    if(projectId === (data[i].id).toString()){
                        return data[i].name
                    }
                }
            }

            if(!preference){
                res.status(200).json(APIResponseFormat._ResNotExists('User preference not found'));
            }
            const preference_obj = {

                Leave : {
                    is_notify: preference.notify_leave,
                    actions : [
                        {
                            action_name : "Added By Team", 
                            key : "notify_add_leave_by_team" ,
                            content : "Receive notifications when leave has been requested by team member" ,
                            is_notify: preference.notify_add_leave_by_team.notify_add_leave_by_team,
                            is_notify_email: preference.notify_add_leave_by_team.notify_leave_email,
                            is_notify_push: preference.notify_add_leave_by_team.notify_leave_push,
                            is_notify_chat: preference.notify_add_leave_by_team.notify_leave_chat,
                        },
                        {
                            action_name : "Dates Changed",
                            key : "notify_leave_date_changed" ,
                            content : "Receive notifications when leave date has been changed" ,
                            is_notify: preference.notify_leave_date_changed.notify_leave_date_changed,
                            is_notify_email: preference.notify_leave_date_changed.notify_leave_date_changed_email,
                            is_notify_push: preference.notify_leave_date_changed.notify_leave_date_changed_push,
                            is_notify_chat: preference.notify_leave_date_changed.notify_leave_date_changed_chat,
                        },
                        {
                            action_name : "Status Changed",
                            key : "notify_leave_status_changed" ,
                            content : "Receive notifications when leave status has been changed" ,
                            is_notify: preference.notify_leave_status_changed.notify_leave_status_changed,
                            is_notify_email: preference.notify_leave_status_changed.notify_leave_status_changed_email,
                            is_notify_push: preference.notify_leave_status_changed.notify_leave_status_changed_push,
                            is_notify_chat: preference.notify_leave_status_changed.notify_leave_status_changed_chat,
                        }
                    ]

                } ,
    
                Projects: preference.projects.map((project: any) => ({
                    project_id: project.projectId,
                    project_name: findProjectName(project.projectId),
                    is_notify: project.notify_project_update,
                    is_notify_chat: project.notify_project_chat,
                    is_notify_email: project.notify_project_email,
                    is_notify_push: project.notify_project_push,
                    actions: [
                      { action_name: "Task Created" , key : "notify_add_task" , content: "Receive notifications when new task has been created" , is_notify: project.taskPreferences.notify_add_task },
                      { action_name: "Status changed", key : "notify_change_task_status" , content : "Receive notifications when task status has been changed." ,  is_notify: project.taskPreferences.notify_change_task_status },
                    //   { action_name: "State changed", key : "notify_change_task_state" , content : "Receive notifications when task state has been changed" , is_notify: project.taskPreferences.notify_change_task_state },
                      { action_name: "Due date changed",key : "notify_due_date_changed" ,content : "Receive notifications when due date has been changed" ,  is_notify: project.taskPreferences.notify_due_date_changed },
                      { action_name: "Assignee changed", key : "notify_assignee_changed" , content : " Receive notifications when assignee has been changed" ,  is_notify: project.taskPreferences.notify_assignee_changed },
                      { action_name: "Comment added" , key: "notify_comment_added" , content: "Receive notifications when any comment has been added to the task", is_notify : project.taskPreferences.notify_comment_added }
                    ]
                  })).sort((a , b) => {
                    return a.project_name - b.project_name
                  }),
            }

            res.status(200).json(APIResponseFormat._ResDataFound(preference_obj));
        } catch (error) {
            next(error);
        }
    }

    public createPreference = async (req: any, res: Response, next: NextFunction) => {
        try{
            const user = req.user;
            const { projectIdArray , userDeviceToken } = req.body;

            let userDetails = await this.UserService._getUserEmail(user.id);
            userDetails = JSON.parse(JSON.stringify(userDetails));

            let email = null;
            let employee_image = null;

            userDetails?.employee_image ? employee_image = userDetails?.employee_image : null;
            email = userDetails?.cybercom_email ? userDetails?.cybercom_email : null;

            let preference = await Preference._GetUserPreference(user.id);

            if(!preference){
                const userDeviceTokenArray = [];
                // if userDevice Token is null then not push the userDeviceToken in array
                if (userDeviceToken !== null && userDeviceToken !== undefined && userDeviceToken !== ``) {
                    console.log('userDeviceToken', userDeviceToken);
                    userDeviceTokenArray.push(userDeviceToken);
                }
                const createdUser = await Preference._createUser({ userId: user.id, userDeviceToken: userDeviceTokenArray , email : email , employee_image : employee_image  });
                if(!createdUser){
                    res.status(200).json(APIResponseFormat._ResNotExists('User not created'));
                }

                preference = await Preference._GetUserPreference(user.id);
            }
            // remove all project ids from preference  and add new project ids in preference 
            preference.projects = [];

            const newProjects = projectIdArray?.map((projectId: any) => ({
                projectId: projectId,
                notify_project_update: true,
                notify_project_email: true,
                notify_project_push: true,
                notify_project_chat: true,
                taskPreferences: {
                    notify_add_task: true,
                    notify_change_task_status: true,
                    notify_change_task_state: true,
                    notify_due_date_changed: true,
                    notify_assignee_changed: true,
                    notify_comment_added: true
                }
            }));
            
            preference.projects = newProjects;

            const updatedPreference = await Preference._updateUserPreference(user.id, preference);

            if(updatedPreference){
                res.status(200).json(APIResponseFormat._ResDataFound(updatedPreference));
            }
            else {
                res.status(200).json(APIResponseFormat._ResDataNotUpdated('User preference not updated'));
            }

        } catch (error) {
            next(error);
        }
    }

    public updateUsersPreference = async (req: any, res: Response, next: NextFunction) => {
        try{
            const user = req.user;
            const { leave } = req.body;

            const getUserPreference = await Preference._GetUserPreference(user.id);

            if(!getUserPreference){
                res.status(200).json(APIResponseFormat._ResNotExists('User preference not found'));
            }

            if( leave ){
                getUserPreference.notify_leave = leave?.notify_leave;
                getUserPreference.notify_add_leave_by_team.notify_add_leave_by_team = leave?.notify_add_leave_by_team?.notify_add_leave_by_team ? leave?.notify_add_leave_by_team?.notify_add_leave_by_team : false ;
                getUserPreference.notify_add_leave_by_team.notify_leave_email = leave?.notify_add_leave_by_team?.notify_leave_email ? leave?.notify_add_leave_by_team?.notify_leave_email : false ;
                getUserPreference.notify_add_leave_by_team.notify_leave_push = leave?.notify_add_leave_by_team?.notify_leave_push ? leave?.notify_add_leave_by_team?.notify_leave_push : false ;
                getUserPreference.notify_add_leave_by_team.notify_leave_chat = leave?.notify_add_leave_by_team?.notify_leave_chat ? leave?.notify_add_leave_by_team?.notify_leave_chat : false ;

                getUserPreference.notify_leave_date_changed.notify_leave_date_changed = leave?.notify_leave_date_changed?.notify_leave_date_changed? leave?.notify_leave_date_changed?.notify_leave_date_changed : false ;
                getUserPreference.notify_leave_date_changed.notify_leave_date_changed_email = leave?.notify_leave_date_changed?.notify_leave_date_changed_email? leave?.notify_leave_date_changed?.notify_leave_date_changed_email : false ;
                getUserPreference.notify_leave_date_changed.notify_leave_date_changed_push = leave?.notify_leave_date_changed?.notify_leave_date_changed_push? leave?.notify_leave_date_changed?.notify_leave_date_changed_push : false ;
                getUserPreference.notify_leave_date_changed.notify_leave_date_changed_chat = leave?.notify_leave_date_changed?.notify_leave_date_changed_chat? leave?.notify_leave_date_changed?.notify_leave_date_changed_chat : false ;

                getUserPreference.notify_leave_status_changed.notify_leave_status_changed = leave?.notify_leave_status_changed?.notify_leave_status_changed? leave?.notify_leave_status_changed?.notify_leave_status_changed : false ;
                getUserPreference.notify_leave_status_changed.notify_leave_status_changed_email = leave?.notify_leave_status_changed?.notify_leave_status_changed_email? leave?.notify_leave_status_changed?.notify_leave_status_changed_email : false ;
                getUserPreference.notify_leave_status_changed.notify_leave_status_changed_push = leave?.notify_leave_status_changed?.notify_leave_status_changed_push? leave?.notify_leave_status_changed?.notify_leave_status_changed_push : false ;
                getUserPreference.notify_leave_status_changed.notify_leave_status_changed_chat = leave?.notify_leave_status_changed?.notify_leave_status_changed_chat? leave?.notify_leave_status_changed?.notify_leave_status_changed_chat : false ;
            }

            const preference = await Preference._updateUserPreference(user.id, getUserPreference);
            res.status(200).json(APIResponseFormat._ResDataUpdated('Project preference'));
           
        } catch (error) {
            next(error);
        }
    }

    public updateProjectsFields = async (req: any, res: Response, next: NextFunction) => {
        try{
            const user = req.user;
            const  { projectUpdates } = req.body;

            if(!projectUpdates){
                return res.status(404).json(APIResponseFormat._ResDataNotFound('Project updates'));
            }

            const getUserPreference = await Preference._GetUserPreference(user.id);

            if(!getUserPreference){
                return res.status(404).json(APIResponseFormat._ResDataNotFound('User preference'));
            }

            // check in project updates if any project id is null

            const projectIds = projectUpdates.map((project: any) => project.projectId);
            
            // check that requested project ids are exist in user preference projects

            const getUserPreferenceProjectIds = getUserPreference.projects.map((project: any) => project.projectId);

            const notExistProjectIds = projectIds.filter((projectId: any) => !getUserPreferenceProjectIds.includes(projectId) && projectId !== null);

            if(notExistProjectIds?.length > 0){
                return res.status(404).json(APIResponseFormat._ResDataNotFound(`Project : ${notExistProjectIds}`));
            }

            // verify that all project ids are exist in user preference projects and keep only that projects in project updates

            const existingProjectIds = projectIds.filter((projectId: any) => getUserPreferenceProjectIds.includes(projectId) && projectId !== null);

            const projects = projectUpdates.filter((project: any) => existingProjectIds.includes(project.projectId));

            // update project fields
            const updatedPreference = await Preference._updateProjectsFields(user.id, projects);

            res.status(200).json(APIResponseFormat._ResDataUpdated('Project preference'));

        } catch (error) {
            next(error);
        }
    }

    public deleteUserProject = async (req: any, res: Response, next: NextFunction) => {
        try{
            const user = req.user;
            const projectId = req.headers.id;

            const getUserPreference = await Preference._GetUserPreference(user.id);

            if(!getUserPreference){
                return res.status(404).json(APIResponseFormat._ResDataNotFound('User preference'));
            }

            if(!projectId){
                return res.status(404).json(APIResponseFormat._ResDataNotFound('Project id'));
            }

            const find = getUserPreference?.projects.find((project: any) => project.projectId === projectId);

            if(!find){
                return res.status(404).json(APIResponseFormat._ResDataNotFound(`Project : ${projectId}`));
            }

            if(getUserPreference?.projects && getUserPreference.projects?.length > 0){
                const projects = getUserPreference.projects.filter((project: any) => project.projectId !== projectId);
                getUserPreference.projects = projects;
            }

            const preference = await Preference._updateUserPreference(user.id, getUserPreference);

            if(!preference){
                return res.status(404).json(APIResponseFormat._ResDataNotDeleted(`Project : ${projectId}`));
            }

            res.status(200).json(APIResponseFormat._ResDataDeleted(`Project : ${projectId}` ));

        } catch (error) {
            next(error);
        }
    }

    public createTemplate = async (req: any, res: Response, next: NextFunction) => {
        try{
            const user = req.user;
            const { name , subject , content , notificationMessage , chatMessage ,isActive } = req.body;

            if(!name || !subject || !content || !notificationMessage || !chatMessage){
                return res.status(404).json(APIResponseFormat._ResMissingRequiredField('Name , Subject , Content , Notification Message , Chat Message'));
            }

            const userId = user.id;

            const emailTemplateExist = await Preference._getTemplateByName(name);

            if(emailTemplateExist){
                return res.status(404).json(APIResponseFormat._ResAlreadyExistTags('Template' , name));
            }

            const emailTemplate = await Preference._createTemplate({
                name , subject , content , notificationMessage , chatMessage , createdBy : userId , isActive : isActive ? isActive : true
             }); 
            res.status(200).json(APIResponseFormat._ResDataCreated('Template' , emailTemplate));
                        
        }  catch (error) {
            next(error);
        }
    }

    public getTemplates = async (req: any, res: Response, next: NextFunction) => {
        try{
            let { page , limit } = req.query;
            page = page ? page : 1;
            limit = limit ? limit : 20;
            const emailTemplate = await Preference._getEmailTemplate({page , limit});
            res.status(200).json(APIResponseFormat._ResDataFound(emailTemplate));
        }
        catch (error) {
            next(error);
        }
    }

    // update email template by _id
    public updateTemplate = async (req: any, res: Response, next: NextFunction) => {
        try{
            const user = req.user;
            const { name , subject , content , isActive } = req.body;
            const TemplateId = req.headers.id;

            if(!TemplateId){
                return res.status(404).json(APIResponseFormat._ResMissingRequiredField('Email Template id'));
            }

            if(!name || !subject || !content){
                return res.status(404).json(APIResponseFormat._ResMissingRequiredField('Name , Subject , Content'));
            }

            const emailTemplate = await Preference._getTemplateById(TemplateId);
            
            if(!emailTemplate._id){
                return res.status(404).json(APIResponseFormat._ResDataNotFound(`Email Template `));
            }

            const updateEmailTemplate = await Preference._updateTemplate(TemplateId , {name , subject , content , updatedBy : user.id , isActive : isActive ? isActive : true});

            if(!updateEmailTemplate){
                return res.status(404).json(APIResponseFormat._ResDataNotUpdated(`Email Template `));
            }

            res.status(200).json(APIResponseFormat._ResDataUpdated('Email Template' , updateEmailTemplate));
        }
        catch (error) {
            next(error);
        }
    }

    // delete email template by _id
    public deleteTemplate = async (req: any, res: Response, next: NextFunction) => {
        try{
            const TemplateId = req.headers.id;

            if(!TemplateId){
                return res.status(404).json(APIResponseFormat._ResMissingRequiredField('Email Template id'));
            }

            const Template = await Preference._getTemplateById(TemplateId);

            if(!Template._id){
                return res.status(404).json(APIResponseFormat._ResDataNotFound(`Email Template : ${TemplateId}`));
            }

            const getActionByTemplateId = await Preference._getActionEmailTemplateBindByEmailTemplateId(TemplateId);

            if(getActionByTemplateId.length > 0){
                return res.status(404).json(APIResponseFormat._ResTemplatebindwithAction(`Email Template`));
            }

            const deleteEmailTemplate = await Preference._deleteEmailTemplate(TemplateId);

            if(!deleteEmailTemplate){
                return res.status(404).json(APIResponseFormat._ResDataNotDeleted(`Email Template `));
            }

            res.status(200).json(APIResponseFormat._ResDataDeleted(`Email Template ` ));
        }
        catch (error) {
            next(error);
        }
    }

    // get email template by _id
    public getTemplateById = async (req: any, res: Response, next: NextFunction) => {
        try{
            const emailTemplateId = req.headers.id;


            if(!emailTemplateId){
                return res.status(404).json(APIResponseFormat._ResMissingRequiredField('Email Template id'));
            }

            const emailTemplate = await Preference._getTemplateById(emailTemplateId);

            if(!emailTemplate._id){
                return res.status(404).json(APIResponseFormat._ResDataNotFound(`Email Template : ${emailTemplateId}`));
            }

            res.status(200).json(APIResponseFormat._ResDataFound(emailTemplate));
        }
        catch (error) {
            next(error);
        }
    }

    public notificationLog = async (req: any, res: Response, next: NextFunction) => { 
        try{
            const user = req.user;
            let { Leavepage , Leavelimit , Taskpage , Tasklimit } = req.query;

            Leavepage = Leavepage ? parseInt(Leavepage) : 0;
            Leavelimit = Leavelimit ? parseInt(Leavelimit) : 0;
            Taskpage = Taskpage ? parseInt(Taskpage) : 0;
            Tasklimit = Tasklimit ? parseInt(Tasklimit) : 0;

            const notificationLog = await Preference._getNotificationLogs(user.id , Leavepage , Leavelimit , Taskpage , Tasklimit);
            res.status(200).json(APIResponseFormat._ResDataFound(notificationLog));
        }
        catch (error) {
            next(error);
        }
    }

    public getInstanceVariable = async (req: any, res: Response, next: NextFunction) => {
        try{
            const instanceVariable = await Preference._getInstanceVariable();

            res.status(200).json(APIResponseFormat._ResDataFound(instanceVariable));
        }
        catch (error) {
            next(error);
        }
    }

    public createInstanceVariable = async (req: any, res: Response, next: NextFunction) => {
        try{
            const { name  } = req.body;

            const instanceVariable = await Preference._createInstanceVariable(name);
            

            res.status(200).json(APIResponseFormat._ResDataCreated('Instance Variable' , instanceVariable));

        } catch (error) {
            next(error);
        }
    }


    public getNotificationPreference = async (req: any, res: Response, next: NextFunction) => {
        try{
            const user = req.user;


            // Action: Leave added by team
            // Key:  notify_add_leave_by_team
            // Content: Receive notifications when any new leave request by the team members
            // A notification to “leave responsible persons” and “reporting persons of the user” who added a leave
            // Subject: New leave request from [User] for 26/06/2023(F) to 27/06/2023(F)


            // const data = {
            //     leave_request_user_name : "Rahul",
            //     leave_responsible_person : ["126"],
            //     leave_reporting_person : ["110"],
            //     leave_date_from : "26/06/2023",
            //     leave_date_to : "27/06/2023",
            //     action_by : req.user.first_name + " " + req.user.last_name
            // }

            // eventEmitterLeave.default.emit('notify_add_leave_by_team' , data);

            // Action: Leave dates changed
            // Key: notify_leave_date_changed
            // Content: Receive notifications when any modification made on leave dates either by HR or any user. 

            // A notification to “user”, “leave responsible persons” and “reporting persons of the user” who added a leave
            // Subject: Leave modified by [action user]- New leave request from [User] for 26/06/2023(F) to 27/06/2023(F) 

            // this event is for notify leave request to reporting person and HR  || this request is change by HR and User Both

            // const data = {
            //     leave_request_user : ["54"],
            //     leave_request_user_name : "Rahul",
            //     leave_responsible_person : ["126"],
            //     leave_reporting_person : ["110"],
            //     leave_date_from : "2021-07-30T18:30:00.000Z",
            //     leave_date_to : "2021-07-30T18:30:00.000Z",
            //     action_by : req.user.first_name + " " + req.user.last_name
            // }

            // eventEmitterLeave.default.emit('notify_leave_date_changed' , data);

            // Action: Leave status changed
            // Key: notify_leave_status_changed
            // Content: Receive notifications when any leave has been approved/rejected or canceled. 
            // Note: Please note that here, notification will be sent only when the final status of leave will be changed. 
            // A notification to, “user who added leave”,  “leave responsible persons” and “reporting persons of the user” who added a leave
            // Subject: Your leave status has been changed to [Leave status]

            // const data = {
            //     leave_request_user : ["54"],
            //     leave_request_user_name : "Rahul",
            //     leave_responsible_person : ["126"],
            //     leave_reporting_person : ["110"],
            //     leave_status : "Approved",
            //     action_by : req.user.first_name + " " + req.user.last_name
            // }

            // eventEmitterLeave.default.emit('notify_leave_status_changed' , data);

            // add Project in Projects 

            // eventEmitterProject.default.emit('createProject' , data);
            
            // const { assigned_to, subscribers, reporting_person, task_title , projectId , action_by , mentionedPerson } = data;


            // const data = {
            //     assigned_to : ["54"],
            //     subscribers : ["126"],
            //     reporting_person : ["110"],
            //     task_title : "Task Title",
            //     projectId : "57",
            //     action_by : req.user.first_name + " " + req.user.last_name,
            //     mentionedPerson : ["110"]
            // }

            // eventEmitterTask.default.emit('notify_comment_added' , data);

            res.status(200).json(APIResponseFormat._ResDataFound('Notification preference'));


        } catch (error) {
            next(error);
        }
    }

}

export default PrefereceController;