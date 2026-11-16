import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChangeHistoryItem {
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
}

export interface IExpo extends Document {
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
  sourceWebsiteId: Types.ObjectId;
  sourceKey: string;
  duplicateHash: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';
  dataQualityScore: number;
  missingFields: string[];
  validationErrors: string[];
  isFavorite: boolean;
  changeHistory: IChangeHistoryItem[];
  duplicateReviewStatus: 'NONE' | 'NEEDS_REVIEW' | 'CONFIRMED_DUPLICATE' | 'CONFIRMED_UNIQUE';
  potentialDuplicateOf?: Types.ObjectId;
  duplicateConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  rawData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ChangeHistoryItemSchema = new Schema<IChangeHistoryItem>(
  {
    field: { type: String, required: true },
    oldValue: { type: String, default: '' },
    newValue: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: 'ScraperEngine' },
    reason: { type: String, default: 'Auto-detected update' },
  },
  { _id: false }
);

const ExpoSchema = new Schema<IExpo>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, trim: true },
    organizer: { type: String, default: 'Not Specified', trim: true, index: true },
    industry: { type: String, default: 'Business & Trade', trim: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    venue: { type: String, default: 'TBD', trim: true },
    city: { type: String, default: 'Global', trim: true, index: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: 'International', trim: true, index: true },
    description: { type: String, default: '', trim: true },
    registrationUrl: { type: String, default: '', trim: true },
    sourceUrl: { type: String, required: true, trim: true },
    sourceWebsiteId: { type: Schema.Types.ObjectId, ref: 'WebsiteSource', index: true },
    sourceKey: { type: String, default: 'generic', trim: true },
    duplicateHash: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'VERIFIED', 'FLAGGED', 'REJECTED'],
      default: 'UNVERIFIED',
      index: true,
    },
    dataQualityScore: { type: Number, default: 80, min: 0, max: 100 },
    missingFields: { type: [String], default: [] },
    validationErrors: { type: [String], default: [] },
    isFavorite: { type: Boolean, default: false, index: true },
    changeHistory: { type: [ChangeHistoryItemSchema], default: [] },
    duplicateReviewStatus: {
      type: String,
      enum: ['NONE', 'NEEDS_REVIEW', 'CONFIRMED_DUPLICATE', 'CONFIRMED_UNIQUE'],
      default: 'NONE',
      index: true,
    },
    potentialDuplicateOf: { type: Schema.Types.ObjectId, ref: 'Expo', default: null },
    duplicateConfidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
    },
    rawData: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

ExpoSchema.index({ name: 'text', description: 'text', venue: 'text', city: 'text' });
ExpoSchema.index({ startDate: 1, country: 1, industry: 1 });

export const Expo = mongoose.model<IExpo>('Expo', ExpoSchema);
