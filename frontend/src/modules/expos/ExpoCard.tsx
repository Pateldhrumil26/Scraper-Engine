import React from 'react';
import { Calendar, MapPin, Building, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import { Expo } from '../../types';
import { getEventStatusInfo } from '../../utils/dateUtils';

interface ExpoCardProps {
  expo: Expo;
  onSelect: (expo: Expo) => void;
}

export const ExpoCard: React.FC<ExpoCardProps> = ({ expo, onSelect }) => {
  const statusInfo = getEventStatusInfo(expo.startDate, expo.endDate);

  return (
    <div
      onClick={() => onSelect(expo)}
      className={`bg-white rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group p-5 shadow-sm hover:shadow-md ${
        statusInfo.isExpired
          ? 'border-slate-200/80 bg-slate-50/30 opacity-90 hover:border-slate-300'
          : statusInfo.isOngoing
          ? 'border-emerald-200 hover:border-emerald-400 ring-1 ring-emerald-100'
          : 'border-slate-200 hover:border-brand-300'
      }`}
    >
      <div>
        {/* Top Status & Category Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 truncate max-w-[170px]">
            {expo.industry || 'Business Expo'}
          </span>

          {/* Proper Expiry / Upcoming / Ongoing Status Badge */}
          {statusInfo.isExpired ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Expired</span>
            </span>
          ) : statusInfo.isOngoing ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Happening Now</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <span>Upcoming</span>
            </span>
          )}
        </div>

        {/* Expo Name */}
        <h3
          className={`font-bold text-base leading-snug line-clamp-2 mb-2 transition-colors ${
            statusInfo.isExpired ? 'text-slate-700' : 'text-slate-900 group-hover:text-brand-600'
          }`}
        >
          {expo.name}
        </h3>

        {/* Organizer */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{expo.organizer || 'Organized by Event Management'}</span>
        </div>

        {/* Event Dates & Expiry/Countdown Box */}
        <div
          className={`p-3 rounded-xl border mb-3 text-xs space-y-1 ${
            statusInfo.isExpired
              ? 'bg-rose-50/50 border-rose-100 text-slate-700'
              : statusInfo.isOngoing
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : 'bg-brand-50/40 border-brand-100 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Calendar
                className={`w-3.5 h-3.5 shrink-0 ${
                  statusInfo.isExpired
                    ? 'text-rose-500'
                    : statusInfo.isOngoing
                    ? 'text-emerald-600'
                    : 'text-brand-600'
                }`}
              />
              <span>
                {statusInfo.startDateFormatted}
                {statusInfo.startDateFormatted !== statusInfo.endDateFormatted
                  ? ` – ${statusInfo.endDateFormatted}`
                  : ''}
              </span>
            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/40 text-slate-600 font-semibold">
              {statusInfo.durationDays} {statusInfo.durationDays === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${
              statusInfo.isExpired
                ? 'text-rose-600'
                : statusInfo.isOngoing
                ? 'text-emerald-700 font-bold'
                : 'text-brand-700'
            }`}
          >
            {statusInfo.isExpired ? (
              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
            ) : (
              <Clock className="w-3 h-3 text-brand-500 shrink-0" />
            )}
            <span>{statusInfo.timeDescription}</span>
          </div>
        </div>

        {/* Location & City */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-4">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="font-semibold text-slate-800">{expo.city}</span>
          {expo.country && <span>, {expo.country}</span>}
          {expo.venue && expo.venue !== 'Exhibition Center' && (
            <span className="text-slate-400 text-[11px] truncate ml-1">({expo.venue})</span>
          )}
        </div>
      </div>

      {/* Footer / Registration Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 font-mono uppercase">
          {expo.sourceKey}
        </span>

        <div className="flex items-center gap-2">
          {expo.registrationUrl && (
            <a
              href={expo.registrationUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-1 rounded-lg transition-colors ${
                statusInfo.isExpired
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  : 'text-brand-600 hover:text-brand-800 hover:bg-brand-50'
              }`}
            >
              <span>{statusInfo.isExpired ? 'View Archive' : 'Register'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
