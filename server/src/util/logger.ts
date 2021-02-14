import { createLogger, format, Logger, LoggerOptions, transports } from 'winston';
import packageJson from '../../package.json';

const appName = packageJson.name;

const loggerOptions: LoggerOptions = {
  level: process.env.LOGLEVEL ?? 'information',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
    }),
    new transports.File({
      level: 'info',
      filename: `./logs/${appName}.log`,
      handleExceptions: true,
      maxsize: 5242880, //5MB
      maxFiles: 5,
    }),
  ],
};

const logger: Logger = createLogger(loggerOptions);

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple(),
    ),
  }));
}

export interface LogStream {
  write(message: string, encoding: any): void;
}
export const logStream: LogStream = {
  write: function (message: string, encoding: any): void {
    logger.info(message);
  }
};

export default logger;
