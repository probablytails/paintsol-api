import { NextFunction, Response } from 'express'
import { ImageType, PageRequest } from '../types'
import { CollectionQueryType, CollectionSortType } from '../controllers/collections'

export const parsePageQuery = async (req: PageRequest, res: Response, next: NextFunction) => {
  const { id, page, imageType } = req.query

  let parsedPage = typeof page === 'string' ? Math.ceil(parseInt(page, 10)) : 1
  parsedPage = parsedPage < 1 ? 1 : parsedPage

  const parsedId = typeof id === 'string' ? parseInt(id, 10) : null

  let parsedImageType: ImageType = 'painting-and-meme'
  if (imageType === 'meme') {
    parsedImageType = 'meme'
  } else if (imageType === 'painting') {
    parsedImageType = 'painting'
  }

  req.locals = {
    id: parsedId,
    page: parsedPage,
    imageType: parsedImageType
  }

  await next()
}

export const parseCollectionsQuery = async (req: PageRequest, res: Response, next: NextFunction) => {
  const { sort, type } = req.query

  req.locals = {
    ...req.locals,
    collectionType: type as CollectionQueryType,
    collectionSort: sort as CollectionSortType
  }

  await next()
}