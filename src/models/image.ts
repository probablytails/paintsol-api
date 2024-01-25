/* eslint-disable indent */
import { Entity, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany, JoinTable, PrimaryColumn } from 'typeorm'
import { Tag } from './tag'

@Entity('image', { schema: 'public' })
export class Image {
  @PrimaryColumn()
  id: number

  @Column({ type: 'boolean', default: false })
  has_animation: boolean
  
  @Column({ type: 'boolean', default: false })
  has_border: boolean
  
  @Column({ type: 'boolean', default: false })
  has_no_border: boolean
  
  @Column({ type: 'boolean', default: false })
  has_video: boolean

  @Column({
    type: 'varchar',
    length: 256,
    nullable: true
  })
  slug: string | null

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
