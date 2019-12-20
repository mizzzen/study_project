import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {

  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column('varchar', {
    nullable: false,
    name: 'token',
  })
  token: string;

  @Column('varchar', {
    nullable: false,
    name: 'firstName',
  })
  firstName: string;

  @Column('varchar', {
    nullable: false,
    name: 'lastName',
  })
  lastName: string;

  @Column('varchar', {
    nullable: false,
    length: 191,
    name: 'username',
    unique: true,
  })
  username: string;

  @Column('varchar', {
    nullable: false,
    length: 191,
    name: 'email',
    unique: true,
  })
  email: string;

  @Column('varchar', {
    nullable: false,
    name: 'password',
  })
  password: string;

  @Column('varchar', {
    name: 'passwordResetToken',
  })
  passwordResetToken: string;

  @Column('varchar', {
    nullable: true,
    name: 'passwordResetExpiration',
  })
  passwordResetExpiration: Date;

  @Column('boolean', {
    nullable: false,
    name: 'sendPromotionalEmails',
  })
  sendPromotionalEmails: boolean = false;

  @Column('boolean', {
    nullable: false,
    name: 'isAdmin',
  })
  isAdmin: boolean = false;

  @Column('boolean', {
    nullable: false,
    name: 'isDeleted',
  })
  isDeleted: boolean = false;

  @Column('int', {
    name: 'loginCount',
  })
  loginCount: number = 0;

  @Column('varchar', {
    name: 'ipAddress',
  })
  ipAddress: string;

  @UpdateDateColumn({
    name: 'updatedAt',
    nullable: true,
  })
  updatedAt: Date;

  @CreateDateColumn({
    name: 'createdAt',
    nullable: false,
  })
  createdAt: Date;
}
