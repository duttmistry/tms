import * as moment from 'moment';

export class Utility {
  static stateList = [
    {
      color: '#5c5c5c',
      title: 'To Do',
      value: 'todo',
    },
    {
      color: '#0052cc',
      title: 'In Progress',
      value: 'inprogress',
    },
    {
      color: '#f7a02f',
      title: 'On Hold',
      value: 'onhold',
    },
    {
      color: '#5ead56',
      title: 'Completed',
      value: 'completed',
    },
  ];
  private static taskLabelColors = [
    { color: '#6B0077', bgColor: '#E6D4E8' },
    { color: '#7D0112', bgColor: '#EAD7D8' },
    { color: '#2D3184', bgColor: '#DFDFEC' },
    { color: '#006E37', bgColor: '#D8E9E1' },
    { color: '#D33F6A', bgColor: '#F6D5DE' },
    { color: '#72008D', bgColor: '#ECDBF0' },
    { color: '#A96C00', bgColor: '#F2E9D9' },
    { color: '#C85362', bgColor: '#F2D9DC' },
    { color: '#605F4C', bgColor: '#E7E7E4' },
    { color: '#0076A1', bgColor: '#D9EBF2' },
    { color: '#8B0069', bgColor: '#F3E5F0' },
    { color: '#B24B00', bgColor: '#FFDCC3' },
    { color: '#CC0000', bgColor: '#FFDEDE' },
    { color: '#806400', bgColor: '#FFF3C7' },
    { color: '#634C36', bgColor: '#E3D7CC' },
  ];
  static getLabelColorDetails() {
    const indexOfColor = Math.floor(Math.random() * 14);
    return this.taskLabelColors[indexOfColor];
  }

  static displayGreeting() {
    const currentTime = moment();
    const morningStart = moment('06:00:00', 'HH:mm:ss');
    const afternoonStart = moment('12:00:00', 'HH:mm:ss');
    const eveningStart = moment('17:00:00', 'HH:mm:ss');

    if (currentTime.isBetween(morningStart, afternoonStart)) {
      return 'Good Morning';
    } else if (currentTime.isBetween(afternoonStart, eveningStart)) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }
  // RegEx Patterns
  // static emailRegEx =
  //   /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  // static passwordRegEx = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/;

  // This code used for count total experience and ccc experience
  static calcaulateExp(workDetails: any, experience: any) {
    let exp: any = {
      totalExpYears: 0,
      totalExpMonths: 0,
      totalCCCYears: 0,
      totalCCCMonths: 0,
    };
    const experienceArr = experience;
    const cccExperienceArr = workDetails;
    let totalYears = exp.totalExpYears;
    let totalMonths = exp.totalExpMonths;
    let tempCCCYears = exp.totalCCCYears;
    let tempCCCMonths = exp.totalCCCMonths;

    if (experienceArr.length > 0) {
      for (let i = 0; i < experienceArr.length; i++) {
        let start = moment(experienceArr[i].from, 'YYYY-MM-01');
        let end = moment(experienceArr[i].to ? experienceArr[i].to : new Date(), 'YYYY-MM-01');
        let monthsCount = moment(end).diff(moment(start), 'months');
        monthsCount += 1;
        let floored = Math.floor(monthsCount / 12);
        let finalValue = monthsCount - floored * 12;
        totalYears = totalYears + floored;
        totalMonths = totalMonths + finalValue;
        if (totalMonths >= 12) {
          totalMonths = totalMonths - 12;
          totalYears = totalYears + 1;
        }
      }

      if (moment(new Date()).diff(moment(cccExperienceArr.joiningDate), 'days') > 0) {
        let cccstart = moment(new Date(cccExperienceArr.joiningDate), 'YYYY-MM');
        let cccend = moment(cccExperienceArr.relievingDate ? new Date(cccExperienceArr.relievingDate) : new Date(), 'YYYY-MM')
          .subtract(1, 'months')
          .endOf('month');
        let cccmonthCountRejoinCase = 0;
        if (cccExperienceArr.reJoiningDate) {
          let cccMid = moment(new Date(cccExperienceArr.reJoiningDate), 'YYYY-MM').subtract(1, 'months').endOf('month');

          let cccMidEnd = moment(new Date(), 'YYYY-MM').subtract(1, 'months').endOf('month');
          cccmonthCountRejoinCase += moment(cccMidEnd).diff(moment(cccMid), 'months');
        }

        let cccmonthsCount = moment(cccend).diff(moment(cccstart), 'months') + cccmonthCountRejoinCase;
        cccmonthsCount += 1;
        let cccfloored = Math.floor(cccmonthsCount / 12);
        let cccfinalValue = cccmonthsCount - cccfloored * 12;

        tempCCCYears = tempCCCYears + cccfloored;
        tempCCCMonths = tempCCCMonths + cccfinalValue;
      }

      let overallYears = totalYears + tempCCCYears;
      let overallMonths = totalMonths + tempCCCMonths;

      if (overallMonths >= 12) {
        overallMonths = overallMonths - 12;
        overallYears = overallYears + 1;
      }
      exp = { ...exp, overallYears, overallMonths };
      // exp.overallYears = overallYears;
      // exp.overallMonths = overallMonths;
      exp.totalExpYears = totalYears;
      exp.totalExpMonths = totalMonths;
      exp.totalCCCYears = tempCCCYears;
      exp.totalCCCMonths = tempCCCMonths;
    } else {
      if (moment(new Date()).diff(moment(cccExperienceArr.joiningDate), 'days') > 0) {
        let cccstart = moment(cccExperienceArr.joiningDate, 'YYYY-MM-01');
        let cccend = moment(cccExperienceArr.relievingDate ? cccExperienceArr.relievingDate : new Date(), 'YYYY-MM-01');
        let cccmonthCountRejoinCase = 0;
        if (cccExperienceArr.reJoiningDate) {
          let cccMid = moment(new Date(cccExperienceArr.reJoiningDate), 'YYYY-MM').subtract(1, 'months').endOf('month');

          let cccMidEnd = moment(new Date(), 'YYYY-MM').subtract(1, 'months').endOf('month');

          cccmonthCountRejoinCase += moment(cccMidEnd).diff(moment(cccMid), 'months');
        }

        let cccmonthsCount = moment(cccend).diff(moment(cccstart), 'months') + cccmonthCountRejoinCase;

        cccmonthsCount += 1;
        let cccfloored = Math.floor(cccmonthsCount / 12);
        let cccfinalValue = cccmonthsCount - cccfloored * 12;

        tempCCCYears = tempCCCYears + cccfloored;
        tempCCCMonths = tempCCCMonths + cccfinalValue;
      }

      let overallYears = totalYears + tempCCCYears;
      let overallMonths = totalMonths + tempCCCMonths;

      if (overallMonths >= 12) {
        overallMonths = overallMonths - 12;
        overallYears = overallYears + 1;
      }

      exp.totalExpYears = totalYears;
      exp.totalExpMonths = totalMonths;
      exp.totalCCCYears = tempCCCYears;
      exp.totalCCCMonths = tempCCCMonths;
    }

    return exp;
  }
}

// /^(?=.*[A-Z])[0-9a-zA-Z!@#$%^&*]{8,15}$/;
