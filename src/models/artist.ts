/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Unique, PrimaryColumn, ManyToMany,
  JoinTable, 
  Column} from 'typeorm'
import { Image } from './image'

@Entity('artist', { schema: 'public' })
@Unique(['name'])
export class Artist {
  @PrimaryGeneratedColumn('increment')
  id?: number

  @Column({ type: 'boolean', default: false })
  has_profile_picture: boolean

  // The name uses a case-insensitive uniqueness check.
  // See migration file 0004 for details.
  @PrimaryColumn({ type: 'varchar', length: 255, unique: true })
  name: string

  @Column({
    type: 'varchar',
    length: 256,
    nullable: true
  })
  slug: string | null

  @Column({
    type: 'varchar',
    length: 15,
    nullable: true
  })
  twitter_username: string | null

  @ManyToMany(() => Image, { cascade: true })
  @JoinTable({
    name: 'image_artist',
    joinColumn: { name: 'artist_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'image_id', referencedColumnName: 'id' }
  })
  images: Image[]
}

