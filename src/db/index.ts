import { DataSource } from 'typeorm'
import { config } from '../lib/config'
import { Artist } from '../models/artist'
import { ArtistCountMaterializedView } from '../models/artistCountMaterializedView'
import { Image } from '../models/image'
import { ImageCountMaterializedView } from '../models/imageCountMaterializedView'
import { ImageTag } from '../models/imageTag'
import { Tag } from '../models/tag'
import { TagCountMaterializedView } from '../models/tagCountMaterializedView'
import { ImageArtist } from '../models/imageArtist'
import { Collection } from '../models/collection'
import { CollectionImage } from '../models/collection_image'

const appDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  username: config.db.username,
  password: config.db.password,
  synchronize: false,
  entities: [
    Artist,
    ArtistCountMaterializedView,
    Collection,
    CollectionImage,
    Image,
    ImageArtist,
    ImageCountMaterializedView,
    ImageTag,
    Tag,
    TagCountMaterializedView
  ]
})

export const initAppDataSource = () => {
  return appDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized!')
    })
    .catch((err) => {
      console.error('Error during Data Source initialization', err)
      throw new Error('initAppDataSource failed')
    })
}

export default appDataSource
