// import * as swaggerValidator from 'express-ajv-swagger-validation';
import { default as swaggerValidator } from 'express-ajv-swagger-validation';

const swaggerFilePath = 'swagger.yaml';
swaggerValidator.init(
  swaggerFilePath,
  {
    // beautifyErrors: true,
    formats: [
      { name: 'username', pattern: /^[a-zA-Z0-9@]+$/ },
      { name: 'refreshToken', pattern: /^[a-zA-Z0-9_-]{64,64}$/ },
      { name: 'passwordResetToken', pattern: /^[a-zA-Z0-9_-]{64,64}$/ },
    ],
  },
);

export default swaggerValidator;
