import React, { useState } from 'react';
import { Play, Globe, ExternalLink, Edit2, Trash2, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { WebsiteSource } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

interface SourceCardProps {
  source: WebsiteSource;
  onEdit: (source: WebsiteSource) => void;
  onDelete: (source: WebsiteSource) => void;
  onToggleActive: (sourceId: string) => void;
  onFetchNow: (sourceId: string) => Promise<void>;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  source,
  onEdit,
  onDelete,
  onToggleActive,
  onFetchNow,
}) => {
  const [isFetching, setIsFetching] = useState(false);

  const handleFetch = async () => {
    try {
      setIsFetching(true);
      await onFetchNow(source._id);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Header with Title and Active Toggle */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={source.active ? 'success' : 'slate'} size="sm" dot>
                {source.active ? 'Active' : 'Paused'}
              </Badge>
              <Badge variant="indigo" size="sm">
                {source.parserKey.toUpperCase()}
              </Badge>
              {source.category && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {source.category}
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-snug">{source.name}</h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(source)}
              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit Source"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(source)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Source"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Target URL */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate flex-1 font-mono">{source.url}</span>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-brand-600 hover:text-brand-700"
            title="Open Target URL"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Schedule & Stats info */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-100 mb-4">
          <div>
            <span className="text-slate-400 block mb-0.5">Schedule (Cron)</span>
            <div className="flex items-center gap-1 font-mono text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{source.scheduleCron || 'Manual'}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Total Fetched</span>
            <span className="font-semibold text-slate-800">
              {source.totalFetchedCount || 0} expos
            </span>
          </div>
        </div>

        {/* Last run status */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {source.lastFetchedAt
                ? `Last: ${new Date(source.lastFetchedAt).toLocaleString()}`
                : 'Never fetched'}
            </span>
          </div>

          {source.lastStatus && (
            <Badge
              variant={
                source.lastStatus === 'SUCCESS'
                  ? 'success'
                  : source.lastStatus === 'RUNNING'
                  ? 'brand'
                  : source.lastStatus === 'PARTIAL'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
            >
              {source.lastStatus}
            </Badge>
          )}
        </div>

        {source.lastError && (
          <div className="mb-4 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="truncate">{source.lastError}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          variant={source.active ? 'outline' : 'secondary'}
          size="sm"
          className="flex-1"
          onClick={() => onToggleActive(source._id)}
        >
          {source.active ? 'Pause Schedule' : 'Activate'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          isLoading={isFetching}
          onClick={handleFetch}
          leftIcon={<Play className="w-3.5 h-3.5" />}
        >
          Fetch Now
        </Button>
      </div>
    </div>
  );
};
