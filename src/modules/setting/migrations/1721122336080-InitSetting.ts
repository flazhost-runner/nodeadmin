import { MigrationInterface, QueryRunner } from "typeorm";
import { v6 as uuidv6 } from 'uuid';

export class InitSetting1721122336080 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Seed via raw query (bukan entity Setting) agar tak terikat metadata
        // entity: kalau pakai entity/QueryBuilder ber-target "settings", TypeORM
        // ikut menyertakan & me-reload kolom ber-default dari metadata (mis.
        // fe_template) yang belum ada di tabel pada titik migrasi ini → fresh
        // install gagal. Placeholder portabel lintas-dialect (? / $1).
        const cols = ["id", "initial", "name", "description", "icon", "logo", "login_image"]
        const values = [
            uuidv6(),
            "Node Admin",
            "Node Admin",
            "Node Admin",
            "modules/setting/laravel.png",
            "modules/setting/laravel.png",
            "modules/setting/laravel.png",
        ]
        const driver = queryRunner.connection.driver
        const params = cols.map((_, i) => driver.createParameter(`p${i}`, i))
        const colList = cols.map((c) => driver.escape(c)).join(", ")
        await queryRunner.query(
            `INSERT INTO ${driver.escape("settings")} (${colList}) VALUES (${params.join(", ")})`,
            values,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
