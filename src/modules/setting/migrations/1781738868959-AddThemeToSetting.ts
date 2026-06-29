import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddThemeToSetting1781738868959 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("settings");
        if (table && !table.findColumnByName("theme")) {
            await queryRunner.addColumn("settings", new TableColumn({
                name: "theme",
                type: "varchar",
                length: "20",
                isNullable: true,
                default: "'Blue'",
            }));
        }
        // Isi baris yang sudah ada (theme NULL) dengan default 'Blue'
        await queryRunner.manager
            .createQueryBuilder()
            .update("settings")
            .set({ theme: "Blue" })
            .where("theme IS NULL")
            .execute();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("settings");
        if (table && table.findColumnByName("theme")) {
            await queryRunner.dropColumn("settings", "theme");
        }
    }

}
