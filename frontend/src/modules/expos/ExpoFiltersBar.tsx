import React from 'react';
import { Search, RotateCcw, LayoutGrid, List, MapPin, Briefcase, ArrowUpDown } from 'lucide-react';
import { ExpoFilterState } from '../../types';
import { CustomSelect, SelectOption } from '../../components/common/CustomSelect';

interface ExpoFiltersBarProps {
  filters: ExpoFilterState;
  onChange: (newFilters: Partial<ExpoFilterState>) => void;
  onReset: () => void;
  industries: string[];
  cities?: string[];
  countries?: string[];
  viewMode: 'grid' | 'table';
  onToggleViewMode: (mode: 'grid' | 'table') => void;
  totalCount: number;
}

const DEFAULT_GUJARAT_CITIES = [
  'Ahmedabad',
  'Gandhinagar',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Patan',
  'Morbi',
  'Bhavnagar',
  'Jamnagar',
  'Anand',
  'Bharuch',
  'Vapi',
  'Mehsana',
  'Kutch',
  'Bhuj',
  'Gandhidham',
  'Junagadh',
  'Surendranagar',
  'Navsari',
  'Valsad',
  'Porbandar',
  'Amreli',
  'Botad',
  'Dahod',
  'Godhra',
  'Palanpur',
  'Nadiad',
];

const GUJARAT_VALID_SET = new Set(DEFAULT_GUJARAT_CITIES.map((c) => c.toLowerCase()));

export const ExpoFiltersBar: React.FC<ExpoFiltersBarProps> = ({
  filters,
  onChange,
  onReset,
  industries,
  cities = [],
  viewMode,
  onToggleViewMode,
  totalCount,
}) => {
  // Filter out non-Gujarat locations like Shanghai, Pune, Bengaluru, Coimbatore, Chennai
  const rawCityList = cities.length > 0 ? cities : DEFAULT_GUJARAT_CITIES;
  const gujaratCities = Array.from(
    new Set(
      rawCityList.filter((c) => GUJARAT_VALID_SET.has(c.toLowerCase().trim()))
    )
  ).sort();

  // Industry Options
  const industryOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Industries' },
    ...industries.map((ind) => ({
      value: ind,
      label: ind,
    })),
  ];

  // Location Options (strictly Gujarat)
  const locationOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Gujarat Locations' },
    ...gujaratCities.map((c) => ({
      value: c,
      label: c,
      icon: <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
    })),
  ];

  // Sort Options
  const sortOptions: SelectOption[] = [
    { value: 'startDate:asc', label: 'Date (Earliest First)' },
    { value: 'startDate:desc', label: 'Date (Latest First)' },
    { value: 'name:asc', label: 'Name (A-Z)' },
    { value: 'dataQualityScore:desc', label: 'Highest Quality' },
    { value: 'createdAt:desc', label: 'Recently Added' },
  ];

  const currentSortValue = `${filters.sortBy}:${filters.sortOrder}`;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      {/* Quick Status Tabs (All, Upcoming, Ongoing, Expired) */}
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
        </div>

        {/* View Mode & Reset Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-brand-600 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-brand-600 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Search and Dropdown Filter Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 text-xs">
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

        {/* Custom Industry Dropdown */}
        <div className="md:col-span-3">
          <CustomSelect
            value={filters.industry}
            onChange={(val) => onChange({ industry: val, page: 1 })}
            options={industryOptions}
            placeholder="All Industries"
            icon={<Briefcase className="w-3.5 h-3.5" />}
            searchable={true}
          />
        </div>

        {/* Custom Gujarat Location Dropdown */}
        <div className="md:col-span-3">
          <CustomSelect
            value={filters.city || 'ALL'}
            onChange={(val) => onChange({ city: val, country: 'ALL', page: 1 })}
            options={locationOptions}
            placeholder="All Gujarat Locations"
            icon={<MapPin className="w-3.5 h-3.5 text-rose-500" />}
            searchable={true}
          />
        </div>

        {/* Custom Sort By Dropdown */}
        <div className="md:col-span-2">
          <CustomSelect
            value={currentSortValue}
            onChange={(val) => {
              const [sb, so] = val.split(':');
              onChange({ sortBy: sb, sortOrder: so as 'asc' | 'desc', page: 1 });
            }}
            options={sortOptions}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          />
        </div>
      </div>
    </div>
  );
};
