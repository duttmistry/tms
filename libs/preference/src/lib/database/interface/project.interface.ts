import { Document } from "mongoose";

export interface IProject extends Document {
    projectId: string;
    notify_project_update: boolean;
    taskPreferences: {
        notify_add_task: boolean;
        notify_change_task_status: boolean;
        notify_change_task_state: boolean;
        notify_due_date_changed: boolean;
        notify_assignee_changed: boolean;
        notify_comment_added : boolean;
    }
}