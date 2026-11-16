import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  Globe,
  ExternalLink,
  Hash,
  Clock,
  AlertTriangle,
  Check,
  Copy,
  Star,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Edit,
  History,
} from 'lucide-react';
import { api } from '../services/api';
import { Expo } from '../types';
import { getEventStatusInfo } from '../utils/dateUtils';
import { Spinner } from '../components/common/Spinner';
import { ExpoModal } from '../modules/expos/ExpoModal';
import { useToast } from '../context/ToastContext';

export const ExpoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expo, setExpo] = useState<Expo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { success, error } = useToast();

  const loadExpo = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await api.getExpoById(id);
      setExpo(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Expo not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpo();
  }, [id]);

  if (isLoading) {
    return <Spinner size="lg" text="Loading expo details..." className="h-96" />;
  }

  if (errorMsg || !expo) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">{errorMsg || 'Expo not found'}</h2>
        <button
          onClick={() => navigate('/expos')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Expo Listings</span>
        </button>
      </div>
    );
  }

  const statusInfo = getEventStatusInfo(expo.startDate, expo.endDate);

  const copyHash = () => {
    navigator.clipboard.writeText(expo.duplicateHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = async () => {
    try {
      const res = await api.toggleExpoFavorite(expo._id);
      setExpo((prev) => (prev ? { ...prev, isFavorite: res.isFavorite } : null));
      success('Favorite Updated', res.isFavorite ? 'Added to favorites.' : 'Removed from favorites.');
    } catch (err: any) {
      error('Failed to toggle favorite', err.message);
    }
  };

  const handleUpdateVerification = async (newStatus: string) => {
    try {
      const updated = await api.updateExpoVerification(expo._id, newStatus);
      setExpo(updated);
      success('Verification Updated', `Expo is now marked as ${newStatus}.`);
    } catch (err: any) {
      error('Failed to update verification', err.message);
    }
  };

  const handleSaveEdit = async (formData: Partial<Expo>) => {
    try {
      const updated = await api.updateExpo(expo._id, formData);
      setExpo(updated);
      success('Expo Updated', 'Changes saved successfully.');
    } catch (err: any) {
      error('Update Failed', err.message);
      throw err;
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${expo.venue || ''} ${expo.city || ''} ${expo.country || ''}`
  )}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/expos')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Expo Listings</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              expo.isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${expo.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span>{expo.isFavorite ? 'Starred' : 'Star Favorite'}</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Expo</span>
          </button>
        </div>
      </div>

      {/* Main Expo Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                {expo.industry || 'Business Expo'}
              </span>

              {/* Status Badge */}
              {statusInfo.isExpired ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Expired Event</span>
                </span>
              ) : statusInfo.isOngoing ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Happening Now</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  <span>Upcoming Event</span>
                </span>
              )}

              {/* Data Quality Score */}
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {expo.dataQualityScore ?? 80}% Quality Score
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {expo.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {expo.registrationUrl && (
              <a
                href={expo.registrationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <span>{statusInfo.isExpired ? 'Official Archive' : 'Official Website'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            {expo.verificationStatus === 'VERIFIED' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : expo.verificationStatus === 'FLAGGED' ? (
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Verification Status: {expo.verificationStatus || 'UNVERIFIED'}
              </span>
              <span className="text-[11px] text-slate-500">
                {expo.verificationStatus === 'VERIFIED'
                  ? 'All dates, location and organizers have been verified.'
                  : 'Requires manual review by an administrator.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateVerification('VERIFIED')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Verify
            </button>
            <button
              onClick={() => handleUpdateVerification('FLAGGED')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Flag
            </button>
            <button
              onClick={() => handleUpdateVerification('REJECTED')}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Reject
            </button>
          </div>
        </div>

        {/* Missing Fields Alert (if any) */}
        {expo.missingFields && expo.missingFields.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Incomplete data:</strong> Missing fields detected:{' '}
              {expo.missingFields.join(', ')}. You can edit this expo to fill in the missing details.
            </span>
          </div>
        )}

        {/* Date & Time Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div
            className={`p-4 rounded-xl border ${
              statusInfo.isExpired
                ? 'bg-rose-50/40 border-rose-100 text-rose-950'
                : 'bg-brand-50/30 border-brand-100 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Event Dates</span>
            </div>
            <div className="text-base font-bold text-slate-900">
              {statusInfo.startDateFormatted} – {statusInfo.endDateFormatted}
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-600">
              {statusInfo.isExpired ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-brand-500" />
              )}
              <span>{statusInfo.timeDescription} ({statusInfo.durationDays} Days duration)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Venue & Location</span>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:text-brand-700 lowercase flex items-center gap-1 font-normal"
              >
                view maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-base font-bold text-slate-900">
              {expo.city}
              {expo.state ? `, ${expo.state}` : ''}
              {expo.country ? `, ${expo.country}` : ''}
            </div>
            <div className="text-slate-500 mt-1 truncate">{expo.venue || 'Exhibition Hall'}</div>
          </div>
        </div>

        {/* Organizer info */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span className="text-slate-500">Organizer:</span>
            <span className="font-bold text-slate-800">{expo.organizer || 'Not Specified'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-500">Source:</span>
            <span className="font-mono font-bold uppercase text-slate-800">{expo.sourceKey}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Description & Overview
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
            {expo.description || 'No detailed description available for this expo.'}
          </p>
        </div>

        {/* Change History Timeline (Update Detection) */}
        {expo.changeHistory && expo.changeHistory.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <History className="w-4 h-4 text-brand-600" />
              <span>Change & Update Audit History ({expo.changeHistory.length})</span>
            </div>

            <div className="space-y-2">
              {expo.changeHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span className="uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {item.field}
                      </span>
                      <span>{item.reason || 'Auto-detected update'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <span className="line-through text-rose-500 mr-1.5">{item.oldValue || 'none'}</span>
                      <span className="text-emerald-600 font-semibold">→ {item.newValue}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(item.changedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duplicate Hash */}
        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-700 flex items-center gap-1 mb-0.5">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              Deduplication SHA-256 Fingerprint:
            </span>
            <code className="text-[11px] font-mono text-slate-600 truncate block">
              {expo.duplicateHash}
            </code>
          </div>
          <button
            onClick={copyHash}
            className="ml-3 shrink-0 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Edit Expo Modal */}
      <ExpoModal
        isOpen={isEditModalOpen}
        expo={expo}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
