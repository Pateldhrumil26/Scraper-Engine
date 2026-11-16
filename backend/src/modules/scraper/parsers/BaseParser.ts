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
   * Safe HTTP GET with proper headers and timeout
   */
  async fetchHtml(url: string, extraHeaders?: Record<string, string>): Promise<string> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        'User-Agent': config.defaultUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...extraHeaders,
      },
      timeout: config.requestTimeoutMs,
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400,
    };

    const response = await axios.get(url, requestConfig);
    return response.data;
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
   * Parses various date range formats found on expo sites
   * Examples:
   * "15 - 18 Oct 2026"
   * "October 15 - 18, 2026"
   * "Oct 15, 2026 to Oct 18, 2026"
   * "2026-10-15 to 2026-10-18"
   * "15/10/2026 - 18/10/2026"
   */
  parseDateRange(dateStr?: string | null): { startDate: Date; endDate: Date } {
    const now = new Date();
    const fallbackStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week ahead
    const fallbackEnd = new Date(fallbackStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days event

    if (!dateStr) {
      return { startDate: fallbackStart, endDate: fallbackEnd };
    }

    const cleaned = this.cleanText(dateStr).replace(/\s*[-–—/to]+\s*/i, ' - ');

    // Try standard Date parsing directly if single date
    if (!cleaned.includes(' - ')) {
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        const end = new Date(parsed);
        end.setDate(end.getDate() + 2);
        return { startDate: parsed, endDate: end };
      }
    }

    const parts = cleaned.split(' - ').map((s) => s.trim());

    if (parts.length >= 2) {
      const part1 = parts[0];
      const part2 = parts[1];

      // Format: "15 - 18 Oct 2026"
      // part1 = "15", part2 = "18 Oct 2026"
      const dayOnlyRegex = /^\d{1,2}$/;
      if (dayOnlyRegex.test(part1)) {
        const monthYearMatch = part2.match(/([a-zA-Z]+|\d{1,2})[\s,]+(\d{4})/);
        if (monthYearMatch) {
          const startAttempt = new Date(`${part1} ${part2.substring(part2.indexOf(' '))}`);
          const endAttempt = new Date(part2);
          if (!isNaN(startAttempt.getTime()) && !isNaN(endAttempt.getTime())) {
            return { startDate: startAttempt, endDate: endAttempt };
          }
        }
      }

      // Format: "Oct 15 - 18, 2026"
      // part1 = "Oct 15", part2 = "18, 2026"
      const monthPrefixMatch = part1.match(/^([a-zA-Z]+)\s+(\d{1,2})$/i);
      if (monthPrefixMatch) {
        const month = monthPrefixMatch[1];
        const day1 = monthPrefixMatch[2];
        const yearMatch = part2.match(/(\d{4})/);
        const day2Match = part2.match(/^(\d{1,2})/);
        if (yearMatch && day2Match) {
          const year = yearMatch[1];
          const day2 = day2Match[1];
          const s = new Date(`${month} ${day1}, ${year}`);
          const e = new Date(`${month} ${day2}, ${year}`);
          if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
            return { startDate: s, endDate: e };
          }
        }
      }

      const s = new Date(part1);
      const e = new Date(part2);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return { startDate: s, endDate: e };
      }
    }

    // Regex extraction fallback for dates like "10/12/2026"
    const dateMatch = cleaned.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (dateMatch) {
      const parsed = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
      if (!isNaN(parsed.getTime())) {
        const end = new Date(parsed);
        end.setDate(end.getDate() + 2);
        return { startDate: parsed, endDate: end };
      }
    }

    return { startDate: fallbackStart, endDate: fallbackEnd };
  }
}
