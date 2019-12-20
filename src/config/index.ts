import convict from 'convict';
import dotenv from 'dotenv';
import { join } from 'path';

if (process.env.DOTENV) {
  dotenv.config({ path: join(__dirname, '../..', process.env.DOTENV) });
}

const config = convict({
  env: {
    doc: 'The application enviroment',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 4000,
    env: 'PORT',
  },
  app: {
    email: {
      doc: 'Email of application',
      format: 'email',
      default: 'admin@localhost',
      env: 'APP_EMAIL',
    },
    name: {
      doc: 'Name of application',
      format: String,
      default: 'express-ts-typeorm-api',
      env: 'APP_NAME',
    },
  },
  apiKeys: {
    sendGrid: {
      doc: 'Email service API key',
      format: String,
      default: 'set env api key',
      env: 'SENDGRID_API_KEY',
    },
  },
  jwt: {
    secret: {
      doc: 'Jsonwebtoken security keyword',
      format: String,
      default: 'secret',
      env: 'JWT_SECRET',
    },
    expirationTime: {
      doc: 'Access token expiration time',
      format: String,
      default: '1m',
      env: 'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    },
  },
  redis: {
    port: {
      doc: 'Redis port',
      format: 'port',
      default: 6379,
      env: 'REDIS_PORT',
    },
    host: {
      doc: 'Database host name/IP',
      format: '*',
      default: '127.0.0.1',
      env: 'REDIS_HOST',
    },
  },
  db: {
    host: {
      doc: 'Database host name/IP',
      format: '*',
      default: '127.0.0.1',
      env: 'DB_HOST',
    },
    port: {
      doc: 'Database port',
      format: 'port',
      default: 3306,
      env: 'DB_PORT',
    },
    database: {
      doc: 'Database name',
      format: String,
      default: 'notes',
      env: 'DB_DATABASE',
    },
    user: {
      doc: 'Database user name',
      format: String,
      default: 'root',
      env: 'DB_USER',
    },
    password: {
      doc: 'Database user password',
      format: String,
      default: 'root',
      env: 'DB_PASSWORD',
    },
  },
});

export default config;
