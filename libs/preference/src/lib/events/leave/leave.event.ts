import { EventEmitter } from 'events';
import { sendNotificationToMultipleDevice } from '../../core/sendNotification';
import PreferenceService from '../../services/preference.service';
import { sendEmail } from '../../core/sendEmail';
import { Encryption } from '@tms-workspace/encryption';
import sendDirectMessage from '../../core/mattermostapi';
import baseurls from '../../baseurls';
const eventEmitterLeave = new EventEmitter();
const preferenceService = new PreferenceService();

// Leave Module 

// Action: Leave added by team
// Key:  notify_add_leave_by_team
// Content: Receive notifications when any new leave request by the team members
// A notification to “leave responsible persons” and “reporting persons of the user” who added a leave
// Subject: New leave request from [User] for 26/06/2023(F) to 27/06/2023(F)

// const leaves_on_current_year = [
//     { Subject: "Out of station", Status: "Approved", LeaveDates: "04-05-2023 - 05-05-2023 (2.0 days)" },
//     { Subject: "Family Medical Emergency", Status: "Approved", LeaveDates: "16-05-2023 - 16-05-2023 (1.0 days)" },
//     { Subject: "Out of station", Status: "Approved", LeaveDates: "20-06-2023 - 20-06-2023 (1.0 days)" }
// ];

eventEmitterLeave.on('notify_add_leave_by_team' , async (data) => {
    const { leave_request_user , leave_request_user_name , leave_date_from , leave_date_to , action_by , action_by_profile , leave_subject , total_leave_days , leave_type , cl , pl , leave_description , leave_responsible_person_name, leave_reporting_person_name , leave_id } = data;
    let { leave_responsible_person , leave_reporting_person } = data;
    let { leaves_on_current_year } = data;
    const where = "this.notify_add_leave_by_team.notify_leave_push === true";
    const where1 = "this.notify_add_leave_by_team.notify_leave_chat === true";
    const where2 = "this.notify_add_leave_by_team.notify_leave_email === true"
 
    console.log('Leave add by team Data ' , data);

    leave_responsible_person = leave_responsible_person?.map((item) => {
        if(item){
            return item.toString();
        }
    })

    leave_reporting_person = leave_reporting_person?.map((item) => {
        if(item){ 
            return item.toString();
        }
    })

    const leave_responsible_person_device_tokens = await preferenceService._getUsersDeviceToken(leave_responsible_person , where);
    const leave_reporting_person_device_tokens = await preferenceService._getUsersDeviceToken(leave_reporting_person , where);

    const notification1 = `New leave request from ${leave_request_user_name} for ${leave_date_from} to ${leave_date_to} `;
    await sendNotificationToMultipleDevice(leave_responsible_person_device_tokens , notification1 , action_by);
    const notification2 = `New leave request from ${leave_request_user_name} for ${leave_date_from} to ${leave_date_to} `;
    await sendNotificationToMultipleDevice(leave_reporting_person_device_tokens , notification2 , action_by);

    if(leave_reporting_person && leave_reporting_person.length > 0){
        const notificationLog = {
            leave_id : leave_id,
            action_user : action_by,
            notificationTitle: notification2,
            employeeImage : action_by_profile ? action_by_profile : null,
            isRead: false,
            isDeleted: false,
        };

        const notificationLogs = await preferenceService._insertNotificationLogLeaves(leave_reporting_person , notificationLog);

        const emailgetForLeaveRequestUserForChat = await preferenceService._emailPermissionCheckforLeave(leave_reporting_person, where1);

        if(emailgetForLeaveRequestUserForChat && emailgetForLeaveRequestUserForChat.length > 0) {
            const leave = Encryption._doEncrypt(leave_id.toString());;
            const mattermostObject = {
                id: leave_id,
                title: notification1,
                name : "notification for leave reporting user",
                link: `${baseurls.URL}/leave/details/${leave}`,
                notificationTitle: notification1,
                useremails: emailgetForLeaveRequestUserForChat
            };

            const chat = await sendDirectMessage(mattermostObject);
            console.log('chat: ', chat);

        }
        

    }
     
    if(leave_responsible_person && leave_responsible_person.length > 0){
        const notificationLog = {
            leave_id : leave_id,
            action_user : action_by,
            notificationTitle: notification1,
            employeeImage : action_by_profile ? action_by_profile : null,
            isRead: false,
            isDeleted: false,
        };

        const notificationLogs = await preferenceService._insertNotificationLogLeaves(leave_responsible_person , notificationLog);

        const emailgetForLeaveRequestUserForChat = await preferenceService._emailPermissionCheckforLeave(leave_responsible_person, where1);

        if(emailgetForLeaveRequestUserForChat && emailgetForLeaveRequestUserForChat.length > 0) {
            const leave = Encryption._doEncrypt(leave_id.toString());;
            const mattermostObject = {
                id: leave_id,
                title: notification2,
                name : "notification for leave responsible user",
                link: `${baseurls.URL}/leave/details/${leave}`,
                notificationTitle: notification2,
                useremails: emailgetForLeaveRequestUserForChat
            };

            const chat = await sendDirectMessage(mattermostObject);
        }
    }

    
    const emailTemplate = await preferenceService._getTemplateByActionName('A New Leave Request');
    
    leaves_on_current_year = `<table border="1">
    <tr>
        <th>Subject</th>
        <th>Status</th>
        <th>Leave Dates</th>
    </tr>
    ${leaves_on_current_year.map(item => `
        <tr>
            <td>${item.Subject}</td>
            <td>${item.Status}</td>
            <td>${item.LeaveDates}</td>
        </tr>
    `).join('')}
    </table>`;
 
    if(emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content){

        const emailgetForLeaveResponsiblePersonForEmail = await preferenceService._emailPermissionCheckforLeave(leave_responsible_person , where2);

        const message = `${leave_request_user_name } has applied for leave`
        // replace the instance variable with the actual value
        emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/cl/g, cl)
        .replace(/pl/g, pl)
        .replace(/leave_title/g , message)
        .replace(/leave_responsible_person/g, leave_responsible_person_name)
        .replace(/leave_dates/g , `from ${leave_date_from} to ${leave_date_to}`)
        .replace(/leave_subject/g, leave_subject)
        .replace(/total_leave_days/g, total_leave_days)
        .replace(/leave_type/g, leave_type)
        .replace(/leaves_on_current_year/g, leaves_on_current_year)
        .replace(/leave_description/g, leave_description)
        .replace(/@/g, '');

        await sendEmail({
            from: 'vikramsinh.cybercom@gmail.com',
            to: emailgetForLeaveResponsiblePersonForEmail,
            subject : emailTemplate.emailTemplateId.subject,
            html : emailTemplate.emailTemplateId.content,
        });
    }

    if(emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content){
 
        const emailgetForLeaveReportingPersonForEmail = await preferenceService._emailPermissionCheckforLeave(leave_reporting_person, where2);

        const message = `${leave_request_user_name } has applied for leave`
        emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/cl/g, cl)
        .replace(/pl/g, pl)
        .replace(/leave_responsible_person/g, leave_reporting_person_name)
        .replace(/leave_title/g, message)
        .replace(/leave_dates/g , `from ${leave_date_from} to ${leave_date_to}`)
        .replace(/leave_subject/g, leave_subject)
        .replace(/leave_description/g, leave_description)    
        .replace(/total_leave_days/g, total_leave_days)
        .replace(/leave_type/g, leave_type)
        .replace(/leaves_on_current_year/g, leaves_on_current_year)
        .replace(/@/g, '');

        await sendEmail({
            from: 'vikramsinh.cybercom@gmail.com',
            to: emailgetForLeaveReportingPersonForEmail,
            subject : emailTemplate.emailTemplateId.subject,
            html : emailTemplate.emailTemplateId.content,
            });
    }
    
});

// Action: Leave dates changed
// Key: notify_leave_date_changed
// Content: Receive notifications when any modification made on leave dates either by HR or any user. 

// A notification to “user”, “leave responsible persons” and “reporting persons of the user” who added a leave
// Subject: Leave modified by [action user]- New leave request from [User] for 26/06/2023(F) to 27/06/2023(F) 


eventEmitterLeave.on('notify_leave_date_changed' , async (data) => {    
    const { leave_request_user_name , leave_date_from , leave_date_to , action_by , action_by_profile , leave_id , leave_applied_from , leave_applied_to ,leave_responsible_person_name , leave_description ,leave_type , total_leave_days , leave_subject , pl , cl  } = data;
    let { leave_request_user , leave_responsible_person , leave_reporting_person , leaves_on_current_year } = data;
    const where = "this.notify_leave_date_changed.notify_leave_date_changed_push === true";
    const where1 = "this.notify_leave_date_changed.notify_leave_date_changed_chat === true";
    const where2 = "this.notify_leave_date_changed.notify_leave_date_changed_email === true";

    leave_request_user = leave_request_user.map((item) => {
        if(item){
            return item.toString();
        }
    })

    leave_responsible_person = leave_responsible_person.map((item) => {
        if(item){
            return item.toString();
        }
    })

    leave_reporting_person = leave_reporting_person.map((item) => {
        if(item){
            return item.toString();
        }
    })

    leaves_on_current_year = `<table border="1">
    <tr>
        <th>Subject</th>
        <th>Status</th>
        <th>Leave Dates</th>
    </tr>
    ${leaves_on_current_year.map(item => `
        <tr>
            <td>${item.Subject}</td>
            <td>${item.Status}</td>
            <td>${item.LeaveDates}</td>
        </tr>
    `).join('')}
    </table>`;

    console.log('Leave date changed Data ' , data);
    const notification = `Your leave has been modified by ${action_by} from (${leave_date_from} to ${leave_date_to}) to (${leave_applied_from} to ${leave_applied_to})`;
    const notification1 = `Leave modified by ${action_by} - New leave request from ${leave_request_user_name} for (${leave_date_from} to ${leave_date_to}) to (${leave_applied_from} to ${leave_applied_to}) `;
    const notification2 = `Leave modified by ${action_by} - New leave request from ${leave_request_user_name} for (${leave_date_from} to ${leave_date_to}) to (${leave_applied_from} to ${leave_applied_to}) `;

    const leave_request_user_device_tokens = await preferenceService._getUsersDeviceToken(leave_request_user , where);
    const leave_responsible_person_device_tokens = await preferenceService._getUsersDeviceToken(leave_responsible_person , where);
    const leave_reporting_person_device_tokens = await preferenceService._getUsersDeviceToken(leave_reporting_person , where);

    if(leave_request_user && leave_request_user.length > 0){
        const notificationLog = {
            leave_id : leave_id,
            action_user : action_by,
            notificationTitle: notification,
            employeeImage : action_by_profile ? action_by_profile : null,
            isRead: false,
            isDeleted: false,
        };

        const notificationLogs = await preferenceService._insertNotificationLogLeaves(leave_request_user , notificationLog);

    }


    if(leave_reporting_person && leave_reporting_person.length > 0){
        const notificationLog = {
            leave_id : leave_id,
            action_user : action_by,
            notificationTitle: notification2,
            employeeImage : action_by_profile ? action_by_profile : null,
            isRead: false,
            isDeleted: false,
        };

        const notificationLogs = await preferenceService._insertNotificationLogLeaves(leave_reporting_person , notificationLog);

    }

    if(leave_responsible_person && leave_responsible_person.length > 0){
        const notificationLog = {
            leave_id : leave_id,
            action_user : action_by,
            notificationTitle: notification1,
            employeeImage : action_by_profile ? action_by_profile : null,
            isRead: false,
            isDeleted: false,
        };

        const notificationLogs = await preferenceService._insertNotificationLogLeaves(leave_responsible_person , notificationLog);
    }

    await sendNotificationToMultipleDevice(leave_request_user_device_tokens , notification , action_by);
    await sendNotificationToMultipleDevice(leave_responsible_person_device_tokens , notification1 , action_by);
    await sendNotificationToMultipleDevice(leave_reporting_person_device_tokens , notification2 , action_by);

    const emailTemplate = await preferenceService._getTemplateByActionName('Leave Modification');
    
    if(leave_request_user && leave_request_user.length > 0){

        const emailgetForLeaveRequestUserForChat = await preferenceService._emailPermissionCheckforLeave(leave_request_user, where1)

        if(emailgetForLeaveRequestUserForChat && emailgetForLeaveRequestUserForChat.length>0){
            const leave = Encryption._doEncrypt(leave_id.toString());;
            const mattermostObject = {
                id: leave_id,
                title: notification,
                name : "notification for leave request user",
                link: `${baseurls.URL}/leave/details/${leave}`,
                notificationTitle: notification,
                useremails: emailgetForLeaveRequestUserForChat
            };

            const chat = await sendDirectMessage(mattermostObject);
            console.log('chat: ', chat);

        }
        
        const emailgetForLeaveRequestUserForEmail = await preferenceService._emailPermissionCheckforLeave(leave_request_user , where2);
        console.log('emailgetForLeaveRequestUserForEmail: ', emailgetForLeaveRequestUserForEmail);
    
        if(emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content){

            emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
            .replace(/cl/g, cl)
            .replace(/pl/g, pl)
            .replace(/leave_responsible_person/g, leave_responsible_person_name)
            .replace(/leave_title/g, notification)
            .replace(/leave_dates/g , `from ${leave_date_from} to ${leave_date_to}`)
            .replace(/leave_subject/g, leave_subject)
            .replace(/total_leave_days/g, total_leave_days)
            .replace(/leave_type/g, leave_type)
            .replace(/leave_description/g, leave_description)
            .replace(/leaves_on_current_year/g, leaves_on_current_year)
            .replace(/@/g, '');

            await sendEmail({
                from: 'vikramsinh.cybercom@gmail.com',
                to: emailgetForLeaveRequestUserForEmail,
                subject : emailTemplate.emailTemplateId.subject,
                html : emailTemplate.emailTemplateId.content,
            })
        }
    }

    if(leave_reporting_person && leave_reporting_person.length > 0){

        const emailgetForLeaveReportingPersonForChat = await preferenceService._emailPermissionCheckforLeave(leave_reporting_person, where1)

        if(emailgetForLeaveReportingPersonForChat && emailgetForLeaveReportingPersonForChat.length>0){
            const leave = Encryption._doEncrypt(leave_id.toString());;
            const mattermostObject = {
                id: leave_id,
                title: notification1,
                name : "notification for leave reporting person",
                link: `${baseurls.URL}/leave/details/${leave}`,
                notificationTitle: notification1,
                useremails: emailgetForLeaveReportingPersonForChat
            };

            const chat = await sendDirectMessage(mattermostObject);
            console.log('chat: ', chat);


        }

        const emailgetForLeaveReportingPersonForEmail = await preferenceService._emailPermissionCheckforLeave(leave_reporting_person , where2);
        
        if(emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content){

            emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
            .replace(/cl/g, cl)
            .replace(/pl/g, pl)
            .replace(/leave_responsible_person/g, leave_responsible_person_name)
            .replace(/leave_title/g, notification1)
            .replace(/leave_dates/g , `from ${leave_date_from} to ${leave_date_to}`)
            .replace(/leave_subject/g, leave_subject)
            .replace(/total_leave_days/g, total_leave_days)
            .replace(/leave_type/g, leave_type)
            .replace(/leave_description/g, leave_description)
            .replace(/leaves_on_current_year/g, leaves_on_current_year)
            .replace(/@/g, '');

            await sendEmail({
                from: 'vikramsinh.cybercom@gmail.com',
                to: emailgetForLeaveReportingPersonForEmail,
                subject : emailTemplate.emailTemplateId.subject,
                html : emailTemplate.emailTemplateId.content,
                });
        }

    }

    if(leave_responsible_person && leave_responsible_person.length > 0){

        const emailgetForLeaveResponsiblePersonForChat = await preferenceService._emailPermissionCheckforLeave(leave_responsible_person, where1)
        
        if(emailgetForLeaveResponsiblePersonForChat && emailgetForLeaveResponsiblePersonForChat.length>0){
            const leave = Encryption._doEncrypt(leave_id.toString());;
            const mattermostObject = {
                id: leave_id,
                title: notification2,
                name : "notification for leave responsible person",
                link: `${baseurls.URL}/leave/details/${leave}`,
                notificationTitle: notification2,
                useremails: emailgetForLeaveResponsiblePersonForChat
            };

            const chat = await sendDirectMessage(mattermostObject);
            console.log('chat: ', chat);

        }
        
        const emailgetForLeaveResponsiblePersonForEmail = await preferenceService._emailPermissionCheckforLeave(leave_responsible_person , where2);

        if(emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content){
            
            emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
            .replace(/leave_type/g, leave_type)
            .replace(/cl/g, cl)
            .replace(/pl/g, pl)
            .replace(/leave_responsible_person/g, leave_responsible_person_name)
            .replace(/leave_title/g, notification2)
            .replace(/leave_dates/g , `from ${leave_date_from} to ${leave_date_to}`)
            .replace(/leave_subject/g, leave_subject)
            .replace(/total_leave_days/g, total_leave_days)
            .replace(/leave_description/g, leave_description)
            .replace(/leaves_on_current_year/g, leaves_on_current_year)
            .replace(/@/g, '');

            await sendEmail({
                from: 'vikramsinh.cybercom@gmail.com',
                to: emailgetForLeaveResponsiblePersonForEmail,
                subject : emailTemplate.emailTemplateId.subject,
                html : emailTemplate.emailTemplateId.content,
                });
        }

    }

});

// Action: Leave status changed
// Key: notify_leave_status_changed
// Content: Receive notifications when any leave has been approved/rejected or canceled. 
// Note: Please note that here, notification will be sent only when the final status of leave will be changed. 
// A notification to, “user who added leave”,  “leave responsible persons” and “reporting persons of the user” who added a leave
// Subject: Your leave status has been changed to [Leave status]

eventEmitterLeave.on('notify_leave_status_changed' , async (data) => {

    const { leave_request_user_name  ,  leave_status , leave_date_from , leave_date_to , action_by , action_by_profile , leave_subject , total_leave_days , leave_type , cl , pl , leave_description , leave_responsible_person_name,  leave_id } = data;
    let { leave_responsible_person , leave_reporting_person , leave_request_user } = data;
    let { leaves_on_current_year } = data;

    console.log("Leave Status Changed" , data);

    const where = "this.notify_leave_status_changed.notify_leave_status_changed_push === true";
    const where1 = "this.notify_leave_status_changed.notify_leave_status_changed_chat === true";
    const where2 = "this.notify_leave_status_changed.notify_leave_status_changed_email === true"

    leave_request_user = leave_request_user.map((item) => {
        if(item){
            return item.toString();
        }
    })

    leave_responsible_person = leave_responsible_person.map((item) => {
        if(item){
            return item.toString();
        }
    })

    leave_reporting_person = leave_reporting_person.map((item) => {
        if(item){
            return item.toString();
        }
    })

    const emailTemplate = await preferenceService._getTemplateByActionName('Leave Status Changed');

    leaves_on_current_year = `<table border="1">
        <tr>
            <th>Subject</th>
            <th>Status</th>
            <th>Leave Dates</th>
        </tr>
        ${leaves_on_current_year.map(item => `
            <tr>
                <td>${item.Subject}</td>
                <td>${item.Status}</td>
                <td>${item.LeaveDates}</td>
            </tr>
        `).join('')}
        </table>`;


    const leave_request_user_device_tokens = await preferenceService._getUsersDeviceToken(leave_request_user , where);
    const leave_responsible_person_device_tokens = await preferenceService._getUsersDeviceToken(leave_responsible_person , where);
    const leave_reporting_person_device_tokens = await preferenceService._getUsersDeviceToken(leave_reporting_person , where);

    const notification = `Your leave status has been changed to ${leave_status} by ${action_by} for this date ${leave_date_from} to ${leave_date_to} `;
    const notification1 = `Leave status of ${leave_request_user_name} has been changed to ${leave_status} by ${action_by} for this date ${leave_date_from} to ${leave_date_to} `;
    const notification2 = `Leave status of ${leave_request_user_name} has been changed to ${leave_status} by ${action_by} for this date ${leave_date_from} to ${leave_date_to} `;

    if(leave_request_user && leave_request_user.length > 0){
        const notificationLog = {
            leave_id : leave_id,
            action_user : action_by,
            notificationTitle: notification,
            employeeImage : action_by_profile ? action_by_profile : null,
            isRead: false,
            isDeleted: false,
        };

        const notificationLogs = await preferenceService._insertNotificationLogLeaves(leave_request_user , notificationLog);

    }

    if(leave_reporting_person && leave_reporting_person.length > 0){
        const notificationLog = {
            leave_id : leave_id,
            action_user : action_by,
            notificationTitle: notification2,
            employeeImage : action_by_profile ? action_by_profile : null,
            isRead: false,
            isDeleted: false,
        };

        const notificationLogs = await preferenceService._insertNotificationLogLeaves(leave_reporting_person , notificationLog);

    }

    if(leave_responsible_person && leave_responsible_person.length > 0){
        const notificationLog = {
            leave_id : leave_id,
            action_user : action_by,
            notificationTitle: notification1,
            employeeImage : action_by_profile ? action_by_profile : null,
            isRead: false,
            isDeleted: false,
        };

        const notificationLogs = await preferenceService._insertNotificationLogLeaves(leave_responsible_person , notificationLog);


    }

    await sendNotificationToMultipleDevice(leave_request_user_device_tokens , notification , action_by);
    await sendNotificationToMultipleDevice(leave_responsible_person_device_tokens , notification1 , action_by);
    await sendNotificationToMultipleDevice(leave_reporting_person_device_tokens , notification2 , action_by);

    if(leave_request_user && leave_request_user.length > 0){

        const emailgetForLeaveRequestUserForChat = await preferenceService._emailPermissionCheckforLeave(leave_request_user, where1);

        if(emailgetForLeaveRequestUserForChat && emailgetForLeaveRequestUserForChat.length > 0) {
            const leave = Encryption._doEncrypt(leave_id.toString());;
            const mattermostObject = {
                id: leave_id,
                title: notification,
                name : "notification for leave request user",
                link: `${baseurls.URL}/leave/details/${leave}`,
                notificationTitle: notification,
                useremails: emailgetForLeaveRequestUserForChat
            };

            const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

        }
        
        const emailgetForLeaveRequestUserForEmail = await preferenceService._emailPermissionCheckforLeave(leave_request_user , where2);

        if(emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content){
            
            emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
            .replace(/cl/g, cl)
            .replace(/pl/g, pl)
            .replace(/leave_responsible_person/g, leave_responsible_person_name)
            .replace(/leave_title/g, `${leave_request_user_name } has applied for leave`)
            .replace(/leave_dates/g , `from ${leave_date_from} to ${leave_date_to}`)
            .replace(/leave_subject/g, leave_subject)
            .replace(/total_leave_days/g, total_leave_days)
            .replace(/leave_type/g, leave_type)
            .replace(/leave_description/g, leave_description)
            .replace(/leaves_on_current_year/g, leaves_on_current_year)
            .replace(/@/g, '');

            await sendEmail({
                from: 'vikramsinh.cybercom@gmail.com',
                to: emailgetForLeaveRequestUserForEmail,
                subject : emailTemplate.emailTemplateId.subject,
                html : emailTemplate.emailTemplateId.content,
            })
        }
    }

    if(leave_reporting_person && leave_reporting_person.length > 0){

        const emailgetForLeaveReportingPersonForChat = await preferenceService._emailPermissionCheckforLeave(leave_reporting_person, where1);

        if(emailgetForLeaveReportingPersonForChat && emailgetForLeaveReportingPersonForChat.length > 0) {
            const leave = Encryption._doEncrypt(leave_id.toString());;
            const mattermostObject = {
                id: leave_id,
                title: notification1,
                name : "notification for leave request user",
                link: `${baseurls.URL}/leave/details/${leave}`,
                notificationTitle: notification1,
                useremails: emailgetForLeaveReportingPersonForChat
            };
            const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

        }

        const emailgetForLeaveReportingPersonForEmail = await preferenceService._emailPermissionCheckforLeave(leave_reporting_person , where2);
        
        if(emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content){

            emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
            .replace(/cl/g, cl)
            .replace(/pl/g, pl)
            .replace(/leave_responsible_person/g, leave_responsible_person_name)
            .replace(/leave_title/g, `${leave_request_user_name } has applied for leave`)
            .replace(/leave_dates/g , `from ${leave_date_from} to ${leave_date_to}`)
            .replace(/leave_subject/g, leave_subject)
            .replace(/total_leave_days/g, total_leave_days)
            .replace(/leave_type/g, leave_type)
            .replace(/leave_description/g, leave_description)
            .replace(/leaves_on_current_year/g, leaves_on_current_year)
            .replace(/@/g, '');

            await sendEmail({
                from: 'vikramsinh.cybercom@gmail.com',
                to: emailgetForLeaveReportingPersonForEmail,
                subject : emailTemplate.emailTemplateId.subject,
                html : emailTemplate.emailTemplateId.content,
                });
        }

    }

    if(leave_responsible_person && leave_responsible_person.length > 0){

        const emailgetForLeaveResponsiblePersonForChat = await preferenceService._emailPermissionCheckforLeave(leave_responsible_person, where1);

        if(emailgetForLeaveResponsiblePersonForChat && emailgetForLeaveResponsiblePersonForChat.length > 0) {
            const leave = Encryption._doEncrypt(leave_id.toString());;
            const mattermostObject = {
                id: leave_id,
                title: notification2,
                name : "notification for leave request user",
                link: `${baseurls.URL}/leave/details/${leave}`,
                notificationTitle: notification2,
                useremails: emailgetForLeaveResponsiblePersonForChat
            };

            const chat = await sendDirectMessage(mattermostObject);
            console.log('chat: ', chat);

        }
        
        const emailgetForLeaveResponsiblePersonForEmail = await preferenceService._emailPermissionCheckforLeave(leave_responsible_person , where2);

        if(emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content){
            
            emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
            .replace(/leave_type/g, leave_type)
            .replace(/cl/g, cl)
            .replace(/pl/g, pl)
            .replace(/leave_responsible_person/g, leave_responsible_person_name)
            .replace(/leave_title/g, `${leave_request_user_name } has applied for leave`)
            .replace(/leave_dates/g , `from ${leave_date_from} to ${leave_date_to}`)
            .replace(/leave_subject/g, leave_subject)
            .replace(/total_leave_days/g, total_leave_days)
            .replace(/leave_description/g, leave_description)
            .replace(/leaves_on_current_year/g, leaves_on_current_year)
            .replace(/@/g, '');

            await sendEmail({
                from: 'vikramsinh.cybercom@gmail.com',
                to: emailgetForLeaveResponsiblePersonForEmail,
                subject : emailTemplate.emailTemplateId.subject,
                html : emailTemplate.emailTemplateId.content,
                });
        }

    }
});

export default eventEmitterLeave;



