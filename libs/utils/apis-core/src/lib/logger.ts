import * as winston from 'winston';

interface LogObject {
  timestamp: string;
  level: string;
  message: string;
}

const logFormat = winston.format.printf(
  (info: any) => `${info.timestamp} ${info.level}: ${info.message}`
);

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat
  ),
});

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export default stream;
