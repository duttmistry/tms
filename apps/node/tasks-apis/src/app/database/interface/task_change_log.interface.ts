import { Document } from 'mongoose';

export interface ITaskLog extends Document {
    task_id: number;
    user_id: number;
    user_name: string;
    user_profile: string;
    action: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date;
  }
  