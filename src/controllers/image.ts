import { Equal, LessThan, MoreThan } from 'typeorm'
import appDataSource from '../db'
import { handleError } from '../lib/errors'
import { getPaginationQueryParams } from '../lib/pagination'
import { Image } from '../models/image'
import { findOrCreateTags, getTagById } from './tag'
import { ImageTag } from '../models/imageTag'

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
    handleError(error)
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
    handleError(error)
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
    handleError(error)
  }
}

type CreateOrUpdateImage = {
  artist: string | null
  id: number
  has_animation: boolean
  has_border: boolean
  has_no_border: boolean
  slug: string | null
  tagTitles: string[]
  title: string | null
}

export async function createImage({
  artist,
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
    image.artist = artist
    image.has_animation = has_animation
    image.has_border = has_border
    image.has_no_border = has_no_border
    image.id = id
    image.slug = slug || null
    image.title = title
  
    const tags = await findOrCreateTags(tagTitles)
    image.tags = tags

    return imageRepo.save(image)
  } catch (error: unknown) {
    handleError(error)
  }
}

export async function updateImage({
  artist,
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
    
    oldImage.artist = artist
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

    return imageRepo.save(oldImage)
  } catch (error: unknown) {
    handleError(error)
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
    handleError(error)
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
      relations: ['tags']
    })

    if (image) {
      const prevData = await getImagePrev(image.id)
      const nextData = await getImageNext(image.id)
      image.prevData = prevData
      image.nextData = nextData
    }

    return image
  } catch (error: unknown) {
    handleError(error)
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
      relations: ['tags']
    })

    if (image) {
      const prevData = await getImagePrev(image.id)
      const nextData = await getImageNext(image.id)
      image.prevData = prevData
      image.nextData = nextData
    }
    
    return image
  } catch (error: unknown) {
    handleError(error)
  }
}

type SearchImage = {
  page: number
}

export async function searchImages({ page }: SearchImage) {
  try {
    const imageRepo = appDataSource.getRepository(Image)
    const images = await imageRepo.find({
      ...getPaginationQueryParams(page),
      relations: ['tags'],
      order: {
        created_at: 'DESC'
      }
    })
  
    return images
  } catch (error: unknown) {
    handleError(error)
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
    const images = await imageRepo.find({
      where: {
        tags: tag
      },
      ...getPaginationQueryParams(page),
      relations: ['tags'],
      relationLoadStrategy: 'query',
      order: {
        created_at: 'DESC'
      }
    })
  
    return images
  } catch (error: unknown) {
    handleError(error)
  }
}
