import React from 'react';
import { Calendar, MapPin, Building, ExternalLink, Globe } from 'lucide-react';
import { Expo } from '../../types';
import { Badge } from '../../components/common/Badge';

interface ExpoCardProps {
  expo: Expo;
  onSelect: (expo: Expo) => void;
}

export const ExpoCard: React.FC<ExpoCardProps> = ({ expo, onSelect }) => {
  const startDateStr = new Date(expo.startDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endDateStr = new Date(expo.endDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect(expo)}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="brand" size="sm">
            {expo.industry || 'General Trade'}
          </Badge>

          <Badge
            variant={
              expo.status === 'UPCOMING'
                ? 'brand'
                : expo.status === 'ONGOING'
                ? 'success'
                : 'slate'
            }
            size="sm"
            dot
          >
            {expo.status}
          </Badge>
        </div>

        {/* Expo Name */}
        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">
          {expo.name}
        </h3>

        {/* Organizer */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{expo.organizer || 'Organized by Event Management'}</span>
        </div>

        {/* Dates */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-xs flex items-center gap-2 text-slate-700">
          <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
          <div className="truncate font-medium">
            {startDateStr} {startDateStr !== endDateStr ? `– ${endDateStr}` : ''}
          </div>
        </div>

        {/* Venue & Location */}
        <div className="space-y-1 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="font-semibold text-slate-800">{expo.city}</span>
            {expo.country && <span>, {expo.country}</span>}
          </div>
          {expo.venue && (
            <div className="text-[11px] text-slate-400 truncate pl-5">
              {expo.venue}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Links */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
          <Globe className="w-3 h-3 text-slate-400" />
          {expo.sourceKey.toUpperCase()}
        </span>

        <div className="flex items-center gap-2">
          {expo.registrationUrl && (
            <a
              href={expo.registrationUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 font-medium p-1 hover:bg-brand-50 rounded"
              title="Official Link"
            >
              <span>Register</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
