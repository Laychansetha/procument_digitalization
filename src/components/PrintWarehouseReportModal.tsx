'use client';

import { X, Printer } from 'lucide-react';
import { getReportTranslation } from '@/lib/report-translations';
import { formatTransportId } from '@/lib/transport-id';
import { formatPurchaseId } from '@/lib/purchase-id';
import { getWarehouseDisplay, getWarehouseId } from '@/lib/warehouse-config';

interface PrintWarehouseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  intake: any;
  lang?: 'en' | 'km';
}

export default function PrintWarehouseReportModal({ isOpen, onClose, intake, lang = 'en' }: PrintWarehouseReportModalProps) {
  if (!isOpen || !intake) return null;

  const t = getReportTranslation(lang);
  const transport = intake.transport || {};
  const purchases = transport.purchases || [];

  const handlePrint = () => {
    window.print();
  };

  const arrivedWh = getWarehouseId(intake.arrivedWarehouse || transport.destinationWarehouse || 'W002');
  const staffUsername = intake.receivingStaffName || 'staff';
  const intakeId = `${staffUsername}_${arrivedWh}`;
  const transportId = formatTransportId(transport);

  const fieldWeight = transport.totalFieldWeight || 0;
  const netWeight = intake.warehouseNetWeight || 0;
  const diffKg = intake.weightDiffKg || 0;
  const diffPercent = intake.weightDiffPercent || 0;

  return (
    <>
      {/* 1. ON-SCREEN MODAL PREVIEW (Hidden during printing) */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Top Controls Bar */}
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800">Printable Warehouse Receiving Intake Report</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Scale Receiving Report
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
              <p className="text-[11px] text-slate-700 font-extrabold uppercase tracking-wider">{t.warehouseTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <p><strong className="text-slate-600">{t.receivingId}</strong> <span className="font-mono font-bold text-purple-900">{intakeId}</span></p>
                <p><strong className="text-slate-600">{t.transportId}</strong> <span className="font-mono font-bold text-sky-900">{transportId}</span></p>
                <p><strong className="text-slate-600">{t.truckPlate}</strong> <span className="font-mono font-bold">{transport.plateNumber}</span></p>
                <p><strong className="text-slate-600">{t.driverName}</strong> {transport.driverName}</p>
              </div>
              <div>
                <p><strong className="text-slate-600">{t.dateTime}</strong> {new Date(intake.createdAt).toLocaleString()}</p>
                <p><strong className="text-slate-600">Receiving Staff:</strong> {intake.receivingStaffName || 'Warehouse Scale Staff'}</p>
                <p><strong className="text-slate-600">Arrived Warehouse:</strong> <span className="font-mono font-bold text-slate-800">{getWarehouseDisplay(intake.arrivedWarehouse || transport.destinationWarehouse)}</span></p>
                <p><strong className="text-slate-600">Loaded Farmers:</strong> {purchases.length} Invoices Loaded</p>
                <p><strong className="text-slate-600">Total Loaded Sacks:</strong> {transport.totalSacks} Sacks</p>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 space-y-2">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                Scale Reconciliation & Variance Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t.totalFieldWeight}</span>
                  <span className="font-mono font-bold text-slate-900">{fieldWeight.toFixed(2)} kg</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t.warehouseGross}</span>
                  <span className="font-mono font-bold text-slate-900">{intake.warehouseGrossWeight.toFixed(2)} kg</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t.warehouseTare}</span>
                  <span className="font-mono font-bold text-slate-900">{intake.warehouseTareWeight.toFixed(2)} kg</span>
                </div>
                <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg">
                  <span className="text-sky-900 block text-[10px] uppercase font-bold">{t.warehouseNet}</span>
                  <span className="font-mono font-black text-sky-900 text-sm">{netWeight.toFixed(2)} kg</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Weighbridge Net Difference vs Field Dispatch:</span>
                <span className={`font-mono font-black text-xs sm:text-sm ${diffKg >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg ({diffPercent.toFixed(2)}%)
                </span>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {purchases.map((p: any) => {
                    const item = p.items?.[0] || {};
                    return (
                      <tr key={p.id}>
                        <td className="p-2 font-mono text-purple-900 font-bold whitespace-nowrap">{formatPurchaseId(p)}</td>
                        <td className="p-2 font-bold text-emerald-800">{p.familyCode}</td>
                        <td className="p-2 font-bold">{p.farmerName}</td>
                        <td className="p-2">{p.village}</td>
                        <td className="p-2">{item.variety || 'Red Jasmine'} ({item.grade || 'A1'})</td>
                        <td className="p-2 text-center font-bold">{item.sacks || 0}</td>
                        <td className="p-2 text-right font-mono font-bold">{p.totalWeight.toFixed(2)} kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center">
              <div className="flex flex-col items-center">
                <p className="font-bold text-slate-800 text-xs mb-2">Warehouse Scale Inspector</p>
                <div className="w-full h-20" />
                <div className="w-full border-b border-slate-400 my-1" />
                <p className="text-[10px] text-slate-400 italic">Signature & Date</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="font-bold text-slate-800 text-xs mb-2">Warehouse Operations Manager</p>
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
          <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">{t.warehouseTitle}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded-lg mb-4 text-xs">
          <div className="space-y-1">
            <p><strong className="text-slate-700">{t.receivingId}</strong> <span className="font-mono font-bold text-purple-900">{intakeId}</span></p>
            <p><strong className="text-slate-700">{t.transportId}</strong> <span className="font-mono font-bold text-sky-900">{transportId}</span></p>
            <p><strong className="text-slate-700">{t.truckPlate}</strong> <span className="font-mono font-bold">{transport.plateNumber}</span></p>
            <p><strong className="text-slate-700">{t.driverName}</strong> {transport.driverName}</p>
          </div>
          <div className="space-y-1">
            <p><strong className="text-slate-700">{t.dateTime}</strong> {new Date(intake.createdAt).toLocaleString()}</p>
            <p><strong className="text-slate-700">Receiving Staff:</strong> {intake.receivingStaffName || 'Warehouse Scale Staff'}</p>
            <p><strong className="text-slate-700">Arrived Warehouse:</strong> <span className="font-mono font-bold text-slate-800">{getWarehouseDisplay(intake.arrivedWarehouse || transport.destinationWarehouse)}</span></p>
            <p><strong className="text-slate-700">Loaded Farmers:</strong> {purchases.length} Invoices Loaded</p>
            <p><strong className="text-slate-700">Total Loaded Sacks:</strong> {transport.totalSacks} Sacks</p>
          </div>
        </div>

        <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 mb-4 space-y-2">
          <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
            Scale Reconciliation & Variance Breakdown
          </h4>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">{t.totalFieldWeight}</span>
              <span className="font-mono font-bold text-slate-900">{fieldWeight.toFixed(2)} kg</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">{t.warehouseGross}</span>
              <span className="font-mono font-bold text-slate-900">{intake.warehouseGrossWeight.toFixed(2)} kg</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">{t.warehouseTare}</span>
              <span className="font-mono font-bold text-slate-900">{intake.warehouseTareWeight.toFixed(2)} kg</span>
            </div>
            <div className="p-2 bg-sky-50 border border-sky-200 rounded">
              <span className="text-sky-900 block text-[10px] uppercase font-bold">{t.warehouseNet}</span>
              <span className="font-mono font-black text-sky-900 text-sm">{netWeight.toFixed(2)} kg</span>
            </div>
          </div>

          <div className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Weighbridge Net Difference vs Field Dispatch:</span>
            <span className={`font-mono font-black text-xs sm:text-sm ${diffKg >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg ({diffPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-6">
          <thead className="bg-slate-100 font-bold text-slate-800 uppercase border-b border-slate-300">
            <tr>
              <th className="p-2 border-r border-slate-300">Purchase ID</th>
              <th className="p-2 border-r border-slate-300">Family Code</th>
              <th className="p-2 border-r border-slate-300">Farmer Name</th>
              <th className="p-2 border-r border-slate-300">Village</th>
              <th className="p-2 border-r border-slate-300">Variety / Grade</th>
              <th className="p-2 text-center border-r border-slate-300">Sacks</th>
              <th className="p-2 text-right">Field Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {purchases.map((p: any) => {
              const item = p.items?.[0] || {};
              return (
                <tr key={p.id}>
                  <td className="p-2 font-mono text-purple-900 font-bold border-r border-slate-200 whitespace-nowrap">{formatPurchaseId(p)}</td>
                  <td className="p-2 font-bold text-emerald-800 border-r border-slate-200">{p.familyCode}</td>
                  <td className="p-2 font-bold border-r border-slate-200">{p.farmerName}</td>
                  <td className="p-2 border-r border-slate-200">{p.village}</td>
                  <td className="p-2 border-r border-slate-200">{item.variety || 'Red Jasmine'} ({item.grade || 'A1'})</td>
                  <td className="p-2 text-center font-bold border-r border-slate-200">{item.sacks || 0}</td>
                  <td className="p-2 text-right font-mono font-bold">{p.totalWeight.toFixed(2)} kg</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-300 text-center avoid-break">
          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-800 text-xs mb-2">Warehouse Scale Inspector</p>
            <div className="w-full h-20" />
            <div className="w-full border-b border-slate-400 my-1" />
            <p className="text-[10px] text-slate-500 italic">Signature & Date</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-800 text-xs mb-2">Warehouse Operations Manager</p>
            <div className="w-full h-20" />
            <div className="w-full border-b border-slate-400 my-1" />
            <p className="text-[10px] text-slate-500 italic">Signature & Date</p>
          </div>
        </div>
      </div>
    </>
  );
}
