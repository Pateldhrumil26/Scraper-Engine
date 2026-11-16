import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class TradeFairDatesParser extends BaseParser {
  readonly key = 'tradefairdates';
  readonly name = 'TradeFairDates World Directory';
  readonly description = 'Parser for TradeFairDates.com business trade fairs and exhibitions';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('tradefairdates.com');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenNames = new Set<string>();

    // Strategy 1: Find all trade fair direct links with -M pattern (TradeFairDates standard identifier)
    $('a[href*="-M"]').each((_, elem) => {
      const $a = $(elem);
      const name = this.cleanText($a.text());
      if (!name || name.length < 3 || seenNames.has(name.toLowerCase())) return;
      seenNames.add(name.toLowerCase());

      const relHref = $a.attr('href') || '';
      const sourceUrl = this.resolveUrl(relHref, baseUrl);

      // Extract City from URL path if available: "/Fair-Name-M123/City+Name.html"
      let city = 'Global';
      const urlCityMatch = relHref.match(/-M\d+\/([^+./]+(?:\+[^+./]+)*)\.html/i);
      if (urlCityMatch) {
        city = decodeURIComponent(urlCityMatch[1].replace(/\+/g, ' '));
      }

      // Look in parent container / row for date and venue details
      const $container = $a.closest('tr, div.content_messe, div.row, li, div');
      const containerText = this.cleanText($container.text());

      // Find venue if linked with -ZS
      const venueLink = $container.find('a[href*="-ZS"]').first();
      const venue = this.cleanText(venueLink.text()) || `${city} Exhibition Center`;

      // Extract dates
      const dateText = this.cleanText(
        $container.find('.datum, .date, [class*="date"]').first().text()
      );
      const { startDate, endDate } = this.parseDateRange(dateText || containerText);

      // Industry & Organizer
      const industry = this.cleanText(
        $container.find('.branche, .category').text()
      ) || 'Trade & Commerce Expo';

      const organizer = this.cleanText(
        $container.find('.veranstalter, .organizer').text()
      ) || 'TradeFairDates Network';

      const description = this.cleanText(
        $container.find('.desc, p').text()
      ) || `${name} - International commercial trade fair in ${city}.`;

      results.push({
        name,
        organizer,
        industry,
        startDate,
        endDate,
        venue,
        city,
        state: '',
        country: 'International',
        description,
        registrationUrl: sourceUrl,
        sourceUrl,
        rawData: {
          originalDateText: dateText,
          extractedCity: city,
        },
      });
    });

    // Strategy 2: If no -M links found, fallback to standard listing cards/rows
    if (results.length === 0) {
      $('div.content_messe, tr.messe_row, div.messe_box').each((_, elem) => {
        const $el = $(elem);
        const titleEl = $el.find('h2 a, h3 a, a.fairname, a').first();
        const name = this.cleanText(titleEl.text());
        if (!name || name.length < 3) return;

        const relUrl = titleEl.attr('href') || '';
        const sourceUrl = this.resolveUrl(relUrl, baseUrl);
        const dateText = this.cleanText($el.find('.datum, .date').text());
        const { startDate, endDate } = this.parseDateRange(dateText);

        results.push({
          name,
          organizer: 'Trade Show Organizer',
          industry: 'Business Expo',
          startDate,
          endDate,
          venue: 'Trade Center',
          city: 'Global',
          state: '',
          country: 'International',
          description: `${name} exhibition.`,
          registrationUrl: sourceUrl,
          sourceUrl,
        });
      });
    }

    return results;
  }
}
