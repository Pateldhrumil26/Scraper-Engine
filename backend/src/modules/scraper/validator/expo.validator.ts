import crypto from 'crypto';
import { z } from 'zod';
import { RawExpoData, ValidatedExpoData } from '../interfaces/expo-parser.interface';

export const GUJARAT_KEYWORDS = [
  'gujarat',
  'ahmedabad',
  'amdavad',
  'gandhinagar',
  'surat',
  'vadodara',
  'baroda',
  'rajkot',
  'bhavnagar',
  'jamnagar',
  'junagadh',
  'anand',
  'navsari',
  'morbi',
  'bharuch',
  'vapi',
  'ankleshwar',
  'porbandar',
  'patan',
  'mehsana',
  'palanpur',
  'godhra',
  'valsad',
  'surendranagar',
  'bhuj',
  'kutch',
  'gandhidham',
  'amreli',
  'veraval',
  'dahod',
  'botad',
  'nadiad',
  'kalol',
  'sanand',
  'changodar',
  'chhatral',
  'sachin',
  'pandesara',
  'hazira',
  'makarpura',
  'dahej',
  'halol',
  'mahatma mandir',
  'helipad exhibition centre',
  'helipad ground',
  'gmdc ground',
  'aes ground',
  'siecc',
  'sarsana',
  'vanita vishram',
  'riverfront',
  'gujarat university',
  'sabarmati riverfront',
  'science city',
  'gidc',
  'gcci',
  'sgcci',
  'gift city',
  'layerx',
  'engiexpo',
];

export const NON_GUJARAT_EXCLUSIONS = [
  'maharashtra',
  'mumbai',
  'pune',
  'delhi',
  'new delhi',
  'noida',
  'bangalore',
  'bengaluru',
  'karnataka',
  'hyderabad',
  'telangana',
  'chennai',
  'tamil nadu',
  'kolkata',
  'west bengal',
  'jaipur',
  'rajasthan',
  'kerala',
  'goa',
  'punjab',
  'haryana',
  'dubai',
  'uae',
  'saudi arabia',
  'usa',
  'united states',
  'germany',
  'china',
  'france',
  'united kingdom',
  'singapore',
];

const rawExpoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(350),
  organizer: z.string().optional().default('Gujarat Business Network'),
  industry: z.string().optional().default('Business & Trade Expo'),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
  venue: z.string().optional().default('Exhibition Hall'),
  city: z.string().optional().default('Ahmedabad'),
  state: z.string().optional().default('Gujarat'),
  country: z.string().optional().default('India'),
  description: z.string().optional().default(''),
  registrationUrl: z.string().optional().default(''),
  sourceUrl: z.string().min(4, 'Source URL is required'),
  rawData: z.record(z.any()).optional(),
});

export class ExpoValidator {
  /**
   * Strictly determines whether an expo belongs to Gujarat, India
   */
  static isGujaratExpo(raw: RawExpoData): boolean {
    const combined = `${raw.name} ${raw.city || ''} ${raw.state || ''} ${raw.venue || ''} ${raw.country || ''} ${raw.description || ''} ${raw.sourceUrl || ''}`.toLowerCase();

    // Must be in India if country is specified
    if (raw.country && !/india|bharat|in/i.test(raw.country) && raw.country !== 'International') {
      return false;
    }

    // Check for explicit out-of-state indicator if no Gujarat keyword is found
    const hasGujarat = GUJARAT_KEYWORDS.some((kw) => combined.includes(kw));
    if (hasGujarat) {
      // If it mentions both a non-Gujarat city like Pune/Jaipur and no Gujarat city in the title, filter out
      if (/\bpune\b|\bjaipur\b|\bmumbai\b|\bdelhi\b|\bbengaluru\b/i.test(raw.name.toLowerCase())) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Validates whether a URL is structurally valid
   */
  static isValidUrl(url?: string | null): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

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
   * Validates, normalizes, scores data quality, and detects missing fields
   */
  static validate(raw: RawExpoData, sourceKey: string): { valid: boolean; data?: ValidatedExpoData; error?: string } {
    try {
      // 1. Strict Gujarat Geographic Filter
      if (!this.isGujaratExpo(raw)) {
        return {
          valid: false,
          error: `Geographic filter: "${raw.name}" (${raw.city || 'Unknown'}, ${raw.country || 'Unknown'}) is outside Gujarat state. Only Gujarat business expos are permitted.`,
        };
      }

      const parsed = rawExpoSchema.parse(raw);
      const validationErrors: string[] = [];
      const missingFields: string[] = [];

      // Validate source URL
      if (!this.isValidUrl(parsed.sourceUrl)) {
        validationErrors.push(`Invalid sourceUrl structure: ${parsed.sourceUrl}`);
      }

      // Parse start and end dates
      let start: Date;
      if (parsed.startDate instanceof Date) {
        start = parsed.startDate;
      } else if (typeof parsed.startDate === 'string' && !isNaN(new Date(parsed.startDate).getTime())) {
        start = new Date(parsed.startDate);
      } else {
        start = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        missingFields.push('startDate');
      }

      let end: Date;
      if (parsed.endDate instanceof Date) {
        end = parsed.endDate;
      } else if (typeof parsed.endDate === 'string' && !isNaN(new Date(parsed.endDate).getTime())) {
        end = new Date(parsed.endDate);
      } else {
        end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
        missingFields.push('endDate');
      }

      // Ensure end date is not before start date
      if (end.getTime() < start.getTime()) {
        end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
        validationErrors.push('End date was prior to start date; auto-adjusted duration.');
      }

      // Determine current lifecycle status
      const now = new Date();
      let status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' = 'UPCOMING';
      if (now >= start && now <= end) {
        status = 'ONGOING';
      } else if (now > end) {
        status = 'COMPLETED';
      }

      // Detect missing core fields
      const cleanVenue = parsed.venue?.trim() || '';
      if (!cleanVenue || cleanVenue === 'Exhibition Hall' || cleanVenue === 'TBD') {
        missingFields.push('venue');
      }

      const cleanOrganizer = parsed.organizer?.trim() || '';
      if (!cleanOrganizer || cleanOrganizer === 'Not Specified' || cleanOrganizer === 'Gujarat Business Network') {
        missingFields.push('organizer');
      }

      const cleanRegUrl = parsed.registrationUrl?.trim() || '';
      if (!cleanRegUrl || !this.isValidUrl(cleanRegUrl)) {
        missingFields.push('registrationUrl');
      }

      const cleanDesc = parsed.description?.trim() || '';
      if (!cleanDesc || cleanDesc.length < 20) {
        missingFields.push('description');
      }

      // Normalize Gujarat city from city, venue, or expo title
      let normalizedCity = parsed.city?.trim() || '';
      const textToScan = `${parsed.city || ''} ${parsed.venue || ''} ${parsed.name || ''}`.toLowerCase();

      if (textToScan.includes('gandhinagar') || textToScan.includes('mahatma mandir') || textToScan.includes('helipad')) normalizedCity = 'Gandhinagar';
      else if (textToScan.includes('surat') || textToScan.includes('siecc') || textToScan.includes('sarsana') || textToScan.includes('vanita vishram')) normalizedCity = 'Surat';
      else if (textToScan.includes('rajkot')) normalizedCity = 'Rajkot';
      else if (textToScan.includes('vadodara') || textToScan.includes('baroda') || textToScan.includes('navlakhi')) normalizedCity = 'Vadodara';
      else if (textToScan.includes('morbi')) normalizedCity = 'Morbi';
      else if (textToScan.includes('patan')) normalizedCity = 'Patan';
      else if (textToScan.includes('bhavnagar')) normalizedCity = 'Bhavnagar';
      else if (textToScan.includes('jamnagar')) normalizedCity = 'Jamnagar';
      else if (textToScan.includes('anand')) normalizedCity = 'Anand';
      else if (textToScan.includes('vapi')) normalizedCity = 'Vapi';
      else if (textToScan.includes('bharuch') || textToScan.includes('ankleshwar') || textToScan.includes('dahej')) normalizedCity = 'Bharuch';
      else if (textToScan.includes('mehsana')) normalizedCity = 'Mehsana';
      else if (textToScan.includes('kutch') || textToScan.includes('bhuj') || textToScan.includes('gandhidham')) normalizedCity = 'Kutch';
      else if (textToScan.includes('ahmedabad') || textToScan.includes('amdavad') || textToScan.includes('gmdc') || textToScan.includes('riverfront') || textToScan.includes('science city')) normalizedCity = 'Ahmedabad';
      else if (!normalizedCity) normalizedCity = 'Ahmedabad';

      // Always enforce Gujarat, India
      const normalizedState = 'Gujarat';
      const normalizedCountry = 'India';

      // Calculate Data Quality Score (0 to 100)
      let score = 20; // Base valid score
      if (!missingFields.includes('startDate')) score += 15;
      if (!missingFields.includes('endDate')) score += 10;
      if (!missingFields.includes('venue')) score += 15;
      if (normalizedCity) score += 10;
      if (normalizedCountry) score += 5;
      if (!missingFields.includes('organizer')) score += 10;
      if (!missingFields.includes('registrationUrl')) score += 10;
      if (!missingFields.includes('description')) score += 5;

      // Assign initial verification status
      let verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'FLAGGED' = 'UNVERIFIED';
      if (score >= 80 && this.isValidUrl(parsed.sourceUrl) && !missingFields.includes('startDate')) {
        verificationStatus = 'VERIFIED';
      } else if (score < 50 || missingFields.includes('startDate')) {
        verificationStatus = 'FLAGGED';
      }

      const slug = this.slugify(parsed.name);
      const duplicateHash = this.generateDuplicateHash(parsed.name, start, normalizedCity, normalizedCountry);

      const validated: ValidatedExpoData = {
        name: parsed.name.trim(),
        slug,
        organizer: cleanOrganizer || 'Gujarat Trade Network',
        industry: parsed.industry || 'Business & Trade Expo',
        startDate: start,
        endDate: end,
        venue: cleanVenue || `${normalizedCity} Exhibition Centre`,
        city: normalizedCity,
        state: normalizedState,
        country: normalizedCountry,
        description: cleanDesc || `${parsed.name} - Trade exhibition held in ${normalizedCity}, Gujarat, India.`,
        registrationUrl: cleanRegUrl || parsed.sourceUrl,
        sourceUrl: parsed.sourceUrl,
        sourceKey,
        duplicateHash,
        status,
        verificationStatus,
        dataQualityScore: score,
        missingFields,
        validationErrors,
        duplicateReviewStatus: 'NONE',
        rawData: parsed.rawData || {},
      };

      return { valid: true, data: validated };
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const errorMsg = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { valid: false, error: errorMsg };
      }
      return { valid: false, error: err.message || 'Validation error' };
    }
  }
}
