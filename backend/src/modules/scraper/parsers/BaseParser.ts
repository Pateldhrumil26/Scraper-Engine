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
      let part1 = parts[0];
      let part2 = parts[1];

      // Extract year from part2 if part1 lacks a year (e.g. "15 Nov" & "18 Nov 2026" or "15" & "18 Nov 2026")
      const yearMatchPart2 = part2.match(/\b(\d{4})\b/);
      const yearPart2 = yearMatchPart2 ? yearMatchPart2[1] : null;

      // Extract month from part2 if part1 lacks a month (e.g. "15" & "18 Nov 2026")
      const monthMatchPart2 = part2.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i);
      const monthPart2 = monthMatchPart2 ? monthMatchPart2[1] : null;

      // Format: "15 - 18 Oct 2026" -> part1 = "15 Oct 2026"
      if (/^\d{1,2}$/.test(part1) && monthPart2 && yearPart2) {
        part1 = `${part1} ${monthPart2} ${yearPart2}`;
      } else if (!/\b\d{4}\b/.test(part1) && yearPart2) {
        // Format: "15 Nov - 18 Nov 2026" or "Nov 15 - Nov 18, 2026"
        part1 = `${part1} ${yearPart2}`;
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
