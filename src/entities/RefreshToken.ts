import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {

  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column('varchar', {
    nullable: false,
    name: 'username',
  })
  username: string;

  @Column('varchar', {
    nullable: false,
    name: 'refreshToken',
  })
  refreshToken: string | Promise<string>;

  @Column('varchar', {
    name: 'info',
  })
  info: string;

  @Column('boolean', {
    nullable: false,
    name: 'isValid',
  })
  isValid: boolean;

  @Column('timestamp', {
    nullable: true,
    name: 'expiration',
  })
  expiration: Date;

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
