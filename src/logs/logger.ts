import log4js from 'log4js';
import config from './../config';

log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: 'logs/main.log',
      maxLogSize: 20480,
      backups: 10,
    },
    console: {
      type: 'stdout',
    },
  },
  categories: {
    development: {
      appenders: ['file', 'console'],
      level: 'all',
    },
    production: {
      appenders: ['file'],
      level: 'info',
    },
    default: {
      appenders: ['file'],
      level: 'info',
    },
  },
});

const logger =
  config.get('env') === 'development'
    ? log4js.getLogger('development')
    : log4js.getLogger('production');

export default logger;
