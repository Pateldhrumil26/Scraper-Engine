import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

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

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 1: Single Tradeshow Detail Page Extraction
    // e.g. /tradeshows/143261/kutch-industrial-expo.html
    // ─────────────────────────────────────────────────────────────
    if (/\/tradeshows\/\d+\//.test(baseUrl)) {
      const pageText = $('body').text().replace(/\s+/g, ' ');

      // Extract Name from h1, breadcrumb, or title
      let title = this.cleanText($('h1').first().text()) ||
                  this.cleanText($('[class*="TradeShowTitle"], [class*="title"]').first().text());
      if (!title || title.length < 3) {
        const rawTitle = $('title').text() || '';
        title = this.cleanText(rawTitle.split('|')[0].split('•')[0].split('-')[0]);
      }

      // Check header bar / text for date range: e.g. "December 11, 2026 - December 13, 2026"
      let dateText = '';
      const fullDateMatch =
        pageText.match(new RegExp('\\b' + monthRegex + '\\s+\\d{1,2}(?:,?\\s+\\d{4})?\\s*[-–—]\\s*' + monthRegex + '\\s+\\d{1,2},?\\s+\\d{4}\\b', 'i')) ||
        pageText.match(new RegExp('\\b' + monthRegex + '\\s+\\d{1,2}\\s*[-–—]\\s*\\d{1,2},?\\s+\\d{4}\\b', 'i')) ||
        pageText.match(new RegExp('\\b\\d{1,2}\\s*[-–—]\\s*\\d{1,2}\\s+' + monthRegex + ',?\\s+\\d{4}\\b', 'i'));

      if (fullDateMatch) {
        dateText = fullDateMatch[0];
      } else {
        // Look inside Event Schedule elements (e.g. "Fri, Dec 11, 2026", "Sun, Dec 13, 2026")
        const scheduleDates: string[] = [];
        $('[class*="Schedule"], [class*="Event"], div').each((_, el) => {
          const t = $(el).text().replace(/\s+/g, ' ').trim();
          const dMatch = t.match(new RegExp('\\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[,\\s]*' + monthRegex + '\\s+\\d{1,2},?\\s+\\d{4}\\b', 'i'));
          if (dMatch && !scheduleDates.includes(dMatch[0])) {
            scheduleDates.push(dMatch[0]);
          }
        });
        if (scheduleDates.length >= 2) {
          dateText = `${scheduleDates[0]} - ${scheduleDates[scheduleDates.length - 1]}`;
        } else if (scheduleDates.length === 1) {
          dateText = scheduleDates[0];
        }
      }

      const { startDate, endDate } = this.parseDateRange(dateText);

      // Extract location from page text
      let city = 'Kutch';
      let state = 'Gujarat';
      let venue = 'Exhibition Center';
      const locMatch = pageText.match(/\b(Kutch|Ahmedabad|Gandhinagar|Surat|Vadodara|Rajkot|Patan|Morbi|Bhavnagar|Jamnagar|Anand|Bharuch|Vapi|Gandhidham|Bhuj)\b/i);
      if (locMatch) {
        city = locMatch[1].charAt(0).toUpperCase() + locMatch[1].slice(1).toLowerCase();
        if (city === 'Bhuj' || city === 'Gandhidham') city = 'Kutch';
      }

      if (title) {
        seenUrls.add(baseUrl);
        results.push({
          name: title,
          organizer: 'TradeIndia Network',
          industry: 'Industrial & B2B Exhibition',
          startDate,
          endDate,
          venue: `${city} Exhibition Center`,
          city,
          state,
          country: 'India',
          description: `${title} - Gujarat's premier industrial and engineering showcase held in ${city}, Gujarat, India.`,
          registrationUrl: baseUrl,
          sourceUrl: baseUrl,
          rawData: {
            extractedVia: 'tradeindia-detail-page',
            dateText,
          },
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 2: Multi-card Directory Listing Extraction
    // ─────────────────────────────────────────────────────────────
    $('a[href*="/tradeshows/"]').each((_, el) => {
      const $a = $(el);
      const rawHref = $a.attr('href') || '';
      if (!/\/tradeshows\/\d+\//.test(rawHref)) return;

      const sourceUrl = this.resolveUrl(rawHref, baseUrl);
      if (seenUrls.has(sourceUrl)) return;
      seenUrls.add(sourceUrl);

      // Extract Name
      let name = $a
        .find('p[class*="Body2R"], p[class*="body1R"], .twoLineShowText, p')
        .first()
        .text()
        .trim();
      if (!name) {
        name = $a.text().trim();
      }
      name = this.cleanText(name);
      if (!name || name.length < 3 || /^\d+\s*Trade Fairs/i.test(name)) return;

      // Extract Date and Location from inner paragraphs
      let dateText = '';
      let locationText = '';

      $a.find('p').each((_, p) => {
        const text = $(p).text().replace(/\s+/g, ' ').trim();
        // Check for Month Day Year OR Day Month Year formats
        const isDatePattern =
          new RegExp('\\b' + monthRegex + '\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b', 'i').test(text) ||
          new RegExp('\\b\\d{1,2}\\s+' + monthRegex + '[,\\s]+\\d{4}\\b', 'i').test(text) ||
          new RegExp('\\b' + monthRegex + '\\s+\\d{1,2}\\s*[-–—]\\s*\\d{1,2},?\\s+\\d{4}\\b', 'i').test(text) ||
          new RegExp('\\b\\d{1,2}\\s*[-–—]\\s*\\d{1,2}\\s+' + monthRegex + ',?\\s+\\d{4}\\b', 'i').test(text) ||
          new RegExp('\\b' + monthRegex + '\\s+\\d{1,2}(?:,?\\s+\\d{4})?\\s*[-–—]\\s*' + monthRegex + '\\s+\\d{1,2},?\\s+\\d{4}\\b', 'i').test(text) ||
          new RegExp('\\b' + monthRegex + '\\s+\\d{1,2},?\\s+\\d{4}\\s*[-–—]', 'i').test(text);

        if (isDatePattern) {
          dateText = text;
        } else if (text.includes(',') && !text.includes('Trade Fairs') && text.length > 4 && text !== name) {
          locationText = text;
        }
      });

      const { startDate, endDate } = this.parseDateRange(dateText);

      // Extract Venue, City, Country
      let venue = 'Exhibition Center';
      let city = 'Kutch';
      let country = 'India';

      if (locationText) {
        const parts = locationText.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          venue = parts[0];
          city = parts[1];
          country = parts[parts.length - 1];
        } else if (parts.length === 2) {
          city = parts[0];
          country = parts[1];
          venue = `${city} Trade Fair Complex`;
        } else if (parts.length === 1) {
          city = parts[0];
        }
      }

      // Check industry category from URL or context
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
        state: 'Gujarat',
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

    return results;
  }
}
