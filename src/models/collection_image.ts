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

  @Column({ length: 20, default: 'no-border', enum: ['no-border', 'border', 'animation'] })
  image_type: string

  @Column({ nullable: true })
  preview_position: number | null

  @ManyToOne(() => Collection, collection => collection.images)
  @JoinColumn({ name: 'collection_id' })
  collection: Collection

  @ManyToOne(() => Image, image => image.collections)
  @JoinColumn({ name: 'image_id' })
  image: Image
}
