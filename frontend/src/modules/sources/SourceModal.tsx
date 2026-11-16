import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Code, Globe, HelpCircle } from 'lucide-react';
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
  const [scheduleCron, setScheduleCron] = useState('0 0 * * *');
  const [notes, setNotes] = useState('');
  const [showSelectors, setShowSelectors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Selectors
  const [itemSelector, setItemSelector] = useState('');
  const [nameSelector, setNameSelector] = useState('');
  const [startDateSelector, setStartDateSelector] = useState('');
  const [venueSelector, setVenueSelector] = useState('');
  const [citySelector, setCitySelector] = useState('');
  const [countrySelector, setCountrySelector] = useState('');
  const [organizerSelector, setOrganizerSelector] = useState('');
  const [descriptionSelector, setDescriptionSelector] = useState('');

  useEffect(() => {
    if (source) {
      setName(source.name);
      setUrl(source.url);
      setParserKey(source.parserKey);
      setCategory(source.category || 'General Business');
      setScheduleCron(source.scheduleCron || '0 0 * * *');
      setNotes(source.notes || '');

      const sel = source.selectorConfig || {};
      setItemSelector(sel.itemSelector || '');
      setNameSelector(sel.nameSelector || '');
      setStartDateSelector(sel.startDateSelector || '');
      setVenueSelector(sel.venueSelector || '');
      setCitySelector(sel.citySelector || '');
      setCountrySelector(sel.countrySelector || '');
      setOrganizerSelector(sel.organizerSelector || '');
      setDescriptionSelector(sel.descriptionSelector || '');
      if (sel.itemSelector) setShowSelectors(true);
    } else {
      setName('');
      setUrl('');
      setParserKey('auto');
      setCategory('General Business');
      setScheduleCron('0 0 * * *');
      setNotes('');
      setItemSelector('');
      setNameSelector('');
      setStartDateSelector('');
      setVenueSelector('');
      setCitySelector('');
      setCountrySelector('');
      setOrganizerSelector('');
      setDescriptionSelector('');
      setShowSelectors(false);
    }
  }, [source, isOpen]);

  // Auto-detect parser hint on URL change
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!source && parserKey === 'auto') {
      const lower = newUrl.toLowerCase();
      if (lower.includes('eventseye.com')) {
        setParserKey('eventseye');
      } else if (lower.includes('tradefairdates.com')) {
        setParserKey('tradefairdates');
      } else if (lower.includes('biztradeshows.com')) {
        setParserKey('biztradeshows');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        url: url.trim(),
        parserKey: parserKey === 'auto' ? 'generic' : parserKey,
        category: category.trim(),
        scheduleCron: scheduleCron.trim(),
        notes: notes.trim(),
        selectorConfig: {
          itemSelector: itemSelector.trim(),
          nameSelector: nameSelector.trim(),
          startDateSelector: startDateSelector.trim(),
          venueSelector: venueSelector.trim(),
          citySelector: citySelector.trim(),
          countrySelector: countrySelector.trim(),
          organizerSelector: organizerSelector.trim(),
          descriptionSelector: descriptionSelector.trim(),
        },
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
      subtitle="Configure target trade show directory and scraping parser"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Source Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. EventsEye Global Directory"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Target URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Website Target URL *
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="url"
              required
              placeholder="https://www.example.com/expos-list"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full text-sm pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Direct URL pointing to trade show or business expo listings
          </p>
        </div>

        {/* Parser Selection & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Parser Type
            </label>
            <select
              value={parserKey}
              onChange={(e) => setParserKey(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Industry Category
            </label>
            <input
              type="text"
              placeholder="e.g. Technology, Medical, Trade"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Scheduled Cron */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Automatic Fetch Schedule (Cron)
            </label>
            <span className="text-[11px] text-slate-400 font-mono">0 0 * * * = Daily midnight</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={scheduleCron}
              onChange={(e) => setScheduleCron(e.target.value)}
              placeholder="0 0 * * *"
              className="text-sm px-3.5 py-2 font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => setScheduleCron('0 */6 * * *')}
              className="text-xs px-2 py-1 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
            >
              Every 6 Hours
            </button>
            <button
              type="button"
              onClick={() => setScheduleCron('0 0 * * *')}
              className="text-xs px-2 py-1 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
            >
              Daily Midnight
            </button>
          </div>
        </div>

        {/* Custom CSS Selectors Accordion */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSelectors(!showSelectors)}
            className="w-full px-4 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-brand-600" />
              Custom CSS Selectors Override (Optional for Generic Sites)
            </span>
            {showSelectors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSelectors && (
            <div className="p-4 bg-white space-y-3 border-t border-slate-200 text-xs">
              <p className="text-slate-500 mb-2">
                Specify CSS selectors to extract custom HTML layouts. Leave blank to rely on heuristic parser.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-0.5">Item Row/Card Selector</label>
                  <input
                    type="text"
                    placeholder="e.g. .expo-card, tr.event-row"
                    value={itemSelector}
                    onChange={(e) => setItemSelector(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">Title / Name Selector</label>
                  <input
                    type="text"
                    placeholder="e.g. h3.title, a.expo-name"
                    value={nameSelector}
                    onChange={(e) => setNameSelector(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">Date Selector</label>
                  <input
                    type="text"
                    placeholder="e.g. .date, time.event-date"
                    value={startDateSelector}
                    onChange={(e) => setStartDateSelector(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">Venue Selector</label>
                  <input
                    type="text"
                    placeholder="e.g. .venue, span.location"
                    value={venueSelector}
                    onChange={(e) => setVenueSelector(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">City Selector</label>
                  <input
                    type="text"
                    placeholder="e.g. .city"
                    value={citySelector}
                    onChange={(e) => setCitySelector(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">Organizer Selector</label>
                  <input
                    type="text"
                    placeholder="e.g. .organizer-name"
                    value={organizerSelector}
                    onChange={(e) => setOrganizerSelector(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Remarks
          </label>
          <textarea
            rows={2}
            placeholder="Additional information or scraping remarks..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
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
