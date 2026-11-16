import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class LayerXGujaratParser extends BaseParser {
  readonly key = 'layerx';
  readonly name = 'LayerX Gujarat Confirmed Expos';
  readonly description = 'Curated calendar of verified trade shows and industrial exhibitions in Ahmedabad and Gandhinagar, Gujarat';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('layerx3d.in');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenNames = new Set<string>();

    // LayerX publishes confirmed Gujarat events in table.
    // Columns: Event | Dates | Venue | Who exhibits | Order model deadline
    $('table tr').each((idx, tr) => {
      if (idx === 0) return; // skip header
      const cells = $(tr).find('td');
      if (cells.length < 3) return;

      const name = this.cleanText($(cells[0]).text());
      if (!name || name.length < 3 || seenNames.has(name.toLowerCase())) return;
      seenNames.add(name.toLowerCase());

      const dateText = this.cleanText($(cells[1]).text());
      const venueRaw = this.cleanText($(cells[2]).text());
      const industry = cells.length >= 4 ? this.cleanText($(cells[3]).text()) : 'Industrial & Commercial Expo';

      // Parse dates: e.g. "16-17 Dec 2026", "9-13 Jan 2027", "21-23 Jan 2027"
      const { startDate, endDate } = this.parseDateRange(dateText);

      // Determine Gujarat City
      let city = 'Gandhinagar';
      if (/ahmedabad/i.test(venueRaw) || /ahmedabad/i.test(name)) {
        city = 'Ahmedabad';
      } else if (/surat/i.test(venueRaw) || /surat/i.test(name)) {
        city = 'Surat';
      } else if (/rajkot/i.test(venueRaw) || /rajkot/i.test(name)) {
        city = 'Rajkot';
      } else if (/vadodara/i.test(venueRaw) || /vadodara/i.test(name)) {
        city = 'Vadodara';
      }

      const venue = venueRaw || `${city} Exhibition Centre`;
      const description = `${name} - Verified Gujarat trade exhibition at ${venue}, ${city}, Gujarat, India. Sector: ${industry}`;

      results.push({
        name,
        organizer: 'Gujarat State & Trade Organizers',
        industry,
        startDate,
        endDate,
        venue,
        city,
        state: 'Gujarat',
        country: 'India',
        description,
        registrationUrl: baseUrl,
        sourceUrl: baseUrl,
        rawData: {
          originalDateText: dateText,
          venueRaw,
          sector: industry,
        },
      });
    });

    return results;
  }
}
