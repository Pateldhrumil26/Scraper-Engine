import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, History, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react';
import { api } from '../services/api';
import { FetchLog, PaginationMeta } from '../types';
import { Spinner } from '../components/common/Spinner';

export const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<FetchLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<FetchLog | null>(null);

  const loadHistory = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await api.getHistoryLogs(page, 15);
      setLogs(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fetch Execution History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit trail tracking successful and failed fetching operations with execution metrics
          </p>
        </div>

        <button
          onClick={() => loadHistory(1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <Spinner size="lg" text="Loading fetch logs..." className="h-64" />
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Fetch History Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Logs will appear here once scraper runs are executed.</p>
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
              {logs.map((log) => (
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

      {/* Log Modal */}
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
};
