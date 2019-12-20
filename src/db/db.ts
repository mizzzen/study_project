import { createConnection, getConnectionOptions } from 'typeorm';
import config from '../config';

export const createTypeormConn = async () => {
  const connectionOptions = await getConnectionOptions(config.get('env'));
  return createConnection(connectionOptions);
};
