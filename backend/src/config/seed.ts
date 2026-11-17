import { WebsiteSource } from '../models/WebsiteSource';
import { Expo } from '../models/Expo';
import { parserRegistry } from '../modules/scraper/parser-registry';
import defaultWebsites from './websites.json';

export interface SimpleWebsiteConfig {
  name: string;
  url: string;
  parserKey?: string;
  category?: string;
  active?: boolean;
  scheduleCron?: string;
  notes?: string;
}

export const GUJARAT_PREDEFINED_SOURCES: SimpleWebsiteConfig[] = defaultWebsites as SimpleWebsiteConfig[];

export const seedDefaultSources = async (): Promise<void> => {
  try {
    const websitesList = defaultWebsites as SimpleWebsiteConfig[];

    for (const src of websitesList) {
      if (!src.url) continue;

      // Auto-detect parser key from domain if not explicitly provided
      const finalParserKey = src.parserKey || parserRegistry.resolveForUrl(src.url).key;
      const finalName = src.name || new URL(src.url).hostname;
      const finalCategory = src.category || 'General Business';
      const finalCron = src.scheduleCron || '0 */6 * * *';
      const finalActive = src.active !== undefined ? src.active : true;

      await WebsiteSource.findOneAndUpdate(
        { url: src.url.trim() },
        {
          $set: {
            name: finalName.trim(),
            url: src.url.trim(),
            parserKey: finalParserKey,
            category: finalCategory,
            active: finalActive,
            scheduleCron: finalCron,
            notes: src.notes || '',
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed] Successfully synchronized ${defaultWebsites.length} predefined website sources from websites.json.`);

    // Remove legacy 10times website sources (user requested removal)
    const deleteSourcesRes = await WebsiteSource.deleteMany({
      $or: [
        { url: /10times/i },
        { name: /10times/i },
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
