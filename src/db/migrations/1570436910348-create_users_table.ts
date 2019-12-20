import { MigrationInterface, QueryRunner, Table, PrimaryGeneratedColumn } from 'typeorm';
import config from '../../config';

if (!config.get('env')) {
  throw new Error('NODE_ENV not set');
}

export class CreateUsersTable1570436910348 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
            generationStrategy: 'increment',
          },
          {
            name: 'token',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'firstName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'lastName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '191',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '191',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'passwordResetToken',
            type: 'varchar',
          },
          {
            name: 'passwordResetExpiration',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sendPromotionalEmails',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'isAdmin',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'isDeleted',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'loginCount',
            type: 'int',
            default: 0,
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
      true);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    if (config.get('env') !== 'production') {
      await queryRunner.dropTable('users');
    }
  }
}
