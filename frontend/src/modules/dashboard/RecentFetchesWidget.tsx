import React from 'react';
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { FetchLog } from '../../types';
import { Badge } from '../../components/common/Badge';

interface RecentFetchesWidgetProps {
  logs: FetchLog[];
  onViewAll: () => void;
  onSelectLog: (log: FetchLog) => void;
}

export const RecentFetchesWidget: React.FC<RecentFetchesWidgetProps> = ({
  logs,
  onViewAll,
  onSelectLog,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">Recent Fetch Operations</h3>
          <p className="text-xs text-slate-500">Live operational log of scraper runs</p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
        >
          View Full History <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          No fetch operations recorded yet. Click "Fetch Now" on any source to begin!
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div
              key={log._id}
              onClick={() => onSelectLog(log)}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                  {log.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : log.status === 'PARTIAL' ? (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{log.sourceName}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(log.startTime).toLocaleTimeString()}
                    </span>
                    <span>•</span>
                    <span>{log.durationMs}ms</span>
                    <span>•</span>
                    <span className="capitalize">{log.triggeredBy.toLowerCase()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-medium text-emerald-600">
                    +{log.newInserted} new
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {log.duplicatesSkipped} duplicates
                  </div>
                </div>

                <Badge
                  variant={
                    log.status === 'SUCCESS'
                      ? 'success'
                      : log.status === 'PARTIAL'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                  dot
                >
                  {log.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
