import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import TaskCommitsService from '../services/task_commits.service';
import { Pagination } from '@tms-workspace/apis-core';
import TaskChangeLogService from '../services/task_change_log.service';
import { iRequestWithUserWithProfile } from '../../../database/interface/user.interface';
import { Encryption } from '@tms-workspace/';

class TaskCommitController {
  public taskCommitsService = new TaskCommitsService();
  public taskChangeLogService = new TaskChangeLogService();

  public getAllCommits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const data = await this.taskCommitsService._getSingleData({ task_id: task_id });
      if (!data) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound());
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(data));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public create = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const { task_id } = req.body;
      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const taskCommits = await this.taskCommitsService._getSingleData({ task_id: task_id });
      const reqData = [];
      let maxCommentId = 0;
      if (taskCommits&&taskCommits.commits.length>0) {
        maxCommentId = Math.max(...taskCommits.commits.map((e) => e.id));
      }
      for (const element of req.body.commitList) {
        maxCommentId = maxCommentId + 1;
        const obj = {
          ...element,
          id: maxCommentId,
          user_id: req.user.id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
          created_at: new Date(),
          updated_at: new Date(),
        };
        reqData.push(obj);
      }
      const commitData = taskCommits
        ? await this.taskCommitsService._update({ _id: taskCommits._id }, { task_id: task_id, commits: [...taskCommits.commits, ...reqData] })
        : await this.taskCommitsService._create({ task_id: task_id, commits: reqData });

        if (!commitData) {
          return res.status(500).json(APIResponseFormat._ResDataNotCreated('Commit'));
        } else {
          const logBody = {
            user_id: req.user.id,
            task_id:task_id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
            action: 'Commit Added',
          };
          await this.taskChangeLogService._create(logBody);
          const updatedData = await this.taskCommitsService._getSingleData({ task_id: task_id });
          return res.status(201).json(APIResponseFormat._ResDataCreated('Commit', updatedData));
          // return res.status(201).json(APIResponseFormat._ResDataCreated('Commit',commitData));
        }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  
  public getSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      const id = Encryption._doDecrypt(req.headers.id as string);
      if (!id && !task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }

      const data = await this.taskCommitsService._getSingleData({ task_id: task_id });

      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }
      const commits = data.commits.find((commit) => commit.id === Number(id));
      return res.status(200).json(APIResponseFormat._ResDataFound(commits));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public update = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const { commits } = req.body;
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      const id = Encryption._doDecrypt(req.headers.id as string);

      if (!commits || !id || !task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const taskCommits = await this.taskCommitsService._getSingleData({ task_id: task_id });
      const updatedCommits=taskCommits.commits.map((commit)=>{
        if(commit.id===Number(id)){
          const updetedCommit={...commit,...req.body,updated_at: new Date()}
          return updetedCommit;
        }else{
          return commit;
        }
      })
      const data=await this.taskCommitsService._update({ _id: taskCommits._id }, {commits: updatedCommits })
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Commit'));
      } else {
        const logBody = {
          user_id: req.user.id,
          task_id: task_id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
          action: 'Commit Edited',
        };
        await this.taskChangeLogService._create(logBody);
        const updatedData = await this.taskCommitsService._getSingleData({ task_id: task_id });
        const commit = updatedData.commits.find((commit) => commit.id === Number(id));
        return res.status(200).json(APIResponseFormat._ResDataUpdated('Commit', commit));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public delete = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      const id = Encryption._doDecrypt(req.headers.id as string);

      if (!id && !task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }

      const taskCommits = await this.taskCommitsService._getSingleData({ task_id: task_id });
      const updatedCommits=taskCommits.commits.filter((commit)=>commit.id!==Number(id))
      const data=await this.taskCommitsService._update({ _id: taskCommits._id }, {commits: updatedCommits })

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Commit'));
      } else {
        const logBody = {
          task_id: task_id,
          user_id: req.user.id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
          action: 'Commit Deleted',
        };
        await this.taskChangeLogService._create(logBody);
        return res.status(200).json(APIResponseFormat._ResDataDeleted('Commit'));
      }
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  
}

export default TaskCommitController;
