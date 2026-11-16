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

    // TradeIndia lists trade shows inside cards with links like /tradeshows/{id}/{slug}.html
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
        // Date regex: e.g. "Thu, 25 Feb, 2027 - Sat, 27 Feb, 2027" or "17 Dec, 2026 - 19 Dec, 2026"
        if (
          /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[,\s]*\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[,\s]+\d{4}/i.test(text) ||
          /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*[-–]\s*\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i.test(text)
        ) {
          dateText = text;
        } else if (text.includes(',') && !text.includes('Trade Fairs') && text.length > 4 && text !== name) {
          locationText = text;
        }
      });

      const { startDate, endDate } = this.parseDateRange(dateText);

      // Extract Venue, City, Country from locationText (e.g. "Chennai Trade Centre,Chennai, India")
      let venue = 'Exhibition Center';
      let city = 'National';
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

      // Check industry category from URL or nearby context
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
        state: '',
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
