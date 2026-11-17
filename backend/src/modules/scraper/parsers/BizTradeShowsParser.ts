import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class BizTradeShowsParser extends BaseParser {
  readonly key = 'biztradeshows';
  readonly name = 'BizTradeShows / Trade Directory';
  readonly description = 'Parser for BizTradeShows and business trade exhibition directories';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('biztradeshows.com');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];

    // BizTradeShows event blocks
    $('div.event-box, div.listing-row, div.trade-show-card, tr.event-row, div.event_item').each((_, elem) => {
      const $el = $(elem);

      const titleEl = $el.find('h2 a, h3 a, a.event-title, a.title').first();
      const name = this.cleanText(titleEl.text());
      if (!name || name.length < 3) return;

      const relUrl = titleEl.attr('href') || '';
      const sourceUrl = this.resolveUrl(relUrl, baseUrl);

      const dateText = this.cleanText($el.find('.date, .event-date, span.date-text').text());
      const { startDate, endDate } = this.parseDateRange(dateText);

      const venue = this.cleanText($el.find('.venue, .event-venue').text()) || 'Trade Center';
      const cityText = this.cleanText($el.find('.city, .location').text());
      const countryText = this.cleanText($el.find('.country').text());

      let city = cityText || 'Global';
      let country = countryText || 'International';

      if (cityText.includes(',')) {
        const parts = cityText.split(',').map((p) => p.trim());
        city = parts[0] || 'Global';
        country = parts[1] || country;
      }

      const organizer = this.cleanText($el.find('.organizer, .organized-by').text()) || 'BizTrade Organizer';
      const industry = this.cleanText($el.find('.industry, .category, .sector').text()) || 'Business Expo';
      const description = this.cleanText($el.find('.desc, .description, p').text()) || `${name} business trade expo.`;

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
        },
      });
    });

    return results;
  }
}
