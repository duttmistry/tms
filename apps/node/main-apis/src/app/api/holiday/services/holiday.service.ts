import axios from 'axios';
import { iHoliday, iHrmsHoliday } from '../../../database/interface/holiday.interface';
import _DB from '../../../database/models';
import { Query } from '@tms-workspace/apis-core';
import { Op, WhereOptions, Sequelize, QueryTypes, literal } from 'sequelize';
import { developmentConstant, stagingConstant, productionConstant } from '@tms-workspace/configurations';
import * as Environment from '../../../../enviornment';
import moment from 'moment';
// initialize model & db connection
// const _DB = {
//   Holiday: HolidayModel(sequelize),
//   sequelize,
//   Sequelize,
// };

// Third Party Auth's Username & Password
// global variables
const _NODE_ENV = Environment.default.state || 'development';
// const _NODE_ENV = 'staging';
const _USERNAME =
  _NODE_ENV == 'development'
    ? developmentConstant.default.USERNAME
    : _NODE_ENV == 'staging'
    ? stagingConstant.default.USERNAME
    : productionConstant.default.USERNAME;
const _PASSWORD =
  _NODE_ENV == 'development'
    ? developmentConstant.default.PASSWORD
    : _NODE_ENV == 'staging'
    ? stagingConstant.default.PASSWORD
    : productionConstant.default.PASSWORD;

const _HRMSBASEURL =
  _NODE_ENV == 'development'
    ? developmentConstant.default.HRMSBASEURL
    : _NODE_ENV == 'staging'
    ? productionConstant.default.HRMSBASEURL
    : productionConstant.default.HRMSBASEURL;

const auth = {
  username: _USERNAME,
  password: _PASSWORD,
};

const holiday = _DB.Holiday;
const _sequelize = _DB.sequelize;

class HolidayService {
  // GET ALL HOLIDAY
  public _count = async (query: WhereOptions) => {
    return new Promise<number>((resolve, reject) => {
      const data = holiday.count({
        where: query,
      });
      resolve(data);
    });
  };

  public _allDatacount = async (where: any = {}) => {
    return new Promise<number>((resolve, reject) => {
      const query = `
  SELECT COUNT(*) AS total
  FROM (
    SELECT \`title\`, \`holiday_date\` as \`eventDate\`, \`isHoliday\`
    FROM \`tm_holidays\`
    WHERE (
      \`tm_holidays\`.\`deleted_at\` IS NULL
       ${where.month ? `AND ( MONTH(\`tm_holidays\`.\`holiday_date\`) = ${where.month})` : ``}
       ${where.year ? `AND (YEAR(\`tm_holidays\`.\`holiday_date\`) = ${where.year})` : ``} 
    )

    ${
      where.month
        ? `
    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`dob\` as \`eventDate\`, '2' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      ${where.month ? `AND ( MONTH(\`tm_users\`.\`dob\`) = ${where.month})` : ``}

    )

    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`production_date\` as \`eventDate\`, '3' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      ${where.month ? `AND ( MONTH(\`tm_users\`.\`production_date\`) = ${where.month})` : ``}
    )`
        : `
    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`dob\` as \`eventDate\`, '2' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
       ${where.year ? `AND (YEAR(\`tm_users\`.\`dob\`) = ${where.year})` : ``} 
    )

    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`production_date\` as \`eventDate\`, '3' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
       ${where.year ? `AND (YEAR(\`tm_users\`.\`production_date\`) = ${where.year})` : ``} 
    )`
    }
  ) AS results
    ${where.search != null && where.isHoliday != null ? `WHERE \`title\` LIKE` + where.search + `AND \`isHoliday\`= ` + where.isHoliday : ``}
    ${where.search != null ? `WHERE \`title\` LIKE` + where.search : ``}
    ${where.isHoliday != null ? `WHERE \`isHoliday\`= ` + where.isHoliday : ``};`;

      const data = _sequelize.query(query, { type: QueryTypes.SELECT }).then((res: any) => {
        return res[0].total;
      });

      resolve(data);
    });
  };

  // GET ALL HOLIDAY
  public _getAllHolidayData = async (where: any = {}, p = 0, l = 0, sortBy = 'eventDate', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: l,
      sortBy,
      orderBy,
    });

    return new Promise<object[]>((resolve, reject) => {
      // Create Custom Query for Get Holiday = 0, Special Day = 1, Birth Day = 2 & Work Aniversary = 3  DAY(\`eventDate\`) MONTH(\`eventDate\`)

      const query = `
  SELECT \`title\` as \`title\`,  CONCAT(${
    where.year
  }, '-', DATE_FORMAT(\`eventDate\`, '%m') , '-',DATE_FORMAT(\`eventDate\`, '%d')) AS \`eventDate\`, \`isHoliday\`
  FROM (
    SELECT \`title\`, \`holiday_date\` as \`eventDate\`, \`isHoliday\`
    FROM \`tm_holidays\`
    WHERE (
      \`tm_holidays\`.\`deleted_at\` IS NULL
       ${where.month ? `AND ( MONTH(\`tm_holidays\`.\`holiday_date\`) = ${where.month})` : ``}
       ${where.year ? `AND (YEAR(\`tm_holidays\`.\`holiday_date\`) = ${where.year})` : ``} 
    )
    ${
      where.month
        ? `
    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`dob\` as \`eventDate\`, '2' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      ${where.month ? `AND ( MONTH(\`tm_users\`.\`dob\`) = ${where.month})` : ``}

    )

    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`production_date\` as \`eventDate\`, '3' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      ${where.month ? `AND ( MONTH(\`tm_users\`.\`production_date\`) = ${where.month})` : ``}
    )`
        : `
    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`dob\` as \`eventDate\`, '2' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
    )

    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, \`production_date\` as \`eventDate\`, '3' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
    )`
    }
  ) AS results
    ${where.search != null && where.isHoliday != null ? `WHERE \`title\` LIKE` + where.search + `AND \`isHoliday\`= ` + where.isHoliday : ``}
    ${where.search != null ? `WHERE \`title\` LIKE` + where.search : ``}
    ${where.isHoliday != null ? `WHERE \`isHoliday\`= ` + where.isHoliday : ``}
    ${sortBy && orderBy ? `ORDER BY ${sortBy} ${orderBy}` : ``}
    ${limit > 0 ? `LIMIT` + limit : ``}
    ${offset > 0 ? `OFFSET` + offset : ``}
  ;
`;
      const data = _sequelize.query(query, { type: QueryTypes.SELECT }).then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  // GET ALL HOLIDAY
  public _getAllData = async (query: WhereOptions = {}, p = 0, l = 0, sortBy = 'id', orderBy = 'asc') => {
    const { offset, limit, order } = Query.getQuery({
      page: p,
      limit: Number(l),
      sortBy,
      orderBy,
    });

    return new Promise<iHoliday[]>((resolve, reject) => {
      const data = holiday
        .findAll({
          where: query,
          limit: limit > 0 ? limit : null,
          offset: offset > 0 ? offset : null,
          order,
        })
        .then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };

  // GET SINGLE HOLIDAY
  public _getSingleData = async (query: WhereOptions) => {
    return new Promise<iHoliday>((resolve, reject) => {
      const data = holiday.findOne({
        where: query,
      });
      resolve(data);
    });
  };

  // CREATE HOLIDAY
  public _create = async (obj) => {
    return new Promise<iHoliday>((resolve, reject) => {
      const data = holiday.create(obj);
      resolve(data);
    });
  };

  // UPDATE HOLIDAY
  public _update = async (query: WhereOptions, obj) => {
    return new Promise((resolve, reject) => {
      const data = holiday.update(obj, { where: query });
      resolve(data);
    });
  };

  // DELETE HOLIDAY
  public _delete = async (query: WhereOptions) => {
    return new Promise((resolve, reject) => {
      const data = holiday.destroy({ where: query });
      resolve(data);
    });
  };

  public _getSyncHoliday = async () => {
    return new Promise<iHrmsHoliday[]>((resolve, reject) => {
      console.log('_HRMSBASEURL', _HRMSBASEURL);

      const response = axios
        .get(
          `${_HRMSBASEURL}/holidaysync`,
          /* 'http://localhost:3007/EmployeeSyncToTMS' */ {
            auth,
          }
        )
        .then((res) => {
          return JSON.parse(JSON.stringify(res.data.data));
        });
      resolve(response);
    });
  };

  // Get All User Data
  public _getAllHoliday = async () => {
    return new Promise<iHoliday[]>((resolve, reject) => {
      const OldHoliday = holiday.findAll({}).then((res) => {
        return JSON.parse(JSON.stringify(res));
      });

      resolve(OldHoliday);
    });
  };

  // Get Create Holiday Data
  public _createAllHoliday = async (HolidayData: iHoliday[]) => {
    return new Promise<iHoliday[]>((resolve, reject) => {
      const holidayResponse = holiday.bulkCreate(HolidayData, { updateOnDuplicate: ['id', 'title', 'holiday_date', 'isHoliday'] });

      resolve(holidayResponse);
    });
  };

  // Update User
  public _updateHoliday = async (HolidayData: iHoliday) => {
    return new Promise((resolve, reject) => {
      const Holidaydate = moment(HolidayData.holiday_date).format('YYYY-MM-DD');

      const res = holiday.update(HolidayData, {
        where: {
          [Op.or]: [{ title: HolidayData.title }, literal(`DATE(holiday_date) = '${Holidaydate}'`)],
        },
      });
      resolve(res);
    });
  };

  public _deleteHoliday = async (HolidayData: iHoliday) => {
    return new Promise((resolve, reject) => {
      const Holidaydate = moment(HolidayData.holiday_date).format('YYYY-MM-DD');

      const res = holiday.destroy({
        where: {
          [Op.or]: [{ title: HolidayData.title }, literal(`DATE(holiday_date) = '${Holidaydate}'`)],
        },
      });
      resolve(res);
    });
  };

  public _getDashBoardRemindersCount = async (where: any = {}) => {
    return new Promise<number>((resolve, reject) => {
      const query = `
  SELECT COUNT(*) AS total
  FROM (
    SELECT \`title\`, \`holiday_date\` as \`eventDate\`, \`isHoliday\`
    FROM \`tm_holidays\`
    WHERE ( \`tm_holidays\`.\`deleted_at\` IS NULL AND \`tm_holidays\`.\`holiday_date\` )
    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, DATE_FORMAT(CONCAT(YEAR(CURRENT_DATE), '-', MONTH(\`dob\`), '-', DAY( \`dob\`)), '%Y-%m-%d') as \`eventDate\`, '2' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE (\`tm_users\`.\`deleted_at\` IS NULL )
    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`, DATE_FORMAT(CONCAT(YEAR(CURRENT_DATE), '-', MONTH(\`production_date\`), '-', DAY(\`production_date\`)), '%Y-%m-%d')  as \`eventDate\`, '3' AS \`isHoliday\`
    FROM \`tm_users\`
    WHERE ( \`tm_users\`.\`deleted_at\` IS NULL) 
  ) AS results WHERE \`results\`.\`eventDate\` BETWEEN '${where.todayDate}' AND '${where.weekDate}'`;

      const data = _sequelize.query(query, { type: QueryTypes.SELECT }).then((res: any) => {
        return res[0].total;
      });

      resolve(data);
    });
  };

  // GET ALL DATA FOR DASHBOARD REMINDERS
  public _getDashBoardRemindersData = async (where: any = {}) => {
    return new Promise<object[]>((resolve, reject) => {
      // Create Custom Query for Get Holiday = 0, Special Day = 1, Birth Day = 2 & Work Aniversary = 3  DAY(\`eventDate\`) MONTH(\`eventDate\`)

      const query = `
  SELECT \`title\` as \`title\`, \`eventDate\`, \`isHoliday\`,\`employee_image\`, \`designation\`
  FROM (
    SELECT \`title\`, \`holiday_date\` as \`eventDate\`, \`isHoliday\`,'null' AS \`employee_image\`, 'null' AS\`designation\`
    FROM \`tm_holidays\`
    WHERE (
      \`tm_holidays\`.\`deleted_at\` IS NULL )

    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`,DATE_FORMAT(CONCAT(YEAR(CURRENT_DATE), '-', MONTH(\`dob\`), '-', DAY( \`dob\`)), '%Y-%m-%d') as \`eventDate\`, '2' AS \`isHoliday\`, \`employee_image\`, \`designation\`  FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
            AND \`tm_users\`.\`first_name\` IS NOT NULL
      AND  \`tm_users\`.\`last_name\` IS NOT NULL
      AND \`tm_users\`.\`is_active\` = 1
      )

    UNION ALL 
    SELECT CONCAT(\`first_name\`, ' ', \`last_name\`) as \`title\`,DATE_FORMAT(CONCAT(YEAR(CURRENT_DATE), '-', MONTH(\`production_date\`), '-', DAY( \`production_date\`)), '%Y-%m-%d') as \`eventDate\`,'3' AS \`isHoliday\`, \`employee_image\`, \`designation\`
    FROM \`tm_users\`
    WHERE (
      \`tm_users\`.\`deleted_at\` IS NULL
      AND \`tm_users\`.\`first_name\` IS NOT NULL
      AND  \`tm_users\`.\`last_name\` IS NOT NULL
      AND \`tm_users\`.\`is_active\` = 1
  ) )AS results WHERE \`results\`.\`eventDate\` BETWEEN '${where.todayDate}' AND '${where.weekDate}' ORDER BY \`eventDate\` ;`;
      const data = _sequelize.query(query, { type: QueryTypes.SELECT }).then((res) => JSON.parse(JSON.stringify(res)));
      resolve(data);
    });
  };
}

export default HolidayService;
