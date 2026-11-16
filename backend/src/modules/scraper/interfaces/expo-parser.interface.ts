import { ISelectorConfig } from '../../../models/WebsiteSource';

export interface RawExpoData {
  name: string;
  organizer?: string;
  industry?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  registrationUrl?: string;
  sourceUrl: string;
  rawData?: Record<string, any>;
}

export interface ValidatedExpoData {
  name: string;
  slug: string;
  organizer: string;
  industry: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  city: string;
  state: string;
  country: string;
  description: string;
  registrationUrl: string;
  sourceUrl: string;
  sourceKey: string;
  duplicateHash: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  verificationStatus?: 'UNVERIFIED' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';
  dataQualityScore?: number;
  missingFields?: string[];
  validationErrors?: string[];
  duplicateReviewStatus?: 'NONE' | 'NEEDS_REVIEW' | 'CONFIRMED_DUPLICATE' | 'CONFIRMED_UNIQUE';
  potentialDuplicateOf?: string;
  duplicateConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  rawData?: Record<string, any>;
}

export interface IExpoParser {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  canHandle(url: string): boolean;
  parse(html: string, baseUrl: string, customConfig?: ISelectorConfig): Promise<RawExpoData[]>;
}

export interface FetchResult {
  sourceId?: string;
  sourceName: string;
  sourceUrl: string;
  parserKey: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'NO_DATA' | 'PARSE_FAILED';
  startTime: Date;
  endTime: Date;
  durationMs: number;
  pagesVisited: number;
  recordsDiscovered: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  totalFound: number;
  newInserted: number;
  duplicatesSkipped: number;
  errors: string[];
  logs: string[];
  items: ValidatedExpoData[];
}
