'use client';

import { useState } from 'react';
import { X, Scale, Camera, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';
import { formatImageSrc } from '@/lib/image-utils';

import RejectionHistorySection from '@/components/RejectionHistorySection';
import { formatTransportId } from '@/lib/transport-id';
import { formatPurchaseId } from '@/lib/purchase-id';
import { formatReceivingIdWithDate } from '@/lib/warehouse-config';

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
  const [exchangeRate, setExchangeRate] = useState<number | ''>('');

  if (!isOpen || !truckData) return null;

  const rate = exchangeRate !== '' && Number(exchangeRate) > 0 ? Number(exchangeRate) : 0;
  const isUSD = rate > 0;

  const transport = truckData.transport || {};
  const intake = truckData.intake || {};
  const purchases = truckData.purchases || [];

  const transportIdFormatted = formatTransportId(transport);
  const intakeIdFormatted = intake.id ? formatReceivingIdWithDate({ ...intake, transport }) : 'Awaiting Intake';

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
    if (isUSD) {
      rows.push(['Exchange Rate', `1 USD = ${rate} KHR`]);
    }
    rows.push([
      'Transport ID',
      'Receiving ID',
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
      ...(isUSD ? ['Total Truck Net Payment (USD)', 'Exchange Rate (KHR/USD)'] : []),
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
      ...(isUSD ? [((truckData.totalTruckNetPayment || 0) / rate).toFixed(2), rate] : []),
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
      'Net Payment (KHR)',
      ...(isUSD ? ['Net Payment (USD)'] : []),
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
        p.netPayment || 0,
        ...(isUSD ? [((p.netPayment || 0) / rate).toFixed(2)] : []),
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

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold truncate">Field Weight</span>
                <span className="font-mono font-bold text-white text-xs sm:text-[13px] block truncate">{fieldWeight.toFixed(2)} kg</span>
              </div>
              <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold truncate">Warehouse Net</span>
                <span className="font-mono font-bold text-sky-400 text-xs sm:text-[13px] block truncate">{netWeight.toFixed(2)} kg</span>
              </div>
              <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold truncate">Diff (+/- kg)</span>
                <span className={`font-mono font-extrabold text-xs sm:text-[13px] block truncate ${diffKg >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg
                </span>
              </div>
              <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold truncate">Diff (ABS)</span>
                <span className={`font-mono font-extrabold text-xs sm:text-[13px] block truncate ${absDiffKg <= acceptableKg ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {absDiffKg.toFixed(2)} kg
                </span>
              </div>
              <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-0.5">
                <span className="text-amber-400 block text-[10px] uppercase font-bold truncate">
                  Net Payment {isUSD ? '(USD)' : ''}
                </span>
                <span className="font-mono font-black text-amber-400 text-xs sm:text-[13px] block truncate">
                  {isUSD
                    ? `$${((truckData.totalTruckNetPayment || 0) / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                    : `${(truckData.totalTruckNetPayment || 0).toLocaleString()} KHR`}
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

          {/* Scale Display Photos, Transport Invoice Document & Exchange Rate */}
          {intake && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg space-y-0.5 flex flex-col justify-center">
                <span className="text-[9.5px] font-bold text-sky-400 uppercase tracking-tight block truncate">Gross Scale Photo</span>
                {intake.grossScalePhotoUrl ? (
                  <a href={intake.grossScalePhotoUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline text-[11px] flex items-center gap-1 hover:text-emerald-300 truncate">
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">View Gross Photo</span>
                  </a>
                ) : (
                  <span className="text-slate-500 text-[10px] italic">No Photo Attached</span>
                )}
              </div>

              <div className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg space-y-0.5 flex flex-col justify-center">
                <span className="text-[9.5px] font-bold text-sky-400 uppercase tracking-tight block truncate">Tare Scale Photo</span>
                {intake.tareScalePhotoUrl ? (
                  <a href={intake.tareScalePhotoUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline text-[11px] flex items-center gap-1 hover:text-emerald-300 truncate">
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">View Tare Photo</span>
                  </a>
                ) : (
                  <span className="text-slate-500 text-[10px] italic">No Photo Attached</span>
                )}
              </div>

              <div className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg space-y-0.5 flex flex-col justify-center">
                <span className="text-[9.5px] font-bold text-sky-400 uppercase tracking-tight block truncate">Transport Invoice</span>
                {intake.transportInvoiceUrl ? (
                  <a href={intake.transportInvoiceUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline text-[11px] flex items-center gap-1 hover:text-emerald-300 truncate">
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">View Invoice</span>
                  </a>
                ) : (
                  <span className="text-slate-500 text-[10px] italic">No Invoice Attached</span>
                )}
              </div>

              <div className="px-2.5 py-1.5 bg-white/5 border border-amber-500/30 rounded-lg space-y-0.5 flex flex-col justify-center">
                <span className="text-[9.5px] font-bold text-amber-400 uppercase tracking-tight block truncate">Exchange Rate (USD)</span>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-[11px] font-bold text-slate-300 font-mono shrink-0">$1 =</span>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setExchangeRate('');
                      } else {
                        const num = parseFloat(val);
                        setExchangeRate(isNaN(num) || num <= 0 ? '' : num);
                      }
                    }}
                    placeholder="4000"
                    className="w-full min-w-0 bg-[#1e293b] border border-amber-500/40 rounded px-1.5 py-0.5 text-[11px] text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400 no-spinners"
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                  />
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">KHR</span>
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
                🌾 Farmer Purchase Invoices & Bank Account Verification ({purchases.length} Invoices)
              </h4>
              <button
                onClick={exportTruckFinanceCSV}
                className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export {transportIdFormatted} CSV
              </button>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-left text-[10.5px]">
                <thead className="bg-white/5 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-2 px-2.5 whitespace-nowrap">Purchase ID</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Family Code & Farmer</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Variety / Grade</th>
                    <th className="py-2 px-2 text-center whitespace-nowrap">Sacks</th>
                    <th className="py-2 px-2.5 text-right whitespace-nowrap">Field Weight</th>
                    <th className="py-2 px-2.5 text-right whitespace-nowrap">Net Payment {isUSD ? '(USD)' : '(KHR)'}</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Bank Information</th>
                    <th className="py-2 px-2 text-center whitespace-nowrap">Proof Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {purchases.map((p: any) => {
                    const item = p.items?.[0] || {};
                    const f = p.farmerProfile || {};
                    const pIdFormatted = formatPurchaseId(p);

                    return (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="py-2 px-2.5 font-mono font-bold text-sky-400 whitespace-nowrap text-[10.5px]">
                          {pIdFormatted}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-white whitespace-nowrap text-[10.5px]">
                          <div className="truncate max-w-[150px]">{p.farmerName} ({p.village})</div>
                          <div className="font-extrabold text-amber-400 text-[9.5px]">🆔 {p.familyCode}</div>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap text-[10.5px]">
                          <div className="font-bold text-sky-300">{item.variety || 'Red Jasmine'}</div>
                          <div className="font-extrabold text-purple-400 text-[9.5px]">Grade: {item.grade || 'A1'}</div>
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-200 whitespace-nowrap text-[10.5px]">
                          {item.sacks || 0}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-200 whitespace-nowrap text-[10.5px]">
                          {p.totalWeight.toFixed(2)} kg
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-amber-400 whitespace-nowrap text-[10.5px]">
                          {isUSD
                            ? `$${((p.netPayment || 0) / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${(p.netPayment || 0).toLocaleString()} KHR`}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap text-[10.5px]">
                          {f.bankName ? (
                            <div>
                              <div className="font-bold text-sky-300">
                                {f.bankName} · <span className="font-mono text-slate-200">{f.accountNumber}</span>
                              </div>
                              <div className="text-[9.5px] text-slate-400">
                                {f.accountHolder || p.farmerName} ({f.relationship || 'Self'})
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[10px]">No Profile</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          {formatImageSrc(f?.bankDocumentUrl) ? (
                            <a
                              href={formatImageSrc(f.bankDocumentUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 font-bold underline text-[9.5px] block leading-tight hover:text-emerald-300"
                            >
                              📄 Bank Paper Photo
                            </a>
                          ) : null}
                          {formatImageSrc(p.signatureFarmer) ? (
                            <span className="text-emerald-400 font-bold text-[9.5px] block leading-tight">
                              ✓ Farmer Signed
                            </span>
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
