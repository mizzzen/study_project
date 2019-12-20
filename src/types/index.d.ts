interface IDecode {
  id: number,
  token: string,
  username: string,
  email: string,
  password: string,
  isAdmin: boolean,
}

declare namespace Express {
  export interface Request {
    clientIp?: string
    userAgent?: any
    decoded?: IDecode
  }
}
