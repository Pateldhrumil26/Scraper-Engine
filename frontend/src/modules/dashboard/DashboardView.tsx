import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Play, Plus, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';
import { DashboardStats, Expo, FetchLog } from '../../types';
import { StatsOverview } from './StatsOverview';
import { RecentFetchesWidget } from './RecentFetchesWidget';
import { UpcomingExposWidget } from './UpcomingExposWidget';
import { IndustryDistributionWidget } from './IndustryDistributionWidget';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenAddSource: () => void;
  onOpenExport: () => void;
  onSelectExpo: (expo: Expo) => void;
  onSelectLog: (log: FetchLog) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddSource,
  onOpenExport,
  onSelectExpo,
  onSelectLog,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const { success, error } = useToast();

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
      await api.triggerFetchAll();
      success('Global Fetch Started', 'Scraper engine has initiated fetching across all active sources in background.');
      setTimeout(loadStats, 4000);
    } catch (err: any) {
      error('Failed to trigger global fetch', err.message);
    } finally {
      setIsFetchingAll(false);
    }
  };

  if (isLoading && !stats) {
    return <Spinner size="lg" text="Loading dashboard metrics..." className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Expo Fetching Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time scraping engine, deduplication and global expo listings management
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExport}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAddSource}
            leftIcon={<Plus className="w-3.5 h-3.5 text-brand-600" />}
          >
            Add Source
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleFetchAll}
            isLoading={isFetchingAll}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            Fetch All Active
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <StatsOverview stats={stats} onNavigate={onNavigate} />

      {/* Grid: Upcoming Expos & Recent Fetches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingExposWidget
          expos={stats?.upcomingList || []}
          onViewAll={() => onNavigate('expos')}
          onSelectExpo={onSelectExpo}
        />

        <RecentFetchesWidget
          logs={stats?.recentFetches || []}
          onViewAll={() => onNavigate('history')}
          onSelectLog={onSelectLog}
        />
      </div>

      {/* Distribution Charts / Bars */}
      <IndustryDistributionWidget
        industryStats={stats?.industryStats || []}
        countryStats={stats?.countryStats || []}
      />
    </div>
  );
};
