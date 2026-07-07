import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity('sessions')
export class AppSession {
    @PrimaryColumn({ type: 'varchar', length: 128 })
    id!: string

    @Column({ type: 'text' })
    data!: string

    @Column({ name: 'expires_at' })
    expiresAt!: Date
}
