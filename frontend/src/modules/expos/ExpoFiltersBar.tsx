import React from 'react';
import { Search, RotateCcw, LayoutGrid, List, Calendar } from 'lucide-react';
import { ExpoFilterState } from '../../types';

interface ExpoFiltersBarProps {
  filters: ExpoFilterState;
  onChange: (newFilters: Partial<ExpoFilterState>) => void;
  onReset: () => void;
  industries: string[];
  countries: string[];
  viewMode: 'grid' | 'table';
  onToggleViewMode: (mode: 'grid' | 'table') => void;
}

export const ExpoFiltersBar: React.FC<ExpoFiltersBarProps> = ({
  filters,
  onChange,
  onReset,
  industries,
  countries,
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      {/* Search and Top Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, venue, city, organizer..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        {/* View mode toggle and reset */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
        {/* Industry Filter */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Industry</label>
          <select
            value={filters.industry}
            onChange={(e) => onChange({ industry: e.target.value, page: 1 })}
            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-brand-500 truncate"
          >
            <option value="ALL">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Country Filter */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Country</label>
          <select
            value={filters.country}
            onChange={(e) => onChange({ country: e.target.value, page: 1 })}
            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-brand-500 truncate"
          >
            <option value="ALL">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value, page: 1 })}
            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value, page: 1 })}
            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value, page: 1 })}
            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sort By</label>
          <select
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              onChange({ sortBy: sb, sortOrder: so as 'asc' | 'desc', page: 1 });
            }}
            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-brand-500"
          >
            <option value="startDate:asc">Date (Earliest First)</option>
            <option value="startDate:desc">Date (Latest First)</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="createdAt:desc">Recently Added</option>
          </select>
        </div>
      </div>
    </div>
  );
};
