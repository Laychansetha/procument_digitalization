'use client';

import { X, Edit, CreditCard, UserCheck, Image } from 'lucide-react';
import { formatImageSrc } from '@/lib/image-utils';

interface FarmerProfileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onEdit?: (profile: any) => void;
}

export default function FarmerProfileDetailsModal({
  isOpen,
  onClose,
  profile,
  onEdit,
}: FarmerProfileDetailsModalProps) {
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-[#141c2f] border border-white/10 text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-white">Farmer Payment Profile Details</h3>
            <span className="font-mono text-xs bg-sky-500/10 text-sky-400 font-bold px-2 py-0.5 rounded-full border border-sky-500/20">
              {profile.familyCode}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Farmer Primary Info */}
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Farmer Information</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Family Code:</span>{' '}
                <strong className="text-sky-400">{profile.familyCode}</strong>
              </div>
              <div>
                <span className="text-slate-400">Farmer Name:</span>{' '}
                <strong className="text-white">{profile.farmerName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Village:</span>{' '}
                <span className="text-slate-200">{profile.village}</span>
              </div>
              <div>
                <span className="text-slate-400">Phone Number:</span>{' '}
                <span className="text-slate-200">{profile.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Bank & Payment Account Details */}
          <div className="bg-sky-950/30 border border-sky-500/30 p-3.5 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Bank Account Credentials
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white/5 rounded-lg col-span-2">
                <span className="text-slate-400 block text-[10px]">Commercial Bank</span>
                <strong className="text-white text-sm">{profile.bankName || 'Direct Cash'}</strong>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Account Number</span>
                <strong className="font-mono text-sky-300 text-sm">{profile.accountNumber || 'N/A'}</strong>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Payment Method</span>
                <strong className="text-white">{profile.paymentMethod || 'Bank Transfer'}</strong>
              </div>
            </div>
          </div>

          {/* Account Owner Identification */}
          <div className="bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl space-y-1.5">
            <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Bank Account Holder Verification
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Registered Holder Name:</span>{' '}
                <strong className="text-white">{profile.accountHolder || profile.farmerName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Relationship to Farmer:</span>{' '}
                <strong className="text-purple-300">{profile.relationship || 'Self'}</strong>
              </div>
            </div>
          </div>

          {/* Uploaded Bank Document Photo */}
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Image className="w-4 h-4" /> Bank Passbook / Paper Document Photo
            </div>
            {formatImageSrc(profile.bankDocumentUrl) ? (
              <div className="space-y-2">
                <img
                  src={formatImageSrc(profile.bankDocumentUrl)}
                  alt="Bank Document"
                  className="w-full h-48 object-cover rounded-xl border border-white/20 shadow-md"
                />
                <a
                  href={formatImageSrc(profile.bankDocumentUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-sky-400 hover:underline font-bold inline-block"
                >
                  🔍 View Full Resolution Document Photo
                </a>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs italic bg-white/5 rounded-xl">
                No bank passbook or paper photo uploaded for this profile.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            Registered: {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(profile);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-[#0b0f19] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Edit className="w-4 h-4" /> Edit Payment Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
