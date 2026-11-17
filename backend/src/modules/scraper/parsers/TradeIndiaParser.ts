import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

const GUJARAT_CITIES = [
  'ahmedabad',
  'gandhinagar',
  'surat',
  'vadodara',
  'baroda',
  'rajkot',
  'bhavnagar',
  'jamnagar',
  'junagadh',
  'anand',
  'navsari',
  'morbi',
  'bharuch',
  'vapi',
  'ankleshwar',
  'porbandar',
  'patan',
  'mehsana',
  'palanpur',
  'godhra',
  'valsad',
  'surendranagar',
  'bhuj',
  'kutch',
  'gandhidham',
  'amreli',
  'veraval',
  'dahod',
  'botad',
  'nadiad',
  'dahej',
  'sanand',
  'hazira',
  'changodar',
];

export class TradeIndiaParser extends BaseParser {
  readonly key = 'tradeindia';
  readonly name = 'TradeIndia Tradeshows Directory';
  readonly description = 'Parser for TradeIndia.com B2B industrial trade shows and exhibitions';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('tradeindia.com');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenUrls = new Set<string>();

    const monthRegex = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
    const dateRegex = new RegExp('(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\\s*)?\\b(?:\\d{1,2}\\s*,?\\s*' + monthRegex + '|' + monthRegex + '\\s+\\d{1,2})', 'i');

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 1: Single Tradeshow Detail Page Extraction
    // e.g. /tradeshows/143261/kutch-industrial-expo.html
    // ─────────────────────────────────────────────────────────────
    if (/\/tradeshows\/\d+\//.test(baseUrl)) {
      // 1. Check for high-fidelity Schema.org JSON-LD Event metadata first
      let jsonLdEvent: any = null;
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const content = $(el).html();
          if (!content) return;
          const parsed = JSON.parse(content);
          if (parsed['@type'] === 'Event' || parsed['@type'] === 'BusinessEvent') {
            jsonLdEvent = parsed;
          }
        } catch {
          // Ignore malformed JSON-LD scripts
        }
      });

      if (jsonLdEvent) {
        const name = this.cleanText(jsonLdEvent.name) || $('h1').first().text().trim();
        const startRaw = jsonLdEvent.startDate;
        const endRaw = jsonLdEvent.endDate;
        const startDate = startRaw ? new Date(startRaw) : undefined;
        const endDate = endRaw
          ? new Date(endRaw)
          : startDate
          ? new Date(startDate.getTime() + 2 * 24 * 3600000)
          : undefined;

        let venue = 'Exhibition Center';
        let city = 'Gandhidham';
        let state = 'Gujarat';
        let country = 'India';

        if (jsonLdEvent.location) {
          if (jsonLdEvent.location.name) venue = this.cleanText(jsonLdEvent.location.name);
          if (jsonLdEvent.location.address) {
            const addr = jsonLdEvent.location.address;
            if (addr.addressLocality) city = this.cleanText(addr.addressLocality);
            if (addr.addressCountry) country = this.cleanText(addr.addressCountry);
          }
        }

        const isGujarat = GUJARAT_CITIES.some(
          (gc) =>
            city.toLowerCase().includes(gc) ||
            venue.toLowerCase().includes(gc) ||
            name.toLowerCase().includes(gc)
        );
        state = isGujarat ? 'Gujarat' : '';

        const organizer =
          jsonLdEvent.organizer && jsonLdEvent.organizer.name
            ? this.cleanText(jsonLdEvent.organizer.name)
            : 'TradeIndia Network';

        results.push({
          name,
          organizer,
          industry: 'Industrial & B2B Exhibition',
          startDate,
          endDate,
          venue,
          city,
          state,
          country,
          description:
            this.cleanText(jsonLdEvent.description) ||
            `${name} held at ${venue}, ${city}, India.`,
          registrationUrl: baseUrl,
          sourceUrl: baseUrl,
          rawData: {
            extractedVia: 'tradeindia-json-ld',
            startDateStr: startRaw,
            endDateStr: endRaw,
          },
        });
        return results;
      }

      // 2. Detail DOM Fallback (Event Schedule cards & page headers)
      const title =
        this.cleanText($('h1').first().text()) ||
        this.cleanText($('[class*="TradeShowTitle"], [class*="title"]').first().text()) ||
        $('title').text().split('|')[0].trim();

      let dateText = '';
      const scheduleDates: string[] = [];
      $('[class*="date-title"], [class*="Schedule"] h3, [class*="EventSchedule"] [class*="date"], .mobile-date').each((_, el) => {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        if (dateRegex.test(t) && !scheduleDates.includes(t)) {
          scheduleDates.push(t);
        }
      });

      if (scheduleDates.length >= 2) {
        dateText = `${scheduleDates[0]} - ${scheduleDates[scheduleDates.length - 1]}`;
      } else if (scheduleDates.length === 1) {
        dateText = scheduleDates[0];
      }

      const { startDate, endDate } = this.parseDateRange(dateText);

      let venue = 'Exhibition Center';
      let city = 'Kutch';
      let state = 'Gujarat';
      let country = 'India';

      const pageText = $('body').text().replace(/\s+/g, ' ');
      const locMatch = pageText.match(
        /\b(Kutch|Ahmedabad|Gandhinagar|Surat|Vadodara|Rajkot|Patan|Morbi|Bhavnagar|Jamnagar|Anand|Bharuch|Vapi|Gandhidham|Bhuj)\b/i
      );
      if (locMatch) {
        city = locMatch[1].charAt(0).toUpperCase() + locMatch[1].slice(1).toLowerCase();
        if (city === 'Bhuj' || city === 'Gandhidham') city = 'Kutch';
      }

      results.push({
        name: title,
        organizer: 'TradeIndia Network',
        industry: 'Industrial & B2B Exhibition',
        startDate,
        endDate,
        venue: `${city} Exhibition Center`,
        city,
        state,
        country,
        description: `${title} - Gujarat premier B2B trade exhibition held in ${city}, Gujarat, India.`,
        registrationUrl: baseUrl,
        sourceUrl: baseUrl,
        rawData: {
          extractedVia: 'tradeindia-detail-dom-fallback',
          dateText,
        },
      });
      return results;
    }

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 2: Multi-card Directory Listing Extraction
    // Handles /tradeshows/gujarat/, /tradeshows/city/gandhinagar/, etc.
    // ─────────────────────────────────────────────────────────────
    const cardElements = $('.cardBox, [class*="cardSec"], div[class*="Card"]');

    if (cardElements.length > 0) {
      cardElements.each((_, cardEl) => {
        const $card = $(cardEl);
        const $link = $card
          .find('a[href*="/tradeshows/"]')
          .filter((_, a) => /\/tradeshows\/\d+/.test($(a).attr('href') || ''));
        if ($link.length === 0) return;

        const rawHref = $link.first().attr('href') || '';
        const sourceUrl = this.resolveUrl(rawHref, baseUrl);
        if (seenUrls.has(sourceUrl)) return;
        seenUrls.add(sourceUrl);

        // 1. Clean Title Extraction (avoid wrapping parent containers)
        let name = '';
        const $titleP = $card
          .find('p[class*="Body2R"], p[class*="body1R"], .twoLineShowText, .title-box p, h2, h3')
          .first();
        if ($titleP.length > 0) {
          name = $titleP.text().trim();
        } else {
          const $underLine = $card.find('a.underLine').first();
          if ($underLine.length > 0) {
            name = $underLine.text().trim();
          } else {
            name = $link.first().text().replace(/\s+/g, ' ').trim();
          }
        }
        name = this.cleanText(name);
        if (!name || name.length < 3 || /^\d+\s*Trade Fairs/i.test(name)) return;

        // 2. Real Date & Location Extraction from sibling <p> elements
        let dateText = '';
        let locationText = '';

        $card.find('p').each((_, p) => {
          const text = $(p).text().replace(/\s+/g, ' ').trim();
          if (!text || text === name) return;

          if (!dateText && dateRegex.test(text)) {
            dateText = text;
          } else if (
            !locationText &&
            text.includes(',') &&
            !text.includes('Trade Fairs') &&
            !dateRegex.test(text) &&
            text.length > 4
          ) {
            locationText = text;
          }
        });

        const { startDate, endDate } = this.parseDateRange(dateText);

        // 3. Location Extraction: [Venue], [Area/Road], [City], [Country]
        let venue = 'Exhibition Center';
        let city = 'Gujarat';
        let state = '';
        let country = 'India';

        if (locationText) {
          const parts = locationText.split(',').map((p) => p.trim()).filter(Boolean);
          if (parts.length >= 3) {
            country = parts[parts.length - 1];
            city = parts[parts.length - 2];
            venue = parts.slice(0, parts.length - 2).join(', ');
          } else if (parts.length === 2) {
            city = parts[0];
            country = parts[1];
            venue = `${city} Trade Fair Complex`;
          } else if (parts.length === 1) {
            city = parts[0];
          }
        }

        // Standardize Gandhidham / Bhuj to Kutch region
        if (/gandhidham|bhuj/i.test(city)) {
          city = 'Kutch';
        }

        // Check if city, venue, or name indicates Gujarat
        const isGujarat = GUJARAT_CITIES.some(
          (gc) =>
            city.toLowerCase().includes(gc) ||
            venue.toLowerCase().includes(gc) ||
            name.toLowerCase().includes(gc)
        );
        if (isGujarat) {
          state = 'Gujarat';
        }

        // Check industry category from URL or text
        let industry = 'B2B Trade & Industrial Exhibition';
        const industryMatch = rawHref.match(/\/tradeshows\/(?:category-)?([a-z-]+)\//i);
        if (industryMatch && industryMatch[1]) {
          industry = industryMatch[1]
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        }

        results.push({
          name,
          organizer: 'TradeIndia Network',
          industry,
          startDate,
          endDate,
          venue,
          city,
          state,
          country,
          description: `${name} - B2B trade exhibition and business fair at ${venue}, ${city}, ${country}.`,
          registrationUrl: sourceUrl,
          sourceUrl,
          rawData: {
            originalDateText: dateText,
            extractedLocation: locationText,
          },
        });
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 3: Fallback Anchor Traversal (if classes changed)
    // ─────────────────────────────────────────────────────────────
    if (results.length === 0) {
      $('a[href*="/tradeshows/"]').each((_, el) => {
        const $a = $(el);
        const rawHref = $a.attr('href') || '';
        if (!/\/tradeshows\/\d+/.test(rawHref)) return;

        const sourceUrl = this.resolveUrl(rawHref, baseUrl);
        if (seenUrls.has(sourceUrl)) return;
        seenUrls.add(sourceUrl);

        const $container = $a.closest('.cardBox, [class*="card"], li, tr, div');
        const name = this.cleanText($a.text().trim());
        if (!name || name.length < 3) return;

        let dateText = '';
        let locationText = '';

        $container.find('p, span').each((_, p) => {
          const text = $(p).text().replace(/\s+/g, ' ').trim();
          if (!text || text === name) return;
          if (!dateText && dateRegex.test(text)) {
            dateText = text;
          } else if (!locationText && text.includes(',') && !dateRegex.test(text) && text.length > 4) {
            locationText = text;
          }
        });

        const { startDate, endDate } = this.parseDateRange(dateText);

        let venue = 'Exhibition Center';
        let city = 'Gujarat';
        let state = '';
        let country = 'India';

        if (locationText) {
          const parts = locationText.split(',').map((p) => p.trim()).filter(Boolean);
          if (parts.length >= 3) {
            country = parts[parts.length - 1];
            city = parts[parts.length - 2];
            venue = parts.slice(0, parts.length - 2).join(', ');
          } else if (parts.length === 2) {
            city = parts[0];
            country = parts[1];
          }
        }

        const isGujarat = GUJARAT_CITIES.some(
          (gc) =>
            city.toLowerCase().includes(gc) ||
            venue.toLowerCase().includes(gc) ||
            name.toLowerCase().includes(gc)
        );
        if (isGujarat) state = 'Gujarat';

        results.push({
          name,
          organizer: 'TradeIndia Network',
          industry: 'B2B Trade & Industrial Exhibition',
          startDate,
          endDate,
          venue,
          city,
          state,
          country,
          description: `${name} - B2B trade exhibition held at ${venue}, ${city}.`,
          registrationUrl: sourceUrl,
          sourceUrl,
          rawData: {
            extractedVia: 'tradeindia-fallback-anchor',
            dateText,
            locationText,
          },
        });
      });
    }

    return results;
  }
}
