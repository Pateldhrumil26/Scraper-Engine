import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Building,
  ExternalLink,
  Clock,
  AlertTriangle,
  ArrowRight,
  Star,
  AlertCircle,
} from 'lucide-react';
import { Expo } from '../../types';
import { getEventStatusInfo } from '../../utils/dateUtils';
import { api } from '../../services/api';

interface ExpoCardProps {
  expo: Expo;
  onSelect?: (expo: Expo) => void;
  onExpoUpdated?: (updated: Expo) => void;
}

export const ExpoCard: React.FC<ExpoCardProps> = ({ expo, onSelect, onExpoUpdated }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(expo.isFavorite || false);
  const [isUpdatingFav, setIsUpdatingFav] = useState(false);

  const statusInfo = getEventStatusInfo(expo.startDate, expo.endDate);

  const handleClick = () => {
    if (onSelect) {
      onSelect(expo);
    } else {
      navigate(`/expos/${expo._id}`);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsUpdatingFav(true);
      const res = await api.toggleExpoFavorite(expo._id);
      setIsFavorite(res.isFavorite);
      if (onExpoUpdated) onExpoUpdated(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingFav(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group p-5 shadow-sm hover:shadow-md relative ${
        statusInfo.isExpired
          ? 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300'
          : statusInfo.isOngoing
          ? 'border-emerald-300 hover:border-emerald-500 ring-1 ring-emerald-200 bg-emerald-50/10'
          : 'border-slate-200 hover:border-brand-400'
      }`}
    >
      <div>
        {/* Top Badges & Favorite Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 truncate max-w-[150px]">
              {expo.industry || 'Business Expo'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status Badge */}
            {statusInfo.isExpired ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>EXPIRED</span>
              </span>
            ) : statusInfo.isOngoing ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>LIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>UPCOMING</span>
              </span>
            )}

            {/* Favorite Star Button */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={isUpdatingFav}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                  : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expo Name */}
        <h3
          className={`font-bold text-base leading-snug line-clamp-2 mb-2 transition-colors ${
            statusInfo.isExpired ? 'text-slate-700' : 'text-slate-900 group-hover:text-brand-600'
          }`}
        >
          {expo.name}
        </h3>

        {/* Organizer */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{expo.organizer || 'Trade Network Organizer'}</span>
        </div>

        {/* Event Dates & Expiry/Countdown Box */}
        <div
          className={`p-3 rounded-xl border mb-3 text-xs space-y-1.5 ${
            statusInfo.isExpired
              ? 'bg-rose-50/60 border-rose-200 text-rose-950'
              : statusInfo.isOngoing
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-blue-50/50 border-blue-100 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Calendar
                className={`w-3.5 h-3.5 shrink-0 ${
                  statusInfo.isExpired
                    ? 'text-rose-500'
                    : statusInfo.isOngoing
                    ? 'text-emerald-600'
                    : 'text-brand-600'
                }`}
              />
              <span>
                {statusInfo.startDateFormatted}
                {statusInfo.startDateFormatted !== statusInfo.endDateFormatted
                  ? ` – ${statusInfo.endDateFormatted}`
                  : ''}
              </span>
            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/90 border border-slate-200/60 text-slate-600 font-semibold shadow-xs">
              {statusInfo.durationDays} {statusInfo.durationDays === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 text-[11px] font-semibold ${
              statusInfo.isExpired
                ? 'text-rose-700'
                : statusInfo.isOngoing
                ? 'text-emerald-700 font-bold'
                : 'text-blue-700'
            }`}
          >
            {statusInfo.isExpired ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : statusInfo.isOngoing ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            )}
            <span>{statusInfo.timeDescription}</span>
          </div>
        </div>

        {/* Location & City */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="font-semibold text-slate-800">{expo.city}</span>
          {expo.country && <span>, {expo.country}</span>}
          {expo.venue && expo.venue !== 'Exhibition Center' && (
            <span className="text-slate-400 text-[11px] truncate ml-1">({expo.venue})</span>
          )}
        </div>

        {/* Missing Fields Warning (if any) */}
        {expo.missingFields && expo.missingFields.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50/70 px-2 py-0.5 rounded-md border border-amber-200/60 mb-3 truncate">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Missing: {expo.missingFields.slice(0, 3).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Footer: Quality Score + Dedicated Route Link + Registration Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {expo.dataQualityScore ?? 80}% Quality
          </span>
          <span className="text-[10px] text-slate-400 font-mono uppercase">
            {expo.sourceKey}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            to={`/expos/${expo._id}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          {expo.registrationUrl && (
            <a
              href={expo.registrationUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                statusInfo.isExpired
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  : 'text-brand-600 hover:text-brand-800 hover:bg-brand-50'
              }`}
            >
              <span>{statusInfo.isExpired ? 'Archive' : 'Register'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
