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
  lastStatus: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  lastError: string | null;
  totalFetchedCount: number;
  selectorConfig?: SelectorConfig;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  totalSources: number;
  activeSources: number;
  recentFetches: FetchLog[];
  industryStats: { label: string; count: number }[];
  countryStats: { label: string; count: number }[];
  upcomingList: Expo[];
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
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
