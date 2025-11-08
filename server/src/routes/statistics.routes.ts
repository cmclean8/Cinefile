import { Router, Request, Response } from 'express';
import { db } from '../database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Get total physical items - single COUNT query
    const totalPhysicalItems = await db('physical_items').count('* as count').first();
    
    // Get total movies (only count movies that are owned - linked to physical items) - single COUNT DISTINCT query
    const totalMovies = await db('physical_item_media')
      .countDistinct('media_id as count')
      .first();
    
    // Count movies by format using SQL aggregation instead of loading all rows
    // This query groups by physical item and counts media, then aggregates formats
    const formatStats = await db('physical_items')
      .leftJoin('physical_item_media', 'physical_items.id', 'physical_item_media.physical_item_id')
      .select(
        'physical_items.physical_format',
        db.raw('COUNT(DISTINCT physical_item_media.media_id) as movie_count')
      )
      .groupBy('physical_items.id', 'physical_items.physical_format');
    
    const formatCounts: Record<string, number> = {
      '4K UHD': 0,
      'Blu-ray': 0,
      'DVD': 0,
      'LaserDisc': 0,
      'VHS': 0
    };
    
    // Process format statistics (much more efficient than loading all items)
    formatStats.forEach(item => {
      if (item.physical_format) {
        try {
          const formats = JSON.parse(item.physical_format);
          const movieCount = parseInt(item.movie_count as string) || 1;
          
          formats.forEach((format: string) => {
            if (formatCounts[format] !== undefined) {
              formatCounts[format] += movieCount;
            }
          });
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });
    
    // Filter out formats with 0 count
    const activeFormats = Object.entries(formatCounts)
      .filter(([_, count]) => count > 0)
      .reduce((acc, [format, count]) => ({ ...acc, [format]: count }), {});
    
    res.json({
      totalPhysicalItems: parseInt(totalPhysicalItems?.count as string) || 0,
      totalMovies: parseInt(totalMovies?.count as string) || 0,
      formatCounts: activeFormats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
