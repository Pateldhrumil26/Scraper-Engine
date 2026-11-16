import React from 'react';
import { ExternalLink, Calendar, MapPin, Eye, Clock, AlertTriangle } from 'lucide-react';
import { Expo } from '../../types';
import { getEventStatusInfo } from '../../utils/dateUtils';

interface ExpoTableProps {
  expos: Expo[];
  onSelect: (expo: Expo) => void;
}

export const ExpoTable: React.FC<ExpoTableProps> = ({ expos, onSelect }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Expo Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Organizer</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expos.map((expo) => {
              const statusInfo = getEventStatusInfo(expo.startDate, expo.endDate);

              return (
                <tr
                  key={expo._id}
                  onClick={() => onSelect(expo)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    statusInfo.isExpired ? 'opacity-80' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate group-hover:text-brand-600">
                    {expo.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {expo.industry || 'General'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {statusInfo.isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>Expired</span>
                      </span>
                    ) : statusInfo.isOngoing ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Live Now</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                        <Clock className="w-3 h-3 text-brand-500" />
                        <span>Upcoming</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>{statusInfo.startDateFormatted}</span>
                      <span className="text-slate-400 text-[11px]">({statusInfo.durationDays}d)</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-semibold text-slate-800">{expo.city}</span>
                      {expo.country && <span>, {expo.country}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate">
                    {expo.organizer || 'Not Specified'}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelect(expo)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {expo.registrationUrl && (
                        <a
                          href={expo.registrationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Open Link"
                        >
                          <ExternalLink className="w-4 h-4" />
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
