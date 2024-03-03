// eslint-disable-next-line @typescript-eslint/no-var-requires
import { S3 } from 'aws-sdk'
import { config } from '../lib/config'
import { ArtistProfilePictureType, ImageMediumType } from '../types'

const s3 = new S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
})

/* Images */

export const deleteImageFromS3 = async (
  id: number,
  imageType: ImageMediumType
) => {
  const key = `${id}-${getUploadImageFileName(imageType)}.${getUploadImageFileExtension(imageType)}`
  const params = {
    Bucket: config.aws.imageBucket,
    Key: key // The key is the filename in the S3 bucket
  }

  return s3.deleteObject(params).promise()
}

export const uploadImageToS3 = async (
  id: number,
  imageType: ImageMediumType,
  file: Express.Multer.File
) => {
  const key = `${id}-${getUploadImageFileName(imageType)}.${getUploadImageFileExtension(imageType)}`

  const params: S3.PutObjectRequest = {
    Bucket: config.aws.imageBucket,
    Key: key, // The key is the filename in the S3 bucket
    Body: file.buffer,
    ContentType: file.mimetype,
  }

  const uploadResult = await s3.upload(params).promise()
  return uploadResult.Location // The URL of the uploaded file in S3
}

const getUploadImageFileName = (imageType: ImageMediumType) => {
  if (imageType === 'animation') {
    return 'animation'
  } else if (imageType === 'border') {
    return 'border'
  } else if (imageType === 'no-border') {
    return 'no-border'
  } else if (imageType === 'preview') {
    return 'preview'
  }
}

const getUploadImageFileExtension = (imageType: ImageMediumType) => {
  if (imageType === 'animation') {
    return 'gif'
  } else if (
    imageType === 'border' || imageType === 'no-border' || imageType === 'preview') {
    return 'png'
  }
}

/* Artists */

export const deleteArtistProfilePictureFromS3 = async (
  id: number,
  artistProfilePictureType: ArtistProfilePictureType
) => {
  const key = `/artists/${id}-${getUploadArtistProfilePictureFileName(artistProfilePictureType)}.${getUploadArtistProfilePictureFileExtension(artistProfilePictureType)}`
  const params = {
    Bucket: config.aws.imageBucket,
    Key: key // The key is the filename in the S3 bucket
  }

  return s3.deleteObject(params).promise()
}

export const uploadArtistProfilePictureToS3 = async (
  id: number,
  artistProfilePictureType: ArtistProfilePictureType,
  file: Express.Multer.File
) => {
  const key = `artists/${id}-${getUploadArtistProfilePictureFileName(artistProfilePictureType)}.${getUploadArtistProfilePictureFileExtension(artistProfilePictureType)}`

  const params: S3.PutObjectRequest = {
    Bucket: config.aws.imageBucket,
    Key: key, // The key is the filename in the S3 bucket
    Body: file.buffer,
    ContentType: file.mimetype,
  }

  const uploadResult = await s3.upload(params).promise()
  return uploadResult.Location // The URL of the uploaded file in S3
}

const getUploadArtistProfilePictureFileName = (artistProfilePictureType: ArtistProfilePictureType) => {
  if (artistProfilePictureType === 'preview') {
    return 'preview'
  } else {
    return 'original'
  }
}

const getUploadArtistProfilePictureFileExtension = (artistProfilePictureType: ArtistProfilePictureType) => {
  if (artistProfilePictureType === 'original' || artistProfilePictureType === 'preview') {
    return 'png'
  }
}
