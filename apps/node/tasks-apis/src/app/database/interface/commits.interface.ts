import { Document } from 'mongoose';

// export interface ICommit extends Document {
//     task_id: number;
//     user_id: number;
//     user_name: string;
//     user_profile: string;
//     commits: string;
//     created_at: Date;
//     updated_at: Date;
//     deleted_at: Date;
//   }
  
export interface ICommit extends Document{
  id:number;
  user_id: number;
  user_name: string;
  user_profile: string;
  commits: string;
  created_at: Date;
  updated_at: Date;
}

export interface ICommits extends Document {
  task_id: number;
  commits: ICommit[];
}