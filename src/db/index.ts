import { DataSource } from "typeorm"
import { Image } from "../models/image"
import { ImageTag } from "../models/imageTag"
import { Tag } from "../models/tag"

const appDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5555,
  username: "user",
  password: "mysecretpw",
  database: "db",
  synchronize: false,
  entities: [Image, Tag, ImageTag]
})

export const initAppDataSource = () => {
  return appDataSource.initialize()
    .then(() => {
      console.log("Data Source has been initialized!")
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err)
      throw new Error('initAppDataSource failed')
    })
}

export default appDataSource
