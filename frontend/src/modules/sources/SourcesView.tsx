import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Play, Globe } from 'lucide-react';
import { api } from '../../services/api';
import { WebsiteSource } from '../../types';
import { SourceCard } from './SourceCard';
import { SourceModal } from './SourceModal';
import { DeleteSourceDialog } from './DeleteSourceDialog';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

interface SourcesViewProps {
  onRefreshStats?: () => void;
}

export const SourcesView: React.FC<SourcesViewProps> = ({ onRefreshStats }) => {
  const [sources, setSources] = useState<WebsiteSource[]>([]);
  const [parsers, setParsers] = useState<{ key: string; name: string; description: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<WebsiteSource | null>(null);
  const [deletingSource, setDeletingSource] = useState<WebsiteSource | null>(null);

  const { success, error, info } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sourcesData, parsersData] = await Promise.all([
        api.getSources(),
        api.getAvailableParsers(),
      ]);
      setSources(sourcesData);
      setParsers(parsersData);
    } catch (err: any) {
      error('Failed to load website sources', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSource = async (formData: Partial<WebsiteSource>) => {
    try {
      if (editingSource) {
        await api.updateSource(editingSource._id, formData);
        success('Source Updated', `Updated "${formData.name}" successfully.`);
      } else {
        await api.createSource(formData);
        success('Source Created', `Added "${formData.name}" to scraping sources.`);
      }
      loadData();
      onRefreshStats?.();
    } catch (err: any) {
      error('Save Failed', err.response?.data?.message || err.message);
      throw err;
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await api.deleteSource(sourceId);
      success('Source Deleted', 'The website source was removed successfully.');
      loadData();
      onRefreshStats?.();
    } catch (err: any) {
      error('Delete Failed', err.message);
      throw err;
    }
  };

  const handleToggleActive = async (sourceId: string) => {
    try {
      const updated = await api.toggleSourceActive(sourceId);
      setSources((prev) => prev.map((s) => (s._id === sourceId ? updated : s)));
      info(
        updated.active ? 'Source Activated' : 'Source Paused',
        `Scheduled fetching for "${updated.name}" is now ${updated.active ? 'active' : 'paused'}.`
      );
      onRefreshStats?.();
    } catch (err: any) {
      error('Failed to toggle status', err.message);
    }
  };

  const handleFetchNow = async (sourceId: string) => {
    try {
      info('Fetching Started', 'Scraping and processing records in real-time...');
      const res = await api.triggerSourceFetch(sourceId);
      if (res.success) {
        success('Fetch Succeeded', res.message);
      } else {
        error('Fetch Finished with Warnings', res.message);
      }
      loadData();
      onRefreshStats?.();
    } catch (err: any) {
      error('Fetch Failed', err.response?.data?.message || err.message);
    }
  };

  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.url.toLowerCase().includes(search.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.active) ||
      (statusFilter === 'PAUSED' && !s.active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website Sources Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure target expo websites, modular parsers, and cron schedules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingSource(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add New Source
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sources by name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'ALL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({sources.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'ACTIVE' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({sources.filter((s) => s.active).length})
            </button>
            <button
              onClick={() => setStatusFilter('PAUSED')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'PAUSED' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paused ({sources.filter((s) => !s.active).length})
            </button>
          </div>
        </div>
      </div>

      {/* Sources Grid */}
      {isLoading ? (
        <Spinner size="lg" text="Loading website sources..." className="h-64" />
      ) : filteredSources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No website sources found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'No sources matched your search filter.' : 'Get started by adding your first business expo website source.'}
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingSource(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Source
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSources.map((source) => (
            <SourceCard
              key={source._id}
              source={source}
              onEdit={(src) => {
                setEditingSource(src);
                setIsModalOpen(true);
              }}
              onDelete={(src) => setDeletingSource(src)}
              onToggleActive={handleToggleActive}
              onFetchNow={handleFetchNow}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Source Modal */}
      <SourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSource}
        source={editingSource}
        parsers={parsers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteSourceDialog
        isOpen={!!deletingSource}
        source={deletingSource}
        onClose={() => setDeletingSource(null)}
        onConfirm={handleDeleteSource}
      />
    </div>
  );
};
