import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Role } from './role.entity'

enum StatusEnum {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  @Index('permissions__id')
  id!: string

  @Column()
  @Index('permissions__name')
  name!: string

  // guard_name = jalur auth permission ('web' panel / 'api' REST+JWT) — untuk
  // filter & kategorisasi. varchar (bukan ENUM) agar portabel lintas dialek.
  @Column({ type: 'varchar', length: 20, default: 'web' })
  @Index('permissions__guard')
  guard_name!: string

  @Column()
  @Index('permissions__method')
  method!: string

  // varchar + enum TS (bukan native ENUM) agar seragam di semua dialek TypeORM
  @Column({ type: 'varchar', length: 20, default: StatusEnum.ACTIVE })
  @Index('permissions__status')
  status!: StatusEnum

  @Column({ nullable: true })
  @Index('permissions__desc')
  desc!: string

  @Column({ nullable: true })
  created_by!: string

  @Column({ nullable: true })
  updated_by!: string

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[]
}
