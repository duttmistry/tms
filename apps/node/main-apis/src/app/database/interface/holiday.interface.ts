export interface iHoliday {
  id?: number;
  title: string;
  holiday_date: Date;
  isHoliday: boolean;
}

export interface iHrmsHoliday {
  id?: number;
  title: string;
  startDate: Date;
  isHoliday: boolean;
}
