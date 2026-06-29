import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm"

export class CreateUserTable1719569566358 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "36",
                        isPrimary: true,
                    },
                    {
                        name: "code",
                        type: "varchar",
                        length: "20",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "50",
                    },
                    {
                        name: "phone",
                        type: "varchar",
                        isNullable: true,
                        length: "15",
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                    },
                    {
                        name: "email_verified_at",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "password",
                        type: "varchar",
                        length: "255",
                    },
                    {
                        name: "password_otp",
                        type: "varchar",
                        length: "50",
                        isNullable: true,
                    },
                    {
                        name: "password_otp_expires",
                        type: "varchar",
                        length: "50",
                        isNullable: true,
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "20",
                        default: "'Active'"
                    },
                    {
                        name: "picture",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "timezone",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                        default: "'UTC'"
                    },
                    {
                        name: "blocked",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "blocked_reason",
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
            "users",
            new TableIndex({
                name: "users__id",
                columnNames: ["id"],
            }),
        )
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "users__code",
                columnNames: ["code"],
            }),
        )
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "users__name",
                columnNames: ["name"],
            }),
        )
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "users__phone",
                columnNames: ["phone"],
            }),
        )
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "users__email",
                columnNames: ["email"],
            }),
        )
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "users__status",
                columnNames: ["status"],
            }),
        )
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "users__timezone",
                columnNames: ["timezone"],
            }),
        )
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "users__blocked",
                columnNames: ["blocked"],
            }),
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users")
    }

}
