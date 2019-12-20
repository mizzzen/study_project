import { NextFunction, Request, Response, Router } from 'express';
import jwt from '../middleware/jwt';
import swaggerValidator from '../middleware/swaggerValidator';
import config from '../config';
import UserService from '../services/UserService';
import {
  IAuthDTO,
  IRefreshAccessTokenDTO,
  IResetPassDTO,
  IUserCreateDTO,
} from '../interfaces/user.interface';

const route = Router();
const userServiceInstance = new UserService();

const jwtMiddleware = jwt({ secret: config.get('jwt.secret') });

export default (app: Router) => {

  app.use('/api/v1/user', route);

  route.post(
    '/signup',
    swaggerValidator.validate,
    async (req: Request, res: Response, next: NextFunction) => {
      const body = { ...req.body };
      body.ipAddress = req.clientIp;

      try {
        const { id } = await userServiceInstance.signup(body as IUserCreateDTO);
        res.status(200).json({
          id,
          message: 'SUCCESS',
        });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  route.post(
    '/authenticate',
    swaggerValidator.validate,
    async (req: Request, res: Response, next: NextFunction) => {
      const body = { ...req.body };
      body.ipAddress = req.clientIp;
      body.userAgent = req.userAgent.genInfo;

      try {
        const auth = await userServiceInstance.authenticate(body as IAuthDTO);
        res.status(200).json(auth);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  route.post(
    '/refreshAccessToken',
    swaggerValidator.validate,
    async (req: Request, res: Response, next: NextFunction) => {
      const body = { ...req.body };
      body.ipAddress = req.clientIp;
      body.userAgent = req.userAgent.genInfo;

      try {
        const tokens = await userServiceInstance.refreshAccessToken(body as IRefreshAccessTokenDTO);
        res.status(200).json(tokens);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  route.post(
    '/invalidateAllRefreshTokens',
    swaggerValidator.validate,
    jwtMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await userServiceInstance.invalidateAllRefreshTokens(req.body.username);
        res.status(200).json({ message: 'SUCCESS' });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  route.post(
    '/invalidateRefreshToken',
    swaggerValidator.validate,
    jwtMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const { username, refreshToken } = req.body;
      try {
        await userServiceInstance.invalidateRefreshToken(username, refreshToken);
        res.status(200).json({ message: 'SUCCESS' });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  route.post(
    '/forgot',
    swaggerValidator.validate,
    async (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;
      const reqUrl = `${ req.protocol }://${ req.get('host') }${ req.originalUrl }`;
      try {
        const passwordResetToken = await userServiceInstance.forgot(email, reqUrl);
        res.status(200).json({ passwordResetToken });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  route.post(
    '/checkPasswordResetToken',
    swaggerValidator.validate,
    async (req: Request, res: Response, next: NextFunction) => {
      const { passwordResetToken, email } = req.body;
      try {
        await userServiceInstance.checkPasswordResetToken(email, passwordResetToken);
        res.status(200).json({ message: 'SUCCESS' });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  route.post(
    '/resetPassword',
    swaggerValidator.validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await userServiceInstance.resetPassword(req.body as IResetPassDTO);
        res.status(200).json({ message: 'SUCCESS' });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  route.post(
    '/private',
    swaggerValidator.validate,
    jwtMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      res.status(200).json({ user: req.decoded });
    });
};
