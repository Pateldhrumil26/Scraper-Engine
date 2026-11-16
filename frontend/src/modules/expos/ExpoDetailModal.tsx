import React, { useState } from 'react';
import { Calendar, MapPin, Building, Globe, ExternalLink, Hash, Check, Copy, AlertTriangle, Clock } from 'lucide-react';
import { Expo } from '../../types';
import { Modal } from '../../components/common/Modal';
import { getEventStatusInfo } from '../../utils/dateUtils';

interface ExpoDetailModalProps {
  isOpen: boolean;
  expo: Expo | null;
  onClose: () => void;
}

export const ExpoDetailModal: React.FC<ExpoDetailModalProps> = ({ isOpen, expo, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!expo) return null;

  const statusInfo = getEventStatusInfo(expo.startDate, expo.endDate);

  const copyHash = () => {
    navigator.clipboard.writeText(expo.duplicateHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${expo.venue || ''} ${expo.city || ''} ${expo.country || ''}`
  )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expo.name}
      subtitle={`${expo.industry || 'Business Expo'} • ${statusInfo.label}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Status & Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {statusInfo.isExpired ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Expired Event</span>
              </span>
            ) : statusInfo.isOngoing ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Happening Now</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <span>Upcoming Event</span>
              </span>
            )}

            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {expo.industry || 'Trade Show'}
            </span>

            <span className="text-xs text-slate-500 font-medium">
              Duration: {statusInfo.durationDays} {statusInfo.durationDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          {expo.registrationUrl && (
            <a
              href={expo.registrationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-sm transition-all"
            >
              <span>{statusInfo.isExpired ? 'Official Archive' : 'Official Registration'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Dates & Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-xl border ${
              statusInfo.isExpired
                ? 'bg-rose-50/40 border-rose-100 text-slate-900'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Event Dates</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {statusInfo.startDateFormatted} – {statusInfo.endDateFormatted}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-semibold">
              {statusInfo.isExpired ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-brand-500" />
              )}
              <span>{statusInfo.timeDescription}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Venue & Location</span>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {expo.city}
              {expo.state ? `, ${expo.state}` : ''}
              {expo.country ? `, ${expo.country}` : ''}
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate">{expo.venue || 'Exhibition Center'}</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Organizer</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {expo.organizer || 'Not Specified'}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Source Info</span>
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="uppercase">{expo.sourceKey}</span>
              <a
                href={expo.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-normal"
              >
                Direct Link <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Description & Overview
          </h4>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {expo.description || 'No detailed description provided by the source listing.'}
          </div>
        </div>

        {/* Deduplication Hash */}
        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              Deduplication SHA-256 Fingerprint
            </span>
            <button
              onClick={copyHash}
              className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-[11px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Hash'}</span>
            </button>
          </div>
          <code className="text-[11px] text-slate-600 font-mono break-all block">
            {expo.duplicateHash}
          </code>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
