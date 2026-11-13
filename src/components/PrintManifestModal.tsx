'use client';

import { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { getReportTranslation } from '@/lib/report-translations';
import { formatTransportId } from '@/lib/transport-id';
import { formatPurchaseId } from '@/lib/purchase-id';
import { getWarehouseDisplay } from '@/lib/warehouse-config';

interface PrintManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  transport: any;
  lang?: 'en' | 'km';
}

export default function PrintManifestModal({ isOpen, onClose, transport, lang = 'en' }: PrintManifestModalProps) {
  const [truckCleaned, setTruckCleaned] = useState(true);
  const [organicTransportOnly, setOrganicTransportOnly] = useState(true);
  const [transportWithConversionPaddy, setTransportWithConversionPaddy] = useState(false);

  if (!isOpen || !transport) return null;

  const t = getReportTranslation(lang);
  const handlePrint = () => {
    window.print();
  };

  const transportId = formatTransportId(transport);
  const purchases = transport.purchases || [];

  return (
    <>
      {/* 1. ON-SCREEN MODAL PREVIEW (Hidden during printing) */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Top Control Bar */}
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800">Paddy Transport Record</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="bg-[#38bdf8] hover:bg-sky-500 text-[#0b0f19] px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Transport Record
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
              <p className="text-sm text-slate-800 font-extrabold tracking-wide">{t.transportTitle}</p>
              <div className="flex items-center justify-center gap-4 pt-1 text-xs text-slate-700 font-semibold whitespace-nowrap">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={truckCleaned}
                    onChange={(e) => setTruckCleaned(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 accent-emerald-600 cursor-pointer"
                  />
                  <span>{t.transportSubtitle}</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={organicTransportOnly}
                    onChange={(e) => setOrganicTransportOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 accent-emerald-600 cursor-pointer"
                  />
                  <span>Organic Transport Only,</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={transportWithConversionPaddy}
                    onChange={(e) => setTransportWithConversionPaddy(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 accent-emerald-600 cursor-pointer"
                  />
                  <span>Transport With Conversion Paddy</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <p><strong className="text-slate-600">{t.transportId}</strong> <span className="font-mono font-bold text-sky-900">{transportId}</span></p>
                <p><strong className="text-slate-600">{t.truckPlate}</strong> <span className="font-mono font-bold">{transport.plateNumber}</span></p>
                <p><strong className="text-slate-600">{t.driverName}</strong> {transport.driverName} ({transport.mobileNumber || 'N/A'})</p>
                <p><strong className="text-slate-600">{t.dateTime}</strong> {new Date(transport.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p><strong className="text-slate-600">{t.loadingStation}</strong> {transport.loadingLocation || 'Preah Vihear'}</p>
                <p><strong className="text-slate-600">{t.destinationWarehouse}</strong> <span className="font-mono font-bold text-sky-900">{getWarehouseDisplay(transport.destinationWarehouse)}</span></p>
                <p><strong className="text-slate-600">{t.sacks}:</strong> {transport.totalSacks} Sacks</p>
                <p><strong className="text-slate-600">{t.totalFieldWeight}</strong> <span className="font-mono font-bold text-emerald-800">{transport.totalFieldWeight.toFixed(2)} kg</span></p>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-2">Purchase ID</th>
                    <th className="p-2">Family Code</th>
                    <th className="p-2">Farmer Name</th>
                    <th className="p-2">Village</th>
                    <th className="p-2">Variety / Grade</th>
                    <th className="p-2 text-center">Sacks</th>
                    <th className="p-2 text-right">Field Weight</th>
                    <th className="p-2 text-right">Net Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {purchases.map((p: any) => {
                    const item = p.items?.[0] || {};
                    return (
                      <tr key={p.id}>
                        <td className="p-2 font-mono text-sky-900 font-bold whitespace-nowrap">{formatPurchaseId(p)}</td>
                        <td className="p-2 font-bold text-emerald-800">{p.familyCode}</td>
                        <td className="p-2 font-bold">{p.farmerName}</td>
                        <td className="p-2">{p.village}</td>
                        <td className="p-2">{item.variety || 'Red Jasmine'} ({item.grade || 'A1'})</td>
                        <td className="p-2 text-center font-bold">{item.sacks || 0}</td>
                        <td className="p-2 text-right font-mono font-bold">{p.totalWeight.toFixed(2)} kg</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
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
                <p className="font-bold text-slate-800 text-xs mb-2">Loading Staff</p>
                <div className="w-full h-20" />
                <div className="w-full border-b border-slate-400 my-1" />
                <p className="text-[11px] text-slate-600 font-bold">{transport.fieldStaffName || 'Field Inspector'}</p>
                <p className="text-[10px] text-slate-400 italic">Signature & Date</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="font-bold text-slate-800 text-xs mb-2">Truck Driver</p>
                <div className="w-full h-20" />
                <div className="w-full border-b border-slate-400 my-1" />
                <p className="text-[11px] text-slate-600 font-bold">{transport.driverName}</p>
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
          <h2 className="text-sm font-black text-slate-800 tracking-wide">{t.transportTitle}</h2>
          <div className="flex items-center justify-center gap-4 pt-1 text-xs text-slate-800 font-bold whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 border-[1.5px] border-slate-800 rounded-[3px] inline-flex items-center justify-center text-[11px] font-black leading-none text-emerald-800">
                {truckCleaned ? '✓' : ''}
              </span>
              <span>{t.transportSubtitle}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 border-[1.5px] border-slate-800 rounded-[3px] inline-flex items-center justify-center text-[11px] font-black leading-none text-emerald-800">
                {organicTransportOnly ? '✓' : ''}
              </span>
              <span>Organic Transport Only,</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 border-[1.5px] border-slate-800 rounded-[3px] inline-flex items-center justify-center text-[11px] font-black leading-none text-emerald-800">
                {transportWithConversionPaddy ? '✓' : ''}
              </span>
              <span>Transport With Conversion Paddy</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded-lg mb-4 text-xs">
          <div className="space-y-1">
            <p><strong className="text-slate-700">{t.transportId}</strong> <span className="font-mono font-bold text-sky-900">{transportId}</span></p>
            <p><strong className="text-slate-700">{t.truckPlate}</strong> <span className="font-mono font-bold">{transport.plateNumber}</span></p>
            <p><strong className="text-slate-700">{t.driverName}</strong> {transport.driverName} ({transport.mobileNumber || 'N/A'})</p>
            <p><strong className="text-slate-700">{t.dateTime}</strong> {new Date(transport.createdAt).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p><strong className="text-slate-700">{t.loadingStation}</strong> {transport.loadingLocation || 'Chhaeb Buying Station'}</p>
            <p><strong className="text-slate-700">{t.destinationWarehouse}</strong> <span className="font-mono font-bold">{getWarehouseDisplay(transport.destinationWarehouse)}</span></p>
            <p><strong className="text-slate-700">{t.sacks}:</strong> {transport.totalSacks} Sacks</p>
            <p><strong className="text-slate-700">{t.totalFieldWeight}</strong> <span className="font-mono font-bold text-emerald-900">{transport.totalFieldWeight.toFixed(2)} kg</span></p>
          </div>
        </div>

        <table className="w-full text-left text-[10px] border-collapse border border-slate-300 mb-6">
          <thead className="bg-slate-100 font-bold text-slate-800 uppercase border-b border-slate-300">
            <tr>
              <th className="px-1.5 py-2 border-r border-slate-300">Purchase ID</th>
              <th className="px-1.5 py-2 border-r border-slate-300">Family Code</th>
              <th className="px-1.5 py-2 border-r border-slate-300">Farmer Name</th>
              <th className="px-1.5 py-2 border-r border-slate-300">Village</th>
              <th className="px-1.5 py-2 border-r border-slate-300">Variety / Grade</th>
              <th className="px-1.5 py-2 text-center border-r border-slate-300">Sacks</th>
              <th className="px-1.5 py-2 text-right border-r border-slate-300">Field Weight</th>
              <th className="px-1.5 py-2 text-right">Net Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {purchases.map((p: any) => {
              const item = p.items?.[0] || {};
              return (
                <tr key={p.id}>
                  <td className="px-1.5 py-1.5 font-mono text-sky-900 font-bold border-r border-slate-200 whitespace-nowrap">{formatPurchaseId(p)}</td>
                  <td className="px-1.5 py-1.5 font-bold text-emerald-800 border-r border-slate-200 whitespace-nowrap">{p.familyCode}</td>
                  <td className="px-1.5 py-1.5 font-bold border-r border-slate-200 whitespace-nowrap">{p.farmerName}</td>
                  <td className="px-1.5 py-1.5 border-r border-slate-200 whitespace-nowrap">{p.village}</td>
                  <td className="px-1.5 py-1.5 border-r border-slate-200 whitespace-nowrap">{item.variety || 'Red Jasmine'} ({item.grade || 'A1'})</td>
                  <td className="px-1.5 py-1.5 text-center font-bold border-r border-slate-200 whitespace-nowrap">{item.sacks || 0}</td>
                  <td className="px-1.5 py-1.5 text-right font-mono font-bold border-r border-slate-200 whitespace-nowrap">{p.totalWeight.toFixed(2)} kg</td>
                  <td className="px-1.5 py-1.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {p.netPayment.toLocaleString()} KHR
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-300 text-center avoid-break">
          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-800 text-xs mb-2">Loading Staff</p>
            <div className="w-full h-20" />
            <div className="w-full border-b border-slate-400 my-1" />
            <p className="text-[11px] text-slate-700 font-bold">{transport.fieldStaffName || 'Field Inspector'}</p>
            <p className="text-[10px] text-slate-500 italic">Signature & Date</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-800 text-xs mb-2">Truck Driver</p>
            <div className="w-full h-20 flex items-center justify-center">
              {transport.driverSignature ? (
                <img
                  src={transport.driverSignature}
                  alt="Driver Signature"
                  className="max-h-16 max-w-[160px] object-contain"
                />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            <div className="w-full border-b border-slate-400 my-1" />
            <p className="text-[11px] text-slate-700 font-bold">{transport.driverName}</p>
            <p className="text-[10px] text-slate-500 italic">Signature & Date</p>
          </div>
        </div>
      </div>
    </>
  );
}
