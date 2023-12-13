import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import TaskCommentsService from '../services/task_comments.service';
import TaskChangeLogService from '../services/task_change_log.service';
import { iRequestWithUserWithProfile } from '../../../database/interface/user.interface';
import { Encryption } from '@tms-workspace/';
import TaskService from '../services/task.service';
import { eventEmitterTask } from '@tms-workspace/preference';
class TaskCommentController {
  public taskCommentsService = new TaskCommentsService();
  public taskChangeLogService = new TaskChangeLogService();
  public taskService = new TaskService();
  public getAllComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      if (!task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const data = await this.taskCommentsService._getSingleData({ task_id: task_id });
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
      const taskComments = await this.taskCommentsService._getSingleData({ task_id: task_id });
      const reqData = [];
      let maxCommentId = 0;
      if (taskComments&&taskComments.comments.length>0) {
        maxCommentId = Math.max(...taskComments.comments.map((e) => e.id));
      }
      for (const element of req.body.commentsList) {
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
      const commentData = taskComments
        ? await this.taskCommentsService._update({ _id: taskComments._id }, { task_id: task_id, comments: [...taskComments.comments, ...reqData] })
        : await this.taskCommentsService._create({ task_id: task_id, comments: reqData });

      if (!commentData) {
        return res.status(500).json(APIResponseFormat._ResDataNotCreated('Comment'));
      } else {
        const logBody = {
          user_id: req.user.id,
          task_id: task_id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
          action: 'Comment Added',
        };
        await this.taskChangeLogService._create(logBody);
        let task = await this.taskService._getTasksById({ id: task_id });
        task = JSON.parse(JSON.stringify(task));

        let taskDetails = await this.taskService._getTasksById({ id: parseInt(task_id) });
        taskDetails = JSON.parse(JSON.stringify(task));
        console.log('taskDetails.subscribers: ', taskDetails.subscribers);

        const mentioned_users = req.body.commentsList[0].mention_users;
        const mentionedUserIds = mentioned_users.map(user => user.id);
        console.log('mentionedUserIds: ', mentionedUserIds);
        let notifySubscribers = mentioned_users.filter(user => !taskDetails.subscribers.includes(Number(user.id)));
        notifySubscribers = notifySubscribers.map(user =>user.id)
        console.log('notifySubscribers: ', notifySubscribers);

        const mentionUsers = [];
        const mentionUsersString = [];
        if (mentioned_users.length > 0) {
          mentioned_users.map((item) => mentionUsersString.push(item.id));
        }

        if (mentioned_users.length > 0) {
          mentioned_users.map((item) => mentionUsers.push(parseInt(item.id)));
        }
       
        const combinedArray = taskDetails.subscribers.concat(mentionUsers);
        const uniqueArraySubscribers = [...new Set(combinedArray)];
        console.log('uniqueArraySubscribers: ', uniqueArraySubscribers);
        const Update_Task = await this.taskService._updateTasks({...taskDetails , subscribers : uniqueArraySubscribers }, { id: parseInt(task_id) });

        const data = {
          task_id: task.id,
          assigned_to: ['' + task.assignee],
          subscribers: task.subscribers.map((e) => '' + e) || [],
          reporting_person: ['' + task.reporter],
          task_title: task.title,
          projectId: '' + task.project_id,
          action_by: req.user.first_name + ' ' + req.user.last_name,
          action_by_profile: req.user.user_image,
          assigned_to_name: task.assigneeUser?.first_name + ' ' + task.assigneeUser?.last_name,
          assigned_by_name: req.user.first_name + ' ' + req.user.last_name,
          priority: task.priority,
          project_name: task.projects.name,
          due_date: task.due_date,
          subscribers_name: task.reportToUser?.first_name + ' ' + task.reportToUser?.last_name,
          comment : reqData[0].comments
        };

        eventEmitterTask.default.emit('notify_comment_added', data);
        if(notifySubscribers && notifySubscribers.length > 0){
          eventEmitterTask.default.emit('notify_subscriber_added' , {...data , subscribers : notifySubscribers});
        }
        const updatedData = await this.taskCommentsService._getSingleData({ task_id: task_id });
        return res.status(201).json(APIResponseFormat._ResDataCreated('Comment', updatedData));
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

      const data = await this.taskCommentsService._getSingleData({ task_id: task_id });

      if (!data) {
        return res.status(404).json(APIResponseFormat._ResDataNotFound());
      }
      const comment = data.comments.find((comment) => comment.id === Number(id));
      return res.status(200).json(APIResponseFormat._ResDataFound(comment));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public update = async (req: iRequestWithUserWithProfile, res: Response, next: NextFunction) => {
    try {
      const { comments } = req.body;
      const task_id = Encryption._doDecrypt(req.headers.task_id as string);
      const id = Encryption._doDecrypt(req.headers.id as string);

      if (!comments || !id || !task_id) {
        return res.status(409).json(APIResponseFormat._ResMissingRequiredField());
      }
      const taskComments = await this.taskCommentsService._getSingleData({ task_id: task_id });
      const updatedComments=taskComments.comments.map((comment)=>{
        if(comment.id==Number(id)){
          const updetedComment={...comment,...req.body,updated_at: new Date()}
          return updetedComment;
        }else{
          return comment;
        }
      })
      const data=await this.taskCommentsService._update({ _id: taskComments._id }, {comments: updatedComments })
      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotUpdated('Comment'));
      } else {
        const logBody = {
          user_id: req.user.id,
          task_id: task_id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
          action: 'Comment Edited',
        };
        await this.taskChangeLogService._create(logBody);
        const updatedData = await this.taskCommentsService._getSingleData({ task_id: task_id });
        const comment = updatedData.comments.find((comment) => comment.id === Number(id));
        return res.status(200).json(APIResponseFormat._ResDataUpdated('Comment', comment));
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

      const taskComments = await this.taskCommentsService._getSingleData({ task_id: task_id });
      const updatedComments=taskComments.comments.filter((comment)=>comment.id!==Number(id))
      const data=await this.taskCommentsService._update({ _id: taskComments._id }, {comments: updatedComments })

      if (!data) {
        return res.status(500).json(APIResponseFormat._ResDataNotDeleted('Comment'));
      } else {
        const logBody = {
          task_id: task_id,
          user_id: req.user.id,
          user_name: `${req.user.first_name} ${req.user.last_name}`,
          user_profile: req.user.user_image,
          action: 'Comment Deleted',
        };
        await this.taskChangeLogService._create(logBody);
        return res.status(200).json(APIResponseFormat._ResDataDeleted('Comment'));
      }

      // return res.status(200).json(APIResponseFormat._ResDataDeleted('Comment'));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
}

export default TaskCommentController;
