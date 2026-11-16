import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class EventsEyeParser extends BaseParser {
  readonly key = 'eventseye';
  readonly name = 'EventsEye Global Trade Shows';
  readonly description = 'Parser for EventsEye.com international business exhibitions, thematic trade lists, and homepage directories';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('eventseye.com');
  }

  /**
   * Parse MM/DD/YYYY or standard date format with optional duration
   */
  private parseEventsEyeDate(dateStr?: string | null): { startDate: Date; endDate: Date } {
    if (!dateStr) {
      return this.parseDateRange(null);
    }

    // Format: MM/DD/YYYY e.g. "11/16/2026" or "08/01/2026"
    const mmddyyyy = dateStr.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    if (mmddyyyy) {
      const month = parseInt(mmddyyyy[1], 10) - 1;
      const day = parseInt(mmddyyyy[2], 10);
      const year = parseInt(mmddyyyy[3], 10);
      const start = new Date(Date.UTC(year, month, day));

      // Extract duration e.g. "2 days", "3 days"
      let durationDays = 2;
      const durMatch = dateStr.match(/(\d+)\s*days?/i);
      if (durMatch) {
        durationDays = Math.max(1, parseInt(durMatch[1], 10) - 1);
      }
      const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: end };
    }

    return this.parseDateRange(dateStr);
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenUrls = new Set<string>();

    // Strategy 1: Table rows containing an expo link starting with f- (both listing tables and homepage tables)
    $('table tr').each((_, tr) => {
      const $tr = $(tr);
      // Skip header rows
      if ($tr.find('th').length > 0 || $tr.hasClass('header')) return;

      const linkEl = $tr.find('a[href*="f-"]').first();
      if (linkEl.length === 0) return;

      const rawHref = linkEl.attr('href') || '';
      // Validate trade show link format
      if (!/f-[a-z0-9-]+-\d+-\d+\.html/i.test(rawHref) && !rawHref.startsWith('f-') && !rawHref.includes('/f-')) {
        return;
      }

      const sourceUrl = this.resolveUrl(rawHref, baseUrl);
      if (seenUrls.has(sourceUrl)) return;
      seenUrls.add(sourceUrl);

      // Extract Name and Description (In listing tables: <b>Title</b><i>Desc</i>)
      let name = '';
      let description = '';

      const boldEl = linkEl.find('b');
      if (boldEl.length > 0) {
        name = this.cleanText(boldEl.text());
        const italicEl = linkEl.find('i');
        if (italicEl.length > 0) {
          description = this.cleanText(italicEl.text());
        }
      } else {
        name = this.cleanText(linkEl.text());
      }

      if (!name || name.length < 3) return;

      let dateText = '';
      let city = 'Global';
      let country = 'International';
      let venue = 'Exhibition Center';

      const tds = $tr.find('td');
      if (tds.length >= 4) {
        // Multi-column listing table:
        // Col 0: Name/Desc | Col 1: Cycle | Col 2: City & Venue | Col 3: Date
        const locTd = tds.eq(2);
        const cityLink = locTd.find('a.city, a[href^="cy1_"]');
        const venueLink = locTd.find('a[href^="pl1_"]');

        if (cityLink.length > 0) {
          const locRaw = this.cleanText(cityLink.text());
          // e.g. "Bluffton, IN (USA)" or "Paris (France)"
          const countryMatch = locRaw.match(/\((.*?)\)/);
          if (countryMatch) {
            country = countryMatch[1];
          }
          city = locRaw.replace(/\(.*?\)/, '').split(',')[0].trim();
        }

        if (venueLink.length > 0) {
          venue = this.cleanText(venueLink.text());
        } else {
          venue = `${city} Exhibition Center`;
        }

        dateText = this.cleanText(tds.eq(3).text());
      } else if (tds.length >= 2) {
        // Homepage 2-column table: Col 0: Link/Name | Col 1: Date
        dateText = this.cleanText(tds.eq(1).text());
        venue = 'International Exhibition Center';
      }

      const { startDate, endDate } = this.parseEventsEyeDate(dateText);

      results.push({
        name,
        organizer: 'EventsEye Directory',
        industry: 'International Business Trade Show',
        startDate,
        endDate,
        venue,
        city,
        state: '',
        country,
        description: description || `${name} - International business exhibition listed on EventsEye.`,
        registrationUrl: sourceUrl,
        sourceUrl,
        rawData: {
          rawDate: dateText,
          rawHref,
        },
      });
    });

    // Strategy 2: Fallback for card / div containers if tables were not present
    if (results.length === 0) {
      $('div.fair-item, div.event-item, article.trade-show').each((_, elem) => {
        const $el = $(elem);
        const name = this.cleanText($el.find('h2, h3, .fair-title, .title').first().text());
        if (!name || name.length < 3) return;

        const link = $el.find('a').first().attr('href');
        const sourceUrl = this.resolveUrl(link, baseUrl);
        const dateText = this.cleanText($el.find('.date, .fair-date, time').text());
        const { startDate, endDate } = this.parseEventsEyeDate(dateText);
        const loc = this.cleanText($el.find('.location, .venue, .city').text());

        results.push({
          name,
          organizer: 'EventsEye Directory',
          industry: 'Business Expo',
          startDate,
          endDate,
          venue: loc || 'Exhibition Hall',
          city: loc || 'Global',
          state: '',
          country: 'International',
          description: this.cleanText($el.find('.desc, p').text()) || name,
          registrationUrl: sourceUrl,
          sourceUrl,
        });
      });
    }

    return results;
  }
}
