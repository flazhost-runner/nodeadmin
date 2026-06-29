import { MigrationInterface, QueryRunner } from "typeorm";
import { User } from "../models/user.entity";
import { Role } from "../models/role.entity";
import { v6 as uuidv6 } from "uuid";
import bcrypt from "bcryptjs";

enum StatusEnum {
    ACTIVE = "Active",
    INACTIVE = "Inactive"
}

export class AddAdminUser1721111356244 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const idUser = uuidv6()
        const idRole = uuidv6()
        await queryRunner.manager.insert(User, {
            id: idUser,
            code: "0000000001",
            name: "Administrator",
            phone: "12345678910",
            email: "admin@admin.com",
            email_verified_at: new Date().toISOString(),
            password: await bcrypt.hash("12345678", 10),
            status: StatusEnum.ACTIVE,
            timezone: "Asia/Jakarta",
            blocked: false,
            blocked_reason: "",
        })
        await queryRunner.manager.insert(Role, {
            id: idRole,
            name: "Administrator",
            status: StatusEnum.ACTIVE,
            desc: "",
        })
        // Pakai query builder portabel + kolom eksplisit (hindari INSERT positional
        // yang bergantung urutan kolom & quoting identifier spesifik-dialek).
        await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into("users_roles", ["user_id", "role_id"])
            .values({ user_id: idUser, role_id: idRole })
            .execute()
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        //
    }

}
