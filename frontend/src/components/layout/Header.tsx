import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      return {
        title: 'Dashboard Overview',
        subtitle: 'Real-time metrics, recent fetches & upcoming Gujarat expos',
        tag: 'Live Monitoring',
      };
    }
    if (path.startsWith('/sources')) {
      return {
        title: 'Website Sources Management',
        subtitle: 'Configure target trade show directories, modular parsers & cron schedules',
        tag: 'Engine Config',
      };
    }
    if (path.startsWith('/expos/')) {
      return {
        title: 'Expo Details',
        subtitle: 'Full metadata, schedule breakdown, location & source attribution',
        tag: 'Detail View',
      };
    }
    if (path.startsWith('/expos')) {
      return {
        title: 'Business Expo Listings',
        subtitle: 'Search, multi-filter by location & dates with instant Excel & CSV export',
        tag: 'Database',
      };
    }
    if (path.startsWith('/history')) {
      return {
        title: 'Fetch History & Audit Logs',
        subtitle: 'Execution logs, duration, status reports & scraper diagnostics',
        tag: 'Diagnostics',
      };
    }
    return {
      title: 'Scraper Engine',
      subtitle: 'Gujarat Business Expo Scraper & Discovery System',
      tag: 'Platform',
    };
  };

  const pageInfo = getPageInfo();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {pageInfo.title}
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {pageInfo.tag}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Status Indicators */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Cron Schedule Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            <span>Cron: Every 6h</span>
          </div>

          {/* Current Date Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">{currentDate}</span>
            <span className="md:hidden">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Health Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Engine Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
