import { IExpoParser } from './interfaces/expo-parser.interface';
import { LayerXGujaratParser } from './parsers/LayerXGujaratParser';
import { GcciGateParser } from './parsers/GcciGateParser';
import { EngiExpoParser } from './parsers/EngiExpoParser';
import { SgcciParser } from './parsers/SgcciParser';
import { AllEventsParser } from './parsers/AllEventsParser';
import { ExpoStandZoneParser } from './parsers/ExpoStandZoneParser';
import { TradeIndiaParser } from './parsers/TradeIndiaParser';
import { ExpoFinderParser } from './parsers/ExpoFinderParser';
import { EventsEyeParser } from './parsers/EventsEyeParser';
import { TradeFairDatesParser } from './parsers/TradeFairDatesParser';
import { BizTradeShowsParser } from './parsers/BizTradeShowsParser';
import { GenericExpoParser } from './parsers/GenericExpoParser';

class ParserRegistry {
  private parsers: Map<string, IExpoParser> = new Map();
  private genericParser: IExpoParser;

  constructor() {
    this.genericParser = new GenericExpoParser();

    // Register all default website-specific parsers
    // Gujarat Premier Parsers
    this.register(new LayerXGujaratParser());
    this.register(new GcciGateParser());
    this.register(new EngiExpoParser());
    this.register(new SgcciParser());
    this.register(new AllEventsParser());

    // National & Global Handlers
    this.register(new ExpoStandZoneParser());
    this.register(new TradeIndiaParser());
    this.register(new ExpoFinderParser());
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
   * Automatically select best parser based on URL domain and preferredKey
   */
  resolveForUrl(url: string, preferredKey?: string): IExpoParser {
    const normKey = preferredKey?.toLowerCase();

    // 1. If preferred parser specifically matches the domain, use it immediately
    if (normKey && normKey !== 'auto' && normKey !== 'generic' && this.parsers.has(normKey)) {
      const preferred = this.parsers.get(normKey)!;
      if (preferred.canHandle(url)) {
        return preferred;
      }
    }

    // 2. Auto-detect from domain: check all specialized parsers
    for (const parser of this.parsers.values()) {
      if (parser.key !== 'generic' && parser.canHandle(url)) {
        return parser;
      }
    }

    // 3. If explicit preferred parser was requested (even if canHandle returned false), use it
    if (normKey && normKey !== 'auto' && normKey !== 'generic' && this.parsers.has(normKey)) {
      return this.parsers.get(normKey)!;
    }

    // 4. Default to generic configurable & heuristic parser
    return this.genericParser;
  }
}

export const parserRegistry = new ParserRegistry();
