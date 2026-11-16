import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class AllEventsParser extends BaseParser {
  readonly key = 'allevents';
  readonly name = 'AllEvents India Business Expos';
  readonly description = 'Specialized parser for AllEvents exhibitions and business trade expos in Ahmedabad, Gandhinagar, and Indian metros';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('allevents.in');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenNames = new Set<string>();

    const defaultCity = baseUrl.toLowerCase().includes('gandhinagar')
      ? 'Gandhinagar'
      : baseUrl.toLowerCase().includes('ahmedabad')
      ? 'Ahmedabad'
      : 'Ahmedabad';

    // Strategy 1: High-Fidelity Schema.org JSON-LD extraction
    $('script[type="application/ld+json"]').each((_, scriptEl) => {
      try {
        const rawContent = $(scriptEl).html() || '';
        const parsed = JSON.parse(rawContent);

        const eventItems: any[] = [];
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item['@type'] === 'Event' || item.startDate) {
              eventItems.push(item);
            }
          });
        } else if (parsed['@type'] === 'Event') {
          eventItems.push(parsed);
        } else if (parsed.itemListElement && Array.isArray(parsed.itemListElement)) {
          parsed.itemListElement.forEach((entry: any) => {
            const ev = entry.item || entry;
            if (ev['@type'] === 'Event' || ev.startDate) {
              eventItems.push(ev);
            }
          });
        }

        for (const ev of eventItems) {
          const name = this.cleanText(ev.name);
          if (!name || name.length < 3 || seenNames.has(name.toLowerCase())) continue;
          seenNames.add(name.toLowerCase());

          const startDate = ev.startDate ? new Date(ev.startDate) : new Date();
          let endDate = ev.endDate ? new Date(ev.endDate) : new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
          if (endDate.getTime() < startDate.getTime()) {
            endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
          }

          let venue = 'Exhibition Center';
          let city = defaultCity;
          let state = 'Gujarat';
          let country = 'India';

          if (ev.location) {
            venue = this.cleanText(ev.location.name) || venue;
            if (ev.location.address) {
              const addr = ev.location.address;
              if (typeof addr === 'string') {
                if (addr.toLowerCase().includes('gandhinagar')) city = 'Gandhinagar';
                if (addr.toLowerCase().includes('ahmedabad')) city = 'Ahmedabad';
              } else if (typeof addr === 'object') {
                city = this.cleanText(addr.addressLocality) || city;
                state = this.cleanText(addr.addressRegion) || state;
                country = this.cleanText(addr.addressCountry) || country;
              }
            }
          }

          const organizer = this.cleanText(ev.organizer?.name) || 'Gujarat Trade Network';
          const description = this.cleanText(ev.description) || `${name} - Business exhibition in ${city}, Gujarat.`;
          const sourceUrl = ev.url ? this.resolveUrl(ev.url, baseUrl) : baseUrl;

          results.push({
            name,
            organizer,
            industry: 'Business Expo & Trade Show',
            startDate,
            endDate,
            venue,
            city,
            state,
            country,
            description,
            registrationUrl: sourceUrl,
            sourceUrl,
            rawData: {
              extractedVia: 'json-ld',
              eventStatus: ev.eventStatus,
            },
          });
        }
      } catch {
        // Silently continue to next script
      }
    });

    // Strategy 2: DOM parsing fallback
    if (results.length === 0) {
      $('li.event-item, div.event-item, div.res-card, div[data-link]').each((_, el) => {
        const $el = $(el);
        const name = this.cleanText($el.find('.title, h3, h2').first().text());
        if (!name || name.length < 3 || seenNames.has(name.toLowerCase())) return;
        seenNames.add(name.toLowerCase());

        const link = $el.find('a').attr('href') || $el.attr('data-link');
        const sourceUrl = this.resolveUrl(link, baseUrl);

        const dateRaw = this.cleanText($el.find('.date, .time').text());
        const { startDate, endDate } = this.parseDateRange(dateRaw);

        const venueText = this.cleanText($el.find('.venue, .location').text());
        let city = defaultCity;
        if (venueText.toLowerCase().includes('gandhinagar')) city = 'Gandhinagar';
        if (venueText.toLowerCase().includes('ahmedabad')) city = 'Ahmedabad';

        results.push({
          name,
          organizer: 'Gujarat Expo Organizer',
          industry: 'Trade & Commerce Exhibition',
          startDate,
          endDate,
          venue: venueText || (city === 'Gandhinagar' ? 'Mahatma Mandir Convention Centre' : 'Gujarat University Convention Centre'),
          city,
          state: 'Gujarat',
          country: 'India',
          description: `${name} exhibition in ${city}, Gujarat.`,
          registrationUrl: sourceUrl,
          sourceUrl,
          rawData: {
            extractedVia: 'dom-fallback',
            dateRaw,
          },
        });
      });
    }

    return results;
  }
}
