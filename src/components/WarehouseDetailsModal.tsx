'use client';

import { X, Scale, Camera, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';
import { formatImageSrc } from '@/lib/image-utils';

import RejectionHistorySection from '@/components/RejectionHistorySection';
import { formatTransportId } from '@/lib/transport-id';
import { formatPurchaseId } from '@/lib/purchase-id';
import { getWarehouseId, formatReceivingIdWithDate } from '@/lib/warehouse-config';

interface WarehouseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  intake: any;
  maxTolerancePercent?: number; // Configurable tolerance from Admin Settings
  exportUsername?: string;
}

export default function WarehouseDetailsModal({
  isOpen,
  onClose,
  intake,
  maxTolerancePercent = 1.0,
  exportUsername,
}: WarehouseDetailsModalProps) {
  if (!isOpen || !intake) return null;

  const transport = intake.transport || {};
  const purchases = transport.purchases || [];
  const arrivedWh = getWarehouseId(intake.arrivedWarehouse || transport.destinationWarehouse || 'W002');
  const staffUsername = intake.receivingStaffName || 'staff';
  const receivingIdFormatted = `${staffUsername}_${arrivedWh}`;
  const receivingIdWithDate = formatReceivingIdWithDate(intake);
  const transportIdFormatted = formatTransportId(transport);

  const fieldWeight = transport.totalFieldWeight || 0;
  const netWeight = intake.warehouseNetWeight || 0;
  const diffKg = intake.weightDiffKg !== undefined && intake.weightDiffKg !== null ? intake.weightDiffKg : (netWeight - fieldWeight);
  const diffPercent = Math.abs(intake.weightDiffPercent !== undefined && intake.weightDiffPercent !== null
    ? intake.weightDiffPercent
    : (fieldWeight > 0 ? (diffKg / fieldWeight) * 100 : 0));

  // 3. COLOR TOLERANCE BADGE
  let toleranceStatus: 'green' | 'yellow' | 'red' = 'green';
  let toleranceText = 'Normal — Within Tolerance';

  if (diffPercent > maxTolerancePercent * 2) {
    toleranceStatus = 'red';
    toleranceText = `CRITICAL — Exceeds ${maxTolerancePercent}% Tolerance!`;
  } else if (diffPercent > maxTolerancePercent) {
    toleranceStatus = 'yellow';
    toleranceText = `WARNING — Slight Variance (> ${maxTolerancePercent}%)`;
  }

  // EXPORT WAREHOUSE TRUCK MANIFEST CSV
  const exportTruckManifestCSV = () => {
    if (!purchases || purchases.length === 0) {
      alert('No purchase records loaded on this truck intake.');
      return;
    }

    const rows: any[][] = [];

    // TOP SUMMARY SECTION
    rows.push(['=== WAREHOUSE SCALE RECEIVING MANIFEST ===']);
    rows.push([
      'Warehouse Receiving ID',
      'Transport ID',
      'Receiving Date & Time',
      'Driver Name',
      'Truck Plate Number',
      'Receiving Staff',
      'Field Destination',
      'Arrived Warehouse',
      'Warehouse Gross Weight (Kg)',
      'Warehouse Tare Weight (Kg)',
      'Warehouse Net Weight (Kg)',
      'Field Dispatch Weight (Kg)',
      'Weight Variance (Kg)',
      'Weight Variance (%)',
    ]);
    rows.push([
      receivingIdWithDate,
      transportIdFormatted,
      new Date(intake.createdAt).toLocaleString(),
      transport.driverName || '',
      transport.plateNumber || '',
      intake.receivingStaffName || 'Warehouse Staff',
      getWarehouseId(transport.destinationWarehouse),
      getWarehouseId(intake.arrivedWarehouse || transport.destinationWarehouse),
      intake.warehouseGrossWeight || 0,
      intake.warehouseTareWeight || 0,
      netWeight,
      fieldWeight,
      diffKg,
      `${diffPercent.toFixed(2)}%`,
    ]);

    // ITEMIZED PURCHASE INVOICES SECTION
    rows.push([]);
    rows.push(['--- ASSIGNED FARMER PURCHASE INVOICES ---']);
    rows.push([
      'Warehouse Receiving ID',
      'Purchase ID',
      'Family Code',
      'Farmer Name',
      'Village',
      'Paddy Variety',
      'Grade',
      'Number of Sacks',
      'Field Net Weight (Kg)',
      'Total Net Payment (KHR)',
      'Account Holder',
    ]);

    purchases.forEach((p: any) => {
      const item = p.items?.[0] || {};
      const f = p.farmerProfile || {};
      const pIdFormatted = formatPurchaseId(p);

      rows.push([
        receivingIdWithDate,
        pIdFormatted,
        p.familyCode || '',
        p.farmerName || '',
        p.village || '',
        item.variety || 'Red Jasmine',
        item.grade || 'A1',
        item.sacks || 0,
        p.totalWeight || 0,
        p.netPayment || 0,
        f.accountHolder || p.farmerName,
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeTrId = transportIdFormatted.replace(/[^a-zA-Z0-9-]/g, '_');
    const exportUser = (exportUsername || intake.receivingStaffName || 'phearun').replace(/[^a-zA-Z0-9-]/g, '_');

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${safeTrId}_${arrivedWh}_${exportUser}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141c2f] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-center text-sky-400 font-extrabold text-xs">
              🏬
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Warehouse Receiving Scale Record
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {receivingIdFormatted}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Received on {new Date(intake.createdAt).toLocaleString()} by {intake.receivingStaffName || 'Warehouse Staff'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportTruckManifestCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-colors"
              title="Export Truck Manifest to CSV for Warehouse Record-Keeping"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export Truck {transportIdFormatted}</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Rejection Audit History */}
          <RejectionHistorySection entityType="WarehouseIntake" entityId={intake.id} />
          {/* Transport Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Transport ID</span>
              <span className="text-sky-400 font-mono font-bold">{transportIdFormatted}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Driver Name</span>
              <span className="text-white font-bold">{transport.driverName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Truck Plate Number</span>
              <span className="text-sky-400 font-mono font-extrabold">{transport.plateNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Receiving Staff</span>
              <span className="text-emerald-400 font-bold">👤 {intake.receivingStaffName || 'Warehouse Staff'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Field Destination</span>
              <span className="text-slate-300 font-mono font-bold">{getWarehouseId(transport.destinationWarehouse)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Arrived Warehouse</span>
              <span className="text-amber-300 font-mono font-bold">{getWarehouseId(intake.arrivedWarehouse || transport.destinationWarehouse)}</span>
            </div>
          </div>

          {/* 3. WEIGHT COMPARISON BOX & COLOR HIGHLIGHTING */}
          <div className="p-4 bg-[#0f172a] border border-sky-500/30 rounded-xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
              <span className="font-extrabold text-xs text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Weight Comparison & Scale Verification
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                  toleranceStatus === 'green'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : toleranceStatus === 'yellow'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {toleranceStatus === 'green' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {toleranceStatus === 'yellow' && <AlertTriangle className="w-3.5 h-3.5" />}
                {toleranceStatus === 'red' && <XCircle className="w-3.5 h-3.5" />}
                {toleranceText}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Field Dispatch Weight</span>
                <span className="font-mono font-bold text-slate-200 text-sm">{fieldWeight.toFixed(2)} kg</span>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Scale Weight</span>
                <span className="font-mono font-bold text-sky-300 text-sm">{intake.warehouseGrossWeight.toFixed(2)} kg</span>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tare Scale Weight</span>
                <span className="font-mono font-bold text-slate-400 text-sm">{intake.warehouseTareWeight.toFixed(2)} kg</span>
              </div>

              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl">
                <span className="text-sky-400 block text-[10px] uppercase font-bold">Warehouse Net Weight</span>
                <span className="font-mono font-black text-sky-400 text-base">{netWeight.toFixed(2)} kg</span>
              </div>
            </div>

            {/* Difference Banner */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">⚖️ Scale Difference (Warehouse Net vs Field Dispatch)</span>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-extrabold text-sm ${diffKg >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg
                </span>
                <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-full ${
                  toleranceStatus === 'green' ? 'bg-emerald-500/20 text-emerald-300' :
                  (toleranceStatus === 'yellow' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300')
                }`}>
                  ({diffKg >= 0 ? '+' : ''}{diffPercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Inventory Status Audit Banner */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-400">📦 Inventory Recording Status:</span>
                {intake.inventoryStatus === 'INVENTORY_RECORDED' ? (
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-purple-500/40">
                    ✓ INVENTORY RECORDED
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-amber-500/40">
                    ⏳ WAITING FOR INVENTORY
                  </span>
                )}
              </div>

              {intake.inventoryStatus === 'INVENTORY_RECORDED' && (
                <div className="text-slate-300 text-[11px] font-mono">
                  Recorded by: <strong className="text-white">{intake.inventoryStaffName || 'Inventory Staff'}</strong> · Location: <strong className="text-purple-300">{intake.inventoryLocation || 'Main Warehouse'}</strong>
                </div>
              )}
            </div>
          </div>

          {/* 4. SCALE DISPLAY & TRANSPORT INVOICE PHOTOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Gross Scale Photo */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Gross Scale Display Photo
              </span>
              {intake.grossScalePhotoUrl ? (
                <a href={formatImageSrc(intake.grossScalePhotoUrl)} target="_blank" rel="noreferrer">
                  <img
                    src={formatImageSrc(intake.grossScalePhotoUrl)}
                    alt="Gross Weight Scale Display"
                    className="h-28 w-full object-cover rounded-lg border border-sky-500/30 hover:opacity-90 cursor-pointer"
                  />
                </a>
              ) : (
                <div className="h-28 flex items-center justify-center text-slate-500 italic text-[11px] bg-[#1e293b] rounded-lg">
                  No Gross photo uploaded
                </div>
              )}
            </div>

            {/* Tare Scale Photo */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Tare Scale Display Photo
              </span>
              {intake.tareScalePhotoUrl ? (
                <a href={formatImageSrc(intake.tareScalePhotoUrl)} target="_blank" rel="noreferrer">
                  <img
                    src={formatImageSrc(intake.tareScalePhotoUrl)}
                    alt="Tare Weight Scale Display"
                    className="h-28 w-full object-cover rounded-lg border border-sky-500/30 hover:opacity-90 cursor-pointer"
                  />
                </a>
              ) : (
                <div className="h-28 flex items-center justify-center text-slate-500 italic text-[11px] bg-[#1e293b] rounded-lg">
                  No Tare photo uploaded
                </div>
              )}
            </div>

            {/* Truck Transport Invoice Photo */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Transport Invoice Photo
              </span>
              {intake.transportInvoiceUrl ? (
                <a href={formatImageSrc(intake.transportInvoiceUrl)} target="_blank" rel="noreferrer">
                  <img
                    src={formatImageSrc(intake.transportInvoiceUrl)}
                    alt="Truck Transport Invoice"
                    className="h-28 w-full object-cover rounded-lg border border-sky-500/30 hover:opacity-90 cursor-pointer"
                  />
                </a>
              ) : (
                <div className="h-28 flex items-center justify-center text-slate-500 italic text-[11px] bg-[#1e293b] rounded-lg">
                  No Invoice photo uploaded
                </div>
              )}
            </div>
          </div>

          {/* Assigned Cargo Manifest */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider">
              📦 Received Cargo Manifest ({purchases.length} Purchase Records)
            </h4>

            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Purchase ID</th>
                    <th className="p-2.5">Family Code</th>
                    <th className="p-2.5">Farmer Name</th>
                    <th className="p-2.5">Village</th>
                    <th className="p-2.5">Variety / Grade</th>
                    <th className="p-2.5 text-center">Sacks</th>
                    <th className="p-2.5 text-right">Field Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchases.map((p: any) => {
                    const item = p.items?.[0] || {};
                    return (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="p-2.5 font-mono font-bold text-sky-400 whitespace-nowrap">{formatPurchaseId(p)}</td>
                        <td className="p-2.5 font-extrabold text-amber-400">{p.familyCode}</td>
                        <td className="p-2.5 font-bold text-white">{p.farmerName}</td>
                        <td className="p-2.5 text-slate-300">{p.village}</td>
                        <td className="p-2.5 text-slate-300">{item.variety || 'Red Jasmine'} ({item.grade || 'A1'})</td>
                        <td className="p-2.5 text-center font-bold text-white">{item.sacks || 0}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-sky-400">{p.totalWeight.toFixed(2)} kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
