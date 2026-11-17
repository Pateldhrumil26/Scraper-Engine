import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Layers, AlertTriangle, Radio } from 'lucide-react';
import { DashboardStats } from '../../types';

interface StatsOverviewProps {
  stats: DashboardStats | null;
  onNavigate?: (tab: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Expos Card */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
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
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {stats?.totalExpos?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            In DB
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Deduplicated records</p>
      </div>

      {/* Upcoming Expos Card */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Upcoming
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-blue-900 tracking-tight">
            {stats?.upcomingExpos?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            Future
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Scheduled ahead</p>
      </div>

      {/* Live / Ongoing Expos */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-emerald-50/20"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Now</span>
          </span>
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-900 tracking-tight">
            {stats?.ongoingExpos ?? 0}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
            Active
          </span>
        </div>
        <p className="text-xs text-emerald-700/80 mt-1">Happening today</p>
      </div>

      {/* Expired / Past Expos */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
            Past Expos
          </span>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-900 tracking-tight">
            {stats?.expiredExpos ?? 0}
          </span>
          <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
            Archive
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Completed events</p>
      </div>
    </div>
  );
};
