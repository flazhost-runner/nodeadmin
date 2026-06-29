import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserRoleTable1721110998347 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "users_roles",
                columns: [
                    {
                        name: "user_id",
                        type: "varchar",
                        length: "36",
                    },
                    {
                        name: "role_id",
                        type: "varchar",
                        length: "36",
                    },
                ],
            }),
            true,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users_roles")
    }

}
