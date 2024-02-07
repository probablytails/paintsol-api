import { NextFunction, Response } from 'express'
import { PathIntIdOrSlugRequest } from '../types'
import { checkIfValidInteger } from '../lib/validation'

export const parsePathIntIdOrSlug = async (req: PathIntIdOrSlugRequest, res: Response, next: NextFunction) => {
  const { id } = req.params
  const isValidInteger = checkIfValidInteger(id)
  const oldLocals = req.locals || {}
  if (isValidInteger) {
    const parsedId = parseInt(id, 10)
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
