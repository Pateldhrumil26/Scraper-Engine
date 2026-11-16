import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class EngiExpoParser extends BaseParser {
  readonly key = 'engiexpo';
  readonly name = 'EngiExpo Gujarat Industrial Engineering';
  readonly description = "India's premier B2B engineering and industrial technology exhibitions in Gujarat (Ahmedabad, Surat, Rajkot, Vadodara)";

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('engiexpo.com');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenNames = new Set<string>();

    // EngiExpo Gujarat editions schedule
    // Scrapes show links like /VisitorRegistration?showId=19&showName=20th-Engiexpo-Ahmedabad-26
    $('a[href*="showName"], a[href*="18th-engiexpo"]').each((_, a) => {
      const $a = $(a);
      const href = $a.attr('href') || '';
      const nameMatch = href.match(/showName=([a-zA-Z0-9-]+)/i) || href.match(/\/([0-9a-z-]+engiexpo[0-9a-z-]+)/i);

      if (!nameMatch) return;

      const rawSlug = nameMatch[1];
      const rawName = rawSlug.replace(/-/g, ' ');

      // STRICT GUJARAT FILTER: Only keep Gujarat cities
      if (!/ahmedabad|surat|rajkot|vadodara|gandhinagar/i.test(rawName)) {
        return; // Exclude out-of-state editions like Pune and Jaipur
      }

      let city = 'Ahmedabad';
      let venue = 'GMDC Ground, Ahmedabad';
      let dateText = '19 - 21 December 2026';

      if (/surat/i.test(rawName)) {
        city = 'Surat';
        venue = 'Vanita Vishram Ground, Surat';
        dateText = '06 - 08 February 2027';
      } else if (/rajkot/i.test(rawName)) {
        city = 'Rajkot';
        venue = 'NSIC Ground / Auto Cluster, Rajkot';
        dateText = '15 - 18 December 2027';
      } else if (/vadodara/i.test(rawName)) {
        city = 'Vadodara';
        venue = 'Navlakhi Ground, Vadodara';
        dateText = '02 - 05 January 2028';
      }

      const formattedName = rawName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      if (seenNames.has(formattedName.toLowerCase())) return;
      seenNames.add(formattedName.toLowerCase());

      const { startDate, endDate } = this.parseDateRange(dateText);
      const sourceUrl = this.resolveUrl(href, baseUrl);

      results.push({
        name: formattedName,
        organizer: '2Way Advertising (EngiExpo)',
        industry: 'Industrial Engineering, Automation & Machine Tools',
        startDate,
        endDate,
        venue,
        city,
        state: 'Gujarat',
        country: 'India',
        description: `${formattedName} - Premier industrial engineering and machinery exhibition in ${city}, Gujarat, India.`,
        registrationUrl: sourceUrl,
        sourceUrl,
        rawData: {
          slug: rawSlug,
          city,
          estimatedDates: dateText,
        },
      });
    });

    return results;
  }
}
