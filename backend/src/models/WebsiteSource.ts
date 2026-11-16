import mongoose, { Schema, Document } from 'mongoose';

export interface ISelectorConfig {
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

export interface IWebsiteSource extends Document {
  name: string;
  url: string;
  parserKey: string;
  category?: string;
  active: boolean;
  scheduleCron: string;
  lastFetchedAt?: Date | null;
  lastSuccessfulFetchAt?: Date | null;
  lastStatus?: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'NO_DATA' | 'PARSE_FAILED';
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'FAILING' | 'UNTESTED';
  consecutiveFailures: number;
  lastError?: string | null;
  totalFetchedCount: number;
  selectorConfig?: ISelectorConfig;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SelectorConfigSchema = new Schema<ISelectorConfig>({
  itemSelector: { type: String, default: '' },
  nameSelector: { type: String, default: '' },
  startDateSelector: { type: String, default: '' },
  endDateSelector: { type: String, default: '' },
  venueSelector: { type: String, default: '' },
  citySelector: { type: String, default: '' },
  countrySelector: { type: String, default: '' },
  organizerSelector: { type: String, default: '' },
  industrySelector: { type: String, default: '' },
  descriptionSelector: { type: String, default: '' },
  registrationUrlSelector: { type: String, default: '' },
  detailLinkSelector: { type: String, default: '' },
}, { _id: false });

const WebsiteSourceSchema = new Schema<IWebsiteSource>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    parserKey: { type: String, required: true, trim: true, default: 'generic' },
    category: { type: String, default: 'General Business' },
    active: { type: Boolean, default: true, index: true },
    scheduleCron: { type: String, default: '0 0 * * *' },
    lastFetchedAt: { type: Date, default: null },
    lastSuccessfulFetchAt: { type: Date, default: null },
    lastStatus: {
      type: String,
      enum: ['IDLE', 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL'],
      default: 'IDLE',
    },
    healthStatus: {
      type: String,
      enum: ['HEALTHY', 'DEGRADED', 'FAILING', 'UNTESTED'],
      default: 'UNTESTED',
      index: true,
    },
    consecutiveFailures: { type: Number, default: 0 },
    lastError: { type: String, default: null },
    totalFetchedCount: { type: Number, default: 0 },
    selectorConfig: { type: SelectorConfigSchema, default: () => ({}) },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

WebsiteSourceSchema.index({ url: 1 }, { unique: true });

export const WebsiteSource = mongoose.model<IWebsiteSource>('WebsiteSource', WebsiteSourceSchema);
