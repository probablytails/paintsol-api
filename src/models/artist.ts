/* eslint-disable indent */
import { Entity, PrimaryGeneratedColumn, Unique, PrimaryColumn, ManyToMany,
  JoinTable, 
  Column } from 'typeorm'
import { Image } from './image'

@Entity('artist', { schema: 'public' })
@Unique(['name'])
export class Artist {
  @PrimaryGeneratedColumn('increment')
  id?: number

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true
  })
  deca_username: string | null

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true
  })
  foundation_username: string | null

  @Column({ type: 'boolean', default: false })
  has_profile_picture: boolean

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true
  })
  instagram_username: string | null

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
    length: 500,
    nullable: true
  })
  superrare_username: string | null

  @Column({ type: 'int', default: 0 })
  total_images: number

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
