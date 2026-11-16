import { Expo } from '../../models/Expo';
import { ValidatedExpoData } from './interfaces/expo-parser.interface';

export class DuplicateDetector {
  /**
   * Batch checks a list of validated items to find duplicates in MongoDB
   */
  static async checkDuplicates(items: ValidatedExpoData[]): Promise<{
    newItems: ValidatedExpoData[];
    duplicateItems: ValidatedExpoData[];
  }> {
    if (items.length === 0) {
      return { newItems: [], duplicateItems: [] };
    }

    const hashes = items.map((i) => i.duplicateHash);
    const urls = items.map((i) => i.sourceUrl);

    // Query existing records by duplicateHash or sourceUrl
    const existing = await Expo.find({
      $or: [
        { duplicateHash: { $in: hashes } },
        { sourceUrl: { $in: urls } },
      ],
    }).select('duplicateHash sourceUrl').lean();

    const existingHashSet = new Set(existing.map((e) => e.duplicateHash));
    const existingUrlSet = new Set(existing.map((e) => e.sourceUrl));

    const newItems: ValidatedExpoData[] = [];
    const duplicateItems: ValidatedExpoData[] = [];

    // Track within the batch as well so intra-batch duplicates are filtered
    const seenBatchHashes = new Set<string>();

    for (const item of items) {
      const isDbDuplicate = existingHashSet.has(item.duplicateHash) || existingUrlSet.has(item.sourceUrl);
      const isBatchDuplicate = seenBatchHashes.has(item.duplicateHash);

      if (isDbDuplicate || isBatchDuplicate) {
        duplicateItems.push(item);
      } else {
        seenBatchHashes.add(item.duplicateHash);
        newItems.push(item);
      }
    }

    return { newItems, duplicateItems };
  }
}
