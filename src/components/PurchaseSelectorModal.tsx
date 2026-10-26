'use client';

import { useState, useEffect } from 'react';
import { Search, X, CheckSquare, Square, Package, Scale, FileText, CheckCircle2 } from 'lucide-react';
import { formatPurchaseId } from '@/lib/purchase-id';

interface PurchaseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedPurchases: any[]) => void;
  alreadySelectedIds?: string[];
  editingTransportId?: string;
}

export default function PurchaseSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  alreadySelectedIds = [],
  editingTransportId,
}: PurchaseSelectorModalProps) {
  const [unassignedList, setUnassignedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchUnassigned();
      setSelectedIds(alreadySelectedIds);
    }
  }, [isOpen, editingTransportId]);

  const fetchUnassigned = async () => {
    setLoading(true);
    try {
      const url = editingTransportId
        ? `/api/purchases/unassigned?editingTransportId=${editingTransportId}`
        : '/api/purchases/unassigned';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUnassignedList(data);
      }
    } catch (e) {
      console.error('Error fetching unassigned purchases:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredList = unassignedList.filter((p) => {
    const item = p.items?.[0] || {};
    const q = searchQuery.toLowerCase();
    const pIdFormatted = `pr-2026-${p.id.slice(-6)}`.toLowerCase();
    const newIdFormatted = formatPurchaseId(p).toLowerCase();
    return (
      p.familyCode.toLowerCase().includes(q) ||
      p.farmerName.toLowerCase().includes(q) ||
      p.village.toLowerCase().includes(q) ||
      (item.variety || '').toLowerCase().includes(q) ||
      (p.purchasingStaffName || '').toLowerCase().includes(q) ||
      pIdFormatted.includes(q) ||
      newIdFormatted.includes(q)
    );
  });

  const selectedRecords = unassignedList.filter((p) => selectedIds.includes(p.id));
  const uniqueFarmersCount = new Set(selectedRecords.map((p) => p.familyCode)).size;
  const totalSacks = selectedRecords.reduce((sum, p) => sum + (p.items?.[0]?.sacks || 0), 0);
  const totalWeight = selectedRecords.reduce((sum, p) => sum + p.totalWeight, 0);
  const totalNetPayment = selectedRecords.reduce((sum, p) => sum + p.netPayment, 0);

  const handleConfirm = () => {
    onConfirm(selectedRecords);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141c2f] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 font-extrabold text-xs">
              🌾
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Select Purchase Records for Truck Loading</h3>
              <p className="text-[11px] text-slate-400">
                Select completed purchase records from farmers to assign onto this truck.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="p-4 bg-[#0f172a] border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Family Code, Farmer, Village, Staff..."
              className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 font-bold flex items-center gap-1.5 text-[11px]"
            >
              {selectedIds.length === filteredList.length && filteredList.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Deselect All
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" /> Select All ({filteredList.length})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Calculation Summary Banner */}
        <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/30 px-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Farmers</span>
            <span className="font-extrabold text-white">{uniqueFarmersCount} Farmers</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Invoices</span>
            <span className="font-extrabold text-emerald-400">{selectedIds.length} Records</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Sacks</span>
            <span className="font-extrabold text-amber-400">{totalSacks} Sacks</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Truck Field Weight</span>
            <span className="font-black text-emerald-400 text-sm">{totalWeight.toFixed(2)} kg</span>
          </div>
        </div>

        {/* Unassigned Table List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 text-xs">
          {loading ? (
            <div className="text-center py-12 text-slate-400 font-bold">Loading available purchase records...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No unassigned purchase records found. All completed purchases have been assigned to trucks.
            </div>
          ) : (
            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                  <tr>
                    <th className="p-3 w-10 text-center">Select</th>
                    <th className="p-3">Purchase ID</th>
                    <th className="p-3">Family Code</th>
                    <th className="p-3">Farmer Name</th>
                    <th className="p-3">Village</th>
                    <th className="p-3">Variety / Grade</th>
                    <th className="p-3 text-center">Sacks</th>
                    <th className="p-3 text-right">Weight (kg)</th>
                    <th className="p-3 text-right">Net Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredList.map((p) => {
                    const item = p.items?.[0] || {};
                    const isSelected = selectedIds.includes(p.id);
                    const pIdFormatted = formatPurchaseId(p);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => toggleSelectOne(p.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled by row click
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">{pIdFormatted}</td>
                        <td className="p-3 font-extrabold text-amber-400">{p.familyCode}</td>
                        <td className="p-3 font-bold text-white">{p.farmerName}</td>
                        <td className="p-3 text-slate-300">{p.village}</td>
                        <td className="p-3">
                          <span className="font-bold text-sky-400">{item.variety || 'Red Jasmine'}</span>
                          <span className="ml-1 font-extrabold text-purple-400">({item.grade || 'A1'})</span>
                        </td>
                        <td className="p-3 text-center font-bold">{item.sacks || 0}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {p.totalWeight.toFixed(2)} kg
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-200">
                          {p.netPayment.toLocaleString()} KHR
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-bold">
            Selected: <span className="text-emerald-400 font-extrabold">{selectedIds.length} Purchase Records</span> ({totalWeight.toFixed(2)} kg Total Weight)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-700 disabled:text-slate-500 text-[#0b0f19] rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm & Load {selectedIds.length} Selected Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
