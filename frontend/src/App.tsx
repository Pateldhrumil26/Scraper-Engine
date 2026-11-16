import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Globe2,
  Calendar,
  History,
  FileSpreadsheet,
  Search,
  Plus,
  RefreshCw,
  Play,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Filter,
  Download,
  Trash2,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from './services/api';
import { WebsiteSource, Expo, FetchLog, DashboardStats, PaginationMeta, ExpoFilterState } from './types';
import { useToast } from './context/ToastContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'expos' | 'history'>('dashboard');
  const { success, error, info } = useToast();

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Sources State
  const [sources, setSources] = useState<WebsiteSource[]>([]);
  const [parsers, setParsers] = useState<{ key: string; name: string; description: string }[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<WebsiteSource | null>(null);

  // Source Form Fields
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceParserKey, setSourceParserKey] = useState('auto');
  const [sourceCategory, setSourceCategory] = useState('General Business');
  const [sourceScheduleCron, setSourceScheduleCron] = useState('0 0 * * *');
  const [sourceNotes, setSourceNotes] = useState('');
  const [testPreviewLoading, setTestPreviewLoading] = useState(false);
  const [testPreviewResult, setTestPreviewResult] = useState<any>(null);

  // Expos State
  const [expos, setExpos] = useState<Expo[]>([]);
  const [exposMeta, setExposMeta] = useState<PaginationMeta>({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [exposLoading, setExposLoading] = useState(false);
  const [selectedExpo, setSelectedExpo] = useState<Expo | null>(null);

  // Distinct Filters
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  // Expo Filters State
  const [filters, setFilters] = useState<ExpoFilterState>({
    search: '',
    industry: 'ALL',
    country: 'ALL',
    city: 'ALL',
    sourceId: 'ALL',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
    sortBy: 'startDate',
    sortOrder: 'asc',
    page: 1,
    limit: 12,
  });

  // History State
  const [historyLogs, setHistoryLogs] = useState<FetchLog[]>([]);
  const [historyMeta, setHistoryMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<FetchLog | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // Load Dashboard
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Sources
  const loadSources = useCallback(async () => {
    try {
      setSourcesLoading(true);
      const [srcs, prs] = await Promise.all([api.getSources(), api.getAvailableParsers()]);
      setSources(srcs);
      setParsers(prs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  // Load Expos
  const loadExpos = useCallback(async () => {
    try {
      setExposLoading(true);
      const res = await api.getExpos(filters);
      setExpos(res.data);
      setExposMeta(res.meta);
    } catch (err: any) {
      console.error(err);
    } finally {
      setExposLoading(false);
    }
  }, [filters]);

  // Load Filters
  const loadFilterOptions = useCallback(async () => {
    try {
      const res = await api.getExpoFilters();
      setAvailableIndustries(res.industries);
      setAvailableCountries(res.countries);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  // Load History
  const loadHistory = useCallback(async (page = 1) => {
    try {
      setHistoryLoading(true);
      const res = await api.getHistoryLogs(page, 15);
      setHistoryLogs(res.data);
      setHistoryMeta(res.meta);
    } catch (err: any) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadStats();
    loadSources();
    loadFilterOptions();
  }, [loadStats, loadSources, loadFilterOptions]);

  // Tab Change Effects
  useEffect(() => {
    if (activeTab === 'dashboard') loadStats();
    if (activeTab === 'sources') loadSources();
    if (activeTab === 'expos') loadExpos();
    if (activeTab === 'history') loadHistory(1);
  }, [activeTab, loadStats, loadSources, loadExpos, loadHistory]);

  // Trigger Single Fetch
  const handleFetchSource = async (sourceId: string) => {
    try {
      info('Fetching Started', 'Connecting to website and parsing expo records...');
      const res = await api.triggerSourceFetch(sourceId);
      if (res.success) {
        success('Fetch Completed', res.message);
      } else {
        info('Fetch Completed with Notes', res.message);
      }
      loadSources();
      loadStats();
    } catch (err: any) {
      error('Fetch Failed', err.response?.data?.message || err.message);
    }
  };

  // Trigger All Fetch
  const handleFetchAll = async () => {
    try {
      info('Global Fetch Initiated', 'Scraping all active sources in background...');
      await api.triggerFetchAll();
      success('Processing Active Sources', 'Records are being deduplicated and saved.');
      setTimeout(() => {
        loadSources();
        loadStats();
      }, 3500);
    } catch (err: any) {
      error('Fetch All Failed', err.message);
    }
  };

  // Toggle Source Active
  const handleToggleActive = async (sourceId: string) => {
    try {
      const updated = await api.toggleSourceActive(sourceId);
      setSources((prev) => prev.map((s) => (s._id === sourceId ? updated : s)));
      info(updated.active ? 'Source Activated' : 'Source Paused', updated.name);
    } catch (err: any) {
      error('Toggle Failed', err.message);
    }
  };

  // Delete Source
  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this website source?')) return;
    try {
      await api.deleteSource(sourceId);
      success('Source Deleted', 'Website source removed successfully.');
      loadSources();
      loadStats();
    } catch (err: any) {
      error('Delete Failed', err.message);
    }
  };

  // Open Edit Source Modal
  const openEditSource = (src: WebsiteSource) => {
    setEditingSource(src);
    setSourceName(src.name);
    setSourceUrl(src.url);
    setSourceParserKey(src.parserKey);
    setSourceCategory(src.category || 'General Business');
    setSourceScheduleCron(src.scheduleCron || '0 0 * * *');
    setSourceNotes(src.notes || '');
    setTestPreviewResult(null);
    setIsSourceModalOpen(true);
  };

  // Open Add Source Modal
  const openAddSource = () => {
    setEditingSource(null);
    setSourceName('');
    setSourceUrl('');
    setSourceParserKey('auto');
    setSourceCategory('General Business');
    setSourceScheduleCron('0 0 * * *');
    setSourceNotes('');
    setTestPreviewResult(null);
    setIsSourceModalOpen(true);
  };

  // Live Test Preview
  const handleTestPreview = async () => {
    if (!sourceUrl.trim()) {
      error('URL Required', 'Please enter a website target URL to test.');
      return;
    }
    try {
      setTestPreviewLoading(true);
      setTestPreviewResult(null);
      info('Testing Website', 'Connecting and detecting expos...');
      const res = await api.testSourcePreview({
        url: sourceUrl.trim(),
        parserKey: sourceParserKey,
      });
      setTestPreviewResult(res);
      if (res.totalFound > 0) {
        success('Expos Detected!', `Found ${res.totalFound} expos using ${res.parserUsed}!`);
      } else {
        info('No Expos Detected', 'Try checking the URL or specifying custom selectors.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setTestPreviewResult({ success: false, message: msg, totalFound: 0 });
      error('Test Failed', msg);
    } finally {
      setTestPreviewLoading(false);
    }
  };

  // Save Source
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim() || !sourceUrl.trim()) return;

    try {
      const payload = {
        name: sourceName.trim(),
        url: sourceUrl.trim(),
        parserKey: sourceParserKey === 'auto' ? 'generic' : sourceParserKey,
        category: sourceCategory.trim(),
        scheduleCron: sourceScheduleCron.trim(),
        notes: sourceNotes.trim(),
      };

      if (editingSource) {
        await api.updateSource(editingSource._id, payload);
        success('Source Updated', `Updated "${sourceName}" successfully.`);
      } else {
        await api.createSource(payload);
        success('Source Added', `Added "${sourceName}" to website sources.`);
      }
      setIsSourceModalOpen(false);
      loadSources();
      loadStats();
    } catch (err: any) {
      error('Save Failed', err.response?.data?.message || err.message);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await api.exportExcel(filters);
      success('Excel Downloaded', 'Exported business expos to Excel (.xlsx) file.');
    } catch (err: any) {
      error('Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to CSV
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
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
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'sources'
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              <span>Website Sources</span>
            </button>

            <button
              onClick={() => setActiveTab('expos')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'expos'
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Expo Listings</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Fetch History</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Expo Fetching Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">
                  MERN-powered scraping engine with website-specific parsers, validation, and deduplication
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={loadStats}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={openAddSource}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-600" />
                  <span>Add Source</span>
                </button>

                <button
                  onClick={handleFetchAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Fetch All Active</span>
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveTab('expos')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Business Expos
                  </span>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {stats?.totalExpos?.toLocaleString() || 0}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    Deduplicated
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Unique records in database</p>
              </div>

              <div
                onClick={() => setActiveTab('expos')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Upcoming Events
                  </span>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {stats?.upcomingExpos?.toLocaleString() || 0}
                  </span>
                  <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded-full">
                    Future Expos
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Happening in coming months</p>
              </div>

              <div
                onClick={() => setActiveTab('sources')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Website Sources
                  </span>
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Globe2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{stats?.totalSources || 0}</span>
                  <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                    {stats?.activeSources || 0} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Configured scraper endpoints</p>
              </div>

              <div
                onClick={() => setActiveTab('history')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recent Fetches
                  </span>
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <History className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {stats?.recentFetches?.length || 0}
                  </span>
                  <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                    Logged Runs
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Execution audit trail</p>
              </div>
            </div>

            {/* Flowchart Diagram Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
                  Data Extraction Architecture
                </span>
                <span className="text-xs text-slate-400">Node.js + Cheerio + Axios + MongoDB</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <div className="font-semibold text-brand-300">Website A/B/C</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Target URLs</div>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <div className="font-semibold text-indigo-300">Scraper Engine</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Fetch Coordinator</div>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <div className="font-semibold text-purple-300">Parsers</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Site Specific HTML</div>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <div className="font-semibold text-amber-300">Data Validation</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Zod Schema</div>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <div className="font-semibold text-emerald-300">Duplicate Check</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">SHA-256 Hash</div>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <div className="font-semibold text-cyan-300">MongoDB</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Mongoose DB</div>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <div className="font-semibold text-pink-300">React UI</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Export & Search</div>
                </div>
              </div>
            </div>

            {/* Upcoming Expos & Recent Fetches Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Expos */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Upcoming Business Expos</h3>
                    <p className="text-xs text-slate-500">Earliest upcoming global exhibitions</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('expos')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View All &rarr;
                  </button>
                </div>

                {stats?.upcomingList && stats.upcomingList.length > 0 ? (
                  <div className="space-y-3">
                    {stats.upcomingList.map((expo) => (
                      <div
                        key={expo._id}
                        onClick={() => setSelectedExpo(expo)}
                        className="p-3.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                              {expo.industry || 'Business'}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" />
                              {expo.city}{expo.country ? `, ${expo.country}` : ''}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-800 text-sm truncate">{expo.name}</h4>
                        </div>

                        <div className="text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                          {new Date(expo.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No upcoming expos found yet. Go to Website Sources and click "Fetch Now"!
                  </div>
                )}
              </div>

              {/* Recent Fetches */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Recent Fetch Operations</h3>
                    <p className="text-xs text-slate-500">Live operational execution logs</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View All &rarr;
                  </button>
                </div>

                {stats?.recentFetches && stats.recentFetches.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {stats.recentFetches.map((log) => (
                      <div
                        key={log._id}
                        onClick={() => setSelectedLog(log)}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                            {log.status === 'SUCCESS' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : log.status === 'PARTIAL' ? (
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 truncate">{log.sourceName}</h4>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {new Date(log.startTime).toLocaleTimeString()} • {log.durationMs}ms
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-emerald-600">+{log.newInserted} new</div>
                          <div className="text-[11px] text-slate-400">{log.duplicatesSkipped} duplicates</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No fetch history recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== WEBSITE SOURCES TAB ==================== */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website Sources Management</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Configure target URLs, modular parsers (EventsEye, TradeFairDates, BizTradeShows, Generic), and schedules
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={loadSources}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={openAddSource}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Website Source</span>
                </button>
              </div>
            </div>

            {/* Sources Grid */}
            {sourcesLoading ? (
              <div className="text-center py-16 text-slate-400 text-sm">Loading sources...</div>
            ) : sources.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <Globe2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No Website Sources Configured</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add target expo directories or event sites to start scraping real business expo records.
                </p>
                <div className="mt-4">
                  <button
                    onClick={openAddSource}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Source
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sources.map((source) => (
                  <div
                    key={source._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges & Actions */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              source.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {source.active ? 'Active' : 'Paused'}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-mono">
                            {source.parserKey}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditSource(source)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Source"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSource(source._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Source"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug mb-2">{source.name}</h3>

                      {/* URL Box */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Globe2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate flex-1 font-mono text-[11px]">{source.url}</span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:text-brand-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Schedule and fetched metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-100 mb-3">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Schedule</span>
                          <span className="font-mono text-slate-700">{source.scheduleCron || 'Manual'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Expos</span>
                          <span className="font-semibold text-slate-800">{source.totalFetchedCount || 0}</span>
                        </div>
                      </div>

                      {source.lastFetchedAt && (
                        <div className="text-[11px] text-slate-400 mb-3">
                          Last run: {new Date(source.lastFetchedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleToggleActive(source._id)}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        {source.active ? 'Pause' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleFetchSource(source._id)}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Fetch Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== EXPOS LISTINGS TAB ==================== */}
        {activeTab === 'expos' && (
          <div className="space-y-6">
            {/* Header with Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Expo Listings</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Search, multi-filter by industry, dates, and country, with instant Excel & CSV export
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={loadExpos}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by expo name, organizer, venue, city..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-500">
                  <span>Found {exposMeta.total} expos</span>
                </div>
              </div>

              {/* Dropdown Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Industry</label>
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters((prev) => ({ ...prev, industry: e.target.value, page: 1 }))}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-700"
                  >
                    <option value="ALL">All Industries</option>
                    {availableIndustries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Country</label>
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value, page: 1 }))}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-700"
                  >
                    <option value="ALL">All Countries</option>
                    {availableCountries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-700"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sort By</label>
                  <select
                    value={`${filters.sortBy}:${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sb, so] = e.target.value.split(':');
                      setFilters((prev) => ({ ...prev, sortBy: sb, sortOrder: so as 'asc' | 'desc', page: 1 }));
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-700"
                  >
                    <option value="startDate:asc">Date (Earliest First)</option>
                    <option value="startDate:desc">Date (Latest First)</option>
                    <option value="name:asc">Name (A-Z)</option>
                    <option value="createdAt:desc">Recently Added</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Expos Cards Grid */}
            {exposLoading ? (
              <div className="text-center py-16 text-slate-400 text-sm">Loading expos...</div>
            ) : expos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No expos found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search criteria or fetch data from Website Sources.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expos.map((expo) => (
                  <div
                    key={expo._id}
                    onClick={() => setSelectedExpo(expo)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                          {expo.industry || 'Trade'}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {expo.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">
                        {expo.name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{expo.organizer || 'Organized by Event Management'}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-xs flex items-center gap-2 text-slate-700">
                        <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="font-semibold">
                          {new Date(expo.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{expo.city}</span>
                        {expo.country && <span>, {expo.country}</span>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-mono uppercase">
                        {expo.sourceKey}
                      </span>

                      {expo.registrationUrl && (
                        <a
                          href={expo.registrationUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 font-semibold text-xs"
                        >
                          <span>Register</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {exposMeta.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">
                  Page {exposMeta.page} of {exposMeta.totalPages} ({exposMeta.total} records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={exposMeta.page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={exposMeta.page >= exposMeta.totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== FETCH HISTORY TAB ==================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fetch Execution History</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Audit trail tracking successful and failed fetching operations with execution metrics
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => loadHistory(1)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* History Table */}
            {historyLoading ? (
              <div className="text-center py-16 text-slate-400 text-sm">Loading logs...</div>
            ) : historyLogs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No Fetch History Yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Logs will appear here once scraper runs are executed.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Source Name</th>
                      <th className="py-3 px-4">Trigger</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">New Inserted</th>
                      <th className="py-3 px-4">Duplicates Skipped</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLogs.map((log) => (
                      <tr
                        key={log._id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{log.sourceName}</td>
                        <td className="py-3.5 px-4 text-slate-600 capitalize">{log.triggeredBy.toLowerCase()}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[11px] border ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">{log.durationMs}ms</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-semibold">+{log.newInserted}</td>
                        <td className="py-3.5 px-4 text-slate-500">{log.duplicatesSkipped}</td>
                        <td className="py-3.5 px-4 text-slate-500">{new Date(log.startTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================== SOURCE ADD/EDIT MODAL ==================== */}
      {isSourceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingSource ? 'Edit Website Source' : 'Add New Website Source'}
              </h3>
              <button onClick={() => setIsSourceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EventsEye Global Directory"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">Website URL *</label>
                  <button
                    type="button"
                    onClick={handleTestPreview}
                    disabled={testPreviewLoading || !sourceUrl.trim()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 disabled:opacity-40"
                  >
                    <span>{testPreviewLoading ? 'Testing...' : '⚡ Test & Auto-Detect Expos'}</span>
                  </button>
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://www.example.com/expos-list"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              {/* Live Test Preview Result Box */}
              {testPreviewResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    testPreviewResult.totalFound > 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {testPreviewResult.totalFound > 0
                        ? `✅ Success: Detected ${testPreviewResult.totalFound} expos!`
                        : '⚠️ No expos found on this URL'}
                    </span>
                    <span className="text-[10px] font-mono opacity-75">
                      Parser: {testPreviewResult.parserKey || 'Generic'}
                    </span>
                  </div>

                  {testPreviewResult.message && (
                    <p className="text-[11px] text-rose-700">{testPreviewResult.message}</p>
                  )}

                  {testPreviewResult.sampleItems && testPreviewResult.sampleItems.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-emerald-200/60 text-[11px]">
                      <span className="font-semibold block text-emerald-800">Preview Detected Events:</span>
                      {testPreviewResult.sampleItems.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="truncate">
                          • <span className="font-semibold">{item.name}</span>
                          {item.city ? ` (${item.city})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Parser</label>
                  <select
                    value={sourceParserKey}
                    onChange={(e) => setSourceParserKey(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="auto">Auto-Detect</option>
                    {parsers.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={sourceCategory}
                    onChange={(e) => setSourceCategory(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Schedule Cron</label>
                <input
                  type="text"
                  value={sourceScheduleCron}
                  onChange={(e) => setSourceScheduleCron(e.target.value)}
                  placeholder="0 0 * * *"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSourceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EXPO DETAILS MODAL ==================== */}
      {selectedExpo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                  {selectedExpo.industry || 'Business Expo'}
                </span>
                <h3 className="font-bold text-xl text-slate-900 mt-1">{selectedExpo.name}</h3>
              </div>
              <button onClick={() => setSelectedExpo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Start Date</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date(selectedExpo.startDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">End Date</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date(selectedExpo.endDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  {selectedExpo.venue ? `${selectedExpo.venue}, ` : ''}
                  {selectedExpo.city}
                  {selectedExpo.country ? `, ${selectedExpo.country}` : ''}
                </span>
              </div>
              <div className="text-slate-500">Organizer: {selectedExpo.organizer || 'Not Specified'}</div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 uppercase block mb-1">Description</span>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                {selectedExpo.description || 'No extended description available for this expo.'}
              </p>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl text-xs space-y-1">
              <span className="font-mono text-[10px] text-slate-500 block">Deduplication Hash:</span>
              <code className="text-[11px] font-mono text-slate-700 break-all">{selectedExpo.duplicateHash}</code>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {selectedExpo.registrationUrl ? (
                <a
                  href={selectedExpo.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : <div />}

              <button
                onClick={() => setSelectedExpo(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LOG DETAILS MODAL ==================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {selectedLog.status}
                </span>
                <h3 className="font-bold text-lg text-slate-900 mt-1">{selectedLog.sourceName}</h3>
                <span className="text-xs text-slate-400 font-mono">{selectedLog.sourceUrl}</span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Total Found</span>
                <span className="font-bold text-base text-slate-800">{selectedLog.totalFound}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <span className="text-emerald-600 block text-[10px]">New Inserted</span>
                <span className="font-bold text-base text-emerald-700">+{selectedLog.newInserted}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <span className="text-amber-600 block text-[10px]">Duplicates Skipped</span>
                <span className="font-bold text-base text-amber-700">{selectedLog.duplicatesSkipped}</span>
              </div>
            </div>

            {selectedLog.errorMessages && selectedLog.errorMessages.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <span className="font-bold uppercase text-[10px] block mb-1 text-rose-600">Error Details</span>
                {selectedLog.errorMessages.map((err, i) => (
                  <div key={i} className="font-medium">{err}</div>
                ))}
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-700 uppercase block mb-1">Execution Steps</span>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto space-y-1">
                {selectedLog.logMessages?.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
