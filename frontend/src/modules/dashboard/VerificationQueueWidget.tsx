import React from 'react';
import { ShieldAlert, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { Expo } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface VerificationQueueWidgetProps {
  unverifiedExpos: Expo[];
  onRefresh: () => void;
  onViewAll: () => void;
}

export const VerificationQueueWidget: React.FC<VerificationQueueWidgetProps> = ({
  unverifiedExpos,
  onRefresh,
  onViewAll,
}) => {
  const { success, error } = useToast();

  const handleVerify = async (expoId: string, expoName: string) => {
    try {
      await api.updateExpoVerification(expoId, 'VERIFIED');
      success('Expo Verified', `"${expoName}" marked as verified.`);
      onRefresh();
    } catch (err: any) {
      error('Verification Failed', err.message);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Requiring Verification</h3>
              <p className="text-[11px] text-slate-500">Unverified or flagged expo listings</p>
            </div>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {unverifiedExpos.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-700 block">All Expos Verified</span>
            <span className="text-[11px] text-slate-400">Zero pending verifications in database</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {unverifiedExpos.slice(0, 4).map((expo) => (
              <div
                key={expo._id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate">{expo.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{expo.city}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded text-slate-700">
                      {expo.dataQualityScore ?? 80}% score
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerify(expo._id, expo.name)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs shrink-0 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Verify</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
