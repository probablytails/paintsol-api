import { NextFunction, Response } from 'express'
import { PathIntIdOrSlugRequest } from '../types'

export const parsePathIntIdOrSlug = async (req: PathIntIdOrSlugRequest, res: Response, next: NextFunction) => {
  const { id } = req.params
  const parsedId = parseInt(id)
  
  const oldLocals = req.locals || {}
  if (parsedId >= 1) {
    req.locals = {
      ...oldLocals,
      intId: parsedId
    }
    await next()
  } else {
    req.locals = {
      ...oldLocals,
      slug: id
    }
    await next()
  }
}
