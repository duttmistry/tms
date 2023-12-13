import * as nodeCron from 'node-cron';
import AuthController from './autologout.cron';
import LeaveController from './leave.cron';
import InactiveCron from './inactive.cron';
import NotifyTl from './notifytl.cron';

const authController = new AuthController();
const leaveController = new LeaveController();
const InactiveController = new InactiveCron();
const notifyTL = new NotifyTl();


//System Auto Logout
nodeCron.schedule('0 0 23 * * *', authController.systemAutoLogout);

// schedule 5 min controller for inactiveController
nodeCron.schedule("0 */5 * * * *", InactiveController.inActiveController);

nodeCron.schedule("0 */5 * * * *", notifyTL.notifytlcontroller);


// nodeCron.schedule('55 23 28-31 * *', leaveController.updateLeaveClosingBalance);
// nodeCron.schedule('5 0 1 * *', leaveController.creditLeaveBalance);
// nodeCron.schedule('0 * * * * *', leaveController.creditLeaveBalance);

export default nodeCron;
