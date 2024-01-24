import { NextFunction, Response } from 'express'
import { PathIntIdRequest } from '../types'

export const parsePathIntId = async (req: PathIntIdRequest, res: Response, next: NextFunction) => {
  const { id } = req.params
  const parsedId = parseInt(id)
  
  if (parsedId >= 1) {
    const oldLocals = req.locals || {}
    req.locals = {
      ...oldLocals,
      id: parsedId
    }
    await next()
  } else {
    res.status(400)
    res.send({ message: `Id must be an integer 1 or greater: ${id}` })
  }
}
