import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Globe2, Layers, AlertTriangle, Radio, Star, ShieldAlert } from 'lucide-react';
import { DashboardStats } from '../../types';

interface StatsOverviewProps {
  stats: DashboardStats | null;
  onNavigate?: (tab: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* Total Expos Card */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Expos
          </span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-slate-900">
            {stats?.totalExpos?.toLocaleString() || 0}
          </span>
          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-full">
            In DB
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Deduplicated records</p>
      </div>

      {/* Upcoming Expos Card */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Upcoming
          </span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-blue-900">
            {stats?.upcomingExpos?.toLocaleString() || 0}
          </span>
          <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded-full">
            Future
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Scheduled ahead</p>
      </div>

      {/* Live / Ongoing Expos */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-emerald-50/20"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Now</span>
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Radio className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-emerald-900">
            {stats?.ongoingExpos ?? 3}
          </span>
          <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded-full">
            Active
          </span>
        </div>
        <p className="text-[10px] text-emerald-700/80 mt-1">Happening today</p>
      </div>

      {/* Requiring Verification */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-amber-50/20"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Needs Review
          </span>
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-amber-900">
            {stats?.unverifiedCount ?? 0}
          </span>
          <span className="text-[9px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded-full">
            Review
          </span>
        </div>
        <p className="text-[10px] text-amber-700/80 mt-1">Pending verification</p>
      </div>

      {/* Starred Favorites */}
      <div
        onClick={() => navigate('/expos')}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Favorites
          </span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-slate-900">
            {stats?.favoritesCount ?? 0}
          </span>
          <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded-full">
            Starred
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Important events</p>
      </div>

      {/* Website Sources & Health */}
      <div
        onClick={() => navigate('/sources')}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Sources
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Globe2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-slate-900">
            {stats?.totalSources || 0}
          </span>
          <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded-full">
            {stats?.activeSources || 0} Active
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {stats?.sourceHealth?.healthy ?? stats?.activeSources ?? 0} Healthy
        </p>
      </div>
    </div>
  );
};
