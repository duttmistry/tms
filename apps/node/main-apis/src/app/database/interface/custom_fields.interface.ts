import { iProjectCustomFieldsMapping } from "./projects.interface";

export interface iCustomFields {
  id?: number;
  fieldType: string;
  label: string;
  identifier: string;
  type: string;
  options: Array<object>;
  is_required: boolean;
  is_active: boolean;
  created_by: number;
  updated_by: number;
  projectCustomFields?: Array<iProjectCustomFieldsMapping>;
}