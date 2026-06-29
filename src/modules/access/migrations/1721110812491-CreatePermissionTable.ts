import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreatePermissionTable1721110812491 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "permissions",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "36",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "255",
                    },
                    {
                        name: "method",
                        type: "varchar",
                        length: "255",
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "20",
                        default: "'Active'"
                    },
                    {
                        name: "desc",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "created_by",
                        type: "varchar",
                        length: "36",
                        isNullable: true,
                    },
                    {
                        name: "updated_by",
                        type: "varchar",
                        length: "36",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                ],
            }),
            true,
        )

        await queryRunner.createIndex(
            "permissions",
            new TableIndex({
                name: "permissions__id",
                columnNames: ["id"],
            }),
        )
        await queryRunner.createIndex(
            "permissions",
            new TableIndex({
                name: "permissions__name",
                columnNames: ["name"],
            }),
        )
        await queryRunner.createIndex(
            "permissions",
            new TableIndex({
                name: "permissions__method",
                columnNames: ["method"],
            }),
        )
        await queryRunner.createIndex(
            "permissions",
            new TableIndex({
                name: "permissions__status",
                columnNames: ["status"],
            }),
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("permissions")
    }

}
