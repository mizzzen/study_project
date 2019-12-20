import randexp from 'randexp';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import fsExtra from 'fs-extra';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import {
  IAuthDTO,
  IRefreshAccessTokenDTO,
  IResetPassDTO,
  IUserCreateDTO,
} from '../interfaces/user.interface';
import {
  addMonths,
  compareAsc,
  addMinutes,
} from 'date-fns';
import { default as sgMail } from '@sendgrid/mail';
import config from '../config';

export default class UserService {
  async signup(userData: IUserCreateDTO) {
    const userRepository = await getRepository(User);
    const user = userRepository.merge(new User(), userData);

    const duplicateUsername = await userRepository.findOne({
      username: user.username,
    });
    if (duplicateUsername) {
      throw new Error('DUPLICATE_USERNAME');
    }

    const duplicateEmail = await userRepository.findOne({
      email: user.email,
    });
    if (duplicateEmail) {
      throw new Error('DUPLICATE_EMAIL');
    }

    try {
      user.password = await bcrypt.hash(user.password, 12);
    } catch (e) {
      throw new Error('INVALID_DATA');
    }

    user.token = await this.generateUniqueToken();
    user.ipAddress = userData.ipAddress;

    try {
      return await userRepository.save(user);
    } catch (e) {
      throw new Error('SERVER_ERR');
    }
  }

  async authenticate(authInput: IAuthDTO) {
    const { username, password } = authInput;

    const userRepository = await getRepository(User);
    const userData = await userRepository.findOne({ username });

    if (!userData) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const correct = await bcrypt.compare(
      password,
      userData.password,
    );

    if (!correct) {
      throw new Error('INVALID_CREDENTIALS');
    }

    delete userData.password;

    const refreshTokenRepository = await getRepository(RefreshToken);
    const refreshTokenData = refreshTokenRepository.create({
      username,
      refreshToken: new randexp(/[a-zA-Z0-9_-]{64,64}/).gen(),
      info: authInput.userAgent,
      ipAddress: authInput.ipAddress,
      expiration: addMonths(new Date(), 1),
      isValid: true,
    });

    try {
      await refreshTokenRepository.insert(refreshTokenData);
    } catch (e) {
      throw new Error('INVALID_DATA');
    }

    try {
      await userRepository.increment(userData, 'loginCount', 1);
    } catch (e) {
      throw new Error('INVALID_DATA');
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

    return {
      accessToken: token,
      refreshToken: refreshTokenData.refreshToken,
    };
  }

  async refreshAccessToken(input: IRefreshAccessTokenDTO) {
    const { username, refreshToken } = input;

    const refreshTokenRep = await getRepository(RefreshToken);
    const refreshTokenData = await refreshTokenRep.findOne({
      username,
      refreshToken,
      isValid: true,
    });

    if (!refreshTokenData) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const refreshTokenIsValid = compareAsc(
      new Date(),
      refreshTokenData.expiration,
    );
    if (refreshTokenIsValid !== -1) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }

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
      throw new Error('INVALID_DATA');
    }

    const userRep = await getRepository(User);

    const userData = await userRep.findOne({ username });
    if (!userData) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const newRefreshToken = {
      username,
      refreshToken: new randexp(/[a-zA-Z0-9_-]{64,64}/).gen(),
      info: input.userAgent,
      ipAddress: input.ipAddress,
      expiration: addMonths(new Date(), 1),
      isValid: true,
    };

    try {
      await refreshTokenRep.insert(newRefreshToken);
    } catch (e) {
      throw new Error('INVALID_DATA');
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

    return {
      accessToken: token,
      refreshToken: newRefreshToken.refreshToken,
    };
  }

  async invalidateAllRefreshTokens(username: string) {
    try {
      const refreshTokenRep = await getRepository(RefreshToken);
      await refreshTokenRep.update({ username }, { isValid: false });

      return true;
    } catch (e) {
      throw new Error('INVALID_DATA');
    }
  }

  async invalidateRefreshToken(username: string, refreshToken: string) {
    const refreshTokenRep = await getRepository(RefreshToken);

    const existToken = await refreshTokenRep.findOne({ username, refreshToken, isValid: true });
    if (!existToken) {
      throw new Error('INVALID_DATA');
    }

    try {
      await refreshTokenRep.update(
        {
          username,
          refreshToken,
          isValid: true,
        },
        { isValid: false },
        );

      return true;
    } catch (e) {
      throw new Error('INVALID_DATA');
    }
  }

  async forgot(email: string, reqUrl: string) {
    const userRep = getRepository(User);

    const userExist = await userRep.findOne({ email });
    if (!userExist) {
      throw new Error('INVALID_DATA');
    }

    const resetData = {
      passwordResetToken: new randexp(/[a-zA-Z0-9_-]{64,64}/).gen(),
      passwordResetExpiration: addMinutes(new Date(), 30),
    };

    try {
      await userRep.update(
        { email },
        { ...resetData },
      );
    } catch (e) {
      throw new Error('INVALID_DATA');
    }

    const emailTemplate = await fsExtra.readFile('./templates/email/forgot.html', 'utf8');
    const resetUrlCustom = `${ reqUrl }?passwordResetToken=${ resetData.passwordResetToken }&email=${ email }`;
    const emailData = {
      to: email,
      from: config.get('app.email'),
      subject: `Password Reset For ${ config.get('app.name') }`,
      html: emailTemplate,
      categories: [`${ config.get('app.name') }-forgot`],
      substitutions: {
        email,
        appName: config.get('app.name'),
        resetUrl: resetUrlCustom,
      },
    };

    // if (config.get('env') !== 'test') {
    //   await sgMail.send(emailData);
    // }

    return resetData.passwordResetToken;
  }

  async checkPasswordResetToken(email, passwordResetToken) {
    const userRep = getRepository(User);

    const user = await userRep.findOne({
      email,
      passwordResetToken,
    });

    if (!user) {
      throw new Error('INVALID_TOKEN');
    }

    const tokenIsValid = compareAsc(
      new Date(),
      user.passwordResetExpiration,
    );

    if (tokenIsValid !== -1) {
      throw new Error('RESET_TOKEN_EXPIRED');
    }

    return true;
  }

  async resetPassword(input: IResetPassDTO) {
    const { email, passwordResetToken } = input;
    let { password } = input;
    const userRep = await getRepository(User);

    const user = await userRep.findOne({ email, passwordResetToken });
    if (!user) {
      throw new Error('INVALID_TOKEN');
    }

    const tokenIsValid = compareAsc(
      new Date(),
      user.passwordResetExpiration,
    );
    if (tokenIsValid !== -1) {
      throw new Error('RESET_TOKEN_EXPIRED');
    }

    try {
      password = await bcrypt.hash(password, 12);
    } catch (e) {
      throw new Error('INVALID_DATA');
    }

    try {
      userRep.update(
        { email },
        {
          password,
          passwordResetToken: null,
          passwordResetExpiration: null,
        },
      );
    } catch (e) {
      throw new Error('INVALID_DATA');
    }

    return true;
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
    const notUniqueToken = await userRepository.findOne({ token });
    return !!notUniqueToken;
  }
}
