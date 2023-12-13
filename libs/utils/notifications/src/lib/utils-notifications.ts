import * as admin from 'firebase-admin';

const serviceAccount = require('./credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging();

export const sendNotificationToMultipleDevice = async (registrationTokens : any, payload: any)  => {
  try {
    // const response = await messaging.send({
    //   token : registrationTokens,
    //   notification: {
    //     title: payload.title,
    //     body: payload.body,
    //   },
    // })
    console.log(registrationTokens)

    const response = await messaging.sendMulticast({
      tokens: registrationTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
    });

    console.log('Successfully sent message:', response);
   
    return response;
     
  } catch (err) {
    return err;
  }
}
