import { Types } from 'mongoose';
import { Expo, IChangeHistoryItem } from '../../models/Expo';
import { ValidatedExpoData } from './interfaces/expo-parser.interface';

export interface ExpoUpdateAction {
  existingId: Types.ObjectId;
  name: string;
  changes: IChangeHistoryItem[];
  updatedFields: Partial<ValidatedExpoData>;
}

export class DuplicateDetector {
  /**
   * Token similarity helper (Dice coefficient)
   */
  static computeSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);
    const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);
    if (s1.length === 0 || s2.length === 0) return 0;
    const set1 = new Set(s1);
    const set2 = new Set(s2);
    let intersection = 0;
    for (const word of set1) {
      if (set2.has(word)) intersection++;
    }
    return (2 * intersection) / (set1.size + set2.size);
  }

  /**
   * Batch checks a list of validated items to find new, updated, and duplicate records
   */
  static async checkDuplicates(items: ValidatedExpoData[]): Promise<{
    newItems: ValidatedExpoData[];
    updatedItems: ExpoUpdateAction[];
    duplicateItems: ValidatedExpoData[];
  }> {
    if (items.length === 0) {
      return { newItems: [], updatedItems: [], duplicateItems: [] };
    }

    const hashes = items.map((i) => i.duplicateHash);
    const urls = items.map((i) => i.sourceUrl);

    // Query existing records by duplicateHash or sourceUrl
    const existing = await Expo.find({
      $or: [
        { duplicateHash: { $in: hashes } },
        { sourceUrl: { $in: urls } },
      ],
    }).lean();

    const existingByHash = new Map<string, any>();
    const existingByUrl = new Map<string, any>();

    for (const record of existing) {
      if (record.duplicateHash) existingByHash.set(record.duplicateHash, record);
      if (record.sourceUrl) existingByUrl.set(record.sourceUrl, record);
    }

    const newItems: ValidatedExpoData[] = [];
    const updatedItems: ExpoUpdateAction[] = [];
    const duplicateItems: ValidatedExpoData[] = [];
    const seenBatchHashes = new Set<string>();

    for (const item of items) {
      // Intra-batch duplicate check
      if (seenBatchHashes.has(item.duplicateHash)) {
        duplicateItems.push(item);
        continue;
      }
      seenBatchHashes.add(item.duplicateHash);

      const matchedExisting = existingByHash.get(item.duplicateHash) || existingByUrl.get(item.sourceUrl);

      if (matchedExisting) {
        // Field Diffing & Update Detection
        const changes: IChangeHistoryItem[] = [];
        const now = new Date();

        // 1. Check startDate
        const oldStartStr = matchedExisting.startDate ? new Date(matchedExisting.startDate).toISOString().split('T')[0] : '';
        const newStartStr = item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '';
        if (oldStartStr && newStartStr && oldStartStr !== newStartStr) {
          changes.push({
            field: 'startDate',
            oldValue: oldStartStr,
            newValue: newStartStr,
            changedAt: now,
            changedBy: 'ScraperEngine',
            reason: 'Event date rescheduled',
          });
        }

        // 2. Check endDate
        const oldEndStr = matchedExisting.endDate ? new Date(matchedExisting.endDate).toISOString().split('T')[0] : '';
        const newEndStr = item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '';
        if (oldEndStr && newEndStr && oldEndStr !== newEndStr) {
          changes.push({
            field: 'endDate',
            oldValue: oldEndStr,
            newValue: newEndStr,
            changedAt: now,
            changedBy: 'ScraperEngine',
            reason: 'Event end date updated',
          });
        }

        // 3. Check venue
        if (
          item.venue &&
          item.venue !== 'Exhibition Hall' &&
          item.venue !== 'TBD' &&
          item.venue !== matchedExisting.venue
        ) {
          changes.push({
            field: 'venue',
            oldValue: matchedExisting.venue || 'TBD',
            newValue: item.venue,
            changedAt: now,
            changedBy: 'ScraperEngine',
            reason: 'Venue location updated or refined',
          });
        }

        // 4. Check organizer
        if (
          item.organizer &&
          item.organizer !== 'Not Specified' &&
          item.organizer !== matchedExisting.organizer
        ) {
          changes.push({
            field: 'organizer',
            oldValue: matchedExisting.organizer || 'Not Specified',
            newValue: item.organizer,
            changedAt: now,
            changedBy: 'ScraperEngine',
            reason: 'Organizer information enriched',
          });
        }

        // 5. Check registrationUrl
        if (
          item.registrationUrl &&
          item.registrationUrl !== matchedExisting.registrationUrl &&
          item.registrationUrl !== item.sourceUrl
        ) {
          changes.push({
            field: 'registrationUrl',
            oldValue: matchedExisting.registrationUrl || '',
            newValue: item.registrationUrl,
            changedAt: now,
            changedBy: 'ScraperEngine',
            reason: 'Direct registration link added',
          });
        }

        // 6. Check description
        if (
          item.description &&
          item.description.length > (matchedExisting.description?.length || 0) + 30
        ) {
          changes.push({
            field: 'description',
            oldValue: `${(matchedExisting.description || '').slice(0, 40)}...`,
            newValue: `${item.description.slice(0, 40)}...`,
            changedAt: now,
            changedBy: 'ScraperEngine',
            reason: 'Description expanded with richer detail',
          });
        }

        if (changes.length > 0) {
          updatedItems.push({
            existingId: matchedExisting._id,
            name: item.name,
            changes,
            updatedFields: {
              startDate: item.startDate,
              endDate: item.endDate,
              venue: item.venue,
              organizer: item.organizer,
              description: item.description,
              registrationUrl: item.registrationUrl,
              status: item.status,
              dataQualityScore: Math.max(matchedExisting.dataQualityScore || 50, item.dataQualityScore || 50),
              missingFields: item.missingFields,
            },
          });
        } else {
          duplicateItems.push(item);
        }
      } else {
        // Potential Fuzzy Match Check for manual review queue
        newItems.push(item);
      }
    }

    return { newItems, updatedItems, duplicateItems };
  }
}
