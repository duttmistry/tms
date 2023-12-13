import { iUser } from './user.interface';
import { AfterContentInit } from '@angular/core';
import { Leave_Manual_Enum, Leave_Type } from '@tms-workspace/enum-data';

export interface iLeaveHistoryLeaveType {
  id?: number;
  leave_history_id: number;
  user_id: number;
  leave_type: Leave_Type;
  leave_days: number;
}

export interface iLeaveHistoryLogUpdatedValue {
  key: string;
  oldValue: string;
  newValue: string;
}

export interface iLeaveHistoryLog {
  id?: number;
  user_id: number;
  leave_history_id: number;
  action: string;
  action_by: number;
  updated_values: Array<iLeaveHistoryLogUpdatedValue>;
}

export interface iLeaveSubjects {
  id?: number;
  title: string;
}

export interface iLeaveApproval {
  id?: number;
  leave_history_id: number;
  status: string;
  user_id: number;
  action_comment: string;
  type: string;
}

export interface iLeaveBalance {
  id?: number;
  user_id?: number;
  user?: iUser;
  leave_type: Leave_Type;
  current_balance: number;
  applied_balance: number;
  reserved_balance: number;
}

export interface iLeaveTransectionHistory {
  id?: number;
  user_id: number;
  leave_type: Leave_Type;
  credit: number;
  debit: number;
  after_balance: number;
  remarks: string;
  created_by: number;
  created_date: Date;
}

export interface iLeaveOpeningBalance {
  id?: number;
  user_id: number;
  leave_type: Leave_Type;
  opening_balance: number;
  closing_balance: number;
  month: string;
  year: number;
}

export interface iLeaveManualUpdatelog {
  id?: number;
  year: number;
  month: string;
  status: Leave_Manual_Enum;
  draft_date: Date;
  final_save_date: Date;
  created_by: number;
  updated_by: number;
  createdBy?: iUser;
  updatedBy?: iUser;
}

export interface iLeaveManualUpdateDraftData {
  id?: number;
  leave_manual_log_id: number;
  year: number;
  month: string;
  user_id: number;
  leave_type: Leave_Type;
  leave_opening: number;
  leave_used: number;
  leave_added: number;
  leave_current: number;
  comments: string;
  created_by: number;
  updated_by: number;
  userDetails?: iUser;
}

export interface iLeaveManualUpdateDraftResponseData {
  id?: number;
  first_name: string;
  last_name: string;
  designation: string;
  opening_CL: number;
  opening_PL: number;
  used_CL: number;
  used_PL: number;
  added_CL: number;
  added_PL: number;
  current_CL: number;
  current_PL: number;
  new_balance_CL: number;
  new_balance_PL: number;
  comments: string;
}

export interface iLeaveDocuments {
  path: string;
  size: number;
}

export interface iLeaveHistory {
  id?: number;
  user_id: number;
  requested_date: Date;
  from_date: Date;
  leave_from_slot: string;
  to_date: Date;
  leave_to_slot: string;
  no_of_days: number;
  leave_subject: number;
  leave_subject_text: string;
  description: string;
  attachments: Array<iLeaveDocuments>;
  status: string;
  approved_required_from: Array<number>;
  approved_by: Array<number>;
  leave_type: Leave_Type;
  comments: string;
  leaveTypes?: iLeaveHistoryLeaveType[];
  user?: iUser;
  leaveApproval?: Array<iLeaveApproval>;
  isSandwichLeave: boolean;
  sandwich_from_date: Date;
  sandwich_to_date: Date;
}
