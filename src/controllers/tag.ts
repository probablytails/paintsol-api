import { Equal } from "typeorm"
import appDataSource from "../db"
import { Tag } from "../models/tag"

type FindOrCreateTags = string[]

export async function findOrCreateTags(titles: FindOrCreateTags) {
  const tagsRepo = appDataSource.getRepository(Tag)

  const tags: Tag[] = []
  for (const title of titles) {
    let tag = await tagsRepo.findOne({
      where: {
        title: Equal(title)
      }
    })
    if (!tag) {
      tag = await tagsRepo.save({ title })
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

type GetTagById = {
  id: number
}

export async function getTagById({ id }: GetTagById) {
  const tagsRepo = appDataSource.getRepository(Tag)
  const tag = await tagsRepo.findOne({
    where: {
      id: Equal(id)
    }
  })

  return tag
}
