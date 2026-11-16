import React, { useState, useEffect } from 'react';
import { Globe, Clock, Check, Sparkles, Sliders } from 'lucide-react';
import { WebsiteSource } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<WebsiteSource>) => Promise<void>;
  source?: WebsiteSource | null;
  parsers: { key: string; name: string; description: string }[];
}

interface SchedulePreset {
  id: string;
  cron: string;
  title: string;
  subtitle: string;
  description: string;
}

const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 'every_6h',
    cron: '0 */6 * * *',
    title: 'Every 6 Hours',
    subtitle: 'Recommended',
    description: 'Runs 4 times a day (00:00, 06:00, 12:00, 18:00)',
  },
  {
    id: 'daily',
    cron: '0 0 * * *',
    title: 'Daily Midnight',
    subtitle: 'Once a day',
    description: 'Runs once daily at 12:00 AM (00:00)',
  },
  {
    id: 'every_12h',
    cron: '0 */12 * * *',
    title: 'Every 12 Hours',
    subtitle: 'Twice daily',
    description: 'Runs twice a day at 12:00 AM and 12:00 PM',
  },
  {
    id: 'weekly',
    cron: '0 0 * * 0',
    title: 'Weekly',
    subtitle: 'Every Sunday',
    description: 'Runs once a week on Sunday at midnight',
  },
];

export const SourceModal: React.FC<SourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  source,
  parsers,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [parserKey, setParserKey] = useState('auto');
  const [category, setCategory] = useState('General Business');
  const [scheduleCron, setScheduleCron] = useState('0 */6 * * *');
  const [isCustomCron, setIsCustomCron] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (source) {
      setName(source.name);
      setUrl(source.url);
      setParserKey(source.parserKey);
      setCategory(source.category || 'General Business');
      const cron = source.scheduleCron || '0 */6 * * *';
      setScheduleCron(cron);

      // Check if it matches any standard preset
      const isPreset = SCHEDULE_PRESETS.some((p) => p.cron === cron);
      setIsCustomCron(!isPreset);
    } else {
      setName('');
      setUrl('');
      setParserKey('auto');
      setCategory('General Business');
      setScheduleCron('0 */6 * * *');
      setIsCustomCron(false);
    }
  }, [source, isOpen]);

  // Auto-detect parser hint on URL change
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const lower = newUrl.toLowerCase();
    if (lower.includes('layerx3d.in')) {
      setParserKey('layerx');
    } else if (lower.includes('gccigate.com')) {
      setParserKey('gccigate');
    } else if (lower.includes('engiexpo.com')) {
      setParserKey('engiexpo');
    } else if (lower.includes('sgcci.in')) {
      setParserKey('sgcci');
    } else if (lower.includes('tradeindia.com')) {
      setParserKey('tradeindia');
    } else if (lower.includes('expofinder.com')) {
      setParserKey('expofinder');
    } else if (lower.includes('expostandzone.com')) {
      setParserKey('expostandzone');
    } else if (lower.includes('allevents.in')) {
      setParserKey('allevents');
    } else if (lower.includes('tradefairdates.com')) {
      setParserKey('tradefairdates');
    } else if (lower.includes('eventseye.com')) {
      setParserKey('eventseye');
    } else if (lower.includes('biztradeshows.com')) {
      setParserKey('biztradeshows');
    }
  };

  const handleSelectPreset = (preset: SchedulePreset) => {
    setScheduleCron(preset.cron);
    setIsCustomCron(false);
  };

  const currentPreset = SCHEDULE_PRESETS.find((p) => p.cron === scheduleCron);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    try {
      setIsSubmitting(true);
      let finalParserKey = parserKey;
      if (finalParserKey === 'auto') {
        const lower = url.toLowerCase();
        if (lower.includes('layerx3d.in')) finalParserKey = 'layerx';
        else if (lower.includes('gccigate.com')) finalParserKey = 'gccigate';
        else if (lower.includes('engiexpo.com')) finalParserKey = 'engiexpo';
        else if (lower.includes('sgcci.in')) finalParserKey = 'sgcci';
        else if (lower.includes('tradeindia.com')) finalParserKey = 'tradeindia';
        else if (lower.includes('expofinder.com')) finalParserKey = 'expofinder';
        else if (lower.includes('expostandzone.com')) finalParserKey = 'expostandzone';
        else if (lower.includes('allevents.in')) finalParserKey = 'allevents';
        else if (lower.includes('tradefairdates.com')) finalParserKey = 'tradefairdates';
        else if (lower.includes('eventseye.com')) finalParserKey = 'eventseye';
        else if (lower.includes('biztradeshows.com')) finalParserKey = 'biztradeshows';
        else finalParserKey = 'generic';
      }

      await onSave({
        name: name.trim(),
        url: url.trim(),
        parserKey: finalParserKey,
        category: category.trim(),
        scheduleCron: scheduleCron.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={source ? 'Edit Website Source' : 'Add New Website Source'}
      subtitle="Configure target trade show directory and automated scraping schedule"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Source Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. EventsEye Global Directory"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        {/* Target URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Website Target URL *
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="url"
              required
              placeholder="https://www.example.com/expos-list"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Direct URL pointing to trade show or business expo listings
          </p>
        </div>

        {/* Parser Selection & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Parser Type
            </label>
            <select
              value={parserKey}
              onChange={(e) => setParserKey(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-xs"
            >
              <option value="auto">Auto-Detect from Domain</option>
              {parsers.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Industry Category
            </label>
            <input
              type="text"
              placeholder="e.g. Technology, Medical, Trade"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>
        </div>

        {/* Automatic Fetch Schedule (Cron) - Modern & Clean UI */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-600" />
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Automatic Fetch Schedule
              </label>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomCron(!isCustomCron)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors"
            >
              <Sliders className="w-3 h-3" />
              <span>{isCustomCron ? 'Switch to Presets' : 'Custom Cron'}</span>
            </button>
          </div>

          {/* Schedule Presets Grid */}
          {!isCustomCron ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SCHEDULE_PRESETS.map((preset) => {
                const isSelected = scheduleCron === preset.cron;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-500 bg-white ring-2 ring-brand-100 shadow-sm'
                        : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-brand-700' : 'text-slate-800'
                          }`}
                        >
                          {preset.title}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {preset.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Custom Cron Expression Input */
            <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <label className="block text-[11px] font-semibold text-slate-600">
                Custom 5-Part Cron Expression
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={scheduleCron}
                  onChange={(e) => setScheduleCron(e.target.value)}
                  placeholder="0 */6 * * *"
                  className="flex-1 text-sm font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-200 shrink-0">
                  minute hour day month weekday
                </span>
              </div>
            </div>
          )}

          {/* Active Schedule Human-Readable Description */}
          <div className="flex items-center gap-2 text-xs bg-white py-2 px-3 rounded-xl border border-slate-200/70 text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="font-medium text-slate-700">
              {currentPreset
                ? currentPreset.description
                : `Custom schedule: "${scheduleCron}"`}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {source ? 'Save Changes' : 'Create Source'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
