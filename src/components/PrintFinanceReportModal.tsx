'use client';

import { X, Printer } from 'lucide-react';
import { getReportTranslation } from '@/lib/report-translations';
import { formatTransportId } from '@/lib/transport-id';
import { formatPurchaseId } from '@/lib/purchase-id';
import { formatReceivingIdWithDate } from '@/lib/warehouse-config';

interface PrintFinanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  truckData: any;
  lang?: 'en' | 'km';
}

export default function PrintFinanceReportModal({ isOpen, onClose, truckData, lang = 'en' }: PrintFinanceReportModalProps) {
  if (!isOpen || !truckData) return null;

  const t = getReportTranslation(lang);
  const transport = truckData.transport || {};
  const intake = truckData.intake || {};
  const purchases = truckData.purchases || [];

  const handlePrint = () => {
    window.print();
  };

  const transportId = formatTransportId(transport);
  const intakeId = intake?.id ? formatReceivingIdWithDate({ ...intake, transport }) : 'N/A';

  const fieldWeight = truckData.fieldWeight || 0;
  const netWeight = truckData.warehouseNetWeight || 0;
  const diffKg = truckData.weightDiffKg || 0;

  return (
    <>
      {/* 1. ON-SCREEN MODAL PREVIEW (Hidden during printing) */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Controls Bar */}
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800">Printable Truck Finance Payment Authorization</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Payment Manifest
              </button>
              <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Screen Preview Content */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
            <div className="text-center border-b border-slate-300 pb-3 space-y-1">
              <div className="w-12 h-12 bg-black border border-slate-700 rounded-xl flex items-center justify-center p-1 mx-auto mb-1.5 shadow-sm">
                <img src="/logo.png" alt="IBIS RICE CONSERVATION CO., LTD." className="w-full h-full object-contain rounded" />
              </div>
              <h1 className="text-base font-black text-slate-900 tracking-wide uppercase">
                {t.companyName}
              </h1>
              <p className="text-[11px] text-slate-700 font-extrabold uppercase tracking-wider">{t.financeTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <p><strong className="text-slate-600">{t.transportId}</strong> <span className="font-mono font-bold text-sky-900">{transportId}</span></p>
                <p><strong className="text-slate-600">{t.receivingId}</strong> <span className="font-mono font-bold text-purple-900">{intakeId}</span></p>
                <p><strong className="text-slate-600">{t.truckPlate}</strong> <span className="font-mono font-bold">{transport.plateNumber}</span></p>
                <p><strong className="text-slate-600">{t.driverName}</strong> {transport.driverName}</p>
              </div>
              <div>
                <p><strong className="text-slate-600">{t.totalLoadedFarmers}</strong> {truckData.totalFarmersCount} Farmers</p>
                <p><strong className="text-slate-600">Total Field Weight:</strong> {fieldWeight.toFixed(2)} kg</p>
                <p><strong className="text-slate-600">Warehouse Net Weight:</strong> {netWeight.toFixed(2)} kg (Diff: {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg)</p>
                <p><strong className="text-slate-600">{t.totalDisbursementAmount}</strong> <span className="font-mono font-bold text-amber-900 text-sm">{truckData.totalTruckNetPayment.toLocaleString()} KHR</span></p>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-2">Purchase ID</th>
                    <th className="p-2">Family Code</th>
                    <th className="p-2">Farmer Name</th>
                    <th className="p-2">{t.accountHolderName}</th>
                    <th className="p-2">{t.relationship}</th>
                    <th className="p-2">{t.bankAccount}</th>
                    <th className="p-2 text-right">{t.netPaymentKhr}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {purchases.map((p: any) => {
                    const f = p.farmerProfile || {};
                    return (
                      <tr key={p.id}>
                        <td className="p-2 font-mono text-sky-900 font-bold whitespace-nowrap">{formatPurchaseId(p)}</td>
                        <td className="p-2 font-bold text-emerald-800">{p.familyCode}</td>
                        <td className="p-2 font-bold">{p.farmerName}</td>
                        <td className="p-2 font-bold text-slate-800">{f.accountHolder || p.farmerName}</td>
                        <td className="p-2 font-semibold text-purple-900">{f.relationship || 'Self'}</td>
                        <td className="p-2">
                          <span className="font-bold text-sky-900">{f.bankName || 'Direct Cash'}</span>
                          <div className="font-mono text-slate-600 text-[10px]">{f.accountNumber || 'N/A'}</div>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-amber-900">
                          {p.netPayment.toLocaleString()} KHR
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center">
              <div className="flex flex-col items-center">
                <p className="font-bold text-slate-800 text-xs mb-2">{t.financeOfficer}</p>
                <div className="w-full h-20" />
                <div className="w-full border-b border-slate-400 my-1" />
                <p className="text-[10px] text-slate-400 italic">Signature & Date</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="font-bold text-slate-800 text-xs mb-2">{t.treasuryApprover}</p>
                <div className="w-full h-20" />
                <div className="w-full border-b border-slate-400 my-1" />
                <p className="text-[10px] text-slate-400 italic">Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED OFFICIAL PAPER REPORT TEMPLATE (Rendered ONLY during window.print()) */}
      <div className="official-print-document hidden print:block w-full bg-white text-slate-900 font-sans p-2">
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center p-1 mx-auto mb-2">
            <img src="/logo.png" alt="IBIS RICE CONSERVATION CO., LTD." className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-black tracking-wide text-slate-900 uppercase">
            {t.companyName}
          </h1>
          <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">{t.financeTitle}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded-lg mb-4 text-xs">
          <div className="space-y-1">
            <p><strong className="text-slate-700">{t.transportId}</strong> <span className="font-mono font-bold text-sky-900">{transportId}</span></p>
            <p><strong className="text-slate-700">{t.receivingId}</strong> <span className="font-mono font-bold text-purple-900">{intakeId}</span></p>
            <p><strong className="text-slate-700">{t.truckPlate}</strong> <span className="font-mono font-bold">{transport.plateNumber}</span></p>
            <p><strong className="text-slate-700">{t.driverName}</strong> {transport.driverName}</p>
          </div>
          <div className="space-y-1">
            <p><strong className="text-slate-700">{t.totalLoadedFarmers}</strong> {truckData.totalFarmersCount} Farmers</p>
            <p><strong className="text-slate-700">Total Field Weight:</strong> {fieldWeight.toFixed(2)} kg</p>
            <p><strong className="text-slate-700">Warehouse Net Weight:</strong> {netWeight.toFixed(2)} kg (Diff: {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg)</p>
            <p><strong className="text-slate-700">{t.totalDisbursementAmount}</strong> <span className="font-mono font-bold text-amber-900 text-sm">{truckData.totalTruckNetPayment.toLocaleString()} KHR</span></p>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-6">
          <thead className="bg-slate-100 font-bold text-slate-800 uppercase border-b border-slate-300">
            <tr>
              <th className="p-2 border-r border-slate-300">Purchase ID</th>
              <th className="p-2 border-r border-slate-300">Family Code</th>
              <th className="p-2 border-r border-slate-300">Farmer Name</th>
              <th className="p-2 border-r border-slate-300">{t.accountHolderName}</th>
              <th className="p-2 border-r border-slate-300">{t.relationship}</th>
              <th className="p-2 border-r border-slate-300">{t.bankAccount}</th>
              <th className="p-2 text-right">{t.netPaymentKhr}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {purchases.map((p: any) => {
              const f = p.farmerProfile || {};
              return (
                <tr key={p.id}>
                  <td className="p-2 font-mono text-sky-900 font-bold border-r border-slate-200 whitespace-nowrap">{formatPurchaseId(p)}</td>
                  <td className="p-2 font-bold text-emerald-800 border-r border-slate-200">{p.familyCode}</td>
                  <td className="p-2 font-bold border-r border-slate-200">{p.farmerName}</td>
                  <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{f.accountHolder || p.farmerName}</td>
                  <td className="p-2 font-semibold text-purple-900 border-r border-slate-200">{f.relationship || 'Self'}</td>
                  <td className="p-2 border-r border-slate-200">
                    <span className="font-bold text-sky-900">{f.bankName || 'Direct Cash'}</span>
                    <div className="font-mono text-slate-600 text-[10px]">{f.accountNumber || 'N/A'}</div>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-amber-900">
                    {p.netPayment.toLocaleString()} KHR
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-300 text-center avoid-break">
          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-800 text-xs mb-2">{t.financeOfficer}</p>
            <div className="w-full h-20" />
            <div className="w-full border-b border-slate-400 my-1" />
            <p className="text-[10px] text-slate-500 italic">Signature & Date</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-800 text-xs mb-2">{t.treasuryApprover}</p>
            <div className="w-full h-20" />
            <div className="w-full border-b border-slate-400 my-1" />
            <p className="text-[10px] text-slate-500 italic">Signature & Date</p>
          </div>
        </div>
      </div>
    </>
  );
}
