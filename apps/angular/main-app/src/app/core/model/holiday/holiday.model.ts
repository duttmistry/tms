export interface IHolidayDataModel {
  title: string;
  fromDate: string;
  toDate: string;
  month: string;
  year: string;
}
export interface IHolidayData {
  id: number;
  month: string;
  festivalDate: string;
  festivalName: string;
  day: string;
}

export interface IHolidayResponseModel {
  holiday_date: string;
  id: number;
  isHoliday: boolean;
  title: string;
}
