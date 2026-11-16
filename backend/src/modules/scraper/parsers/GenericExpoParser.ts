import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class GenericExpoParser extends BaseParser {
  readonly key = 'generic';
  readonly name = 'Configurable & Heuristic Generic Parser';
  readonly description = 'Universal adaptive parser supporting JSON-LD Schema, custom CSS selectors, Next.js SSR streams, and automated heuristic DOM extraction';

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
    // STRATEGY 2: Universal Schema.org JSON-LD Event & ItemList Detection
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
            if (
              obj['@type'] === 'Event' ||
              obj['@type'] === 'BusinessEvent' ||
              obj['@type'] === 'ExhibitionEvent' ||
              obj.startDate ||
              (obj['@type'] === 'ListItem' && obj.name && (obj.url || typeof obj.name === 'string'))
            ) {
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

          const startDate = ev.startDate ? new Date(ev.startDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
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

          const organizer = this.cleanText(ev.organizer?.name) || 'Event Host';
          const description = this.cleanText(ev.description) || `${name} business event in ${city}.`;
          const detailUrl = ev.url ? this.resolveUrl(ev.url, baseUrl) : baseUrl;

          results.push({
            name,
            organizer,
            industry: 'Business Expo',
            startDate,
            endDate,
            venue,
            city,
            state,
            country,
            description,
            registrationUrl: detailUrl,
            sourceUrl: detailUrl,
            rawData: {
              extractedVia: 'schema.org-jsonld',
              schemaType: ev['@type'],
            },
          });
        }
      } catch {
        // Ignore invalid JSON-LD blocks
      }
    });

    if (results.length > 0) return results;

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 2.5: Next.js App Router SSR Hydration Stream Check
    // ─────────────────────────────────────────────────────────────
    $('script').each((_, el) => {
      const content = $(el).html() || '';
      if (!content.includes('initialItems')) return;

      const chunks: string[] = [];
      const selfObj = {
        __next_f: {
          push: (arr: any[]) => {
            if (arr && arr[1] && typeof arr[1] === 'string') chunks.push(arr[1]);
          },
        },
      };

      try {
        const fn = new Function('self', content);
        fn(selfObj);

        for (const chunk of chunks) {
          if (!chunk.includes('initialItems')) continue;
          const match = chunk.match(/"initialItems":(\[.*?\])(?:,"|\})/);
          if (match) {
            const rawList = JSON.parse(match[1]);
            for (const raw of rawList) {
              const name = this.cleanText(raw.name);
              if (!name || seenNames.has(name.toLowerCase())) continue;
              seenNames.add(name.toLowerCase());

              let startDate = new Date();
              let endDate = new Date();
              if (raw.time) {
                const parts = raw.time.split('-');
                if (parts.length === 2) {
                  const sStr = parts[0].replace(/\./g, '-');
                  startDate = new Date(sStr);
                  const year = sStr.split('-')[0];
                  const eStr = `${year}-${parts[1].replace(/\./g, '-')}`;
                  endDate = new Date(eStr);
                }
              }

              const detailUrl = raw.publicId
                ? this.resolveUrl(`/en/detail/${raw.publicId}`, baseUrl)
                : baseUrl;

              results.push({
                name,
                organizer: raw.organizerRoleText || 'Directory Organizer',
                industry: raw.category || 'Business Exhibition',
                startDate,
                endDate,
                venue: raw.venueName || `${raw.city || 'Convention'} Center`,
                city: raw.city || 'Global',
                state: '',
                country: raw.country || 'International',
                description: `${name} - Exhibition in ${raw.city || ''}, ${raw.country || ''}.`,
                registrationUrl: detailUrl,
                sourceUrl: detailUrl,
                rawData: {
                  extractedVia: 'nextjs-ssr-initialItems',
                  raw,
                },
              });
            }
          }
        }
      } catch {
        // Continue to other strategies
      }
    });

    if (results.length > 0) return results;

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 3: Heuristic DOM Extraction (Headings + Date Detection)
    // ─────────────────────────────────────────────────────────────
    $('h1, h2, h3, h4').each((_, heading) => {
      const $h = $(heading);
      const name = this.cleanText($h.text());

      if (
        !name ||
        name.length < 3 ||
        name.length > 150 ||
        /^(search|filter|menu|category|categories|about|contact|subscribe|featured|upcoming|all rights|popular)/i.test(name) ||
        seenNames.has(name.toLowerCase())
      ) {
        return;
      }

      const $container = $h.closest('div, article, section, li').filter((_, el) => {
        const text = $(el).text();
        return text.length > name.length && text.length < 1500;
      });

      if ($container.length === 0) return;

      const containerText = $container.text();
      const dateMatch = containerText.match(
        /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?,?\s+\d{4}\b/i
      ) || containerText.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{4}\b/);

      if (!dateMatch) return;

      seenNames.add(name.toLowerCase());
      const { startDate, endDate } = this.parseDateRange(dateMatch[0]);

      const linkEl = $container.find('a[href]').first();
      const relHref = linkEl.attr('href') || $h.find('a').attr('href') || '';
      const sourceUrl = this.resolveUrl(relHref, baseUrl);

      results.push({
        name,
        organizer: 'Trade Show Network',
        industry: 'Business Expo',
        startDate,
        endDate,
        venue: 'Exhibition Hall',
        city: 'Global',
        state: '',
        country: 'International',
        description: this.cleanText($container.find('p').first().text()) || `${name} - Business event`,
        registrationUrl: sourceUrl,
        sourceUrl,
        rawData: {
          extractedVia: 'heading-heuristic',
          dateRaw: dateMatch[0],
        },
      });
    });

    return results;
  }
}
