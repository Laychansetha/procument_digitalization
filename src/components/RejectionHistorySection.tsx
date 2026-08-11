'use client';

import { useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle2, Clock } from 'lucide-react';

interface RejectionLogItem {
  id: string;
  entityType: string;
  entityId: string;
  targetModule: string;
  rejectedByName: string;
  rejectedByRole: string;
  reason: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedByName?: string;
}

interface RejectionHistorySectionProps {
  entityType: string;
  entityId: string;
}

export default function RejectionHistorySection({ entityType, entityId }: RejectionHistorySectionProps) {
  const [logs, setLogs] = useState<RejectionLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityType || !entityId) return;

    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rejections?entityType=${entityType}&entityId=${entityId}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error('Failed to fetch rejection logs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="p-3 bg-white/5 rounded-xl text-slate-400 text-xs animate-pulse">
        Loading rejection & correction history...
      </div>
    );
  }

  if (logs.length === 0) return null;

  return (
    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs border-b border-red-500/20 pb-2">
        <AlertOctagon className="w-4 h-4 text-red-400" />
        <span>📜 Rejection & Correction Audit History ({logs.length})</span>
      </div>

      <div className="space-y-2 text-xs">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3 bg-[#141c2f] border border-red-500/20 rounded-xl space-y-1"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-red-400">
                <span>{log.rejectedByName}</span>
                <span className="text-slate-400">({log.rejectedByRole})</span>
                <span className="text-slate-500">➔ Returned to {log.targetModule}</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                {new Date(log.createdAt).toLocaleDateString()}{' '}
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-slate-200 text-xs italic">
              "{log.reason}"
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px]">
              <span
                className={`font-bold flex items-center gap-1 ${
                  log.status === 'RESOLVED' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                }`}
              >
                {log.status === 'RESOLVED' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Corrected & Resubmitted
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-400" /> Pending Correction by {log.targetModule} Team
                  </>
                )}
              </span>

              {log.resolvedAt && (
                <span className="text-slate-400">
                  Resolved by: <strong className="text-white">{log.resolvedByName}</strong> (
                  {new Date(log.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
