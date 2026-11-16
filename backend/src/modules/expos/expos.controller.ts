import { Request, Response } from 'express';
import { Expo } from '../../models/Expo';
import { WebsiteSource } from '../../models/WebsiteSource';
import { FetchLog } from '../../models/FetchLog';

export class ExposController {
  /**
   * Get paginated expos with full search, filtering and sorting
   */
  static async getExpos(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 12));
      const skip = (page - 1) * limit;

      const {
        search,
        industry,
        country,
        city,
        sourceId,
        sourceKey,
        status,
        dateFrom,
        dateTo,
        sortBy = 'startDate',
        sortOrder = 'asc',
      } = req.query;

      const query: any = {};

      // Text / Keyword Search across name, organizer, venue, city, description
      if (search && typeof search === 'string' && search.trim().length > 0) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: regex },
          { organizer: regex },
          { venue: regex },
          { city: regex },
          { country: regex },
          { industry: regex },
          { description: regex },
        ];
      }

      // Filter by Industry
      if (industry && typeof industry === 'string' && industry !== 'ALL') {
        query.industry = industry;
      }

      // Filter by Country
      if (country && typeof country === 'string' && country !== 'ALL') {
        query.country = country;
      }

      // Filter by City
      if (city && typeof city === 'string' && city !== 'ALL') {
        query.city = city;
      }

      // Filter by Source ID
      if (sourceId && typeof sourceId === 'string' && sourceId !== 'ALL') {
        query.sourceWebsiteId = sourceId;
      }

      // Filter by Source Key
      if (sourceKey && typeof sourceKey === 'string' && sourceKey !== 'ALL') {
        query.sourceKey = sourceKey;
      }

      // Filter by Status (Dynamic Date-Based Status Support)
      const now = new Date();
      if (status && typeof status === 'string' && status !== 'ALL') {
        if (status === 'UPCOMING') {
          query.startDate = { $gt: now };
        } else if (status === 'ONGOING') {
          query.startDate = { $lte: now };
          query.endDate = { $gte: now };
        } else if (status === 'EXPIRED' || status === 'COMPLETED') {
          query.endDate = { $lt: now };
        } else {
          query.status = status;
        }
      }

      // Date Range Filter
      if (dateFrom || dateTo) {
        query.startDate = {};
        if (dateFrom && typeof dateFrom === 'string') {
          query.startDate.$gte = new Date(dateFrom);
        }
        if (dateTo && typeof dateTo === 'string') {
          query.startDate.$lte = new Date(dateTo);
        }
      }

      // Sorting
      const sortOptions: any = {};
      const order = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'name') {
        sortOptions.name = order;
      } else if (sortBy === 'createdAt') {
        sortOptions.createdAt = order;
      } else {
        sortOptions.startDate = order;
      }

      const [total, expos] = await Promise.all([
        Expo.countDocuments(query),
        Expo.find(query)
          .populate('sourceWebsiteId', 'name url parserKey')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        data: expos,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get single expo by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const expo = await Expo.findById(req.params.id)
        .populate('sourceWebsiteId', 'name url parserKey lastFetchedAt')
        .lean();

      if (!expo) {
        res.status(404).json({ success: false, message: 'Expo not found' });
        return;
      }

      res.json({ success: true, data: expo });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Delete an expo record
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const expo = await Expo.findByIdAndDelete(req.params.id);
      if (!expo) {
        res.status(404).json({ success: false, message: 'Expo not found' });
        return;
      }
      res.json({ success: true, message: 'Expo deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get distinct filter options (industries, countries, cities)
   */
  static async getFilters(req: Request, res: Response): Promise<void> {
    try {
      const [industries, countries, cities] = await Promise.all([
        Expo.distinct('industry'),
        Expo.distinct('country'),
        Expo.distinct('city'),
      ]);

      res.json({
        success: true,
        data: {
          industries: industries.filter(Boolean).sort(),
          countries: countries.filter(Boolean).sort(),
          cities: cities.filter(Boolean).sort(),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Admin Dashboard stats & metrics
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();

      const [
        totalExpos,
        upcomingExpos,
        totalSources,
        activeSources,
        recentFetches,
        industryStats,
        countryStats,
        upcomingList,
      ] = await Promise.all([
        Expo.countDocuments(),
        Expo.countDocuments({ startDate: { $gte: now } }),
        WebsiteSource.countDocuments(),
        WebsiteSource.countDocuments({ active: true }),
        FetchLog.find().sort({ createdAt: -1 }).limit(5).lean(),
        Expo.aggregate([
          { $group: { _id: '$industry', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        Expo.aggregate([
          { $group: { _id: '$country', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        Expo.find({ startDate: { $gte: now } })
          .sort({ startDate: 1 })
          .limit(6)
          .lean(),
      ]);

      res.json({
        success: true,
        data: {
          totalExpos,
          upcomingExpos,
          totalSources,
          activeSources,
          recentFetches,
          industryStats: industryStats.map((i) => ({ label: i._id || 'Other', count: i.count })),
          countryStats: countryStats.map((c) => ({ label: c._id || 'Global', count: c.count })),
          upcomingList,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
