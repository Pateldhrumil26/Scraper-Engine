import { WebsiteSource } from '../models/WebsiteSource';

export const seedDefaultSources = async (): Promise<void> => {
  try {
    const count = await WebsiteSource.countDocuments();
    if (count > 0) return;

    console.log('[Seed] Seeding Ahmedabad, Gandhinagar & Global expo sources...');

    const defaultSources = [
      {
        name: 'Ahmedabad Business & Trade Expos',
        url: 'https://allevents.in/ahmedabad/exhibitions',
        parserKey: 'allevents',
        category: 'Ahmedabad Trade Shows & Expos',
        active: true,
        scheduleCron: '0 0 * * *',
        notes: 'Live business exhibitions, industrial expos, and trade shows in Ahmedabad.',
      },
      {
        name: 'Gandhinagar Trade Fairs & Expos',
        url: 'https://allevents.in/gandhinagar/exhibitions',
        parserKey: 'allevents',
        category: 'Gandhinagar & Mahatma Mandir Expos',
        active: true,
        scheduleCron: '0 2 * * *',
        notes: 'Exhibitions and business conventions at Mahatma Mandir and Helipad Ground, Gandhinagar.',
      },
      {
        name: 'Ahmedabad B2B Business Conferences',
        url: 'https://allevents.in/ahmedabad/business',
        parserKey: 'allevents',
        category: 'Commercial Business Events',
        active: true,
        scheduleCron: '0 4 * * *',
        notes: 'Commercial trade exhibitions, B2B summits, and business events in Ahmedabad.',
      },
      {
        name: 'TradeFairDates World Directory',
        url: 'https://www.tradefairdates.com',
        parserKey: 'tradefairdates',
        category: 'International Business Expos',
        active: true,
        scheduleCron: '0 6 * * *',
        notes: 'Global trade fairs and commercial exhibitions portal.',
      },
    ];

    await WebsiteSource.insertMany(defaultSources);
    console.log(`[Seed] Seeded ${defaultSources.length} verified expo website sources.`);
  } catch (err: any) {
    console.error('[Seed] Error seeding sources:', err.message);
  }
};
