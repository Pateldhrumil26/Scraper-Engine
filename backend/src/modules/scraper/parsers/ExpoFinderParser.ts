import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class ExpoFinderParser extends BaseParser {
  readonly key = 'expofinder';
  readonly name = 'ExpoFinder Global Directory';
  readonly description = 'Parser for ExpoFinder.com international trade exhibitions with Next.js SSR stream hydration & ItemList schema support';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('expofinder.com');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenNames = new Set<string>();

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 1: Next.js App Router SSR Hydration Stream (initialItems)
    // ─────────────────────────────────────────────────────────────
    $('script').each((_, el) => {
      const content = $(el).html() || '';
      if (!content.includes('initialItems')) return;

      const chunks: string[] = [];
      const selfObj = {
        __next_f: {
          push: (arr: any[]) => {
            if (arr && arr[1] && typeof arr[1] === 'string') chunks.push(arr[1]);
          },
        },
      };

      try {
        const fn = new Function('self', content);
        fn(selfObj);

        for (const chunk of chunks) {
          if (!chunk.includes('initialItems')) continue;
          const match = chunk.match(/"initialItems":(\[.*?\])(?:,"|\})/);
          if (match) {
            const rawList = JSON.parse(match[1]);
            for (const raw of rawList) {
              const name = this.cleanText(raw.name);
              if (!name || seenNames.has(name.toLowerCase())) continue;
              seenNames.add(name.toLowerCase());

              let startDate = new Date();
              let endDate = new Date();
              if (raw.time) {
                const parts = raw.time.split('-');
                if (parts.length === 2) {
                  const sStr = parts[0].replace(/\./g, '-');
                  startDate = new Date(sStr);
                  const year = sStr.split('-')[0];
                  const eStr = `${year}-${parts[1].replace(/\./g, '-')}`;
                  endDate = new Date(eStr);
                }
              }

              const detailUrl = raw.publicId
                ? this.resolveUrl(`/en/detail/${raw.publicId}`, baseUrl)
                : baseUrl;

              results.push({
                name,
                organizer: raw.organizerRoleText || 'ExpoFinder Organizer',
                industry: raw.category || 'Business Exhibition',
                startDate,
                endDate,
                venue: raw.venueName || `${raw.city || 'Convention'} Center`,
                city: raw.city || 'Global',
                state: '',
                country: raw.country || 'International',
                description: `${name} - International business exhibition in ${raw.city || ''}, ${raw.country || ''}.`,
                registrationUrl: detailUrl,
                sourceUrl: detailUrl,
                rawData: raw,
              });
            }
          }
        }
      } catch {
        // Fallback to other strategies
      }
    });

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 2: Schema.org ItemList JSON-LD
    // ─────────────────────────────────────────────────────────────
    if (results.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || '');
          const list = Array.isArray(data) ? data : [data];
          for (const item of list) {
            if (item['@type'] === 'ItemList' && Array.isArray(item.itemListElement)) {
              for (const elem of item.itemListElement) {
                const name = this.cleanText(elem.name);
                if (!name || seenNames.has(name.toLowerCase())) continue;
                seenNames.add(name.toLowerCase());

                const sourceUrl = elem.url ? this.resolveUrl(elem.url, baseUrl) : baseUrl;

                results.push({
                  name,
                  organizer: 'ExpoFinder Network',
                  industry: 'International Trade Exhibition',
                  startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),
                  venue: 'International Exhibition Center',
                  city: 'Global',
                  state: '',
                  country: 'International',
                  description: `${name} - Trade show listed on ExpoFinder.`,
                  registrationUrl: sourceUrl,
                  sourceUrl,
                  rawData: elem,
                });
              }
            }
          }
        } catch {
          // Ignore JSON errors
        }
      });
    }

    return results;
  }
}
