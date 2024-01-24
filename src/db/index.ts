import { DataSource } from 'typeorm'
import { config } from '../lib/config'
import { Image } from '../models/image'
import { ImageTag } from '../models/imageTag'
import { Tag } from '../models/tag'

const appDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  username: config.db.username,
  password: config.db.password,
  synchronize: false,
  entities: [Image, Tag, ImageTag]
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
