import { Document } from 'mongoose';

export interface ITimeLogs extends Document {
    task_id: number;
    user_id: number;
    user_name: string;
    user_profile: string;
    start_time: Date;
    end_time:Date;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date;
  }
  