/* eslint-disable indent */
import { ViewEntity, ViewColumn } from 'typeorm'

@ViewEntity({
  name: 'tag_count_materialized_view',
  expression: `
    SELECT * FROM tag_count_materialized_view
  `,
})
export class TagCountMaterializedView {
  @ViewColumn()
  tag_count: number
}
