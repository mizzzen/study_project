import express from 'express';
import cors from 'cors';
import { UAParser } from 'ua-parser-js';
import bodyParser from 'body-parser';
import responseTime from 'response-time';
import requestIp from 'request-ip';
import { default as Redis } from 'ioredis';
import { default as RateLimit } from 'express-rate-limit';
import { default as RedisStore } from 'rate-limit-redis';
import config from './config';
import logger from './logs/logger';
import userActions from './routes/userActions';
import notes from './routes/notes';
import * as swaggerValidator from 'express-ajv-swagger-validation';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();

    this.initializeMiddlewares();
    this.initializeRoutes();

    this.initializeErrorHandlers();
  }

  private initializeRoutes() {
    this.app.get('/', async (req, res, next) => {
      res
        .status(200)
        .json({
          message: `Hi there ${ process.env.npm_package_version }`,
        });
    });

    userActions(this.app);
    notes(this.app);
  }

  private initializeMiddlewares() {
    const limiter = new RateLimit({
      store: new RedisStore({
        client: new Redis(config.get('redis.port'), config.get('redis.host')),
      }),
      windowMs: 60000,
      max: 100,
      message: 'Hmm, you seem to be doing that a bit too much - wouldn\'t you say?',
    });

    this.app.use(requestIp.mw());

    this.app.use(limiter);

    this.app.use(async (req, res, next) => {
      try {
        await next();
        logger.info(`${ req.method } ${ req.originalUrl } ${ res.statusCode }`);
      } catch (error) {}
    });

    this.app.use(responseTime());

    this.app.use(cors({ origin: '*' }));

    this.app.use(async (req, res, next) => {
      const userAgentHeader = req.header('User-Agent');
      req.userAgent = new UAParser(userAgentHeader);

      const uaOs = Object.values(req.userAgent.getOS()).join(' ');
      const uaBrowser = Object.values(req.userAgent.getBrowser()).join(' ');

      req.userAgent.genInfo = `${ uaOs } ${ uaBrowser }`;

      await next();
    });

    this.app.use(bodyParser.json());
  }

  private initializeErrorHandlers() {
    this.app.use((req, res, next) => {
      res.status(404);
      res.json({
        error: 'Not found',
      });
    });

    this.app.use((err, req, res, next) => {
      if (err instanceof swaggerValidator.InputValidationError) {
        const errors = {};
        err.errors.map((value: swaggerValidator.ErrorDetails) => {
          let field = value.dataPath.substring(1);
          const message = value.message;

          if (field.length === 0) {
            field = value.keyword;
          }

          if (!errors.hasOwnProperty(field)) {
            errors[field] = [message];
          } else {
            errors[field].push(message);
          }
        });
        return res.status(400).json({ errors });
      }

      res.status(500);
      res.json({
        name: err.name,
        message: err.message,
        trace: err.stack,
      });
    });
  }
}

export default App;
