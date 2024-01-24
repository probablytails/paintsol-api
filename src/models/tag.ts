/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Unique, PrimaryColumn, ManyToMany,
  JoinTable } from 'typeorm'
import { Image } from './image'

@Entity('tag', { schema: 'public' })
@Unique(['title'])
export class Tag {
  @PrimaryGeneratedColumn('increment')
  id?: number

  // The title must be lowercase according to column check in 0001_initialize.sql
  @PrimaryColumn({ type: 'varchar', length: 255, unique: true })
  title: string

  @ManyToMany(() => Image, { cascade: true })
  @JoinTable({
    name: 'image_tag',
    joinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'image_id', referencedColumnName: 'id' }
  })
  images: Image[]
}

