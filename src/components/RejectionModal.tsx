'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityType: string;
  entityId: string;
  defaultTargetModule?: 'FIELD' | 'WAREHOUSE' | 'INVENTORY';
  availableTargetModules?: Array<'FIELD' | 'WAREHOUSE' | 'INVENTORY'>;
  onSuccess: () => void;
}

export default function RejectionModal({
  isOpen,
  onClose,
  title,
  entityType,
  entityId,
  defaultTargetModule = 'FIELD',
  availableTargetModules,
  onSuccess,
}: RejectionModalProps) {
  const [targetModule, setTargetModule] = useState<'FIELD' | 'WAREHOUSE' | 'INVENTORY'>(defaultTargetModule);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultTargetModule) {
      setTargetModule(defaultTargetModule);
    }
  }, [defaultTargetModule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please enter a rejection reason explaining what needs to be corrected.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rejections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          targetModule,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit rejection.');
      }

      setReason('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while rejecting the record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141c2f] border border-red-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 font-bold">
              {error}
            </div>
          )}

          {/* Target Module Selector (If multiple available, e.g. for Finance) */}
          {availableTargetModules && availableTargetModules.length > 1 ? (
            <div>
              <label className="block text-slate-300 font-bold uppercase mb-1">
                Return Record To Module *
              </label>
              <select
                value={targetModule}
                onChange={(e) => setTargetModule(e.target.value as any)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:border-red-500"
              >
                {availableTargetModules.includes('FIELD') && (
                  <option value="FIELD">🌾 Field Team (Purchases & Transport Loading)</option>
                )}
                {availableTargetModules.includes('WAREHOUSE') && (
                  <option value="WAREHOUSE">🏬 Warehouse Team (Scale Receiving)</option>
                )}
                {availableTargetModules.includes('INVENTORY') && (
                  <option value="INVENTORY">📦 Inventory Team (Silo/Stack Recording)</option>
                )}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-300">
              <span className="text-slate-400 uppercase font-bold block text-[10px]">Return Target</span>
              <strong className="text-amber-400 text-xs">
                {targetModule === 'FIELD' && '🌾 Field Team (Field Dispatch & Invoices)'}
                {targetModule === 'WAREHOUSE' && '🏬 Warehouse Receiver (Scale Weighbridge Intake)'}
                {targetModule === 'INVENTORY' && '📦 Inventory Team (Silo/Stack Storage)'}
              </strong>
            </div>
          )}

          {/* Rejection Reason Text Area */}
          <div>
            <label className="block text-slate-300 font-bold uppercase mb-1">
              Rejection Reason & Required Corrections *
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain clearly what mistake was found (e.g. 'Sack weight typo on Invoice #2: 101 kg entered instead of 10.1 kg. Please verify and re-submit.')"
              className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Submitting Rejection...' : 'Confirm Rejection & Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
