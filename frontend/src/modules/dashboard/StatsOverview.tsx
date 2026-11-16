import React from 'react';
import { Calendar, Globe2, Layers, PlayCircle } from 'lucide-react';
import { DashboardStats } from '../../types';

interface StatsOverviewProps {
  stats: DashboardStats | null;
  onNavigate: (tab: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, onNavigate }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Expos Card */}
      <div
        onClick={() => onNavigate('expos')}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Business Expos
          </span>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">
            {stats?.totalExpos?.toLocaleString() || 0}
          </span>
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
            In Database
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Deduplicated global expo records</p>
      </div>

      {/* Upcoming Expos Card */}
      <div
        onClick={() => onNavigate('expos')}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Upcoming Events
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">
            {stats?.upcomingExpos?.toLocaleString() || 0}
          </span>
          <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded-full">
            Future Scheduled
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Events happening soon</p>
      </div>

      {/* Website Sources Card */}
      <div
        onClick={() => onNavigate('sources')}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Website Sources
          </span>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Globe2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">
            {stats?.totalSources || 0}
          </span>
          <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
            {stats?.activeSources || 0} Active
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Configured scraper endpoints</p>
      </div>

      {/* Recent Fetches Summary */}
      <div
        onClick={() => onNavigate('history')}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Fetch Engine Health
          </span>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <PlayCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">
            {stats?.recentFetches?.length || 0}
          </span>
          <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
            Recent Runs
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Track success & error rates</p>
      </div>
    </div>
  );
};
