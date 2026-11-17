import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  CalendarRange,
  History,
  Layers,
  X,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();

  const navItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      badge: null,
      exact: true,
    },
    {
      title: 'Website Sources',
      path: '/sources',
      icon: Globe2,
      badge: 'Live',
      exact: false,
    },
    {
      title: 'Expo Listings',
      path: '/expos',
      icon: CalendarRange,
      badge: null,
      exact: false,
    },
    {
      title: 'Fetch History',
      path: '/history',
      icon: History,
      badge: null,
      exact: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 shadow-lg lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-base tracking-tight text-slate-900 truncate">
                Scraper Engine
              </div>
              <div className="text-[11px] font-semibold text-brand-600 tracking-wide uppercase">
                Business Expos
              </div>
            </div>
          </NavLink>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-6">
          <div className="px-3 mb-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard')
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-brand-600' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
