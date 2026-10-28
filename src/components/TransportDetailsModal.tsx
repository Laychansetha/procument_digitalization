'use client';

import { X, Truck, Calendar, User, UserCheck, MapPin, Package, Scale, ShieldCheck, FileSpreadsheet } from 'lucide-react';

import RejectionHistorySection from '@/components/RejectionHistorySection';
import { formatTransportId } from '@/lib/transport-id';
import { formatPurchaseId } from '@/lib/purchase-id';
import { getWarehouseId, getWarehouseName } from '@/lib/warehouse-config';
import { formatImageSrc } from '@/lib/image-utils';

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
      <div className="bg-[#141c2f] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-500/10 border border-sky-500/30 rounded-lg flex items-center justify-center text-sky-400 font-extrabold text-xs">
              🚛
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Transport Dispatch Record Details
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {transportIdFormatted}
                </span>
              </h3>
              <p className="text-[10.5px] text-slate-400">
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
        <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
          {/* Rejection Audit History */}
          <RejectionHistorySection entityType="TransportRecord" entityId={transport.id} />

          {/* Driver & Truck Info (Single-line compact strip) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/5 border border-white/10 rounded-xl p-2">
            <div className="flex items-center justify-between px-2 py-1 bg-[#0f172a]/60 rounded-lg">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Driver:</span>
              <span className="text-white font-bold text-[11px] truncate ml-1.5">{transport.driverName}</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-[#0f172a]/60 rounded-lg">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Plate:</span>
              <span className="text-sky-400 font-extrabold font-mono text-xs ml-1.5">{transport.plateNumber}</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-[#0f172a]/60 rounded-lg">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Mobile:</span>
              <span className="text-slate-200 font-mono text-[11px] ml-1.5">{transport.mobileNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-[#0f172a]/60 rounded-lg">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Cleaned:</span>
              <span className={`font-bold text-[11px] ml-1.5 ${transport.truckCleaned ? 'text-emerald-400' : 'text-amber-400'}`}>
                {transport.truckCleaned ? '✓ Yes' : 'No'}
              </span>
            </div>
          </div>

          {/* Locations & Staff Grid (Single-line compact strip) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-[#0f172a] border border-sky-500/30 rounded-xl">
            <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded-lg">
              <span className="text-slate-400 text-[10px] font-bold uppercase">From:</span>
              <span className="font-bold text-white text-[11px] flex items-center gap-1 truncate ml-1.5">
                <MapPin className="w-3 h-3 text-purple-400 shrink-0" /> {transport.loadingLocation || 'Preah Vihear'}
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded-lg">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Destination:</span>
              <span className="font-bold text-sky-400 text-[11px] flex items-center gap-1 font-mono truncate ml-1.5">
                <MapPin className="w-3 h-3 text-sky-400 shrink-0" /> {getWarehouseId(transport.destinationWarehouse)} ({getWarehouseName(transport.destinationWarehouse)})
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded-lg">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Loading Staff:</span>
              <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1 truncate ml-1.5">
                <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" /> {transport.fieldStaffName || 'Field Staff'}
              </span>
            </div>
          </div>

          {/* Truck Loading Photo & Driver Signature Verification Cards */}
          {(transport.truckPhotoUrl || transport.driverSignature) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Loaded Truck Photo */}
              {formatImageSrc(transport.truckPhotoUrl) ? (
                <div className="p-2.5 bg-white/5 border border-sky-500/30 rounded-xl space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                      📷 Loaded Truck Photo
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Plate: {transport.plateNumber}
                    </span>
                  </div>
                  <div className="relative group rounded-lg overflow-hidden border border-white/10 max-h-32 bg-black/40 flex items-center justify-center">
                    <img
                      src={formatImageSrc(transport.truckPhotoUrl)}
                      alt={`Loaded Truck ${transport.plateNumber}`}
                      className="max-h-32 w-auto object-contain rounded-lg"
                    />
                    <a
                      href={formatImageSrc(transport.truckPhotoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-1.5 right-1.5 bg-[#0b0f19]/80 backdrop-blur hover:bg-sky-500 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-colors border border-white/20"
                    >
                      View Full Image ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-xs italic">
                  No Loaded Truck Photo Attached
                </div>
              )}

              {/* Driver Signature */}
              {formatImageSrc(transport.driverSignature) ? (
                <div className="p-2.5 bg-white/5 border border-sky-500/30 rounded-xl space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      ✍️ Driver Digital Signature
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {transport.driverName}
                    </span>
                  </div>
                  <div className="rounded-lg border border-white/10 p-1.5 bg-black/40 flex items-center justify-center min-h-[100px]">
                    <img
                      src={formatImageSrc(transport.driverSignature)}
                      alt={`Signature of ${transport.driverName}`}
                      className="max-h-24 object-contain filter invert brightness-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-xs italic">
                  No Driver Signature Recorded
                </div>
              )}
            </div>
          )}

          {/* Summary Badges (Single-line compact strip) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="py-1.5 px-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Farmers:</span>
              <span className="font-extrabold text-white text-xs font-mono">{uniqueFarmersCount}</span>
            </div>
            <div className="py-1.5 px-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Invoices:</span>
              <span className="font-extrabold text-emerald-400 text-xs font-mono">{purchases.length}</span>
            </div>
            <div className="py-1.5 px-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Sacks:</span>
              <span className="font-extrabold text-amber-400 text-xs font-mono">{transport.totalSacks}</span>
            </div>
            <div className="py-1.5 px-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg flex items-center justify-between">
              <span className="text-sky-400 text-[10px] uppercase font-bold">Field Weight:</span>
              <span className="font-black text-sky-400 text-xs font-mono">{transport.totalFieldWeight.toFixed(2)} kg</span>
            </div>
          </div>

          {/* Payment Transfer Receipt Proof (Field View) */}
          {(transport.status === 'DISBURSED' || transport.paymentReceiptUrl) && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Payment Disbursed & Bank Transfer Receipt Proof
                </span>
                <span className="bg-emerald-400 text-[#0b0f19] px-2 py-0.5 rounded-full text-[10px] font-black">
                  ✅ DISBURSED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-0.5">
                <div className="truncate">
                  <span className="text-slate-400 text-[10px] font-bold mr-1">Method/Batch:</span>
                  <span className="text-white font-bold">{transport.paymentMethod || 'Bank Transfer'} ({transport.paymentBatchNumber || 'BATCH-2026'})</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-400 text-[10px] font-bold mr-1">Paid Date:</span>
                  <span className="text-slate-200">{transport.paidAt ? new Date(transport.paidAt).toLocaleDateString() : 'Completed'} ({transport.paidByStaffName || 'Finance'})</span>
                </div>
                <div className="truncate">
                  {formatImageSrc(transport.paymentReceiptUrl) ? (
                    <a
                      href={formatImageSrc(transport.paymentReceiptUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 font-extrabold underline text-[11px] inline-flex items-center gap-1 hover:text-emerald-300"
                    >
                      📄 Open Transfer Receipt
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[10px] italic">No receipt attached</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Assigned Purchase Records Table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-[11px] text-slate-200 uppercase tracking-wider">
                📦 Cargo Manifest (Assigned Farmer Purchase Records)
              </h4>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5 text-slate-400 uppercase font-bold text-[10px] tracking-tight border-b border-white/10">
                  <tr>
                    <th className="py-2 px-2.5 whitespace-nowrap">Purchase ID</th>
                    <th className="py-2 px-2 whitespace-nowrap">Family Code</th>
                    <th className="py-2 px-2 whitespace-nowrap">Farmer Name</th>
                    <th className="py-2 px-2 whitespace-nowrap">Village</th>
                    <th className="py-2 px-2 whitespace-nowrap">Variety / Grade</th>
                    <th className="py-2 px-2 text-center whitespace-nowrap">Sacks</th>
                    <th className="py-2 px-2 text-right whitespace-nowrap">Weight (kg)</th>
                    <th className="py-2 px-2 whitespace-nowrap">Purchasing Staff</th>
                    <th className="py-2 px-2.5 text-right whitespace-nowrap">Net Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchases.map((p: any) => {
                    const item = p.items?.[0] || {};
                    const pIdFormatted = formatPurchaseId(p);

                    return (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="py-1.5 px-2.5 font-mono font-bold text-sky-400 whitespace-nowrap">{pIdFormatted}</td>
                        <td className="py-1.5 px-2 font-extrabold text-amber-400 whitespace-nowrap">{p.familyCode}</td>
                        <td className="py-1.5 px-2 font-bold text-white whitespace-nowrap">{p.farmerName}</td>
                        <td className="py-1.5 px-2 text-slate-300 whitespace-nowrap">{p.village}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-200 whitespace-nowrap">
                          {item.variety || 'Red Jasmine'} <span className="text-purple-400">({item.grade || 'A1'})</span>
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-white whitespace-nowrap">{item.sacks || 0}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-sky-400 whitespace-nowrap">
                          {p.totalWeight.toFixed(2)} kg
                        </td>
                        <td className="py-1.5 px-2 font-medium text-slate-300 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[10.5px] text-slate-200 font-semibold border border-white/5">
                            {p.purchasingStaffName || 'Field Staff'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
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
        <div className="px-4 py-2.5 bg-white/5 border-t border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
