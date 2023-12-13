import { Document } from 'mongoose';

// export interface IComment extends Document {
//     task_id: number;
//     user_id: number;
//     user_name: string;
//     user_profile: string;
//     mention_users:object[];
//     comments: string;
//     created_at: Date;
//     updated_at: Date;
//     deleted_at: Date;
//   }
  
export interface IComment extends Document{
  id:number;
  user_id: number;
  user_name: string;
  user_profile: string;
  mention_users:object[];
  comments: string;
  created_at: Date;
  updated_at: Date;
}

export interface IComments extends Document {
  task_id: number;
  comments: IComment[];
}