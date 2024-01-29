/* eslint-disable indent */
import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'
import { Artist } from './artist'
import { Image } from './image'

@Entity('image_artist', { schema: 'public' })
export class ImageArtist {
  @ManyToOne(() => Image, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  @PrimaryColumn()
  image_id: number

  @ManyToOne(() => Artist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artist_id' })
  @PrimaryColumn()
  artist_id: number
}
