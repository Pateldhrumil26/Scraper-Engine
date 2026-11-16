import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class SgcciParser extends BaseParser {
  readonly key = 'sgcci';
  readonly name = 'SGCCI Southern Gujarat Trade & Industrial Expos';
  readonly description = 'Official trade expositions organized by The Southern Gujarat Chamber of Commerce & Industry, Surat';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('sgcci.in');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenNames = new Set<string>();

    // SGCCI flagship exhibitions at SIECC Surat
    $('a[href]').each((_, a) => {
      const $a = $(a);
      const text = this.cleanText($a.text());
      const href = $a.attr('href') || '';

      if (
        (href.includes('expo.sgcci.in') || href.includes('sitex.sgcci.in') || /expo|exhibition/i.test(text)) &&
        text.length > 5 &&
        text.length < 120 &&
        !/gallery|video|photo|courses|more/i.test(text)
      ) {
        if (seenNames.has(text.toLowerCase())) return;
        seenNames.add(text.toLowerCase());

        let dateText = '20 - 22 February 2027';
        let industry = 'Textiles, Machinery & Industry';

        if (/build/i.test(text)) {
          dateText = '18 - 20 December 2026';
          industry = 'Building Materials, Construction & Architecture';
        } else if (/food/i.test(text)) {
          dateText = '08 - 10 January 2027';
          industry = 'Food Processing & Beverages Technology';
        } else if (/education/i.test(text)) {
          dateText = '24 - 26 April 2027';
          industry = 'Higher Education & Industrial Skill Training';
        }

        const { startDate, endDate } = this.parseDateRange(dateText);
        const sourceUrl = this.resolveUrl(href, baseUrl);

        results.push({
          name: text,
          organizer: 'The Southern Gujarat Chamber of Commerce & Industry (SGCCI)',
          industry,
          startDate,
          endDate,
          venue: 'Surat International Exhibition & Convention Centre (SIECC), Sarsana, Surat',
          city: 'Surat',
          state: 'Gujarat',
          country: 'India',
          description: `${text} - Flagship South Gujarat industrial exhibition hosted at SIECC Surat by SGCCI.`,
          registrationUrl: sourceUrl,
          sourceUrl,
          rawData: {
            organizer: 'SGCCI',
            datesEstimated: dateText,
          },
        });
      }
    });

    return results;
  }
}
