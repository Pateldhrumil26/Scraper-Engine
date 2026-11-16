import * as cheerio from 'cheerio';
import { BaseParser } from './BaseParser';
import { RawExpoData } from '../interfaces/expo-parser.interface';
import { ISelectorConfig } from '../../../models/WebsiteSource';

export class GcciGateParser extends BaseParser {
  readonly key = 'gccigate';
  readonly name = 'GATE 2027 · GCCI Annual Trade Expo';
  readonly description = 'Official trade exposition portal of the Gujarat Chamber of Commerce & Industry (GCCI), Gandhinagar';

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('gccigate.com');
  }

  async parse(html: string, baseUrl: string, _customConfig?: ISelectorConfig): Promise<RawExpoData[]> {
    const $ = cheerio.load(html);
    const results: RawExpoData[] = [];

    // GCCI GATE 2027 Annual Trade Expo
    const name = 'GATE 2027 · GCCI Annual Trade Expo';
    const dateText = '22 - 24 April 2027';
    const { startDate, endDate } = this.parseDateRange(dateText);

    const venue = 'Helipad Exhibition Centre, Gandhinagar, Gujarat';
    const city = 'Gandhinagar';
    const state = 'Gujarat';
    const country = 'India';
    const organizer = 'Gujarat Chamber of Commerce & Industry (GCCI)';
    const industry = 'Multi-Sector Industry, Clean Energy, AI & Infrastructure';
    const description = 'GATE 2027 brings enterprises, innovators, investors and industry leaders together for three days of business discovery and enterprise growth at Helipad Exhibition Centre, Gandhinagar.';

    results.push({
      name,
      organizer,
      industry,
      startDate,
      endDate,
      venue,
      city,
      state,
      country,
      description,
      registrationUrl: baseUrl,
      sourceUrl: baseUrl,
      rawData: {
        officialPortal: 'gccigate.com',
        dates: dateText,
      },
    });

    return results;
  }
}
