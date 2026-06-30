import { DataSourceOptions } from 'typeorm';
import path from 'path';
import { createDataSource } from '@flazhost-nodeadmin/core';
import env from './env';
import { Permission } from '../modules/access/models/permission.entity';
import { Role } from '../modules/access/models/role.entity';
import { User } from '../modules/access/models/user.entity';
import { Setting } from '../modules/setting/models/setting.entity';

// migExt: '.ts' saat dijalankan lewat ts-node (dev), '.js' saat dari dist (produksi).
// Ini mencegah glob *.ts mencari file yang tidak ada di dist/ → 0 migrasi → OOM.
const migExt = path.extname(__filename);

// Dialect dibaca apa adanya dari env — TypeORM mendukung mysql | mariadb |
// postgres | cockroachdb | sqlite | better-sqlite3 | mssql | oracle | dll.
// Percabangan dialect/pool/timezone ditangani core; app menyuntik entity & migration.
const AppDataSource = createDataSource({
    type: env.db.type as DataSourceOptions['type'],
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    database: env.db.database,
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    connectionLimit: env.db.connectionLimit,
    entities: [Permission, Role, User, Setting],
    migrations: [path.resolve(__dirname, `../modules/**/migrations/*${migExt}`)],
});

export default AppDataSource;
