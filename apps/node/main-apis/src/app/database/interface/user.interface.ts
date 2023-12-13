import { Request } from 'express';

import { iLeaveHistory } from './leave.interface';

export interface iUserEmail {
  email: string;
  type: string;
}

export interface iUserAddress {
  present_street_line_1: string;
  present_street_line_2: string;
  present_area: string;
  present_city: string;
  present_state: string;
  present_country: string;
  present_zipcode: string;
}

export interface iUserEducation {
  education_type: string;
  course_name: string;
  institute_name: string;
  percentage: string;
  passing_year: string;
}

export interface iUserCertificates {
  course_name: string;
  certificate_url: string;
  institute_name: string;
  skills: string;
  certificate_file: string;
}

export interface iUserTeamLead {
  first_name: string;
  last_name: string;
  employee_image: string;
  designation: string;
}

export interface iUserProjectManager {
  first_name: string;
  last_name: string;
  employee_image: string;
  designation: string;
}

export interface iUserworkDetails {
  joiningDate: Date;
  reJoiningDate: Date;
  relievingDate: Date;
  productionDate: Date;
}

export interface iUserExperince {
  designation: string;
  from: Date;
  to: Date;
  reasonForJobChange: number;
  companyName: string;
  technologies: Array<string>;
}

export interface iUserLog {
  id: number;
  action: string;
  action_by: number;
  action_start_date: Date;
  action_end_date: Date;
  user_id: number;
  login_capture_data: string;
  logout_capture_data: string;
  sessionid: string;
  reason: string;
  time: string;
}

export interface iUserRoles {
  id?: number;
  title: string;
  permission: object;
}
export interface iUserWithRole {
  id: number;
  user_id: number;
  role_id: number;
  user_role?: iUserRoles;
}

export interface iUser {
  id?: number;
  first_name: string;
  last_name: string;
  emails: Array<iUserEmail>;
  contact_number: string;
  dob: Date;
  designation: string;
  team_lead: string;
  team_lead_name?: iUserTeamLead;
  project_manager: string;
  project_manager_name?: iUserProjectManager;
  production_date: Date;
  departments: string;
  technologies: string;
  employee_image: string;
  status: string;
  is_active: boolean;
  present_address: iUserAddress;
  education: Array<iUserEducation>;
  certificates: Array<iUserCertificates>;
  gender: string;
  marital_status: string;
  blood_group: string;
  employee_id: string;
  skype: string;
  linkedin: string;
  password: string;
  role: string;
  skill_description: string;
  user_with_role?: iUserWithRole;
  isAdmin?: boolean;
  leaveHistory?: Array<iLeaveHistory>;
  UsersTimeLog?: Array<iUserLog>;
  active_sessionid: string;
  cybercom_email: string;
  workdetails: iUserworkDetails;
  experience: Array<iUserExperince>;
  hierarchy?: Array<iUser>;
}

export interface iRequestWithUser extends Request {
  user: iUser;
}
