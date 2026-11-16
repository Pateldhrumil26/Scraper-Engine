import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, Globe2, Calendar, History } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-brand-800 to-indigo-900 bg-clip-text text-transparent">
              Scraper Engine
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Business Expos
            </span>
          </div>
        </NavLink>

        {/* Navigation Links with React Router */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            <Layers className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/sources"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            <Globe2 className="w-4 h-4" />
            <span>Website Sources</span>
          </NavLink>

          <NavLink
            to="/expos"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            <Calendar className="w-4 h-4" />
            <span>Expo Listings</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            <History className="w-4 h-4" />
            <span>Fetch History</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
