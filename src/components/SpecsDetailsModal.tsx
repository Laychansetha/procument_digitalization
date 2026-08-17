'use client';

import { X, Edit, Lock, CheckCircle2, XCircle } from 'lucide-react';

interface SpecsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: any;
  onEdit?: (spec: any) => void;
  isUsedForPurchase?: boolean;
}

export default function SpecsDetailsModal({
  isOpen,
  onClose,
  spec,
  onEdit,
  isUsedForPurchase = false,
}: SpecsDetailsModalProps) {
  if (!isOpen || !spec) return null;

  const specIdFormatted = `SPEC-2026-${spec.id.slice(-6).toUpperCase()}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-[#141c2f] border border-white/10 text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-white">Paddy Quality Inspection Details</h3>
            <span className="font-mono text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              {specIdFormatted}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Status Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              spec.isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {spec.isValid ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span>Outcome: {spec.isValid ? 'PASSED QUALIFICATION' : 'FAILED / REJECTED'}</span>
            </div>
            <span className="text-xs font-mono font-bold">{spec.selectedGrade || 'Grade A1'}</span>
          </div>

          {/* Farmer & Location Info */}
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Farmer Information</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Family Code:</span>{' '}
                <strong className="text-emerald-400">{spec.familyCode}</strong>
              </div>
              <div>
                <span className="text-slate-400">Farmer Name:</span>{' '}
                <strong className="text-white">{spec.farmerName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Village:</span>{' '}
                <span className="text-slate-200">{spec.village}</span>
              </div>
              <div>
                <span className="text-slate-400">Date & Time:</span>{' '}
                <span className="text-slate-200">{new Date(spec.createdAt || spec.date).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quality Metrics Grid */}
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inspection Metrics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Paddy Variety</span>
                <strong className="text-white">{spec.paddyType}</strong>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Organic Status</span>
                <strong className={spec.isOrganic ? 'text-emerald-400' : 'text-amber-400'}>
                  {spec.isOrganic ? 'Organic Paddy' : 'Conventional Paddy'}
                </strong>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Whole Grain</span>
                <strong className="font-mono text-white">{spec.wholeGrain != null ? `${spec.wholeGrain}%` : 'N/A'}</strong>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Broken Rice</span>
                <strong className="font-mono text-white">{spec.brokenRice != null ? `${spec.brokenRice}%` : 'N/A'}</strong>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Impurity</span>
                <strong className="font-mono text-white">{spec.impurity != null ? `${spec.impurity}%` : 'N/A'}</strong>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Foreign Matter</span>
                <strong className="font-mono text-white">{spec.foreignMatter}%</strong>
              </div>
              <div className="p-2 bg-white/5 rounded-lg col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px]">Moisture Content</span>
                <strong className="font-mono text-white">{spec.moisture}%</strong>
              </div>
            </div>
          </div>

          {/* Financial Value Summary */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Paddy Price:</span>
              <span className="font-mono text-white">{spec.basePrice.toLocaleString()} KHR/kg</span>
            </div>
            <div className="flex justify-between border-t border-emerald-500/30 pt-1.5 font-bold text-sm text-emerald-300">
              <span>Standard Purchase Price:</span>
              <span className="font-mono">{spec.finalPrice.toLocaleString()} KHR/kg</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            {isUsedForPurchase ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Used in Purchase Record (Locked)
              </span>
            ) : (
              'Ready for purchase link'
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && !isUsedForPurchase && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(spec);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-[#0b0f19] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Edit className="w-4 h-4" /> Edit Specs Record
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
