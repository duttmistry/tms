// import nodemailer , { TransportOptions } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';

// CLIENT_ID = 284846033317-ner6rbqlvrun34j74duhrr5m62t4pqrn.apps.googleusercontent.com
// CLIENT_SECRET = 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
// REFRESH_TOKEN = 1//04D1XjfzC3EXxCgYIARAAGAQSNgF-L9Ir9u6Kbp00PvigQoFocmrKp-KyJaHr6Mrm_bXnmWQjvvpI0HcMtIbeWEuAzQloCFgXww
// REDIRECT_URI = https://developers.google.com/oauthplayground

// const nodemailer = require('nodemailer');

// // Configure the SMTP transport
// const transporter = nodemailer.createTransport({
//   host: 'sh108.webhostingservices.com',
//   port: 465,
//   secure: true, // Use SSL/TLS
//   auth: {
//     user: 'your-email@cybercomcreation.com', // Your email address
//     pass: 'jihMqeqVx2a2jHyOFm' // Your email password
//   }
// });

// // Define the email content
// const mailOptions = {
//   from: 'your-email@cybercomcreation.com',
//   to: 'recipient@example.com', // Receiver's email address
//   subject: 'Subject of the email',
//   text: 'This is the plain text version of the email.',
//   html: '<p>This is the HTML version of the email.</p>'
// };

// // Create a function to send the email
// function sendEmail() {
//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error('Error sending email:', error);
//     } else {
//       console.log('Email sent:', info.response);
//     }
//   });
// }

// // Call the sendEmail function to send the email
// sendEmail();


interface IEmail {
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string | Buffer ;
}

// const oAuth2Client = new google.auth.OAuth2(
//   '284846033317-ner6rbqlvrun34j74duhrr5m62t4pqrn.apps.googleusercontent.com',
//   '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',
//   'https://developers.google.com/oauthplayground'
// );

// oAuth2Client.setCredentials({
//   refresh_token: '1//04D1XjfzC3EXxCgYIARAAGAQSNgF-L9Ir9u6Kbp00PvigQoFocmrKp-KyJaHr6Mrm_bXnmWQjvvpI0HcMtIbeWEuAzQloCFgXww',
// });

export const sendEmail = async ({ to, subject, text, html }: IEmail) => {
  try {

    // const accessToken = await oAuth2Client.getAccessToken();

    // const transportOptions = {
    //   service: 'gmail',
    //   auth: {
    //     type: 'OAuth2',
    //     user: 'hareshnaresh125@gmail.com',
    //     clientId: '284846033317-ner6rbqlvrun34j74duhrr5m62t4pqrn.apps.googleusercontent.com',
    //     clientSecret: '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',
    //     refreshToken: '1//04D1XjfzC3EXxCgYIARAAGAQSNgF-L9Ir9u6Kbp00PvigQoFocmrKp-KyJaHr6Mrm_bXnmWQjvvpI0HcMtIbeWEuAzQloCFgXww',
    //     accessToken,
    //   },
    // } as nodemailer.TransportOptions;

    const transport = nodemailer.createTransport({
      host: 'sh108.webhostingservices.com',
      port: 465,
      secure: true, // Use SSL/TLS
      auth: {
        user: 'no-reply@cybercomcreation.com', // Your email address
        pass: 'jihMqeqVx2a2jHyOFm' // Your email password
      }
    });
    

    const mailOptions = {
      from : 'no-reply@cybercomcreation.com',
      to: to?.join(','),
      subject,
      text,
      html : html,
    };
    
    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
};
