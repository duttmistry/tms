import * as admin from 'firebase-admin';
// import * as imageUrl from '../../assests/logo.svg';
const serviceAccount = require('./credentials.json');
import * as Enviornment from '../../enviornment';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging();

export const sendNotificationToMultipleDevice = async (registrationTokens: any, description: any, action_by: any) => {
  try {
    const response = await messaging.sendMulticast({
      tokens: registrationTokens,
      notification: {
        title: description,
        body: `action by ${action_by}`,
      },
      webpush: {
        notification: {
          icon: 'https://www.cybercom.co.in/wp-content/uploads/2013/04/favicon.ico',
        },
      },
    });

    return response;
  } catch (err) {
    return err;
  }
};
