import { createImage, deleteImage, getImageById, getImageBySlug, updateImage } from '../controllers/image'
import { handleLogError } from '../lib/errors'
import { getFileExtension } from '../lib/fileExtensions'
import { ImageUploadRequest } from '../types'
import { deleteImageFromS3, uploadImageToS3 } from './aws'
import { createBorderImage } from './imageBorder'
import { createPreviewImage } from './imagePreview'

export const imageUploadFields = [
  {
    name: 'fileImageAnimations',
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

type CheckImageFileTypes = {
  fileImageAnimation?: Express.Multer.File
  fileImageBorder?: Express.Multer.File
  fileImageNoBorder?: Express.Multer.File
  fileImageVideo?: Express.Multer.File
}

const checkImageFileTypes = ({
  fileImageAnimation,
  fileImageBorder,
  fileImageNoBorder,
  fileImageVideo
}: CheckImageFileTypes) => {
  if (fileImageAnimation) {
    const ext = getFileExtension(fileImageAnimation)
    if (ext !== 'gif') {
      throw new Error('Invalid animation file type. Expected a gif file.')
    }
  }
  if (fileImageBorder) {
    const ext = getFileExtension(fileImageBorder)
    if (ext !== 'png' && ext !== 'jpg') {
      throw new Error('Invalid image border file type. Expected a png or jpg file.')
    }
  }
  if (fileImageNoBorder) {
    const ext = getFileExtension(fileImageNoBorder)
    if (ext !== 'png' && ext !== 'jpg') {
      throw new Error('Invalid image no border file type. Expected a png or jpg file.')
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
  artistNames: string[]
  fileImageAnimation: Express.Multer.File
  fileImageBorder: Express.Multer.File
  fileImageNoBorder: Express.Multer.File
  fileImageVideo: Express.Multer.File
  has_animation: boolean
  has_border: boolean
  has_no_border: boolean
  has_video: boolean
  id: number | null
  isUpdating: boolean
  remove_animation: boolean
  remove_border: boolean
  remove_no_border: boolean
  remove_video: boolean
  slug: string | null
  tagTitles: string[]
  title: string | null
}

type ImageData = {
  artistNames: string[]
  has_animation: boolean
  has_border: boolean
  has_no_border: boolean
  has_video: boolean
  id: number
  slug: string | null
  tagTitles: string[]
  title: string | null
}

const imagesUpload = async ({
  artistNames,
  fileImageAnimation,
  fileImageBorder,
  fileImageNoBorder,
  fileImageVideo,
  has_animation,
  has_border,
  has_no_border,
  has_video,
  id,
  isUpdating,
  remove_animation,
  remove_border,
  remove_no_border,
  remove_video,
  slug,
  tagTitles,
  title
}: ImageUpload) => {
  checkImageFileTypes({ fileImageAnimation, fileImageBorder, fileImageNoBorder, fileImageVideo })
  const imageData: ImageData = {
    artistNames,
    has_animation,
    has_border,
    has_no_border,
    has_video,
    id,
    slug,
    tagTitles,
    title
  }

  // abort early if we're going to run into the unique slug error
  if (!isUpdating && slug) {
    const image = await getImageBySlug(slug)
    if (image) {
      throw new Error('An image already exists for that slug')
    }
  }

  if (remove_animation) {
    await deleteImageFromS3(id, 'animation')
    imageData.has_animation = false
  } else if (fileImageAnimation) {
    try {
      await uploadImageToS3(id, 'animation', fileImageAnimation)
      imageData.has_animation = true
    } catch (error) {
      throw new Error(`error fileImageAnimation uploadImageToS3: ${error.message}`)
    }
  }
  
  if (remove_border) {
    await deleteImageFromS3(id, 'border')
    imageData.has_border = false
  } else if (fileImageBorder) {
    try {
      await uploadImageToS3(id, 'border', fileImageBorder)
      imageData.has_border = true
    } catch (error) {
      throw new Error(`error fileImageBorder uploadImageToS3: ${error.message}`)
    }
  } else if (fileImageNoBorder) {
    const borderImageFile = await createBorderImage(fileImageNoBorder)
    await uploadImageToS3(id, 'border', borderImageFile)
    imageData.has_border = true
  }
  
  if (remove_no_border) {
    await deleteImageFromS3(id, 'no-border')
    imageData.has_no_border = false
  } else if (fileImageNoBorder) {
    try {
      await uploadImageToS3(id, 'no-border', fileImageNoBorder)
      imageData.has_no_border = true
    } catch (error) {
      throw new Error(`error fileImageNoBorder uploadImageToS3: ${error.message}`)
    }
  }

  if (remove_video) {
    await deleteImageFromS3(id, 'video')
    imageData.has_video = false
  } else if (fileImageVideo) {
    try {
      await uploadImageToS3(id, 'video', fileImageVideo)
      imageData.has_video = true
    } catch (error) {
      throw new Error(`error fileImageVideo uploadImageToS3: ${error.message}`)
    }
  }

  if (fileImageNoBorder) {
    const previewImageFile = await createPreviewImage(fileImageNoBorder)
    await uploadImageToS3(id, 'preview', previewImageFile)
  }
  
  let imageExists = false
  try {
    const image = await getImageById(id)
    imageExists = !!image
  } catch (error) {
    handleLogError(`error getImageById: ${error}`)
  }

  if (!imageExists) {
    return await createImage(imageData)
  } else {
    return await updateImage(imageData)
  }
}

export const imagesUploadHandler = async (req: ImageUploadRequest, id: number, isUpdating: boolean) => {
  const { artistNames, has_animation, has_border, has_no_border, has_video, remove_animation, remove_border,
    remove_no_border, remove_video, slug, tagTitles = [], title } = req.body
  const { fileImageAnimations, fileImageBorders, fileImageNoBorders, fileImageVideos } = req.files

  const fileImageAnimation = fileImageAnimations?.[0]
  const fileImageBorder = fileImageBorders?.[0]
  const fileImageNoBorder = fileImageNoBorders?.[0]
  const fileImageVideo = fileImageVideos?.[0]

  const parsedArtistNames = JSON.parse(artistNames)
  const parsedTagTitles = JSON.parse(tagTitles)

  const data = await imagesUpload({
    artistNames: parsedArtistNames,
    fileImageAnimation,
    fileImageBorder,
    fileImageNoBorder,
    fileImageVideo,
    has_animation,
    has_border,
    has_no_border,
    has_video,
    id,
    isUpdating,
    remove_animation,
    remove_border,
    remove_no_border,
    remove_video,
    slug,
    tagTitles: parsedTagTitles,
    title
  })

  return data
}

export const deleteS3ImageAndDBImage = async (id: number) => {
  await deleteImageFromS3(id, 'animation')
  await deleteImageFromS3(id, 'border')
  await deleteImageFromS3(id, 'no-border')
  await deleteImage(id)
}
