'use client';

import { X, CheckCircle2, User, Scale, ShieldCheck, MapPin, AlertCircle, FileSpreadsheet, Package } from 'lucide-react';
import { formatImageSrc } from '@/lib/image-utils';
import { formatPurchaseId } from '@/lib/purchase-id';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
}

export default function PurchaseDetailsModal({ isOpen, onClose, purchase }: PurchaseDetailsModalProps) {
  if (!isOpen || !purchase) return null;

  const item = purchase.items?.[0] || {};
  let sackWeightsList: number[] = [];
  try {
    if (item.sackWeights) {
      sackWeightsList = JSON.parse(item.sackWeights);
    }
  } catch (e) {
    sackWeightsList = [];
  }

  const purchaseIdFormatted = formatPurchaseId(purchase);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141c2f] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 font-extrabold text-xs">
              PR
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Paddy Purchase Record Details
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {purchaseIdFormatted}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Purchased on {new Date(purchase.createdAt).toLocaleString()} by {purchase.purchasingStaffName || 'Field Staff'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Farmer & Staff Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Family Code</span>
              <span className="text-emerald-400 font-extrabold text-sm">{purchase.familyCode}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Farmer Name</span>
              <span className="text-white font-bold">{purchase.farmerName} ({purchase.village})</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Purchasing Staff</span>
              <span className="text-sky-400 font-bold">👤 {purchase.purchasingStaffName || 'Field Inspector'}</span>
            </div>
          </div>

          {/* Pricing & Variety Details */}
          <div className="p-4 bg-[#0f172a] border border-emerald-500/30 rounded-xl space-y-3">
            <h4 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider">
              🌾 Paddy Variety & Price Breakdown
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Variety</span>
                <span className="font-bold text-white">{item.variety || 'Red Jasmine'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Grade</span>
                <span className="font-bold text-purple-400">{item.grade || 'A1'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Standard Price</span>
                <span className="font-bold text-amber-400">{(item.standardPrice || 0).toLocaleString()} KHR/kg</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Final Price (Inc Premium)</span>
                <span className="font-extrabold text-emerald-400">{(item.finalPrice || item.standardPrice || 0).toLocaleString()} KHR/kg</span>
              </div>
            </div>
          </div>

          {/* Sack-by-Sack Weights Breakdown */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Weighed Sacks List ({purchase.items?.[0]?.sacks || sackWeightsList.length} Sacks Total)
              </span>
              <span className="font-extrabold text-emerald-400">
                Total: {Math.round(purchase.totalWeight).toLocaleString()} kg
              </span>
            </div>

            {sackWeightsList.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1 max-h-[140px] overflow-y-auto">
                {sackWeightsList.map((w, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1e293b] border border-sky-500/30 text-sky-300 px-2 py-1 rounded-lg font-mono text-xs flex items-center gap-1.5"
                  >
                    <span className="bg-sky-500/20 text-sky-300 font-extrabold px-1.5 py-0.5 rounded text-[10px] border border-sky-500/30">
                      #{idx + 1}
                    </span>
                    <span className="font-extrabold text-white text-xs">
                      {Math.round(w)} kg
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-[11px] italic">No individual sack weights recorded.</div>
            )}
          </div>

          {/* Payment & Deduction Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Paddy Value</span>
              <span className="font-extrabold text-amber-400 text-sm">
                {purchase.totalPayment.toLocaleString()} KHR
              </span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Seed Repayment Deduction</span>
              <span className="font-extrabold text-red-400 text-sm">
                -{purchase.seedDeduction.toLocaleString()} KHR
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">Net Payment to Farmer</span>
              <span className="font-black text-emerald-400 text-base">
                {purchase.netPayment.toLocaleString()} KHR
              </span>
            </div>
          </div>

          {/* Signatures / Purchaser Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">Farmer Signature (Seller)</span>
              {formatImageSrc(purchase.signatureFarmer) ? (
                <img src={formatImageSrc(purchase.signatureFarmer)} alt="Farmer Signature" className="h-20 object-contain mx-auto border border-white/10 rounded bg-[#1e293b] p-1" />
              ) : (
                <div className="h-20 flex items-center justify-center text-slate-500 italic text-[11px]">No signature image</div>
              )}
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-sky-400 uppercase block">Purchasing Staff (Buyer)</span>
              <div className="text-sm font-bold text-white">{purchase.purchasingStaffName || 'Field Staff'}</div>
              <div className="text-[11px] text-slate-400">Authenticated System Account</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
