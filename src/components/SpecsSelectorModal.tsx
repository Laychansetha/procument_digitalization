'use client';

import { useState } from 'react';
import { Search, X, CheckCircle2, Filter, Eye } from 'lucide-react';
import { formatPurchaseId } from '@/lib/purchase-id';

interface SpecsRecordItem {
  id: string;
  familyCode: string;
  farmerName: string;
  village: string;
  paddyType: string;
  selectedGrade: string;
  isOrganic: boolean;
  finalPrice: number;
  isValid: boolean;
  date: string;
}

interface SpecsSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  specsList: SpecsRecordItem[];
  purchases?: any[];
  onSelect: (spec: SpecsRecordItem) => void;
  onViewDetails?: (spec: SpecsRecordItem) => void;
}

export default function SpecsSelectorModal({
  isOpen,
  onClose,
  specsList,
  purchases = [],
  onSelect,
  onViewDetails,
}: SpecsSelectorModalProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Match purchased record by exact spec.id or exact (Family Code + Village + Variety + Grade)
  const findPurchasedMatch = (spec: SpecsRecordItem) => {
    if (!purchases || !Array.isArray(purchases)) return null;
    return purchases.find((p) => {
      if (p.specsRecordId === spec.id) return true;
      const item = p.items?.[0] || {};
      const familyMatch = p.familyCode?.toLowerCase().trim() === spec.familyCode?.toLowerCase().trim();
      const villageMatch =
        !p.village ||
        !spec.village ||
        p.village?.toLowerCase().trim() === spec.village?.toLowerCase().trim();
      const varietyMatch = item.variety?.toLowerCase().trim() === spec.paddyType?.toLowerCase().trim();
      const gradeMatch = item.grade?.toLowerCase().trim() === spec.selectedGrade?.toLowerCase().trim();
      return familyMatch && villageMatch && varietyMatch && gradeMatch;
    });
  };

  const handleCardClick = (spec: SpecsRecordItem, linkedPurchase: any) => {
    if (linkedPurchase) {
      const pIdFormatted = formatPurchaseId(linkedPurchase);
      const confirmUseAgain = confirm(
        `⚠️ This Quality Specs inspection record (Family Code: ${spec.familyCode}, Variety: ${spec.paddyType}, Grade: ${spec.selectedGrade}) has already been used for Purchase Record ${pIdFormatted}.\n\nDo you want to use it again to create another purchase record?`
      );
      if (confirmUseAgain) {
        onSelect(spec);
        onClose();
      }
    } else {
      onSelect(spec);
      onClose();
    }
  };

  const filteredSpecs = specsList.filter(
    (s) =>
      s.familyCode.toLowerCase().includes(search.toLowerCase()) ||
      s.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      s.village.toLowerCase().includes(search.toLowerCase()) ||
      s.paddyType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141c2f] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">Select Approved Quality Specs Inspection Record</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/10 bg-[#1e293b]/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Family Code (e.g. TB034), Farmer Name, or Village..."
              className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Specs List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredSpecs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching quality specs records found. Please perform a Quality Specs inspection first.
            </div>
          ) : (
            filteredSpecs.map((spec) => {
              const linkedPurchase = findPurchasedMatch(spec);
              const isPurchased = Boolean(linkedPurchase);
              const pIdFormatted = linkedPurchase ? formatPurchaseId(linkedPurchase) : '';

              return (
                <div
                  key={spec.id}
                  onClick={() => handleCardClick(spec, linkedPurchase)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isPurchased
                      ? 'bg-slate-800/60 hover:bg-slate-800/90 border-purple-500/30 hover:border-purple-500/60 shadow-sm'
                      : 'bg-white/5 hover:bg-emerald-500/10 border-white/10 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-400">🆔 {spec.familyCode}</span>
                      <span className="font-bold text-white">{spec.farmerName}</span>
                      <span className="text-slate-400">({spec.village})</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      🌾 <strong className="text-sky-400">{spec.paddyType}</strong> · Grade:{' '}
                      <strong className="text-purple-400">{spec.selectedGrade}</strong> · Price:{' '}
                      <strong className="text-amber-400">{spec.finalPrice.toLocaleString()} KHR/kg</strong>
                      {spec.isOrganic && <span className="ml-2 text-emerald-400 font-bold">🌿 Organic</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        spec.isValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {spec.isValid ? 'Passed Quality' : 'Failed Quality'}
                    </span>

                    {isPurchased && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-purple-400" /> Purchased ({pIdFormatted})
                      </span>
                    )}

                    {isPurchased && onViewDetails && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(spec);
                          onClose();
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-purple-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-purple-500/30"
                        title="View Record Details"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(spec, linkedPurchase);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        isPurchased
                          ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500 text-[#0b0f19] hover:bg-emerald-400'
                      }`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
