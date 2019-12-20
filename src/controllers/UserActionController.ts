import randexp from 'randexp';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import fsExtra from 'fs-extra';
import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { default as joi } from '@hapi/joi';
import config from '../config';
import { default as sgMail } from '@sendgrid/mail';
import {
  addMonths,
  compareAsc,
  addMinutes,
} from 'date-fns';

sgMail.setApiKey(config.get('apiKeys.sendGrid'));

const userSchemaSignup = joi.object({
  firstName: joi
    .string()
    .min(1)
    .max(25)
    .alphanum()
    .required(),
  lastName: joi
    .string()
    .min(1)
    .max(25)
    .alphanum()
    .required(),
  username: joi
    .string()
    .min(3)
    .max(100)
    .regex(/[a-zA-Z0-9@]/)
    .required(),
  email: joi
    .string()
    .email()
    .required(),
  password: joi
    .string()
    .min(8)
    .max(35)
    .required(),
});

const userSchemaResetPassword = joi.object({
  email: joi
    .string()
    .email()
    .required(),
  password: joi
    .string()
    .min(8)
    .max(35)
    .required(),
  passwordResetToken: joi.string().required(),
});

class UserController  {

  async signup(req: Request, res: Response) {
    const request = req.body;

    const validator = userSchemaSignup.validate(request, { abortEarly: false });
    if (validator.error) {
      return res.status(400).json({ error: validator.error.details[0].message });
    }

    const userRepository = await getRepository(User);
    const user = userRepository.merge(new User(), request);

    user.token = await this.generateUniqueToken();
    user.ipAddress = req.clientIp;

    const [, duplicateUsername] = await userRepository.findAndCount({
      username: user.username,
    });
    if (duplicateUsername) {
      return res.status(400).json({ error: 'DUPLICATE_USERNAME' });
    }
    user.username = request.username;

    const [, duplicateEmail] = await userRepository.findAndCount({
      email: user.email,
    });
    if (duplicateEmail) {
      return res.status(400).json({ error: 'DUPLICATE_EMAIL' });
    }

    try {
      user.password = await bcrypt.hash(user.password, 12);
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    try {
      const newUser = await userRepository.save(user);
      return res.status(200).json({
        message: 'SUCCESS',
        id: newUser.id,
      });
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }
  }

  async authenticate(req: Request, res: Response) {
    const request = req.body;

    if (!request.username || !request.password) {
      return res.status(404).json({ error: 'INVALID_DATA' });
    }

    const userRepository = await getRepository(User);
    const userData = await userRepository.findOne({ username: request.username });

    if (!userData) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    try {
      const correct = await bcrypt.compare(
        request.password,
        userData.password,
      );
      if (!correct) {
        return res.status(400).json({ error: 'INVALID_CREDENTIALS' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    delete userData.password;

    const refreshTokenRepository = await getRepository(RefreshToken);

    const refreshTokenData = refreshTokenRepository.create({
      username: userData.username,
      refreshToken: new randexp(/[a-zA-Z0-9_-]{64,64}/).gen(),
      info: req.userAgent.genInfo,
      ipAddress: req.clientIp,
      expiration: addMonths(new Date(), 1),
      isValid: true,
    });

    // Insert the refresh data into the db
    try {
      const res = await refreshTokenRepository.insert(refreshTokenData);
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    // Update their login count
    try {
      const res = await userRepository.increment(userData, 'loginCount', 1);
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    const tokenData = {
      id: userData.id,
      token: userData.token,
      username: userData.username,
      email: userData.email,
      isAdmin: userData.isAdmin,
    };
    const token = jsonwebtoken.sign(
      { data: tokenData },
      config.get('jwt.secret'),
      { expiresIn: config.get('jwt.expirationTime') },
    );

    return res.status(200).json({
      accessToken: token,
      refreshToken: refreshTokenData.refreshToken,
    });
  }

  async refreshAccessToken(req: Request, res: Response) {
    const request = req.body;

    if (!request.username || !request.refreshToken) {
      return res.status(401).json({ error: 'NO_REFRESH_TOKEN' });
    }

    // Let's find that user and refreshToken in the refreshToken table
    const refreshTokenRep = await getRepository(RefreshToken);
    const refreshTokenData = await refreshTokenRep.findOne({
      username: request.username,
      refreshToken: request.refreshToken,
      isValid: true,
    });

    if (!refreshTokenData) {
      return res.status(400).json({ error: 'INVALID_REFRESH_TOKEN' });
    }

    const refreshTokenIsValid = compareAsc(
      new Date(),
      refreshTokenData.expiration,
    );
    if (refreshTokenIsValid !== -1) {
      return res.status(400).json({ error: 'REFRESH_TOKEN_EXPIRED' });
    }

    // Ok, everthing checked out.
    // So let's invalidate the refresh token they just confirmed,
    // and get them hooked up with a new one.
    try {
      await refreshTokenRep.update(
        {
          refreshToken: refreshTokenData.refreshToken,
        },
        {
          isValid: false,
        },
      );
    } catch (e) {
      res.status(400).json({ error: 'INVALID_DATA' });
    }

    const userRep = await getRepository(User);

    const userData = await userRep.findOne({
      username: request.username,
    });
    if (!userData) {
      return res.status(401).json({ error: 'INVALID_REFRESH_TOKEN' });
    }

    const newRefreshToken = {
      username: request.username,
      refreshToken: new randexp(/[a-zA-Z0-9_-]{64,64}/).gen(),
      info: req.userAgent.genInfo,
      ipAddress: req.clientIp,
      expiration: addMonths(new Date(), 1),
      isValid: true,
    };

    // Insert the refresh data into the db
    try {
      await refreshTokenRep.insert(newRefreshToken);
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    const tokenData = {
      id: userData.id,
      token: userData.token,
      username: userData.username,
      email: userData.email,
      isAdmin: userData.isAdmin,
    };
    const token = jsonwebtoken.sign(
      { data: tokenData },
      config.get('jwt.secret'),
      { expiresIn: config.get('jwt.expirationTime') },
    );

    return res.status(200).json({
      accessToken: token,
      refreshToken: newRefreshToken.refreshToken,
    });
  }

  async invalidateAllRefreshTokens(req: Request, res: Response) {
    const request = req.body;
    try {
      const refreshTokenRep = await getRepository(RefreshToken);
      await refreshTokenRep.update(
        {
          username: request.username,
        },
        {
          isValid: false,
        },
      );
      res.status(200).json({ message: 'SUCCESS' });
    } catch (e) {
      res.status(400).json({ error: 'INVALID_DATA' });
    }
  }

  async invalidateRefreshToken(req: Request, res: Response) {
    const request = req.body;
    if (!request.refreshToken) {
      return res.status(404).json({ error: 'NO_REFRESH_TOKEN' });
    }

    try {
      const refreshTokenRep = await getRepository(RefreshToken);
      await refreshTokenRep.update(
        {
          username: request.username,
          refreshToken: request.refreshToken,
        },
        {
          isValid: false,
        },
      );
      return res.status(200).json({ message: 'SUCCESS' });
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }
  }

  async forgot(req: Request, res: Response) {
    const request = req.body;

    if (!request.email) {
      return res.status(404).json({ error: 'INVALID_DATA' });
    }

    const resetData = {
      passwordResetToken: new randexp(/[a-zA-Z0-9_-]{64,64}/).gen(),
      passwordResetExpiration: addMinutes(new Date(), 30),
    };

    const userRep = getRepository(User);
    try {
      const result = await userRep.update(
        { email: request.email },
        { ...resetData },
        );
    } catch (e) {
      res.status(400).json({ error: 'INVALID_DATA' });
    }

    // TODO Now for the email if they've chosen the web type of forgot password
    const reqUrl = `${ req.protocol }://${ req.get('host') }${ req.originalUrl }`;
    const email = await fsExtra.readFile('./templates/email/forgot.html', 'utf8');
    const resetUrlCustom = `${reqUrl}?passwordResetToken=${resetData.passwordResetToken}&email=${request.email}`;
    const emailData = {
      to: request.email,
      from: config.get('app.email'),
      subject: `Password Reset For ${ config.get('app.name') }`,
      html: email,
      categories: [`${ config.get('app.name') }-forgot`],
      substitutions: {
        appName: config.get('app.name'),
        email: request.email,
        resetUrl: resetUrlCustom,
      },
    };

    if (config.get('env') !== 'testing') {
      await sgMail.send(emailData);
    }

    return res.status(200).json({ passwordResetToken: resetData.passwordResetToken });
  }

  async checkPasswordResetToken(req: Request, res: Response) {
    const request = req.body;

    if (!request.passwordResetToken || !request.email) {
      res.status(404).json({ error: 'INVALID_DATA' });
    }

    const userRep = getRepository(User);
    const user = await userRep.findOne({
      email: request.email,
      passwordResetToken: request.passwordResetToken,
    });

    if (!user) {
      return res.status(404).json({ error: 'INVALID_TOKEN' });
    }

    const tokenIsValid = compareAsc(
      new Date(),
      user.passwordResetExpiration,
    );

    if (tokenIsValid !== -1) {
      return res.status(400).json({ error: 'RESET_TOKEN_EXPIRED' });
    }

    res.status(200).json({ message: 'SUCCESS' });
  }

  async resetPassword(req: Request, res: Response) {
    const request = req.body;

    // First do validation on the input
    const validator = userSchemaResetPassword.validate(request, { abortEarly: false });
    if (validator.error) {
      return res.status(400).json({ error: validator.error.details[0].message });
    }

    // Ok, let's make sure their token is correct again, just to be sure since it could have
    // been some time between page entrance and form submission
    const userRep = await getRepository(User);
    const user = await userRep.findOne({
      email: request.email,
      passwordResetToken: request.passwordResetToken,
    });
    if (!user) {
      return res.status(404).json({ error: 'INVALID_TOKEN' });
    }

    const tokenIsValid = compareAsc(
      new Date(),
      user.passwordResetExpiration,
    );

    if (tokenIsValid !== -1) {
      return res.status(400).json({ error: 'RESET_TOKEN_EXPIRED' });
    }

    // Ok, so we're good. Let's reset their password with the new one they submitted.
    // Hash it
    try {
      request.password = await bcrypt.hash(request.password, 12);
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    try {
      userRep.update(
        { email: request.email },
        {
          password: request.password,
          passwordResetToken: null,
          passwordResetExpiration: null,
        },
      );
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    return res.status(200).json({ message: 'SUCCESS' });
  }

  async private(req: Request, res: Response) {
    return res.status(200).json({ user: req.decoded });
  }

  async generateUniqueToken() {
    const token = new randexp(/[a-zA-Z0-9_-]{7,7}/).gen();

    if (await this.checkUniqueToken(token)) {
      await this.generateUniqueToken();
    } else {
      return await token;
    }
  }

  async checkUniqueToken(token: string) {
    const userRepository = await getRepository(User);
    const [, notUniqueToken] = await userRepository.findAndCount({ token });
    return !!notUniqueToken;
  }

}

export default UserController;
