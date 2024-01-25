// eslint-disable-next-line @typescript-eslint/no-var-requires
import { S3 } from 'aws-sdk'
import { config } from '../lib/config'
import { ImageType } from '../types'

const s3 = new S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
})

export const uploadImageToS3 = async (
  id: number,
  imageType: ImageType,
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

const getUploadImageFileName = (imageType: ImageType) => {
  if (imageType === 'animation') {
    return 'animation'
  } else if (imageType === 'border') {
    return 'border'
  } else if (imageType === 'no-border') {
    return 'no-border'
  } else if (imageType === 'video') {
    return 'video'
  }
}

const getUploadImageFileExtension = (imageType: ImageType) => {
  if (imageType === 'animation') {
    return '.gif'
  } else if (imageType === 'border' || imageType === 'no-border') {
    return '.png'
  } else if (imageType === 'video') {
    return '.mp4'
  }
}
