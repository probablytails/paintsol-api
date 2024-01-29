/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Unique, PrimaryColumn, ManyToMany,
  JoinTable } from 'typeorm'
import { Image } from './image'

@Entity('artist', { schema: 'public' })
@Unique(['name'])
export class Artist {
  @PrimaryGeneratedColumn('increment')
  id?: number

  // The name uses a case-insensitive uniqueness check.
  // See migration file 0004 for details.
  @PrimaryColumn({ type: 'varchar', length: 255, unique: true })
  name: string

  @ManyToMany(() => Image, { cascade: true })
  @JoinTable({
    name: 'image_artist',
    joinColumn: { name: 'artist_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'image_id', referencedColumnName: 'id' }
  })
  images: Image[]
}

