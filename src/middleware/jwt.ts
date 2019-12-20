import jsonwebtoken from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

class Options {
  secret?: string;
}

export default (opts: Options = {}) => {
  const secret = opts.secret;

  const middleware = async (req: Request, res: Response, next: NextFunction) => {
    // If there's no secret set, toss it out right away
    if (!secret) {
      return res.status(401).json({ error: 'INVALID_SECRET' });
    }

    // Grab the token
    const token: string | boolean = getJwtToken(req);
    if (!token) {
      return res.status(401).json({ error: 'TOKEN_NOT_PROVIDED' });
    }

    try {
      // Try and decode the token asynchronously
      const decoded = await jsonwebtoken.verify(
        token,
        secret,
      );

      req.decoded = decoded.data;
    } catch (error) {
      // If it's an expiration error, let's report that specifically.
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'AUTHENTICATION_ERROR' });
    }

    return next();
  };

  const getJwtToken = (req: Request): string | boolean => {
    if (!req.headers.authorization) {
      return;
    }

    const parts = req.headers.authorization.split(' ');

    if (parts.length === 2) {
      const [schema, credentials] = parts;

      if (/^Bearer$/i.test(schema)) {
        return credentials;
      }
    }
    return false;
  };

  return middleware;
};
