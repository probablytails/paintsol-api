/* eslint-disable indent */
import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Column } from 'typeorm'
import { Collection } from './collection'
import { Image } from './image'

@Entity('collection_image', { schema: 'public' })
export class CollectionImage {
  @PrimaryColumn()
  collection_id: number

  @PrimaryColumn()
  image_id: number

  @Column()
  image_position: number

  @Column()
  preview_position: number

  @ManyToOne(() => Collection, collection => collection.images)
  @JoinColumn({ name: 'collection_id' })
  collection: Collection

  @ManyToOne(() => Image, image => image.collections)
  @JoinColumn({ name: 'image_id' })
  image: Image
}
