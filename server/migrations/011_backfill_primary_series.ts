import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Find all media with exactly one series association and no primary_series_id
  // Use a subquery to count series per media item
  const mediaWithSingleSeries = await knex('media')
    .select('media.id')
    .join('movie_series', 'media.id', 'movie_series.media_id')
    .whereNull('media.primary_series_id')
    .groupBy('media.id')
    .havingRaw('COUNT(DISTINCT movie_series.series_id) = 1');

  // For each media item, get its single series_id and update primary_series_id
  for (const item of mediaWithSingleSeries) {
    const seriesAssociation = await knex('movie_series')
      .where({ media_id: item.id })
      .first();
    
    if (seriesAssociation) {
      await knex('media')
        .where({ id: item.id })
        .update({ primary_series_id: seriesAssociation.series_id });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // This migration is safe to rollback - it just sets primary_series_id
  // We could clear it, but it's probably better to leave it
}
