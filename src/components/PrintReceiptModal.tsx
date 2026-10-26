'use client';

import { Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatImageSrc } from '@/lib/image-utils';
import { getReportTranslation } from '@/lib/report-translations';
import { formatPurchaseId } from '@/lib/purchase-id';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  lang?: 'en' | 'km';
}

export default function PrintReceiptModal({ isOpen, onClose, purchase, lang = 'en' }: PrintReceiptModalProps) {
  if (!isOpen || !purchase) return null;

  const t = getReportTranslation(lang);
  const item = purchase.items?.[0] || {};
  let sackWeightsList: number[] = [];
  try {
    if (item.sackWeights) {
      sackWeightsList = JSON.parse(item.sackWeights);
    }
  } catch (e) {
    sackWeightsList = [];
  }

  const handlePrint = () => {
    window.print();
  };

  const receiptId = formatPurchaseId(purchase);

  return (
    <>
      {/* 1. ON-SCREEN MODAL PREVIEW (Hidden during printing) */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Top Control Bar */}
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800">Printable Paddy Purchase Receipt</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Screen Preview Content */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
            {/* Header */}
            <div className="text-center border-b border-slate-300 pb-3 space-y-1">
              <div className="w-12 h-12 bg-black border border-slate-700 rounded-xl flex items-center justify-center p-1 mx-auto mb-1.5 shadow-sm">
                <img src="/logo.png" alt="IBIS RICE CONSERVATION CO., LTD." className="w-full h-full object-contain rounded" />
              </div>
              <h1 className="text-base font-black text-slate-900 tracking-wide uppercase">
                {t.companyName}
              </h1>
              <p className="text-[11px] text-slate-700 font-extrabold uppercase tracking-wider">{t.receiptTitle}</p>
              <p className="text-[10px] text-slate-500">{t.receiptSubtitle}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <p><strong className="text-slate-600">{t.receiptNo}</strong> <span className="font-mono font-bold text-slate-900">{receiptId}</span></p>
                <p><strong className="text-slate-600">{t.dateTime}</strong> {new Date(purchase.createdAt).toLocaleString()}</p>
                <p><strong className="text-slate-600">{t.purchasingStaff}</strong> {purchase.purchasingStaffName || 'Field Inspector'}</p>
              </div>
              <div>
                <p><strong className="text-slate-600">{t.familyCode}</strong> <span className="font-bold text-emerald-700">{purchase.familyCode}</span></p>
                <p><strong className="text-slate-600">{t.farmerName}</strong> {purchase.farmerName}</p>
                <p><strong className="text-slate-600">{t.village}</strong> {purchase.village}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">{t.varietyGrade}</th>
                    <th className="p-2.5 text-center">{t.sacks}</th>
                    <th className="p-2.5 text-right">{t.weightKg}</th>
                    <th className="p-2.5 text-right">{t.unitPriceKhr}</th>
                    <th className="p-2.5 text-right">{t.grossTotalKhr}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-bold">
                      {item.variety || 'Red Jasmine'} ({item.grade || 'A1'})
                    </td>
                    <td className="p-2.5 text-center font-bold">{purchase.items?.[0]?.sacks || sackWeightsList.length}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{Math.round(purchase.totalWeight).toLocaleString()} kg</td>
                    <td className="p-2.5 text-right font-mono">{(item.finalPrice || item.standardPrice || 0).toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {purchase.totalPayment.toLocaleString()} KHR
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="space-y-1.5 max-w-sm ml-auto text-xs">
              <div className="flex justify-between py-0.5 border-b border-slate-200">
                <span className="text-slate-600">{t.grossPaddyValue}</span>
                <span className="font-mono font-bold text-slate-900">{purchase.totalPayment.toLocaleString()} KHR</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200 text-red-600">
                <span>{t.seedDeduction}</span>
                <span className="font-mono font-bold">-{purchase.seedDeduction.toLocaleString()} KHR</span>
              </div>
              <div className="flex justify-between py-1.5 border-t-2 border-slate-900 font-extrabold text-sm text-emerald-800">
                <span>{t.netPaymentToFarmer}</span>
                <span className="font-mono">{purchase.netPayment.toLocaleString()} KHR</span>
              </div>
            </div>

            {/* Dual Signatures Block */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center">
              <div className="flex flex-col items-center">
                <p className="font-bold text-slate-800 text-xs mb-2">{t.farmerSignature}</p>
                <div className="w-full h-20 flex items-end justify-center">
                  {formatImageSrc(purchase.signatureFarmer) ? (
                    <img src={formatImageSrc(purchase.signatureFarmer)} alt="Farmer Signature" className="h-full object-contain mx-auto" />
                  ) : null}
                </div>
                <div className="w-full border-b border-slate-400 my-1" />
                <p className="text-[11px] text-slate-700 font-bold">{purchase.farmerName}</p>
                <p className="text-[10px] text-slate-400 italic">Signature & Date</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="font-bold text-slate-800 text-xs mb-2">{t.staffSignature}</p>
                <div className="w-full h-20 flex items-end justify-center">
                  {formatImageSrc(purchase.signatureStaff) ? (
                    <img src={formatImageSrc(purchase.signatureStaff)} alt="Staff Signature" className="h-full object-contain mx-auto" />
                  ) : null}
                </div>
                <div className="w-full border-b border-slate-400 my-1" />
                <p className="text-[11px] text-slate-700 font-bold">{purchase.purchasingStaffName || 'Field Inspector'}</p>
                <p className="text-[10px] text-slate-400 italic">Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED OFFICIAL PAPER REPORT TEMPLATE (Rendered ONLY during window.print()) */}
      <div className="official-print-document hidden print:block w-full bg-white text-slate-900 font-sans p-2">
        {/* Header */}
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center p-1 mx-auto mb-2">
            <img src="/logo.png" alt="IBIS RICE CONSERVATION CO., LTD." className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-black tracking-wide text-slate-900 uppercase">
            {t.companyName}
          </h1>
          <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">{t.receiptTitle}</h2>
          <p className="text-[10px] text-slate-600 font-bold">{t.receiptSubtitle}</p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded-lg mb-4 text-xs">
          <div className="space-y-1">
            <p><strong className="text-slate-700">{t.receiptNo}</strong> <span className="font-mono font-bold text-slate-900">{receiptId}</span></p>
            <p><strong className="text-slate-700">{t.dateTime}</strong> {new Date(purchase.createdAt).toLocaleString()}</p>
            <p><strong className="text-slate-700">{t.purchasingStaff}</strong> {purchase.purchasingStaffName || 'Field Inspector'}</p>
          </div>
          <div className="space-y-1">
            <p><strong className="text-slate-700">{t.familyCode}</strong> <span className="font-bold text-emerald-800">{purchase.familyCode}</span></p>
            <p><strong className="text-slate-700">{t.farmerName}</strong> <span className="font-bold text-slate-900">{purchase.farmerName}</span></p>
            <p><strong className="text-slate-700">{t.village}</strong> {purchase.village}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-4">
          <thead className="bg-slate-100 font-bold text-slate-800 uppercase border-b border-slate-300">
            <tr>
              <th className="p-2.5 border-r border-slate-300">{t.varietyGrade}</th>
              <th className="p-2.5 text-center border-r border-slate-300">{t.sacks}</th>
              <th className="p-2.5 text-right border-r border-slate-300">{t.weightKg}</th>
              <th className="p-2.5 text-right border-r border-slate-300">{t.unitPriceKhr}</th>
              <th className="p-2.5 text-right">{t.grossTotalKhr}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="p-2.5 font-bold border-r border-slate-200">
                {item.variety || 'Red Jasmine'} ({item.grade || 'A1'})
              </td>
              <td className="p-2.5 text-center font-bold border-r border-slate-200">{purchase.items?.[0]?.sacks || sackWeightsList.length}</td>
              <td className="p-2.5 text-right font-mono font-bold border-r border-slate-200">{Math.round(purchase.totalWeight).toLocaleString()} kg</td>
              <td className="p-2.5 text-right font-mono border-r border-slate-200">{(item.finalPrice || item.standardPrice || 0).toLocaleString()}</td>
              <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                {purchase.totalPayment.toLocaleString()} KHR
              </td>
            </tr>
          </tbody>
        </table>

        {/* Financial Summary */}
        <div className="max-w-xs ml-auto space-y-1 text-xs mb-6">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-700">{t.grossPaddyValue}</span>
            <span className="font-mono font-bold text-slate-900">{purchase.totalPayment.toLocaleString()} KHR</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200 text-red-700">
            <span>{t.seedDeduction}</span>
            <span className="font-mono font-bold">-{purchase.seedDeduction.toLocaleString()} KHR</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-slate-900 font-extrabold text-sm text-slate-900">
            <span>{t.netPaymentToFarmer}</span>
            <span className="font-mono">{purchase.netPayment.toLocaleString()} KHR</span>
          </div>
        </div>

        {/* Dual Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-300 text-center avoid-break">
          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-800 text-xs mb-2">{t.farmerSignature}</p>
            <div className="w-full h-20 flex items-end justify-center">
              {formatImageSrc(purchase.signatureFarmer) ? (
                <img src={formatImageSrc(purchase.signatureFarmer)} alt="Farmer Signature" className="h-full object-contain mx-auto" />
              ) : null}
            </div>
            <div className="w-full border-b border-slate-400 my-1" />
            <p className="text-[11px] text-slate-700 font-bold">{purchase.farmerName}</p>
            <p className="text-[10px] text-slate-500 italic">Signature & Date</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-800 text-xs mb-2">{t.staffSignature}</p>
            <div className="w-full h-20 flex items-end justify-center">
              {formatImageSrc(purchase.signatureStaff) ? (
                <img src={formatImageSrc(purchase.signatureStaff)} alt="Staff Signature" className="h-full object-contain mx-auto" />
              ) : null}
            </div>
            <div className="w-full border-b border-slate-400 my-1" />
            <p className="text-[11px] text-slate-700 font-bold">{purchase.purchasingStaffName || 'Field Inspector'}</p>
            <p className="text-[10px] text-slate-500 italic">Signature & Date</p>
          </div>
        </div>
      </div>
    </>
  );
}
