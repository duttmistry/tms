import { EventEmitter } from 'events';
import { sendNotificationToMultipleDevice } from '../../core/sendNotification';
import PreferenceService from '../../services/preference.service';
import TaskService from '../../services/task.service';
import { IProject } from '../../database/interface/user.interface';
import { Encryption } from '@tms-workspace/encryption';
import { Op } from 'sequelize';
import { sendEmail } from '../../core/sendEmail';
import sendDirectMessage from '../../core/mattermostapi';
import baseurls from '../../baseurls';
const eventEmitterTask = new EventEmitter();
const preferenceService = new PreferenceService();
const taskService = new TaskService();


// Project A
// Action: Task Created
// Key:  notify_add_task
// Content: Receive notifications when new task has been created

// A notification to “assigned_to” user
// Subject: A task has been assigned you: [Task Title]
// A notification to “subscribers” users
// Subject: A new task has been created: [Task Title]
// A notification to “reporting_person” of the project
// Subject: A new task has been created: [Task Title]

eventEmitterTask.on('notify_add_task', async (data) => {
  let { assigned_to, subscribers, reporting_person } = data;
  const {
    task_title,
    projectId,
    action_by,
    action_by_profile,
    assigned_to_name,
    assigned_by_name,
    priority,
    project_name,
    due_date,
    subscribers_name,
    task_id,
    action_performer
  } = data;
  
  try {
 
    const condition = (project: any) => {
      return project.taskPreferences.notify_add_task === true;
    };

    assigned_to = assigned_to?.filter((item) => item !== action_performer);
    subscribers = subscribers?.filter((item) => !assigned_to.includes(item)).filter((item) => !reporting_person.includes(item)).filter((item) => item !== action_performer);
    reporting_person = reporting_person?.filter((item) => !assigned_to.includes(item)).filter((item) => item !== action_performer);
    
    // remove null elements and undefined from arrays
    assigned_to = assigned_to?.filter((item: any) => {
      return item !== null && item !== undefined;
    });

    subscribers = subscribers?.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    reporting_person = reporting_person?.filter((item: any) => {
      return item !== null && item !== undefined;
    });

    const assignedTo = await preferenceService._getUsersDeviceTokenForProject(assigned_to, projectId, condition);
    const subscribersTo = await preferenceService._getUsersDeviceTokenForProject(subscribers, projectId, condition);
    const reportingPerson = await preferenceService._getUsersDeviceTokenForProject(reporting_person, projectId, condition);

    const assignedToMessage = `[${project_name}] A task has been assigned to you: ${task_title}`;
    const subscribersMessage = `[${project_name}] You're added as a subscriber: ${task_title}`;
    const reportingPersonMessage = `[${project_name}] A new task has been created by ${assigned_by_name}: ${task_title}`;

    if (subscribers && subscribers.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ You're added as a subscriber: ^^&^%@^^ ${task_title} `,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const subscribers_notification = await preferenceService._insertNotificationLogTasks(subscribers, notificationObject);
    }

    if (assigned_to && assigned_to.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A task has been assigned to you: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const assigned_to_notification = await preferenceService._insertNotificationLogTasks(assigned_to, notificationObject);
    }

    if (reporting_person && reporting_person.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A new task has been created by ${assigned_by_name}: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const reporting_person_notification = await preferenceService._insertNotificationLogTasks(reporting_person, notificationObject);
    }

    await sendNotificationToMultipleDevice(assignedTo, assignedToMessage, action_by);
    await sendNotificationToMultipleDevice(subscribersTo, subscribersMessage, action_by);
    await sendNotificationToMultipleDevice(reportingPerson, reportingPersonMessage, action_by);

    const sendEmailAssignee = await preferenceService._emailPermissionCheckforProject(assigned_to, projectId, condition);
    const sendEmailSubscribers = await preferenceService._emailPermissionCheckforProject(subscribers, projectId, condition);
    const sendEmailReportingPerson = await preferenceService._emailPermissionCheckforProject(reporting_person, projectId, condition);

    // matermost sending message

    if (sendEmailAssignee && sendEmailAssignee.length > 0) {
      const task =  Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for assignee",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] A task has been assigned to you:`,
        useremails: sendEmailAssignee
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

    }

    if (sendEmailSubscribers && sendEmailSubscribers.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      console.log('task: ', task);
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for subscribers",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] You're added as a subscriber:`,
        useremails: sendEmailSubscribers
      };      
      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

    }

    if (sendEmailReportingPerson && sendEmailReportingPerson.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for reporting person",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] A new task has been created by ${assigned_by_name}:`,
        useremails: sendEmailReportingPerson
      };
      
      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);
    }

    // get template by action id
    const emailTemplate = await preferenceService._getTemplateByActionName('Task Created');

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, assignedToMessage)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailAssignee,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, subscribersMessage)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailSubscribers,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, reportingPersonMessage)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailReportingPerson,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }

  } catch (error) {
    console.log('error', error);
  }
});

// Action: Status changed
// Key: notify_change_task_status
// Content: Receive notifications when task status has been changed.
// A notification to “assigned_to” user,  “subscribers” users, “reporting_person” of the project
// Subject: A task status has been changed to [New Task Status]: [Task Title]

eventEmitterTask.on('notify_subscriber_added', async (data) => {
  // let { subscribers } = data;
  let { subscribers } = data;
  const {
    task_title,
    reporting_person,
    new_task_status,
    projectId,
    action_by,
    action_by_profile,
    assigned_to_name,
    assigned_by_name,
    priority,
    project_name,
    due_date,
    subscribers_name,
    task_id,
    assigned_to,
  } = data;

  try {
    const condition = (project: any) => {
      return project.taskPreferences.notify_add_task === true;
    };

    subscribers = subscribers?.filter((item) => !assigned_to.includes(item)).filter((item) => !reporting_person.includes(item));

    subscribers = subscribers?.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    const subscribersTo = await preferenceService._getUsersDeviceTokenForProject(subscribers, projectId, condition);

    // [TMS] You're added as a subscriber: Task title.

    const subscribersMessage = `[${project_name}] You're added as a subscriber: ${task_title} `;

    if (subscribers && subscribers.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^  You're added as a subscriber: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const subscribers_notification = await preferenceService._insertNotificationLogTasks(subscribers, notificationObject);
    }

    await sendNotificationToMultipleDevice(subscribersTo, subscribersMessage, action_by);

    const sendEmailAssignee = await preferenceService._emailPermissionCheckforProject(subscribers, projectId, condition);

    if (sendEmailAssignee && sendEmailAssignee.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for all subscriber person",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] You're added as a subscriber:`,
        useremails: sendEmailAssignee
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

    }

    const emailTemplate = await preferenceService._getTemplateByActionName('Task Created');

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, subscribersMessage)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailAssignee,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }
  } catch (error) {
    console.log('error', error);
  }
});

eventEmitterTask.on('notify_change_task_status', async (data) => {
  let { assigned_to, subscribers, reporting_person } = data;
  const {
    task_title,
    new_task_status,
    projectId,
    action_by,
    action_by_profile,
    assigned_to_name,
    assigned_by_name,
    priority,
    project_name,
    due_date,
    subscribers_name,
    task_id,
  } = data;
  try {
    const condition = (project: any) => {
      return project.taskPreferences.notify_change_task_status === true;
    };

    subscribers = subscribers.filter((item) => !assigned_to.includes(item)).filter((item) => !reporting_person.includes(item));
    reporting_person = reporting_person.filter((item) => !assigned_to.includes(item));

    // remove null elements and undefined from arrays
    assigned_to = assigned_to.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    subscribers = subscribers.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    reporting_person = reporting_person.filter((item: any) => {
      return item !== null && item !== undefined;
    });

    let users = [...assigned_to, ...subscribers, ...reporting_person];

    users = [...new Set(users)];

    const usersDeviceTokens = await preferenceService._getUsersDeviceTokenForProject(users, projectId, condition);

    if (users && users.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A task status has been changed to ${new_task_status}: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const users_notification = await preferenceService._insertNotificationLogTasks(users, notificationObject);
    }

    await sendNotificationToMultipleDevice(
      usersDeviceTokens,
      `[${project_name}] A task status has been changed to ${new_task_status}: ${task_title}`,
      action_by
    );

    const sendEmailUsers = await preferenceService._emailPermissionCheckforProject(users, projectId, condition);

    if (sendEmailUsers && sendEmailUsers.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for all subscriber person",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] A task status has been changed to ${new_task_status}:`,
        useremails: sendEmailUsers
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);
    }

    const emailTemplate = await preferenceService._getTemplateByActionName('Task Status Changed');

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, `[${project_name}] A task status has been changed to ${new_task_status}: ${task_title}`)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailUsers,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }
  } catch (error) {
    console.log('error', error);
  }
});

// Action: State changed
// Key: notify_change_task_state
// Content: Receive notifications when task state has been changed

// If task state is “completed”
// A notification to “assigned_to” user,  “subscribers” users, “reporting_person” of the project
// Subject: A task status has been completed by [User]: [Task Title]
// Else

// A notification to “assigned_to” user,  “subscribers” users, “reporting_person” of the project
// Subject: A task state has been changed to [New Task State]: [Task Title]

eventEmitterTask.on('notify_change_task_state', async (data) => {
  let { assigned_to, subscribers, reporting_person } = data;
  const {
    task_title,
    new_task_state,
    projectId,
    action_by,
    action_by_profile,
    assigned_to_name,
    assigned_by_name,
    priority,
    project_name,
    due_date,
    subscribers_name,
    task_id,
  } = data;
  try {
 
    const condition: (project: IProject) => boolean = (project: IProject) => {
      return project.taskPreferences.notify_change_task_state === true;
    };

    subscribers = subscribers.filter((item) => !assigned_to.includes(item)).filter((item) => !reporting_person.includes(item));
    reporting_person = reporting_person.filter((item) => !assigned_to.includes(item));

    // remove null elements and undefined from arrays
    assigned_to = assigned_to.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    subscribers = subscribers.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    reporting_person = reporting_person.filter((item: any) => {
      return item !== null && item !== undefined;
    });

    let users = [...assigned_to, ...subscribers, ...reporting_person];

    users = [...new Set(users)];

    const usersDeviceTokens = await preferenceService._getUsersDeviceTokenForProject(users, projectId, condition);

    if (users && users.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A task status has been changed to ${new_task_state}: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };
      const users_notification = await preferenceService._insertNotificationLogTasks(users, notificationObject);
    }

    await sendNotificationToMultipleDevice(
      usersDeviceTokens,
      `[${project_name}] A task status has been changed to ${new_task_state}: ${task_title}`,
      action_by
    );

    const sendEmailUsers = await preferenceService._emailPermissionCheckforProject(users, projectId, condition);

    if (sendEmailUsers && sendEmailUsers.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for reporting person",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] A task status has been changed to ${new_task_state}:`,
        useremails: sendEmailUsers
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

    }

    const emailTemplate = await preferenceService._getTemplateByActionName('Task State Changed');

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, `[${project_name}] A task status has been changed to ${new_task_state}: ${task_title}`)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailUsers,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }
  } catch (error) {
    console.log('error', error);
  }
});

// Action: Due date changed
// Key: notify_due_date_changed
// Content: Receive notifications when due date has been changed

// A notification to “assigned_to” user,  “subscribers” users, “reporting_person” of the project
// Subject: A task due date changed to [New due date]: [Task title]

eventEmitterTask.on('notify_due_date_changed', async (data) => {
  let { assigned_to, subscribers, reporting_person } = data;
  const {
    task_title,
    new_due_date,
    projectId,
    action_by,
    action_by_profile,
    assigned_to_name,
    assigned_by_name,
    priority,
    project_name,
    due_date,
    subscribers_name,
    task_id,
  } = data;

  try {
    const condition = (project: any) => {
      return project.taskPreferences.notify_due_date_changed === true;
    };

    subscribers = subscribers.filter((item) => !assigned_to.includes(item)).filter((item) => !reporting_person.includes(item));
    reporting_person = reporting_person.filter((item) => !assigned_to.includes(item));

    // remove null elements and undefined from arrays
    assigned_to = assigned_to.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    subscribers = subscribers.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    reporting_person = reporting_person.filter((item: any) => {
      return item !== null && item !== undefined;
    });

    let users = [...assigned_to, ...subscribers, ...reporting_person];

    // make users array element unique
    users = [...new Set(users)];

    const usersDeviceTokens = await preferenceService._getUsersDeviceTokenForProject(users, projectId, condition);

    if (users && users.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A task due date changed to ${new_due_date}: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const users_notification = await preferenceService._insertNotificationLogTasks(users, notificationObject);
    }

    await sendNotificationToMultipleDevice(
      usersDeviceTokens,
      `[${project_name}] A task due date changed to ${new_due_date}: ${task_title}`,
      action_by
    );

    const sendEmailUsers = await preferenceService._emailPermissionCheckforProject(users, projectId, condition);

    if (sendEmailUsers && sendEmailUsers.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for reporting person",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] A task due date changed to ${new_due_date}:`,
        useremails: sendEmailUsers
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

    }

    const emailTemplate = await preferenceService._getTemplateByActionName('Task Due Date Changed');

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, `[${project_name}] A task due date changed to ${new_due_date}: ${task_title}`)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailUsers,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }
  } catch (error) {
    console.log('error', error);
  }
});

// Action: Assignee changed
// Key: notify_assignee_changed
// Content: Receive notifications when assignee has been changed

// A notification to  “subscribers” users, “reporting_person” of the project
// Subject: A task has been assigned to [Assignee]: [Task title]
// A notification to “assigned_to” user
// Subject: A task has been assigned to you: [Task title]

eventEmitterTask.on('notify_assignee_changed', async (data) => {
  let { assigned_to, subscribers, reporting_person } = data;
  const {
    task_title,
    new_assignee,
    projectId,
    action_by,
    action_by_profile,
    assigned_to_name,
    assigned_by_name,
    priority,
    project_name,
    due_date,
    subscribers_name,
    task_id,
  } = data;
  try {
    const condition = (project: any) => {
      return project.taskPreferences.notify_assignee_changed === true;
    };

    subscribers = subscribers.filter((item) => !assigned_to.includes(item)).filter((item) => !reporting_person.includes(item));
    reporting_person = reporting_person.filter((item) => !assigned_to.includes(item));

    // remove null elements and undefined from arrays
    assigned_to = assigned_to.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    subscribers = subscribers.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    reporting_person = reporting_person.filter((item: any) => {
      return item !== null && item !== undefined;
    });

    const assignedTo = await preferenceService._getUsersDeviceTokenForProject(assigned_to, projectId, condition);
    const subscribersTo = await preferenceService._getUsersDeviceTokenForProject(subscribers, projectId, condition);
    const reportingPerson = await preferenceService._getUsersDeviceTokenForProject(reporting_person, projectId, condition);

    const assignedToMessage = `[${project_name}]  A task has been assigned to you: ${task_title}`;
    const subscribersMessage = `[${project_name}] A task has been assigned to ${new_assignee}: ${task_title}`;
    const reportingPersonMessage = `[${project_name}] A task has been assigned to ${new_assignee}: ${task_title}`;

    if (assigned_to && assigned_to.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A task has been assigned to you: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const users_notification = await preferenceService._insertNotificationLogTasks(assigned_to, notificationObject);
    }

    if (subscribers && subscribers.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A task has been assigned to ${new_assignee}: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const users_notification = await preferenceService._insertNotificationLogTasks(subscribers, notificationObject);
    }

    if (reporting_person && reporting_person.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A task has been assigned to ${new_assignee}: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const users_notification = await preferenceService._insertNotificationLogTasks(reporting_person, notificationObject);
    }

    await sendNotificationToMultipleDevice(assignedTo, assignedToMessage, action_by);
    await sendNotificationToMultipleDevice(subscribersTo, subscribersMessage, action_by);
    await sendNotificationToMultipleDevice(reportingPerson, reportingPersonMessage, action_by);

    const sendEmailAssignee = await preferenceService._emailPermissionCheckforProject(assigned_to, projectId, condition);

    const sendEmailSubscribers = await preferenceService._emailPermissionCheckforProject(subscribers, projectId, condition);

    const sendEmailReportingPerson = await preferenceService._emailPermissionCheckforProject(reporting_person, projectId, condition);

    if (sendEmailAssignee && sendEmailAssignee.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for assignee person",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}]  A task has been assigned to you:`,
        useremails: sendEmailAssignee
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

    }

    if (sendEmailSubscribers && sendEmailSubscribers.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for subscribers",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] A task has been assigned to ${new_assignee}:`,
        useremails: sendEmailSubscribers
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

    }

    if (sendEmailReportingPerson && sendEmailReportingPerson.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for reporting person",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] A task has been assigned to ${new_assignee}:`,
        useremails: sendEmailReportingPerson
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);


    }

    const emailTemplate = await preferenceService._getTemplateByActionName('Task Assignee Changed');

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, `[${project_name}] A task has been assigned to ${new_assignee}: ${task_title}`)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailAssignee,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, `[${project_name}] A task has been assigned to ${new_assignee}: ${task_title}`)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailSubscribers,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      // replace the instance variable with the actual value
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, `[${project_name}] A task has been assigned to ${new_assignee}: ${task_title}`)
        .replace(/project_name/g, project_name)
        .replace(/due_date/g, new Date(due_date).getDate() + '/' + new Date(due_date).getMonth() + '/' + new Date(due_date).getFullYear())
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailReportingPerson,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }
  } catch (error) {
    console.log('error', error);
  }
});

// Action: Comment added
// Key: notify_comment_added
// Content: Receive notifications when any comment has been added to the task
// A notification to “assigned_to” user,  “subscribers” users, “reporting_person” of the project
// Subject: A comment has been added to the task: [Task title]

eventEmitterTask.on('notify_comment_added', async (data) => {
  let { assigned_to, subscribers, reporting_person } = data;
  // let { mentionedPerson } = data;
  const {
    task_title,
    projectId,
    action_by,
    action_by_profile,
    assigned_to_name,
    assigned_by_name,
    priority,
    project_name,
    due_date,
    subscribers_name,
    comment,
    task_id,
  } = data;

  try {
    const condition = (project: any) => {
      return project.taskPreferences.notify_comment_added === true;
    };

    subscribers = subscribers.filter((item) => !assigned_to.includes(item)).filter((item) => !reporting_person.includes(item));
    reporting_person = reporting_person.filter((item) => !assigned_to.includes(item));

    // remove null elements and undefined from arrays
    assigned_to = assigned_to.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    subscribers = subscribers.filter((item: any) => {
      return item !== null && item !== undefined;
    });
    reporting_person = reporting_person.filter((item: any) => {
      return item !== null && item !== undefined;
    });

    let users = [...assigned_to, ...subscribers, ...reporting_person];

    // make users array element unique
    users = [...new Set(users)];

    const usersDeviceTokens = await preferenceService._getUsersDeviceTokenForProject(users, projectId, condition);

    if (users && users.length > 0) {
      const notificationObject = {
        task_id: task_id,
        action_user: action_by,
        notificationTitle: `[${project_name}] ^^&^%@^^ A comment has been added to the task: ^^&^%@^^ ${task_title}`,
        employeeImage: action_by_profile ? action_by_profile : null,
        isRead: false,
        isDeleted: false,
      };

      const users_notification = await preferenceService._insertNotificationLogTasks(users, notificationObject);
    }

    await sendNotificationToMultipleDevice(usersDeviceTokens, `[${project_name}] A comment has been added to the task: ${task_title}`, action_by);

    const sendEmailUsers = await preferenceService._emailPermissionCheckforProject(users, projectId, condition);

    if (sendEmailUsers && sendEmailUsers.length > 0) {
      const task = Encryption._doEncrypt(task_id.toString());
      const mattermostObject = {
        id: task_id,
        title: task_title,
        name : "notification for reporting person",
        link: `${baseurls.URL}/tasks/view/${task}`,
        notificationTitle: `[${project_name}] A new task has been created by ${assigned_by_name}:`,
        useremails: sendEmailUsers
      };

      const chat = await sendDirectMessage(mattermostObject);
      console.log('chat: ', chat);

    }

    const emailTemplate = await preferenceService._getTemplateByActionName('Task Comment Added');

    if (emailTemplate && emailTemplate.emailTemplateId && emailTemplate.emailTemplateId.subject && emailTemplate.emailTemplateId.content) {
      emailTemplate.emailTemplateId.content = emailTemplate.emailTemplateId.content
        .replace(/task_title/g, `[${project_name}] A comment has been added to the task: ${task_title}`)
        .replace(/project_name/g, project_name)
        .replace(
          /due_date/g,
          new Date(due_date).getDate().toString() +
            '-' +
            (new Date(due_date).getMonth() + 1).toString() +
            '-' +
            new Date(due_date).getFullYear().toString()
        )
        .replace(/priority/g, priority)
        .replace(/assigned_to_name/g, assigned_to_name)
        .replace(/assigned_by_name/g, assigned_by_name)
        .replace(/subscribers_name/g, subscribers_name)
        .replace(/comment_added/g, comment)
        .replace(/@/g, '');

      await sendEmail({
        from: 'vikramsinh.cybercom@gmail.com',
        to: sendEmailUsers,
        subject: emailTemplate.emailTemplateId.subject,
        html: emailTemplate.emailTemplateId.content,
      });
    }
  } catch (error) {
    console.log('error', error);
  }
});

eventEmitterTask.on('task_time_stop', async (taskIds: number[]) => {
  try {
    const currentOngoingTask = await taskService._getTaskHistoryData({ task_id: { $in: taskIds }, end_time: null });
    await taskService._updateTaskTime({ task_id: { $in: taskIds }, end_time: null }, { $set: { end_time: Date.now() } });
    for (const taskdata of currentOngoingTask) {
      const { user_id, task_id, user_name, user_profile } = taskdata;
      const logBody = {
        user_id: user_id,
        user_name: user_name,
        user_profile: user_profile,
        end_time: Date.now(),
        task_id: task_id,
        action: 'Timer Stop',
      };
      await taskService._create(logBody);
      await taskService._updateTaskStatus({ running_status: 'Stop' }, { task_id: task_id });
      const ongoing = await taskService._getTaskStatus({ task_id: task_id, running_status: 'Ongoing' });
      const data = await taskService._getTaskHistoryData({ task_id: task_id });
      const currentTime = new Date();

      let totalMilliseconds = 0;
      for (const entry of data) {
        if (entry.end_time === null) {
          const startTime = new Date(entry.start_time);
          totalMilliseconds += currentTime.getTime() - startTime.getTime();
        } else {
          const startTime = new Date(entry.start_time);
          const endTime = new Date(entry.end_time);
          totalMilliseconds += endTime.getTime() - startTime.getTime();
        }
      }

      const totalSeconds = Math.floor(totalMilliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      if (ongoing.length <= 0) {
        await taskService._updateTasks(
          {
            running_status: 'Stop',
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: task_id }
        );
      } else {
        await taskService._updateTasks(
          {
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: task_id }
        );
      }
    }
  } catch (error) {
    console.log('error', error);
  }
});

eventEmitterTask.on('log_Out_task_time_stop', async (user_id: number) => {
  const currentOngoingTask = await taskService._getTaskHistoryData({ user_id: user_id, end_time: null });
  await taskService._updateTaskTime({ user_id: user_id, end_time: null }, { $set: { end_time: Date.now() } });
  try {
    if (currentOngoingTask.length > 0) {
      for (const taskdata of currentOngoingTask) {
        const { user_id, task_id, user_name, user_profile } = taskdata;
        const logBody = {
          user_id: user_id,
          user_name: user_name,
          user_profile: user_profile,
          end_time: Date.now(),
          task_id: task_id,
          action: 'Timer Stop',
        };
        await taskService._create(logBody);
      }
    }
    const currentstatus = await taskService._getTaskStatus({ user_id: user_id, running_status: 'Ongoing' });
    for (const element of currentstatus) {
      await taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: user_id });
      const ongoing = await taskService._getTaskStatus({ task_id: element.task_id, running_status: 'Ongoing' });
      const data = await taskService._getTaskHistoryData({ task_id: element.task_id });
      const currentTime = new Date();

      let totalMilliseconds = 0;
      for (const entry of data) {
        if (entry.end_time === null) {
          const startTime = new Date(entry.start_time);
          totalMilliseconds += currentTime.getTime() - startTime.getTime();
        } else {
          const startTime = new Date(entry.start_time);
          const endTime = new Date(entry.end_time);
          totalMilliseconds += endTime.getTime() - startTime.getTime();
        }
      }

      const totalSeconds = Math.floor(totalMilliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      if (ongoing.length <= 0) {
        await taskService._updateTasks(
          {
            running_status: 'Stop',
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: element.task_id }
        );
      } else {
        await taskService._updateTasks(
          {
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: element.task_id }
        );
      }
    }
  } catch (error) {
    console.log('error', error);
  }
});

eventEmitterTask.on('team_member_remove_from_project', async (user_ids: number[], project_id: number) => {
  try {
    console.log(user_ids, 'user_ids');
    for (const user_id of user_ids) {
      let tasklist = await taskService._getTasks({
        [Op.and]: [
          {
            [Op.or]: [{ assignee: user_id }, { assigned_by: user_id }, { reporter: user_id }],
          },
          {
            project_id: project_id,
          },
          {
            state: { [Op.ne]: 'completed' },
          },
        ],
      });
      tasklist = JSON.parse(JSON.stringify(tasklist));
      console.log(tasklist, 'tasklist');

      for (const task of tasklist) {
        const assignee = task.assignee == user_id ? { assignee: null } : {};
        const assigned_by = task.assigned_by == user_id ? { assigned_by: null } : {};
        const reporter = task.reporter == user_id ? { reporter: null } : {};
        await taskService._updateTaskTime({ user_id: user_id, end_time: null, task_id: task.id }, { $set: { end_time: Date.now() } });
        await taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: user_id, task_id: task.id });
        const data = await taskService._getTaskHistoryData({ task_id: task.id });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        await taskService._updateTasks(
          {
            ...assignee,
            ...assigned_by,
            ...reporter,
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: task.id }
        );
      }
    }
  } catch (error) {
    console.log('error', error);
  }
});

eventEmitterTask.on('team_member_remove_from_project_multy_project', async (user_id: number, project_ids: number[]) => {
  try {
    for (const project_id of project_ids) {
      let tasklist = await taskService._getTasks({
        [Op.and]: [
          {
            [Op.or]: [{ assignee: user_id }, { assigned_by: user_id }, { reporter: user_id }],
          },
          {
            project_id: project_id,
          },
          {
            state: { [Op.ne]: 'completed' },
          },
        ],
      });
      tasklist = JSON.parse(JSON.stringify(tasklist));
      console.log(tasklist, 'tasklist');

      for (const task of tasklist) {
        const assignee = task.assignee == user_id ? { assignee: null } : {};
        const assigned_by = task.assigned_by == user_id ? { assigned_by: null } : {};
        const reporter = task.reporter == user_id ? { reporter: null } : {};
        await taskService._updateTaskTime({ user_id: user_id, end_time: null, task_id: task.id }, { $set: { end_time: Date.now() } });
        await taskService._updateTaskStatus({ running_status: 'Stop' }, { user_id: user_id, task_id: task.id });
        const data = await taskService._getTaskHistoryData({ task_id: task.id });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        await taskService._updateTasks(
          {
            ...assignee,
            ...assigned_by,
            ...reporter,
            total_worked_hours: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          },
          { id: task.id }
        );
      }
    }
  } catch (error) {
    console.log('error', error);
  }
});

eventEmitterTask.on('sub_task_project_change', async (data) => {
  try {
    let taskList = await taskService._getTasks({ parent_task_id: data.taskId });
    taskList = JSON.parse(JSON.stringify(taskList));
    taskList.map(async (task) => {
      await taskService._updateTasks({ project_id: data.project_id, task_key_prefix: data.task_key_prefix }, { id: task.id });
      await taskService._updateTaskTime({ task_id: task.id}, { $set: { project_id: data.project_id } });
    });
  } catch (error) {
    console.log('error', error);
  }
});

eventEmitterTask.on('change_biling_houres', async (data) => {
  try {
    await taskService._updateTaskTime({ task_id: Number(data.taskId)}, { $set: { project_id: Number(data.new_project_id) } });
  } catch (error) {
    console.log('error', error);
  }
});



export default eventEmitterTask;
