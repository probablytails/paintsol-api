import { Equal } from 'typeorm'
import appDataSource from '../db'
import { handleThrowError } from '../lib/errors'
import { getPaginationQueryParams } from '../lib/pagination'
import { Collection } from '../models/collection'
import { getCollectionPreviewImages } from './image'
import { CollectionImage } from '../models/collection_image'

export type CollectionType = 'general' | 'telegram-sticker' | 'discord-sticker'

type SearchCollection = {
  page: number
  retrieveAll: boolean
}

export async function getCollections({ page, retrieveAll }: SearchCollection) {
  try {
    // Validate that page is an integer greater than or equal to 1 if it's provided
    if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
      throw new Error('The page must be an integer greater than or equal to 1.')
    }

    // Construct the base query
    let query = `
      SELECT
        c.id AS "id",
        COALESCE(
          json_agg(
            CASE
              WHEN i.id IS NOT NULL THEN
                jsonb_build_object(
                  'imageId', i.id,
                  'previewPosition', ci.preview_position
                )
              ELSE
                NULL
            END
            ORDER BY ci.preview_position ASC
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS "preview_images",
        c.slug AS "slug",
        c.stickers_url AS "stickers_url",
        c.title AS "title",
        c.type AS "type"
      FROM
        collection c
      LEFT JOIN
        collection_image ci ON ci.collection_id = c.id
      LEFT JOIN
        image i ON ci.image_id = i.id AND ci.preview_position >= 1
      GROUP BY
        c.id
      ORDER BY
        c.id`

    // If retrieveAll is true, ignore the page parameter
    let take = 0
    let skip = 0
    if (retrieveAll === true) {
      query += ';'
    } else {
      // Calculate offset based on the page number
      const pagination = getPaginationQueryParams(page)
      take = pagination.take
      skip = pagination.skip
      query += `
        LIMIT $1
        OFFSET $2;`
    }

    // Execute the constructed query
    const result = await appDataSource.query(query, retrieveAll === true ? [] : [take, skip])
    return result

  } catch (error) {
    handleThrowError(error)
  }
}

export async function getCollectionById(collectionId: number) {
  const collection = await appDataSource
    .getRepository(Collection)
    .createQueryBuilder('collection')
    .where('collection.id = :id', { id: collectionId })
    .getOne()

  if (!collection) {
    throw new Error(`No collection found for id ${collectionId}`)
  }

  const preview_images = await getCollectionPreviewImages(collectionId)

  const collectionResponse = {
    id: collection.id,
    preview_images,
    slug: collection.slug,
    stickers_url: collection.stickers_url,
    title: collection.title,
    type: collection.type
  }

  return collectionResponse
}

export async function getCollectionBySlug(slug: string) {
  const collection = await appDataSource
    .getRepository(Collection)
    .createQueryBuilder('collection')
    .where('collection.slug = :slug', { slug })
    .getOne()

  const preview_images = await getCollectionPreviewImages(collection.id)

  const collectionResponse = {
    id: collection.id,
    preview_images,
    slug: collection.slug,
    stickers_url: collection.stickers_url,
    title: collection.title,
    type: collection.type
  }

  return collectionResponse
}

type CreateOrUpdateCollection = {
  slug?: string
  stickers_url?: string
  title?: string
  type?: CollectionType
}

export async function createCollection({
  slug,
  stickers_url,
  title,
  type
}: CreateOrUpdateCollection) {  
  try {
    const collectionRepo = appDataSource.getRepository(Collection)
  
    const collection = new Collection()
    collection.slug = slug
    collection.stickers_url = stickers_url
    collection.title = title
    collection.type = type
  
    return collectionRepo.save(collection)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type UpdateCollection = {
  id: number
  slug?: string
  stickers_url?: string
  title?: string
  type?: CollectionType
}

export async function updateCollection({
  id,
  slug,
  stickers_url,
  title,
  type
}: UpdateCollection) {  
  try {
    const collectionRepo = appDataSource.getRepository(Collection)
    const collectionToUpdate = await collectionRepo.findOne({
      where: {
        id: Equal(id)
      }
    })
  
    if (!collectionToUpdate) {
      throw new Error(`No collection found for the id ${id}`)
    }
    
    collectionToUpdate.id = id
    collectionToUpdate.slug = slug
    collectionToUpdate.stickers_url = stickers_url
    collectionToUpdate.title = title
    collectionToUpdate.type = type

    return collectionRepo.update({
      id,
    }, collectionToUpdate)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

export async function deleteCollection(id: number) {
  try {
    const collectionRepo = appDataSource.getRepository(Collection)
    const result = await collectionRepo.delete(id)

    const rowDeleted = result?.affected === 1
    if (!rowDeleted) {
      throw new Error('Could not delete because a collection with that id does not exist')
    }
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type CollectionImageType = 'no-border' | 'border' | 'animation'

type AddImageToCollection = {
  collection_id: number
  image_id: number
  isPreview: boolean
  collection_image_type: CollectionImageType
}

export async function addImageToCollection({
  collection_id,
  image_id,
  isPreview,
  collection_image_type
}: AddImageToCollection) {
  try {
    let previewPosition: number | null = null
    if (isPreview) {
      previewPosition = await getNextAvailablePreviewPosition(collection_id)
    }

    const nextImagePosition = await getNextAvailableImagePosition(collection_id)

    const collectionImage = new CollectionImage()
    collectionImage.collection_id = collection_id
    collectionImage.image_id = image_id
    collectionImage.image_position = nextImagePosition
    collectionImage.preview_position = previewPosition
    collectionImage.image_type = collection_image_type

    await appDataSource.manager.save(collectionImage)

    await syncCollectionImagePositions(collection_id)
    await syncCollectionPreviewPositions(collection_id)

    const finalCollectionImage = await getCollectionImage(collection_id, image_id)

    return finalCollectionImage
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type RemoveImageFromCollection = {
  collection_id: number
  image_id: number
}


export async function removeImageFromCollection({
  collection_id,
  image_id
}: RemoveImageFromCollection) {
  try {
    const collectionImage = await appDataSource
      .getRepository(CollectionImage)
      .findOne({ where: { collection_id, image_id } })

    if (!collectionImage) {
      throw new Error('Image not found in collection')
    }

    if (collectionImage) {
      await appDataSource.manager.remove(collectionImage)
    }

    await syncCollectionImagePositions(collection_id)
    await syncCollectionPreviewPositions(collection_id)

    return true
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

const getCollectionImage = async (collection_id: number, image_id: number) => {
  const collectionImageRepo = appDataSource.getRepository(CollectionImage)
  return collectionImageRepo.findOne({
    where: {
      collection_id,
      image_id
    }
  })
}

const getNextAvailableImagePosition = async (collection_id: number) => {
  const maxImagePositionResult = await appDataSource
    .createQueryBuilder()
    .select('MAX(ci.image_position)', 'maxImagePosition')
    .from(CollectionImage, 'ci')
    .where('ci.collection_id = :collection_id', { collection_id })
    .getRawOne()
  
  return (maxImagePositionResult?.maxImagePosition + 1) || 1
}

const getNextAvailablePreviewPosition = async (collection_id: number) => {
  const maxPreviewPositionResult = await appDataSource
    .createQueryBuilder()
    .select('MAX(ci.preview_position)', 'maxPreviewPosition')
    .from(CollectionImage, 'ci')
    .where('ci.collection_id = :collection_id', { collection_id })
    .andWhere('ci.preview_position >= 1')
    .getRawOne()

  return (maxPreviewPositionResult?.maxPreviewPosition + 1) || 1
}

async function syncCollectionImagePositions(collectionId: number) {
  try {
    const collectionImages = await appDataSource
      .getRepository(CollectionImage)
      .createQueryBuilder('ci')
      .where('ci.collection_id = :collectionId', { collectionId })
      .orderBy('ci.image_position', 'ASC')
      .getMany()

    let newPosition = 1
    for (const collectionImage of collectionImages) {
      collectionImage.image_position = newPosition
      newPosition++
    }

    await appDataSource.manager.save(collectionImages)

    return collectionImages
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

async function syncCollectionPreviewPositions(collectionId: number) {
  try {
    const collectionImages = await appDataSource
      .getRepository(CollectionImage)
      .createQueryBuilder('ci')
      .where('ci.collection_id = :collectionId', { collectionId })
      .andWhere('ci.preview_position IS NOT NULL') // Exclude rows with null preview_position
      .orderBy('ci.preview_position', 'ASC')
      .getMany()

    let newPosition = 1
    for (const collectionImage of collectionImages) {
      collectionImage.preview_position = newPosition
      newPosition++
    }

    // Save the updated collection_image rows
    await appDataSource.manager.save(collectionImages)

    return collectionImages
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type NewImagePosition = {
  image_id: number
  image_position: number
}

export async function updateCollectionImagePositions(
  collection_id: number, newImagePositions: NewImagePosition[]) {
  try {
    // Check if newImagePositions array is sorted and contains consecutive image positions starting from 1
    for (let i = 0; i < newImagePositions.length; i++) {
      if (newImagePositions[i].image_position !== i + 1) {
        throw new Error('Invalid image_positions provided')
      }
    }

    const totalCount = await appDataSource
      .getRepository(CollectionImage)
      .count({ where: { collection_id } })

    if (totalCount !== newImagePositions.length) {
      throw new Error('Number of new image positions does not match the total count of collection_image rows')
    }

    for (const newPosition of newImagePositions) {
      const existingRow = await appDataSource
        .getRepository(CollectionImage)
        .findOne({ where: { collection_id, image_id: newPosition.image_id } })

      if (!existingRow) {
        throw new Error(`No corresponding row found in collection_image table for image_id ${newPosition.image_id} and collection_id ${collection_id}`)
      }
    }

    // first update the image positions to use a temporary image_position
    // to avoid conflicts on unique image_position constraint for collection_image table
    await appDataSource.transaction(async transactionalEntityManager => {
      for (const newPosition of newImagePositions) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update(CollectionImage)
          .set({ image_position: 1000000 + newPosition.image_position })
          .where('collection_id = :collectionId AND image_id = :imageId', { collectionId: collection_id, imageId: newPosition.image_id })
          .execute()
      }
    })

    await appDataSource.transaction(async transactionalEntityManager => {
      for (const newPosition of newImagePositions) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update(CollectionImage)
          .set({ image_position: newPosition.image_position })
          .where('collection_id = :collectionId AND image_id = :imageId', { collectionId: collection_id, imageId: newPosition.image_id })
          .execute()
      }
    })

    return 'Collection image positions updated successfully'
  } catch (error) {
    handleThrowError(error)
  }
}

type NewPreviewPosition = {
  image_id: number
  preview_position: number
}

export async function updateCollectionPreviewPositions(
  collection_id: number, newPreviewPositions: NewPreviewPosition[]) {
  try {
    // Check if newImagePositions array is sorted and contains consecutive image positions starting from 1
    for (let i = 0; i < newPreviewPositions.length; i++) {
      if (newPreviewPositions[i].preview_position !== i + 1) {
        throw new Error('Invalid preview_positions provided')
      }
    }

    const totalCount = await appDataSource
      .getRepository(CollectionImage)
      .count({ where: { collection_id } })

    if (totalCount < newPreviewPositions.length) {
      throw new Error('Number of new previews positions is more than the total count of collection_image rows')
    }

    for (const newPosition of newPreviewPositions) {
      const existingRow = await appDataSource
        .getRepository(CollectionImage)
        .findOne({ where: { collection_id, image_id: newPosition.image_id } })

      if (!existingRow) {
        throw new Error(`No corresponding row found in collection_image table for image_id ${newPosition.image_id} and collection_id ${collection_id}`)
      }
    }

    // first update the preview_positions to use a temporary preview_position
    // to avoid conflicts on unique preview_position constraint for collection_image table
    await appDataSource.transaction(async transactionalEntityManager => {
      for (const newPosition of newPreviewPositions) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update(CollectionImage)
          .set({ preview_position: 1000000 + newPosition.preview_position })
          .where('collection_id = :collectionId AND image_id = :imageId', { collectionId: collection_id, imageId: newPosition.image_id })
          .execute()
      }
    })

    await appDataSource.transaction(async transactionalEntityManager => {
      for (const newPosition of newPreviewPositions) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update(CollectionImage)
          .set({ preview_position: newPosition.preview_position })
          .where('collection_id = :collectionId AND image_id = :imageId', { collectionId: collection_id, imageId: newPosition.image_id })
          .execute()
      }
    })

    await syncCollectionPreviewPositions(collection_id)

    return 'Collection preview positions updated successfully'
  } catch (error) {
    handleThrowError(error)
  }
}
