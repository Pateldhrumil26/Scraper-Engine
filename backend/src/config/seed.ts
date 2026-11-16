import { WebsiteSource } from '../models/WebsiteSource';

export const seedDefaultSources = async (): Promise<void> => {
  try {
    const count = await WebsiteSource.countDocuments();
    if (count > 0) return;

    console.log('[Seed] Seeding initial verified website sources...');

    const defaultSources = [
      {
        name: 'TradeFairDates World Directory',
        url: 'https://www.tradefairdates.com',
        parserKey: 'tradefairdates',
        category: 'Business Trade Fairs',
        active: true,
        scheduleCron: '0 0 * * *',
        notes: 'Directory of international trade fairs, exhibitions, and expos.',
      },
      {
        name: 'ExpoStandZone Global Trade Shows',
        url: 'https://www.expostandzone.com/trade-shows/',
        parserKey: 'generic',
        category: 'International Expos & Conventions',
        active: true,
        scheduleCron: '0 2 * * *',
        notes: 'Worldwide business exhibitions, trade shows, and industry expos.',
      },
      {
        name: 'EventsEye International Directory',
        url: 'https://www.eventseye.com',
        parserKey: 'eventseye',
        category: 'Commercial Business Expos',
        active: true,
        scheduleCron: '0 4 * * *',
        notes: 'Commercial trade exhibitions and conventions portal.',
      },
    ];

    await WebsiteSource.insertMany(defaultSources);
    console.log(`[Seed] Seeded ${defaultSources.length} default website sources.`);
  } catch (err: any) {
    console.error('[Seed] Error seeding sources:', err.message);
  }
};
