const path = require('path');

module.exports = [
  {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
      'dist/entities/**/*.js',
    ],
    timezone: '+00:00',
    charset: 'utf8_bin',
    migrationsTableName: 'typeorm_migrations',
    migrations: [
      'dist/db/migrations/*.js',
    ],
    cli: {
      migrationsDir: './src/db/migrations',
      entitiesDir: './src/entities',
    },
  },
  {
    name: 'test',
    type: 'mysql',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: `${ process.env.DB_DATABASE }_test`,
    entities: [
      'src/entities/**/*.ts',
      'dist/entities/**/*.js',
    ],
    timezone: '+00:00',
    charset: 'utf8_bin',
    migrationsTableName: 'typeorm_migrations',
    migrations: [
      'dist/db/migrations/*.js',
    ],
  },
];
