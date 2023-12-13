import { APIResponseFormat, Pagination } from '@tms-workspace/apis-core';
import { NextFunction, Request, Response } from 'express';
import { iRequestWithUser } from '../../../database/interface/user.interface';
import TaskReportService from '../services/tasks_reports.service';
import TaskTimeLogsService from '../../tasks/services/task_time_logs.service';
import UserService from '../../user/services/user.service';
import { iFreeUserReports, iLogoutUserReports, iTasksReports, iUserTasksReports } from '../../../database/interface/task_report.interface';
import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import * as excelJS from 'exceljs';
import readXlsxFile from 'read-excel-file/node';
import TaskService from '../../tasks/services/task.service';
import { FileService, MulterService, BasePath } from '@tms-workspace/file-upload';
import { developmentConfig } from '@tms-workspace/configurations';
class TaskReportController {
  public taskReportService = new TaskReportService();
  public taskTimeLogsService = new TaskTimeLogsService();
  public taskService = new TaskService();
  public userService = new UserService();

  public getUserTaskList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      let role = await this.taskReportService._getUserRole(req.user.id);
      role = JSON.parse(JSON.stringify(role));
      const result = await this.taskReportService._getRunningTaskReport(req.user.isAdmin, req.user.id, role.user_role.title);

      const modifidedResult = [];
      for (const user of result) {
        const typedUser = user as iTasksReports;
        // if(typedUser.role.trim().toLocaleLowerCase()==='super admin'){
        //   return
        // }
        const data = await this.taskTimeLogsService._getTaskHistoryData({ task_id: typedUser.task_id });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        let currentMillisecond = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
            currentMillisecond += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hoursTotal = Math.floor(totalSeconds / 3600);
        const minutesTotal = Math.floor((totalSeconds % 3600) / 60);
        //   const secondsTotal = totalSeconds % 60;
        const currentSeconds = Math.floor(currentMillisecond / 1000);
        const hoursCurrent = Math.floor(currentSeconds / 3600);
        const minutesCurrent = Math.floor((currentSeconds % 3600) / 60);
        //   const secondsCurrent = currentSeconds % 60;
        const modifideObject = {
          ...typedUser,
          total_time: `${hoursTotal.toString().padStart(2, '0')}h ${minutesTotal.toString().padStart(2, '0')}m`,
          currentTime: `${hoursCurrent.toString().padStart(2, '0')}h ${minutesCurrent.toString().padStart(2, '0')}m`,
        };
        modifidedResult.push(modifideObject);
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(modifidedResult));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getFreeUserList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      let role = await this.taskReportService._getUserRole(req.user.id);
      role = JSON.parse(JSON.stringify(role));
      const result = await this.taskReportService._getFreeUserReport(req.user.isAdmin, req.user.id, role.user_role.title);
      const modifidedResult = [];
      for (const user of result) {
        const typedUser = user as iFreeUserReports;
        // if(typedUser.role.trim().toLocaleLowerCase()==='super admin'){
        //   return
        // }
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to 00:00:00.000

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const data = await this.taskTimeLogsService._getTaskHistoryData({
          start_time: {
            $gte: today,
            $lt: tomorrow,
          },
          user_id: typedUser.user_id,
        });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hoursTotal = Math.floor(totalSeconds / 3600);
        const minutesTotal = Math.floor((totalSeconds % 3600) / 60);
        //   const secondsTotal = totalSeconds % 60;
        const modifideObject = {
          ...typedUser,
          total_time: `${hoursTotal.toString().padStart(2, '0')}h ${minutesTotal.toString().padStart(2, '0')}m`,
        };
        modifidedResult.push(modifideObject);
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(modifidedResult));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getLogoutUserList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      let role = await this.taskReportService._getUserRole(req.user.id);
      role = JSON.parse(JSON.stringify(role));
      const result = await this.taskReportService._getLogOutUserReport(req.user.isAdmin, req.user.id, role.user_role.title);
      const modifidedResult = [];
      for (const user of result) {
        const typedUser = user as iLogoutUserReports;
        // if(typedUser.role.trim().toLocaleLowerCase()==='super admin'){
        //   return
        // }
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to 00:00:00.000

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const data = await this.taskTimeLogsService._getTaskHistoryData({
          start_time: {
            $gte: today,
            $lt: tomorrow,
          },
          user_id: typedUser.user_id,
        });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hoursTotal = Math.floor(totalSeconds / 3600);
        const minutesTotal = Math.floor((totalSeconds % 3600) / 60);
        //   const secondsTotal = totalSeconds % 60;
        const modifideObject = {
          ...typedUser,
          total_time: `${hoursTotal.toString().padStart(2, '0')}h ${minutesTotal.toString().padStart(2, '0')}m`,
        };
        modifidedResult.push(modifideObject);
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(modifidedResult));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public getNotLoginUserList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      let role = await this.taskReportService._getUserRole(req.user.id);
      role = JSON.parse(JSON.stringify(role));
      const result = await this.taskReportService._getNotLoginUserReport(req.user.isAdmin, req.user.id, role.user_role.title);

      return res.status(200).json(APIResponseFormat._ResDataFound(result));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public getOnLeaveUserList = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      let role = await this.taskReportService._getUserRole(req.user.id);
      role = JSON.parse(JSON.stringify(role));
      const result = await this.taskReportService._getOnLeaveUserReport(req.user.isAdmin, req.user.id, role.user_role.title);
      return res.status(200).json(APIResponseFormat._ResDataFound(result));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  public ProjectWorkedReport = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, orderBy } = req.headers;
      const { projectIds, search, fromMonth, toMonth } = req.body;
      const searchText = search || '';
      // const permission = await this.permissionService._checkModulePermission(req.user.id, 'project', 'view');
      const fromDate = fromMonth ? moment(fromMonth, 'MM-YYYY').startOf('month').format('YYYY-MM-DDT24:00:00.000Z') : '';
      const toDate = fromMonth ? moment(toMonth, 'MM-YYYY').endOf('month').format('YYYY-MM-DDT24:00:00.000Z') : '';
      // if (!permission) {
      //   return res.status(403).json(APIResponseFormat._ResUnauthrized(403));
      // }

      const queryOptions = req.user.isAdmin
        ? projectIds && projectIds.length > 0
          ? { [Op.and]: [{ [Op.or]: [{ name: { [Op.like]: `%${searchText}%` } }] }, { id: { [Op.in]: projectIds } }] }
          : { [Op.and]: [{ [Op.or]: [{ name: { [Op.like]: `%${searchText}%` } }] }] }
        : projectIds && projectIds.length > 0
        ? {
            [Op.and]: [
              { [Op.or]: [{ name: { [Op.like]: `%${searchText}%` } }] },
              { id: { [Op.in]: projectIds } },
              {
                [Op.or]: [
                  { '$projectWorkspace.id$': null }, // If workspace is not available
                  { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
                ],
              },
              {
                [Op.or]: [
                  {
                    '$projectTeam.user_id$': req.user.id,
                  },
                  Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                ],
              },
            ],
          }
        : {
            [Op.and]: [
              { [Op.or]: [{ name: { [Op.like]: `%${searchText}%` } }] },
              {
                [Op.or]: [
                  { '$projectWorkspace.id$': null }, // If workspace is not available
                  { '$projectWorkspace.workspace.is_active$': true }, // If workspace is available and is_active is true
                ],
              },
              {
                [Op.or]: [
                  {
                    '$projectTeam.user_id$': req.user.id,
                  },
                  Sequelize.fn('JSON_CONTAINS', Sequelize.col('projectTeam.report_to'), Sequelize.cast(req.user.id, 'CHAR CHARACTER SET utf8')),
                ],
              },
            ],
          };
      const count = await this.taskReportService._getProjectsCountWorkReport(queryOptions);

      if (count < 1) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound([]));
      }

      const projects = await this.taskReportService._getAllProjectWorkReport(queryOptions, +page, +limit, sortBy as string, orderBy as string);
      const responseProjectData = [];
      for (const project of projects) {
        const data = await this.taskTimeLogsService._getTaskHistoryData({
          $and:
            fromDate == ''
              ? [{ project_id: project.id }]
              : [
                  { project_id: project.id },
                  {
                    $or: [
                      {
                        createdAt: {
                          $gte: fromDate,
                          $lte: toDate,
                        },
                      },
                      {
                        updatedAt: {
                          $gte: fromDate,
                          $lte: toDate,
                        },
                      },
                    ],
                  },
                ],
        });
        const currentTime = new Date();

        let totalMilliseconds = 0;
        for (const entry of data) {
          if (entry.end_time === null) {
            const startTime = new Date(entry.start_time);
            totalMilliseconds += currentTime.getTime() - startTime.getTime();
          } else {
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);
            totalMilliseconds += endTime.getTime() - startTime.getTime();
          }
        }

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        project['total_worked_hours'] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`;
        responseProjectData.push(project);
      }
      const { pageNumber, totalPages } = Pagination.pagination(page as string, limit as string, count);
      return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(responseProjectData, totalPages, limit as string, count, pageNumber));
      // return res.status(200).json(APIResponseFormat._ResDataFoundWithPagination(responseProjectData, 1, limit as string, 0, 1));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError());
    }
  };

  public getUserTaskReport = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const result = await this.taskReportService._getUserTaskReport(req.user.isAdmin, req.user.id);
      // const modifidedResult = [];
      const { project_id, start_date, end_date } = req.headers;
      let query: any = { project_id: project_id };

      if (start_date && start_date !== '') {
        const start_date_time: Date = new Date(start_date as string);
        const end_date_time: Date = new Date(end_date as string);

        query = {
          project_id: project_id,
          start_time: { $gte: start_date_time },
          end_time: { $lte: end_date_time },
        };
      }
      const data = await this.taskTimeLogsService._getTaskHistoryData(query);

      const userTotalTime = {};
      data.forEach((entry) => {
        const { user_id, start_time } = entry;
        const user_name = this.taskReportService._toUpperCamelCase(entry.user_name);
        let { end_time } = entry;
        if (end_time === null) {
          end_time = new Date();
        }
        const startTime = new Date(start_time);
        const endTime = new Date(end_time);
        const timeDiffMillis = endTime.getTime() - startTime.getTime();

        if (!userTotalTime[user_name]) {
          userTotalTime[user_name] = {
            user_id: user_id,
            user_name: user_name,
            total_time: 0,
          };
        }

        userTotalTime[user_name].total_time += timeDiffMillis;
      });

      // Convert total time to human-readable format (HH:MM:SS)
      for (const user in userTotalTime) {
        const totalMillis = userTotalTime[user].total_time;
        const hours = Math.floor(totalMillis / 3600000);
        const minutes = Math.floor((totalMillis % 3600000) / 60000);
        const seconds = Math.floor((totalMillis % 60000) / 1000);
        const totalTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        userTotalTime[user].total_time = totalTimeStr;
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(userTotalTime));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public getUserTaskReportExplore = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      // const result = await this.taskReportService._getUserTaskReport(req.user.isAdmin, req.user.id);
      // const modifidedResult = [];
      // const project_id = req.headers.project_id;
      // const user_id = req.headers.user_id;
      const { project_id, start_date, end_date, user_id } = req.headers;
      let query: any = { project_id: project_id, user_id: user_id };

      if (start_date && start_date !== '') {
        const start_date_time: Date = new Date(start_date as string);
        const end_date_time: Date = new Date(end_date as string);

        query = {
          project_id: project_id,
          user_id: user_id,
          start_time: { $gte: start_date_time },
          end_time: { $lte: end_date_time },
        };
      }
      let data = await this.taskTimeLogsService._getTaskHistoryData(query);
      data = JSON.parse(JSON.stringify(data));
      const fullDetails = [];
      for (const element of data) {
        const task = await this.taskService._getSingleTasks({ id: element.task_id });
        fullDetails.push({ ...element, task: task });
      }
      return res.status(200).json(APIResponseFormat._ResDataFound(fullDetails));
    } catch (error) {
      next(error);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };
  public getUserTaskReportExport = async (request) => {
    try {
      // const result = await this.taskReportService._getUserTaskReport(req.user.isAdmin, req.user.id);
      // const modifidedResult = [];
      const { projectId, toDate, fromDate } = request;
      let query: any = { project_id: projectId };

      if (toDate && toDate !== '') {
        const start_date_time: Date = new Date(fromDate as string);
        const end_date_time: Date = new Date(toDate as string);

        query = {
          project_id: projectId,
          start_time: { $gte: start_date_time },
          end_time: { $lte: end_date_time },
        };
      }
      let data = await this.taskTimeLogsService._getTaskHistoryData(query);
      data = JSON.parse(JSON.stringify(data));
      const finalData = {};
      for (const item of data) {
        const user_name = this.taskReportService._toUpperCamelCase(item.user_name);
        let task = await this.taskService._getSingleTasks({ id: item.task_id });
        task = JSON.parse(JSON.stringify(task));
        const itemData = { ...item, task: task };
        if (!finalData[user_name]) {
          finalData[user_name] = [];
        }
        finalData[user_name].push(itemData);
      }
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('TMS-User-Tasks-Report');

      // Loop through the data and add rows to the worksheet
      for (const person in finalData) {
        const tasks = finalData[person];
        if (tasks.length > 0) {
          worksheet.addRow([person]).eachCell((cell) => {
            cell.font = { bold: true };
          });
          // Set column headers
          const headerRow = worksheet.addRow(['Date', 'Title', 'Description', 'Person', 'Assigned by', 'Time']);
          headerRow.eachCell((cell) => {
            cell.font = { bold: true };
          });
          let totalsecondsAll = 0;
          for (const task of tasks) {
            const startDate = new Date(task.start_time);
            const startTime = new Date(task.start_time);

            const endTime = task.end_time ? new Date(task.end_time) : new Date();

            const totalMilliseconds = endTime.getTime() - startTime.getTime();
            const totalSeconds = Math.floor(totalMilliseconds / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const timeDifferenceFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
              .toString()
              .padStart(2, '0')}`;
            totalsecondsAll = totalsecondsAll + totalSeconds;
            worksheet.addRow([
              startDate.toLocaleDateString(),
              task.task.title,
              task.task.description,
              task.user_name,
              task.task.assignedByUser ? task.task.assignedByUser.first_name + ' ' + task.task.assignedByUser.last_name : '',
              timeDifferenceFormatted,
            ]);
          }
          const hours = Math.floor(totalsecondsAll / 3600);
          const minutes = Math.floor((totalsecondsAll % 3600) / 60);
          const seconds = totalsecondsAll % 60;
          const timeDifferenceFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
          worksheet.addRow([timeDifferenceFormatted]).eachCell((cell) => {
            cell.font = { bold: true };
          });
        }
      }
      const path = `TaskReport_${Date.now()}.xlsx`;

      await workbook.xlsx.writeFile(`${BasePath.default.TASK_REPORT_PATH}/${path}`);
      console.log(`Excel file "${path}" has been created.`);
      return { path: `uploads/taskReports/${path}` };
    } catch (error) {
      return error;
      // next(error);
      // return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
    }
  };

  // https://docs.google.com/spreadsheets/d/1rs8KPjH46_5I21xNvJH-rERA-LjLHHwqKMp6kNRsVc0/edit#gid=0 example

  // public getTimelineReporter = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
  //   try {

  //     const userId = req.user.id;
  //     const startDate = null;
  //     const endDate = null;
  //     const data: any = await this.taskReportService._getUserTimeLineReport(startDate, endDate);
  //     console.log('data: ', data);

  //     const new_date = [];
  //     const groupedData = [];

  //     data.forEach(item => {
  //         const userId = item.user_id;

  //         // Check if user is already in the groupedData array
  //         const userIndex = groupedData.findIndex(user => user.user_id === userId);

  //         if (userIndex === -1) {
  //             const newUser = {
  //                 first_name: item.first_name,
  //                 last_name: item.last_name,
  //                 user_id: userId,
  //                 actions: [],
  //             };
  //             groupedData.push(newUser);
  //         }

  //         const user = groupedData.find(user => user.user_id === userId);
  //         const date = moment(item.action_start_date).format('YYYY-MM-DD');
  //           const new_actions = {
  //             ...item,
  //             date: date,
  //             dayname: moment(date).format('dddd'),
  //             expectedHour: "8.30",
  //         }

  //         // Check if an object with the same date already exists in user.actions
  //         const isDuplicate = user.actions.some(existingAction => existingAction.date === new_actions.date);

  //         if (!isDuplicate) {
  //             user.actions.push(new_actions);
  //         }
  //     });

  //     const result = Object.values(groupedData);

  //     return res.status(200).json(APIResponseFormat._ResDataFound(result));
  //   } catch (err) {
  //     next(err);
  //     return res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
  //   }
  // };

  public getLeadDropDown = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data: any = await this.taskReportService._getLeadDropDown();
      
      data.forEach((element) => {
        element.report_to = element?.report_to?.split(',').map(Number);
        element.user_names = element?.user_names?.split(',').map(String);
      });
      
      for (let i=0; i<data.length; i++) {
        for (let j=i + 1; j<data.length; j++) {
            if (data[i].id === data[j]?.id){
                let newArray = data[i]?.report_to?.concat(data[j]?.report_to);
                newArray = [... new Set(newArray)];
                let newArrayUserName = data[i]?.user_names?.concat(data[j]?.user_names);
                newArrayUserName = [... new Set(newArrayUserName)];
                data[i].report_to = newArray;
                data[j].report_to = newArray;
                data[i].user_names = newArrayUserName;
                data[j].user_names = newArrayUserName;
            }
        }
      }
    
      const groupedDataMap = new Map();
 
      for (const item of data) {
          const userId = item.id;
          if (!groupedDataMap.has(userId) && userId != null) {
                 groupedDataMap.set(userId, item);
           }
      }

      const groupedData = Array.from(groupedDataMap.values());

      if (!data) {
        return res.status(200).json(APIResponseFormat._ResDataNotFound());
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(groupedData));
    } catch (err) {
      next(err);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
    }
  };

  public getTimelineReporter = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const lead = req.body;

      let startDate: any = req.query.startDate;
      startDate = startDate ? moment(startDate, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss') : null; // Get startDate from query parameters
      let endDate: any = req.query.endDate; // Get endDate from query parameters
    
      endDate = endDate ? moment(endDate, 'DD/MM/YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss') : null;
    
      // endDate = endDate ? moment(endDate, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss') : null;
      const user_Id: any = req.query.userIDs ? req.query.userIDs : '';
      const userIDs: any = req.query.userIDs ? JSON.parse(user_Id || '') : '';

      let dailyHours: any = await this.taskReportService.getDailyHours();
      dailyHours = JSON.parse(JSON.stringify(dailyHours[0].value));

      const timeInMinutes = moment.duration(dailyHours).asMinutes();

      const calculateExpectedHour = (leaveData, userId, date) => {
        const userLeaveData = leaveData.filter((leave) => leave.user_id === userId);
        const dateMoment = moment(date);

        for (const leaveInfo of userLeaveData) {
          const leaveStartDate = moment(leaveInfo.from_date);
          const leaveEndDate = moment(leaveInfo.to_date);

          if (leaveStartDate.isSame(leaveEndDate, 'day') && leaveInfo.no_of_days === 1 && dateMoment.isSame(leaveStartDate, 'day')) {
            // Full day leave
            return 0;
          } else if (leaveStartDate.isSame(leaveEndDate, 'day') && leaveInfo.no_of_days === 0.5 && dateMoment.isSame(leaveStartDate, 'day')) {
            // Half day leave
            return 270;
          } else if (leaveInfo.no_of_days === 1.5) {
            // One whole day and half day
            if (dateMoment.isSame(leaveStartDate, 'day')) {
              return 0; // Whole day
            } else {
              return 270; // Half day
            }
          }
          // add one more condition for if there is 3 days leave and the date is in between that 3 days then return 0;
          else if (dateMoment.isBetween(leaveStartDate, leaveEndDate, 'day', '[]')) {
            return 0;
          }
        }

        return timeInMinutes; // Other cases
      };

      let finalresult;
      // when userIDs Lenght is > 0 ;
      if (userIDs.length > 0) {
        const data: any = await this.taskReportService._getUserTimeLineReport(startDate, endDate, userIDs);
        const leaveData: any = await this.taskReportService._getAllApprovedLeaves(startDate, endDate, userIDs);

        const groupedDataMap = new Map();
        for (const item of data) {
          const userId = item.id;
          if (!groupedDataMap.has(userId) && userId != null) {
            groupedDataMap.set(userId, {
              first_name: item.first_name,
              last_name: item.last_name,
              user_id: userId,
              actions: [],
            });
          }

          const user = groupedDataMap.get(userId);
          const date = item?.action_start_date ? moment(item.action_start_date).format('YYYY-MM-DD') : '';
          const startTime = moment(item.action_start_date).format('LT');
          const timeSpent = moment(item.action_end_date).diff(moment(item.action_start_date), 'minutes');
          const time = moment(item.time, 'H:mm');
          const minutes = time.minutes() + time.hours() * 60;

          let existingAction = user?.actions?.find((action) => action.date === date && date);

          if (!existingAction) {
            // Check if the day is not Saturday (6) or Sunday (0)
            if (moment(date).day() !== 0 && moment(date).day() !== 6 && date) {
              existingAction = {
                date: date,
                dayname: moment(date).format('dddd'),
                // expectedHour: 8 * 60 + 30,
                expectedHour: calculateExpectedHour(leaveData, userId, date),
                actions: [],
                breakTimeCount: 0,
              };
              user?.actions?.push(existingAction);
            }
          }

          // Check if the day is not Saturday (6) or Sunday (0)
          if (moment(date).day() !== 0 && moment(date).day() !== 6 && date) {
            existingAction?.actions.push({
              ...item,
              timeSpent: timeSpent,
              start_time: startTime,
              time: minutes,
            });

            if (item.action === 'BREAK_TIME') {
              existingAction.breakTimeCount = (existingAction.breakTimeCount || 0) + 1;
            }
          }
        }

        const groupedData = Array.from(groupedDataMap.values());

        for (const user of groupedData) {
          const breakTimeCounts = user?.actions?.map((day) => day?.actions.filter((action) => action.action === 'BREAK_TIME').length);

          const totalBreakTimeCounts = breakTimeCounts.reduce((total, count) => total + count, 0);
          const averageBreakTimeCount = breakTimeCounts.length > 0 ? Math.round(totalBreakTimeCounts / breakTimeCounts.length) : 0;

          user.averageBreakTimeCount = averageBreakTimeCount;

          const totalWorkedTimes = [];

          for (const day of user.actions) {
            const totalWorkedTime = day.actions
              .filter((action) => ['LOGIN', 'LOGOUT', 'BACK_FROM_BREAK'].includes(action.action))
              .reduce((total, action) => total + (action.timeSpent || 0), 0);

            const manual_time_add = day.actions.filter((action) => ['MANUAL_TIME_ADD'].includes(action.action));

            const manual_time_remove = day.actions.filter((action) => ['MANUAL_TIME_REMOVE'].includes(action.action));

            let manual_time_add_sum = 0;
            for (let i = 0; i < manual_time_add.length; i++) {
              manual_time_add_sum += manual_time_add[i].time;
            }

            let manual_time_remove_sum = 0;
            for (let i = 0; i < manual_time_remove.length; i++) {
              manual_time_remove_sum += manual_time_remove[i].time;
            }

            day.adjustment = manual_time_add_sum - manual_time_remove_sum;
            day.totalTimeSpent = totalWorkedTime + day.adjustment;
            // HALF DAY LOGIC
            const isHalfDayLeave = calculateExpectedHour(leaveData, user.user_id, day.date) === 270;

            if (isHalfDayLeave) {
              totalWorkedTimes.push(timeInMinutes);
            } else {
              totalWorkedTimes.push(day.totalTimeSpent);
            }

            // Replace null values with 0 when calculating total break time
            const totalBreakTime = day.actions
              .filter((action) => action.action === 'BREAK_TIME')
              .reduce((total, action) => total + (action.timeSpent || 0), 0);

            day.totalBreakTime = totalBreakTime;

            if (isHalfDayLeave) {
              day.deviation = 270 - day.totalTimeSpent;
            } else {
              day.deviation = day.expectedHour - day.totalTimeSpent;
            }
          }

          let sumOfAllDaysTotalWorkedTime = 0;
          totalWorkedTimes.map((item) => {
            sumOfAllDaysTotalWorkedTime += item;
          });

          const totalBreakTime = user.actions.reduce((total, day) => total + day.totalBreakTime, 0);
          const totalAdjustMent = user?.actions.reduce((total, day) => total + day.adjustment, 0);
          const totalBreakTimeDays = user.actions.filter((day) => day.totalBreakTime > 0).length;
          const averageBreakTime = totalBreakTimeDays > 0 ? Math.round(totalBreakTime / user.actions.length) : 0;
          user.averageBreakTimeSpent = averageBreakTime;
          const totalDays = user.actions.length;
          user.averageTimeSpent = totalDays > 0 ? Math.round(sumOfAllDaysTotalWorkedTime / totalDays) : 0;
          user.averageAdjustMent = totalDays > 0 ? Math.round(totalAdjustMent / totalDays) : 0;
        }

        for (const user of groupedData) {
          const userLoginTimes = [];
          const userLogoutTimes = [];

          for (const day of user.actions) {
            const loginAction = day.actions.find((action) => action.action === 'LOGIN');
            const logoutAction = day.actions
              .slice()
              .reverse()
              .find((action) => action.action === 'LOGOUT');

            const isHalfDayLeave = calculateExpectedHour(leaveData, user.user_id, day.date) === 270;

            // if user is in half day leave then that day's login time by default 9:30 and logout time will be 7:00;
            if (isHalfDayLeave) {
              if (loginAction) {
                const time = '09:30 AM';
                userLoginTimes.push(time);
              }
              if (logoutAction) {
                const time = '07:00 PM';
                userLogoutTimes.push(time);
              }
            } else {
              if (loginAction) {
                userLoginTimes.push(loginAction.start_time);
              }

              if (logoutAction) {
                userLogoutTimes.push(logoutAction.start_time);
              }
            }
          }

          // Calculate the average login time
          const loginMomentTimes = userLoginTimes.map((time) => moment(time, 'h:mm A'));
          const totalLoginMinutes = loginMomentTimes.reduce((acc, time) => acc + time.hours() * 60 + time.minutes(), 0);
          const averageLoginTimeInMinutes = Math.round(totalLoginMinutes / loginMomentTimes.length);
          const averageLoginMoment = moment().startOf('day').add(averageLoginTimeInMinutes, 'minutes');
          const averageLoginTime = averageLoginMoment.format('h:mm A');
          user.averageLoginTime = averageLoginTime;

          // Calculate the average logout time
          const logoutMomentTimes = userLogoutTimes.map((time) => moment(time, 'h:mm A'));
          const totalLogoutMinutes = logoutMomentTimes.reduce((acc, time) => acc + time.hours() * 60 + time.minutes(), 0);
          const averageLogoutTimeInMinutes = Math.round(totalLogoutMinutes / logoutMomentTimes.length);
          const averageLogoutMoment = moment().startOf('day').add(averageLogoutTimeInMinutes, 'minutes');
          const averageLogoutTime = averageLogoutMoment.format('h:mm A');
          user.averageLogoutTime = averageLogoutTime;

          let totalDeviation = 0;
          let totalDaysWithDeviation = 0;

          for (const day of user.actions) {
            // Calculate the deviation for the day
            day.deviation = day.expectedHour - day.totalTimeSpent;

            // Add day's deviation to the total
            totalDeviation += day.deviation;

            // Increment the count of days with deviation
            if (day.deviation) {
              totalDaysWithDeviation++;
            }
          }

          // Calculate the average deviation for the user
          // console.log('totalDeviation: ', totalDeviation);
          // console.log('user.actions.length: ', user.actions.length);

          user.averageDeviation = totalDaysWithDeviation > 0 ? Math.round(totalDeviation / user.actions.length) : 0;
        }

        const result = groupedData;

        result.sort((a, b) => {
          const usernameA = a.first_name.toLowerCase();
          const usernameB = b.first_name.toLowerCase();
          if (usernameA < usernameB) {
            return -1;
          }
          if (usernameA > usernameB) {
            return 1;
          }
          return 0;
        });

        finalresult = result;
      } else if (lead && lead.length > 0) {
        const leadWiseData = new Map();
        const result = [];

        if (lead && lead.length > 0) {
          for (const item of lead) {
            const teamLeadId = item.id;
            if (!leadWiseData.has(teamLeadId)) {
              leadWiseData.set(teamLeadId, []);
            }
            leadWiseData.get(teamLeadId).push(item);
          }
        }

        for (const [teamLead, userData] of leadWiseData) {
          const data: any = await this.taskReportService._getUserTimeLineReport(startDate, endDate, userData[0]?.userIDs);
          const leaveData: any = await this.taskReportService._getAllApprovedLeaves(startDate, endDate, userData[0]?.userIDs);

          const groupedDataMap = new Map();
          for (const item of data) {
            const userId = item.id;
            if (!groupedDataMap.has(userId) && userId != null) {
              groupedDataMap.set(userId, {
                first_name: item.first_name,
                last_name: item.last_name,
                user_id: userId,
                actions: [],
              });
            }

            const user = groupedDataMap.get(userId);
            const date = item?.action_start_date ? moment(item.action_start_date).format('YYYY-MM-DD') : '';
            const startTime = moment(item.action_start_date).format('LT');
            const timeSpent = moment(item.action_end_date).diff(moment(item.action_start_date), 'minutes');
            const time = moment(item.time, 'H:mm');
            const minutes = time.minutes() + time.hours() * 60;

            let existingAction = user?.actions?.find((action) => action.date === date && date);

            if (!existingAction) {
              // Check if the day is not Saturday (6) or Sunday (0)
              if (moment(date).day() !== 0 && moment(date).day() !== 6 && date) {
                existingAction = {
                  date: date,
                  dayname: moment(date).format('dddd'),
                  // expectedHour: 8 * 60 + 30,
                  expectedHour: calculateExpectedHour(leaveData, userId, date),
                  actions: [],
                  breakTimeCount: 0,
                };
                user?.actions?.push(existingAction);
              }
            }

            // Check if the day is not Saturday (6) or Sunday (0)
            if (moment(date).day() !== 0 && moment(date).day() !== 6 && date) {
              existingAction?.actions.push({
                ...item,
                timeSpent: timeSpent,
                start_time: startTime,
                time: minutes,
              });

              if (item.action === 'BREAK_TIME') {
                existingAction.breakTimeCount = (existingAction.breakTimeCount || 0) + 1;
              }
            }
          }

          const groupedData = Array.from(groupedDataMap.values());

          for (const user of groupedData) {
            const breakTimeCounts = user?.actions?.map((day) => day?.actions.filter((action) => action.action === 'BREAK_TIME').length);

            const totalBreakTimeCounts = breakTimeCounts.reduce((total, count) => total + count, 0);
            const averageBreakTimeCount = breakTimeCounts.length > 0 ? Math.round(totalBreakTimeCounts / breakTimeCounts.length) : 0;

            user.averageBreakTimeCount = averageBreakTimeCount;

            const totalWorkedTimes = [];

            for (const day of user.actions) {
              const totalWorkedTime = day.actions
                .filter((action) => ['LOGIN', 'LOGOUT', 'BACK_FROM_BREAK'].includes(action.action))
                .reduce((total, action) => total + (action.timeSpent || 0), 0);

              const manual_time_add = day.actions.filter((action) => ['MANUAL_TIME_ADD'].includes(action.action));

              const manual_time_remove = day.actions.filter((action) => ['MANUAL_TIME_REMOVE'].includes(action.action));

              let manual_time_add_sum = 0;
              for (let i = 0; i < manual_time_add.length; i++) {
                manual_time_add_sum += manual_time_add[i].time;
              }

              let manual_time_remove_sum = 0;
              for (let i = 0; i < manual_time_remove.length; i++) {
                manual_time_remove_sum += manual_time_remove[i].time;
              }

              day.adjustment = manual_time_add_sum - manual_time_remove_sum;
              day.totalTimeSpent = totalWorkedTime + day.adjustment;

              // HALF DAY LOGIC
              const isHalfDayLeave = calculateExpectedHour(leaveData, user.user_id, day.date) === 270;

              if (isHalfDayLeave) {
                totalWorkedTimes.push(timeInMinutes);
              } else {
                totalWorkedTimes.push(day.totalTimeSpent);
              }

              // Replace null values with 0 when calculating total break time
              const totalBreakTime = day.actions
                .filter((action) => action.action === 'BREAK_TIME')
                .reduce((total, action) => total + (action.timeSpent || 0), 0);

              day.totalBreakTime = totalBreakTime;

              if (isHalfDayLeave) {
                day.deviation = 270 - day.totalTimeSpent;
              } else {
                day.deviation = day.expectedHour - day.totalTimeSpent;
              }
            }

            let sumOfAllDaysTotalWorkedTime = 0;
            totalWorkedTimes.map((item) => {
              sumOfAllDaysTotalWorkedTime += item;
            });

            const totalBreakTime = user.actions.reduce((total, day) => total + day.totalBreakTime, 0);
            const totalAdjustMent = user?.actions.reduce((total, day) => total + day.adjustment, 0);
            const totalBreakTimeDays = user.actions.filter((day) => day.totalBreakTime > 0).length;
            const averageBreakTime = totalBreakTimeDays > 0 ? Math.round(totalBreakTime / user.actions.length) : 0;
            user.averageBreakTimeSpent = averageBreakTime;
            const totalDays = user.actions.length;
            user.averageTimeSpent = totalDays > 0 ? Math.round(sumOfAllDaysTotalWorkedTime / totalDays) : 0;
            user.averageAdjustMent = totalDays > 0 ? Math.round(totalAdjustMent / totalDays) : 0;
          }

          for (const user of groupedData) {
            const userLoginTimes = [];
            const userLogoutTimes = [];

            for (const day of user.actions) {
              const loginAction = day.actions.find((action) => action.action === 'LOGIN');
              const logoutAction = day.actions
                .slice()
                .reverse()
                .find((action) => action.action === 'LOGOUT');

              const isHalfDayLeave = calculateExpectedHour(leaveData, user.user_id, day.date) === 270;

              // if user is in half day leave then that day's login time by default 9:30 and logout time will be 7:00;
              if (isHalfDayLeave) {
                if (loginAction) {
                  const time = '09:30 AM';
                  userLoginTimes.push(time);
                }
                if (logoutAction) {
                  const time = '07:00 PM';
                  userLogoutTimes.push(time);
                }
              } else {
                if (loginAction) {
                  userLoginTimes.push(loginAction.start_time);
                }

                if (logoutAction) {
                  userLogoutTimes.push(logoutAction.start_time);
                }
              }
            }

            // Calculate the average login time
            const loginMomentTimes = userLoginTimes.map((time) => moment(time, 'h:mm A'));
            const totalLoginMinutes = loginMomentTimes.reduce((acc, time) => acc + time.hours() * 60 + time.minutes(), 0);
            const averageLoginTimeInMinutes = Math.round(totalLoginMinutes / loginMomentTimes.length);
            const averageLoginMoment = moment().startOf('day').add(averageLoginTimeInMinutes, 'minutes');
            const averageLoginTime = averageLoginMoment.format('h:mm A');
            user.averageLoginTime = averageLoginTime;

            // Calculate the average logout time
            const logoutMomentTimes = userLogoutTimes.map((time) => moment(time, 'h:mm A'));
            const totalLogoutMinutes = logoutMomentTimes.reduce((acc, time) => acc + time.hours() * 60 + time.minutes(), 0);
            const averageLogoutTimeInMinutes = Math.round(totalLogoutMinutes / logoutMomentTimes.length);
            const averageLogoutMoment = moment().startOf('day').add(averageLogoutTimeInMinutes, 'minutes');
            const averageLogoutTime = averageLogoutMoment.format('h:mm A');
            user.averageLogoutTime = averageLogoutTime;

            let totalDeviation = 0;
            let totalDaysWithDeviation = 0;

            for (const day of user.actions) {
              // Calculate the deviation for the day
              day.deviation = day.expectedHour - day.totalTimeSpent;

              // Add day's deviation to the total
              totalDeviation += day.deviation;

              // Increment the count of days with deviation
              if (day.deviation) {
                totalDaysWithDeviation++;
              }
            }

            // Calculate the average deviation for the user
            // console.log('totalDeviation: ', totalDeviation);
            // console.log('user.actions.length: ', user.actions.length);

            user.averageDeviation = totalDaysWithDeviation > 0 ? Math.round(totalDeviation / user.actions.length) : 0;
          }

          groupedData?.sort((a, b) => {
            const usernameA = a.first_name.toLowerCase();
            const usernameB = b.first_name.toLowerCase();
            if (usernameA < usernameB) {
              return -1;
            }
            if (usernameA > usernameB) {
              return 1;
            }
            return 0;
          });

          result.push({
            leadId: userData[0].id,
            leadName: userData[0].team_lead,
            data: groupedData,
          });
        }

        finalresult = result;
      } else {
        const data: any = await this.taskReportService._getUserTimeLineReport(startDate, endDate, userIDs);
        const leaveData: any = await this.taskReportService._getAllApprovedLeaves(startDate, endDate, userIDs);

        const groupedDataMap = new Map();
        for (const item of data) {
          const userId = item.id;
          if (!groupedDataMap.has(userId) && userId != null) {
            groupedDataMap.set(userId, {
              first_name: item.first_name,
              last_name: item.last_name,
              user_id: userId,
              actions: [],
            });
          }

          const user = groupedDataMap.get(userId);
          const date = item?.action_start_date ? moment(item.action_start_date).format('YYYY-MM-DD') : '';
          const startTime = moment(item.action_start_date).format('LT');
          const timeSpent = moment(item.action_end_date).diff(moment(item.action_start_date), 'minutes');
          const time = moment(item.time, 'H:mm');
          const minutes = time.minutes() + time.hours() * 60;

          let existingAction = user?.actions?.find((action) => action.date === date && date);

          if (!existingAction) {
            // Check if the day is not Saturday (6) or Sunday (0)
            if (moment(date).day() !== 0 && moment(date).day() !== 6 && date) {
              existingAction = {
                date: date,
                dayname: moment(date).format('dddd'),
                // expectedHour: 8 * 60 + 30,
                expectedHour: calculateExpectedHour(leaveData, userId, date),
                actions: [],
                breakTimeCount: 0,
              };
              user?.actions?.push(existingAction);
            }
          }

          // Check if the day is not Saturday (6) or Sunday (0)
          if (moment(date).day() !== 0 && moment(date).day() !== 6 && date) {
            existingAction?.actions.push({
              ...item,
              timeSpent: timeSpent,
              start_time: startTime,
              time: minutes,
            });

            if (item.action === 'BREAK_TIME') {
              existingAction.breakTimeCount = (existingAction.breakTimeCount || 0) + 1;
            }
          }
        }

        const groupedData = Array.from(groupedDataMap.values());

        for (const user of groupedData) {
          const breakTimeCounts = user?.actions?.map((day) => day?.actions.filter((action) => action.action === 'BREAK_TIME').length);

          const totalBreakTimeCounts = breakTimeCounts.reduce((total, count) => total + count, 0);
          const averageBreakTimeCount = breakTimeCounts.length > 0 ? Math.round(totalBreakTimeCounts / breakTimeCounts.length) : 0;

          user.averageBreakTimeCount = averageBreakTimeCount;

          const totalWorkedTimes = [];

          for (const day of user.actions) {
            const totalWorkedTime = day.actions
              .filter((action) => ['LOGIN', 'LOGOUT', 'BACK_FROM_BREAK'].includes(action.action))
              .reduce((total, action) => total + (action.timeSpent || 0), 0);

            const manual_time_add = day.actions.filter((action) => ['MANUAL_TIME_ADD'].includes(action.action));

            const manual_time_remove = day.actions.filter((action) => ['MANUAL_TIME_REMOVE'].includes(action.action));

            let manual_time_add_sum = 0;
            for (let i = 0; i < manual_time_add.length; i++) {
              manual_time_add_sum += manual_time_add[i].time;
            }

            let manual_time_remove_sum = 0;
            for (let i = 0; i < manual_time_remove.length; i++) {
              manual_time_remove_sum += manual_time_remove[i].time;
            }

            day.adjustment = manual_time_add_sum - manual_time_remove_sum;
            day.totalTimeSpent = totalWorkedTime + day.adjustment;

            // HALF DAY LOGIC
            const isHalfDayLeave = calculateExpectedHour(leaveData, user.user_id, day.date) === 270;

            if (isHalfDayLeave) {
              totalWorkedTimes.push(timeInMinutes);
            } else {
              totalWorkedTimes.push(day.totalTimeSpent);
            }

            // Replace null values with 0 when calculating total break time
            const totalBreakTime = day.actions
              .filter((action) => action.action === 'BREAK_TIME')
              .reduce((total, action) => total + (action.timeSpent || 0), 0);

            day.totalBreakTime = totalBreakTime;

            if (isHalfDayLeave) {
              day.deviation = 270 - day.totalTimeSpent;
            } else {
              day.deviation = day.expectedHour - day.totalTimeSpent;
            }
          }

          let sumOfAllDaysTotalWorkedTime = 0;
          totalWorkedTimes.map((item) => {
            sumOfAllDaysTotalWorkedTime += item;
          });

          const totalBreakTime = user.actions.reduce((total, day) => total + day.totalBreakTime, 0);
          const totalAdjustMent = user?.actions.reduce((total, day) => total + day.adjustment, 0);
          const totalBreakTimeDays = user.actions.filter((day) => day.totalBreakTime > 0).length;
          const averageBreakTime = totalBreakTimeDays > 0 ? Math.round(totalBreakTime / user.actions.length) : 0;
          user.averageBreakTimeSpent = averageBreakTime;
          const totalDays = user.actions.length;
          user.averageTimeSpent = totalDays > 0 ? Math.round(sumOfAllDaysTotalWorkedTime / totalDays) : 0;
          user.averageAdjustMent = totalDays > 0 ? Math.round(totalAdjustMent / totalDays) : 0;
        }

        for (const user of groupedData) {
          const userLoginTimes = [];
          const userLogoutTimes = [];

          for (const day of user.actions) {
            const loginAction = day.actions.find((action) => action.action === 'LOGIN');
            const logoutAction = day.actions
              .slice()
              .reverse()
              .find((action) => action.action === 'LOGOUT');

            const isHalfDayLeave = calculateExpectedHour(leaveData, user.user_id, day.date) === 270;

            // if user is in half day leave then that day's login time by default 9:30 and logout time will be 7:00;
            if (isHalfDayLeave) {
              if (loginAction) {
                const time = '09:30 AM';
                userLoginTimes.push(time);
              }
              if (logoutAction) {
                const time = '07:00 PM';
                userLogoutTimes.push(time);
              }
            } else {
              if (loginAction) {
                userLoginTimes.push(loginAction.start_time);
              }

              if (logoutAction) {
                userLogoutTimes.push(logoutAction.start_time);
              }
            }
          }

          // Calculate the average login time
          const loginMomentTimes = userLoginTimes.map((time) => moment(time, 'h:mm A'));
          const totalLoginMinutes = loginMomentTimes.reduce((acc, time) => acc + time.hours() * 60 + time.minutes(), 0);
          const averageLoginTimeInMinutes = Math.round(totalLoginMinutes / loginMomentTimes.length);
          const averageLoginMoment = moment().startOf('day').add(averageLoginTimeInMinutes, 'minutes');
          const averageLoginTime = averageLoginMoment.format('h:mm A');
          user.averageLoginTime = averageLoginTime;

          // Calculate the average logout time
          const logoutMomentTimes = userLogoutTimes.map((time) => moment(time, 'h:mm A'));
          const totalLogoutMinutes = logoutMomentTimes.reduce((acc, time) => acc + time.hours() * 60 + time.minutes(), 0);
          const averageLogoutTimeInMinutes = Math.round(totalLogoutMinutes / logoutMomentTimes.length);
          const averageLogoutMoment = moment().startOf('day').add(averageLogoutTimeInMinutes, 'minutes');
          const averageLogoutTime = averageLogoutMoment.format('h:mm A');
          user.averageLogoutTime = averageLogoutTime;

          let totalDeviation = 0;
          let totalDaysWithDeviation = 0;

          for (const day of user.actions) {
            // Calculate the deviation for the day
            day.deviation = day.expectedHour - day.totalTimeSpent;

            // Add day's deviation to the total
            totalDeviation += day.deviation;

            // Increment the count of days with deviation
            if (day.deviation) {
              totalDaysWithDeviation++;
            }
          }

          // Calculate the average deviation for the user
          // console.log('totalDeviation: ', totalDeviation);
          // console.log('user.actions.length: ', user.actions.length);

          user.averageDeviation = totalDaysWithDeviation > 0 ? Math.round(totalDeviation / user.actions.length) : 0;
        }

        const result = groupedData;

        result.sort((a, b) => {
          const usernameA = a.first_name.toLowerCase();
          const usernameB = b.first_name.toLowerCase();
          if (usernameA < usernameB) {
            return -1;
          }
          if (usernameA > usernameB) {
            return 1;
          }
          return 0;
        });

        finalresult = result;
      }

      return res.status(200).json(APIResponseFormat._ResDataFound(finalresult));
    } catch (err) {
      next(err);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
    }
  };

  public getUsersDropDownForTimeLine = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const result = await this.taskReportService._getUsersDropDownForTimeLine();
      return res.status(200).json(APIResponseFormat._ResDataFound(result));
    } catch (err) {
      next(err);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
    }
  }

  public getUserReportedIssue = async (req: iRequestWithUser, res: Response, next: NextFunction) => {
    try {
      const allUsers = await this.taskReportService._getUserData();
      const getTasks = [];

      await Promise.all(
        allUsers.map(async (user) => {
          const userId = user.id;

          const getReportedIssueTask = await this.taskService._getTasksByUserId({ assignee: userId, type: 'Bug' }).then(async (res) => {
            await Promise.all(
              res.map(async (task) => {
                return {
                  id: task.id,
                  title: task.title,
                };
              })
            );
          });

          getTasks.push({ ...user, reportedIssueTaskCount: 0, reportedIssueTask: [] });
        })
      );

      console.log('getTasks', getTasks);

      return res.status(200).json(APIResponseFormat._ResDataFound(getTasks));
    } catch (err) {
      next(err);
      return res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
    }
  };
}

export default TaskReportController;
