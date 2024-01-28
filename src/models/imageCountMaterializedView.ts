/* eslint-disable indent */
import { ViewEntity, ViewColumn } from 'typeorm'

@ViewEntity({
  name: 'image_count_materialized_view',
  expression: `
    SELECT * FROM image_count_materialized_view
  `,
})
export class ImageCountMaterializedView {
  @ViewColumn()
  image_count: number
}
