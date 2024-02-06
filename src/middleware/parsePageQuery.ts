import { NextFunction, Response } from 'express'
import { PageRequest } from '../types'

export const parsePageQuery = async (req: PageRequest, res: Response, next: NextFunction) => {
  const { id, page } = req.query

  let parsedPage = typeof page === 'string' ? Math.ceil(parseInt(page, 10)) : 1
  parsedPage = parsedPage < 1 ? 1 : parsedPage

  const parsedId = typeof id === 'string' ? parseInt(id, 10) : null

  req.locals = {
    id: parsedId,
    page: parsedPage
  }

  await next()
}
