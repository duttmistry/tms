import mongoose, { Schema } from 'mongoose';
import { IComments } from '../interface/comments.interface';

// const CommentsSchema: Schema = new Schema({
//   task_id: { type: Number, required: true },
//   user_id: { type: Number, required: true },
//   user_name: { type: String, required: true },
//   user_profile: { type: String, required: true },
//   mention_users:{type:Array,require:false,default:[]},
//   comments: { type: String, required: true },
//   // created_at: { type: Date, required: true, default: Date.now },
//   // updated_at: { type: Date, required: true, default: Date.now },
//   deleted_at: { type: Date, default: null },
// },{ timestamps: true });

const CommentsSchema: Schema = new Schema({
  task_id: { type: Number, required: true },
  comments:{type:Array,require:false,default:[]},
},{ timestamps: true });

const Comments = mongoose.model<IComments>('tm_task_comments', CommentsSchema);

export { Comments, IComments };