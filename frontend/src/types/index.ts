export interface SelectorConfig {
  itemSelector?: string;
  nameSelector?: string;
  startDateSelector?: string;
  endDateSelector?: string;
  venueSelector?: string;
  citySelector?: string;
  countrySelector?: string;
  organizerSelector?: string;
  industrySelector?: string;
  descriptionSelector?: string;
  registrationUrlSelector?: string;
  detailLinkSelector?: string;
}

export interface WebsiteSource {
  _id: string;
  name: string;
  url: string;
  parserKey: string;
  category: string;
  active: boolean;
  scheduleCron: string;
  lastFetchedAt: string | null;
  lastSuccessfulFetchAt?: string | null;
  lastStatus: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  healthStatus?: 'HEALTHY' | 'DEGRADED' | 'FAILING' | 'UNTESTED';
  consecutiveFailures?: number;
  lastError: string | null;
  totalFetchedCount: number;
  selectorConfig?: SelectorConfig;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IChangeHistoryItem {
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  changedBy?: string;
  reason?: string;
}

export interface Expo {
  _id: string;
  name: string;
  slug: string;
  organizer: string;
  industry: string;
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  description: string;
  registrationUrl: string;
  sourceUrl: string;
  sourceWebsiteId?: WebsiteSource | string;
  sourceKey: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  verificationStatus?: 'UNVERIFIED' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';
  dataQualityScore?: number;
  missingFields?: string[];
  validationErrors?: string[];
  isFavorite?: boolean;
  changeHistory?: IChangeHistoryItem[];
  duplicateReviewStatus?: 'NONE' | 'NEEDS_REVIEW' | 'CONFIRMED_DUPLICATE' | 'CONFIRMED_UNIQUE';
  potentialDuplicateOf?: string;
  duplicateConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  duplicateHash: string;
  rawData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FetchLog {
  _id: string;
  sourceId?: string;
  sourceName: string;
  sourceUrl: string;
  parserKey: string;
  triggeredBy: 'MANUAL' | 'SCHEDULED';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  startTime: string;
  endTime: string;
  durationMs: number;
  pagesVisited?: number;
  recordsDiscovered?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
  recordsSkipped?: number;
  recordsFailed?: number;
  totalFound: number;
  newInserted: number;
  duplicatesSkipped: number;
  errorMessages: string[];
  logMessages: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalExpos: number;
  upcomingExpos: number;
  ongoingExpos?: number;
  expiredExpos?: number;
  unverifiedCount?: number;
  favoritesCount?: number;
  newlyDiscoveredCount?: number;
  totalSources: number;
  activeSources: number;
  sourceHealth?: {
    healthy: number;
    degraded: number;
    failing: number;
    total: number;
  };
  recentFetches: FetchLog[];
  industryStats: { label: string; count: number }[];
  countryStats: { label: string; count: number }[];
  upcomingList: Expo[];
  unverifiedList?: Expo[];
  newlyDiscoveredList?: Expo[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ExpoFilterState {
  search: string;
  industry: string;
  country: string;
  city: string;
  sourceId: string;
  status: string;
  verificationStatus?: string;
  isFavorite?: boolean | string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface BackupMetadata {
  filename: string;
  createdAt: string;
  sizeBytes: number;
  totalExpos: number;
  totalSources: number;
  totalLogs: number;
}
