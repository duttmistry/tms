import { Routes } from "@tms-workspace/apis-core";
import { auth } from "@tms-workspace/auth/user-authentication";
import { Router } from "express";
import TaskReportController from "./controller/tasks_reports.controller";

class TaskReportRoute implements Routes {
    public router = Router();
    public controller = new TaskReportController();
    constructor() {
        this.initializeRoutes();
      }
    
      private initializeRoutes() {
        // Task List Page APIs
        this.router.get(`/user/task/report`, auth.default, this.controller.getUserTaskReport);
        this.router.get(`/user/task/report/explore`, auth.default, this.controller.getUserTaskReportExplore);
        this.router.get(`/user/report`, auth.default, this.controller.getUserTaskList);
        this.router.get(`/user/free/report`, auth.default, this.controller.getFreeUserList);
        this.router.get(`/user/logout/report`, auth.default, this.controller.getLogoutUserList);
        this.router.get(`/user/notlogin/report`, auth.default, this.controller.getNotLoginUserList);
        this.router.get(`/user/onleave/report`, auth.default, this.controller.getOnLeaveUserList);
        this.router.post(`/project/workedhours`, auth.default, this.controller.ProjectWorkedReport);
        this.router.get(`/user/time/report` , auth.default , this.controller.getTimelineReporter);
        this.router.get(`/user/dropdown` , auth.default, this.controller.getUsersDropDownForTimeLine);
        this.router.get(`/user/lead` , auth.default, this.controller.getLeadDropDown);
        this.router.get(`/user/reportedissue`, auth.default, this.controller.getUserReportedIssue);
      }
}
export default TaskReportRoute;