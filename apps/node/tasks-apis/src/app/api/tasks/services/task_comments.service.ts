import { Query } from '@tms-workspace/apis-core';
import { IComments } from '../../../database/interface/comments.interface';
import { Comments } from '../../../database/models/comments.model';

class TaskCommentsService {
  // GET ALL COMMENTS
  public _count = async (query) => {
    return new Promise<number>((resolve, reject) => {
      const data = Comments.count(query);
      resolve(data);
    });
  };

  // // GET ALL COMMENTS
  // public _getAllData = async (query) => {
  //   return new Promise<IComments>((resolve, reject) => {
  //     const data = Comments.findOne(query);
  //     resolve(data);
  //   });
  // };

  // GET SINGLE COMMENTS
  public _getSingleData = async (query) => {
    return new Promise<IComments>((resolve, reject) => {
      const data = Comments.findOne(query);
      resolve(data);
    });
  };

  // CREATE COMMENTS
  public _create = async (obj) => {
    return new Promise((resolve, reject) => {
      const data = Comments.insertMany([obj]);
      resolve(data);
    });
  };

  // // UPDATE COMMENTS
  public _update = async (query, obj) => {
    return new Promise((resolve, reject) => {
      const data = Comments.updateOne(query, obj);
      resolve(data);
    });
  };

  // // DELETE COMMENTS
  public _delete = async (query) => {
    return new Promise<IComments>((resolve, reject) => {
      const data = Comments.findOneAndRemove(query);
      resolve(data);
    });
  };
}

export default TaskCommentsService;
