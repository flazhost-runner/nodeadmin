import { Entity, Column, PrimaryColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
    @PrimaryColumn({ type: 'varchar', length: 36 })
    id?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    initial?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    name?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    icon?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    logo?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    login_image?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    phone?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    address?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index('settings__setting_email')
    email?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    copyright?: string;

    @Column({ type: 'varchar', length: 36, nullable: true })
    created_by?: string;

    @Column({ type: 'varchar', length: 36, nullable: true })
    updated_by?: string;

    // Template/tema aktif (template switcher) — nama palet di src/config/themes.ts
    @Column({ type: 'varchar', length: 20, nullable: true, default: 'Blue' })
    theme?: string;

    // Template frontend (landing) aktif — slug di src/config/feTemplates.ts
    @Column({ type: 'varchar', length: 80, nullable: true, default: 'agency-consulting-002-creative-agency' })
    fe_template?: string;

    @CreateDateColumn()
    created_at?: Date;

    @UpdateDateColumn()
    updated_at?: Date;
}
