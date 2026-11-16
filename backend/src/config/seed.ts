import { WebsiteSource } from '../models/WebsiteSource';
import { Expo } from '../models/Expo';

export const GUJARAT_PREDEFINED_SOURCES = [
  {
    name: 'LayerX Gujarat Confirmed Expos (Ahmedabad & Gandhinagar)',
    url: 'https://layerx3d.in/blog/upcoming-expos-ahmedabad-gandhinagar-2026-27',
    parserKey: 'layerx',
    category: 'Gujarat Confirmed Business Expos',
    active: true,
    scheduleCron: '0 */6 * * *',
    notes: 'Curated calendar of confirmed industrial exhibitions and trade shows in Ahmedabad and Gandhinagar.',
  },
  {
    name: 'GATE 2027 · GCCI Annual Trade Expo (Gandhinagar)',
    url: 'https://www.gccigate.com/',
    parserKey: 'gccigate',
    category: 'Gujarat Chamber of Commerce & Industry',
    active: true,
    scheduleCron: '0 0 * * *',
    notes: 'Official trade exposition by Gujarat Chamber of Commerce & Industry (GCCI) at Helipad Exhibition Centre, Gandhinagar.',
  },
  {
    name: 'EngiExpo Gujarat Industrial Engineering (Ahmedabad, Surat, Rajkot, Vadodara)',
    url: 'https://engiexpo.com/',
    parserKey: 'engiexpo',
    category: 'Gujarat Engineering & Machinery',
    active: true,
    scheduleCron: '0 */6 * * *',
    notes: "Premier B2B industrial engineering and automation exhibitions across Gujarat's industrial hubs.",
  },
  {
    name: 'SGCCI Southern Gujarat Trade & Industrial Expos (Surat)',
    url: 'https://sgcci.in/',
    parserKey: 'sgcci',
    category: 'South Gujarat Trade & Textiles',
    active: true,
    scheduleCron: '0 */6 * * *',
    notes: 'Official trade fairs by Southern Gujarat Chamber of Commerce & Industry at SIECC Sarsana, Surat.',
  },
  {
    name: 'Ahmedabad Business & Trade Expos',
    url: 'https://allevents.in/ahmedabad/exhibitions',
    parserKey: 'allevents',
    category: 'Ahmedabad Business Shows',
    active: true,
    scheduleCron: '0 */6 * * *',
    notes: 'Live business exhibitions, industrial expos, and commercial trade shows in Ahmedabad.',
  },
  {
    name: 'Gandhinagar Trade Fairs & Expos',
    url: 'https://allevents.in/gandhinagar/exhibitions',
    parserKey: 'allevents',
    category: 'Gandhinagar & Mahatma Mandir',
    active: true,
    scheduleCron: '0 */6 * * *',
    notes: 'Exhibitions and business conventions at Mahatma Mandir and Helipad Ground, Gandhinagar.',
  },
];

export const seedDefaultSources = async (): Promise<void> => {
  try {
    for (const src of GUJARAT_PREDEFINED_SOURCES) {
      await WebsiteSource.findOneAndUpdate(
        { url: src.url },
        {
          $set: {
            name: src.name,
            parserKey: src.parserKey,
            category: src.category,
            active: src.active,
            scheduleCron: src.scheduleCron,
            notes: src.notes,
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed] Successfully synchronized ${GUJARAT_PREDEFINED_SOURCES.length} predefined Gujarat website sources.`);

    // Remove legacy/out-of-scope website sources (10times, old international directories)
    const deleteSourcesRes = await WebsiteSource.deleteMany({
      $or: [
        { url: /10times|expofinder|eventseye|tradeindia|expostandzone|tradefairdates|biztradeshows/i },
        { name: /10times|expofinder|eventseye|tradeindia|expostandzone|tradefairdates|biztradeshows/i },
      ],
    });
    if (deleteSourcesRes.deletedCount > 0) {
      console.log(`[Seed] Purged ${deleteSourcesRes.deletedCount} legacy sources.`);
    }

    // Normalize existing expos with accurate Gujarat city, state, country
    const expos = await Expo.find({}).lean();
    let updatedCount = 0;
    for (const expo of expos) {
      const textToScan = `${expo.city || ''} ${expo.venue || ''} ${expo.name || ''}`.toLowerCase();
      let targetCity = expo.city;
      if (textToScan.includes('gandhinagar') || textToScan.includes('mahatma mandir') || textToScan.includes('helipad')) targetCity = 'Gandhinagar';
      else if (textToScan.includes('surat') || textToScan.includes('siecc') || textToScan.includes('sarsana') || textToScan.includes('vanita vishram')) targetCity = 'Surat';
      else if (textToScan.includes('rajkot')) targetCity = 'Rajkot';
      else if (textToScan.includes('vadodara') || textToScan.includes('baroda') || textToScan.includes('navlakhi')) targetCity = 'Vadodara';
      else if (textToScan.includes('morbi')) targetCity = 'Morbi';
      else if (textToScan.includes('patan')) targetCity = 'Patan';
      else if (textToScan.includes('bhavnagar')) targetCity = 'Bhavnagar';
      else if (textToScan.includes('jamnagar')) targetCity = 'Jamnagar';
      else if (textToScan.includes('anand')) targetCity = 'Anand';
      else if (textToScan.includes('vapi')) targetCity = 'Vapi';
      else if (textToScan.includes('bharuch') || textToScan.includes('ankleshwar') || textToScan.includes('dahej')) targetCity = 'Bharuch';
      else if (textToScan.includes('mehsana')) targetCity = 'Mehsana';
      else if (textToScan.includes('kutch') || textToScan.includes('bhuj') || textToScan.includes('gandhidham')) targetCity = 'Kutch';
      else if (textToScan.includes('ahmedabad') || textToScan.includes('amdavad') || textToScan.includes('gmdc') || textToScan.includes('riverfront')) targetCity = 'Ahmedabad';
      else if (!targetCity) targetCity = 'Ahmedabad';

      if (targetCity !== expo.city || expo.country !== 'India' || expo.state !== 'Gujarat') {
        await Expo.updateOne(
          { _id: expo._id },
          { $set: { city: targetCity, country: 'India', state: 'Gujarat' } }
        );
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`[Seed] Normalized ${updatedCount} existing expos with precise Gujarat city mapping.`);
    }
  } catch (err: any) {
    console.error('[Seed] Error seeding Gujarat sources:', err.message);
  }
};
