import React from 'react';
import { Calendar, MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { Expo } from '../../types';
import { Badge } from '../../components/common/Badge';

interface UpcomingExposWidgetProps {
  expos: Expo[];
  onViewAll: () => void;
  onSelectExpo: (expo: Expo) => void;
}

export const UpcomingExposWidget: React.FC<UpcomingExposWidgetProps> = ({
  expos,
  onViewAll,
  onSelectExpo,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">Upcoming Business Expos</h3>
          <p className="text-xs text-slate-500">Earliest upcoming global exhibitions</p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
        >
          View All Expos <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {expos.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          No upcoming expos found in database yet.
        </div>
      ) : (
        <div className="space-y-3">
          {expos.map((expo) => (
            <div
              key={expo._id}
              onClick={() => onSelectExpo(expo)}
              className="p-3.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="brand" size="sm">
                    {expo.industry || 'Business'}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {expo.city}{expo.country ? `, ${expo.country}` : ''}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800 text-sm truncate hover:text-brand-600 transition-colors">
                  {expo.name}
                </h4>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>
                    {new Date(expo.startDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {expo.registrationUrl && (
                  <a
                    href={expo.registrationUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                    title="External Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
