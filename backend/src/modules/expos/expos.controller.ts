import { Request, Response } from 'express';
import { Expo, IChangeHistoryItem } from '../../models/Expo';
import { WebsiteSource } from '../../models/WebsiteSource';
import { FetchLog } from '../../models/FetchLog';
import { ExpoValidator } from '../scraper/validator/expo.validator';

export class ExposController {
  /**
   * Get paginated expos with full search, filtering, verification & sorting
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
        verificationStatus,
        isFavorite,
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

      // Filter by Gujarat City (case-insensitive regex for robust matching)
      if (city && typeof city === 'string' && city !== 'ALL') {
        query.city = new RegExp(city.trim(), 'i');
      }

      // Filter by Source ID
      if (sourceId && typeof sourceId === 'string' && sourceId !== 'ALL') {
        query.sourceWebsiteId = sourceId;
      }

      // Filter by Source Key
      if (sourceKey && typeof sourceKey === 'string' && sourceKey !== 'ALL') {
        query.sourceKey = sourceKey;
      }

      // Filter by Verification Status
      if (verificationStatus && typeof verificationStatus === 'string' && verificationStatus !== 'ALL') {
        query.verificationStatus = verificationStatus;
      }

      // Filter by Favorite
      if (isFavorite === 'true') {
        query.isFavorite = true;
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
      } else if (sortBy === 'dataQualityScore') {
        sortOptions.dataQualityScore = order;
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
   * Manually create a new business expo
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        organizer,
        industry,
        startDate,
        endDate,
        venue,
        city,
        state,
        country,
        description,
        registrationUrl,
        sourceUrl,
      } = req.body;

      if (!name || !startDate || !endDate) {
        res.status(400).json({ success: false, message: 'Name, Start Date, and End Date are required.' });
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const cleanCity = city?.trim() || 'Ahmedabad';
      const cleanCountry = country?.trim() || 'India';
      const duplicateHash = ExpoValidator.generateDuplicateHash(name, start, cleanCity, cleanCountry);

      const existing = await Expo.findOne({ duplicateHash });
      if (existing) {
        res.status(409).json({ success: false, message: 'An expo with this name, start date, and location already exists.' });
        return;
      }

      const expo = new Expo({
        name: name.trim(),
        slug: ExpoValidator.slugify(name),
        organizer: organizer?.trim() || 'Self-Organized',
        industry: industry?.trim() || 'Business & Trade',
        startDate: start,
        endDate: end,
        venue: venue?.trim() || 'Convention Center',
        city: cleanCity,
        state: state?.trim() || 'Gujarat',
        country: cleanCountry,
        description: description?.trim() || `${name} exhibition.`,
        registrationUrl: registrationUrl?.trim() || '',
        sourceUrl: sourceUrl?.trim() || 'https://local-entry.internal',
        sourceKey: 'manual',
        duplicateHash,
        status: new Date() > end ? 'COMPLETED' : new Date() >= start ? 'ONGOING' : 'UPCOMING',
        verificationStatus: 'VERIFIED',
        dataQualityScore: 100,
        missingFields: [],
        validationErrors: [],
        isFavorite: false,
        changeHistory: [
          {
            field: 'status',
            oldValue: 'NEW',
            newValue: 'CREATED_MANUALLY',
            changedAt: new Date(),
            changedBy: 'Admin',
            reason: 'Manual expo creation',
          },
        ],
      });

      await expo.save();
      res.status(201).json({ success: true, message: 'Expo created successfully', data: expo });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update existing expo and track change history
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const expo = await Expo.findById(req.params.id);
      if (!expo) {
        res.status(404).json({ success: false, message: 'Expo not found' });
        return;
      }

      const changes: IChangeHistoryItem[] = [];
      const now = new Date();
      const fieldsToCheck = [
        'name',
        'organizer',
        'industry',
        'venue',
        'city',
        'state',
        'country',
        'description',
        'registrationUrl',
      ];

      for (const field of fieldsToCheck) {
        if (req.body[field] !== undefined && req.body[field] !== (expo as any)[field]) {
          changes.push({
            field,
            oldValue: String((expo as any)[field] || ''),
            newValue: String(req.body[field] || ''),
            changedAt: now,
            changedBy: 'Admin',
            reason: 'Manual field update',
          });
          (expo as any)[field] = req.body[field];
        }
      }

      if (req.body.startDate) {
        const newStart = new Date(req.body.startDate);
        if (newStart.getTime() !== expo.startDate.getTime()) {
          changes.push({
            field: 'startDate',
            oldValue: expo.startDate.toISOString(),
            newValue: newStart.toISOString(),
            changedAt: now,
            changedBy: 'Admin',
            reason: 'Manual date update',
          });
          expo.startDate = newStart;
        }
      }

      if (req.body.endDate) {
        const newEnd = new Date(req.body.endDate);
        if (newEnd.getTime() !== expo.endDate.getTime()) {
          changes.push({
            field: 'endDate',
            oldValue: expo.endDate.toISOString(),
            newValue: newEnd.toISOString(),
            changedAt: now,
            changedBy: 'Admin',
            reason: 'Manual date update',
          });
          expo.endDate = newEnd;
        }
      }

      if (req.body.verificationStatus) {
        expo.verificationStatus = req.body.verificationStatus;
      }

      if (changes.length > 0) {
        expo.changeHistory.push(...changes);
      }

      await expo.save();
      res.json({ success: true, message: 'Expo updated successfully', data: expo });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const expo = await Expo.findById(req.params.id);
      if (!expo) {
        res.status(404).json({ success: false, message: 'Expo not found' });
        return;
      }

      expo.isFavorite = !expo.isFavorite;
      await expo.save();

      res.json({ success: true, isFavorite: expo.isFavorite, data: expo });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update verification status (VERIFIED, FLAGGED, REJECTED, UNVERIFIED)
   */
  static async updateVerification(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      const validStatuses = ['UNVERIFIED', 'VERIFIED', 'FLAGGED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      const expo = await Expo.findByIdAndUpdate(
        req.params.id,
        {
          $set: { verificationStatus: status },
          $push: {
            changeHistory: {
              field: 'verificationStatus',
              oldValue: 'previous',
              newValue: status,
              changedAt: new Date(),
              changedBy: 'Admin',
              reason: `Marked as ${status}`,
            },
          },
        },
        { new: true }
      );

      if (!expo) {
        res.status(404).json({ success: false, message: 'Expo not found' });
        return;
      }

      res.json({ success: true, message: `Expo status updated to ${status}`, data: expo });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Bulk delete selected expos
   */
  static async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, message: 'Array of ids is required' });
        return;
      }

      const result = await Expo.deleteMany({ _id: { $in: ids } });
      res.json({ success: true, message: `Deleted ${result.deletedCount} expos successfully.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Bulk verify selected expos
   */
  static async bulkVerify(req: Request, res: Response): Promise<void> {
    try {
      const { ids, status = 'VERIFIED' } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, message: 'Array of ids is required' });
        return;
      }

      const result = await Expo.updateMany(
        { _id: { $in: ids } },
        {
          $set: { verificationStatus: status },
          $push: {
            changeHistory: {
              field: 'verificationStatus',
              oldValue: 'UNVERIFIED',
              newValue: status,
              changedAt: new Date(),
              changedBy: 'Admin',
              reason: 'Bulk verification operation',
            },
          },
        }
      );

      res.json({ success: true, message: `Updated ${result.modifiedCount} expos to ${status}.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Delete single expo record
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

      const standardGujaratCities = [
        'Ahmedabad',
        'Gandhinagar',
        'Surat',
        'Vadodara',
        'Rajkot',
        'Patan',
        'Morbi',
        'Bhavnagar',
        'Jamnagar',
        'Anand',
        'Bharuch',
        'Vapi',
        'Mehsana',
        'Kutch',
      ];

      const combinedCities = Array.from(
        new Set([...standardGujaratCities, ...cities.filter(Boolean)])
      ).sort();

      res.json({
        success: true,
        data: {
          industries: industries.filter(Boolean).sort(),
          countries: ['India', ...countries.filter((c: string) => c && c !== 'India').sort()],
          cities: combinedCities,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Admin Dashboard stats & enriched metrics
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const [
        totalExpos,
        upcomingExpos,
        ongoingExpos,
        expiredExpos,
        unverifiedCount,
        favoritesCount,
        newlyDiscoveredCount,
        totalSources,
        activeSources,
        healthySources,
        degradedSources,
        failingSources,
        recentFetches,
        industryStats,
        countryStats,
        upcomingList,
        unverifiedList,
        newlyDiscoveredList,
      ] = await Promise.all([
        Expo.countDocuments(),
        Expo.countDocuments({ startDate: { $gt: now } }),
        Expo.countDocuments({ startDate: { $lte: now }, endDate: { $gte: now } }),
        Expo.countDocuments({ endDate: { $lt: now } }),
        Expo.countDocuments({ verificationStatus: 'UNVERIFIED' }),
        Expo.countDocuments({ isFavorite: true }),
        Expo.countDocuments({ createdAt: { $gte: twoDaysAgo } }),
        WebsiteSource.countDocuments(),
        WebsiteSource.countDocuments({ active: true }),
        WebsiteSource.countDocuments({ healthStatus: 'HEALTHY' }),
        WebsiteSource.countDocuments({ healthStatus: 'DEGRADED' }),
        WebsiteSource.countDocuments({ healthStatus: 'FAILING' }),
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
        Expo.find({ verificationStatus: { $in: ['UNVERIFIED', 'FLAGGED'] } })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Expo.find({ createdAt: { $gte: twoDaysAgo } })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

      res.json({
        success: true,
        data: {
          totalExpos,
          upcomingExpos,
          ongoingExpos,
          expiredExpos,
          unverifiedCount,
          favoritesCount,
          newlyDiscoveredCount,
          totalSources,
          activeSources,
          sourceHealth: {
            healthy: healthySources,
            degraded: degradedSources,
            failing: failingSources,
            total: totalSources,
          },
          recentFetches,
          industryStats: industryStats.map((i) => ({ label: i._id || 'Other', count: i.count })),
          countryStats: countryStats.map((c) => ({ label: c._id || 'Global', count: c.count })),
          upcomingList,
          unverifiedList,
          newlyDiscoveredList,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
