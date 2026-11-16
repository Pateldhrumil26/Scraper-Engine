import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class ExpoStandZoneParser extends BaseParser {
  readonly key = 'expostandzone';
  readonly name = 'ExpoStandZone Global Trade Shows';
  readonly description = 'Parser for ExpoStandZone.com international exhibitions and trade shows directory';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('expostandzone.com');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenNames = new Set<string>();

    // Each trade show card on ExpoStandZone contains an h3 and a "View Detail" link
    $('h3').each((_, h3) => {
      const $h3 = $(h3);
      const name = this.cleanText($h3.text());

      // Filter out stats headings like "300+", "12.7M+"
      if (!name || name.length < 3 || /^\d+[+MKBkm]*$/i.test(name) || seenNames.has(name.toLowerCase())) {
        return;
      }

      // Find the card container
      const $card = $h3.closest('div.flex.flex-col.md\\:flex-row, div[class*="items-stretch"], div.rounded-2xl, div.bg-white, div.shadow');
      if ($card.length === 0) return;

      // Extract detail link
      const linkEl = $card.find('a[href*="/trade-shows/"]').first();
      let relHref = linkEl.attr('href') || $h3.find('a').attr('href') || '';
      if (!relHref || relHref === baseUrl || relHref.endsWith('/trade-shows/')) {
        return;
      }
      seenNames.add(name.toLowerCase());
      const sourceUrl = this.resolveUrl(relHref, baseUrl);

      // Extract date text (e.g., "15 Nov - 18 Nov 2026")
      let dateText = '';
      $card.find('span, p').each((_, el) => {
        const t = $(el).text().trim();
        if (/\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*[-–]\s*\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i.test(t)) {
          dateText = t;
        }
      });
      const { startDate, endDate } = this.parseDateRange(dateText);

      // Extract location (e.g. "Riyadh, Saudi Arabia", "Dusseldorf, Germany")
      let city = 'Global';
      let country = 'International';
      let locationText = '';

      $card.find('span, p').each((_, el) => {
        const text = $(el).text().trim();
        // Look for location pattern: "City, Country"
        if (text.includes(',') && !text.includes('★') && !text.includes('Nov') && !text.includes('202') && text.length < 50) {
          locationText = text;
        }
      });

      if (locationText) {
        const parts = locationText.split(',').map((p) => p.trim());
        city = parts[0] || 'Global';
        country = parts[1] || 'International';
      }

      // Extract industry / category (e.g. "Food & Beverages", "Medical & Pharma")
      let industry = 'Trade Show & Exhibition';
      $card.find('span, p').each((_, el) => {
        const t = $(el).text().trim();
        if (t.includes('&') && !t.includes(',') && t.length < 35 && !t.includes('202')) {
          industry = t;
        }
      });

      const organizer = 'ExpoStandZone Network';
      const venue = `${city} International Exhibition Center`;
      const description = `${name} - International business exhibition and trade fair in ${city}, ${country}.`;

      results.push({
        name,
        organizer,
        industry,
        startDate,
        endDate,
        venue,
        city,
        state: '',
        country,
        description,
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
