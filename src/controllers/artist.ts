import { Equal, ILike } from 'typeorm'
import appDataSource from '../db'
import { Artist } from '../models/artist'
import { handleThrowError } from '../lib/errors'
import { getPaginationQueryParams } from '../lib/pagination'
import { ImageArtist } from '../models/imageArtist'

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

type GetArtists = {
  page: number
}

export async function getArtists({ page }: GetArtists) {
  const artistRepository = appDataSource.getRepository(Artist)
  const { skip, take } = getPaginationQueryParams(page)

  const artistsWithImages = await artistRepository
    .createQueryBuilder('artist')
    .leftJoinAndSelect(
      'artist.images',
      'image',
      'ROW(image.id, artist.id) IN (SELECT image_id, artist_id FROM image_artist)'
    )
    .orderBy('artist.total_images','DESC')
    .skip(skip)
    .take(take)
    .getMany()

  return artistsWithImages
}

export async function getTotalImagesWithArtistId(id: number) {
  const result = await appDataSource
    .getRepository(ImageArtist)
    .count({
      where: {
        artist_id: id
      }
    })

  return result
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
  deca_username: string | null
  foundation_username: string | null
  has_profile_picture: boolean
  id: number  
  instagram_username: string | null
  name: string
  slug: string
  superrare_username: string | null
  twitter_username: string | null
}

export async function updateArtist({
  deca_username,
  foundation_username,
  has_profile_picture,
  id,
  instagram_username,
  name,
  slug,
  superrare_username,
  twitter_username
}: UpdateArtist) {  
  try {
    const artistRepo = appDataSource.getRepository(Artist)
    const artistToUpdate = await getArtistById(id)
  
    if (!artistToUpdate) {
      throw new Error(`No artist found for the id ${id}`)
    }
    
    const oldName = artistToUpdate.name

    artistToUpdate.deca_username = deca_username
    artistToUpdate.foundation_username = foundation_username
    artistToUpdate.has_profile_picture = has_profile_picture
    artistToUpdate.instagram_username = instagram_username
    artistToUpdate.name = name
    artistToUpdate.slug = slug
    artistToUpdate.superrare_username = superrare_username
    artistToUpdate.twitter_username = twitter_username

    return artistRepo.update({
      id: artistToUpdate.id,
      name: oldName
    }, artistToUpdate)
  } catch (error: unknown) {
    handleThrowError(error)
  }
}
