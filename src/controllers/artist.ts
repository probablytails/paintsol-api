import { Equal, ILike } from 'typeorm'
import appDataSource from '../db'
import { Artist } from '../models/artist'

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
  const artists = await artistsRepo.find({
    select: {
      id: true,
      name: true
    }
  })

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
