import TaskReportRoute from './app/api/tasks-reports/tasks_reports.route';
import TaskRoute from './app/api/tasks/task.route';
import UserRoute from './app/api/user/user.route';
import App from './main';

const app = new App([new TaskRoute(), new UserRoute(),new TaskReportRoute()]);

// app.listen()
app.startServer();
