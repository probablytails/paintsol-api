import { TagCountMaterializedView } from '../models/tagCountMaterializedView'
import appDataSource from '../db'

export async function refreshTagMaterializedView() {
  try {
    await appDataSource.manager.query('REFRESH MATERIALIZED VIEW tag_count_materialized_view')
  } catch (error) {
    console.log('refreshTagMaterializedView error:', error)
  }
}

export async function queryTagCountMaterializedView() {
  try {
    const tagCountMaterializedViewRepo = appDataSource.getRepository(TagCountMaterializedView)
    const result = await tagCountMaterializedViewRepo
      .createQueryBuilder('materializedView')
      .getOne()
    return result?.tag_count ? result.tag_count : 0
  } catch (error) {
    console.log('queryTagCountMaterializedView error:', error)
  }
}
