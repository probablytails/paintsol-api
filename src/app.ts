// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cron = require('node-cron')

import * as express from 'express'
import { Request, Response } from 'express'
import { auth, requiresAuth } from 'express-openid-connect'
import { getImageById, getImageBySlug, getImageMaxId, getImagesByTagId, searchImages } from './controllers/image'
import { getAllTags, getAllTagsWithImages } from './controllers/tag'
import { initAppDataSource } from './db'
import { config } from './lib/config'
import { parsePageQuery } from './middleware/parsePageQuery'
import { parsePathIntIdOrSlug } from './middleware/parsePathIntIdOrSlug'
import { ImageUploadRequest, PageRequest, PathIntIdOrSlugRequest } from './types'
import { deleteS3ImageAndDBImage, imageUploadFields, imagesUploadHandler } from './services/imageUpload'
import { queryImageCountMaterializedView, refreshImageMaterializedView } from './controllers/imageCountMaterializedView'
import { queryTagCountMaterializedView, refreshTagMaterializedView } from './controllers/tagCountMaterializedView'

const port = 4321

const startApp = async () => {
  await initAppDataSource()

  cron.schedule('*/5 * * * *', async () => {
    await refreshImageMaterializedView()
    await refreshTagMaterializedView()
  })

  const multerStorage = multer.memoryStorage()
  const imageUpload = multer({ storage: multerStorage })

  const app = express()
  app.use(express.json({
    limit: '50mb'
  }))
  app.use(express.urlencoded({
    limit: '50mb',
    extended: true
  }))

  const corsOptions = {
    origin: [config.web.baseUrl,config.auth0.baseURL],
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

  app.get('/images/count',
    async function (req: Request, res: Response) {
      try {
        const data = await queryImageCountMaterializedView()
        res.status(200)
        res.send({ image_count: data })
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
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

  app.get('/image/:id',
    parsePathIntIdOrSlug,
    async function (req: PathIntIdOrSlugRequest, res: Response) {
      try {
        const { intId, slug } = req.locals
        
        let data = null
        if (intId) {
          data = await getImageById(intId)
        } else if (slug) {
          data = await getImageBySlug(slug)
        }

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

  /*
    Using POST for this delete endpoint instead of DELETE
    because I was getting a CORS issue from Auth0 when I
    tried to use the DELETE request method.
  */
  app.post('/image/delete/:id',
    requiresAuth(),
    parsePathIntIdOrSlug,
    async function (req: PathIntIdOrSlugRequest, res: Response) {
      try {
        const { intId } = req.locals
        await deleteS3ImageAndDBImage(intId)
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
        const isUpdating = false
        const id = await getImageMaxId()
        const nextId = id + 1
        const data = await imagesUploadHandler(req, nextId, isUpdating)
        res.status(201)
        res.send(data)
      } catch (error) {
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
        if (parsedId === 1 || parsedId > 1) {
          const isUpdating = true
          const data = await imagesUploadHandler(req, id, isUpdating)
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

  app.get('/tags/all-with-images', async function (req: Request, res: Response) {
    try {
      const data = await getAllTagsWithImages()
      res.status(200)
      res.send(data)
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

  app.get('/tags/count',
    async function (req: Request, res: Response) {
      try {
        const data = await queryTagCountMaterializedView()
        res.status(200)
        res.send({ tag_count: data })
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
