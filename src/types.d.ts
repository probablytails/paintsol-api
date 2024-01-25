import { Request } from 'express'

export interface PageRequest extends Request {
  locals: {
    id?: number | null
    page?: number
  }
}

export interface PathIntIdRequest extends Request {
  locals: {
    id: number
  }
}

export interface ImageUploadRequest extends Request {
  files: {
    fileImageAnimations: Express.Multer.File[]
    fileImageBorders: Express.Multer.File[]
    fileImageNoBorders: Express.Multer.File[]
    fileImageVideos: Express.Multer.File[]
  }
}

export type ImageType = 'animation' | 'border' | 'no-border' | 'video'
