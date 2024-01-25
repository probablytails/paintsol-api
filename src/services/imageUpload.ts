import { createImage, getImageById, getImageBySlug, updateImage } from '../controllers/image'
import appDataSource from '../db'
import { Image } from '../models/image'
import { ImageUploadRequest } from '../types'
import { uploadImageToS3 } from './aws'

export const imageUploadFields = [
  {
    nadme: 'fileImageAnimations',
    maxCount: 1
  },
  {
    name: 'fileImageBorders',
    maxCount: 1
  },
  {
    name: 'fileImageNoBorders',
    maxCount: 1
  },
  {
    name: 'fileImageVideos',
    maxCount: 1
  }
]

type CheckFileTypes = {
  fileImageAnimation: Express.Multer.File
  fileImageBorder: Express.Multer.File
  fileImageNoBorder: Express.Multer.File
  fileImageVideo: Express.Multer.File
}

const getFileExtension = (file: Express.Multer.File) => {
  const originalFileName = file.originalname
  const fileExtension = originalFileName?.split('.').pop()
  return fileExtension
}

const checkFileTypes = ({
  fileImageAnimation,
  fileImageBorder,
  fileImageNoBorder,
  fileImageVideo
}: CheckFileTypes) => {
  if (fileImageAnimation) {
    const ext = getFileExtension(fileImageAnimation)
    if (ext !== 'gif') {
      throw new Error('Invalid animation file type. Expected a gif file.')
    }
  }
  if (fileImageBorder) {
    const ext = getFileExtension(fileImageBorder)
    if (ext !== 'png') {
      throw new Error('Invalid image border file type. Expected a png file.')
    }
  }
  if (fileImageNoBorder) {
    const ext = getFileExtension(fileImageNoBorder)
    if (ext !== 'png') {
      throw new Error('Invalid image no border file type. Expected a png file.')
    }
  }
  if (fileImageVideo) {
    const ext = getFileExtension(fileImageVideo)
    if (ext !== 'mp4') {
      throw new Error('Invalid video file type. Expected an mp4 file.')
    }
  }
}

type ImageUpload = {
  fileImageAnimation: Express.Multer.File
  fileImageBorder: Express.Multer.File
  fileImageNoBorder: Express.Multer.File
  fileImageVideo: Express.Multer.File
  id: number | null
  slug: string | null
  tagTitles: string[]
  title: string | null
}

type ImageData = {
  id: number
  has_animation?: boolean
  has_border?: boolean
  has_no_border?: boolean
  has_video?: boolean
}

const imagesUpload = async ({
  fileImageAnimation,
  fileImageBorder,
  fileImageNoBorder,
  fileImageVideo,
  id,
  slug,
  tagTitles,
  title
}: ImageUpload) => {
  checkFileTypes({ fileImageAnimation, fileImageBorder, fileImageNoBorder, fileImageVideo })
  const imageData: ImageData = {
    id
  }

  // abort early if we're going to run into the unique slug error
  if (slug) {
    try {
      const image = await getImageBySlug(slug)
      if (image) {
        throw new Error('An image already exists for that slug')
      }
    } catch (error) {
      // if the request errors, assume not found, and continue
    }
  }

  if (fileImageAnimation) {
    try {
      await uploadImageToS3(id, 'animation', fileImageAnimation)
      imageData.has_animation = true
    } catch (error) {
      throw new Error(`error fileImageAnimation uploadImageToS3: ${error.message}`)
    }
  }
  
  if (fileImageBorder) {
    try {
      await uploadImageToS3(id, 'border', fileImageBorder)
      imageData.has_border = true
    } catch (error) {
      throw new Error(`error fileImageBorder uploadImageToS3: ${error.message}`)
    }
  }
  
  if (fileImageNoBorder) {
    try {
      await uploadImageToS3(id, 'no-border', fileImageNoBorder)
      imageData.has_no_border = true
    } catch (error) {
      throw new Error(`error fileImageNoBorder uploadImageToS3: ${error.message}`)
    }
  }
  
  if (fileImageVideo) {
    try {
      await uploadImageToS3(id, 'video', fileImageVideo)
      imageData.has_video = true
    } catch (error) {
      throw new Error(`error fileImageVideo uploadImageToS3: ${error.message}`)
    }
  }

  let imageExists = false
  try {
    const image = await getImageById(id)
    imageExists = !!image
  } catch (error) {
    console.log('error getImageById:', error)
  }

  if (!imageExists) {
    return await createImage({ id, slug, tagTitles, title })
  } else {
    return await updateImage({ id, slug, tagTitles, title })
  }
}

export const imagesUploadHandler = async (req: ImageUploadRequest, id: number) => {
  const { slug, tagTitles = [], title } = req.body
  const { fileImageAnimations, fileImageBorders, fileImageNoBorders,
    fileImageVideos } = req.files

  const fileImageAnimation = fileImageAnimations?.[0]
  const fileImageBorder = fileImageBorders?.[0]
  const fileImageNoBorder = fileImageNoBorders?.[0]
  const fileImageVideo = fileImageVideos?.[0]

  const parsedTagTitles = JSON.parse(tagTitles)

  const data = await imagesUpload({
    fileImageAnimation,
    fileImageBorder,
    fileImageNoBorder,
    fileImageVideo,
    id,
    slug,
    tagTitles: parsedTagTitles,
    title
  })

  return data
}
