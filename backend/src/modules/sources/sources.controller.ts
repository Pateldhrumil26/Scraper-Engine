import { Request, Response } from 'express';
import { WebsiteSource } from '../../models/WebsiteSource';
import { parserRegistry } from '../scraper/parser-registry';
import { ScraperEngineService } from '../scraper/scraper-engine.service';
import { schedulerService } from '../../services/scheduler.service';

export class SourcesController {
  /**
   * Get all configured website sources
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const sources = await WebsiteSource.find().sort({ createdAt: -1 });
      res.json({ success: true, count: sources.length, data: sources });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get single source by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const source = await WebsiteSource.findById(req.params.id);
      if (!source) {
        res.status(404).json({ success: false, message: 'Source not found' });
        return;
      }
      res.json({ success: true, data: source });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Create a new website source
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, url, parserKey, category, scheduleCron, selectorConfig, notes } = req.body;

      if (!name || !url) {
        res.status(400).json({ success: false, message: 'Name and URL are required' });
        return;
      }

      // Check if URL already exists
      const existing = await WebsiteSource.findOne({ url: url.trim() });
      if (existing) {
        res.status(409).json({ success: false, message: 'A source with this URL already exists' });
        return;
      }

      // Auto-detect parser if not provided or set to 'auto'
      let finalParserKey = parserKey;
      if (!finalParserKey || finalParserKey === 'auto') {
        const detected = parserRegistry.resolveForUrl(url);
        finalParserKey = detected.key;
      }

      const source = new WebsiteSource({
        name: name.trim(),
        url: url.trim(),
        parserKey: finalParserKey,
        category: category || 'General Business',
        active: true,
        scheduleCron: scheduleCron || '0 0 * * *',
        selectorConfig: selectorConfig || {},
        notes: notes || '',
      });

      await source.save();

      // Update scheduler
      schedulerService.registerSourceSchedule(source);

      res.status(201).json({ success: true, message: 'Source created successfully', data: source });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update an existing source
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { name, url, parserKey, category, active, scheduleCron, selectorConfig, notes } = req.body;

      const source = await WebsiteSource.findById(req.params.id);
      if (!source) {
        res.status(404).json({ success: false, message: 'Source not found' });
        return;
      }

      if (name) source.name = name.trim();
      if (url) source.url = url.trim();
      if (parserKey) source.parserKey = parserKey;
      if (category !== undefined) source.category = category;
      if (active !== undefined) source.active = Boolean(active);
      if (scheduleCron) source.scheduleCron = scheduleCron;
      if (selectorConfig) source.selectorConfig = selectorConfig;
      if (notes !== undefined) source.notes = notes;

      await source.save();

      // Refresh scheduler
      schedulerService.registerSourceSchedule(source);

      res.json({ success: true, message: 'Source updated successfully', data: source });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Delete a source
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const source = await WebsiteSource.findByIdAndDelete(req.params.id);
      if (!source) {
        res.status(404).json({ success: false, message: 'Source not found' });
        return;
      }

      schedulerService.removeSourceSchedule(req.params.id);

      res.json({ success: true, message: 'Source deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Toggle active status
   */
  static async toggleActive(req: Request, res: Response): Promise<void> {
    try {
      const source = await WebsiteSource.findById(req.params.id);
      if (!source) {
        res.status(404).json({ success: false, message: 'Source not found' });
        return;
      }

      source.active = !source.active;
      await source.save();

      schedulerService.registerSourceSchedule(source);

      res.json({ success: true, data: source });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Trigger manual fetch for a single source
   */
  static async triggerFetch(req: Request, res: Response): Promise<void> {
    try {
      const source = await WebsiteSource.findById(req.params.id);
      if (!source) {
        res.status(404).json({ success: false, message: 'Source not found' });
        return;
      }

      // Run fetch asynchronously or synchronously
      const result = await ScraperEngineService.fetchSource(source, 'MANUAL');
      res.json({
        success: result.status !== 'FAILED',
        message: `Fetch ${result.status.toLowerCase()}: ${result.newInserted} new items, ${result.duplicatesSkipped} duplicates`,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Trigger manual fetch for all active sources
   */
  static async triggerFetchAll(req: Request, res: Response): Promise<void> {
    try {
      // Run in background or await
      ScraperEngineService.fetchAllActiveSources('MANUAL').catch((err) =>
        console.error('Fetch all error:', err)
      );

      res.json({
        success: true,
        message: 'Batch fetching started in background for all active sources',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Test any URL live and return a preview of extracted items before saving
   */
  static async testUrlPreview(req: Request, res: Response): Promise<void> {
    try {
      const { url, parserKey, selectorConfig } = req.body;
      if (!url) {
        res.status(400).json({ success: false, message: 'URL is required' });
        return;
      }

      const parser = parserRegistry.resolveForUrl(url, parserKey);
      let html = '';
      try {
        if ('fetchHtml' in parser && typeof (parser as any).fetchHtml === 'function') {
          html = await (parser as any).fetchHtml(url);
        } else {
          const generic = parserRegistry.get('generic');
          html = await (generic as any).fetchHtml(url);
        }
      } catch (fetchErr: any) {
        if (fetchErr.response?.status === 403) {
          res.status(403).json({
            success: false,
            message: `HTTP 403 Forbidden: ${new URL(url).hostname} blocks automated scraping with anti-bot protection.`,
          });
          return;
        }
        res.status(502).json({
          success: false,
          message: `Failed to fetch HTML: ${fetchErr.message}`,
        });
        return;
      }

      const rawItems = await parser.parse(html, url, selectorConfig);

      res.json({
        success: true,
        parserUsed: parser.name,
        parserKey: parser.key,
        htmlLength: html.length,
        totalFound: rawItems.length,
        sampleItems: rawItems.slice(0, 5),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get list of registered parsers
   */
  static async getParsers(req: Request, res: Response): Promise<void> {
    try {
      const parsers = parserRegistry.getAll().map((p) => ({
        key: p.key,
        name: p.name,
        description: p.description,
      }));
      res.json({ success: true, data: parsers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
