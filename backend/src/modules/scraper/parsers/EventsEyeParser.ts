import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class EventsEyeParser extends BaseParser {
  readonly key = 'eventseye';
  readonly name = 'EventsEye Global Trade Shows';
  readonly description = 'Parser for EventsEye.com international business exhibitions and trade fairs';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('eventseye.com');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];

    // EventsEye listing rows inside table.tradeshows or table with trade show data
    $('table.tradeshows tr, table.fair_list tr').each((_, row) => {
      const $row = $(row);
      // Skip header rows
      if ($row.find('th').length > 0 || $row.hasClass('header')) {
        return;
      }

      const fairLink = $row.find('a[href*="/fairs/"], a[href*="fair_"]').first();
      const name = this.cleanText(fairLink.text() || $row.find('td:nth-child(1)').text());

      if (!name || name.length < 3) return;

      const relativeUrl = fairLink.attr('href') || '';
      const sourceUrl = this.resolveUrl(relativeUrl, baseUrl);

      // Extract dates (usually in 2nd column or under specific span)
      const dateText = this.cleanText(
        $row.find('.dates, td:nth-child(2), td.text_date').text()
      );
      const { startDate, endDate } = this.parseDateRange(dateText);

      // Location column (City, Country)
      const locationText = this.cleanText(
        $row.find('.location, td:nth-child(3), td.text_location').text()
      );
      let city = 'Global';
      let country = 'International';
      if (locationText.includes(',')) {
        const parts = locationText.split(',').map((p) => p.trim());
        city = parts[0] || 'Global';
        country = parts[1] || 'International';
      } else if (locationText) {
        city = locationText;
      }

      // Industry / category / description
      const industry = this.cleanText(
        $row.find('.category, td:nth-child(4), td.text_category').text()
      ) || 'Trade Shows & Business';

      const description = this.cleanText(
        $row.find('.description, td:nth-child(5)').text()
      ) || `${name} - International business expo held in ${city}, ${country}.`;

      const organizer = this.cleanText(
        $row.find('.organizer, .organisateur').text()
      ) || 'EventsEye Directory';

      results.push({
        name,
        organizer,
        industry,
        startDate,
        endDate,
        venue: `${city} Exhibition Center`,
        city,
        state: '',
        country,
        description,
        registrationUrl: sourceUrl,
        sourceUrl,
        rawData: {
          originalDateText: dateText,
          originalLocation: locationText,
        },
      });
    });

    // Fallback: If table.tradeshows was not used, check general trade fair cards / links
    if (results.length === 0) {
      $('div.fair-item, div.event-item, article.trade-show').each((_, elem) => {
        const $el = $(elem);
        const name = this.cleanText($el.find('h2, h3, .fair-title, .title').first().text());
        if (!name || name.length < 3) return;

        const link = $el.find('a').first().attr('href');
        const sourceUrl = this.resolveUrl(link, baseUrl);
        const dateText = this.cleanText($el.find('.date, .fair-date, time').text());
        const { startDate, endDate } = this.parseDateRange(dateText);
        const loc = this.cleanText($el.find('.location, .venue, .city').text());

        results.push({
          name,
          organizer: 'Trade Show Organizer',
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
