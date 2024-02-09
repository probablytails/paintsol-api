import { Equal } from 'typeorm'
import appDataSource from '../db'
import { Tag } from '../models/tag'

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

export async function getAllTagsWithImages() {
  const tagsRepo = appDataSource.getRepository(Tag)
  const tagsWithImages = await tagsRepo
    .createQueryBuilder('tag')
    .innerJoin('tag.images', 'imageTag')
    .groupBy('tag.id')
    .orderBy('COUNT(imageTag.id)', 'DESC')
    .getMany()

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
