import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Building, Globe, ExternalLink } from 'lucide-react';
import { Expo } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

interface ExpoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Expo>) => Promise<void>;
  expo?: Expo | null;
}

export const ExpoModal: React.FC<ExpoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expo,
}) => {
  const [name, setName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [industry, setIndustry] = useState('Business & Trade');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [state, setState] = useState('Gujarat');
  const [country, setCountry] = useState('India');
  const [description, setDescription] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expo) {
      setName(expo.name || '');
      setOrganizer(expo.organizer || '');
      setIndustry(expo.industry || 'Business & Trade');
      setStartDate(expo.startDate ? new Date(expo.startDate).toISOString().split('T')[0] : '');
      setEndDate(expo.endDate ? new Date(expo.endDate).toISOString().split('T')[0] : '');
      setVenue(expo.venue || '');
      setCity(expo.city || 'Ahmedabad');
      setState(expo.state || 'Gujarat');
      setCountry(expo.country || 'India');
      setDescription(expo.description || '');
      setRegistrationUrl(expo.registrationUrl || '');
    } else {
      setName('');
      setOrganizer('');
      setIndustry('Business & Trade');
      const now = new Date();
      const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
      const inTwoWeeksPlus3 = new Date(inTwoWeeks.getTime() + 3 * 24 * 3600 * 1000);
      setStartDate(inTwoWeeks.toISOString().split('T')[0]);
      setEndDate(inTwoWeeksPlus3.toISOString().split('T')[0]);
      setVenue('');
      setCity('Ahmedabad');
      setState('Gujarat');
      setCountry('India');
      setDescription('');
      setRegistrationUrl('');
    }
  }, [expo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        organizer: organizer.trim() || 'Self-Organized',
        industry: industry.trim() || 'Business & Trade',
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        venue: venue.trim() || 'Convention Center',
        city: city.trim() || 'Ahmedabad',
        state: state.trim() || 'Gujarat',
        country: country.trim() || 'India',
        description: description.trim() || `${name.trim()} business exhibition.`,
        registrationUrl: registrationUrl.trim(),
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
      title={expo ? 'Edit Business Expo' : 'Add Expo Manually'}
      subtitle={expo ? 'Modify expo details and schedule' : 'Register a new verified business exhibition or trade show'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Expo / Trade Show Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Vibrant Gujarat Trade Show 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Organizer & Industry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Organizer
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Gujarat Chamber of Commerce"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full text-sm pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Industry Category
            </label>
            <input
              type="text"
              placeholder="e.g. Industrial Automation, Textiles"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              End Date *
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Location: Venue, City, Country */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Venue
            </label>
            <input
              type="text"
              placeholder="e.g. GMDC Ground / Mahatma Mandir"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Ahmedabad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Country
            </label>
            <input
              type="text"
              placeholder="e.g. India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Registration URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Registration / Website URL
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="url"
              placeholder="https://example.com/expo-registration"
              value={registrationUrl}
              onChange={(e) => setRegistrationUrl(e.target.value)}
              className="w-full text-sm pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description / Overview
          </label>
          <textarea
            rows={2}
            placeholder="Overview of exhibitors, focus sectors, and attendees..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {expo ? 'Save Changes' : 'Create Expo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
