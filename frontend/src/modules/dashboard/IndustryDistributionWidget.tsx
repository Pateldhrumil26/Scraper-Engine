import React from 'react';
import { BarChart3, Globe } from 'lucide-react';

interface DistributionProps {
  industryStats: { label: string; count: number }[];
  countryStats: { label: string; count: number }[];
}

export const IndustryDistributionWidget: React.FC<DistributionProps> = ({
  industryStats,
  countryStats,
}) => {
  const maxIndustry = Math.max(...industryStats.map((i) => i.count), 1);
  const maxCountry = Math.max(...countryStats.map((c) => c.count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Industries */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Top Industry Categories</h3>
        </div>
        {industryStats.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No category data available</p>
        ) : (
          <div className="space-y-3">
            {industryStats.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">
                    {item.label}
                  </span>
                  <span className="text-slate-500 font-semibold">{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / maxIndustry) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Countries */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Top Expo Destinations</h3>
        </div>
        {countryStats.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No location data available</p>
        ) : (
          <div className="space-y-3">
            {countryStats.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">
                    {item.label}
                  </span>
                  <span className="text-slate-500 font-semibold">{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / maxCountry) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
