/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Image } from './image'

@Entity('collection', { schema: 'public' })
export class Collection {
  @PrimaryGeneratedColumn('increment')
  id?: number

  @Column({
    type: 'varchar',
    length: 256,
    nullable: true
  })
  slug: string | null

  @Column({ length: 2083, nullable: true })
  stickers_url: string | null

  @Column({
    type: 'varchar',
    length: 256,
    nullable: true
  })
  title: string | null

  @Column({ length: 20, default: 'general', enum: ['general', 'telegram-stickers', 'discord-stickers'] })
  type: string

  @ManyToMany(() => Image, { cascade: true })
  @JoinTable({
    name: 'collection_image',
    joinColumn: { name: 'collection_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'image_id', referencedColumnName: 'id' }
  })
  images: Image[]

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date
}
