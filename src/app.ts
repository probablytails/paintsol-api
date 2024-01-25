// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer')

import * as express from 'express'
import { Request, Response } from 'express'
import { auth, requiresAuth } from 'express-openid-connect'
import { deleteImage, getImageById, getImageMaxId, getImagesByTagId, searchImages } from './controllers/image'
import { getAllTags } from './controllers/tag'
import { initAppDataSource } from './db'
import { config } from './lib/config'
import { parsePageQuery } from './middleware/parsePageQuery'
import { parsePathIntId } from './middleware/parsePathIntId'
import { ImageUploadRequest, PageRequest, PathIntIdRequest } from './types'
import { imageUploadFields, imagesUploadHandler } from './services/imageUpload'

const port = 4321

const startApp = async () => {
  await initAppDataSource()

  const multerStorage = multer.memoryStorage()
  const imageUpload = multer({ storage: multerStorage })

  const app = express()
  app.use(express.json())

  const corsOptions = {
    origin: config.web.baseUrl,
    credentials: true
  }
  app.use(cors(corsOptions))

  // auth0 router attaches /login, /logout, and /callback routes to the baseURL
  app.use(auth(config.auth0))

  app.get('/', async function (req: Request, res: Response) {
    res.redirect(config.web.baseUrl)
  })

  app.get('/admin/userinfo',
    requiresAuth(),
    async function (req: Request, res: Response) {
      const user = req.oidc.user
      if (user) {
        const data = {
          nickname: user.nickname,
          picture: user.picture
        }
        res.status(200)
        res.send(data)
      } else {
        res.status(401)
        res.send()
      }
    })

  app.get('/images',
    parsePageQuery,
    async function (req: PageRequest, res: Response) {
      try {
        const { page } = req.locals
        const data = await searchImages({ page })
        res.status(200)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/images/by-tag',
    parsePageQuery,
    async function (req: PageRequest, res: Response) {
      try {
        const { id: tagId, page } = req.locals
        const data = await getImagesByTagId({ tagId, page })
        res.status(200)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/image/:id',
    parsePathIntId,
    async function (req: PathIntIdRequest, res: Response) {
      try {
        const { id } = req.locals
        const data = await getImageById(id)
        if (!data) {
          res.status(404)
          res.send({ message: 'Image not found' })
        } else {
          res.status(200)
          res.send(data)
        }
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.delete('/image/:id',
    requiresAuth(),
    parsePathIntId,
    async function (req: PathIntIdRequest, res: Response) {
      try {
        const { id } = req.locals
        await deleteImage(id)
        res.status(201)
        res.send({ message: 'Image successfully deleted' })
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.post('/image',
    requiresAuth(),
    imageUpload.fields(imageUploadFields),
    async function (req: ImageUploadRequest, res: Response) {
      try {
        const id = await getImageMaxId()
        const nextId = id + 1
        const data = await imagesUploadHandler(req, nextId)
        res.status(201)
        res.send(data)
      } catch (error) {
        console.log('error', error.message)
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.patch('/image',
    requiresAuth(),
    imageUpload.fields(imageUploadFields),
    async function (req: ImageUploadRequest, res: Response) {
      try {
        const { id } = req.body
        const parsedId = parseInt(id)
        if (parsedId > 1) {
          const data = await imagesUploadHandler(req, id)
          res.status(201)
          res.send(data)
        } else {
          throw new Error(`Invalid id provided: ${id}`)
        }
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/tags/all', async function (req: Request, res: Response) {
    try {
      const data = await getAllTags()
      res.status(200)
      res.send(data)
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.listen(port)

  console.log(`App is listening on port ${port}`)
}

(async() => {
  await startApp()
})()
