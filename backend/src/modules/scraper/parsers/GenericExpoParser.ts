import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class GenericExpoParser extends BaseParser {
  readonly key = 'generic';
  readonly name = 'Configurable & Heuristic Generic Parser';
  readonly description = 'Universal adaptive parser supporting JSON-LD Schema, custom CSS selectors, and automated heuristic DOM extraction';

  canHandle(_url: string): boolean {
    return true; // Fallback handler for any URL
  }

  async parse(html: string, baseUrl: string, customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];
    const seenNames = new Set<string>();

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 1: Check User-Configured Custom Selectors
    // ─────────────────────────────────────────────────────────────
    if (customConfig && customConfig.itemSelector && customConfig.itemSelector.trim().length > 0) {
      $(customConfig.itemSelector).each((_, elem) => {
        const $el = $(elem);

        let name = '';
        if (customConfig.nameSelector) {
          name = this.cleanText($el.find(customConfig.nameSelector).text());
        }
        if (!name) {
          name = this.cleanText($el.find('h1, h2, h3, h4, .title, a').first().text());
        }
        if (!name || name.length < 2 || seenNames.has(name.toLowerCase())) return;
        seenNames.add(name.toLowerCase());

        let sourceUrl = baseUrl;
        let linkHref = '';
        if (customConfig.detailLinkSelector) {
          linkHref = $el.find(customConfig.detailLinkSelector).attr('href') || '';
        } else {
          linkHref = $el.find('a[href]').attr('href') || '';
        }
        if (linkHref) {
          sourceUrl = this.resolveUrl(linkHref, baseUrl);
        }

        let dateText = '';
        if (customConfig.startDateSelector) {
          dateText = this.cleanText($el.find(customConfig.startDateSelector).text());
        } else {
          dateText = this.cleanText($el.find('.date, time, .time, [class*="date"]').text());
        }
        const { startDate, endDate } = this.parseDateRange(dateText);

        const venue = customConfig.venueSelector
          ? this.cleanText($el.find(customConfig.venueSelector).text())
          : this.cleanText($el.find('.venue, [class*="venue"]').text()) || 'Exhibition Center';

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
          : this.cleanText($el.find('.description, .desc, p').text()) || `${name} exhibition in ${city}.`;

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

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 2: Universal Schema.org JSON-LD Event Detection
    // Modern expo websites often embed structured Schema.org events
    // ─────────────────────────────────────────────────────────────
    $('script[type="application/ld+json"]').each((_, scriptEl) => {
      try {
        const text = $(scriptEl).html() || '';
        const parsed = JSON.parse(text);

        const candidateEvents: any[] = [];
        const extractEvents = (obj: any) => {
          if (!obj) return;
          if (Array.isArray(obj)) {
            obj.forEach(extractEvents);
          } else if (typeof obj === 'object') {
            if (obj['@type'] === 'Event' || obj['@type'] === 'BusinessEvent' || obj['@type'] === 'ExhibitionEvent' || obj.startDate) {
              candidateEvents.push(obj);
            }
            if (obj.itemListElement && Array.isArray(obj.itemListElement)) {
              obj.itemListElement.forEach((item: any) => extractEvents(item.item || item));
            }
          }
        };
        extractEvents(parsed);

        for (const ev of candidateEvents) {
          const name = this.cleanText(ev.name);
          if (!name || name.length < 3 || seenNames.has(name.toLowerCase())) continue;
          seenNames.add(name.toLowerCase());

          const startDate = ev.startDate ? new Date(ev.startDate) : new Date();
          let endDate = ev.endDate ? new Date(ev.endDate) : new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
          if (endDate.getTime() < startDate.getTime()) {
            endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
          }

          let venue = 'Exhibition Center';
          let city = 'Global';
          let state = '';
          let country = 'International';

          if (ev.location) {
            venue = this.cleanText(ev.location.name) || venue;
            if (ev.location.address) {
              const a = ev.location.address;
              if (typeof a === 'string') {
                city = a;
              } else if (typeof a === 'object') {
                city = this.cleanText(a.addressLocality) || city;
                state = this.cleanText(a.addressRegion) || state;
                country = this.cleanText(a.addressCountry) || country;
              }
            }
          }

          const organizer = this.cleanText(ev.organizer?.name) || 'Trade Expo Network';
          const description = this.cleanText(ev.description) || `${name} trade expo.`;
          const sourceUrl = ev.url ? this.resolveUrl(ev.url, baseUrl) : baseUrl;

          results.push({
            name,
            organizer,
            industry: 'Business Expo & Trade Show',
            startDate,
            endDate,
            venue,
            city,
            state,
            country,
            description,
            registrationUrl: sourceUrl,
            sourceUrl,
            rawData: {
              extractedVia: 'json-ld',
            },
          });
        }
      } catch {
        // Continue to next script
      }
    });

    if (results.length > 0) return results;

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 3: Heading & Card Anchor Heuristic
    // Finds headings inside cards/containers with date and link
    // ─────────────────────────────────────────────────────────────
    $('h2, h3, h4').each((_, hTag) => {
      const $h = $(hTag);
      const title = this.cleanText($h.text());

      // Filter out non-event headings (short or generic terms)
      if (
        !title ||
        title.length < 4 ||
        title.length > 150 ||
        seenNames.has(title.toLowerCase()) ||
        /^(contact|about|privacy|terms|menu|navigation|features|categories|sponsors|upcoming|recent|login|signup|home|subscribe|faqs?|300\+|12\.7m)$/i.test(title)
      ) {
        return;
      }

      // Find surrounding card container (walk up to 4 levels)
      const $card = $h.closest('div.card, div[class*="card"], div.rounded, div.shadow, div.flex, article, li, tr');
      if ($card.length === 0) return;

      const cardText = this.cleanText($card.text());

      // Look for a date pattern inside the card text
      const dateMatch = cardText.match(/\b(?:\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:[-–to]+\s*\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)?,?\s+\d{4}|\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})\b/i);

      // If card has a date OR a detail link with "fair", "expo", "show", "event"
      const linkEl = $card.find('a[href]').first();
      const href = linkEl.attr('href') || $h.find('a').attr('href') || '';

      if (dateMatch || (href && /(?:expo|fair|show|event|tradeshow)/i.test(href))) {
        seenNames.add(title.toLowerCase());
        const sourceUrl = this.resolveUrl(href, baseUrl);

        const dateRaw = dateMatch ? dateMatch[0] : '';
        const { startDate, endDate } = this.parseDateRange(dateRaw);

        // Location clue extraction
        let city = 'Global';
        let country = 'International';
        const locMatch = cardText.match(/\b([A-Z][a-zA-Z\s]{2,20}),\s*([A-Z][a-zA-Z\s]{2,20})\b/);
        if (locMatch) {
          city = locMatch[1].trim();
          country = locMatch[2].trim();
        }

        results.push({
          name: title,
          organizer: 'Trade Show Network',
          industry: 'Business Expo',
          startDate,
          endDate,
          venue: `${city} Exhibition Center`,
          city,
          state: '',
          country,
          description: this.cleanText($card.find('p').first().text()) || `${title} trade expo in ${city}.`,
          registrationUrl: sourceUrl,
          sourceUrl,
          rawData: {
            extractedVia: 'heading-card-heuristic',
            dateRaw,
          },
        });
      }
    });

    return results;
  }
}
