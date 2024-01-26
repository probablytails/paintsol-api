import { Request } from 'express'

export interface PageRequest extends Request {
  locals: {
    id?: number | null
    page?: number
  }
}

export interface PathIntIdOrSlugRequest extends Request {
  locals: {
    intId?: number
    slug?: string
  }
}

export interface ImageUploadRequest extends Request {
  files: {
    fileImageAnimations: Express.Multer.File[]
    fileImageBorders: Express.Multer.File[]
    fileImageNoBorders: Express.Multer.File[]
  }
}

export type ImageType = 'animation' | 'border' | 'no-border'
