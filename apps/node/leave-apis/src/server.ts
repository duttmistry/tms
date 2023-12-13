import AttendanceRoute from './app/api/attendance/attendance.route';
import LeaveRoute from './app/api/leave/leave.route';
import LeaveSubjectRoute from './app/api/leave_subjects/leave_subjects.route';
import LeaveBalanceRoute from './app/api/leave_balance/leave_balance.route';
import LeaveManualUpdateRoute from './app/api/leave_manual_update/leave_manual_update.route';
import App from './main';

const app = new App([new LeaveRoute(), new AttendanceRoute(), new LeaveSubjectRoute(), new LeaveBalanceRoute(), new LeaveManualUpdateRoute()]);

app.listen();
