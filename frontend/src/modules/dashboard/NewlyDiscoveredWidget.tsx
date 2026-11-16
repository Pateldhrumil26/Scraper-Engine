import React from 'react';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { Expo } from '../../types';

interface NewlyDiscoveredWidgetProps {
  expos: Expo[];
  onViewAll: () => void;
  onSelectExpo: (expo: Expo) => void;
}

export const NewlyDiscoveredWidget: React.FC<NewlyDiscoveredWidgetProps> = ({
  expos,
  onViewAll,
  onSelectExpo,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Newly Discovered Expos</h3>
              <p className="text-[11px] text-slate-500">Scraped within the last 48 hours</p>
            </div>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {expos.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-700 block">No New Discoveries</span>
            <span className="text-[11px] text-slate-400">Trigger a fetch to aggregate recent events</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {expos.slice(0, 4).map((expo) => (
              <div
                key={expo._id}
                onClick={() => onSelectExpo(expo)}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate group-hover:text-brand-600">
                    {expo.name}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{expo.city}</span>
                    <span>•</span>
                    <span className="truncate">{expo.industry || 'Business Expo'}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 font-semibold border border-slate-200/60 shrink-0">
                  {new Date(expo.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
