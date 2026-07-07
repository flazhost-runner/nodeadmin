import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateSessionTable1782815380885 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'sessions',
            columns: [
                { name: 'id', type: 'varchar', length: '128', isPrimary: true },
                { name: 'data', type: 'text' },
                { name: 'expires_at', type: queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime' },
            ],
        }), true)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('sessions', true)
    }
}
