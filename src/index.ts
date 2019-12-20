import 'reflect-metadata';
import config from './config';
import { default as App } from './app';
import { createConnection } from 'typeorm';

createConnection();

const app = new App().app;
const port = config.get('port');
const server = app.listen(port, () => {
  console.log(`Server running at ${ port }`);
  console.log(`Running in ${ process.env.NODE_ENV } v${ process.env.npm_package_version }`);
  console.log(`Link http://localhost:${ port }`);
});

export { server };
