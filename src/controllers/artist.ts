import { Equal, ILike } from 'typeorm'
import appDataSource from '../db'
import { Artist } from '../models/artist'
import { handleThrowError } from '../lib/errors'

type FindOrCreateArtists = string[]

export async function findOrCreateArtists(names: FindOrCreateArtists) {
  const artistsRepo = appDataSource.getRepository(Artist)

  const artists: Artist[] = []
  for (const name of names) {
    let artist = await artistsRepo.findOne({
      where: {
        name: ILike(name)
      }
    })
    if (!artist) {
      artist = await artistsRepo.save({ name })
    }
    if (artist) {
      artists.push(artist)
    }
  }

  return artists
}

export async function getAllArtists() {
  const artistsRepo = appDataSource.getRepository(Artist)
  const artists = await artistsRepo.find()

  return artists
}

export async function getAllArtistsWithImages() {
  const artistsRepo = appDataSource.getRepository(Artist)
  const artistsWithImages = await artistsRepo
    .createQueryBuilder('artist')
    .innerJoin('artist.images', 'imageArtist')
    .groupBy('artist.id')
    .orderBy('COUNT(imageArtist.id)', 'DESC')
    .getMany()

  return artistsWithImages
}

export async function getArtistById(id: number) {
  const artistsRepo = appDataSource.getRepository(Artist)
  const artist = await artistsRepo.findOne({
    where: {
      id: Equal(id)
    }
  })

  return artist
}

export async function getArtistBySlug(slug: string) {
  try {
    const artistRepo = appDataSource.getRepository(Artist)
    const artist: Artist = await artistRepo.findOne({
      where: {
        slug: Equal(slug)
      }
    })
    
    return artist
  } catch (error: unknown) {
    handleThrowError(error)
  }
}

type UpdateArtist = {
  has_profile_picture: boolean
  id: number  
  name: string
  slug: string
  twitter_username: string | null
}

export async function updateArtist({
  has_profile_picture,
  id,
  name,
  slug,
  twitter_username
}: UpdateArtist) {  
  try {
    const artistRepo = appDataSource.getRepository(Artist)
    const artistToUpdate = await getArtistById(id)
  
    if (!artistToUpdate) {
      throw new Error(`No artist found for the id ${id}`)
    }
    
    const oldName = artistToUpdate.name

    artistToUpdate.has_profile_picture = has_profile_picture
    artistToUpdate.name = name
    artistToUpdate.slug = slug
    artistToUpdate.twitter_username = twitter_username

    return artistRepo.update({
      id: artistToUpdate.id,
      name: oldName
    }, artistToUpdate)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}
