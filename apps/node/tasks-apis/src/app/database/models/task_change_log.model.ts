import mongoose, { Schema } from 'mongoose';
import { ITaskLog } from '../interface/task_change_log.interface';

const TaskChangeLogSchema: Schema = new Schema({
  task_id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  user_name: { type: String, required: true },
  user_profile: { type: String, required: true },
  action: { type: String, required: true },
  updated_values:{type:Array,required:false,default:[]},
  // created_at: { type: Date, required: true, default: Date.now },
  // updated_at: { type: Date, required: true, default: Date.now },
  deleted_at: { type: Date, default: null },
},{ timestamps: true });

const TaskChangeLog = mongoose.model<ITaskLog>('tm_task_change_log', TaskChangeLogSchema);

export { TaskChangeLog, ITaskLog };