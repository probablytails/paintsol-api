import { getArtistById, updateArtist } from '../controllers/artist'
import { getFileExtension } from '../lib/fileExtensions'
import { ArtistUploadRequest } from '../types'
import { deleteArtistProfilePictureFromS3, uploadArtistProfilePictureToS3 } from './aws'
import { createPreviewImageWithBorder } from './imagePreview'

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
    if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg') {
      throw new Error('Invalid image border file type. Expected a png, jpg, or jpeg file.')
    }
  }
}

export const artistUploadHandler = async (req: ArtistUploadRequest, id: number) => {
  const { deca_username, foundation_username, has_profile_picture, instagram_username,
    name, remove_profile_picture, slug, superrare_username, twitter_username } = req.body
  const { fileArtistProfilePictures } = req.files

  const fileArtistProfilePicture = fileArtistProfilePictures?.[0]

  const data = await artistUpload({
    deca_username,
    foundation_username,
    fileArtistProfilePicture,
    has_profile_picture,
    id,
    instagram_username,
    name,
    remove_profile_picture,
    slug,
    superrare_username,
    twitter_username
  })

  return data
}

type ArtistUpload = {
  deca_username: string | null
  foundation_username: string | null
  fileArtistProfilePicture: Express.Multer.File
  has_profile_picture: boolean
  id: number
  instagram_username: string | null
  name: string
  remove_profile_picture: boolean
  slug: string | null
  superrare_username: string | null
  twitter_username: string | null
}

type ArtistData = {
  deca_username: string | null
  foundation_username: string | null
  has_profile_picture: boolean
  id: number
  instagram_username: string | null
  name: string
  slug: string | null
  superrare_username: string | null
  twitter_username: string | null
}

const artistUpload = async ({
  deca_username,
  fileArtistProfilePicture,
  foundation_username,
  has_profile_picture,
  id,
  instagram_username,
  name,
  remove_profile_picture,
  slug,
  superrare_username,
  twitter_username
}: ArtistUpload) => {
  checkArtistProfilePictureFileTypes({ fileArtistProfilePicture })
  const artistData: ArtistData = {
    deca_username,
    foundation_username,
    has_profile_picture,
    id,
    instagram_username,
    name,
    slug,
    superrare_username,
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
    const previewImageFile = await createPreviewImageWithBorder(fileArtistProfilePicture)
    await uploadArtistProfilePictureToS3(id, 'preview', previewImageFile)
  }

  return await updateArtist(artistData)
}
