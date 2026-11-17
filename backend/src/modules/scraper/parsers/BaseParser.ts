import axios, { AxiosRequestConfig } from 'axios';
import { IExpoParser, RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';
import { config } from '../../../config/env';

export abstract class BaseParser implements IExpoParser {
  abstract readonly key: string;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract canHandle(url: string): boolean;
  abstract parse(html: string, baseUrl: string, customConfig?: ISelectorConfig): Promise<RawExpoData[]>;

  /**
   * Safe HTTP GET with proper headers, timeout, and exponential backoff retry loop
   */
  async fetchHtml(url: string, extraHeaders?: Record<string, string>, maxRetries = 3): Promise<string> {
    const timeoutMs = config.requestTimeoutMs || 15000;
    const requestConfig: AxiosRequestConfig = {
      headers: {
        'User-Agent': config.defaultUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...extraHeaders,
      },
      timeout: timeoutMs,
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400,
    };

    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const response = await axios.get(url, requestConfig);
        return response.data;
      } catch (err: any) {
        lastError = err;
        const status = err.response?.status;

        // Do not retry on permanent client errors (403 WAF, 404, 401)
        if (status === 403 || status === 404 || status === 401) {
          throw err;
        }

        if (attempt < maxRetries) {
          const delayMs = Math.min(6000, 1000 * Math.pow(2, attempt - 1));
          console.warn(`[BaseParser] Fetch attempt ${attempt} failed for ${url} (${err.message}). Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
  }

  /**
   * Helper to clean whitespace and strip control characters
   */
  cleanText(text?: string | null): string {
    if (!text) return '';
    return text
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Safely resolves a relative URL against a base URL
   */
  resolveUrl(href: string | undefined | null, baseUrl: string): string {
    if (!href) return baseUrl;
    try {
      return new URL(href, baseUrl).href;
    } catch {
      return href;
    }
  }

  /**
   * Universal Date Range Parser for Expo & Exhibition portals
   * Supports:
   * - "December 11, 2026 - December 13, 2026"
   * - "December 11 - 13, 2026" / "Dec 11-13, 2026"
   * - "Fri, Dec 11, 2026 - Sun, Dec 13, 2026"
   * - "11 - 13 Dec 2026" / "11-13 December 2026"
   * - "2026-12-11 - 2026-12-13"
   * - "11/12/2026 - 13/12/2026"
   * - Single date: "December 11, 2026"
   */
  parseDateRange(dateStr?: string | null): { startDate?: Date; endDate?: Date } {
    if (!dateStr || typeof dateStr !== 'string') {
      return { startDate: undefined, endDate: undefined };
    }

    const monthNamesRegex = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';

    // Strip out weekday prefixes (e.g. 'Fri,', 'Saturday,') and ordinal suffixes (1st, 2nd, 3rd, 11th)
    let cleaned = this.cleanText(dateStr)
      .replace(/\b(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)[,.]?\s*/gi, '')
      .replace(/(\d+)(?:st|nd|rd|th)\b/gi, '$1')
      .replace(/\s+(?:[-–—]|\bto\b)\s+/gi, ' - ')
      .replace(/(?<=[a-zA-Z0-9])\s*(?:–|—)\s*(?=[a-zA-Z0-9])/g, ' - ')
      .trim();

    // 1. Direct Pattern: Month Day - Day, Year (e.g. 'December 11 - 13, 2026' or 'Dec 11 - 13, 2026')
    const mDayDayYear = new RegExp('^(' + monthNamesRegex + ')\\s+(\\d{1,2})\\s*-\\s*(\\d{1,2}),?\\s+(\\d{4})$', 'i');
    const match1 = cleaned.match(mDayDayYear);
    if (match1) {
      const [, month, startDay, endDay, year] = match1;
      const s = new Date(`${month} ${startDay}, ${year} 09:00:00`);
      const e = new Date(`${month} ${endDay}, ${year} 18:00:00`);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return { startDate: s, endDate: e };
      }
    }

    // 2. Direct Pattern: Day - Day Month Year (e.g. '11 - 13 December 2026' or '11 - 13 Dec 2026')
    const dayDayMYear = new RegExp('^(\\d{1,2})\\s*-\\s*(\\d{1,2})\\s+(' + monthNamesRegex + '),?\\s+(\\d{4})$', 'i');
    const match2 = cleaned.match(dayDayMYear);
    if (match2) {
      const [, startDay, endDay, month, year] = match2;
      const s = new Date(`${startDay} ${month} ${year} 09:00:00`);
      const e = new Date(`${endDay} ${month} ${year} 18:00:00`);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return { startDate: s, endDate: e };
      }
    }

    // 3. ISO Range (e.g. '2026-12-11 - 2026-12-13')
    const isoMatch = cleaned.match(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      const s = new Date(isoMatch[1] + 'T09:00:00');
      const e = new Date(isoMatch[2] + 'T18:00:00');
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return { startDate: s, endDate: e };
      }
    }

    // 4. Slash / Dash formats: e.g. '11/12/2026 - 13/12/2026' or '11-12-2026 - 13-12-2026'
    const slashMatch = cleaned.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s*-\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (slashMatch) {
      const s = new Date(`${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}T09:00:00`);
      const e = new Date(`${slashMatch[6]}-${slashMatch[5].padStart(2, '0')}-${slashMatch[4].padStart(2, '0')}T18:00:00`);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return { startDate: s, endDate: e };
      }
    }

    // 5. General ' - ' split
    const parts = cleaned.split(' - ').map((s) => s.trim());
    if (parts.length >= 2) {
      let part1 = parts[0];
      let part2 = parts[1];

      const yearMatch1 = part1.match(/\b(\d{4})\b/);
      const yearMatch2 = part2.match(/\b(\d{4})\b/);
      const year = yearMatch2 ? yearMatch2[1] : (yearMatch1 ? yearMatch1[1] : null);

      const monthMatch1 = part1.match(new RegExp('\\b' + monthNamesRegex + '\\b', 'i'));
      const monthMatch2 = part2.match(new RegExp('\\b' + monthNamesRegex + '\\b', 'i'));

      // If part1 has month and part2 lacks month (e.g. 'December 11' & '13, 2026')
      if (monthMatch1 && !monthMatch2) {
        part2 = `${monthMatch1[1]} ${part2}`;
      }
      // If part2 has month and part1 lacks month (e.g. '11' & '13 December 2026')
      if (monthMatch2 && !monthMatch1) {
        part1 = `${part1} ${monthMatch2[1]}`;
      }

      // If part1 lacks year, borrow from part2
      if (!/\b\d{4}\b/.test(part1) && year) {
        part1 = `${part1} ${year}`;
      }
      // If part2 lacks year, borrow from part1
      if (!/\b\d{4}\b/.test(part2) && year) {
        part2 = `${part2} ${year}`;
      }

      const s = new Date(part1 + ' 09:00:00');
      const e = new Date(part2 + ' 18:00:00');
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return { startDate: s, endDate: e };
      }

      const s2 = new Date(part1);
      const e2 = new Date(part2);
      if (!isNaN(s2.getTime()) && !isNaN(e2.getTime())) {
        return { startDate: s2, endDate: e2 };
      }
    }

    // 6. Single date format: e.g. 'December 11, 2026'
    const singleParsed = new Date(cleaned + ' 09:00:00');
    if (!isNaN(singleParsed.getTime()) && singleParsed.getFullYear() > 2000) {
      const end = new Date(singleParsed.getTime() + 2 * 24 * 60 * 60 * 1000);
      return { startDate: singleParsed, endDate: end };
    }

    const singleFallback = new Date(cleaned);
    if (!isNaN(singleFallback.getTime()) && singleFallback.getFullYear() > 2000) {
      const end = new Date(singleFallback.getTime() + 2 * 24 * 60 * 60 * 1000);
      return { startDate: singleFallback, endDate: end };
    }

    // If completely unparseable, return undefined without injecting fake dates
    return { startDate: undefined, endDate: undefined };
  }
}
