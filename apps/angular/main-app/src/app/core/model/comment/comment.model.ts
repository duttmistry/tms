import { ORDER_BY_DESC_VALUE, SORT_BY_ID_VALUE } from '../../services/common/constants';

export interface PostCommentRequestModel {
  task_id: string | null;
  commentsList: commentModel[];
}

export interface commentModel {
  comments: string;
  mention_users: MentionUserModel[];
}

export interface UpdateCommentRequestModel {
  comments: string;
  mention_users: MentionUserModel[];
}

export interface MentionUserModel {
  id: string;
  user_name: string;
}

export interface CommentObjectModel {
  comments?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  mention_users?: MentionUserModel[];
  task_id?: number;
  updatedAt?: string;
  user_id?: number;
  user_name?: string;
  user_profile?: string;
  _id?: string;
  isCommentEditable?: boolean;
  name?: string;
  avatar?: string;
  id?: number;
  commentedOn?: string;
  commentedOnTime?: string;
  isCommentEdited?: boolean;
  userDataReBind?: any;
}

export class GetCommentRequestModel {
  task_id!: string;
  orderby = ORDER_BY_DESC_VALUE;
  sortby = SORT_BY_ID_VALUE;
}
