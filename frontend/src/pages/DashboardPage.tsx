import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Play, Plus, FileSpreadsheet, Database } from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, Expo } from '../types';
import { StatsOverview } from '../modules/dashboard/StatsOverview';
import { UpcomingExposWidget } from '../modules/dashboard/UpcomingExposWidget';
import { RecentFetchesWidget } from '../modules/dashboard/RecentFetchesWidget';
import { IndustryDistributionWidget } from '../modules/dashboard/IndustryDistributionWidget';
import { NewlyDiscoveredWidget } from '../modules/dashboard/NewlyDiscoveredWidget';
import { ExpoDetailModal } from '../modules/expos/ExpoDetailModal';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [selectedExpo, setSelectedExpo] = useState<Expo | null>(null);
  const { success, error, info } = useToast();

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      error('Failed to load dashboard statistics', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleFetchAll = async () => {
    try {
      setIsFetchingAll(true);
      info('Global Fetch Started', 'Scraping all active expo sources...');
      await api.triggerFetchAll();
      success('Processing Active Sources', 'Records are being deduplicated and saved.');
      setTimeout(loadStats, 4000);
    } catch (err: any) {
      error('Failed to trigger global fetch', err.message);
    } finally {
      setIsFetchingAll(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await api.createBackup();
      success('Backup Created', `Saved snapshot ${res.filename} (${res.totalExpos} expos).`);
    } catch (err: any) {
      error('Backup Failed', err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Expo Fetching Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time scraping engine, deduplication and Ahmedabad, Gandhinagar & global expo management
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors disabled:opacity-50"
            title="Create JSON snapshot backup of MongoDB database"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isBackingUp ? 'Backing up...' : 'Backup DB'}</span>
          </button>

          <button
            onClick={() => navigate('/sources')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-brand-600" />
            <span>Manage Sources</span>
          </button>

          <button
            onClick={() => navigate('/expos')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Expos</span>
          </button>

          <button
            onClick={handleFetchAll}
            disabled={isFetchingAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isFetchingAll ? 'Fetching...' : 'Fetch All Active'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards (6 KPI tiles) */}
      <StatsOverview stats={stats} />

      {/* Newly Discovered Expos & Upcoming Expos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewlyDiscoveredWidget
          expos={stats?.newlyDiscoveredList || []}
          onViewAll={() => navigate('/expos')}
          onSelectExpo={(expo) => setSelectedExpo(expo)}
        />

        <UpcomingExposWidget
          expos={stats?.upcomingList || []}
          onViewAll={() => navigate('/expos')}
          onSelectExpo={(expo) => setSelectedExpo(expo)}
        />
      </div>

      {/* Recent Fetches & Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentFetchesWidget
          logs={stats?.recentFetches || []}
          onViewAll={() => navigate('/history')}
          onSelectLog={() => navigate('/history')}
        />

        <IndustryDistributionWidget
          industryStats={stats?.industryStats || []}
          countryStats={stats?.countryStats || []}
        />
      </div>

      {/* Expo Detail Modal */}
      <ExpoDetailModal
        isOpen={!!selectedExpo}
        expo={selectedExpo}
        onClose={() => setSelectedExpo(null)}
      />
    </div>
  );
};
