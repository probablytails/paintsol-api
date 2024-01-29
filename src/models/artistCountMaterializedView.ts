/* eslint-disable indent */
import { ViewEntity, ViewColumn } from 'typeorm'

@ViewEntity({
  name: 'artist_count_materialized_view',
  expression: `
    SELECT * FROM artist_count_materialized_view
  `,
})
export class ArtistCountMaterializedView {
  @ViewColumn()
  artist_count: number
}
