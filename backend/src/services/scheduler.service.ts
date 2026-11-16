import cron, { ScheduledTask } from 'node-cron';
import { WebsiteSource, IWebsiteSource } from '../models/WebsiteSource';
import { ScraperEngineService } from '../modules/scraper/scraper-engine.service';

class SchedulerService {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isInitialized = false;

  /**
   * Initializes schedules for all active sources in the database
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const activeSources = await WebsiteSource.find({ active: true });
      console.log(`[Scheduler] Initializing schedules for ${activeSources.length} active sources...`);

      for (const source of activeSources) {
        this.registerSourceSchedule(source);
      }
    } catch (err: any) {
      console.error('[Scheduler] Initialization error:', err.message);
    }
  }

  /**
   * Registers or updates a cron schedule for a specific source
   */
  registerSourceSchedule(source: IWebsiteSource): void {
    const sourceId = source._id.toString();

    // Remove existing task if any
    this.removeSourceSchedule(sourceId);

    if (!source.active) {
      return;
    }

    const cronExpr = source.scheduleCron && cron.validate(source.scheduleCron)
      ? source.scheduleCron
      : '0 0 * * *'; // Default daily at midnight

    try {
      const task = cron.schedule(cronExpr, async () => {
        console.log(`[Scheduler] Cron triggered for source: ${source.name} [${cronExpr}]`);
        try {
          const freshSource = await WebsiteSource.findById(source._id);
          if (freshSource && freshSource.active) {
            await ScraperEngineService.fetchSource(freshSource, 'SCHEDULED');
          }
        } catch (err: any) {
          console.error(`[Scheduler] Scheduled fetch error for ${source.name}:`, err.message);
        }
      });

      this.tasks.set(sourceId, task);
      console.log(`[Scheduler] Registered schedule for "${source.name}" with pattern "${cronExpr}"`);
    } catch (err: any) {
      console.error(`[Scheduler] Failed to schedule source "${source.name}":`, err.message);
    }
  }

  /**
   * Removes scheduled task for a source
   */
  removeSourceSchedule(sourceId: string): void {
    if (this.tasks.has(sourceId)) {
      const existing = this.tasks.get(sourceId);
      existing?.stop();
      this.tasks.delete(sourceId);
      console.log(`[Scheduler] Removed schedule for source ID: ${sourceId}`);
    }
  }

  /**
   * Stops all scheduled tasks
   */
  stopAll(): void {
    for (const [id, task] of this.tasks.entries()) {
      task.stop();
    }
    this.tasks.clear();
    console.log('[Scheduler] All schedules stopped');
  }
}

export const schedulerService = new SchedulerService();
