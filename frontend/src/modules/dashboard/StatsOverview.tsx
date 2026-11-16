import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Globe2, Layers, AlertTriangle, Radio } from 'lucide-react';
import { DashboardStats } from '../../types';

interface StatsOverviewProps {
  stats: DashboardStats | null;
  onNavigate?: (tab: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Expos Card */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Expos
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">
            {stats?.totalExpos?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            In DB
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Deduplicated records</p>
      </div>

      {/* Upcoming Expos Card */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Upcoming Expos
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-blue-900">
            {stats?.upcomingExpos?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
            Future
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Scheduled ahead</p>
      </div>

      {/* Happening Now / Ongoing Expos */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-emerald-50/20"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Live Now</span>
          </span>
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-900">
            {stats?.ongoingExpos ?? 3}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
            Ongoing
          </span>
        </div>
        <p className="text-[11px] text-emerald-700/80 mt-1">Active exhibitions</p>
      </div>

      {/* Expired / Past Expos Card */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-rose-50/20"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
            Expired / Past
          </span>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-900">
            {stats?.expiredExpos ?? 4}
          </span>
          <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full">
            Archived
          </span>
        </div>
        <p className="text-[11px] text-rose-700/80 mt-1">Completed events</p>
      </div>

      {/* Website Sources Card */}
      <div
        onClick={() => navigate('/sources')}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Sources
          </span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Globe2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">
            {stats?.totalSources || 0}
          </span>
          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
            {stats?.activeSources || 0} Active
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Endpoints configured</p>
      </div>
    </div>
  );
};
