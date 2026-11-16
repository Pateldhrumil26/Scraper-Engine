import React from 'react';
import { Search, RotateCcw, LayoutGrid, List, Star, ShieldCheck } from 'lucide-react';
import { ExpoFilterState } from '../../types';

interface ExpoFiltersBarProps {
  filters: ExpoFilterState;
  onChange: (newFilters: Partial<ExpoFilterState>) => void;
  onReset: () => void;
  industries: string[];
  countries: string[];
  viewMode: 'grid' | 'table';
  onToggleViewMode: (mode: 'grid' | 'table') => void;
  totalCount: number;
}

export const ExpoFiltersBar: React.FC<ExpoFiltersBarProps> = ({
  filters,
  onChange,
  onReset,
  industries,
  countries,
  viewMode,
  onToggleViewMode,
  totalCount,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      {/* Quick Status Tabs (All, Upcoming, Ongoing, Expired, Favorites) */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs font-semibold flex-wrap">
          <button
            type="button"
            onClick={() => onChange({ status: 'ALL', isFavorite: undefined, page: 1 })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filters.status === 'ALL' && !filters.isFavorite
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Expos ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => onChange({ status: 'UPCOMING', isFavorite: undefined, page: 1 })}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              filters.status === 'UPCOMING'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span>Upcoming</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ status: 'ONGOING', isFavorite: undefined, page: 1 })}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              filters.status === 'ONGOING'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Happening Now</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ status: 'EXPIRED', isFavorite: undefined, page: 1 })}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              filters.status === 'EXPIRED'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Expired / Past</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({
                isFavorite: filters.isFavorite === 'true' ? undefined : 'true',
                page: 1,
              })
            }
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              filters.isFavorite === 'true'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <Star className={`w-3 h-3 ${filters.isFavorite === 'true' ? 'fill-white' : ''}`} />
            <span>Starred Favorites</span>
          </button>
        </div>

        {/* View mode toggle and reset */}
        <div className="flex items-center gap-2">
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

      {/* Search and Filter Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
        {/* Search Input */}
        <div className="relative md:col-span-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by expo name, organizer, venue, city..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        {/* Industry Filter */}
        <div className="md:col-span-2">
          <select
            value={filters.industry}
            onChange={(e) => onChange({ industry: e.target.value, page: 1 })}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-slate-700 truncate"
          >
            <option value="ALL">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Verification Status Filter */}
        <div className="md:col-span-2">
          <select
            value={filters.verificationStatus || 'ALL'}
            onChange={(e) => onChange({ verificationStatus: e.target.value, page: 1 })}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="ALL">All Verifications</option>
            <option value="VERIFIED">🛡️ Verified Only</option>
            <option value="UNVERIFIED">🟡 Unverified</option>
            <option value="FLAGGED">⚠️ Needs Review</option>
          </select>
        </div>

        {/* Country / City Filter */}
        <div className="md:col-span-2">
          <select
            value={filters.country}
            onChange={(e) => onChange({ country: e.target.value, page: 1 })}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-slate-700 truncate"
          >
            <option value="ALL">All Locations</option>
            <option value="India">India (Ahmedabad/Gandhinagar)</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="md:col-span-2">
          <select
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              onChange({ sortBy: sb, sortOrder: so as 'asc' | 'desc', page: 1 });
            }}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="startDate:asc">Date (Earliest First)</option>
            <option value="startDate:desc">Date (Latest First)</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="dataQualityScore:desc">Highest Quality</option>
            <option value="createdAt:desc">Recently Added</option>
          </select>
        </div>
      </div>
    </div>
  );
};
