import { Types } from 'mongoose';
import { WebsiteSource, IWebsiteSource } from '../../models/WebsiteSource';
import { Expo } from '../../models/Expo';
import { FetchLog } from '../../models/FetchLog';
import { parserRegistry } from './parser-registry';
import { ExpoValidator } from './validator/expo.validator';
import { DuplicateDetector } from './duplicate-detector.service';
import { FetchResult, ValidatedExpoData } from './interfaces/expo-parser.interface';

export class ScraperEngineService {
  /**
   * Orchestrates the complete fetching pipeline for a single website source
   */
  static async fetchSource(
    source: IWebsiteSource,
    triggeredBy: 'MANUAL' | 'SCHEDULED' = 'MANUAL'
  ): Promise<FetchResult> {
    const startTime = new Date();
    const logs: string[] = [];
    const errors: string[] = [];

    logs.push(`[${startTime.toISOString()}] Starting fetch for source "${source.name}" (${source.url})`);

    // Update source status to RUNNING
    await WebsiteSource.findByIdAndUpdate(source._id, {
      lastStatus: 'RUNNING',
      lastError: null,
    });

    let totalFound = 0;
    let newInserted = 0;
    let duplicatesSkipped = 0;
    let validatedItems: ValidatedExpoData[] = [];
    let fetchStatus: 'SUCCESS' | 'FAILED' | 'PARTIAL' = 'SUCCESS';

    try {
      // 1. Resolve parser
      const parser = parserRegistry.resolveForUrl(source.url, source.parserKey);
      logs.push(`Resolved parser: ${parser.name} [${parser.key}]`);

      // 2. Fetch HTML content
      logs.push(`Fetching HTML from: ${source.url}`);
      let html = '';
      try {
        if ('fetchHtml' in parser && typeof (parser as any).fetchHtml === 'function') {
          html = await (parser as any).fetchHtml(source.url);
        } else {
          const defaultParser = parserRegistry.get('generic');
          html = await (defaultParser as any).fetchHtml(source.url);
        }
        logs.push(`Fetched ${html.length} bytes of HTML`);
      } catch (fetchErr: any) {
        if (fetchErr.response?.status === 403) {
          throw new Error(`HTTP 403 Forbidden: ${new URL(source.url).hostname} is protected by Cloudflare bot protection/anti-bot challenge. Automated scraping access is blocked by the website.`);
        }
        throw new Error(`Failed to fetch HTML: ${fetchErr.message}`);
      }

      // 3. Website-Specific Parsing
      logs.push(`Parsing HTML with ${parser.name}...`);
      const rawItems = await parser.parse(html, source.url, source.selectorConfig);
      totalFound = rawItems.length;
      logs.push(`Parser extracted ${totalFound} raw items`);

      if (totalFound === 0) {
        logs.push(`Warning: No expo items found with current parser configuration`);
        fetchStatus = 'PARTIAL';
      }

      // 4. Data Validation
      logs.push(`Running Data Validation on ${totalFound} items...`);
      let validCount = 0;
      let invalidCount = 0;

      for (const raw of rawItems) {
        const valRes = ExpoValidator.validate(raw, parser.key);
        if (valRes.valid && valRes.data) {
          validCount++;
          validatedItems.push(valRes.data);
        } else {
          invalidCount++;
          errors.push(`Validation failed for item: ${valRes.error}`);
        }
      }
      logs.push(`Data Validation finished: ${validCount} valid, ${invalidCount} invalid`);

      // 5. Duplicate Check
      logs.push(`Running Duplicate Detection against MongoDB...`);
      const { newItems, duplicateItems } = await DuplicateDetector.checkDuplicates(validatedItems);
      duplicatesSkipped = duplicateItems.length;
      logs.push(`Duplicate Check completed: ${newItems.length} new unique expos, ${duplicatesSkipped} duplicates skipped`);

      // 6. Store in MongoDB
      if (newItems.length > 0) {
        const docsToInsert = newItems.map((item) => ({
          ...item,
          sourceWebsiteId: source._id,
        }));

        const inserted = await Expo.insertMany(docsToInsert, { ordered: false });
        newInserted = inserted.length;
        logs.push(`Successfully saved ${newInserted} new expo records in MongoDB`);
      } else {
        logs.push(`No new records to insert (all items already present in database)`);
      }

      fetchStatus = errors.length > 0 && newInserted === 0 && totalFound > 0 ? 'PARTIAL' : 'SUCCESS';
    } catch (err: any) {
      fetchStatus = 'FAILED';
      const msg = err.message || 'Unknown fetching error';
      errors.push(msg);
      logs.push(`CRITICAL ERROR during fetch: ${msg}`);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    logs.push(`Fetch completed in ${durationMs}ms with status: ${fetchStatus}`);

    // Update WebsiteSource document
    await WebsiteSource.findByIdAndUpdate(source._id, {
      lastFetchedAt: endTime,
      lastStatus: fetchStatus,
      lastError: errors.length > 0 ? errors[0] : null,
      $inc: { totalFetchedCount: newInserted },
    });

    // Create FetchLog record
    const fetchLog = new FetchLog({
      sourceId: source._id,
      sourceName: source.name,
      sourceUrl: source.url,
      parserKey: source.parserKey,
      triggeredBy,
      status: fetchStatus,
      startTime,
      endTime,
      durationMs,
      totalFound,
      newInserted,
      duplicatesSkipped,
      errorMessages: errors,
      logMessages: logs,
    });

    await fetchLog.save();

    return {
      sourceId: source._id.toString(),
      sourceName: source.name,
      sourceUrl: source.url,
      parserKey: source.parserKey,
      status: fetchStatus,
      startTime,
      endTime,
      durationMs,
      totalFound,
      newInserted,
      duplicatesSkipped,
      errors,
      logs,
      items: validatedItems,
    };
  }

  /**
   * Fetches all active sources in sequence with polite delay between sources
   */
  static async fetchAllActiveSources(triggeredBy: 'MANUAL' | 'SCHEDULED' = 'MANUAL'): Promise<FetchResult[]> {
    const activeSources = await WebsiteSource.find({ active: true });
    const results: FetchResult[] = [];

    for (const source of activeSources) {
      try {
        const res = await this.fetchSource(source, triggeredBy);
        results.push(res);
      } catch (err: any) {
        console.error(`Error fetching source ${source.name}:`, err);
      }
      // Rate limit delay between sources
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return results;
  }
}
