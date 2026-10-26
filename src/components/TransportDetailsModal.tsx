'use client';

import { X, Truck, Calendar, User, UserCheck, MapPin, Package, Scale, ShieldCheck, FileSpreadsheet } from 'lucide-react';

import RejectionHistorySection from '@/components/RejectionHistorySection';
import { formatTransportId } from '@/lib/transport-id';
import { formatPurchaseId } from '@/lib/purchase-id';
import { getWarehouseId, getWarehouseName } from '@/lib/warehouse-config';

interface TransportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transport: any;
}

export default function TransportDetailsModal({ isOpen, onClose, transport }: TransportDetailsModalProps) {
  if (!isOpen || !transport) return null;

  const purchases = transport.purchases || [];
  const transportIdFormatted = formatTransportId(transport);
  const uniqueFarmersCount = new Set(purchases.map((p: any) => p.familyCode)).size;

  // EXPORT SINGLE TRUCK MANIFEST & PURCHASE RECORDS TO CSV
  const exportSingleTruckCSV = () => {
    if (!transport) return;

    const rows: any[][] = [];

    // TOP SUMMARY SECTION
    rows.push(['=== TRUCK DISPATCH MANIFEST SUMMARY ===']);
    rows.push([
      'Transport ID',
      'Dispatch Date & Time',
      'Responsible Loading Staff',
      'Driver Name',
      'Truck Plate Number',
      'Loading Location',
      'Destination',
      'Total Farmers',
      'Total Purchase Records',
      'Total Number of Sacks',
      'Total Field Weight (Kg)',
    ]);
    rows.push([
      transportIdFormatted,
      new Date(transport.createdAt).toLocaleString(),
      transport.fieldStaffName || 'Field Staff',
      transport.driverName || '',
      transport.plateNumber || '',
      transport.loadingLocation || 'Chhaeb Buying Station',
      getWarehouseId(transport.destinationWarehouse),
      uniqueFarmersCount,
      purchases.length,
      transport.totalSacks || 0,
      transport.totalFieldWeight || 0,
    ]);

    // ITEMIZED PURCHASE RECORDS SECTION
    rows.push([]);
    rows.push(['--- ASSIGNED PURCHASE RECORDS (INVOICES) ---']);
    rows.push([
      'Purchase ID',
      'Family Code',
      'Farmer Name',
      'Village',
      'Paddy Variety',
      'Grade',
      'Number of Sacks',
      'Total Weight (Kg)',
      'Purchasing Staff',
    ]);

    if (purchases.length === 0) {
      rows.push(['N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 0, 0, 'N/A']);
    } else {
      purchases.forEach((p: any) => {
        const item = p.items?.[0] || {};
        const pIdFormatted = formatPurchaseId(p);
        rows.push([
          pIdFormatted,
          p.familyCode || '',
          p.farmerName || '',
          p.village || '',
          item.variety || 'Red Jasmine',
          item.grade || 'A1',
          item.sacks || 0,
          p.totalWeight || 0,
          p.purchasingStaffName || 'Field Staff',
        ]);
      });
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Truck_Manifest_${transportIdFormatted}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141c2f] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-center text-sky-400 font-extrabold text-xs">
              🚛
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Transport Dispatch Record Details
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {transportIdFormatted}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Dispatched on {new Date(transport.createdAt).toLocaleString()} by {transport.fieldStaffName || 'Field Inspector'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportSingleTruckCSV}
              className="bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Truck CSV
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Rejection Audit History */}
          <RejectionHistorySection entityType="TransportRecord" entityId={transport.id} />
          {/* Driver & Truck Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Driver Name</span>
              <span className="text-white font-bold">{transport.driverName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Truck Plate Number</span>
              <span className="text-sky-400 font-extrabold font-mono text-sm">{transport.plateNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Mobile Number</span>
              <span className="text-slate-200 font-mono">{transport.mobileNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Truck Cleaning</span>
              <span className={`font-bold ${transport.truckCleaned ? 'text-emerald-400' : 'text-amber-400'}`}>
                {transport.truckCleaned ? '✓ Cleaned' : 'Not Cleaned'}
              </span>
            </div>
          </div>

          {/* Locations & Staff Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#0f172a] border border-sky-500/30 rounded-xl">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Loading Location</span>
              <span className="font-bold text-white flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400" /> {transport.loadingLocation || 'Preah Vihear'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Destination Warehouse</span>
              <span className="font-bold text-sky-400 flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-sky-400" /> {getWarehouseId(transport.destinationWarehouse)}
              </span>
              <span className="text-[11px] text-slate-400 block ml-4">
                {getWarehouseName(transport.destinationWarehouse)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Responsible Loading Staff</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> {transport.fieldStaffName || 'Field Staff'}
              </span>
            </div>
          </div>

          {/* Truck Loading Photo & Driver Signature Verification Cards */}
          {(transport.truckPhotoUrl || transport.driverSignature) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Loaded Truck Photo */}
              {transport.truckPhotoUrl ? (
                <div className="p-3 bg-white/5 border border-sky-500/30 rounded-xl space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      📷 Loaded Truck Photo
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Plate: {transport.plateNumber}
                    </span>
                  </div>
                  <div className="relative group rounded-xl overflow-hidden border border-white/10 max-h-48 bg-black/40 flex items-center justify-center">
                    <img
                      src={transport.truckPhotoUrl}
                      alt={`Loaded Truck ${transport.plateNumber}`}
                      className="max-h-48 w-auto object-contain rounded-lg"
                    />
                    <a
                      href={transport.truckPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-[#0b0f19]/80 backdrop-blur hover:bg-sky-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors border border-white/20"
                    >
                      View Full Image ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-xs italic">
                  No Loaded Truck Photo Attached
                </div>
              )}

              {/* Driver Signature */}
              {transport.driverSignature ? (
                <div className="p-3 bg-white/5 border border-sky-500/30 rounded-xl space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      ✍️ Driver Digital Signature
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {transport.driverName}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 p-2 bg-black/40 flex items-center justify-center min-h-[140px]">
                    <img
                      src={transport.driverSignature}
                      alt={`Signature of ${transport.driverName}`}
                      className="max-h-32 object-contain filter invert brightness-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-xs italic">
                  No Driver Signature Recorded
                </div>
              )}
            </div>
          )}

          {/* Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Farmers</span>
              <span className="font-extrabold text-white text-sm">{uniqueFarmersCount} Farmers</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Invoices</span>
              <span className="font-extrabold text-emerald-400 text-sm">{purchases.length} Purchase Records</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Sacks Loaded</span>
              <span className="font-extrabold text-amber-400 text-sm">{transport.totalSacks} Sacks</span>
            </div>
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl">
              <span className="text-sky-400 block text-[10px] uppercase font-bold">Total Truck Field Weight</span>
              <span className="font-black text-sky-400 text-base">{transport.totalFieldWeight.toFixed(2)} kg</span>
            </div>
          </div>

          {/* Payment Transfer Receipt Proof (Field View) */}
          {(transport.status === 'DISBURSED' || transport.paymentReceiptUrl) && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Payment Disbursed & Bank Transfer Receipt Proof
                </span>
                <span className="bg-emerald-400 text-[#0b0f19] px-2 py-0.5 rounded-full text-[10px] font-black">
                  ✅ DISBURSED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">Payment Method & Batch</span>
                  <span className="text-white font-bold">{transport.paymentMethod || 'Bank Transfer'} ({transport.paymentBatchNumber || 'BATCH-2026'})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">Paid Date & Staff</span>
                  <span className="text-slate-200">{transport.paidAt ? new Date(transport.paidAt).toLocaleDateString() : 'Completed'} ({transport.paidByStaffName || 'Finance'})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">Bank Receipt Proof</span>
                  {transport.paymentReceiptUrl ? (
                    <a
                      href={transport.paymentReceiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 font-extrabold underline text-xs flex items-center gap-1 hover:text-emerald-300"
                    >
                      📄 Open & Forward Transfer Receipt to Farmers
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[10px] italic">No receipt attached</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Assigned Purchase Records Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider">
                📦 Cargo Manifest (Assigned Farmer Purchase Records)
              </h4>
              <button
                onClick={exportSingleTruckCSV}
                className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Download Manifest CSV
              </button>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                  <tr>
                    <th className="p-3">Purchase ID</th>
                    <th className="p-3">Family Code</th>
                    <th className="p-3">Farmer Name</th>
                    <th className="p-3">Village</th>
                    <th className="p-3">Variety / Grade</th>
                    <th className="p-3 text-center">Sacks</th>
                    <th className="p-3 text-right">Weight (kg)</th>
                    <th className="p-3">Purchasing Staff</th>
                    <th className="p-3 text-right">Net Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchases.map((p: any) => {
                    const item = p.items?.[0] || {};
                    const pIdFormatted = formatPurchaseId(p);

                    return (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="p-3 font-mono font-bold text-sky-400 whitespace-nowrap">{pIdFormatted}</td>
                        <td className="p-3 font-extrabold text-amber-400">{p.familyCode}</td>
                        <td className="p-3 font-bold text-white">{p.farmerName}</td>
                        <td className="p-3 text-slate-300">{p.village}</td>
                        <td className="p-3 font-bold text-slate-200">
                          {item.variety || 'Red Jasmine'} ({item.grade || 'A1'})
                        </td>
                        <td className="p-3 text-center font-bold text-white">{item.sacks || 0}</td>
                        <td className="p-3 text-right font-mono font-bold text-sky-400">
                          {p.totalWeight.toFixed(2)} kg
                        </td>
                        <td className="p-3 font-medium text-slate-300">
                          <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[11px] text-slate-200 font-semibold border border-white/5">
                            {p.purchasingStaffName || 'Field Staff'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {p.netPayment.toLocaleString()} KHR
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={exportSingleTruckCSV}
            className="bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Truck CSV
          </button>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
