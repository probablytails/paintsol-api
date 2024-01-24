import { Request } from "express"

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
