import { Equal } from 'typeorm'
import appDataSource from '../db'
import { Tag } from '../models/tag'
import { ImageType } from '../types'

type FindOrCreateTags = string[]

export async function findOrCreateTags(titles: FindOrCreateTags) {
  const tagsRepo = appDataSource.getRepository(Tag)

  const tags: Tag[] = []
  for (const title of titles) {
    let tag = await tagsRepo.findOne({
      where: {
        title: Equal(title?.trim())
      }
    })
    if (!tag) {
      tag = await tagsRepo.save({ title: title?.trim() })
    }
    if (tag) {
      tags.push(tag)
    }
  }

  return tags
}

export async function getAllTags() {
  const tagsRepo = appDataSource.getRepository(Tag)
  const tags = await tagsRepo.find({
    select: {
      id: true,
      title: true
    }
  })

  return tags
}

export async function getAllTagsWithImages(imageType: ImageType) {
  const tagsRepo = appDataSource.getRepository(Tag)
  let query = tagsRepo
    .createQueryBuilder('tag')
    .innerJoin('tag.images', 'imageTag')
    .groupBy('tag.id')
    .orderBy('COUNT(imageTag.id)', 'DESC')

  if (imageType === 'painting') {
    query = query.andWhere('(imageTag.type = :type OR imageTag.type = :type2)', { type: 'painting', type2: 'painting-and-meme' })
  } else if (imageType === 'meme') {
    query = query.andWhere('(imageTag.type = :type OR imageTag.type = :type2)', { type: 'meme', type2: 'painting-and-meme' })
  }

  const tagsWithImages = await query.getMany()

  return tagsWithImages
}

export async function getTagById(id: number) {
  const tagsRepo = appDataSource.getRepository(Tag)
  const tag = await tagsRepo.findOne({
    where: {
      id: Equal(id)
    }
  })

  return tag
}
