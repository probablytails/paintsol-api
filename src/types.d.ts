import { Request } from 'express'
import { CollectionQueryType, CollectionSortType } from './controllers/collections'

export interface PageRequest extends Request {
  locals: {
    id?: number | null
    page?: number
    imageType?: ImageType
    collectionType?: CollectionQueryType
    collectionSort?: CollectionSortType
  }
}

export interface PathIntIdOrSlugRequest extends Request {
  locals: {
    intId?: number
    slug?: string
    collectionType?: CollectionQueryType
    collectionSort?: CollectionSortType
  }
}

export interface ImageUploadRequest extends Request {
  files: {
    fileImageAnimations: Express.Multer.File[]
    fileImageBorders: Express.Multer.File[]
    fileImageNoBorders: Express.Multer.File[]
  }
}

export type ImageMediumType = 'animation' | 'border' | 'no-border' | 'preview'

export type ImageType = 'painting' | 'meme' | 'painting-and-meme'

export type ArtistProfilePictureType = 'original' | 'preview'

export interface ArtistUploadRequest extends Request {
  files: {
    fileArtistProfilePictures: Express.Multer.File[]
  }
}
