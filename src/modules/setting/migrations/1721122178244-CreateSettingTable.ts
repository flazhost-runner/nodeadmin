import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSettingTable1721122178244 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "settings",
            columns: [
                {
                    name: "id",
                    type: "char",
                    length: "36",
                    isPrimary: true,
                    isNullable: false
                },
                {
                    name: "initial",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "icon",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "logo",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "login_image",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "phone",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "address",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "email",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "copyright",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "theme",
                    type: "varchar",
                    length: "20",
                    isNullable: true,
                    default: "'Blue'"
                },
                {
                    name: "created_by",
                    type: "char",
                    length: "36",
                    isNullable: true
                },
                {
                    name: "updated_by",
                    type: "char",
                    length: "36",
                    isNullable: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    isNullable: true
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    isNullable: true
                }
            ],
            indices: [
                {
                    name: "settings__id",
                    columnNames: ["id"]
                },
                {
                    name: "settings__initial",
                    columnNames: ["initial"]
                },
                {
                    name: "settings__name",
                    columnNames: ["name"]
                },
                {
                    name: "settings__icon",
                    columnNames: ["icon"]
                },
                {
                    name: "settings__logo",
                    columnNames: ["logo"]
                },
                {
                    name: "settings__login_image",
                    columnNames: ["login_image"]
                },
                {
                    name: "settings__phone",
                    columnNames: ["phone"]
                },
                {
                    name: "settings__setting_email",
                    columnNames: ["email"]
                },
                {
                    name: "settings__copyright",
                    columnNames: ["copyright"]
                },
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("settings");
    }

}
