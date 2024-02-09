import { getArtistById, updateArtist } from '../controllers/artist'
import { getFileExtension } from '../lib/fileExtensions'
import { ArtistUploadRequest } from '../types'
import { deleteArtistProfilePictureFromS3, uploadArtistProfilePictureToS3 } from './aws'
import { createPreviewImage } from './imagePreview'

export const artistUploadFields = [
  {
    name: 'fileArtistProfilePictures',
    maxCount: 1
  }
]

type CheckArtistProfilePictureFileTypes = {
  fileArtistProfilePicture?: Express.Multer.File
}

const checkArtistProfilePictureFileTypes = ({ fileArtistProfilePicture }: CheckArtistProfilePictureFileTypes) => {
  if (fileArtistProfilePicture) {
    const ext = getFileExtension(fileArtistProfilePicture)
    if (ext !== 'png' && ext !== 'jpg') {
      throw new Error('Invalid image border file type. Expected a png or jpg file.')
    }
  }
}

export const artistUploadHandler = async (req: ArtistUploadRequest, id: number) => {
  const { has_profile_picture, name, remove_profile_picture, slug, twitter_username } = req.body
  const { fileArtistProfilePictures } = req.files

  const fileArtistProfilePicture = fileArtistProfilePictures?.[0]

  const data = await artistUpload({
    fileArtistProfilePicture,
    has_profile_picture,
    id,
    name,
    remove_profile_picture,
    slug,
    twitter_username
  })

  return data
}

type ArtistUpload = {
  fileArtistProfilePicture: Express.Multer.File
  has_profile_picture: boolean
  id: number
  name: string
  remove_profile_picture: boolean
  slug: string | null
  twitter_username: string | null
}

type ArtistData = {
  has_profile_picture: boolean
  id: number
  name: string
  slug: string | null
  twitter_username: string | null
}

const artistUpload = async ({
  fileArtistProfilePicture,
  has_profile_picture,
  id,
  name,
  remove_profile_picture,
  slug,
  twitter_username
}: ArtistUpload) => {
  checkArtistProfilePictureFileTypes({ fileArtistProfilePicture })
  const artistData: ArtistData = {
    has_profile_picture,
    id,
    name,
    slug,
    twitter_username
  }

  let artistExists = false
  try {
    const artist = await getArtistById(id)
    artistExists = !!artist
  } catch (error) {
    throw new Error(error)
  }

  if (!artistExists) {
    throw new Error(`error artist not found for id: ${id}`)
  }

  if (remove_profile_picture) {
    await deleteArtistProfilePictureFromS3(id, 'original')
    await deleteArtistProfilePictureFromS3(id, 'preview')
    artistData.has_profile_picture = false
  } else if (fileArtistProfilePicture) {
    try {
      await uploadArtistProfilePictureToS3(id, 'original', fileArtistProfilePicture)
      artistData.has_profile_picture = true
    } catch (error) {
      throw new Error(`error fileArtistProfilePicture uploadArtistProfilePictureToS3: ${error.message}`)
    }
  }

  if (fileArtistProfilePicture) {
    const previewImageFile = await createPreviewImage(fileArtistProfilePicture)
    await uploadArtistProfilePictureToS3(id, 'preview', previewImageFile)
  }

  return await updateArtist(artistData)
}
