import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import config from '../../config';

if (!config.get('env')) {
  throw new Error('NODE_ENV not set');
}

export class CreateNotesTable1570438732306 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'notes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'content',
            type: 'text',
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
      await queryRunner.dropTable('notes');
    }
  }

}
