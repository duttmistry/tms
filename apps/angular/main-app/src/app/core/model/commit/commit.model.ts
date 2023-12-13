import { ORDER_BY_DESC_VALUE, SORT_BY_ID_VALUE } from '../../services/common/constants';
import { MentionUserModel } from '../comment/comment.model';

export interface PostCommitRequestModel {
  task_id: number | string;
  commitList: CommitListModel[];
}

export interface UpdateCommitRequestModel {
  task_id: number | string;
  commits: string;
  mention_users: MentionUserModel[];
}

export interface CommitListModel {
  commits: string;
  mention_users: MentionUserModel[];
}

export interface commitObjectModel {
  commits: any[];
  created_at: string;
  createdAt?: string;
  updated_at?: string;
  task_id: number;
  updatedAt: string;
  user_id: number;
  user_name: string;
  user_profile: string;
  _id: string;
  isCommitEditable?: boolean;
  mention_users?: MentionUserModel[];
  name?: string;
  avatar?: string;
  id?: number;
  commentedOn?: string;
  commentedOnTime?: string;
  isCommitEdited?: boolean;
}

export interface PostCommitResponseModel {
  data: commitObjectModel[];
  message: string;
  status: number;
  success: boolean;
}

export interface deleteCommitResponseModel {
  message: string;
  status: number;
  success: boolean;
}

export interface UpdateCommitResponseModel {
  data: any;
  message: string;
  status: number;
  success: boolean;
}

export interface CommitListResponseModel {
  data: {
    currentPage: number;
    limit: number;
    commits: commitObjectModel[];
    totalPages: number;
    totalRecords: number;
  };
  message: string;
  status: number;
  success: boolean;
}

export class GetCommitListRequestModel {
  task_id!: string;
  page = 1;
  limit = 10;
  orderby = ORDER_BY_DESC_VALUE;
  sortby = SORT_BY_ID_VALUE;
}
