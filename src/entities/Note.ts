import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('notes')
export class Note {

  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column('int', {
    name: 'userId',
  })
  userId: number;

  @Column('varchar', {
    name: 'title',
  })
  title: string;

  @Column('text', {
    name: 'content',
  })
  content: string;

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
