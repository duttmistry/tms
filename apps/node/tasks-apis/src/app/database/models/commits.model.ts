import mongoose, { Schema } from 'mongoose';
import { ICommit, ICommits } from '../interface/commits.interface';

// const CommitsSchema: Schema = new Schema({
//   task_id: { type: Number, required: true },
//   user_id: { type: Number, required: true },
//   user_name: { type: String, required: true },
//   user_profile: { type: String, required: true },
//   commits: { type: String, required: true },
//   // created_at: { type: Date, required: true, default: Date.now },
//   // updated_at: { type: Date, required: true, default: Date.now },
//   deleted_at: { type: Date, default: null },
// },{ timestamps: true });

// const Commits = mongoose.model<ICommit>('tm_task_commits', CommitsSchema);

// export { Commits, ICommit };

const CommitsSchema: Schema = new Schema({
  task_id: { type: Number, required: true },
  commits: {type:Array,require:false,default:[]},
},{ timestamps: true });

const Commits = mongoose.model<ICommits>('tm_task_commits', CommitsSchema);

export { Commits, ICommits };