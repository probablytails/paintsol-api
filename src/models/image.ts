/* eslint-disable indent */
import { Entity, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany, JoinTable, PrimaryColumn, AfterInsert, AfterRemove } from 'typeorm'
import { Artist } from './artist'
import { Tag } from './tag'
import { Collection } from './collection'
import appDataSource from '../db'
import { getArtistById, getTotalImagesWithArtistId } from '../controllers/artist'
import { handleLogError } from '../lib/errors'

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

  @Column({ length: 17, default: 'painting', enum: ['painting', 'meme', 'painting-and-meme'] })
  type: string

  @ManyToMany(() => Artist, { cascade: true })
  @JoinTable({
    name: 'image_artist',
    joinColumn: { name: 'image_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'artist_id', referencedColumnName: 'id' }
  })
  artists: Artist[]

  @ManyToMany(() => Collection, { cascade: true })
  @JoinTable({
    name: 'collection_image',
    joinColumn: { name: 'image_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'collection_id', referencedColumnName: 'id' }
  })
  collections: Collection[]

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

  @AfterInsert()
  async updateArtistTotalImagesAfterInsert() {
    try {
      const artists = this.artists || []
      if (artists.length > 0) {
        for (const artist of artists) {
          const artistRepository = appDataSource.getRepository(Artist)
          const currentCount = await getTotalImagesWithArtistId(artist.id)
          const existingArtist = await getArtistById(artist.id)
          existingArtist.total_images = currentCount + 1
          await artistRepository.save(existingArtist)
        }
      }
    } catch (error) {
      handleLogError(error)
    }
  }

  @AfterRemove()
  async updateArtistTotalImagesAfterRemove() {
    try {
      const artists = this.artists || []
      if (artists.length > 0) {
        for (const artist of artists) {
          const artistRepository = appDataSource.getRepository(Artist)
          const currentCount = await getTotalImagesWithArtistId(artist.id)
          const existingArtist = await getArtistById(artist.id)
          if (currentCount >= 1) {
            existingArtist.total_images = currentCount - 1
          }
          await artistRepository.save(existingArtist)
        }
      }
    } catch (error) {
      handleLogError(error)
    }
  }
}
