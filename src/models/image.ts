/* eslint-disable indent */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm'
import { Tag } from './tag'

@Entity('image', { schema: 'public' })
export class Image {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: 'varchar',
    length: 256,
    nullable: true
  })
  title: string | null

  @ManyToMany(() => Tag, { cascade: true })
  @JoinTable({
    name: 'image_tag',
    joinColumn: { name: 'image_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' }
  })
  tags: Tag[]

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}
