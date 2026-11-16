import { IExpoParser } from './interfaces/expo-parser.interface';
import { EventsEyeParser } from './parsers/EventsEyeParser';
import { TradeFairDatesParser } from './parsers/TradeFairDatesParser';
import { BizTradeShowsParser } from './parsers/BizTradeShowsParser';
import { AllEventsParser } from './parsers/AllEventsParser';
import { ExpoStandZoneParser } from './parsers/ExpoStandZoneParser';
import { GenericExpoParser } from './parsers/GenericExpoParser';

class ParserRegistry {
  private parsers: Map<string, IExpoParser> = new Map();
  private genericParser: IExpoParser;

  constructor() {
    this.genericParser = new GenericExpoParser();

    // Register all default website-specific parsers
    this.register(new AllEventsParser());
    this.register(new ExpoStandZoneParser());
    this.register(new EventsEyeParser());
    this.register(new TradeFairDatesParser());
    this.register(new BizTradeShowsParser());
    this.register(this.genericParser);
  }

  register(parser: IExpoParser): void {
    this.parsers.set(parser.key.toLowerCase(), parser);
  }

  get(key: string): IExpoParser {
    return this.parsers.get(key.toLowerCase()) || this.genericParser;
  }

  getAll(): IExpoParser[] {
    return Array.from(this.parsers.values());
  }

  /**
   * Automatically select best parser based on URL domain
   */
  resolveForUrl(url: string, preferredKey?: string): IExpoParser {
    if (preferredKey && preferredKey !== 'auto' && this.parsers.has(preferredKey.toLowerCase())) {
      return this.parsers.get(preferredKey.toLowerCase())!;
    }

    for (const parser of this.parsers.values()) {
      if (parser.key !== 'generic' && parser.canHandle(url)) {
        return parser;
      }
    }

    return this.genericParser;
  }
}

export const parserRegistry = new ParserRegistry();
