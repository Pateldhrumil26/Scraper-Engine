import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Download,
  FileSpreadsheet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Expo, PaginationMeta, ExpoFilterState } from '../types';
import { ExpoFiltersBar } from '../modules/expos/ExpoFiltersBar';
import { ExpoCard } from '../modules/expos/ExpoCard';
import { ExpoTable } from '../modules/expos/ExpoTable';
import { ExpoDetailModal } from '../modules/expos/ExpoDetailModal';
import { ExpoModal } from '../modules/expos/ExpoModal';
import { Spinner } from '../components/common/Spinner';
import { useToast } from '../context/ToastContext';

export const ExposPage: React.FC = () => {
  const navigate = useNavigate();
  const [expos, setExpos] = useState<Expo[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedExpo, setSelectedExpo] = useState<Expo | null>(null);

  // Manual Creation / Edit Modal
  const [isExpoModalOpen, setIsExpoModalOpen] = useState(false);
  const [editingExpo, setEditingExpo] = useState<Expo | null>(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Filter options
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [filters, setFilters] = useState<ExpoFilterState>({
    search: '',
    industry: 'ALL',
    country: 'ALL',
    city: 'ALL',
    sourceId: 'ALL',
    status: 'ALL',
    verificationStatus: 'ALL',
    isFavorite: undefined,
    dateFrom: '',
    dateTo: '',
    sortBy: 'startDate',
    sortOrder: 'asc',
    page: 1,
    limit: 12,
  });

  const { success, error, info } = useToast();

  const loadExpos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getExpos(filters);
      setExpos(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      error('Failed to load expos', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, error]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const res = await api.getExpoFilters();
      setAvailableIndustries(res.industries);
      setAvailableCountries(res.countries);
      setAvailableCities(res.cities || []);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadExpos();
  }, [loadExpos]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      industry: 'ALL',
      country: 'ALL',
      city: 'ALL',
      sourceId: 'ALL',
      status: 'ALL',
      verificationStatus: 'ALL',
      isFavorite: undefined,
      dateFrom: '',
      dateTo: '',
      sortBy: 'startDate',
      sortOrder: 'asc',
      page: 1,
      limit: 12,
    });
    setSelectedIds([]);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await api.exportExcel(filters);
      success('Excel Downloaded', 'Exported business expos to formatted Excel (.xlsx) file.');
    } catch (err: any) {
      error('Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await api.exportCsv(filters);
      success('CSV Downloaded', 'Exported business expos to CSV file.');
    } catch (err: any) {
      error('Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedIds(expos.map((e) => e._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected expos?`)) {
      return;
    }
    try {
      setIsBulkLoading(true);
      await api.bulkDeleteExpos(selectedIds);
      success('Bulk Deleted', `Deleted ${selectedIds.length} expos.`);
      setSelectedIds([]);
      loadExpos();
    } catch (err: any) {
      error('Bulk Delete Failed', err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Single Expo Updates
  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await api.toggleExpoFavorite(id);
      setExpos((prev) =>
        prev.map((e) => (e._id === id ? { ...e, isFavorite: res.isFavorite } : e))
      );
    } catch (err: any) {
      error('Failed to toggle favorite', err.message);
    }
  };

  const handleSaveExpo = async (formData: Partial<Expo>) => {
    try {
      if (editingExpo) {
        await api.updateExpo(editingExpo._id, formData);
        success('Expo Updated', `Saved changes to "${formData.name}".`);
      } else {
        await api.createExpo(formData);
        success('Expo Created', `Manually registered "${formData.name}".`);
      }
      loadExpos();
    } catch (err: any) {
      error('Save Failed', err.response?.data?.message || err.message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Expo Listings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, multi-filter by location, dates with instant Excel & CSV export
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadExpos}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Bulk Selection Floating Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-brand-900 text-white p-3 rounded-2xl shadow-lg flex items-center justify-between flex-wrap gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold px-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{selectedIds.length} expos selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isBulkLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar with Status Tabs & Expiry Filters */}
      <ExpoFiltersBar
        filters={filters}
        onChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onReset={handleResetFilters}
        industries={availableIndustries}
        cities={availableCities}
        countries={availableCountries}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        totalCount={meta.total}
      />

      {/* Content: Cards or Table */}
      {isLoading ? (
        <Spinner size="lg" text="Loading business expos..." className="h-64" />
      ) : expos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No expos found matching filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try switching status to "All Expos" or clearing your date/location filters.
          </p>
          <div className="mt-4">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expos.map((expo) => (
            <ExpoCard
              key={expo._id}
              expo={expo}
              onSelect={(e: Expo) => setSelectedExpo(e)}
              onExpoUpdated={(updated) => {
                setExpos((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
              }}
            />
          ))}
        </div>
      ) : (
        <ExpoTable
          expos={expos}
          onSelect={(e: Expo) => setSelectedExpo(e)}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">
            Showing Page <span className="font-semibold text-slate-800">{meta.page}</span> of{' '}
            <span className="font-semibold text-slate-800">{meta.totalPages}</span> ({meta.total} records)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={meta.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={meta.page >= meta.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Expo Detail Modal */}
      <ExpoDetailModal
        isOpen={!!selectedExpo}
        expo={selectedExpo}
        onClose={() => setSelectedExpo(null)}
      />

      {/* Manual Add / Edit Expo Modal */}
      <ExpoModal
        isOpen={isExpoModalOpen}
        expo={editingExpo}
        onClose={() => {
          setIsExpoModalOpen(false);
          setEditingExpo(null);
        }}
        onSave={handleSaveExpo}
      />
    </div>
  );
};
