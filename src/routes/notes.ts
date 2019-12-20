import { Router, Response, Request, NextFunction } from 'express';
import jwt from '../middleware/jwt';
import swaggerValidator from '../middleware/swaggerValidator';
import NoteController from '../controllers/NoteController';
import config from '../config';

const route = Router();
const noteCtrl = new NoteController();

const jwtMiddleware = jwt({ secret: config.get('jwt.secret') });

export default (app: Router) => {

  app.use('/api/v1/notes', route);

  route.get(
    '/',
    swaggerValidator.validate,
    jwtMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      noteCtrl.index(req, res);
    });

  route.post(
    '/',
    jwtMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      noteCtrl.create(req, res);
    });

  route.get(
    '/:id',
    jwtMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      noteCtrl.show(req, res);
    });

  route.put(
    '/:id',
    jwtMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      noteCtrl.update(req, res);
    });

  route.delete(
    '/:id',
    jwtMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      noteCtrl.delete(req, res);
    });
};
