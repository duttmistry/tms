import mongoose , { Schema } from 'mongoose';
import { IUser } from '../interface/user.interface';

// Preferences:

const UserSchema: Schema = new Schema({
    userId: { type: String },
    email: { type: String , require: true, default: null},
    employee_image : { type: String , require: true, default: null},
    role: { type: String , require: true , default: null},
    userDeviceToken: { type: Array },
    notify_leave: { type: Boolean , require: true , default: true},

    notify_add_leave_by_team : {
        notify_add_leave_by_team: { type: Boolean , require: true , default: true},
        notify_leave_email: { type: Boolean , require: true , default: true},
        notify_leave_push: { type: Boolean , require: true , default: true},
        notify_leave_chat: { type: Boolean , require: true , default: true},
    },

    notify_leave_date_changed : {
        notify_leave_date_changed: { type: Boolean , require: true , default: true},
        notify_leave_date_changed_email: { type: Boolean , require: true , default: true},
        notify_leave_date_changed_push: { type: Boolean , require: true , default: true},
        notify_leave_date_changed_chat: { type: Boolean , require: true , default: true},
    },

    notify_leave_status_changed : {
        notify_leave_status_changed: { type: Boolean , require: true , default: true},
        notify_leave_status_changed_email: { type: Boolean , require: true , default: true},
        notify_leave_status_changed_push: { type: Boolean , require: true , default: true},
        notify_leave_status_changed_chat: { type: Boolean , require: true , default: true},
    },


    projects: [{
        projectId: { type: String , require: true , default: null},
        notify_project_update: { type: Boolean , require: true , default: true},
        notify_project_email : { type: Boolean , require: true , default: true},
        notify_project_push : { type: Boolean , require: true , default: true},
        notify_project_chat : { type: Boolean , require: true , default: true},
        taskPreferences: {
            notify_add_task: { type: Boolean , require: true , default: true},
            notify_change_task_status: { type: Boolean , require: true , default: true},
            notify_change_task_state: { type: Boolean , require: true , default: true},
            notify_due_date_changed: { type: Boolean , require: true , default: true},
            notify_assignee_changed: { type: Boolean , require: true , default: true},
            notify_comment_added : { type: Boolean , require: true , default: true},
        }
    }]
});

export default mongoose.model<IUser>('User', UserSchema);

