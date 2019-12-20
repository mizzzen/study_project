import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import config from '../../config';

if (!config.get('env')) {
  throw new Error('NODE_ENV not set');
}

export class CreateRefreshTokenTable1570438711263 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'int',
            isGenerated: true,
            generationStrategy: 'increment',
            isPrimary: true,
          },
          {
            name: 'username',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'refreshToken',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'info',
            type: 'varchar',
          },
          {
            name: 'isValid',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'expiration',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            isNullable: true,
            default: 'NULL ON UPDATE CURRENT_TIMESTAMP',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    if (config.get('env') !== 'production') {
      await queryRunner.dropTable('refresh_tokens');
    }
  }
}
