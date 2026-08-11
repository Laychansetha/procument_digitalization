'use client';

import { X, Scale, Camera, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';
import { formatImageSrc } from '@/lib/image-utils';

import RejectionHistorySection from '@/components/RejectionHistorySection';

interface FinanceTruckDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  truckData: any;
  scaleToleranceConfig?: {
    acceptableKg: number;
    warningKg: number;
    criticalKg: number;
  };
}

export default function FinanceTruckDetailsModal({
  isOpen,
  onClose,
  truckData,
  scaleToleranceConfig = { acceptableKg: 300, warningKg: 500, criticalKg: 500 },
}: FinanceTruckDetailsModalProps) {
  if (!isOpen || !truckData) return null;

  const transport = truckData.transport || {};
  const intake = truckData.intake || {};
  const purchases = truckData.purchases || [];

  const transportIdFormatted = `TR-2026-${transport.id?.slice(-6).toUpperCase()}`;
  const intakeIdFormatted = intake.id ? `WR-2026-${intake.id.slice(-6).toUpperCase()}` : 'Awaiting Intake';

  const fieldWeight = truckData.fieldWeight || 0;
  const netWeight = truckData.warehouseNetWeight || 0;
  const diffKg = truckData.weightDiffKg !== undefined && truckData.weightDiffKg !== null ? truckData.weightDiffKg : (netWeight - fieldWeight);
  const absDiffKg = Math.abs(diffKg);

  const acceptableKg = scaleToleranceConfig.acceptableKg;
  const warningKg = scaleToleranceConfig.warningKg;

  let toleranceStatus: 'green' | 'yellow' | 'red' = 'green';
  let toleranceText = 'Within Acceptable Tolerance ✓';

  if (absDiffKg > warningKg) {
    toleranceStatus = 'red';
    toleranceText = `Critical Discrepancy Exceeded (> ${warningKg} kg)!`;
  } else if (absDiffKg > acceptableKg) {
    toleranceStatus = 'yellow';
    toleranceText = `Warning Discrepancy Exceeded (> ${acceptableKg} kg)`;
  }

  // EXPORT SINGLE TRUCK FINANCE PAYMENT CSV
  const exportTruckFinanceCSV = () => {
    if (!purchases || purchases.length === 0) {
      alert('No purchase records associated with this truck.');
      return;
    }

    const rows: any[][] = [];

    rows.push(['=== TRUCK DISBURSEMENT & BANK PAYMENT REPORT ===']);
    rows.push([
      'Transport ID',
      'Warehouse Intake ID',
      'Driver Name',
      'Truck Plate Number',
      'Total Farmers',
      'Total Purchase Invoices',
      'Field Total Weight (Kg)',
      'Warehouse Net Weight (Kg)',
      'Scale Weight Variance (Kg)',
      'Absolute Variance (Kg)',
      'Tolerance Status',
      'Total Truck Net Payment (KHR)',
    ]);
    rows.push([
      transportIdFormatted,
      intakeIdFormatted,
      transport.driverName || 'N/A',
      transport.plateNumber || 'N/A',
      truckData.totalFarmersCount || 0,
      purchases.length,
      fieldWeight.toFixed(2),
      netWeight.toFixed(2),
      `${diffKg >= 0 ? '+' : ''}${diffKg.toFixed(2)}`,
      absDiffKg.toFixed(2),
      toleranceText,
      truckData.totalTruckNetPayment || 0,
    ]);

    rows.push([]);
    rows.push(['--- FARMER BANK DISBURSEMENT DETAILS ---']);
    rows.push([
      'Purchase ID',
      'Family Code',
      'Farmer Name',
      'Village',
      'Paddy Variety',
      'Grade',
      'Sacks',
      'Field Net Weight (Kg)',
      'Total Net Payment (KHR)',
      'Bank Name',
      'Account Number',
      'Account Holder',
      'Relationship',
      'Bank Document Proof Attached',
      'Farmer Signed',
    ]);

    purchases.forEach((p: any) => {
      const item = p.items?.[0] || {};
      const f = p.farmerProfile || {};
      const pIdFormatted = `PR-2026-${p.id.slice(-6).toUpperCase()}`;

      rows.push([
        pIdFormatted,
        p.familyCode || '',
        p.farmerName || '',
        p.village || '',
        item.variety || 'Red Jasmine',
        item.grade || 'A1',
        item.sacks || 0,
        p.totalWeight || 0,
        p.netPayment || 0,
        f.bankName || 'N/A',
        f.accountNumber || 'N/A',
        f.accountHolder || p.farmerName,
        f.relationship || 'Self',
        f.bankDocumentUrl ? 'YES' : 'NO',
        p.signatureFarmer ? 'YES' : 'NO',
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeTrId = transportIdFormatted.replace(/[^a-zA-Z0-9-]/g, '_');

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Finance_Payment_Report_${safeTrId}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141c2f] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 font-extrabold text-xs">
              💳
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Truck Payment Authorization & Verification Details
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {transportIdFormatted}
                </span>
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {intakeIdFormatted}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Review weighbridge scale proof photos, truck manifest, and farmer bank accounts before authorizing payment disbursement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportTruckFinanceCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-colors"
              title="Export Truck Farmer Payment CSV for Bank Transfers"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export Payment CSV</span>
            </button>

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Rejection Audit History */}
          <RejectionHistorySection entityType="TransportRecord" entityId={transport.id} />
          {intake?.id && <RejectionHistorySection entityType="WarehouseIntake" entityId={intake.id} />}

          {/* 2. WEIGHT VERIFICATION BOX */}
          <div className="p-4 bg-[#0f172a] border border-amber-500/30 rounded-2xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <span className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Weighbridge Reconciliation vs Field Weight (Tolerance Threshold: ±{acceptableKg} kg)
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

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Field Weight</span>
                <span className="font-mono font-bold text-white text-sm">{fieldWeight.toFixed(2)} kg</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Warehouse Net Weight</span>
                <span className="font-mono font-bold text-sky-400 text-sm">{netWeight.toFixed(2)} kg</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight Diff (+/- kg)</span>
                <span className={`font-mono font-extrabold text-sm ${diffKg >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg
                </span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Absolute Diff (ABS)</span>
                <span className={`font-mono font-extrabold text-sm ${absDiffKg <= acceptableKg ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {absDiffKg.toFixed(2)} kg
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <span className="text-amber-400 block text-[10px] uppercase font-bold">Total Net Payment</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {truckData.totalTruckNetPayment.toLocaleString()} KHR
                </span>
              </div>
            </div>

            {/* Inventory Confirmation Status Banner */}
            {intake && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-400">📦 Inventory Recording Status:</span>
                  {intake.inventoryStatus === 'INVENTORY_RECORDED' ? (
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-purple-500/40">
                      ✓ INVENTORY RECORDED (UNLOCKED FOR FINANCE)
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-amber-500/40 animate-pulse">
                      ⏳ WAITING FOR INVENTORY TEAM CONFIRMATION
                    </span>
                  )}
                </div>

                {intake.inventoryStatus === 'INVENTORY_RECORDED' && (
                  <div className="text-slate-300 text-[11px] font-mono">
                    Recorded by: <strong className="text-white">{intake.inventoryStaffName || 'Inventory Staff'}</strong> · Storage: <strong className="text-purple-300">{intake.inventoryLocation || 'Main Warehouse'}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scale Display Photos & Transport Invoice Document */}
          {intake && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase block">Gross Weight Scale Photo</span>
                  {intake.grossScalePhotoUrl ? (
                    <a href={intake.grossScalePhotoUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline text-[11px] flex items-center gap-1 mt-1">
                      <Camera className="w-3.5 h-3.5" /> View Gross Photo
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[10px]">No Photo Attached</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase block">Tare Weight Scale Photo</span>
                  {intake.tareScalePhotoUrl ? (
                    <a href={intake.tareScalePhotoUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline text-[11px] flex items-center gap-1 mt-1">
                      <Camera className="w-3.5 h-3.5" /> View Tare Photo
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[10px]">No Photo Attached</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase block">Transport Invoice Photo</span>
                  {intake.transportInvoiceUrl ? (
                    <a href={intake.transportInvoiceUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline text-[11px] flex items-center gap-1 mt-1">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> View Transport Invoice
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[10px]">No Invoice Photo Attached</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Completed Payment Transfer Receipt Proof Box */}
          {(transport.status === 'DISBURSED' || transport.paymentReceiptUrl) && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 shadow-xl">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed Payment & Bank Transfer Receipt Proof
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-emerald-500/40">
                  ✅ DISBURSED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="font-bold text-white">{transport.paymentMethod || 'ABA Bulk Transfer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch Ref Number</span>
                  <span className="font-mono font-bold text-amber-300">{transport.paymentBatchNumber || 'BATCH-2026'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid Date & Officer</span>
                  <span className="font-bold text-slate-200">
                    {transport.paidAt ? new Date(transport.paidAt).toLocaleDateString() : 'N/A'}{' '}
                    <span className="text-slate-400">({transport.paidByStaffName || 'Finance Officer'})</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Transfer Receipt Proof</span>
                  {transport.paymentReceiptUrl ? (
                    <a
                      href={transport.paymentReceiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 font-extrabold underline text-xs flex items-center gap-1 mt-0.5 hover:text-emerald-300"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> View / Download Bank Receipt
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[10px] italic">No Receipt Uploaded</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. ITEMISED FARMER INVOICES TABLE */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                🌾 Farmer Purchase Invoices & Commercial Bank Account Verification ({purchases.length} Invoices)
              </h4>
              <button
                onClick={exportTruckFinanceCSV}
                className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export {transportIdFormatted} CSV
              </button>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Purchase ID</th>
                    <th className="p-2.5">Family Code & Farmer</th>
                    <th className="p-2.5">Variety / Grade</th>
                    <th className="p-2.5 text-center">Sacks</th>
                    <th className="p-2.5 text-right">Field Weight</th>
                    <th className="p-2.5 text-right">Net Payment</th>
                    <th className="p-2.5">Bank Information</th>
                    <th className="p-2.5 text-center">Proof Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {purchases.map((p: any) => {
                    const item = p.items?.[0] || {};
                    const f = p.farmerProfile || {};
                    const pIdFormatted = `PR-2026-${p.id.slice(-6).toUpperCase()}`;

                    return (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="p-2.5 font-mono font-bold text-sky-400">{pIdFormatted}</td>
                        <td className="p-2.5 font-bold text-[#ffffff]">
                          <div>{p.farmerName} ({p.village})</div>
                          <div className="font-extrabold text-amber-400 text-[10px]">🆔 {p.familyCode}</div>
                        </td>
                        <td className="p-2.5">
                          <span className="font-bold text-sky-300">{item.variety || 'Red Jasmine'}</span>
                          <span className="ml-1 font-extrabold text-purple-400">({item.grade || 'A1'})</span>
                        </td>
                        <td className="p-2.5 text-center font-bold">{item.sacks || 0}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-200">{p.totalWeight.toFixed(2)} kg</td>
                        <td className="p-2.5 text-right font-mono font-black text-amber-400">
                          {p.netPayment.toLocaleString()} KHR
                        </td>
                        <td className="p-2.5">
                          {f.bankName ? (
                            <div>
                              <span className="font-bold text-sky-400">{f.bankName}</span>
                              <div className="font-mono text-slate-300 text-[11px]">{f.accountNumber}</div>
                              <div className="text-[10px] text-slate-400">{f.accountHolder || p.farmerName} ({f.relationship})</div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No Profile</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center space-y-1">
                          {formatImageSrc(f?.bankDocumentUrl) ? (
                            <a href={formatImageSrc(f.bankDocumentUrl)} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline text-[10px] block">
                              📄 Bank Paper Photo
                            </a>
                          ) : null}
                          {formatImageSrc(p.signatureFarmer) ? (
                            <span className="text-emerald-400 font-bold text-[10px] block">✓ Farmer Signed</span>
                          ) : null}
                        </td>
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
