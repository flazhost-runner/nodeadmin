import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddOtpExpiryToUser1781747597919 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("users");
        if (table && !table.findColumnByName("password_otp_expires")) {
            await queryRunner.addColumn("users", new TableColumn({
                name: "password_otp_expires",
                type: "bigint",
                isNullable: true,
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("users");
        if (table && table.findColumnByName("password_otp_expires")) {
            await queryRunner.dropColumn("users", "password_otp_expires");
        }
    }

}
