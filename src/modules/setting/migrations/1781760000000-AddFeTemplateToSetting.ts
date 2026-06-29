import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

const DEFAULT_FE = "agency-consulting-002-creative-agency";

export class AddFeTemplateToSetting1781760000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("settings");
        if (table && !table.findColumnByName("fe_template")) {
            await queryRunner.addColumn("settings", new TableColumn({
                name: "fe_template",
                type: "varchar",
                length: "80",
                isNullable: true,
                default: `'${DEFAULT_FE}'`,
            }));
        }
        // Backfill baris lama (fe_template NULL) dengan default.
        await queryRunner.manager
            .createQueryBuilder()
            .update("settings")
            .set({ fe_template: DEFAULT_FE })
            .where("fe_template IS NULL")
            .execute();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("settings");
        if (table && table.findColumnByName("fe_template")) {
            await queryRunner.dropColumn("settings", "fe_template");
        }
    }

}
