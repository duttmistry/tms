import { EventEmitter } from 'events';
import PreferenceService from '../../services/preference.service';

const eventEmitterProject = new EventEmitter();
const preferenceService = new PreferenceService();

// create event to create project in user preference
eventEmitterProject.on('createProject', async ({userIds , projectId}) => {
    try {
        // if user id is array then loop through user id array and create project in user preference
        if(userIds.length > 0) {
            userIds.forEach(async (userId : any) => {
                const user = await preferenceService._getUserPreference(userId);
                if(user?.projects) {
                    // if projects array having project id then return message project already exist in user preference
                    const projectExist = user.projects.find((project : any) => project.projectId === projectId);
                    if(projectExist) {
                        return 'Project already exist in user preference';
                    }
                    // if projects array not having project id then push project id in projects array
                    else {
                        const newProject = {
                            projectId : projectId,
                            notify_project_email : true,
                            notify_project_push : true,
                            notify_project_chat : true,
                            notify_project_update: true,
                            taskPreferences: {
                                notify_add_task: true,
                                notify_change_task_status: true,
                                notify_change_task_state: true,
                                notify_due_date_changed: true,
                                notify_assignee_changed: true,
                                notify_comment_added: true
                            }
                        }
                        user.projects.push(newProject);
                        const updateUser = await preferenceService._updateUserPreference(userId, user);
                        return updateUser;
                    }
                }
            });

        }

    } catch (error) {
        throw new Error('Error creating project');
    }
});

// create event for update project in user preference 
// get all user preference whose project id is same as project id and remove that project id from projects array 

eventEmitterProject.on('updateProject', async ({userIds , projectId , updatedUserIds}) => {
    try {
        if(userIds.length > 0) {
            userIds.forEach(async (userId : any) => {
                const user = await preferenceService._getUserPreference(userId);
                console.log("user in remove preferce" , user.userId);
                if(user?.projects) {
                    // if projects array having project id then remove project id from projects array
                    const projectExist = user.projects.find((project : any) => project.projectId === projectId);
                    if(projectExist) {
                        const index = user.projects.findIndex((project : any) => project.projectId === projectId);
                        user.projects.splice(index, 1);
                        const updateUser = await preferenceService._updateUserPreference(userId, user);
                        return updateUser;
                    }
                    // if projects array not having project id then return message project not exist in user preference
                    else {
                        return 'Project not exist in user preference';
                    }
                }
            });
        }

        // if updated user id is array then loop through updated user id array and update project in user preference
        if(updatedUserIds.length > 0) {
            updatedUserIds.forEach(async (userId : any) => {
                const user = await preferenceService._getUserPreference(userId);
                if(user?.projects) {
                    // if projects array having project id then return message project already exist in user preference
                    const projectExist = user.projects.find((project : any) => project.projectId === projectId);
                    if(projectExist) {
                        return 'Project already exist in user preference';
                    }
                    // if projects array not having project id then push project id in projects array
                    else {
                        const newProject = {
                            projectId : projectId,
                            notify_project_email : true,
                            notify_project_push : true,
                            notify_project_chat : true,
                            notify_project_update: true,
                            taskPreferences: {
                                notify_add_task: true,
                                notify_change_task_status: true,
                                notify_change_task_state: true,
                                notify_due_date_changed: true,
                                notify_assignee_changed: true,
                                notify_comment_added: true
                            }
                        }
                        user.projects.push(newProject);
                        const updateUser = await preferenceService._updateUserPreference(userId, user);
                        return updateUser;
                    }
                }
            });

        }
        
    }  
    catch (error) {
        throw new Error('Error updating project');
    }
});

// remove many projects from using userId 

eventEmitterProject.on('updateUser', async ({userId , projectIds}) => {
    console.log('projectIds: ', projectIds);
    console.log('userId: ', userId);
    try {

        if(userId && projectIds?.length > 0 ) {
            // remove all project Ids from user 
            const user : any = await preferenceService._getUserPreference(userId);
            if(user && user?.projects?.length > 0){
              const u = user.projects.filter(project => !projectIds.includes(project.projectId));       
              user.projects = u;
              const updateUser = await preferenceService._updateUserPreference(userId, user);
              return updateUser;
            }
        }
    }
    catch(err) {
        console.log(err);
        throw err;
    }
} )


export default eventEmitterProject;

