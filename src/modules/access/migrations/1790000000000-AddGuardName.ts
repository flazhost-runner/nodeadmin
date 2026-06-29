import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

// Tambah kolom `guard_name` (jalur auth: 'web' / 'api') ke permissions.
// Default 'web' → baris lama otomatis ter-backfill ke 'web' (MySQL/PG/SQLite).
// Dipakai untuk filter & kategorisasi izin per-jalur. Portabel (varchar, default
// di-quote eksplisit). Skema KANONIK ini WAJIB identik di semua port (lihat
// docs/PORTING_GUIDE.md "Skema DB KANONIK").
export class AddGuardName1790000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("permissions", new TableColumn({
            name: "guard_name",
            type: "varchar",
            length: "20",
            isNullable: true,
            default: "'web'",
        }));
        await queryRunner.createIndex("permissions", new TableIndex({
            name: "permissions__guard",
            columnNames: ["guard_name"],
        }));
        // Permission ter-auto-register dari route bernama: 'api.*' = jalur API.
        // Backfill guard 'api' untuk baris lama (default sudah 'web' utk sisanya).
        // SQL portabel (LIKE 'api.%' — '.' literal, '%' wildcard).
        await queryRunner.query("UPDATE permissions SET guard_name = 'api' WHERE name LIKE 'api.%'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("permissions", "permissions__guard");
        await queryRunner.dropColumn("permissions", "guard_name");
    }
}
