import { Entity, PrimaryGeneratedColumn, Column, JoinTable, ManyToMany, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Role } from './role.entity'

enum StatusEnum {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Index('users__id')
  id!: string

  @Column({ length: 20 })
  @Index('users__code', { unique: true })
  code!: string

  @Column({ length: 50 })
  @Index('users__name')
  name!: string

  @Column({ length: 15, nullable: true })
  @Index('users__phone')
  phone!: string

  @Column()
  @Index('users__email', { unique: true })
  email!: string

  @Column({ nullable: true })
  email_verified_at!: Date

  @Column()
  password!: string

  @Column({ nullable: true })
  password_otp!: string

  // Masa berlaku OTP (epoch ms). Bigint agar muat timestamp ms.
  @Column({ type: 'bigint', nullable: true })
  password_otp_expires!: string | null

  // varchar + enum TS (bukan native ENUM) agar seragam di semua dialek TypeORM
  @Column({ type: 'varchar', length: 20, default: StatusEnum.ACTIVE })
  @Index('users__status')
  status!: StatusEnum

  @Column({ nullable: true })
  picture!: string

  @Column({ default: false })
  @Index('users__blocked')
  blocked!: boolean

  @Column({ nullable: true })
  blocked_reason!: string

  @Column({ nullable: true, default: 'UTC' })
  @Index('users__timezone')
  timezone!: string

  @Column({ nullable: true })
  created_by!: string

  @Column({ nullable: true })
  updated_by!: string

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'users_roles',
    joinColumn: {
      name: 'user_id', // Kolom dalam tabel join yang mereferensikan User
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'role_id', // Kolom dalam tabel join yang mereferensikan Role
      referencedColumnName: 'id'
    }
  })
  roles!: Role[]
}
