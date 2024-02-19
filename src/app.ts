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
import { getAllArtists, getAllArtistsWithImages, getArtistById, getArtistBySlug, getArtists } from './controllers/artist'
import { getImageById, getImageBySlug, getImageMaxId, getImagesByArtistId,
  getImagesByTagId, getImages, getImagesWithoutArtist, getImagesByCollectionId } from './controllers/image'
import { getAllTags, getAllTagsWithImages, getTagById } from './controllers/tag'
import { initAppDataSource } from './db'
import { config } from './lib/config'
import { parseCollectionsQuery, parsePageQuery } from './middleware/parsePageQuery'
import { parsePathIntIdOrSlug } from './middleware/parsePathIntIdOrSlug'
import { ArtistUploadRequest, ImageUploadRequest, PageRequest, PathIntIdOrSlugRequest } from './types'
import { deleteS3ImageAndDBImage, imageUploadFields, imagesUploadHandler } from './services/imageUpload'
import { queryArtistCountMaterializedView, refreshArtistMaterializedView } from './controllers/artistCountMaterializedView'
import { queryImageCountMaterializedView, refreshImageMaterializedView } from './controllers/imageCountMaterializedView'
import { queryTagCountMaterializedView, refreshTagMaterializedView } from './controllers/tagCountMaterializedView'
import { artistUploadFields, artistUploadHandler } from './services/artistImageUpload'
import { addImageToCollection, createCollection, deleteCollection, getCollectionById,
  getCollectionBySlug, getCollections, removeImageFromCollection, updateCollection, updateCollectionImagePositions, updateCollectionPreviewPositions } from './controllers/collections'

const port = 4321

const startApp = async () => {
  await initAppDataSource()

  cron.schedule('*/5 * * * *', async () => {
    await refreshImageMaterializedView()
    await refreshTagMaterializedView()
    await refreshArtistMaterializedView()
  })

  const multerStorage = multer.memoryStorage()
  const multerUpload = multer({ storage: multerStorage })

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

  app.post('/artist/update',
    requiresAuth(),
    multerUpload.fields(artistUploadFields),
    async function (req: ArtistUploadRequest, res: Response) {
      try {
        const { id } = req.body
        const parsedId = parseInt(id, 10)
        if (parsedId === 1 || parsedId > 1) {
          const data = await artistUploadHandler(req, id)
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

  app.get('/artist/:id',
    parsePathIntIdOrSlug,
    async function (req: PathIntIdOrSlugRequest, res: Response) {
      try {
        const { intId, slug } = req.locals
        
        let data = null
        if (intId) {
          data = await getArtistById(intId)
        } else if (slug) {
          data = await getArtistBySlug(slug)
        }

        if (!data) {
          res.status(404)
          res.send({ message: 'Artist not found' })
        } else {
          res.status(200)
          res.send(data)
        }
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/artists/all-with-images',
    async function (req: Request, res: Response) {
      try {
        const data = await getAllArtistsWithImages()
        res.status(200)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/artists/all', async function (req: Request, res: Response) {
    try {
      const data = await getAllArtists()
      res.status(200)
      res.send(data)
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.get('/artists/count',
    async function (req: Request, res: Response) {
      try {
        const data = await queryArtistCountMaterializedView()
        res.status(200)
        res.send({ artist_count: data })
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/artists',
    parsePageQuery,
    async function (req: PageRequest, res: Response) {
      try {
        const { page } = req.locals
        const data = await getArtists({ page })
        res.status(200)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.post('/collection',
    requiresAuth(),
    async function (req: Request, res: Response) {
      try {
        const { slug, stickers_url, title, type } = req.body
        const data = await createCollection({ slug, stickers_url, title, type })
        res.status(201)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.post('/collection/update',
    requiresAuth(),
    async function (req: Request, res: Response) {
      try {
        const { id, slug, stickers_url, title, type } = req.body
        const parsedId = parseInt(id, 10)
        if (parsedId === 1 || parsedId > 1) {
          const data = await updateCollection({
            id: parsedId,
            slug,
            stickers_url,
            title,
            type
          })
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

  app.post('/collection/image/add',
    requiresAuth(),
    async function (req: Request, res: Response) {
      try {
        const { collection_id, image_id, isPreview, collection_image_type } = req.body
        const data = await addImageToCollection({
          collection_id,
          image_id,
          isPreview,
          collection_image_type
        })

        res.status(201)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.post('/collection/image/remove',
    requiresAuth(),
    async function (req: Request, res: Response) {
      try {
        const { collection_id, image_id } = req.body
        const data = await removeImageFromCollection({
          collection_id,
          image_id
        })

        res.status(201)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.post('/collection/image/image-positions/update',
    requiresAuth(),
    async function (req: Request, res: Response) {
      try {
        const { collection_id, newImagePositions } = req.body
        const data = await updateCollectionImagePositions(collection_id, newImagePositions)

        res.status(201)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.post('/collection/image/preview-positions/update',
    requiresAuth(),
    async function (req: Request, res: Response) {
      try {
        const { collection_id, newPreviewPositions } = req.body
        const data = await updateCollectionPreviewPositions(collection_id, newPreviewPositions)

        res.status(201)
        res.send(data)
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
  app.post('/collection/delete/:id',
    requiresAuth(),
    parsePathIntIdOrSlug,
    async function (req: PathIntIdOrSlugRequest, res: Response) {
      try {
        const { intId } = req.locals
        await deleteCollection(intId)
        res.status(201)
        res.send({ message: 'Collection successfully deleted' })
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/collection/:id',
    parsePathIntIdOrSlug,
    async function (req: PathIntIdOrSlugRequest, res: Response) {
      try {
        const { intId, slug } = req.locals
        
        let data = null
        if (intId) {
          data = await getCollectionById(intId)
        } else if (slug) {
          data = await getCollectionBySlug(slug)
        }

        if (!data) {
          res.status(404)
          res.send({ message: 'Collection not found' })
        } else {
          res.status(200)
          res.send(data)
        }
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/collections/all', async function (req: Request, res: Response) {
    try {
      const data = await getCollections({ page: 1, retrieveAll: true, type: 'all' })
      res.status(200)
      res.send(data)
    } catch (error) {
      res.status(400)
      res.send({ message: error.message })
    }
  })

  app.get('/collections',
    parsePageQuery,
    parseCollectionsQuery,
    async function (req: PageRequest, res: Response) {
      try {
        const { collectionType, page } = req.locals
        const data = await getCollections({ page, retrieveAll: false, type: collectionType })
        res.status(200)
        res.send(data)
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
        const data = await getImages({ page })
        res.status(200)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/images/by-artist',
    parsePageQuery,
    async function (req: PageRequest, res: Response) {
      try {
        const { id: artistId, page } = req.locals
        const data = await getImagesByArtistId({ artistId, page })
        res.status(200)
        res.send(data)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/images/by-collection',
    parsePageQuery,
    async function (req: PageRequest, res: Response) {
      try {
        const { id: collection_id, page } = req.locals
        const data = await getImagesByCollectionId({ collection_id, page })
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

  app.get('/images/no-artist',
    parsePageQuery,
    async function (req: PageRequest, res: Response) {
      try {
        const { page } = req.locals
        const data = await getImagesWithoutArtist({ page })
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
        const data = await getImages({ page })
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

  app.post('/image/update',
    requiresAuth(),
    multerUpload.fields(imageUploadFields),
    async function (req: ImageUploadRequest, res: Response) {
      try {
        const { id } = req.body
        const parsedId = parseInt(id, 10)
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

  app.post('/image',
    requiresAuth(),
    multerUpload.fields(imageUploadFields),
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

  app.get('/tag/:id',
    parsePathIntIdOrSlug,
    async function (req: PathIntIdOrSlugRequest, res: Response) {
      try {
        const { intId } = req.locals
        const tag = await getTagById(intId)
        res.status(200)
        res.send(tag)
      } catch (error) {
        res.status(400)
        res.send({ message: error.message })
      }
    })

  app.get('/tags/all-with-images',
    async function (req: Request, res: Response) {
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
