import { Request } from 'express'
import { CollectionQueryType, CollectionSortType } from './controllers/collections'

export interface PageRequest extends Request {
  locals: {
    id?: number | null
    page?: number
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

export type ImageType = 'animation' | 'border' | 'no-border' | 'preview'

export type ArtistProfilePictureType = 'original' | 'preview'

export interface ArtistUploadRequest extends Request {
  files: {
    fileArtistProfilePictures: Express.Multer.File[]
  }
}
