import * as nodeCron from 'node-cron';

import Auth from '../api/user/controller/auth.controller';

const authController = new Auth();

// nodeCron.schedule('0 0 0 * * *', authController.systemAutoLogout);

const CronJob = () => {
  console.log('CronJob');
};

// nodeCron.schedule('* * * * * *', CronJob);

export default nodeCron;
