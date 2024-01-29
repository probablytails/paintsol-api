import { ArtistCountMaterializedView } from '../models/artistCountMaterializedView'
import appDataSource from '../db'
import { handleLogError } from '../lib/errors'

export async function refreshArtistMaterializedView() {
  try {
    await appDataSource.manager.query('REFRESH MATERIALIZED VIEW artist_count_materialized_view')
  } catch (error) {
    handleLogError(`refreshArtistMaterializedView error: ${error}`)
  }
}

export async function queryArtistCountMaterializedView() {
  try {
    const artistCountMaterializedViewRepo = appDataSource.getRepository(ArtistCountMaterializedView)
    const result = await artistCountMaterializedViewRepo
      .createQueryBuilder('materializedView')
      .getOne()
    return result?.artist_count ? result.artist_count : 0
  } catch (error) {
    handleLogError(`queryArtistCountMaterializedView error: ${error}`)
  }
}
