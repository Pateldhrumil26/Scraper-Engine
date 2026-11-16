import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFetchLog extends Document {
  sourceId?: Types.ObjectId;
  sourceName: string;
  sourceUrl: string;
  parserKey: string;
  triggeredBy: 'MANUAL' | 'SCHEDULED';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  startTime: Date;
  endTime: Date;
  durationMs: number;
  totalFound: number;
  newInserted: number;
  duplicatesSkipped: number;
  errorMessages: string[];
  logMessages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FetchLogSchema = new Schema<IFetchLog>(
  {
    sourceId: { type: Schema.Types.ObjectId, ref: 'WebsiteSource', index: true },
    sourceName: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    parserKey: { type: String, required: true },
    triggeredBy: { type: String, enum: ['MANUAL', 'SCHEDULED'], default: 'MANUAL' },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
      required: true,
      index: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMs: { type: Number, required: true },
    totalFound: { type: Number, default: 0 },
    newInserted: { type: Number, default: 0 },
    duplicatesSkipped: { type: Number, default: 0 },
    errorMessages: { type: [String], default: [] },
    logMessages: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

FetchLogSchema.index({ createdAt: -1 });

export const FetchLog = mongoose.model<IFetchLog>('FetchLog', FetchLogSchema);
