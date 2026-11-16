import crypto from 'crypto';
import { z } from 'zod';
import { RawExpoData, ValidatedExpoData } from '../interfaces/expo-parser.interface';

const rawExpoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(350),
  organizer: z.string().optional().default('Not Specified'),
  industry: z.string().optional().default('Business & Trade'),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
  venue: z.string().optional().default('Exhibition Hall'),
  city: z.string().optional().default('Global'),
  state: z.string().optional().default(''),
  country: z.string().optional().default('International'),
  description: z.string().optional().default(''),
  registrationUrl: z.string().optional().default(''),
  sourceUrl: z.string().min(4, 'Source URL is required'),
  rawData: z.record(z.any()).optional(),
});

export class ExpoValidator {
  /**
   * Generates URL-friendly slug
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  /**
   * Generates deterministic SHA-256 duplicate detection hash
   */
  static generateDuplicateHash(name: string, startDate: Date, city: string, country: string): string {
    const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const normCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normCountry = country.toLowerCase().replace(/[^a-z0-9]/g, '');

    const key = `${normName}|${dateStr}|${normCity}|${normCountry}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Validates and normalizes raw expo data
   */
  static validate(raw: RawExpoData, sourceKey: string): { valid: boolean; data?: ValidatedExpoData; error?: string } {
    try {
      const parsed = rawExpoSchema.parse(raw);

      // Parse start and end dates
      let start: Date;
      if (parsed.startDate instanceof Date) {
        start = parsed.startDate;
      } else if (typeof parsed.startDate === 'string' && !isNaN(new Date(parsed.startDate).getTime())) {
        start = new Date(parsed.startDate);
      } else {
        start = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      }

      let end: Date;
      if (parsed.endDate instanceof Date) {
        end = parsed.endDate;
      } else if (typeof parsed.endDate === 'string' && !isNaN(new Date(parsed.endDate).getTime())) {
        end = new Date(parsed.endDate);
      } else {
        end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
      }

      // Ensure end date is not before start date
      if (end.getTime() < start.getTime()) {
        end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
      }

      // Determine current status
      const now = new Date();
      let status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' = 'UPCOMING';
      if (now >= start && now <= end) {
        status = 'ONGOING';
      } else if (now > end) {
        status = 'COMPLETED';
      }

      const cleanCity = parsed.city.trim() || 'Global';
      const cleanCountry = parsed.country.trim() || 'International';
      const duplicateHash = this.generateDuplicateHash(parsed.name, start, cleanCity, cleanCountry);

      const validated: ValidatedExpoData = {
        name: parsed.name.trim(),
        slug: this.slugify(parsed.name),
        organizer: parsed.organizer?.trim() || 'Not Specified',
        industry: parsed.industry?.trim() || 'Business & Trade',
        startDate: start,
        endDate: end,
        venue: parsed.venue?.trim() || 'Exhibition Hall',
        city: cleanCity,
        state: parsed.state?.trim() || '',
        country: cleanCountry,
        description: parsed.description?.trim() || `${parsed.name} exhibition.`,
        registrationUrl: parsed.registrationUrl?.trim() || parsed.sourceUrl,
        sourceUrl: parsed.sourceUrl.trim(),
        sourceKey,
        duplicateHash,
        status,
        rawData: parsed.rawData,
      };

      return { valid: true, data: validated };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Validation error' };
    }
  }
}
