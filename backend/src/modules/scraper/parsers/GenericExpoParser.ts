import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class GenericExpoParser extends BaseParser {
  readonly key = 'generic';
  readonly name = 'Configurable & Heuristic Generic Parser';
  readonly description = 'Adaptive parser that supports custom CSS selectors or automated heuristic extraction for any website';

  canHandle(_url: string): boolean {
    return true; // Fallback handler for any URL
  }

  async parse(html: string, baseUrl: string, customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];

    // 1. If user provided a specific item selector
    if (customConfig && customConfig.itemSelector && customConfig.itemSelector.trim().length > 0) {
      $(customConfig.itemSelector).each((_, elem) => {
        const $el = $(elem);

        // Name
        let name = '';
        if (customConfig.nameSelector) {
          name = this.cleanText($el.find(customConfig.nameSelector).text());
        }
        if (!name) {
          name = this.cleanText($el.find('h1, h2, h3, h4, .title, a').first().text());
        }
        if (!name || name.length < 2) return;

        // Detail / Source URL
        let sourceUrl = baseUrl;
        let linkHref = '';
        if (customConfig.detailLinkSelector) {
          linkHref = $el.find(customConfig.detailLinkSelector).attr('href') || '';
        } else {
          linkHref = $el.find('a').attr('href') || '';
        }
        if (linkHref) {
          sourceUrl = this.resolveUrl(linkHref, baseUrl);
        }

        // Dates
        let dateText = '';
        if (customConfig.startDateSelector) {
          dateText = this.cleanText($el.find(customConfig.startDateSelector).text());
        } else {
          dateText = this.cleanText($el.find('.date, time, .time, [class*="date"]').text());
        }
        const { startDate, endDate } = this.parseDateRange(dateText);

        // Venue & Location
        const venue = customConfig.venueSelector
          ? this.cleanText($el.find(customConfig.venueSelector).text())
          : this.cleanText($el.find('.venue, [class*="venue"]').text()) || 'Convention Center';

        const city = customConfig.citySelector
          ? this.cleanText($el.find(customConfig.citySelector).text())
          : this.cleanText($el.find('.city, [class*="city"]').text()) || 'Global';

        const country = customConfig.countrySelector
          ? this.cleanText($el.find(customConfig.countrySelector).text())
          : this.cleanText($el.find('.country, [class*="country"]').text()) || 'International';

        const organizer = customConfig.organizerSelector
          ? this.cleanText($el.find(customConfig.organizerSelector).text())
          : this.cleanText($el.find('.organizer, [class*="organizer"]').text()) || 'Expo Host';

        const industry = customConfig.industrySelector
          ? this.cleanText($el.find(customConfig.industrySelector).text())
          : this.cleanText($el.find('.category, .industry, [class*="category"]').text()) || 'Business Expo';

        const description = customConfig.descriptionSelector
          ? this.cleanText($el.find(customConfig.descriptionSelector).text())
          : this.cleanText($el.find('.description, .desc, p').text()) || `${name} business trade exhibition.`;

        const registrationUrl = customConfig.registrationUrlSelector
          ? this.resolveUrl($el.find(customConfig.registrationUrlSelector).attr('href'), baseUrl)
          : sourceUrl;

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
          registrationUrl,
          sourceUrl,
          rawData: {
            extractedWith: 'custom-selectors',
            dateText,
          },
        });
      });

      if (results.length > 0) return results;
    }

    // 2. Intelligent Heuristic Extraction for any standard expo website
    const candidateSelectors = [
      'table tbody tr',
      'table tr',
      'div[class*="event"]',
      'div[class*="expo"]',
      'div[class*="fair"]',
      'div[class*="card"]',
      'article',
      'li[class*="item"]',
      '.listing-item',
      '.conference-item',
    ];

    for (const selector of candidateSelectors) {
      const items = $(selector);
      if (items.length >= 2 && items.length <= 150) {
        items.each((_, elem) => {
          const $el = $(elem);
          // Skip headers or navigation
          if ($el.find('th').length > 0 || $el.is('nav') || $el.is('footer')) return;

          // Find title / link
          const link = $el.find('a[href]').first();
          const title = this.cleanText(
            $el.find('h1, h2, h3, h4, .title, strong').first().text() || link.text()
          );

          if (!title || title.length < 3 || title.toLowerCase().includes('copyright') || title.toLowerCase().includes('subscribe')) {
            return;
          }

          const href = link.attr('href');
          const sourceUrl = this.resolveUrl(href, baseUrl);

          // Find date strings in text or time tag
          const timeTag = $el.find('time').text();
          const fullText = $el.text();
          const dateMatch = fullText.match(/\b(?:\d{1,2}[-–/]\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?,?\s+\d{4}|\d{1,2}[./-]\d{1,2}[./-]\d{4})\b/i);

          const dateRaw = timeTag || (dateMatch ? dateMatch[0] : '');
          const { startDate, endDate } = this.parseDateRange(dateRaw);

          // Find location / venue clues
          const locMatch = fullText.match(/\b(?:in\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z][a-zA-Z\s]+)?)|([A-Z][a-zA-Z]+,\s*[A-Z]{2,}))\b/);
          const location = locMatch ? locMatch[0].replace(/^in\s+/i, '').trim() : 'Global';

          let city = location;
          let country = 'International';
          if (location.includes(',')) {
            const parts = location.split(',').map((p) => p.trim());
            city = parts[0];
            country = parts[1];
          }

          results.push({
            name: title,
            organizer: 'Business Expo Network',
            industry: 'Trade & Commerce',
            startDate,
            endDate,
            venue: `${city} Exhibition Center`,
            city,
            state: '',
            country,
            description: this.cleanText($el.find('p').first().text()) || `${title} international business trade expo.`,
            registrationUrl: sourceUrl,
            sourceUrl,
            rawData: {
              heuristicSelector: selector,
              dateRaw,
            },
          });
        });

        if (results.length > 0) break;
      }
    }

    return results;
  }
}
