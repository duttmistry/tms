import { Query } from '@tms-workspace/apis-core';
import { ICommit, ICommits } from '../../../database/interface/commits.interface';
import { Commits } from '../../../database/models/commits.model';

class TaskCommentsService {

  // GET SINGLE COMMITS
  public _getSingleData = async (query) => {
    return new Promise<ICommits>((resolve, reject) => {
      const data = Commits.findOne(query);
      resolve(data);
    });
  };

  // CREATE COMMITS
  public _create = async (obj) => {
    return new Promise((resolve, reject) => {
      const data = Commits.insertMany(obj);
      resolve(data);
    });
  };

  // // UPDATE COMMITS
  public _update = async (query, obj) => {
    return new Promise((resolve, reject) => {
      const data = Commits.updateOne(query, obj);
      resolve(data);
    });
  };

  // // DELETE COMMITS
  public _delete = async (query) => {
    return new Promise<ICommits>((resolve, reject) => {
      const data = Commits.findOneAndRemove(query);
      resolve(data);
    });
  };
}

export default TaskCommentsService;
