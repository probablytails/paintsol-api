/* eslint-disable indent */
import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'
import { Image } from './image'
import { Tag } from './tag'

@Entity('image_tag', { schema: 'public' })
export class ImageTag {
  @ManyToOne(() => Image, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  @PrimaryColumn()
  image_id: number

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  @PrimaryColumn()
  tag_id: number
}
