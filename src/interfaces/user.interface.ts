export interface IRequestUserInfo {
  ipAddress?: string;
  userAgent?: string;
}

export interface IUserCreateDTO extends IRequestUserInfo{
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface IAuthDTO extends IRequestUserInfo {
  username: string;
  password: string;
}

export interface IRefreshAccessTokenDTO extends IRequestUserInfo {
  username: string;
  refreshToken: string;
}

export interface IResetPassDTO {
  email: string;
  password: string;
  passwordResetToken: string;
}