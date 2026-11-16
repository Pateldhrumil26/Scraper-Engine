import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Calendar,
  MapPin,
  Eye,
  Clock,
  AlertTriangle,
  Star,
  ArrowRight,
} from 'lucide-react';
import { Expo } from '../../types';
import { getEventStatusInfo } from '../../utils/dateUtils';

interface ExpoTableProps {
  expos: Expo[];
  onSelect: (expo: Expo) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  onToggleFavorite?: (id: string) => void;
}

export const ExpoTable: React.FC<ExpoTableProps> = ({
  expos,
  onSelect,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onToggleFavorite,
}) => {
  const allSelected = expos.length > 0 && selectedIds.length === expos.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              {onToggleSelect && (
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </th>
              )}
              <th className="py-3 px-2 w-8 text-center">★</th>
              <th className="py-3 px-4">Expo Name</th>
              <th className="py-3 px-3">Quality</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Organizer</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expos.map((expo) => {
              const statusInfo = getEventStatusInfo(expo.startDate, expo.endDate);
              const isSelected = selectedIds.includes(expo._id);

              return (
                <tr
                  key={expo._id}
                  onClick={() => onSelect(expo)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-brand-50/40' : ''
                  } ${statusInfo.isExpired ? 'opacity-85' : ''}`}
                >
                  {/* Select Checkbox */}
                  {onToggleSelect && (
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(expo._id)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </td>
                  )}

                  {/* Favorite Star */}
                  <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite?.(expo._id)}
                      className={`p-1 rounded transition-colors ${
                        expo.isFavorite
                          ? 'text-amber-500'
                          : 'text-slate-300 hover:text-amber-500'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${expo.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </td>

                  {/* Expo Name */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate group-hover:text-brand-600">
                    <div className="flex flex-col">
                      <span className="truncate">{expo.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {expo.industry || 'General Business'}
                      </span>
                    </div>
                  </td>

                  {/* Quality Score */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        (expo.dataQualityScore ?? 80) >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : (expo.dataQualityScore ?? 80) >= 50
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {expo.dataQualityScore ?? 80}%
                    </span>
                  </td>

                  {/* Date Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {statusInfo.isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>Expired</span>
                      </span>
                    ) : statusInfo.isOngoing ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Live</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                        <Clock className="w-3 h-3 text-brand-500" />
                        <span>Upcoming</span>
                      </span>
                    )}
                  </td>

                  {/* Dates */}
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>{statusInfo.startDateFormatted}</span>
                      <span className="text-slate-400 text-[10px]">({statusInfo.durationDays}d)</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-semibold text-slate-800">{expo.city}</span>
                      {expo.country && <span>, {expo.country}</span>}
                    </div>
                  </td>

                  {/* Organizer */}
                  <td className="py-3.5 px-4 text-slate-600 max-w-[130px] truncate">
                    {expo.organizer || 'Not Specified'}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/expos/${expo._id}`}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {expo.registrationUrl && (
                        <a
                          href={expo.registrationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Open Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
