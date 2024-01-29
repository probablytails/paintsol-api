import { Equal, LessThan, MoreThan } from 'typeorm'
import appDataSource from '../db'
import { handleThrowError } from '../lib/errors'
import { getPaginationQueryParams } from '../lib/pagination'
import { Image } from '../models/image'
import { findOrCreateArtists, getArtistById } from './artist'
import { findOrCreateTags, getTagById } from './tag'
import { ImageArtist } from '../models/imageArtist'
import { ImageTag } from '../models/imageTag'
import { queryImageCountMaterializedView } from './imageCountMaterializedView'

export async function getImageMaxId() {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const imageWithMaxId = await imageRepo.find({
      order: {
        id: 'DESC'
      },
      take: 1
    })

    if (imageWithMaxId[0]) {
      return imageWithMaxId[0].id
    } else {
      return 0
    }
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function getImageNext(currentId: number) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const imageNext = await imageRepo.find({
      where: {
        id: MoreThan(currentId)
      },
      order: {
        id: 'ASC'
      },
      take: 1
    })

    if (imageNext[0]) {
      return imageNext[0]
    } else {
      return null
    }
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function getImagePrev(currentId: number) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const imagePrev = await imageRepo.find({
      where: {
        id: LessThan(currentId)
      },
      order: {
        id: 'DESC'
      },
      take: 1
    })

    if (imagePrev[0]) {
      return imagePrev[0]
    } else {
      return null
    }
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type CreateOrUpdateImage = {
  artistNames: string[]
  has_animation: boolean
  has_border: boolean
  has_no_border: boolean
  id: number
  slug: string | null
  tagTitles: string[]
  title: string | null
}

export async function createImage({
  artistNames,
  has_animation,
  has_border,
  has_no_border,
  id,
  slug,
  tagTitles,
  title
}: CreateOrUpdateImage) {  
  try {
    const imageRepo = appDataSource.getRepository(Image)
  
    const image = new Image()
    image.has_animation = has_animation
    image.has_border = has_border
    image.has_no_border = has_no_border
    image.id = id
    image.slug = slug || null
    image.title = title
  
    const tags = await findOrCreateTags(tagTitles)
    image.tags = tags

    const artists = await findOrCreateArtists(artistNames)
    image.artists = artists

    return imageRepo.save(image)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function updateImage({
  artistNames,
  has_animation,
  has_border,
  has_no_border,
  id,
  slug,
  tagTitles,
  title  
}: CreateOrUpdateImage) {  
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const oldImage = await getImageById(id)
  
    if (!oldImage) {
      throw new Error(`No image found for the id ${id}`)
    }
    
    oldImage.has_animation = has_animation
    oldImage.has_border = has_border
    oldImage.has_no_border = has_no_border
    oldImage.slug = slug || null
    oldImage.title = title

    // delete existing many-to-many tags for the image before continuing
    const imageTagRepo = appDataSource.getRepository(ImageTag)
    const imageTags = await imageTagRepo.find({ where: { image_id: oldImage.id }})
    await imageTagRepo.remove(imageTags)

    const tags = await findOrCreateTags(tagTitles)
    oldImage.tags = tags

    // delete existing many-to-many artists for the image before continuing
    const imageArtistRepo = appDataSource.getRepository(ImageArtist)
    const imageArtists = await imageArtistRepo.find({ where: { image_id: oldImage.id }})
    await imageArtistRepo.remove(imageArtists)

    const artists = await findOrCreateArtists(artistNames)
    oldImage.artists = artists

    return imageRepo.save(oldImage)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function deleteImage(id: number) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const result = await imageRepo.delete(id)

    const rowDeleted = result?.affected === 1
    if (!rowDeleted) {
      throw new Error('Could not delete because an image with that id does not exist')
    }
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function getImageById(id: number) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const image: any = await imageRepo.findOne({
      where: {
        id: Equal(id)
      },
      relations: ['tags', 'artists']
    })

    if (image) {
      const prevData = await getImagePrev(image.id)
      const nextData = await getImageNext(image.id)
      image.prevData = prevData
      image.nextData = nextData
    }

    return image
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function getImageBySlug(slug: string) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const image: any = await imageRepo.findOne({
      where: {
        slug: Equal(slug)
      },
      relations: ['tags', 'artists']
    })

    if (image) {
      const prevData = await getImagePrev(image.id)
      const nextData = await getImageNext(image.id)
      image.prevData = prevData
      image.nextData = nextData
    }
    
    return image
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type SearchImage = {
  page: number
}

export async function getImages({ page }: SearchImage) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const allImagesCount = await queryImageCountMaterializedView()
    const images = await imageRepo.find({
      ...getPaginationQueryParams(page),
      relations: ['artists', 'tags'],
      order: {
        created_at: 'DESC'
      }
    })
  
    return [images, allImagesCount]
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type SearchImagesByArtistId = {
  artistId: number
  page: number
}

export async function getImagesByArtistId({ page, artistId }: SearchImagesByArtistId) {
  try {
    const artist = await getArtistById(artistId)

    const imageRepo = appDataSource.getRepository(Image)
    const data = await imageRepo.findAndCount({
      where: {
        artists: artist
      },
      ...getPaginationQueryParams(page),
      relations: ['artists', 'tags'],
      relationLoadStrategy: 'query',
      order: {
        created_at: 'DESC'
      }
    })
  
    return data
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type SearchImagesByTagId = {
  tagId: number
  page: number
}

export async function getImagesByTagId({ page, tagId }: SearchImagesByTagId) {
  try {
    const tag = await getTagById(tagId)

    const imageRepo = appDataSource.getRepository(Image)
    const data = await imageRepo.findAndCount({
      where: {
        tags: tag
      },
      ...getPaginationQueryParams(page),
      relations: ['artists', 'tags'],
      relationLoadStrategy: 'query',
      order: {
        created_at: 'DESC'
      }
    })
  
    return data
  } catch (error: unknown) {
    handleThrowError(error)
  }
}
