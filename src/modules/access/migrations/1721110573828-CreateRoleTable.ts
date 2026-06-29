import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateRoleTable1721110573828 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "roles",
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
            "roles",
            new TableIndex({
                name: "roles__id",
                columnNames: ["id"],
            }),
        )
        await queryRunner.createIndex(
            "roles",
            new TableIndex({
                name: "roles__name",
                columnNames: ["name"],
                isUnique: true,
            }),
        )
        await queryRunner.createIndex(
            "roles",
            new TableIndex({
                name: "roles__status",
                columnNames: ["status"],
            }),
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("roles")
    }

}
