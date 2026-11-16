import mongoose, { Schema, Document, Types } from 'mongoose';

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
  rawData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

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
    rawData: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

ExpoSchema.index({ name: 'text', description: 'text', venue: 'text', city: 'text' });
ExpoSchema.index({ startDate: 1, country: 1, industry: 1 });

export const Expo = mongoose.model<IExpo>('Expo', ExpoSchema);
