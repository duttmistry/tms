export interface iSiteSetting {
  id: number;
  name: string;
  value: string;
  identifier: string;
  field_type: string;
  module: string;
  description: string;
  default_value: string;
}

export interface iSiteSettingMulti {
  module: string;
  fields: {
    id: number;
    name: string;
    value: string;
    identifier: string;
    field_type: string;
    description: string;
    default_value: string;
  }[];
}
