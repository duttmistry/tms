import mongoose, { Schema } from 'mongoose';
import { ITimeLogs } from '../interface/time_logs.interface';
const TimeLogsSchema: Schema = new Schema({
  task_id: { type: Number, required: true },
  project_id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  user_name: { type: String, required: true },
  user_profile: { type: String, required: true },
  comment:{type:String,required:false},
  start_time: { type: Date, required: true, default: Date.now },
  end_time: { type: Date, default: null },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
  deleted_at: { type: Date, default: null },
});
const TimeLogs=mongoose.modelNames().includes('tm_task_time_log')?mongoose.model('tm_task_time_log'):mongoose.model('tm_task_time_log', TimeLogsSchema);
// if (mongoose.modelNames().includes('tm_task_time_log')) {
//   // Model already exists, use it
//   TimeLogs = mongoose.model('tm_task_time_log');
// } else {
//   // Model doesn't exist, define it
//   TimeLogs = mongoose.model<ITimeLogs>('tm_task_time_log', TimeLogsSchema);
// }


export { TimeLogs, ITimeLogs };
