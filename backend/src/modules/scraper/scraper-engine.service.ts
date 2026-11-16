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

    let pagesVisited = 1;
    let recordsDiscovered = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;
    let validatedItems: ValidatedExpoData[] = [];
    let fetchStatus: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'NO_DATA' | 'PARSE_FAILED' = 'SUCCESS';

    try {
      // 1. Resolve parser
      const parser = parserRegistry.resolveForUrl(source.url, source.parserKey);
      logs.push(`Resolved parser: ${parser.name} [${parser.key}]`);

      // 2. Fetch HTML content with execution timeout guard (45 seconds)
      logs.push(`Fetching HTML from: ${source.url}`);
      let html = '';
      try {
        const fetchPromise = 'fetchHtml' in parser && typeof (parser as any).fetchHtml === 'function'
          ? (parser as any).fetchHtml(source.url)
          : (parserRegistry.get('generic') as any).fetchHtml(source.url);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Scraper request timed out after 45 seconds')), 45000)
        );

        html = await Promise.race([fetchPromise, timeoutPromise]);
        logs.push(`Fetched ${html.length} bytes of HTML`);
      } catch (fetchErr: any) {
        if (fetchErr.response?.status === 403) {
          throw new Error(`HTTP 403 Forbidden: ${new URL(source.url).hostname} blocks automated scrapers with Cloudflare Turnstile / anti-bot challenge.`);
        }
        throw new Error(`Failed to fetch HTML: ${fetchErr.message}`);
      }

      // 3. Website-Specific Parsing
      logs.push(`Parsing HTML with ${parser.name}...`);
      const rawItems = await parser.parse(html, source.url, source.selectorConfig);
      recordsDiscovered = rawItems.length;
      logs.push(`Parser extracted ${recordsDiscovered} raw items`);

      if (recordsDiscovered === 0) {
        logs.push(`Warning: No expo items found on webpage with current parser configuration. Status: NO_DATA`);
        fetchStatus = 'NO_DATA';
      } else {
        // 4. Data Validation, Missing-Field Detection & Quality Scoring
        logs.push(`Running Data Validation on ${recordsDiscovered} items...`);
        for (const raw of rawItems) {
          const valRes = ExpoValidator.validate(raw, parser.key);
          if (valRes.valid && valRes.data) {
            validatedItems.push(valRes.data);
          } else {
            recordsFailed++;
            errors.push(`Validation failed for item: ${valRes.error}`);
          }
        }
        logs.push(`Data Validation finished: ${validatedItems.length} valid, ${recordsFailed} invalid`);

        if (validatedItems.length === 0) {
          logs.push(`All ${recordsDiscovered} discovered items failed data validation. Status: PARSE_FAILED`);
          fetchStatus = 'PARSE_FAILED';
        } else {
          // 5. Duplicate Check & Update Detection
          logs.push(`Running Duplicate Detection & Field Diffing against MongoDB...`);
          const { newItems, updatedItems, duplicateItems } = await DuplicateDetector.checkDuplicates(validatedItems);
          recordsSkipped = duplicateItems.length;

          // 6. Execute Updates on Modified Existing Expos
          if (updatedItems.length > 0) {
            logs.push(`Found ${updatedItems.length} existing expos with updated dates/venues/details. Applying updates...`);
            for (const action of updatedItems) {
              await Expo.findByIdAndUpdate(action.existingId, {
                $set: action.updatedFields,
                $push: { changeHistory: { $each: action.changes } },
              });
              recordsUpdated++;
              const summary = action.changes.map((c) => `${c.field} (${c.oldValue} -> ${c.newValue})`).join('; ');
              logs.push(`[Update] "${action.name}": ${summary}`);
            }
            logs.push(`Applied changes to ${recordsUpdated} existing expo records`);
          }

          // 7. Store New Unique Expos in MongoDB
          if (newItems.length > 0) {
            const docsToInsert = newItems.map((item) => ({
              ...item,
              sourceWebsiteId: source._id,
            }));

            const inserted = await Expo.insertMany(docsToInsert, { ordered: false });
            recordsInserted = inserted.length;
            logs.push(`Successfully saved ${recordsInserted} new unique expo records in MongoDB`);
          } else {
            logs.push(`No new records to insert (${recordsSkipped} unchanged duplicates skipped)`);
          }

          if (errors.length > 0 && recordsInserted === 0 && recordsUpdated === 0) {
            fetchStatus = 'PARTIAL';
          } else {
            fetchStatus = 'SUCCESS';
          }
        }
      }
    } catch (err: any) {
      fetchStatus = 'FAILED';
      const msg = err.message || 'Unknown fetching error';
      errors.push(msg);
      logs.push(`CRITICAL ERROR during fetch: ${msg}`);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    logs.push(`Fetch completed in ${durationMs}ms with status: ${fetchStatus}`);

    // Compute Source Health Status
    let healthStatus: 'HEALTHY' | 'DEGRADED' | 'FAILING' = 'HEALTHY';
    let consecutiveFailures = source.consecutiveFailures || 0;

    if (fetchStatus === 'SUCCESS') {
      healthStatus = 'HEALTHY';
      consecutiveFailures = 0;
    } else if (fetchStatus === 'NO_DATA' || fetchStatus === 'PARTIAL' || fetchStatus === 'PARSE_FAILED') {
      healthStatus = 'DEGRADED';
      consecutiveFailures = 0;
    } else {
      consecutiveFailures += 1;
      healthStatus = consecutiveFailures >= 2 ? 'FAILING' : 'DEGRADED';
    }

    // Update WebsiteSource document (Preserve existing records & only update lastSuccessfulFetchAt on SUCCESS)
    await WebsiteSource.findByIdAndUpdate(source._id, {
      lastFetchedAt: endTime,
      lastSuccessfulFetchAt: fetchStatus === 'SUCCESS' ? endTime : source.lastSuccessfulFetchAt,
      lastStatus: fetchStatus,
      healthStatus,
      consecutiveFailures,
      lastError: errors.length > 0 ? errors[0] : (fetchStatus === 'NO_DATA' ? 'No expo items discovered on webpage' : null),
      $inc: { totalFetchedCount: recordsInserted },
    });

    // Create Rich FetchLog record
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
      pagesVisited,
      recordsDiscovered,
      recordsInserted,
      recordsUpdated,
      recordsSkipped,
      recordsFailed,
      totalFound: recordsDiscovered,
      newInserted: recordsInserted,
      duplicatesSkipped: recordsSkipped,
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
      pagesVisited,
      recordsDiscovered,
      recordsInserted,
      recordsUpdated,
      recordsSkipped,
      recordsFailed,
      totalFound: recordsDiscovered,
      newInserted: recordsInserted,
      duplicatesSkipped: recordsSkipped,
      errors,
      logs,
      items: validatedItems,
    };
  }

  /**
   * Fetches all active sources with concurrency limit and polite interval
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
      // Polite rate limit delay between sources
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    return results;
  }
}
