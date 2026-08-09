'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatImageSrc } from '@/lib/image-utils';
import {
  Search,
  CreditCard,
  Truck,
  FileCheck,
  Building2,
  DollarSign,
  ShieldAlert,
  LogOut,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Settings,
  MapPin,
  Tag,
  Landmark,
  Camera,
  Scale,
  FileSearch,
  UserCheck,
  PenTool,
  X,
  Package,
  Printer,
  Edit,
  Filter,
  XCircle,
  Clock,
  CheckSquare,
  Users as UsersIcon,
  KeyRound,
  UserPlus,
  ShieldCheck,
  User,
  Lock as LockIcon,
} from 'lucide-react';
import SearchableBankSelect from '@/components/SearchableBankSelect';
import SignaturePad from '@/components/SignaturePad';
import SpecsSelectorModal from '@/components/SpecsSelectorModal';
import PurchaseDetailsModal from '@/components/PurchaseDetailsModal';
import PrintReceiptModal from '@/components/PrintReceiptModal';
import PurchaseSelectorModal from '@/components/PurchaseSelectorModal';
import TransportDetailsModal from '@/components/TransportDetailsModal';
import PrintManifestModal from '@/components/PrintManifestModal';
import WarehouseDetailsModal from '@/components/WarehouseDetailsModal';
import PrintWarehouseReportModal from '@/components/PrintWarehouseReportModal';
import FinanceTruckDetailsModal from '@/components/FinanceTruckDetailsModal';
import PrintFinanceReportModal from '@/components/PrintFinanceReportModal';
import SpecsDetailsModal from '@/components/SpecsDetailsModal';
import FarmerProfileDetailsModal from '@/components/FarmerProfileDetailsModal';
import IbisLogo from '@/components/IbisLogo';

export default function OperationsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const currentUserRole = (session?.user as { role?: string })?.role || 'FIELD';
  const currentUserName = session?.user?.name || 'User';

  const [activeModule, setActiveModule] = useState<'field' | 'warehouse' | 'finance' | 'admin'>('field');
  const [fieldTab, setFieldTab] = useState<'specs' | 'payment' | 'purchase' | 'transport'>('specs');
  const [adminTab, setAdminTab] = useState<'users' | 'villages' | 'banks' | 'prices' | 'tolerance' | 'audit'>('users');

  const [syncStatus, setSyncStatus] = useState<string>('');
  const [successBanner, setSuccessBanner] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Modals state
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [selectedSpecsRecordId, setSelectedSpecsRecordId] = useState<string | null>(null);
  const [selectedSpecsForDetails, setSelectedSpecsForDetails] = useState<any>(null);
  const [selectedFarmerProfileForDetails, setSelectedFarmerProfileForDetails] = useState<any>(null);

  const [selectedPurchaseForDetails, setSelectedPurchaseForDetails] = useState<any>(null);
  const [selectedPurchaseForPrint, setSelectedPurchaseForPrint] = useState<any>(null);

  // Transport Modals state
  const [isPurchaseSelectorOpen, setIsPurchaseSelectorOpen] = useState(false);
  const [selectedTransportForDetails, setSelectedTransportForDetails] = useState<any>(null);
  const [selectedTransportForPrint, setSelectedTransportForPrint] = useState<any>(null);

  // Warehouse Modals & History state
  const [selectedIntakeForDetails, setSelectedIntakeForDetails] = useState<any>(null);
  const [selectedIntakeForPrint, setSelectedIntakeForPrint] = useState<any>(null);
  const [whSearchQuery, setWhSearchQuery] = useState('');

  // Finance Modals & Truck State
  const [financeTrucks, setFinanceTrucks] = useState<any[]>([]);
  const [selectedFinanceTruckForDetails, setSelectedFinanceTruckForDetails] = useState<any>(null);
  const [selectedFinanceTruckForPrint, setSelectedFinanceTruckForPrint] = useState<any>(null);
  const [finSearchQuery, setFinSearchQuery] = useState('');
  const [finStatusFilter, setFinStatusFilter] = useState('ALL');

  // Finance Payment Modal State
  const [paymentModalTruck, setPaymentModalTruck] = useState<any>(null);
  const [payMethodInput, setPayMethodInput] = useState('ABA Bulk Transfer');
  const [payBatchInput, setPayBatchInput] = useState(`BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);

  // Admin Configurable Tolerance (%)
  const [maxWeightTolerancePercent, setMaxWeightTolerancePercent] = useState<number>(1.0);

  // User Management State
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [uFullName, setUFullName] = useState('');
  const [uUsername, setUUsername] = useState('');
  const [uPassword, setUPassword] = useState('Ibis2026!');
  const [uRole, setURole] = useState<'FIELD' | 'WAREHOUSE' | 'FINANCE' | 'ADMIN'>('FIELD');
  const [uStatus, setUStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [resetPassInput, setResetPassInput] = useState('');

  // Search & Filter state for Purchase History Table
  const [pSearchQuery, setPSearchQuery] = useState('');
  const [pFilterVillage, setPFilterVillage] = useState('ALL');
  const [pFilterVariety, setPFilterVariety] = useState('ALL');
  const [pFilterStaff, setPFilterStaff] = useState('ALL');

  // Search state for Transport History Table
  const [tSearchQuery, setTSearchQuery] = useState('');

  // Search states for Field Operations (Specs Record & Farmer Payment Profile)
  const [specsSearchQuery, setSpecsSearchQuery] = useState('');
  const [farmerProfileSearchQuery, setFarmerProfileSearchQuery] = useState('');

  // Data states
  const [villages, setVillages] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [priceSpecs, setPriceSpecs] = useState<any[]>([]);
  const [specsList, setSpecsList] = useState<any[]>([]);
  const [farmerProfiles, setFarmerProfiles] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [warehouseIntakes, setWarehouseIntakes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Form states - Specs Entry
  const [spFamilyCode, setSpFamilyCode] = useState('');
  const [spFarmerName, setSpFarmerName] = useState('');
  const [spVillage, setSpVillage] = useState('');
  const [spPaddyType, setSpPaddyType] = useState('');
  const [spSelectedGrade, setSpSelectedGrade] = useState('');
  const [spIsOrganic, setSpIsOrganic] = useState(true);
  const [spMoisture, setSpMoisture] = useState(13.5);
  const [spForeign, setSpForeign] = useState(4);
  const [spWhole, setSpWhole] = useState(75);
  const [spBroken, setSpBroken] = useState(25);
  const [editingSpecsId, setEditingSpecsId] = useState<string | null>(null);

  // Form states - Farmer Payment
  const [payFamilyCode, setPayFamilyCode] = useState('');
  const [payFarmerName, setPayFarmerName] = useState('');
  const [payVillage, setPayVillage] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payBankName, setPayBankName] = useState('ABA Bank');
  const [payAccountNumber, setPayAccountNumber] = useState('');
  const [payAccountHolder, setPayAccountHolder] = useState('');
  const [payRelationship, setPayRelationship] = useState('Self');
  const [payCustomRelationship, setPayCustomRelationship] = useState('');
  const [payBankPhotoUrl, setPayBankPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Form states - Purchase Invoice
  const [pFamilyCode, setPFamilyCode] = useState('');
  const [pFarmerName, setPFarmerName] = useState('');
  const [pVillage, PVillage] = useState('');
  const [pVariety, setPVariety] = useState('Red Jasmine');
  const [pGrade, setPGrade] = useState('A1');
  const [pStandardPrice, setPStandardPrice] = useState(1997.5);

  const [pAdditionalPriceInput, setPAdditionalPriceInput] = useState('0');
  const [pSeedBorrowedInput, setPSeedBorrowedInput] = useState('0');

  const [pSackInput, setPSackInput] = useState('');
  const [pSackWeights, setPSackWeights] = useState<number[]>([]);
  const [pFarmerSignature, setPFarmerSignature] = useState('');
  const [pStaffSignature, setPStaffSignature] = useState('');
  const [sigClearKey, setSigClearKey] = useState(0);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);

  // Form states - Transport Dispatch
  const [selectedPurchasesForTruck, setSelectedPurchasesForTruck] = useState<any[]>([]);
  const [tDriver, setTDriver] = useState('');
  const [tPlate, setTPlate] = useState('');
  const [tMobile, setTMobile] = useState('');
  const [tCleaned, setTCleaned] = useState(true);
  const [tLoadingLocation, setTLoadingLocation] = useState('');
  const [tDestinationWarehouse, setTDestinationWarehouse] = useState('');
  const [tNotes, setTNotes] = useState('');
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);

  // Form states - Warehouse Intake Scale
  const [selectedTransportId, setSelectedTransportId] = useState('');
  const [whGrossWeight, setWhGrossWeight] = useState('');
  const [whTareWeight, setWhTareWeight] = useState('');
  const [whGrossPhotoUrl, setWhGrossPhotoUrl] = useState('');
  const [whTarePhotoUrl, setWhTarePhotoUrl] = useState('');
  const [uploadingGrossPhoto, setUploadingGrossPhoto] = useState(false);
  const [uploadingTarePhoto, setUploadingTarePhoto] = useState(false);
  const [whNotes, setWhNotes] = useState('');
  const [editingIntakeId, setEditingIntakeId] = useState<string | null>(null);

  // Admin Configurable Scale Weight Tolerance Settings (kg)
  const [scaleToleranceAcceptable, setScaleToleranceAcceptable] = useState<number>(300);
  const [scaleToleranceWarning, setScaleToleranceWarning] = useState<number>(500);
  const [scaleToleranceCritical, setScaleToleranceCritical] = useState<number>(500);

  // Form states - Admin Settings
  const [newVillageName, setNewVillageName] = useState('');
  const [newVillageDistrict, setNewVillageDistrict] = useState('Chhaeb');

  const [newBankName, setNewBankName] = useState('');
  const [newBankCode, setNewBankCode] = useState('');

  const [newSpecVariety, setNewSpecVariety] = useState('');
  const [newSpecGrade, setNewSpecGrade] = useState('A1');
  const [newSpecBasePrice, setNewSpecBasePrice] = useState(1650);
  const [newSpecOrganicBonus, setNewSpecOrganicBonus] = useState(100);
  const [newSpecMaxMoisture, setNewSpecMaxMoisture] = useState(14.0);
  const [newSpecMaxForeign, setNewSpecMaxForeign] = useState(5.0);

  // ROLE-BASED ACCESS GUARD & INITIAL MODULE SETTING
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const role = currentUserRole;
      if (role === 'FIELD') setActiveModule('field');
      else if (role === 'WAREHOUSE') setActiveModule('warehouse');
      else if (role === 'FINANCE') setActiveModule('finance');
      else if (role === 'ADMIN') setActiveModule('field');

      refreshAllData();
    }
  }, [status]);

  const refreshAllData = async () => {
    try {
      const [resVillages, resBanks, resPriceSpecs, resSpecs, resFarmers, resPurchases, resTransports, resIntakes, resFinanceTrucks, resAudit, resUsers] =
        await Promise.all([
          fetch('/api/admin/villages'),
          fetch('/api/admin/banks'),
          fetch('/api/admin/price-specs'),
          fetch('/api/specs'),
          fetch('/api/farmers'),
          fetch('/api/purchases'),
          fetch('/api/transport'),
          fetch('/api/warehouse/intake'),
          fetch('/api/finance/trucks'),
          fetch('/api/audit'),
          fetch('/api/admin/users'),
        ]);

      if (resVillages.ok) {
        const vData = await resVillages.json();
        setVillages(vData);
        if (vData.length > 0) {
          if (!spVillage) setSpVillage(vData[0].name);
          if (!payVillage) setPayVillage(vData[0].name);
          if (!pVillage) PVillage(vData[0].name);
        }
      }

      if (resBanks.ok) {
        const bData = await resBanks.json();
        setBanks(bData);
        if (bData.length > 0 && !payBankName) {
          setPayBankName(bData[0].name);
        }
      }

      if (resPriceSpecs.ok) {
        const psData = await resPriceSpecs.json();
        setPriceSpecs(psData);
        if (psData.length > 0) {
          if (!spPaddyType) setSpPaddyType(psData[0].variety);
          if (!spSelectedGrade) setSpSelectedGrade(psData[0].grade);
        }
      }

      if (resSpecs.ok) setSpecsList(await resSpecs.json());
      if (resFarmers.ok) setFarmerProfiles(await resFarmers.json());
      if (resPurchases.ok) setPurchases(await resPurchases.json());
      if (resTransports.ok) setTransports(await resTransports.json());

      if (resIntakes.ok) setWarehouseIntakes(await resIntakes.json());
      if (resFinanceTrucks.ok) setFinanceTrucks(await resFinanceTrucks.json());
      if (resAudit.ok) setAuditLogs(await resAudit.json());
      if (resUsers.ok) setUserAccounts(await resUsers.json());

      fetch('/api/admin/scale-tolerance')
        .then((res) => res.json())
        .then((data) => {
          if (data.acceptableKg !== undefined) setScaleToleranceAcceptable(data.acceptableKg);
          if (data.warningKg !== undefined) setScaleToleranceWarning(data.warningKg);
          if (data.criticalKg !== undefined) setScaleToleranceCritical(data.criticalKg);
        })
        .catch(() => {});
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  // Selected En-Route Truck for Warehouse Intake
  const selectedEnRouteTransport = transports.find((t) => t.id === selectedTransportId);
  const selectedTruckPurchases = selectedEnRouteTransport?.purchases || [];
  const selectedTruckFarmersCount = new Set(selectedTruckPurchases.map((p: any) => p.familyCode)).size;

  // Calculated Warehouse Net Weight & Comparison
  const whGrossVal = parseFloat(whGrossWeight) || 0;
  const whTareVal = parseFloat(whTareWeight) || 0;
  const whCalculatedNetWeight = Math.max(0, whGrossVal - whTareVal);
  const whFieldWeight = selectedEnRouteTransport?.totalFieldWeight || 0;
  const whWeightDiffKg = whCalculatedNetWeight - whFieldWeight;
  const whAbsDiffKg = Math.abs(whWeightDiffKg);
  const whWeightDiffPercent = whFieldWeight > 0 ? (whWeightDiffKg / whFieldWeight) * 100 : 0;

  // Tolerance Status (Green, Yellow, Red) based on ABS(Net - Field) kg thresholds
  let whToleranceStatus: 'green' | 'yellow' | 'red' = 'green';
  let whToleranceBadgeText = `🟢 Within Tolerance (ABS ${whAbsDiffKg.toFixed(2)} kg ≤ ${scaleToleranceAcceptable} kg)`;

  if (whAbsDiffKg > scaleToleranceWarning) {
    whToleranceStatus = 'red';
    whToleranceBadgeText = `🔴 Critical Exceeded (ABS ${whAbsDiffKg.toFixed(2)} kg > ${scaleToleranceWarning} kg)`;
  } else if (whAbsDiffKg > scaleToleranceAcceptable) {
    whToleranceStatus = 'yellow';
    whToleranceBadgeText = `🟡 Warning Exceeded (ABS ${whAbsDiffKg.toFixed(2)} kg > ${scaleToleranceAcceptable} kg)`;
  }

  // USER MANAGEMENT HANDLERS
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uFullName || !uUsername || !uPassword) {
      alert('Full Name, Username, and Password are required.');
      return;
    }

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: uFullName,
        email: uUsername,
        password: uPassword,
        role: uRole,
        status: uStatus,
      }),
    });

    if (res.ok) {
      setSyncStatus(`✅ User account "${uFullName}" created successfully!`);
      setUFullName('');
      setUUsername('');
      setUPassword('Ibis2026!');
      refreshAllData();
    } else {
      const err = await res.json();
      alert('Failed to create user: ' + err.error);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setSyncStatus(`✅ User account "${name}" status updated to ${newStatus}.`);
      refreshAllData();
    } else {
      alert('Failed to update user status.');
    }
  };

  const handleResetUserPassword = async (userId: string, name: string) => {
    if (!resetPassInput.trim()) {
      alert('Please enter a new password to reset.');
      return;
    }

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassInput.trim() }),
    });

    if (res.ok) {
      setSyncStatus(`✅ Password reset successfully for "${name}".`);
      setEditingUserId(null);
      setResetPassInput('');
      refreshAllData();
    } else {
      alert('Failed to reset password');
    }
  };

  const handleDeleteUserAccount = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user account "${name}"? This action cannot be undone.`)) return;

    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setSyncStatus(`✅ User account "${name}" deleted.`);
      refreshAllData();
    } else {
      alert('Failed to delete user account.');
    }
  };

  // ADMIN: Save Scale Weight Tolerance Configuration
  const handleSaveScaleToleranceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/scale-tolerance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acceptableKg: scaleToleranceAcceptable,
        warningKg: scaleToleranceWarning,
        criticalKg: scaleToleranceCritical,
      }),
    });

    if (res.ok) {
      setSyncStatus(`✅ Scale Tolerance Settings saved! Acceptable: ±${scaleToleranceAcceptable} kg`);
      refreshAllData();
    } else {
      alert('Failed to save scale tolerance settings.');
    }
  };

  // Handle Importing Specs Record into Purchase Form
  const handleSelectSpecsRecord = (spec: any) => {
    setPFamilyCode(spec.familyCode);
    setPFarmerName(spec.farmerName);
    PVillage(spec.village);
    setPVariety(spec.paddyType);
    setPGrade(spec.selectedGrade);
    setPStandardPrice(spec.finalPrice);
    setSelectedSpecsRecordId(spec.id);
    setSyncStatus(`✓ Loaded Approved Specs for Family Code ${spec.familyCode} (${spec.farmerName})`);
  };

  // Add Sack Weight(s) to Array
  const handleAddSackWeight = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pSackInput.trim()) return;

    const parsedWeights = pSackInput
      .split(/[\s,]+/)
      .map((val) => parseFloat(val))
      .filter((w) => !isNaN(w) && w > 0);

    if (parsedWeights.length > 0) {
      setPSackWeights((prev) => [...prev, ...parsedWeights]);
      setPSackInput('');
    }
  };

  // Remove individual sack weight
  const handleRemoveSackWeight = (indexToRemove: number) => {
    setPSackWeights((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Clear all sacks
  const handleClearAllSacks = () => {
    setPSackWeights([]);
  };

  // Helper reset function to clear entire purchase form after saving
  const resetPurchaseForm = () => {
    setEditingPurchaseId(null);
    setPFamilyCode('');
    setPFarmerName('');
    PVillage(villages[0]?.name || '');
    setPVariety(priceSpecs[0]?.variety || 'Red Jasmine');
    setPGrade('A1');
    setPStandardPrice(priceSpecs[0]?.basePrice || 1997.5);
    setPAdditionalPriceInput('0');
    setPSackWeights([]);
    setPSackInput('');
    setPSeedBorrowedInput('0');
    setPFarmerSignature('');
    setPStaffSignature('');
    setSelectedSpecsRecordId(null);
    setSigClearKey((prev) => prev + 1);
  };

  // Calculated values for Purchase Section
  const pAdditionalPrice = parseFloat(pAdditionalPriceInput) || 0;
  const pSeedBorrowed = parseFloat(pSeedBorrowedInput) || 0;

  const finalPurchasePrice = pStandardPrice + pAdditionalPrice;
  const totalSacksCount = pSackWeights.length;
  const totalWeightKg = pSackWeights.reduce((sum, w) => sum + w, 0);
  const totalPaddyValue = totalWeightKg * finalPurchasePrice;

  // Seed Return Deduction Calculations
  const seedRepaymentQty = pSeedBorrowed * 1.1; // 10% interest
  const seedDeductionTotal = seedRepaymentQty * pStandardPrice;
  const netPaymentToFarmer = Math.max(0, totalPaddyValue - seedDeductionTotal);

  // Upload Bank Paper Document Photo
  const handleBankPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setPayBankPhotoUrl(data.url);
        setSyncStatus('✅ Bank paper photo uploaded successfully!');
      } else {
        alert('Photo upload failed: ' + data.error);
      }
    } catch (err) {
      alert('Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Upload Warehouse Scale Photo (Gross or Tare)
  const handleScalePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'gross' | 'tare') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'gross') setUploadingGrossPhoto(true);
    else setUploadingTarePhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        if (type === 'gross') setWhGrossPhotoUrl(data.url);
        else setWhTarePhotoUrl(data.url);
        setSyncStatus(`✅ ${type === 'gross' ? 'Gross' : 'Tare'} scale photo uploaded!`);
      } else {
        alert('Photo upload failed: ' + data.error);
      }
    } catch (err) {
      alert('Failed to upload photo.');
    } finally {
      if (type === 'gross') setUploadingGrossPhoto(false);
      else setUploadingTarePhoto(false);
    }
  };

  const resetSpecsForm = () => {
    setEditingSpecsId(null);
    setSpFamilyCode('');
    setSpFarmerName('');
    setSpVillage(villages[0]?.name || '');
    setSpPaddyType(priceSpecs[0]?.variety || 'Red Jasmine');
    setSpSelectedGrade('A1');
    setSpIsOrganic(true);
    setSpMoisture(13.5);
    setSpForeign(4);
    setSpWhole(75);
    setSpBroken(25);
  };

  const handleEditSpecs = (spec: any) => {
    const isUsed = purchases.some((p: any) => p.specsRecordId === spec.id);
    if (isUsed) {
      alert('This Specs Record has already been used for a purchase and can no longer be edited.');
      return;
    }

    setEditingSpecsId(spec.id);
    setSpFamilyCode(spec.familyCode || '');
    setSpFarmerName(spec.farmerName || '');
    setSpVillage(spec.village || villages[0]?.name || '');
    setSpPaddyType(spec.paddyType || priceSpecs[0]?.variety || 'Red Jasmine');
    setSpSelectedGrade(spec.selectedGrade || 'A1');
    setSpIsOrganic(spec.isOrganic ?? true);
    setSpMoisture(spec.moisture ?? 13.5);
    setSpForeign(spec.foreignMatter ?? 4);
    setSpWhole(spec.wholeGrain ?? 75);
    setSpBroken(spec.brokenRice ?? 25);

    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  // Submit or Update Specs Record
  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spFamilyCode || !spFarmerName) {
      alert('Please fill in Family Code and Farmer Name.');
      return;
    }

    const currentSpec = priceSpecs.find((s) => s.variety === spPaddyType && s.grade === spSelectedGrade);
    const baseP = currentSpec ? currentSpec.basePrice : 1650;
    const bonusP = spIsOrganic ? (currentSpec ? currentSpec.organicBonus : 100) : 0;

    const payload = {
      familyCode: spFamilyCode,
      farmerName: spFarmerName,
      village: spVillage,
      paddyType: spPaddyType,
      selectedGrade: spSelectedGrade,
      isOrganic: spIsOrganic,
      moisture: spMoisture,
      foreignMatter: spForeign,
      wholeGrain: spWhole,
      brokenRice: spBroken,
      isValid: spMoisture <= (currentSpec?.maxMoisture || 14.0) && spForeign <= (currentSpec?.maxForeignMatter || 5.0),
      basePrice: baseP,
      organicBonus: bonusP,
      finalPrice: baseP + bonusP,
    };

    let res;
    if (editingSpecsId) {
      res = await fetch(`/api/specs/${editingSpecsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      setSyncStatus(
        editingSpecsId
          ? 'Specs Record updated successfully.'
          : '✅ Quality Specs Record saved successfully!'
      );
      resetSpecsForm();
      refreshAllData();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(errData.error || (editingSpecsId ? 'Failed to update Specs record.' : 'Failed to save Specs record.'));
    }
  };

  const resetFarmerProfileForm = () => {
    setEditingProfileId(null);
    setPayFamilyCode('');
    setPayFarmerName('');
    setPayVillage(villages[0]?.name || '');
    setPayPhone('');
    setPayMethod('Bank Transfer');
    setPayBankName(banks[0]?.name || 'ABA Bank');
    setPayAccountNumber('');
    setPayAccountHolder('');
    setPayRelationship('Self');
    setPayCustomRelationship('');
    setPayBankPhotoUrl('');
  };

  const handleEditFarmerProfile = (profile: any) => {
    setEditingProfileId(profile.id);
    setPayFamilyCode(profile.familyCode || '');
    setPayFarmerName(profile.farmerName || '');
    setPayVillage(profile.village || villages[0]?.name || '');
    setPayPhone(profile.phone || '');
    setPayMethod(profile.paymentMethod || 'Bank Transfer');
    setPayBankName(profile.bankName || banks[0]?.name || 'ABA Bank');
    setPayAccountNumber(profile.accountNumber || '');
    setPayAccountHolder(profile.accountHolder || profile.farmerName || '');

    const rel = profile.relationship || 'Self';
    if (['Self', 'Husband', 'Wife', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother'].includes(rel)) {
      setPayRelationship(rel);
      setPayCustomRelationship('');
    } else {
      setPayRelationship('Other');
      setPayCustomRelationship(rel);
    }

    setPayBankPhotoUrl(profile.bankDocumentUrl || '');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Submit or Update Farmer Profile with Bank Photo
  const handleSaveFarmerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payFamilyCode || !payFarmerName) {
      alert('Family code and farmer name are required.');
      return;
    }

    const finalRelationship = payRelationship === 'Other' ? (payCustomRelationship.trim() || 'Other') : payRelationship;
    const finalAccountHolder = payAccountHolder.trim() || payFarmerName.trim();

    const payload = {
      familyCode: payFamilyCode,
      farmerName: payFarmerName,
      village: payVillage,
      phone: payPhone,
      paymentMethod: payMethod,
      bankName: payMethod === 'Bank Transfer' ? payBankName : 'Cash',
      accountNumber: payAccountNumber,
      accountHolder: finalAccountHolder,
      relationship: finalRelationship,
      bankDocumentUrl: payBankPhotoUrl,
    };

    let res;
    if (editingProfileId) {
      res = await fetch(`/api/farmers/${editingProfileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      setSyncStatus(
        editingProfileId
          ? 'Farmer Payment Profile updated successfully.'
          : `✅ Farmer payment profile saved! Account Holder: ${finalAccountHolder} (${finalRelationship})`
      );
      resetFarmerProfileForm();
      refreshAllData();
    } else {
      alert(editingProfileId ? 'Failed to update Farmer Payment Profile.' : 'Failed to save Farmer Payment Profile.');
    }
  };

  // Export Farmer Profiles to CSV
  const exportFarmerProfilesCSV = () => {
    if (!farmerProfiles.length) {
      alert('No farmer payment profiles to export.');
      return;
    }

    const rows = [
      [
        'Family Code',
        'Farmer Name',
        'Village',
        'Phone Number',
        'Payment Method',
        'Bank Name',
        'Account Number',
        'Account Holder Name',
        'Relationship to Farmer',
        'Bank Document Photo Attached',
        'Created Date',
      ],
    ];

    farmerProfiles.forEach((p) => {
      rows.push([
        p.familyCode,
        p.farmerName,
        p.village,
        p.phone || '',
        p.paymentMethod,
        p.bankName || '',
        p.accountNumber || '',
        p.accountHolder || p.farmerName,
        p.relationship || 'Self',
        p.bankDocumentUrl ? 'Yes' : 'No',
        new Date(p.createdAt).toLocaleDateString(),
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((c) => `"${c}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IBIS_RICE_Farmer_Bank_Profiles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit / Update Purchase Invoice
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pFamilyCode || !pFarmerName) {
      alert('Please select a Specs Record or enter Family Code and Farmer Name.');
      return;
    }

    if (totalSacksCount === 0) {
      alert('Please add at least one sack weight before saving.');
      return;
    }

    const payload = {
      familyCode: pFamilyCode,
      farmerName: pFarmerName,
      village: pVillage,
      seedBorrowed: pSeedBorrowed,
      seedDeduction: seedDeductionTotal,
      signatureFarmer: pFarmerSignature,
      signatureStaff: pStaffSignature,
      specsRecordId: selectedSpecsRecordId,
      items: [
        {
          variety: pVariety,
          grade: pGrade,
          standardPrice: pStandardPrice,
          additionalPrice: pAdditionalPrice,
          finalPrice: finalPurchasePrice,
          sacks: totalSacksCount,
          quantity: totalWeightKg,
          totalValue: totalPaddyValue,
          sackWeights: pSackWeights,
        },
      ],
    };

    if (editingPurchaseId) {
      // EDIT MODE: Call PUT endpoint to update existing record
      const res = await fetch(`/api/purchases/${editingPurchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const pIdFormatted = `PR-2026-${editingPurchaseId.slice(-6).toUpperCase()}`;
        setSuccessBanner(`Purchase Record ${pIdFormatted} updated successfully.`);
        resetPurchaseForm();
        refreshAllData();
      } else {
        const err = await res.json();
        alert('Failed to update purchase record: ' + (err.error || 'Server error'));
      }
    } else {
      // CREATE MODE: Call POST endpoint to create new record
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const pId = `PR-2026-${data.id.slice(-6).toUpperCase()}`;

        setSuccessBanner(`Purchase Record saved successfully. Purchase ID: ${pId}`);
        resetPurchaseForm();
        refreshAllData();
      } else {
        alert('Failed to save purchase record.');
      }
    }
  };

  // Edit Purchase Record
  const handleEditPurchase = (purchase: any) => {
    // Locking rule: Cannot edit if already assigned to transport or truck dispatched
    if (purchase.status !== 'PENDING' || purchase.transportRecordId) {
      alert(`Cannot edit Purchase Record PR-2026-${purchase.id.slice(-6).toUpperCase()}. This record has already been assigned to transport or dispatched.`);
      return;
    }

    setEditingPurchaseId(purchase.id);
    const item = purchase.items?.[0] || {};
    setPFamilyCode(purchase.familyCode);
    setPFarmerName(purchase.farmerName);
    PVillage(purchase.village);
    setPVariety(item.variety || 'Red Jasmine');
    setPGrade(item.grade || 'A1');
    setPStandardPrice(item.standardPrice || 1997.5);
    setPAdditionalPriceInput((item.additionalPrice || 0).toString());
    setPSeedBorrowedInput((purchase.seedBorrowed || 0).toString());
    setSelectedSpecsRecordId(purchase.specsRecordId || null);

    if (purchase.signatureFarmer) setPFarmerSignature(purchase.signatureFarmer);
    if (purchase.signatureStaff) setPStaffSignature(purchase.signatureStaff);

    try {
      if (item.sackWeights) setPSackWeights(JSON.parse(item.sackWeights));
      else setPSackWeights([]);
    } catch (e) {
      setPSackWeights([]);
    }

    setSuccessBanner(`Editing Purchase Record PR-2026-${purchase.id.slice(-6).toUpperCase()}. Make your changes above and click Update.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ADMIN DELETE HANDLERS
  const handleDeleteSpecsRecord = async (id: string, familyCode: string) => {
    if (!confirm(`Are you sure you want to delete Quality Specs Record for Family Code ${familyCode}?`)) return;

    const res = await fetch(`/api/specs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSyncStatus(`✅ Specs Record deleted by Admin.`);
      refreshAllData();
    } else {
      alert('Failed to delete specs record.');
    }
  };

  const handleDeleteFarmerProfile = async (id: string, familyCode: string) => {
    if (!confirm(`Are you sure you want to delete Payment Profile for Family Code ${familyCode}?`)) return;

    const res = await fetch(`/api/farmers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSyncStatus(`✅ Farmer Payment Profile deleted by Admin.`);
      refreshAllData();
    } else {
      alert('Failed to delete farmer profile.');
    }
  };

  const handleDeletePurchase = async (id: string, familyCode: string) => {
    if (!confirm(`Are you sure you want to delete Purchase Record for ${familyCode}?`)) return;

    const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSyncStatus(`✅ Purchase Record deleted by Admin.`);
      refreshAllData();
    } else {
      alert('Failed to delete purchase record.');
    }
  };

  const handleDeleteTransportRecord = async (id: string, plateNumber: string) => {
    if (!confirm(`Are you sure you want to delete Transport Dispatch Record for truck ${plateNumber}? Linked purchases will be unassigned.`)) return;

    const res = await fetch(`/api/transport/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSyncStatus(`✅ Transport Record deleted by Admin.`);
      refreshAllData();
    } else {
      alert('Failed to delete transport record.');
    }
  };

  const handleDeleteWarehouseIntake = async (id: string, intakeIdFormatted: string) => {
    if (!confirm(`Are you sure you want to delete Warehouse Receiving Record ${intakeIdFormatted}? Truck will revert to En-Route.`)) return;

    const res = await fetch(`/api/warehouse/intake/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSyncStatus(`✅ Warehouse Intake Record deleted by Admin.`);
      refreshAllData();
    } else {
      alert('Failed to delete warehouse intake record.');
    }
  };

  // Export Purchase Records to CSV
  const exportPurchaseHistoryCSV = () => {
    if (!filteredPurchases.length) {
      alert('No purchase records to export.');
      return;
    }

    const rows = [
      [
        'Purchase ID',
        'Date & Time',
        'Family Code',
        'Farmer Name',
        'Village',
        'Variety',
        'Grade',
        'Sacks Count',
        'Total Weight (kg)',
        'Standard Price (KHR/kg)',
        'Additional Premium (KHR/kg)',
        'Final Price (KHR/kg)',
        'Gross Paddy Value (KHR)',
        'Seed Borrowed (kg)',
        'Seed Deduction (KHR)',
        'Net Payment (KHR)',
        'Purchasing Staff',
        'Status',
      ],
    ];

    filteredPurchases.forEach((p) => {
      const item = p.items?.[0] || {};
      const pId = `PR-2026-${p.id.slice(-6).toUpperCase()}`;
      rows.push([
        pId,
        new Date(p.createdAt).toLocaleString(),
        p.familyCode,
        p.farmerName,
        p.village,
        item.variety || '',
        item.grade || '',
        item.sacks || 0,
        p.totalWeight,
        item.standardPrice || 0,
        item.additionalPrice || 0,
        item.finalPrice || 0,
        p.totalPayment,
        p.seedBorrowed || 0,
        p.seedDeduction || 0,
        p.netPayment,
        p.purchasingStaffName || 'Field Staff',
        p.status,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((c) => `"${c}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IBIS_RICE_Purchase_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTransportForm = () => {
    setEditingTransportId(null);
    setSelectedPurchasesForTruck([]);
    setTDriver('');
    setTPlate('');
    setTMobile('');
    setTCleaned(true);
    setTLoadingLocation('');
    setTDestinationWarehouse('');
    setTNotes('');
  };

  const handleEditTransport = (transport: any) => {
    // Locking Rule: Only editable while in transit / before warehouse receiving intake
    if (transport.intake || ['RECEIVED', 'VERIFIED', 'DISBURSED'].includes(transport.status)) {
      alert('This transport record has already been received by the warehouse and can no longer be edited.');
      return;
    }

    setEditingTransportId(transport.id);
    setTDriver(transport.driverName || '');
    setTPlate(transport.plateNumber || '');
    setTMobile(transport.mobileNumber || '');
    setTCleaned(transport.truckCleaned ?? true);
    setTLoadingLocation(transport.loadingLocation || '');
    setTDestinationWarehouse(transport.destinationWarehouse || '');
    setTNotes(transport.notes || '');

    // Set assigned purchase records
    const assignedPurchases = transport.purchases || [];
    setSelectedPurchasesForTruck(assignedPurchases);

    setSuccessBanner(`Editing Transport Record TR-2026-${transport.id.slice(-6).toUpperCase()}. Make your changes above and click Update.`);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Submit or Update Transport Dispatch Record
  const handleSaveTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tDriver || !tPlate) {
      alert('Driver name and plate number are required.');
      return;
    }

    if (selectedPurchasesForTruck.length === 0) {
      alert('Please click "Select / Load Purchase Records for Truck" and select at least one purchase record.');
      return;
    }

    const payload = {
      driverName: tDriver,
      plateNumber: tPlate,
      mobileNumber: tMobile,
      truckCleaned: tCleaned,
      loadingLocation: tLoadingLocation,
      destinationWarehouse: tDestinationWarehouse,
      notes: tNotes,
      selectedPurchaseIds: selectedPurchasesForTruck.map((p) => p.id),
    };

    let res;
    if (editingTransportId) {
      res = await fetch(`/api/transport/${editingTransportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      const data = await res.json();
      const tIdFormatted = `TR-2026-${data.id.slice(-6).toUpperCase()}`;

      setSuccessBanner(
        editingTransportId
          ? `Transport Record ${tIdFormatted} updated successfully.`
          : `Transport Record created successfully. Transport ID: ${tIdFormatted} (${selectedPurchasesForTruck.length} Purchase Records assigned IN_TRANSIT).`
      );
      resetTransportForm();
      refreshAllData();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || (editingTransportId ? 'Failed to update transport record.' : 'Failed to create transport record.'));
    }
  };

  // Export Transport Manifest CSV with Summary and Itemized Cargo Invoices
  const exportTransportHistoryCSV = () => {
    if (!filteredTransports.length) {
      alert('No transport records to export.');
      return;
    }

    const rows: any[][] = [];

    filteredTransports.forEach((t, idx) => {
      const tIdFormatted = `TR-2026-${t.id.slice(-6).toUpperCase()}`;
      const purchasesList = t.purchases || [];
      const uniqueFarmers = new Set(purchasesList.map((p: any) => p.familyCode)).size;
      const totalSacks = purchasesList.reduce((sum: number, p: any) => sum + (p.items?.[0]?.sacks || 0), 0);
      const totalWeight = purchasesList.reduce((sum: number, p: any) => sum + p.totalWeight, 0);

      if (idx > 0) {
        rows.push([]);
      }

      // SUMMARY SECTION
      rows.push(['=== TRUCK DISPATCH SUMMARY MANIFEST ===']);
      rows.push([
        'Transport ID',
        'Driver Name',
        'Truck Plate Number',
        'Total Farmers',
        'Total Purchase Records',
        'Total Number of Sacks',
        'Total Field Weight (Kg)',
        'Status',
      ]);
      rows.push([
        tIdFormatted,
        t.driverName,
        t.plateNumber,
        uniqueFarmers,
        purchasesList.length,
        totalSacks,
        totalWeight,
        t.status,
      ]);

      // ITEMIZED PURCHASE MANIFEST SECTION
      rows.push([]);
      rows.push(['--- ASSIGNED PURCHASE RECORDS (LOADED CARGO) ---']);
      rows.push([
        'Transport ID',
        'Dispatch Date & Time',
        'Driver Name',
        'Truck Plate Number',
        'Loading Location',
        'Destination',
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

      if (purchasesList.length === 0) {
        rows.push([tIdFormatted, new Date(t.createdAt).toLocaleString(), t.driverName, t.plateNumber, t.loadingLocation, t.destinationWarehouse, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 0, 0, 'N/A']);
      } else {
        purchasesList.forEach((p: any) => {
          const item = p.items?.[0] || {};
          const pIdFormatted = `PR-2026-${p.id.slice(-6).toUpperCase()}`;
          rows.push([
            tIdFormatted,
            new Date(t.createdAt).toLocaleString(),
            t.driverName,
            t.plateNumber,
            t.loadingLocation || 'Chhaeb Buying Station',
            t.destinationWarehouse || 'Central Mill Warehouse',
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
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IBIS_RICE_Truck_Loading_Manifests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Single Truck Cargo Manifest (CSV) from History Table
  const exportTransportTruckCSV = (transport: any) => {
    if (!transport) return;

    const purchases = transport.purchases || [];
    const tIdFormatted = `TR-2026-${transport.id.slice(-6).toUpperCase()}`;
    const uniqueFarmers = new Set(purchases.map((p: any) => p.familyCode)).size;
    const totalSacks = purchases.reduce((sum: number, p: any) => sum + (p.items?.[0]?.sacks || 0), 0);
    const totalWeight = purchases.reduce((sum: number, p: any) => sum + (p.totalWeight || 0), 0);

    const rows: any[][] = [];

    // TOP SUMMARY SECTION
    rows.push(['=== TRUCK DISPATCH MANIFEST SUMMARY ===']);
    rows.push([
      'Transport ID',
      'Dispatch Date & Time',
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
      tIdFormatted,
      new Date(transport.createdAt).toLocaleString(),
      transport.driverName || '',
      transport.plateNumber || '',
      transport.loadingLocation || 'Chhaeb Buying Station',
      transport.destinationWarehouse || 'Central Mill Warehouse, Preah Vihear',
      uniqueFarmers,
      purchases.length,
      transport.totalSacks || totalSacks,
      transport.totalFieldWeight || totalWeight,
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
    link.setAttribute('download', `Truck_Manifest_${tIdFormatted}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper reset function for Warehouse Intake form
  const resetWarehouseForm = () => {
    setEditingIntakeId(null);
    setSelectedTransportId('');
    setWhGrossWeight('');
    setWhTareWeight('');
    setWhGrossPhotoUrl('');
    setWhTarePhotoUrl('');
    setWhNotes('');
  };

  // Edit Warehouse Receiving Record
  const handleEditWarehouseIntake = (intake: any) => {
    const transport = intake.transport || {};
    // Locking rule: Cannot edit if Finance team has already verified or paid
    if (transport.status === 'VERIFIED' || transport.status === 'DISBURSED') {
      alert(`This record (WR-2026-${intake.id.slice(-6).toUpperCase()}) has already been verified by Finance and can no longer be edited.`);
      return;
    }

    setEditingIntakeId(intake.id);
    setSelectedTransportId(intake.transportId);
    setWhGrossWeight(intake.warehouseGrossWeight.toString());
    setWhTareWeight(intake.warehouseTareWeight.toString());
    setWhGrossPhotoUrl(intake.grossScalePhotoUrl || '');
    setWhTarePhotoUrl(intake.tareScalePhotoUrl || '');
    setWhNotes(intake.notes || '');

    const wrIdFormatted = `WR-2026-${intake.id.slice(-6).toUpperCase()}`;
    setSuccessBanner(`Editing Warehouse Receiving Record ${wrIdFormatted}. Update weights or scale photos above.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit / Update Warehouse Intake Weight & Scale Photos
  const handleSaveWarehouseIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransportId || !whGrossWeight || !whTareWeight) {
      alert('Select an en-route truck and enter scale gross & tare weights.');
      return;
    }

    const payload = {
      transportId: selectedTransportId,
      warehouseGrossWeight: parseFloat(whGrossWeight),
      warehouseTareWeight: parseFloat(whTareWeight),
      grossScalePhotoUrl: whGrossPhotoUrl,
      tareScalePhotoUrl: whTarePhotoUrl,
      notes: whNotes,
    };

    if (editingIntakeId) {
      // EDIT MODE: Call PUT endpoint to update existing receiving record
      const res = await fetch(`/api/warehouse/intake/${editingIntakeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const wrIdFormatted = `WR-2026-${editingIntakeId.slice(-6).toUpperCase()}`;
        setSuccessBanner(`Warehouse Receiving Record ${wrIdFormatted} updated successfully.`);
        resetWarehouseForm();
        refreshAllData();
      } else {
        const err = await res.json();
        alert('Failed to update warehouse receiving record: ' + (err.error || 'Server error'));
      }
    } else {
      // CREATE MODE: Call POST endpoint
      const res = await fetch('/api/warehouse/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const wrIdFormatted = `WR-2026-${data.id.slice(-6).toUpperCase()}`;

        setSuccessBanner(`Warehouse Receiving Record saved successfully. Warehouse ID: ${wrIdFormatted}.`);
        resetWarehouseForm();
        refreshAllData();
      } else {
        const err = await res.json();
        alert('Failed to record intake: ' + err.error);
      }
    }
  };

  // Export Warehouse Intake Records to CSV
  const exportWarehouseHistoryCSV = () => {
    if (!filteredIntakes.length) {
      alert('No warehouse receiving records to export.');
      return;
    }

    const rows = [
      [
        'Warehouse ID',
        'Intake Date & Time',
        'Transport ID',
        'Driver Name',
        'Plate Number',
        'Field Weight (kg)',
        'Warehouse Gross (kg)',
        'Warehouse Tare (kg)',
        'Warehouse Net Weight (kg)',
        'Weight Diff (kg)',
        'Weight Diff (%)',
        'Receiving Staff',
        'Gross Scale Photo',
        'Tare Scale Photo',
      ],
    ];

    filteredIntakes.forEach((intake) => {
      const transport = intake.transport || {};
      const wrId = `WR-2026-${intake.id.slice(-6).toUpperCase()}`;
      const trId = `TR-2026-${transport.id?.slice(-6).toUpperCase()}`;

      rows.push([
        wrId,
        new Date(intake.createdAt).toLocaleString(),
        trId,
        transport.driverName || '',
        transport.plateNumber || '',
        transport.totalFieldWeight || 0,
        intake.warehouseGrossWeight,
        intake.warehouseTareWeight,
        intake.warehouseNetWeight,
        intake.weightDiffKg,
        intake.weightDiffPercent || 0,
        intake.receivingStaffName || 'Warehouse Staff',
        intake.grossScalePhotoUrl ? 'Yes' : 'No',
        intake.tareScalePhotoUrl ? 'Yes' : 'No',
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((c) => `"${c}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IBIS_RICE_Warehouse_Intake_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TRUCK-LEVEL VERIFICATION (FINANCE)
  const handleVerifyTruckFinance = async (transportId: string) => {
    const res = await fetch('/api/finance/trucks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'VERIFY_TRUCK', transportId }),
    });

    if (res.ok) {
      setSyncStatus(`✅ Truck verified successfully! Status updated to VERIFIED.`);
      refreshAllData();
    } else {
      const err = await res.json();
      alert('Failed to verify truck: ' + err.error);
    }
  };

  // TRUCK-LEVEL PAYMENT PROCESSING (FINANCE)
  const handleCompleteTruckPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalTruck) return;

    const res = await fetch('/api/finance/trucks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'COMPLETE_PAYMENT',
        transportId: paymentModalTruck.transport.id,
        paymentMethod: payMethodInput,
        paymentBatchNumber: payBatchInput,
      }),
    });

    if (res.ok) {
      setSyncStatus(`✅ Payment Completed for Truck ${paymentModalTruck.transport.plateNumber}! Status updated to DISBURSED.`);
      setPaymentModalTruck(null);
      refreshAllData();
    } else {
      const err = await res.json();
      alert('Failed to complete payment: ' + err.error);
    }
  };

  // Export Finance Trucks Summary & Invoice Breakdown to CSV
  const exportFinanceTrucksCSV = () => {
    if (!filteredFinanceTrucks.length) {
      alert('No finance truck records to export.');
      return;
    }

    const rows = [
      [
        'Transport ID',
        'Warehouse ID',
        'Truck Plate Number',
        'Driver Name',
        'Dispatch Date',
        'Total Farmers',
        'Total Invoices',
        'Total Sacks',
        'Field Weight (kg)',
        'Warehouse Net Weight (kg)',
        'Weight Diff (kg)',
        'Weight Diff (%)',
        'Total Net Payment (KHR)',
        'Finance Status',
      ],
    ];

    filteredFinanceTrucks.forEach((t) => {
      const trId = `TR-2026-${t.transport.id.slice(-6).toUpperCase()}`;
      const wrId = t.intake ? `WR-2026-${t.intake.id.slice(-6).toUpperCase()}` : 'N/A';

      rows.push([
        trId,
        wrId,
        t.transport.plateNumber,
        t.transport.driverName,
        new Date(t.transport.createdAt).toLocaleString(),
        t.totalFarmersCount,
        t.purchases.length,
        t.transport.totalSacks,
        t.fieldWeight,
        t.warehouseNetWeight,
        t.weightDiffKg,
        t.weightDiffPercent,
        t.totalTruckNetPayment,
        t.transport.status,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((c) => `"${c}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IBIS_RICE_Finance_Truck_Payment_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Single Truck Farmer Payment Details to CSV
  const exportSingleTruckCSV = (truckData: any) => {
    if (!truckData || !truckData.purchases || truckData.purchases.length === 0) {
      alert('No farmer purchase invoices available for this truck.');
      return;
    }

    const t = truckData.transport || {};
    const intake = truckData.intake || {};
    const purchases = truckData.purchases || [];

    const transportIdFormatted = `TR-2026-${t.id?.slice(-6).toUpperCase()}`;
    const intakeIdFormatted = intake.id ? `WR-2026-${intake.id.slice(-6).toUpperCase()}` : 'N/A';
    const hasGrossPhoto = intake.grossScalePhotoUrl ? 'Yes' : 'No';
    const hasTarePhoto = intake.tareScalePhotoUrl ? 'Yes' : 'No';

    const headers = [
      'Transport ID',
      'Warehouse Receiving ID',
      'Purchase ID',
      'Family Code',
      'Farmer Name',
      'Village',
      'Paddy Variety',
      'Grade',
      'Number of Sacks',
      'Total Weight (Kg)',
      'Final Purchase Price (KHR/Kg)',
      'Gross Payment (KHR)',
      'Seed Return Deduction (KHR)',
      'Net Payment (KHR)',
      'Bank Name',
      'Bank Account Number',
      'Account Holder Name',
      'Relationship to Farmer',
      'Purchasing Staff',
      'Purchase Date',
      'Farmer Signed',
      'Gross Weight Photo Available',
      'Tare Weight Photo Available',
    ];

    const rows = [headers];

    purchases.forEach((p: any) => {
      const item = p.items?.[0] || {};
      const f = p.farmerProfile || {};
      const pIdFormatted = `PR-2026-${p.id.slice(-6).toUpperCase()}`;

      rows.push([
        transportIdFormatted,
        intakeIdFormatted,
        pIdFormatted,
        p.familyCode || '',
        p.farmerName || '',
        p.village || '',
        item.variety || 'Red Jasmine',
        item.grade || 'A1',
        item.sacks || 0,
        p.totalWeight || 0,
        item.finalPrice || 0,
        p.totalPayment || 0,
        p.seedDeduction || 0,
        p.netPayment || 0,
        f.bankName || 'Direct Cash',
        f.accountNumber || 'N/A',
        f.accountHolder || p.farmerName,
        f.relationship || 'Self',
        p.purchasingStaffName || 'Field Staff',
        new Date(p.createdAt).toLocaleDateString(),
        p.signatureFarmer ? 'Yes' : 'No',
        hasGrossPhoto,
        hasTarePhoto,
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
    link.setAttribute('download', `Finance_Truck_${safeTrId}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Single Warehouse Truck Receiving Manifest to CSV
  const exportSingleWarehouseTruckCSV = (intake: any) => {
    if (!intake) return;
    const transport = intake.transport || {};
    const purchases = transport.purchases || [];

    if (!purchases || purchases.length === 0) {
      alert('No purchase records loaded on this truck intake.');
      return;
    }

    const receivingIdFormatted = `WR-2026-${intake.id.slice(-6).toUpperCase()}`;
    const transportIdFormatted = `TR-2026-${transport.id?.slice(-6).toUpperCase()}`;
    const fieldWeight = transport.totalFieldWeight || 0;
    const grossWeight = intake.warehouseGrossWeight || 0;
    const tareWeight = intake.warehouseTareWeight || 0;
    const netWeight = intake.warehouseNetWeight || 0;
    const diffKg = intake.weightDiffKg !== undefined && intake.weightDiffKg !== null ? intake.weightDiffKg : (netWeight - fieldWeight);
    const diffPercent = intake.weightDiffPercent !== undefined && intake.weightDiffPercent !== null
      ? intake.weightDiffPercent
      : (fieldWeight > 0 ? (diffKg / fieldWeight) * 100 : 0);

    const receivingDateTime = new Date(intake.createdAt).toLocaleString();
    const warehouseStaff = intake.receivingStaffName || 'Warehouse Staff';
    const totalFarmers = new Set(purchases.map((p: any) => p.familyCode)).size;
    const totalSacks = purchases.reduce((acc: number, p: any) => acc + (p.items?.[0]?.sacks || 0), 0);

    const summaryRows = [
      ['SUMMARY - WAREHOUSE RECEIVING TRUCK MANIFEST', ''],
      ['Warehouse Receiving ID', receivingIdFormatted],
      ['Transport ID', transportIdFormatted],
      ['Driver Name', transport.driverName || 'N/A'],
      ['Truck Plate Number', transport.plateNumber || 'N/A'],
      ['Receiving Date & Time', receivingDateTime],
      ['Warehouse Staff', warehouseStaff],
      ['Total Farmers', totalFarmers],
      ['Total Purchase Records', purchases.length],
      ['Total Number of Sacks', totalSacks],
      ['Total Field Weight (Kg)', fieldWeight.toFixed(2)],
      ['Warehouse Gross Weight (Kg)', grossWeight.toFixed(2)],
      ['Warehouse Tare Weight (Kg)', tareWeight.toFixed(2)],
      ['Warehouse Net Weight (Kg)', netWeight.toFixed(2)],
      ['Weight Difference (Kg)', `${diffKg >= 0 ? '+' : ''}${diffKg.toFixed(2)}`],
      ['Weight Difference (%)', `${diffPercent >= 0 ? '+' : ''}${diffPercent.toFixed(2)}%`],
      ['', ''],
    ];

    const itemHeaders = [
      'Warehouse Receiving ID',
      'Transport ID',
      'Purchase ID',
      'Family Code',
      'Farmer Name',
      'Village',
      'Paddy Variety',
      'Grade',
      'Number of Sacks',
      'Field Weight (Kg)',
      'Warehouse Gross Weight (Kg)',
      'Warehouse Tare Weight (Kg)',
      'Warehouse Net Weight (Kg)',
      'Weight Difference (Kg)',
      'Driver Name',
      'Truck Plate Number',
      'Receiving Date & Time',
      'Warehouse Staff',
    ];

    const rows = [...summaryRows, itemHeaders];

    purchases.forEach((p: any) => {
      const item = p.items?.[0] || {};
      const pIdFormatted = `PR-2026-${p.id.slice(-6).toUpperCase()}`;

      rows.push([
        receivingIdFormatted,
        transportIdFormatted,
        pIdFormatted,
        p.familyCode || '',
        p.farmerName || '',
        p.village || '',
        item.variety || 'Red Jasmine',
        item.grade || 'A1',
        item.sacks || 0,
        (p.totalWeight || 0).toFixed(2),
        grossWeight.toFixed(2),
        tareWeight.toFixed(2),
        netWeight.toFixed(2),
        `${diffKg >= 0 ? '+' : ''}${diffKg.toFixed(2)}`,
        transport.driverName || 'N/A',
        transport.plateNumber || 'N/A',
        receivingDateTime,
        warehouseStaff,
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeWrId = receivingIdFormatted.replace(/[^a-zA-Z0-9-]/g, '_');

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Warehouse_Receiving_${safeWrId}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT SPECS RECORDS CSV
  const handleExportSpecsCsv = () => {
    if (specsList.length === 0) {
      alert('No quality specs records available to export.');
      return;
    }

    const headers = [
      'Specs Record ID',
      'Inspection Date & Time',
      'Family Code',
      'Farmer Name',
      'Village',
      'Paddy Variety',
      'Grade',
      'Organic Status',
      'Moisture (%)',
      'Foreign Matter (%)',
      'Whole Grain (%)',
      'Broken Rice (%)',
      'Inspection Result',
      'Base Price (KHR)',
      'Organic Bonus (KHR)',
      'Final Price (KHR/kg)',
    ];

    const rows = specsList.map((rec) => {
      const specId = `SPEC-2026-${rec.id.slice(-6).toUpperCase()}`;
      return [
        specId,
        new Date(rec.createdAt || rec.date).toLocaleString(),
        rec.familyCode || '',
        rec.farmerName || '',
        rec.village || '',
        rec.paddyType || '',
        rec.selectedGrade || '',
        rec.isOrganic ? 'Organic' : 'Conventional',
        rec.moisture !== undefined ? rec.moisture : '',
        rec.foreignMatter !== undefined ? rec.foreignMatter : '',
        rec.wholeGrain !== undefined ? rec.wholeGrain : '',
        rec.brokenRice !== undefined ? rec.brokenRice : '',
        rec.isValid ? 'Pass' : 'Fail',
        rec.basePrice || 0,
        rec.organicBonus || 0,
        rec.finalPrice || 0,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers, ...rows].map((e) => e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Paddy_Quality_Specs_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT FARMER PAYMENT PROFILES CSV
  const handleExportFarmerProfilesCsv = () => {
    if (farmerProfiles.length === 0) {
      alert('No farmer payment profiles available to export.');
      return;
    }

    const headers = [
      'Family Code',
      'Farmer Name',
      'Village',
      'Phone Number',
      'Account Holder Name',
      'Relationship to Farmer',
      'Bank Name',
      'Account Number',
      'Payment Method',
      'Passbook Photo Uploaded',
      'Registration Date',
    ];

    const rows = farmerProfiles.map((p) => [
      p.familyCode || '',
      p.farmerName || '',
      p.village || '',
      p.phone || '',
      p.accountHolder || p.farmerName || '',
      p.relationship || 'Self',
      p.bankName || 'Direct Cash',
      p.accountNumber || '',
      p.paymentMethod || 'Bank Transfer',
      p.bankDocumentUrl ? 'Yes' : 'No',
      new Date(p.createdAt || Date.now()).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers, ...rows].map((e) => e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Farmer_Payment_Profiles_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ADMIN: Add Village
  const handleAddVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillageName.trim()) return;

    const res = await fetch('/api/admin/villages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newVillageName, district: newVillageDistrict }),
    });

    if (res.ok) {
      setSyncStatus(`✅ Village "${newVillageName}" added to target list!`);
      setNewVillageName('');
      refreshAllData();
    } else {
      alert('Failed to add village.');
    }
  };

  // ADMIN: Delete Village
  const handleDeleteVillage = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove village "${name}"?`)) return;

    const res = await fetch(`/api/admin/villages?id=${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setSyncStatus(`✅ Village "${name}" removed!`);
      refreshAllData();
    } else {
      alert('Failed to delete village.');
    }
  };

  // ADMIN: Add Bank
  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;

    const res = await fetch('/api/admin/banks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBankName, code: newBankCode }),
    });

    if (res.ok) {
      setSyncStatus(`✅ Commercial Bank "${newBankName}" added to system list!`);
      setNewBankName('');
      setNewBankCode('');
      refreshAllData();
    } else {
      alert('Failed to add bank.');
    }
  };

  // ADMIN: Delete Bank
  const handleDeleteBank = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove bank "${name}"?`)) return;

    const res = await fetch(`/api/admin/banks?id=${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setSyncStatus(`✅ Commercial Bank "${name}" removed!`);
      refreshAllData();
    } else {
      alert('Failed to delete bank.');
    }
  };

  // ADMIN: Add / Update Paddy Price Spec
  const handleAddPriceSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecVariety || !newSpecGrade) {
      alert('Variety and Grade are required.');
      return;
    }

    const res = await fetch('/api/admin/price-specs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variety: newSpecVariety,
        grade: newSpecGrade,
        basePrice: newSpecBasePrice,
        organicBonus: newSpecOrganicBonus,
        maxMoisture: newSpecMaxMoisture,
        maxForeignMatter: newSpecMaxForeign,
      }),
    });

    if (res.ok) {
      setSyncStatus(`✅ Paddy specification for ${newSpecVariety} (${newSpecGrade}) saved!`);
      setNewSpecVariety('');
      refreshAllData();
    } else {
      alert('Failed to save price specification.');
    }
  };

  // ADMIN: Delete Price Spec
  const handleDeletePriceSpec = async (id: string, variety: string, grade: string) => {
    if (!confirm(`Are you sure you want to remove price specification for ${variety} (${grade})?`)) return;

    const res = await fetch(`/api/admin/price-specs?id=${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setSyncStatus(`✅ Price specification removed!`);
      refreshAllData();
    } else {
      alert('Failed to delete price specification.');
    }
  };

  // Filtered & Searchable Purchases for History Table
  const filteredPurchases = purchases.filter((p) => {
    const item = p.items?.[0] || {};
    const searchMatch =
      p.familyCode.toLowerCase().includes(pSearchQuery.toLowerCase()) ||
      p.farmerName.toLowerCase().includes(pSearchQuery.toLowerCase()) ||
      p.village.toLowerCase().includes(pSearchQuery.toLowerCase()) ||
      (item.variety || '').toLowerCase().includes(pSearchQuery.toLowerCase()) ||
      (p.purchasingStaffName || '').toLowerCase().includes(pSearchQuery.toLowerCase()) ||
      `pr-2026-${p.id.slice(-6)}`.toLowerCase().includes(pSearchQuery.toLowerCase());

    const villageMatch = pFilterVillage === 'ALL' || p.village === pFilterVillage;
    const varietyMatch = pFilterVariety === 'ALL' || item.variety === pFilterVariety;
    const staffMatch = pFilterStaff === 'ALL' || p.purchasingStaffName === pFilterStaff;

    return searchMatch && villageMatch && varietyMatch && staffMatch;
  });

  // Filtered & Searchable Transports for History Table
  const filteredTransports = transports.filter((t) => {
    const q = tSearchQuery.toLowerCase();
    const tIdFormatted = `tr-2026-${t.id.slice(-6)}`.toLowerCase();
    return (
      t.driverName.toLowerCase().includes(q) ||
      t.plateNumber.toLowerCase().includes(q) ||
      (t.fieldStaffName || '').toLowerCase().includes(q) ||
      (t.loadingLocation || '').toLowerCase().includes(q) ||
      (t.destinationWarehouse || '').toLowerCase().includes(q) ||
      tIdFormatted.includes(q)
    );
  });

  // Filtered & Searchable Warehouse Intakes for History Table
  const filteredIntakes = warehouseIntakes.filter((intake) => {
    const q = whSearchQuery.toLowerCase();
    const transport = intake.transport || {};
    const purchases = transport.purchases || [];

    const wrIdFormatted = `wr-2026-${intake.id.slice(-6)}`.toLowerCase();
    const trIdFormatted = `tr-2026-${transport.id?.slice(-6)}`.toLowerCase();

    const matchesFarmer = purchases.some(
      (p: any) =>
        p.farmerName.toLowerCase().includes(q) || p.familyCode.toLowerCase().includes(q)
    );

    return (
      wrIdFormatted.includes(q) ||
      trIdFormatted.includes(q) ||
      (transport.driverName || '').toLowerCase().includes(q) ||
      (transport.plateNumber || '').toLowerCase().includes(q) ||
      (intake.receivingStaffName || '').toLowerCase().includes(q) ||
      matchesFarmer
    );
  });

  // FILTERED & SEARCHABLE FINANCE TRUCK RECORDS
  const filteredFinanceTrucks = financeTrucks.filter((truckData) => {
    const q = finSearchQuery.toLowerCase();
    const t = truckData.transport || {};
    const intake = truckData.intake || {};
    const purchases = truckData.purchases || [];

    const trId = `tr-2026-${t.id.slice(-6)}`.toLowerCase();
    const wrId = intake.id ? `wr-2026-${intake.id.slice(-6)}`.toLowerCase() : '';

    const matchesSearch =
      trId.includes(q) ||
      wrId.includes(q) ||
      t.driverName.toLowerCase().includes(q) ||
      t.plateNumber.toLowerCase().includes(q) ||
      purchases.some((p: any) => p.farmerName.toLowerCase().includes(q) || p.familyCode.toLowerCase().includes(q));

    const matchesStatus = finStatusFilter === 'ALL' || t.status === finStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered & Searchable Specs History for Field Operations
  const filteredSpecsList = specsList.filter((rec) => {
    const q = specsSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.familyCode.toLowerCase().includes(q) ||
      rec.farmerName.toLowerCase().includes(q) ||
      (rec.village || '').toLowerCase().includes(q) ||
      (rec.paddyType || '').toLowerCase().includes(q) ||
      (rec.selectedGrade || '').toLowerCase().includes(q)
    );
  });

  // Filtered & Searchable Farmer Payment Profiles for Field Operations
  const filteredFarmerProfiles = farmerProfiles.filter((p) => {
    const q = farmerProfileSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.familyCode.toLowerCase().includes(q) ||
      p.farmerName.toLowerCase().includes(q) ||
      (p.village || '').toLowerCase().includes(q) ||
      (p.accountHolder || '').toLowerCase().includes(q) ||
      (p.bankName || '').toLowerCase().includes(q) ||
      (p.accountNumber || '').toLowerCase().includes(q)
    );
  });

  // DASHBOARD SUMMARY CALCULATIONS FOR FINANCE
  const trucksAwaitingVerification = financeTrucks.filter((t) => t.transport.status === 'RECEIVED').length;
  const trucksVerified = financeTrucks.filter((t) => t.transport.status === 'VERIFIED').length;
  const trucksFullyPaid = financeTrucks.filter((t) => t.transport.status === 'DISBURSED').length;

  const paidTrucksList = financeTrucks.filter((t) => t.transport.status === 'DISBURSED');
  const totalFarmersPaidCount = paidTrucksList.reduce((sum, t) => sum + t.totalFarmersCount, 0);
  const totalAmountPaidKHR = paidTrucksList.reduce((sum, t) => sum + t.totalTruckNetPayment, 0);

  const uniqueStaffNames = Array.from(new Set(purchases.map((p) => p.purchasingStaffName).filter(Boolean)));

  // Loaded Truck Summary Calculations
  const tFarmersCount = new Set(selectedPurchasesForTruck.map((p) => p.familyCode)).size;
  const tPurchasesCount = selectedPurchasesForTruck.length;
  const tTotalSacks = selectedPurchasesForTruck.reduce((sum, p) => sum + (p.items?.[0]?.sacks || 0), 0);
  const tTotalWeight = selectedPurchasesForTruck.reduce((sum, p) => sum + p.totalWeight, 0);

  // Self Relationship Account Name Mismatch Warning
  const isAccountHolderNameMismatch =
    payRelationship === 'Self' &&
    payAccountHolder.trim().length > 0 &&
    payFarmerName.trim().length > 0 &&
    payAccountHolder.trim().toLowerCase() !== payFarmerName.trim().toLowerCase();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-emerald-400 font-bold">
        Loading Operations Portal...
      </div>
    );
  }

  const uniqueVarieties = Array.from(new Set(priceSpecs.map((s) => s.variety)));

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modals */}
        <SpecsSelectorModal
          isOpen={isSpecsModalOpen}
          onClose={() => setIsSpecsModalOpen(false)}
          specsList={specsList}
          onSelect={handleSelectSpecsRecord}
        />

        <SpecsDetailsModal
          isOpen={Boolean(selectedSpecsForDetails)}
          onClose={() => setSelectedSpecsForDetails(null)}
          spec={selectedSpecsForDetails}
          onEdit={handleEditSpecs}
          isUsedForPurchase={
            selectedSpecsForDetails ? purchases.some((p: any) => p.specsRecordId === selectedSpecsForDetails.id) : false
          }
        />

        <FarmerProfileDetailsModal
          isOpen={Boolean(selectedFarmerProfileForDetails)}
          onClose={() => setSelectedFarmerProfileForDetails(null)}
          profile={selectedFarmerProfileForDetails}
          onEdit={handleEditFarmerProfile}
        />

        <PurchaseDetailsModal
          isOpen={Boolean(selectedPurchaseForDetails)}
          onClose={() => setSelectedPurchaseForDetails(null)}
          purchase={selectedPurchaseForDetails}
        />

        <PrintReceiptModal
          isOpen={Boolean(selectedPurchaseForPrint)}
          onClose={() => setSelectedPurchaseForPrint(null)}
          purchase={selectedPurchaseForPrint}
        />

        <PurchaseSelectorModal
          isOpen={isPurchaseSelectorOpen}
          onClose={() => setIsPurchaseSelectorOpen(false)}
          alreadySelectedIds={selectedPurchasesForTruck.map((p) => p.id)}
          editingTransportId={editingTransportId || undefined}
          onConfirm={(selectedList) => setSelectedPurchasesForTruck(selectedList)}
        />

        <TransportDetailsModal
          isOpen={Boolean(selectedTransportForDetails)}
          onClose={() => setSelectedTransportForDetails(null)}
          transport={selectedTransportForDetails}
        />

        <PrintManifestModal
          isOpen={Boolean(selectedTransportForPrint)}
          onClose={() => setSelectedTransportForPrint(null)}
          transport={selectedTransportForPrint}
        />

        <WarehouseDetailsModal
          isOpen={Boolean(selectedIntakeForDetails)}
          onClose={() => setSelectedIntakeForDetails(null)}
          intake={selectedIntakeForDetails}
          maxTolerancePercent={maxWeightTolerancePercent}
        />

        <PrintWarehouseReportModal
          isOpen={Boolean(selectedIntakeForPrint)}
          onClose={() => setSelectedIntakeForPrint(null)}
          intake={selectedIntakeForPrint}
        />

        <FinanceTruckDetailsModal
          isOpen={Boolean(selectedFinanceTruckForDetails)}
          onClose={() => setSelectedFinanceTruckForDetails(null)}
          truckData={selectedFinanceTruckForDetails}
          scaleToleranceConfig={{
            acceptableKg: scaleToleranceAcceptable,
            warningKg: scaleToleranceWarning,
            criticalKg: scaleToleranceCritical,
          }}
        />

        <PrintFinanceReportModal
          isOpen={Boolean(selectedFinanceTruckForPrint)}
          onClose={() => setSelectedFinanceTruckForPrint(null)}
          truckData={selectedFinanceTruckForPrint}
        />

        {/* Payment Confirmation Modal */}
        {paymentModalTruck && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#141c2f] border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                  💳 Complete Payment for Truck {paymentModalTruck.transport.plateNumber}
                </h3>
                <button onClick={() => setPaymentModalTruck(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteTruckPayment} className="space-y-4 text-xs">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                  <div className="font-bold text-white">Truck Driver: {paymentModalTruck.transport.driverName}</div>
                  <div className="text-emerald-400 font-extrabold">Total Farmers: {paymentModalTruck.totalFarmersCount} Farmers</div>
                  <div className="text-amber-400 font-black text-sm">
                    Net Payment: {paymentModalTruck.totalTruckNetPayment.toLocaleString()} KHR
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Payment Method</label>
                  <select
                    value={payMethodInput}
                    onChange={(e) => setPayMethodInput(e.target.value)}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                  >
                    <option>ABA Bulk Transfer</option>
                    <option>Acleda Corporate Transfer</option>
                    <option>Wing Bank Transfer</option>
                    <option>Direct Cash Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Payment Batch Number (Optional)</label>
                  <input
                    type="text"
                    value={payBatchInput}
                    onChange={(e) => setPayBatchInput(e.target.value)}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-[#0b0f19] font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Process Payment to All {paymentModalTruck.totalFarmersCount} Farmers
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Main Application Dashboard UI (Completely Hidden on Print) */}
        <div className="space-y-6 print:hidden">
          {/* App Header */}
          <header className="bg-gradient-to-r from-[#1e293b] to-[#141c2f] border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black border border-white/20 rounded-xl flex items-center justify-center p-1 shadow-lg flex-shrink-0">
              <img src="/logo.png" alt="IBIS RICE CONSERVATION CO., LTD." className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#34d399]">
                IBIS RICE CONSERVATION CO., LTD
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Central Operations · Integrated Paddy Operations & Field Department Portal
              </p>
            </div>
          </div>

          {/* User Badge & Sync Status */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{isOnline ? 'Online (PostgreSQL Connected)' : 'Connection Offline'}</span>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span>👤 {currentUserName}</span>
              <span className="bg-emerald-400 text-[#0b0f19] px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold">
                {currentUserRole}
              </span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full text-red-400 hover:text-red-300 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* PROMINENT SUCCESS BANNER */}
        {successBanner && (
          <div className="bg-gradient-to-r from-emerald-950 to-[#141c2f] border-2 border-emerald-500 rounded-2xl p-4 text-xs text-emerald-300 flex items-center justify-between shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-[#0b0f19] flex items-center justify-center font-bold">
                ✓
              </div>
              <span className="font-extrabold text-sm text-emerald-400">{successBanner}</span>
            </div>
            <button onClick={() => setSuccessBanner('')} className="text-slate-400 hover:text-white font-bold text-sm">
              ✕
            </button>
          </div>
        )}

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{syncStatus}</span>
            </div>
            <button onClick={() => setSyncStatus('')} className="text-slate-400 hover:text-white font-bold text-sm">
              ✕
            </button>
          </div>
        )}

        {/* ROLE-BASED NAVIGATION MENU SWITCHER */}
        <div className="bg-[#141c2f] border border-white/10 rounded-xl p-1.5 flex flex-wrap gap-1">
          {(currentUserRole === 'FIELD' || currentUserRole === 'ADMIN') && (
            <button
              onClick={() => setActiveModule('field')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                activeModule === 'field'
                  ? 'bg-[#10b981] text-[#0b0f19] shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🌾 Field Operations
            </button>
          )}

          {(currentUserRole === 'WAREHOUSE' || currentUserRole === 'ADMIN') && (
            <button
              onClick={() => setActiveModule('warehouse')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                activeModule === 'warehouse'
                  ? 'bg-[#38bdf8] text-[#0b0f19] shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🏬 Warehouse Receiving
            </button>
          )}

          {(currentUserRole === 'FINANCE' || currentUserRole === 'ADMIN') && (
            <button
              onClick={() => setActiveModule('finance')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                activeModule === 'finance'
                  ? 'bg-[#f59e0b] text-[#0b0f19] shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              💳 Finance Verification
            </button>
          )}

          {currentUserRole === 'ADMIN' && (
            <button
              onClick={() => setActiveModule('admin')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                activeModule === 'admin'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ⚙️ Admin Master Settings
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            MODULE 1: FIELD OPERATIONS
        ══════════════════════════════════════════════════ */}
        {activeModule === 'field' && (currentUserRole === 'FIELD' || currentUserRole === 'ADMIN') && (
          <div className="space-y-6">
            {/* Field Sub-Tabs */}
            <div className="bg-[#141c2f] border border-white/10 rounded-xl p-1 grid grid-cols-2 md:grid-cols-4 gap-1">
              <button
                onClick={() => setFieldTab('specs')}
                className={`py-2 px-3 rounded-lg text-xs font-bold ${
                  fieldTab === 'specs' ? 'bg-[#10b981] text-[#0b0f19]' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔍 Specs Record
              </button>
              <button
                onClick={() => setFieldTab('payment')}
                className={`py-2 px-3 rounded-lg text-xs font-bold ${
                  fieldTab === 'payment' ? 'bg-[#10b981] text-[#0b0f19]' : 'text-slate-400 hover:text-white'
                }`}
              >
                💳 Farmer Payment Info
              </button>
              <button
                onClick={() => setFieldTab('purchase')}
                className={`py-2 px-3 rounded-lg text-xs font-bold ${
                  fieldTab === 'purchase' ? 'bg-[#10b981] text-[#0b0f19]' : 'text-slate-400 hover:text-white'
                }`}
              >
                🌾 Purchase Record
              </button>
              <button
                onClick={() => setFieldTab('transport')}
                className={`py-2 px-3 rounded-lg text-xs font-bold ${
                  fieldTab === 'transport' ? 'bg-[#10b981] text-[#0b0f19]' : 'text-slate-400 hover:text-white'
                }`}
              >
                🚛 Transport Record
              </button>
            </div>

            {/* TAB 1: SPECS RECORD */}
            {fieldTab === 'specs' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
                {/* Left Column: Quality Specs Inspection Entry Form & Live Metrics */}
                <div className="lg:col-span-7 bg-[#141c2f] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3.5">
                      <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        🔍 Quality Specs Inspection Entry
                      </h2>
                      <button
                        type="button"
                        onClick={handleExportSpecsCsv}
                        className="bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
                      </button>
                    </div>

                    <form onSubmit={handleSaveSpecs} className="space-y-4 text-xs">
                      {/* EDIT MODE BANNER */}
                      {editingSpecsId && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                            <Edit className="w-4 h-4" />
                            <span>✏️ EDIT MODE: Updating Quality Specs Record for {spFarmerName} ({spFamilyCode})</span>
                          </div>
                          <button
                            type="button"
                            onClick={resetSpecsForm}
                            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-lg font-bold transition-colors"
                          >
                            Cancel Edit
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Family Code *</label>
                          <input
                            type="text"
                            required
                            value={spFamilyCode}
                            onChange={(e) => setSpFamilyCode(e.target.value)}
                            placeholder="e.g. TB034"
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-extrabold focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Farmer Name *</label>
                          <input
                            type="text"
                            required
                            value={spFarmerName}
                            onChange={(e) => setSpFarmerName(e.target.value)}
                            placeholder="e.g. Sok San"
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Village (Dynamic)</label>
                          <select
                            value={spVillage}
                            onChange={(e) => setSpVillage(e.target.value)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          >
                            {villages.map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Paddy Category</label>
                          <select
                            value={spPaddyType}
                            onChange={(e) => setSpPaddyType(e.target.value)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          >
                            {uniqueVarieties.length > 0 ? (
                              uniqueVarieties.map((v) => (
                                <option key={v as string} value={v as string}>
                                  {v as string}
                                </option>
                              ))
                            ) : (
                              <>
                                <option>Phka Rumduol</option>
                                <option>Red Jasmine</option>
                                <option>White Rice</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Grade</label>
                          <select
                            value={spSelectedGrade}
                            onChange={(e) => setSpSelectedGrade(e.target.value)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          >
                            <option>A1</option>
                            <option>A2</option>
                            <option>B</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-2.5">
                          <div>
                            <div className="font-bold text-white text-xs">Organic Paddy</div>
                            <div className="text-[10px] text-emerald-400">
                              +{priceSpecs.find((s) => s.variety === spPaddyType && s.grade === spSelectedGrade)?.organicBonus || 100} KHR Bonus
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={spIsOrganic}
                            onChange={(e) => setSpIsOrganic(e.target.checked)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1.5">Moisture (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={spMoisture}
                            onChange={(e) => setSpMoisture(parseFloat(e.target.value))}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1.5">Foreign Matter (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={spForeign}
                            onChange={(e) => setSpForeign(parseFloat(e.target.value))}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1.5">Whole Grain (%)</label>
                          <input
                            type="number"
                            value={spWhole}
                            onChange={(e) => setSpWhole(parseFloat(e.target.value))}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1.5">Broken Rice (%)</label>
                          <input
                            type="number"
                            value={spBroken}
                            onChange={(e) => setSpBroken(parseFloat(e.target.value))}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className={`w-full font-black py-3 rounded-xl shadow-lg text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                            editingSpecsId
                              ? 'bg-amber-500 hover:bg-amber-400 text-[#0b0f19] shadow-amber-500/20'
                              : 'bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] shadow-emerald-500/20'
                          }`}
                        >
                          {editingSpecsId ? (
                            <>
                              <Edit className="w-4 h-4" /> Update Specs Record ({spFamilyCode})
                            </>
                          ) : (
                            'Save Quality Specs Inspection Record'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* BOTTOM DASHBOARD WIDGET: Today's Live Quality Summary & Standards */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Today's Inspection Summary & Field Standards
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Live Metrics
                      </span>
                    </div>

                    {/* Live Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Total Inspected</div>
                        <div className="text-xs sm:text-sm font-extrabold text-white font-mono mt-0.5">
                          {specsList.length} Records
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase">Pass Rate</div>
                        <div className="text-xs sm:text-sm font-extrabold text-emerald-300 font-mono mt-0.5">
                          {specsList.length > 0
                            ? `${Math.round((specsList.filter((s: any) => s.isValid).length / specsList.length) * 100)}%`
                            : '100%'}
                          <span className="text-[10px] text-slate-400 font-normal ml-1 hidden sm:inline">
                            ({specsList.filter((s: any) => s.isValid).length} Pass / {specsList.filter((s: any) => !s.isValid).length} Fail)
                          </span>
                        </div>
                      </div>
                      <div className="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl">
                        <div className="text-[10px] text-sky-400 font-bold uppercase">Avg Final Price</div>
                        <div className="text-xs sm:text-sm font-extrabold text-sky-300 font-mono mt-0.5">
                          {specsList.length > 0
                            ? Math.round(
                                specsList.reduce((sum: number, s: any) => sum + (s.finalPrice || 0), 0) / specsList.length
                              ).toLocaleString()
                            : '0'}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">KHR/kg</span>
                        </div>
                      </div>
                    </div>

                    {/* Quality Standards Thresholds */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] text-slate-300">
                      <div className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-1.5 flex items-center justify-between">
                        <span>📋 Standard Quality Specs Thresholds (IBIS Rice Standard)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Official Guidelines</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">💧 Moisture Target:</span>
                          <strong className="text-emerald-400">≤ 14.0%</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">🌾 Whole Grain Target:</span>
                          <strong className="text-emerald-400">≥ 70.0%</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">🍂 Foreign Matter Limit:</span>
                          <strong className="text-emerald-400">≤ 4.0%</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">🌿 Organic Premium:</span>
                          <strong className="text-emerald-400">+100 KHR Bonus</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Saved Specs History Sidebar */}
                <div className="lg:col-span-5 bg-[#141c2f] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">Saved Specs History</h3>
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-mono text-emerald-400">
                          {filteredSpecsList.length}
                        </span>
                      </div>

                      {/* Quick Search Box */}
                      <div className="relative w-full sm:w-44">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search Code or Name..."
                          value={specsSearchQuery}
                          onChange={(e) => setSpecsSearchQuery(e.target.value)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                        />
                        {specsSearchQuery && (
                          <button
                            onClick={() => setSpecsSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5 min-h-[360px] lg:min-h-[440px] max-h-[520px] overflow-y-auto pr-1">
                      {filteredSpecsList.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          {specsSearchQuery
                            ? `No specs records matching "${specsSearchQuery}".`
                            : 'No quality specs records available.'}
                        </div>
                      ) : (
                        filteredSpecsList.map((rec) => {
                          const isUsedForPurchase = purchases.some((p: any) => p.specsRecordId === rec.id);
                          return (
                            <div key={rec.id} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs space-y-1 hover:border-white/20 transition-colors">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-emerald-400">🆔 {rec.familyCode}</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSpecsForDetails(rec)}
                                    className="text-sky-400 hover:text-sky-300 p-1 hover:bg-sky-500/10 rounded transition-colors"
                                    title="View Quality Specs Inspection Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.isValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {rec.isValid ? 'Pass' : 'Fail'}
                                  </span>
                                  <button
                                    onClick={() => handleEditSpecs(rec)}
                                    className={`p-1 rounded transition-colors ${
                                      isUsedForPurchase
                                        ? 'text-slate-600 cursor-not-allowed hover:bg-white/5'
                                        : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                                    }`}
                                    title={
                                      isUsedForPurchase
                                        ? 'This Specs Record has already been used for a purchase and can no longer be edited.'
                                        : 'Edit Specs Record'
                                    }
                                  >
                                    {isUsedForPurchase ? <LockIcon className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                                  </button>
                                  {currentUserRole === 'ADMIN' && (
                                    <button
                                      onClick={() => handleDeleteSpecsRecord(rec.id, rec.familyCode)}
                                      className="text-red-400 hover:text-red-300 p-0.5 hover:bg-red-500/10 rounded"
                                      title="Delete Specs Record (Admin)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="font-bold text-white">{rec.farmerName} ({rec.village})</div>
                              <div className="text-slate-400 text-[11px]">🌾 {rec.paddyType} ({rec.selectedGrade}) · {rec.finalPrice.toLocaleString()} KHR/kg</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FARMER PAYMENT INFO */}
            {fieldTab === 'payment' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
                {/* Left Column: Farmer Payment Profile Registration & Live Registry Metrics */}
                <div className="lg:col-span-7 bg-[#141c2f] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        💳 Farmer Payment Profile Registration
                      </h2>
                      <button
                        type="button"
                        onClick={handleExportFarmerProfilesCsv}
                        className="bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
                      </button>
                    </div>

                    <form onSubmit={handleSaveFarmerProfile} className="space-y-4 text-xs">
                      {/* EDIT MODE BANNER */}
                      {editingProfileId && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                            <Edit className="w-4 h-4" />
                            <span>✏️ EDIT MODE: Updating Payment Profile for {payFarmerName} ({payFamilyCode})</span>
                          </div>
                          <button
                            type="button"
                            onClick={resetFarmerProfileForm}
                            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-lg font-bold transition-colors"
                          >
                            Cancel Edit
                          </button>
                        </div>
                      )}

                      {/* Row 1: Code, Farmer Name, Village */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Family Code *</label>
                          <input
                            type="text"
                            required
                            value={payFamilyCode}
                            onChange={(e) => setPayFamilyCode(e.target.value)}
                            placeholder="e.g. TB034"
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-extrabold focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Farmer Name *</label>
                          <input
                            type="text"
                            required
                            value={payFarmerName}
                            onChange={(e) => setPayFarmerName(e.target.value)}
                            placeholder="e.g. Sok San"
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Village (Dynamic)</label>
                          <select
                            value={payVillage}
                            onChange={(e) => setPayVillage(e.target.value)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          >
                            {villages.map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Account Holder Name & Relationship */}
                      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                            👤 Bank Account Owner Identification
                          </span>
                          <span className="text-[10px] text-slate-400">Specify exact bank-registered owner</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-slate-400 font-bold uppercase mb-1.5">
                              Account Holder Name (Registered with Bank) *
                            </label>
                            <input
                              type="text"
                              required
                              value={payAccountHolder}
                              onChange={(e) => setPayAccountHolder(e.target.value)}
                              placeholder="e.g. Sok San (or family member name)"
                              className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 font-bold uppercase mb-1.5">
                              Relationship to Farmer *
                            </label>
                            <select
                              value={payRelationship}
                              onChange={(e) => setPayRelationship(e.target.value)}
                              className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                            >
                              <option value="Self">Self (Farmer's Own Account)</option>
                              <option value="Husband">Husband</option>
                              <option value="Wife">Wife</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Son">Son</option>
                              <option value="Daughter">Daughter</option>
                              <option value="Brother">Brother</option>
                              <option value="Sister">Sister</option>
                              <option value="Grandfather">Grandfather</option>
                              <option value="Grandmother">Grandmother</option>
                              <option value="Other">Other (Specify Below)</option>
                            </select>
                          </div>
                        </div>

                        {/* Custom Relationship Input if "Other" */}
                        {payRelationship === 'Other' && (
                          <div>
                            <label className="block text-slate-400 font-bold uppercase mb-1.5">
                              Specify Other Relationship *
                            </label>
                            <input
                              type="text"
                              required
                              value={payCustomRelationship}
                              onChange={(e) => setPayCustomRelationship(e.target.value)}
                              placeholder="e.g. Uncle / Legal Guardian"
                              className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                            />
                          </div>
                        )}

                        {/* Validation Warning for Mismatch when Relationship is Self */}
                        {isAccountHolderNameMismatch && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-[11px] font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Notice: Relationship is set to <strong>Self</strong>, but Account Holder Name (
                              <strong className="text-white">{payAccountHolder}</strong>) differs from Farmer Name (
                              <strong className="text-white">{payFarmerName}</strong>).
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Row 3: Payment Method, Commercial Bank, Account Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Payment Method</label>
                          <select
                            value={payMethod}
                            onChange={(e) => setPayMethod(e.target.value)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-emerald-500"
                          >
                            <option>Bank Transfer</option>
                            <option>Cash</option>
                          </select>
                        </div>
                        {payMethod === 'Bank Transfer' ? (
                          <div>
                            <label className="block text-slate-400 font-bold uppercase mb-1.5">
                              Commercial Bank (Searchable)
                            </label>
                            <SearchableBankSelect
                              banks={banks}
                              value={payBankName}
                              onChange={(bName) => setPayBankName(bName)}
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-slate-400 font-bold uppercase mb-1.5">Payment Type</label>
                            <input
                              type="text"
                              disabled
                              value="Direct Cash Payment"
                              className="w-full bg-white/5 border border-slate-700 rounded-lg p-2.5 text-slate-400 font-bold"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-slate-400 font-bold uppercase mb-1.5">Account Number</label>
                          <input
                            type="text"
                            value={payAccountNumber}
                            onChange={(e) => setPayAccountNumber(e.target.value)}
                            placeholder="000 123 456"
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Bank Paper Photo Upload Area */}
                      <div className="p-3.5 bg-white/5 border border-dashed border-emerald-500/40 rounded-xl space-y-2">
                        <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          📷 Upload Photo of Actual Bank Document / Paper (Prevents Typo Errors)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBankPhotoUpload}
                          className="text-xs text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-[#0b0f19] hover:file:bg-emerald-400 cursor-pointer"
                        />
                        {uploadingPhoto && <div className="text-[11px] text-amber-400">Uploading photo...</div>}
                        {payBankPhotoUrl && (
                          <div className="flex items-center gap-3 pt-1">
                            <img src={payBankPhotoUrl} alt="Bank Document" className="w-12 h-12 object-cover rounded-lg border border-emerald-500/50" />
                            <span className="text-[11px] text-emerald-400 font-bold">✓ Bank document photo attached</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className={`w-full font-black py-3 rounded-xl shadow-lg text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                            editingProfileId
                              ? 'bg-amber-500 hover:bg-amber-400 text-[#0b0f19] shadow-amber-500/20'
                              : 'bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] shadow-emerald-500/20'
                          }`}
                        >
                          {editingProfileId ? (
                            <>
                              <Edit className="w-4 h-4" /> Update Farmer Payment Profile ({payFamilyCode})
                            </>
                          ) : (
                            'Save Farmer Payment Profile'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* BOTTOM DASHBOARD WIDGET: Registration Statistics & Verified Tracking */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Payment Registration Statistics & Verification Tracking
                      </span>
                      <span className="text-[10px] font-bold bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20">
                        Live Registry
                      </span>
                    </div>

                    {/* Live Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Registered Profiles</div>
                        <div className="text-xs sm:text-sm font-extrabold text-white font-mono mt-0.5">
                          {farmerProfiles.length} Profiles
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase">Verified Passbooks</div>
                        <div className="text-xs sm:text-sm font-extrabold text-emerald-300 font-mono mt-0.5">
                          {farmerProfiles.filter((p: any) => p.bankDocumentUrl).length} Verified
                          <span className="text-[10px] text-slate-400 font-normal ml-1 hidden sm:inline">
                            ({farmerProfiles.length > 0 ? Math.round((farmerProfiles.filter((p: any) => p.bankDocumentUrl).length / farmerProfiles.length) * 100) : 0}% With Photo)
                          </span>
                        </div>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-xl">
                        <div className="text-[10px] text-purple-300 font-bold uppercase">Bank Transfers</div>
                        <div className="text-xs sm:text-sm font-extrabold text-purple-200 font-mono mt-0.5">
                          {farmerProfiles.filter((p: any) => p.paymentMethod !== 'Direct Cash').length} Accounts
                        </div>
                      </div>
                    </div>

                    {/* Verification Protocol Guidelines */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] text-slate-300">
                      <div className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-1.5 flex items-center justify-between">
                        <span>🛡️ Bank Account Verification Protocol (Finance Standard)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Audit Ready</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📄 Passbook Photo Status:</span>
                          <strong className="text-sky-400">Required for Wire</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">👥 Family Member Account:</span>
                          <strong className="text-sky-400">Relationship Required</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">🏦 Major Banks Supported:</span>
                          <strong className="text-sky-400">ABA / ACLEDA / AMK / Canadia</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">💵 Cash Fallback:</span>
                          <strong className="text-sky-400">Direct Cash Payment</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profiles Database Sidebar */}
                <div className="lg:col-span-5 bg-[#141c2f] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">Registered Payment Profiles</h3>
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-mono text-sky-400">
                          {filteredFarmerProfiles.length}
                        </span>
                      </div>

                      {/* Quick Search Box for Family Code or Farmer Name */}
                      <div className="relative w-full sm:w-44">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search Code or Name..."
                          value={farmerProfileSearchQuery}
                          onChange={(e) => setFarmerProfileSearchQuery(e.target.value)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-sans"
                        />
                        {farmerProfileSearchQuery && (
                          <button
                            onClick={() => setFarmerProfileSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 min-h-[320px] max-h-[460px] xl:max-h-[475px] overflow-y-auto pr-1">
                      {filteredFarmerProfiles.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          {farmerProfileSearchQuery
                            ? `No payment profiles matching "${farmerProfileSearchQuery}".`
                            : 'No farmer profiles registered.'}
                        </div>
                      ) : (
                        filteredFarmerProfiles.map((p) => (
                          <div key={p.id} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs space-y-1 hover:border-white/20 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-sky-400">🆔 {p.familyCode}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400">
                                  {p.bankName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedFarmerProfileForDetails(p)}
                                  className="text-sky-400 hover:text-sky-300 p-0.5 hover:bg-sky-500/10 rounded transition-colors"
                                  title="View Farmer Payment Profile Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditFarmerProfile(p)}
                                  className="text-amber-400 hover:text-amber-300 p-0.5 hover:bg-amber-500/10 rounded transition-colors"
                                  title="Edit Farmer Payment Profile"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {currentUserRole === 'ADMIN' && (
                                  <button
                                    onClick={() => handleDeleteFarmerProfile(p.id, p.familyCode)}
                                    className="text-red-400 hover:text-red-300 p-0.5 hover:bg-red-500/10 rounded"
                                    title="Delete Farmer Profile (Admin)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="font-bold text-white">{p.farmerName} ({p.village})</div>
                            <div className="font-mono text-slate-300">Acc: {p.accountNumber}</div>
                            <div className="text-[11px] text-purple-300 font-bold">
                              Owner: {p.accountHolder || p.farmerName} ({p.relationship || 'Self'})
                            </div>
                            {p.bankDocumentUrl && (
                              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 pt-0.5">
                                📷 Photo Verified
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PURCHASE RECORD */}
            {fieldTab === 'purchase' && (
              <div className="space-y-5">
                {/* PURCHASE ENTRY FORM */}
                <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        🌾 Weighing & Purchase Invoice
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Select approved Specs Record, weigh sacks individually, add premiums, and sign electronically.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSpecsModalOpen(true)}
                      className="bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 self-start sm:self-auto"
                    >
                      <FileSearch className="w-4 h-4" /> 🔍 Select / Load from Approved Specs Record
                    </button>
                  </div>

                  <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
                    {/* EDIT MODE INDICATOR BANNER */}
                    {editingPurchaseId && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300 shadow-md">
                        <div className="flex items-center gap-2 font-bold">
                          <span>✏️ EDIT MODE: Updating Purchase Record PR-2026-{editingPurchaseId.slice(-6).toUpperCase()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={resetPurchaseForm}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-lg transition-colors"
                        >
                          Cancel Edit
                        </button>
                      </div>
                    )}

                    {/* Farmer Info Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">FAMILY CODE *</span>
                        <input
                          type="text"
                          required
                          value={pFamilyCode}
                          onChange={(e) => setPFamilyCode(e.target.value)}
                          placeholder="e.g. TB034"
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-extrabold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">FARMER NAME *</span>
                        <input
                          type="text"
                          required
                          value={pFarmerName}
                          onChange={(e) => setPFarmerName(e.target.value)}
                          placeholder="e.g. Sok San"
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">PURCHASING STAFF</span>
                        <div className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-bold text-emerald-400 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" /> {currentUserName}
                        </div>
                      </div>
                    </div>

                    {/* SECTION A — PADDY PURCHASE */}
                    <div className="border border-emerald-500/30 bg-[#0f172a] rounded-xl p-3.5 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-[#0b0f19] flex items-center justify-center font-extrabold text-[11px]">
                            1
                          </span>
                          <h3 className="font-extrabold text-xs sm:text-sm text-white">SECTION A — PADDY PURCHASE DETAILS</h3>
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-amber-400">
                          {totalPaddyValue.toLocaleString()} KHR
                        </span>
                      </div>

                      {/* Row 1: Variety, Grade, Standard Price */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">VARIETY</label>
                          <select
                            value={pVariety}
                            onChange={(e) => setPVariety(e.target.value)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                          >
                            <option>Red Jasmine</option>
                            <option>Phka Rumduol</option>
                            <option>White Rice</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">GRADE</label>
                          <select
                            value={pGrade}
                            onChange={(e) => setPGrade(e.target.value)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                          >
                            <option value="A1">A1 — {pStandardPrice.toLocaleString()} KHR/kg</option>
                            <option value="A2">A2 — 1,750 KHR/kg</option>
                            <option value="B">B — 1,600 KHR/kg</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            STANDARD PRICE (KHR/KG)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={pStandardPrice}
                            onChange={(e) => setPStandardPrice(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-extrabold text-amber-400"
                          />
                          <p className="text-[10px] text-emerald-400 mt-0.5">
                            {(pStandardPrice - 100).toLocaleString()} base + 100 organic bonus = {pStandardPrice.toLocaleString()} KHR/kg
                          </p>
                        </div>
                      </div>

                      {/* Row 2: Additional Price / Premium & Final Price */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            ADDITIONAL PRICE / PREMIUM (KHR/KG)
                          </label>
                          <input
                            type="text"
                            value={pAdditionalPriceInput}
                            onFocus={(e) => {
                              if (e.target.value === '0') setPAdditionalPriceInput('');
                            }}
                            onBlur={(e) => {
                              if (!e.target.value.trim()) setPAdditionalPriceInput('0');
                            }}
                            onChange={(e) => setPAdditionalPriceInput(e.target.value)}
                            placeholder="0"
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold focus:border-emerald-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Manual extra transport/ferry fee per kg</p>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            FINAL PURCHASE PRICE (KHR/KG) (AUTO)
                          </label>
                          <div className="px-2.5 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-emerald-400 font-extrabold text-xs sm:text-sm">
                            {finalPurchasePrice.toLocaleString()} KHR/kg
                          </div>
                          <p className="text-[10px] text-emerald-400 mt-0.5">
                            {pStandardPrice.toLocaleString()} std + {pAdditionalPrice} premium = {finalPurchasePrice.toLocaleString()} KHR/kg
                          </p>
                        </div>
                      </div>

                      {/* Sack Weighing Entry Box (Compact Dynamic Height!) */}
                      <div className="p-3 bg-white/5 border border-emerald-500/30 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" /> SACK WEIGHING ENTRY (WEIGH ONE BY ONE)
                          </label>
                          {pSackWeights.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllSacks}
                              className="px-2.5 py-0.5 bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Clear All Sacks
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={pSackInput}
                            onChange={(e) => setPSackInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSackWeight();
                              }
                            }}
                            placeholder="Enter weight in kg (e.g. 85 or 85, 83, 80)"
                            className="flex-1 bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSackWeight()}
                            className="bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Sack
                          </button>
                        </div>

                        <div className={`pt-0.5 overflow-y-auto transition-all ${pSackWeights.length === 0 ? 'max-h-[32px]' : 'max-h-[100px]'}`}>
                          {pSackWeights.length === 0 ? (
                            <div className="text-slate-500 text-[10px] italic py-0.5">
                              No sacks weighed yet. Enter weight above and click "Add Sack".
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {pSackWeights.map((w, idx) => (
                                <div
                                  key={idx}
                                  className="bg-[#1e293b] border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-mono font-bold text-[11px] shadow-sm"
                                >
                                  <span>#{idx + 1} {w.toFixed(1)} kg</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSackWeight(idx)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full p-0.5"
                                    title="Remove sack"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Row 4: Auto Totals */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            NUMBER OF SACKS (AUTO)
                          </label>
                          <div className="px-2.5 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-white font-extrabold text-sm sm:text-base font-mono">
                            {totalSacksCount} Sacks
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            TOTAL QUANTITY (KG) (AUTO)
                          </label>
                          <div className="px-2.5 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-emerald-400 font-extrabold text-sm sm:text-base font-mono">
                            {totalWeightKg.toFixed(2)} kg
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            PADDY VALUE (KHR) (AUTO)
                          </label>
                          <div className="px-2.5 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-amber-400 font-extrabold text-sm sm:text-base font-mono">
                            {totalPaddyValue.toLocaleString()} KHR
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">📦 Subtotal A — Total Paddy Value</span>
                        <span className="font-extrabold text-amber-400 font-mono">
                          {totalPaddyValue.toLocaleString()} KHR
                        </span>
                      </div>
                    </div>

                    {/* SECTION B — SEED RETURN DEDUCTION */}
                    <div className="border border-amber-500/30 bg-[#0f172a] rounded-xl p-3.5 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-[#0b0f19] flex items-center justify-center font-extrabold text-[11px]">
                            🌾
                          </span>
                          <h3 className="font-extrabold text-xs sm:text-sm text-white">
                            SECTION B — SEED RETURN DEDUCTION (10% INTEREST)
                          </h3>
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-red-400 font-mono">
                          -{seedDeductionTotal.toLocaleString()} KHR
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            SEED BORROWED (KG)
                          </label>
                          <input
                            type="text"
                            value={pSeedBorrowedInput}
                            onFocus={(e) => {
                              if (e.target.value === '0') setPSeedBorrowedInput('');
                            }}
                            onBlur={(e) => {
                              if (!e.target.value.trim()) setPSeedBorrowedInput('0');
                            }}
                            onChange={(e) => setPSeedBorrowedInput(e.target.value)}
                            placeholder="0"
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            REPAYMENT QTY (110%) (KG)
                          </label>
                          <div className="px-2.5 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-slate-200 font-bold font-mono">
                            {seedRepaymentQty.toFixed(2)} kg
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            UNIT PRICE (KHR/KG)
                          </label>
                          <div className="px-2.5 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-slate-200 font-bold font-mono">
                            {pStandardPrice.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
                            DEDUCTION TOTAL (KHR)
                          </label>
                          <div className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-extrabold font-mono">
                            {seedDeductionTotal.toLocaleString()} KHR
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">
                          🌱 Subtotal B — Seed Deduction (Deducted from Payment)
                        </span>
                        <span className="font-extrabold text-red-400 font-mono">
                          -{seedDeductionTotal.toLocaleString()} KHR
                        </span>
                      </div>
                    </div>

                    {/* NET PAYMENT TO FARMER BANNER */}
                    <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/80 to-[#141c2f] border-2 border-emerald-500 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-emerald-400 flex items-center gap-2">
                          💰 Net Payment to Farmer
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Subtotal A (Total Paddy Value) - Subtotal B (Seed Deduction)
                        </p>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight font-mono">
                        {netPaymentToFarmer.toLocaleString()} KHR
                      </div>
                    </div>

                    {/* DUAL ELECTRONIC SIGNATURES (Compact 90px Signature Height!) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-emerald-400 flex items-center gap-1.5 uppercase">
                            <PenTool className="w-3.5 h-3.5" /> Farmer Signature (Seller) *
                          </span>
                          {pFarmerSignature && (
                            <span className="text-[10px] text-emerald-400 font-bold">✓ Seller Signed</span>
                          )}
                        </div>
                        <SignaturePad
                          label="Farmer / Seller Signature (Draw on screen)"
                          onSave={(dataUrl) => setPFarmerSignature(dataUrl)}
                          clearKey={sigClearKey}
                          height={90}
                        />
                      </div>

                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-sky-400 flex items-center gap-1.5 uppercase">
                            <PenTool className="w-3.5 h-3.5" /> Purchasing Staff Signature (Buyer) *
                          </span>
                          {pStaffSignature && (
                            <span className="text-[10px] text-sky-400 font-bold">✓ Buyer Signed</span>
                          )}
                        </div>
                        <SignaturePad
                          label={`Purchaser: ${currentUserName} (Draw signature)`}
                          onSave={(dataUrl) => setPStaffSignature(dataUrl)}
                          clearKey={sigClearKey}
                          height={90}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full font-black py-3 rounded-xl shadow-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                        editingPurchaseId
                          ? 'bg-amber-500 hover:bg-amber-400 text-[#0b0f19] shadow-amber-500/20'
                          : 'bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] shadow-emerald-500/20'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {editingPurchaseId
                        ? `Update Purchase Record (PR-2026-${editingPurchaseId.slice(-6).toUpperCase()})`
                        : 'Save Paddy Purchase Record & Dual Signatures'}
                    </button>
                  </form>
                </div>

                {/* PURCHASE RECORD HISTORY SECTION */}
                <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        🌾 Purchase Record History ({filteredPurchases.length})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Central location to search, verify, print receipts, edit, and export purchase invoices.
                      </p>
                    </div>

                    <button
                      onClick={exportPurchaseHistoryCSV}
                      className="bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 self-start md:self-auto"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
                    </button>
                  </div>

                  {/* Search & Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/5 border border-white/10 rounded-xl p-3 text-xs">
                    <div className="sm:col-span-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={pSearchQuery}
                        onChange={(e) => setPSearchQuery(e.target.value)}
                        placeholder="Search Code, Farmer, Staff..."
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <select
                        value={pFilterVillage}
                        onChange={(e) => setPFilterVillage(e.target.value)}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white font-bold"
                      >
                        <option value="ALL">All Villages ({villages.length})</option>
                        {villages.map((v) => (
                          <option key={v.id} value={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={pFilterVariety}
                        onChange={(e) => setPFilterVariety(e.target.value)}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white font-bold"
                      >
                        <option value="ALL">All Paddy Varieties</option>
                        {uniqueVarieties.map((v) => (
                          <option key={v as string} value={v as string}>
                            {v as string}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={pFilterStaff}
                        onChange={(e) => setPFilterStaff(e.target.value)}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white font-bold"
                      >
                        <option value="ALL">All Purchasing Staff</option>
                        {uniqueStaffNames.map((s) => (
                          <option key={s as string} value={s as string}>
                            {s as string}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Searchable Purchase Table */}
                  <div className="overflow-x-auto border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                        <tr>
                          <th className="p-3">Purchase ID</th>
                          <th className="p-3">Date & Time</th>
                          <th className="p-3">Family Code</th>
                          <th className="p-3">Farmer Name</th>
                          <th className="p-3">Variety / Grade</th>
                          <th className="p-3 text-center">Sacks</th>
                          <th className="p-3 text-right">Total Weight</th>
                          <th className="p-3 text-right">Final Price</th>
                          <th className="p-3 text-right">Gross Value</th>
                          <th className="p-3 text-right">Net Payment</th>
                          <th className="p-3">Purchasing Staff</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredPurchases.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="p-8 text-center text-slate-500 text-xs">
                              No purchase records match your search or filter. Create your first purchase record above.
                            </td>
                          </tr>
                        ) : (
                          filteredPurchases.map((p) => {
                            const item = p.items?.[0] || {};
                            const pIdFormatted = `PR-2026-${p.id.slice(-6).toUpperCase()}`;

                            return (
                              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 font-mono font-bold text-emerald-400">{pIdFormatted}</td>
                                <td className="p-3 text-slate-400 text-[11px]">
                                  {new Date(p.createdAt).toLocaleDateString()}{' '}
                                  <span className="text-slate-500">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="p-3 font-extrabold text-amber-400">{p.familyCode}</td>
                                <td className="p-3 font-bold text-white">
                                  {p.farmerName}
                                  <div className="text-[10px] text-slate-400">{p.village}</div>
                                </td>
                                <td className="p-3">
                                  <span className="font-bold text-sky-400">{item.variety || 'Red Jasmine'}</span>
                                  <span className="ml-1 font-extrabold text-purple-400">({item.grade || 'A1'})</span>
                                </td>
                                <td className="p-3 text-center font-bold text-slate-200">{item.sacks || 0}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-200">{p.totalWeight.toFixed(2)} kg</td>
                                <td className="p-3 text-right font-mono text-emerald-400">
                                  {(item.finalPrice || 2047.5).toLocaleString()} KHR
                                </td>
                                <td className="p-3 text-right font-mono text-slate-300">
                                  {p.totalPayment.toLocaleString()} KHR
                                </td>
                                <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                                  {p.netPayment.toLocaleString()} KHR
                                </td>
                                <td className="p-3 font-bold text-slate-300">
                                  👤 {p.purchasingStaffName || 'Field Staff'}
                                </td>

                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    onClick={() => setSelectedPurchaseForDetails(p)}
                                    className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedPurchaseForPrint(p)}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                    title="Print Receipt"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  {p.status === 'PENDING' && !p.transportRecordId ? (
                                    <button
                                      onClick={() => handleEditPurchase(p)}
                                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                                      title="Edit Purchase Record"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="p-1.5 text-slate-500 inline-block text-[11px]"
                                      title="Record Locked: Purchase record is already assigned to a truck dispatch or received at warehouse."
                                    >
                                      🔒
                                    </span>
                                  )}
                                  {currentUserRole === 'ADMIN' && (
                                    <button
                                      onClick={() => handleDeletePurchase(p.id, p.familyCode)}
                                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                      title="Delete Record (Admin)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TRANSPORT RECORD */}
            {fieldTab === 'transport' && (
              <div className="space-y-5">
                {/* DISPATCH FORM WITH MULTI-PURCHASE SELECTOR */}
                <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-[#38bdf8] flex items-center gap-2">
                        🚛 Loading and Transport
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Load completed farmer purchase records onto a truck and dispatch to warehouse.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPurchaseSelectorOpen(true)}
                      className="bg-[#38bdf8] hover:bg-sky-500 text-[#0b0f19] px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 self-start sm:self-auto"
                    >
                      <FileSearch className="w-4 h-4" /> 🔍 Select / Load Purchase Records for Truck ({selectedPurchasesForTruck.length} Loaded)
                    </button>
                  </div>

                  <form onSubmit={handleSaveTransport} className="space-y-4 text-xs">
                    {/* EDIT MODE INDICATOR BANNER */}
                    {editingTransportId && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300 shadow-md">
                        <div className="flex items-center gap-2 font-bold">
                          <Edit className="w-4 h-4 text-amber-400" />
                          <span>✏️ EDIT MODE: Updating Transport Record TR-2026-{editingTransportId.slice(-6).toUpperCase()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={resetTransportForm}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-lg transition-colors"
                        >
                          Cancel Edit
                        </button>
                      </div>
                    )}

                    {/* Cargo Manifest Table */}
                    <div className="p-3.5 bg-[#0f172a] border border-sky-500/30 rounded-xl space-y-3 shadow-lg">
                      <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                        <span className="font-extrabold text-xs text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" /> Loaded Farmer Purchase Records on Truck
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {selectedPurchasesForTruck.length === 0 ? 'No records loaded yet.' : `${selectedPurchasesForTruck.length} Farmers Assigned`}
                        </span>
                      </div>

                      {/* Calculated Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Farmers</span>
                          <span className="font-extrabold text-white text-xs sm:text-sm font-mono">{tFarmersCount} Farmers</span>
                        </div>
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchase Records</span>
                          <span className="font-extrabold text-emerald-400 text-xs sm:text-sm font-mono">{tPurchasesCount} Invoices</span>
                        </div>
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Sacks Loaded</span>
                          <span className="font-extrabold text-amber-400 text-xs sm:text-sm font-mono">{tTotalSacks} Sacks</span>
                        </div>
                        <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg">
                          <span className="text-sky-400 block text-[10px] uppercase font-bold">Total Truck Field Weight</span>
                          <span className="font-black text-sky-400 text-xs sm:text-sm font-mono">{tTotalWeight.toFixed(2)} kg</span>
                        </div>
                      </div>

                      {/* Table of Loaded Purchases */}
                      {selectedPurchasesForTruck.length > 0 ? (
                        <div className="overflow-x-auto border border-white/10 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                              <tr>
                                <th className="p-2">Purchase ID</th>
                                <th className="p-2">Family Code</th>
                                <th className="p-2">Farmer Name</th>
                                <th className="p-2">Village</th>
                                <th className="p-2">Variety / Grade</th>
                                <th className="p-2 text-center">Sacks</th>
                                <th className="p-2 text-right">Weight (kg)</th>
                                <th className="p-2 text-right">Net Payment</th>
                                <th className="p-2 text-center">Remove</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {selectedPurchasesForTruck.map((p) => {
                                const item = p.items?.[0] || {};
                                return (
                                  <tr key={p.id} className="hover:bg-white/5">
                                    <td className="p-2 font-mono font-bold text-sky-400">
                                      PR-2026-{p.id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="p-2 font-extrabold text-amber-400">{p.familyCode}</td>
                                    <td className="p-2 font-bold text-white">{p.farmerName}</td>
                                    <td className="p-2 text-slate-300">{p.village}</td>
                                    <td className="p-2">
                                      {item.variety || 'Red Jasmine'} ({item.grade || 'A1'})
                                    </td>
                                    <td className="p-2 text-center font-bold text-white">{item.sacks || 0}</td>
                                    <td className="p-2 text-right font-mono font-bold text-sky-400">
                                      {p.totalWeight.toFixed(2)} kg
                                    </td>
                                    <td className="p-2 text-right font-mono font-bold text-emerald-400">
                                      {p.netPayment.toLocaleString()} KHR
                                    </td>
                                    <td className="p-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedPurchasesForTruck(
                                            selectedPurchasesForTruck.filter((item) => item.id !== p.id)
                                          )
                                        }
                                        className="text-red-400 hover:text-red-300 p-0.5 hover:bg-red-500/10 rounded"
                                        title="Remove from truck"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-3 text-slate-400 text-[11px] italic bg-white/5 border border-dashed border-white/10 rounded-lg">
                          No purchase records loaded onto this truck yet. Click "Select / Load Purchase Records for Truck" above to assign farmer purchases.
                        </div>
                      )}
                    </div>

                    {/* TRANSPORT TRUCK INFORMATION */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Driver Name *</label>
                        <input
                          type="text"
                          required
                          value={tDriver}
                          onChange={(e) => setTDriver(e.target.value)}
                          placeholder="e.g. Heng Sambath"
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Truck Plate Number *</label>
                        <input
                          type="text"
                          required
                          value={tPlate}
                          onChange={(e) => setTPlate(e.target.value)}
                          placeholder="e.g. 3B-1234"
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-extrabold uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Driver Mobile Number</label>
                        <input
                          type="text"
                          value={tMobile}
                          onChange={(e) => setTMobile(e.target.value)}
                          placeholder="012 345 678"
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Loading Location</label>
                        <input
                          type="text"
                          value={tLoadingLocation}
                          onChange={(e) => setTLoadingLocation(e.target.value)}
                          placeholder="Enter the loading location"
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Destination Warehouse</label>
                        <input
                          type="text"
                          value={tDestinationWarehouse}
                          onChange={(e) => setTDestinationWarehouse(e.target.value)}
                          placeholder="Enter destination warehouse"
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="truckCleanedCheck"
                          checked={tCleaned}
                          onChange={(e) => setTCleaned(e.target.checked)}
                          className="w-4 h-4 accent-sky-500 cursor-pointer"
                        />
                        <label htmlFor="truckCleanedCheck" className="font-bold text-white cursor-pointer">
                          Truck Cleaning
                        </label>
                      </div>
                      <span className="text-[10px] text-slate-400">Inspected by {currentUserName}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={selectedPurchasesForTruck.length === 0}
                      className={`w-full font-black py-3 rounded-xl shadow-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                        editingTransportId
                          ? 'bg-amber-500 hover:bg-amber-400 text-[#0b0f19] shadow-amber-500/20'
                          : 'bg-[#38bdf8] hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-[#0b0f19] shadow-sky-500/20'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                      {editingTransportId
                        ? `Update Transport Record (TR-2026-${editingTransportId.slice(-6).toUpperCase()})`
                        : `Save Transport Record (${selectedPurchasesForTruck.length} Purchases)`}
                    </button>
                  </form>
                </div>

                {/* TRANSPORT RECORD HISTORY SECTION */}
                <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        🚛 Transport Record History ({filteredTransports.length})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Track dispatched truckloads, view assigned farmer purchase manifests, print manifest, and export CSV.
                      </p>
                    </div>

                    <button
                      onClick={exportTransportHistoryCSV}
                      className="bg-[#38bdf8] hover:bg-sky-500 text-[#0b0f19] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-sky-500/20 self-start md:self-auto"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-md text-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={tSearchQuery}
                      onChange={(e) => setTSearchQuery(e.target.value)}
                      placeholder="Search Transport ID, Driver, Plate, Station..."
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Searchable Transport History Table */}
                  <div className="overflow-x-auto border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                        <tr>
                          <th className="p-3">Transport ID</th>
                          <th className="p-3">Dispatch Date</th>
                          <th className="p-3">Driver & Plate Number</th>
                          <th className="p-3">Loading Location</th>
                          <th className="p-3">Destination</th>
                          <th className="p-3 text-center">Purchases</th>
                          <th className="p-3 text-center">Sacks</th>
                          <th className="p-3 text-right">Field Weight (kg)</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredTransports.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-slate-500 text-xs">
                              No transport dispatch records match your search. Create a new transport dispatch record above.
                            </td>
                          </tr>
                        ) : (
                          filteredTransports.map((t) => {
                            const tIdFormatted = `TR-2026-${t.id.slice(-6).toUpperCase()}`;
                            const purchaseCount = t.purchases?.length || t.lots?.length || 0;

                            return (
                              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 font-mono font-bold text-sky-400">{tIdFormatted}</td>
                                <td className="p-3 text-slate-400 text-[11px]">
                                  {new Date(t.createdAt).toLocaleDateString()}{' '}
                                  <span className="text-slate-500">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="p-3 font-bold text-white">
                                  {t.driverName}
                                  <div className="font-mono text-sky-400 text-[11px]">{t.plateNumber}</div>
                                </td>
                                <td className="p-3 text-slate-300">{t.loadingLocation || 'Chhaeb Buying Station'}</td>
                                <td className="p-3 text-slate-300">{t.destinationWarehouse || 'Central Mill Warehouse'}</td>
                                <td className="p-3 text-center font-bold text-emerald-400">{purchaseCount} Purchases</td>
                                <td className="p-3 text-center font-bold text-amber-400">{t.totalSacks} Sacks</td>
                                <td className="p-3 text-right font-mono font-black text-sky-400">
                                  {t.totalFieldWeight.toFixed(2)} kg
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    t.status === 'ARRIVED' || t.status === 'RECEIVED'
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : 'bg-sky-500/10 text-sky-400 animate-pulse'
                                  }`}>
                                    {t.status === 'EN_ROUTE' ? '🚛 IN TRANSIT' : t.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    onClick={() => setSelectedTransportForDetails(t)}
                                    className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-colors"
                                    title="View Truck Cargo Manifest"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedTransportForPrint(t)}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                    title="Print Transport Manifest"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => exportTransportTruckCSV(t)}
                                    className="p-1.5 bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] rounded-lg transition-colors"
                                    title="Export Truck CSV"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                  </button>
                                  {!(t.intake || ['RECEIVED', 'VERIFIED', 'DISBURSED'].includes(t.status)) ? (
                                    <button
                                      onClick={() => handleEditTransport(t)}
                                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                                      title="Edit Transport Record"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => alert('This transport record has already been received by the warehouse and can no longer be edited.')}
                                      className="p-1.5 text-slate-500 hover:bg-white/5 rounded-lg transition-colors"
                                      title="This transport record has already been received by the warehouse and can no longer be edited."
                                    >
                                      <LockIcon className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {currentUserRole === 'ADMIN' && (
                                    <button
                                      onClick={() => handleDeleteTransportRecord(t.id, t.plateNumber)}
                                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                      title="Delete Transport Record (Admin)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            MODULE 2: WAREHOUSE RECEIVING WITH SCALE PHOTOS & HISTORY
        ══════════════════════════════════════════════════ */}
        {activeModule === 'warehouse' && (currentUserRole === 'WAREHOUSE' || currentUserRole === 'ADMIN') && (
          <div className="space-y-8">
            {/* WAREHOUSE RECEIVING FORM */}
            <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-6">
              <h2 className="text-base font-bold text-[#38bdf8] flex items-center justify-between border-b border-white/10 pb-3">
                <span className="flex items-center gap-2">🏬 Warehouse Scale Intake & Photo Proof (Receiving Staff Only)</span>
                <span className="text-xs text-sky-300 font-normal">📸 Gross & Tare Photo Audits Enabled</span>
              </h2>

              <form onSubmit={handleSaveWarehouseIntake} className="space-y-6 text-xs">
                {/* EDIT MODE INDICATOR BANNER */}
                {editingIntakeId && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300 shadow-md">
                    <div className="flex items-center gap-2 font-bold">
                      <span>✏️ EDIT MODE: Updating Warehouse Receiving Record WR-2026-{editingIntakeId.slice(-6).toUpperCase()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={resetWarehouseForm}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-lg transition-colors"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}
                {/* Select En-Route Truck */}
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Select En-Route Truck *</label>
                  <select
                    value={selectedTransportId}
                    onChange={(e) => setSelectedTransportId(e.target.value)}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-sky-500"
                  >
                    <option value="">-- Select Arriving Truck --</option>
                    {transports
                      .filter((t) => t.status === 'EN_ROUTE')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          🚛 Driver: {t.driverName} ({t.plateNumber}) · Field Weight: {t.totalFieldWeight.toFixed(2)} kg · Sacks: {t.totalSacks} · Dispatch Date: {new Date(t.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>

                {/* READ-ONLY FIELD SUMMARY DISPLAY */}
                {selectedEnRouteTransport && (
                  <div className="p-4 bg-[#0f172a] border border-sky-500/30 rounded-2xl space-y-3 shadow-xl animate-fade-in">
                    <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                      <span className="font-extrabold text-xs text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-4 h-4" /> Dispatched Truck Field Summary (Read-Only)
                      </span>
                      <span className="font-mono text-xs text-sky-300 font-extrabold">
                        TR-2026-{selectedEnRouteTransport.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Driver & Plate</span>
                        <span className="font-bold text-white">
                          {selectedEnRouteTransport.driverName} ({selectedEnRouteTransport.plateNumber})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Farmers & Invoices</span>
                        <span className="font-bold text-emerald-400">
                          {selectedTruckFarmersCount} Farmers ({selectedTruckPurchases.length} Invoices)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Sacks</span>
                        <span className="font-bold text-amber-400">{selectedEnRouteTransport.totalSacks} Sacks</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Field Weight</span>
                        <span className="font-black text-sky-400 text-sm">
                          {whFieldWeight.toFixed(2)} kg
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* WAREHOUSE WEIGHING & COMPARISON WITH TOLERANCE COLOR HIGHLIGHTING */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Warehouse Gross Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={whGrossWeight}
                      onChange={(e) => setWhGrossWeight(e.target.value)}
                      placeholder="e.g. 15400"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Warehouse Tare Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={whTareWeight}
                      onChange={(e) => setWhTareWeight(e.target.value)}
                      placeholder="e.g. 5400"
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Warehouse Net Weight (Auto)</label>
                    <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 font-extrabold text-sm">
                      {whCalculatedNetWeight.toFixed(2)} kg
                    </div>
                  </div>
                </div>

                {/* WEIGHT COMPARISON & TOLERANCE BADGE */}
                {selectedEnRouteTransport && whCalculatedNetWeight > 0 && (
                  <div className="p-4 bg-[#0f172a] border border-white/10 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-sky-400" /> Weighbridge Scale Difference vs Field Dispatch Weight
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                          whToleranceStatus === 'green'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : whToleranceStatus === 'yellow'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {whToleranceStatus === 'green' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {whToleranceStatus === 'yellow' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {whToleranceStatus === 'red' && <XCircle className="w-3.5 h-3.5" />}
                        {whToleranceBadgeText}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Field Dispatch</span>
                        <span className="font-bold text-white">{whFieldWeight.toFixed(2)} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Warehouse Net</span>
                        <span className="font-bold text-sky-400">{whCalculatedNetWeight.toFixed(2)} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Difference (kg)</span>
                        <span className={`font-extrabold ${whWeightDiffKg >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {whWeightDiffKg >= 0 ? '+' : ''}{whWeightDiffKg.toFixed(2)} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Variance (%)</span>
                        <span className={`font-black ${
                          whToleranceStatus === 'green' ? 'text-emerald-400' :
                          (whToleranceStatus === 'yellow' ? 'text-amber-400' : 'text-red-400')
                        }`}>
                          {whWeightDiffPercent >= 0 ? '+' : ''}{whWeightDiffPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCALE DISPLAY INDICATOR PHOTO UPLOAD AREA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-white/5 border border-dashed border-sky-500/40 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4" /> Upload Gross Weight Scale Display Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleScalePhotoUpload(e, 'gross')}
                      className="text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sky-500 file:text-[#0b0f19] hover:file:bg-sky-400 cursor-pointer"
                    />
                    {uploadingGrossPhoto && <div className="text-[11px] text-amber-400">Uploading gross scale photo...</div>}
                    {whGrossPhotoUrl && (
                      <div className="flex items-center gap-3 pt-2">
                        <img src={whGrossPhotoUrl} alt="Gross Scale Display" className="w-16 h-16 object-cover rounded-lg border border-sky-500/50" />
                        <span className="text-[11px] text-sky-400 font-bold">✓ Gross scale photo attached</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white/5 border border-dashed border-sky-500/40 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4" /> Upload Tare Weight Scale Display Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleScalePhotoUpload(e, 'tare')}
                      className="text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sky-500 file:text-[#0b0f19] hover:file:bg-sky-400 cursor-pointer"
                    />
                    {uploadingTarePhoto && <div className="text-[11px] text-amber-400">Uploading tare scale photo...</div>}
                    {whTarePhotoUrl && (
                      <div className="flex items-center gap-3 pt-2">
                        <img src={whTarePhotoUrl} alt="Tare Scale Display" className="w-16 h-16 object-cover rounded-lg border border-sky-500/50" />
                        <span className="text-[11px] text-sky-400 font-bold">✓ Tare scale photo attached</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full font-black py-3.5 rounded-2xl shadow-xl text-sm flex items-center justify-center gap-2 transition-all ${
                    editingIntakeId
                      ? 'bg-amber-500 hover:bg-amber-400 text-[#0b0f19] shadow-amber-500/20'
                      : 'bg-[#38bdf8] hover:bg-sky-500 text-[#0b0f19] shadow-sky-500/20'
                  }`}
                >
                  <Scale className="w-5 h-5" />
                  {editingIntakeId
                    ? `Update Warehouse Receiving Record (WR-2026-${editingIntakeId.slice(-6).toUpperCase()})`
                    : 'Confirm & Save Warehouse Intake Scale Record & Photos'}
                </button>
              </form>
            </div>

            {/* WAREHOUSE RECEIVING HISTORY SECTION */}
            <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    🏬 Warehouse Receiving History ({filteredIntakes.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    View weighbridge intake records, inspect scale display photos, print reports, and export CSV.
                  </p>
                </div>

                <button
                  onClick={exportWarehouseHistoryCSV}
                  className="bg-[#38bdf8] hover:bg-sky-500 text-[#0b0f19] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-sky-500/20 self-start md:self-auto"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md text-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={whSearchQuery}
                  onChange={(e) => setWhSearchQuery(e.target.value)}
                  placeholder="Search Warehouse ID, Transport ID, Driver, Plate, Farmer..."
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Searchable Warehouse Receiving Table */}
              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                    <tr>
                      <th className="p-3">Receiving ID</th>
                      <th className="p-3">Arrival Date</th>
                      <th className="p-3">Transport ID</th>
                      <th className="p-3">Driver & Plate Number</th>
                      <th className="p-3 text-right">Field Weight</th>
                      <th className="p-3 text-right">Warehouse Net Weight</th>
                      <th className="p-3 text-right">Weight Diff (kg / %)</th>
                      <th className="p-3 text-center">Scale Photos</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredIntakes.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                          No warehouse receiving records match your search. Complete your first warehouse scale intake above.
                        </td>
                      </tr>
                    ) : (
                      filteredIntakes.map((intake) => {
                        const transport = intake.transport || {};
                        const receivingIdFormatted = `WR-2026-${intake.id.slice(-6).toUpperCase()}`;
                        const transportIdFormatted = `TR-2026-${transport.id?.slice(-6).toUpperCase()}`;

                        const fieldWeight = transport.totalFieldWeight || 0;
                        const netWeight = intake.warehouseNetWeight || 0;
                        const diffKg = intake.weightDiffKg || 0;
                        const diffPercent = Math.abs(intake.weightDiffPercent !== undefined && intake.weightDiffPercent !== null
                          ? intake.weightDiffPercent
                          : (fieldWeight > 0 ? (diffKg / fieldWeight) * 100 : 0));

                        let statusColor = 'text-emerald-400 bg-emerald-500/10';
                        if (diffPercent > maxWeightTolerancePercent * 2) statusColor = 'text-red-400 bg-red-500/10';
                        else if (diffPercent > maxWeightTolerancePercent) statusColor = 'text-amber-400 bg-amber-500/10';

                        return (
                          <tr key={intake.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-sky-400">{receivingIdFormatted}</td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {new Date(intake.createdAt).toLocaleDateString()}{' '}
                              <span className="text-slate-500">{new Date(intake.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-300">{transportIdFormatted}</td>
                            <td className="p-3 font-bold text-white">
                              {transport.driverName || 'N/A'}
                              <div className="font-mono text-sky-400 text-[11px]">{transport.plateNumber || ''}</div>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-300">{fieldWeight.toFixed(2)} kg</td>
                            <td className="p-3 text-right font-mono font-black text-sky-400">{netWeight.toFixed(2)} kg</td>
                            <td className="p-3 text-right">
                              <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${statusColor}`}>
                                {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg ({diffPercent.toFixed(2)}%)
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {intake.grossScalePhotoUrl || intake.tareScalePhotoUrl ? (
                                <span className="text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1">
                                  <Camera className="w-3.5 h-3.5" /> 📸 Photos Attached
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">No Photos</span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedIntakeForDetails(intake)}
                                className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedIntakeForPrint(intake)}
                                className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                                title="Print Scale Receiving Report"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => exportSingleWarehouseTruckCSV(intake)}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                title="Export Truck Manifest CSV for Record-Keeping"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>
                              {transport.status !== 'VERIFIED' && transport.status !== 'DISBURSED' ? (
                                <button
                                  onClick={() => handleEditWarehouseIntake(intake)}
                                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                                  title="Edit Warehouse Receiving Record"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span
                                  className="p-1.5 text-slate-500 inline-block text-[11px]"
                                  title="Record Locked: Truck has already been verified or paid by Finance."
                                >
                                  🔒
                                </span>
                              )}
                              {currentUserRole === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteWarehouseIntake(intake.id, receivingIdFormatted)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                  title="Delete Warehouse Intake Record (Admin)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            MODULE 3: TRUCK-LEVEL FINANCE VERIFICATION
        ══════════════════════════════════════════════════ */}
        {activeModule === 'finance' && (currentUserRole === 'FINANCE' || currentUserRole === 'ADMIN') && (
          <div className="space-y-6">
            {/* DASHBOARD SUMMARY STATS (TOP OF PAGE) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 bg-[#141c2f] border border-amber-500/30 rounded-2xl space-y-1 shadow-lg">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Awaiting Verification
                </div>
                <div className="text-xl md:text-2xl font-black text-amber-400">{trucksAwaitingVerification} Trucks</div>
              </div>

              <div className="p-4 bg-[#141c2f] border border-emerald-500/30 rounded-2xl space-y-1 shadow-lg">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" /> Trucks Verified
                </div>
                <div className="text-xl md:text-2xl font-black text-emerald-400">{trucksVerified} Trucks</div>
              </div>

              <div className="p-4 bg-[#141c2f] border border-sky-500/30 rounded-2xl space-y-1 shadow-lg">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Trucks Fully Paid
                </div>
                <div className="text-xl md:text-2xl font-black text-sky-400">{trucksFullyPaid} Trucks</div>
              </div>

              <div className="p-4 bg-[#141c2f] border border-white/10 rounded-2xl space-y-1 shadow-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Farmers Paid</div>
                <div className="text-xl md:text-2xl font-black text-white">{totalFarmersPaidCount} Farmers</div>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-950/80 to-[#141c2f] border border-amber-500/50 rounded-2xl space-y-1 shadow-xl col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Total Disbursed (KHR)</div>
                <div className="text-lg md:text-xl font-black text-amber-400">{totalAmountPaidKHR.toLocaleString()} KHR</div>
              </div>
            </div>

            {/* TRUCK-LEVEL FINANCE VERIFICATION TABLE & HISTORY */}
            <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#f59e0b] flex items-center gap-2">
                    💳 Truck-Level Finance Reconciliation & Payment Verification ({filteredFinanceTrucks.length} Trucks)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verify weighbridge scale weights against field purchase totals per truck, review farmer bank profiles, and authorize bulk disbursements.
                  </p>
                </div>

                <button
                  onClick={exportFinanceTrucksCSV}
                  className="bg-[#f59e0b] hover:bg-amber-500 text-[#0b0f19] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 self-start md:self-auto"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Finance CSV Report
                </button>
              </div>

              {/* Search & Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 border border-white/10 rounded-xl p-3 text-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={finSearchQuery}
                    onChange={(e) => setFinSearchQuery(e.target.value)}
                    placeholder="Search Transport ID, Warehouse ID, Plate, Driver, Farmer..."
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <select
                    value={finStatusFilter}
                    onChange={(e) => setFinStatusFilter(e.target.value)}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="ALL">All Truck Statuses</option>
                    <option value="EN_ROUTE">🚛 En Route</option>
                    <option value="RECEIVED">🏬 Received at Warehouse / Awaiting Verification</option>
                    <option value="VERIFIED">🟢 Verified</option>
                    <option value="DISBURSED">💳 Payment Completed</option>
                  </select>
                </div>
              </div>

              {/* Searchable Truck-Level Finance Table */}
              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                    <tr>
                      <th className="p-3">Transport ID</th>
                      <th className="p-3">Warehouse ID</th>
                      <th className="p-3">Truck Driver & Plate</th>
                      <th className="p-3 text-center">Farmers / Invoices</th>
                      <th className="p-3 text-right">Field Weight</th>
                      <th className="p-3 text-right">Warehouse Net</th>
                      <th className="p-3 text-right">Weight Diff (+/- kg)</th>
                      <th className="p-3 text-right">Absolute Diff (ABS)</th>
                      <th className="p-3 text-center">Tolerance Status</th>
                      <th className="p-3 text-right">Total Net Payment</th>
                      <th className="p-3 text-center">Truck Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredFinanceTrucks.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-500 text-xs">
                          No trucks found matching your search. Complete field dispatch and warehouse receiving to verify trucks.
                        </td>
                      </tr>
                    ) : (
                      filteredFinanceTrucks.map((truckData) => {
                        const t = truckData.transport || {};
                        const intake = truckData.intake || {};
                        const trIdFormatted = `TR-2026-${t.id.slice(-6).toUpperCase()}`;
                        const wrIdFormatted = intake.id ? `WR-2026-${intake.id.slice(-6).toUpperCase()}` : 'Awaiting Intake';

                        const fieldWeight = truckData.fieldWeight || 0;
                        const netWeight = truckData.warehouseNetWeight || 0;
                        const diffKg = truckData.weightDiffKg !== undefined && truckData.weightDiffKg !== null ? truckData.weightDiffKg : (netWeight - fieldWeight);
                        const absDiffKg = Math.abs(diffKg);

                        let toleranceBadge = (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 justify-center">
                            <CheckCircle2 className="w-3 h-3" /> Within Tolerance ✓
                          </span>
                        );

                        if (absDiffKg > scaleToleranceWarning) {
                          toleranceBadge = (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 justify-center">
                              <XCircle className="w-3 h-3" /> Critical Exceeded
                            </span>
                          );
                        } else if (absDiffKg > scaleToleranceAcceptable) {
                          toleranceBadge = (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 justify-center">
                              <AlertTriangle className="w-3 h-3" /> Warning Exceeded
                            </span>
                          );
                        }

                        let statusBadge = (
                          <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 justify-center">
                            🚛 En Route
                          </span>
                        );

                        if (t.status === 'RECEIVED') {
                          statusBadge = (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 justify-center animate-pulse">
                              <Clock className="w-3 h-3" /> Awaiting Verification
                            </span>
                          );
                        } else if (t.status === 'VERIFIED') {
                          statusBadge = (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          );
                        } else if (t.status === 'DISBURSED') {
                          statusBadge = (
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 justify-center">
                              <CreditCard className="w-3 h-3" /> Payment Completed
                            </span>
                          );
                        }

                        return (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-sky-400">{trIdFormatted}</td>
                            <td className="p-3 font-mono font-bold text-purple-400">{wrIdFormatted}</td>
                            <td className="p-3 font-bold text-white">
                              {t.driverName}
                              <div className="font-mono text-sky-400 text-[11px]">{t.plateNumber}</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-bold text-emerald-400">{truckData.totalFarmersCount} Farmers</span>
                              <div className="text-[10px] text-slate-400">({truckData.purchases.length} Invoices)</div>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-200">{fieldWeight.toFixed(2)} kg</td>
                            <td className="p-3 text-right font-mono font-black text-sky-400">
                              {intake.id ? `${netWeight.toFixed(2)} kg` : 'Pending Intake'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold">
                              {intake.id ? (
                                <span className={diffKg >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                                  {diffKg >= 0 ? '+' : ''}{diffKg.toFixed(2)} kg
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">--</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-white">
                              {intake.id ? `${absDiffKg.toFixed(2)} kg` : '--'}
                            </td>
                            <td className="p-3 text-center">{intake.id ? toleranceBadge : <span className="text-slate-500 text-[10px]">--</span>}</td>
                            <td className="p-3 text-right font-mono font-black text-amber-400 text-sm">
                              {truckData.totalTruckNetPayment.toLocaleString()} KHR
                            </td>
                            <td className="p-3 text-center">{statusBadge}</td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedFinanceTruckForDetails(truckData)}
                                className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-colors"
                                title="View Truck Invoices & Scale Proof"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setSelectedFinanceTruckForPrint(truckData)}
                                className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                                title="Print Payment Authorization Report"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => exportSingleTruckCSV(truckData)}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                title="Export Truck Farmer Payment CSV for Bank Transfers"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>

                              {t.status === 'RECEIVED' && (
                                <button
                                  onClick={() => handleVerifyTruckFinance(t.id)}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-extrabold text-[10px]"
                                >
                                  Verify Truck
                                </button>
                              )}

                              {t.status === 'VERIFIED' && (
                                <button
                                  onClick={() => setPaymentModalTruck(truckData)}
                                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg font-extrabold text-[10px]"
                                >
                                  Process Payment
                                </button>
                              )}

                              {currentUserRole === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteTransportRecord(t.id, t.plateNumber)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                  title="Delete Transport Record (Admin)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            MODULE 4: ADMIN MASTER SETTINGS
        ══════════════════════════════════════════════════ */}
        {activeModule === 'admin' && currentUserRole === 'ADMIN' && (
          <div className="space-y-6">
            {/* Admin Sub-Tabs */}
            <div className="bg-[#141c2f] border border-white/10 rounded-xl p-1 grid grid-cols-2 sm:grid-cols-6 gap-1">
              <button
                onClick={() => setAdminTab('users')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  adminTab === 'users' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UsersIcon className="w-3.5 h-3.5" /> User Accounts ({userAccounts.length})
              </button>
              <button
                onClick={() => setAdminTab('villages')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  adminTab === 'villages' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Target Villages ({villages.length})
              </button>
              <button
                onClick={() => setAdminTab('banks')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  adminTab === 'banks' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" /> Commercial Banks ({banks.length})
              </button>
              <button
                onClick={() => setAdminTab('prices')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  adminTab === 'prices' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5" /> Paddy Varieties ({priceSpecs.length})
              </button>
              <button
                onClick={() => setAdminTab('tolerance')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  adminTab === 'tolerance' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scale className="w-3.5 h-3.5" /> Scale Tolerance (±{scaleToleranceAcceptable} kg)
              </button>
              <button
                onClick={() => setAdminTab('audit')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  adminTab === 'audit' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Audit Log ({auditLogs.length})
              </button>
            </div>

            {/* TAB 0: USER MANAGEMENT */}
            {adminTab === 'users' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create User Form */}
                <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                    <UserPlus className="w-4 h-4 text-purple-400" /> Create New User Account
                  </h3>

                  <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={uFullName}
                        onChange={(e) => setUFullName(e.target.value)}
                        placeholder="e.g. Heng Sok"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1">Username / Email *</label>
                      <input
                        type="text"
                        required
                        value={uUsername}
                        onChange={(e) => setUUsername(e.target.value)}
                        placeholder="e.g. heng.sok@ibisrice.com"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1">Initial Password *</label>
                      <input
                        type="text"
                        required
                        value={uPassword}
                        onChange={(e) => setUPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Assigned Role</label>
                        <select
                          value={uRole}
                          onChange={(e) => setURole(e.target.value as any)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white font-bold"
                        >
                          <option value="FIELD">🌾 Field Staff</option>
                          <option value="WAREHOUSE">🏬 Warehouse Staff</option>
                          <option value="FINANCE">💳 Finance Staff</option>
                          <option value="ADMIN">⚙️ System Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Initial Status</label>
                        <select
                          value={uStatus}
                          onChange={(e) => setUStatus(e.target.value as any)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white font-bold"
                        >
                          <option value="ACTIVE">🟢 Active</option>
                          <option value="INACTIVE">🔴 Inactive</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" /> Create System User Account
                    </button>
                  </form>
                </div>

                {/* Users List Table */}
                <div className="lg:col-span-2 bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-purple-400" /> Configured System User Accounts
                    </h3>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                      {userAccounts.length} Total Users
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                        <tr>
                          <th className="p-3">Full Name & Username</th>
                          <th className="p-3">Assigned Role</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3">Date Created</th>
                          <th className="p-3">Last Login</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {userAccounts.map((u) => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3">
                              <div className="font-extrabold text-white">{u.name}</div>
                              <div className="font-mono text-slate-400 text-[11px]">{u.email}</div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  u.role === 'ADMIN'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : u.role === 'FIELD'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : u.role === 'WAREHOUSE'
                                    ? 'bg-sky-500/20 text-sky-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {u.role === 'FIELD' ? '🌾 FIELD' : u.role === 'WAREHOUSE' ? '🏬 WAREHOUSE' : u.role === 'FINANCE' ? '💳 FINANCE' : '⚙️ ADMIN'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.status, u.name)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? '🟢 Active' : '🔴 Inactive'}
                              </button>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setEditingUserId(editingUserId === u.id ? null : u.id);
                                  setResetPassInput('');
                                }}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUserAccount(u.id, u.name)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                title="Delete User (Testing Only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Password Reset Popup Row */}
                              {editingUserId === u.id && (
                                <div className="mt-2 p-2 bg-[#1e293b] border border-amber-500/40 rounded-xl text-left space-y-2">
                                  <div className="text-[10px] font-bold text-amber-400">Reset password for {u.name}:</div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={resetPassInput}
                                      onChange={(e) => setResetPassInput(e.target.value)}
                                      placeholder="New password"
                                      className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                                    />
                                    <button
                                      onClick={() => handleResetUserPassword(u.id, u.name)}
                                      className="px-2 py-1 bg-amber-500 text-[#0b0f19] font-bold rounded-lg text-xs"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: VILLAGES CONFIGURATION */}
            {adminTab === 'villages' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                    <Plus className="w-4 h-4 text-purple-400" /> Add New Target Village
                  </h3>

                  <form onSubmit={handleAddVillage} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1">Village Name *</label>
                      <input
                        type="text"
                        required
                        value={newVillageName}
                        onChange={(e) => setNewVillageName(e.target.value)}
                        placeholder="e.g. Srayang"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1">District</label>
                      <input
                        type="text"
                        value={newVillageDistrict}
                        onChange={(e) => setNewVillageDistrict(e.target.value)}
                        placeholder="Chhaeb / Kulen"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-lg shadow-md"
                    >
                      Add Target Village to System
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-white/10 pb-3">
                    <span>Active Target Procurement Villages</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{villages.length} Villages</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto">
                    {villages.map((v) => (
                      <div key={v.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-purple-400" /> {v.name}
                          </div>
                          <div className="text-slate-400 text-[11px]">{v.district}, {v.province}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteVillage(v.id, v.name)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                          title="Remove Village"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMMERCIAL BANKS CONFIGURATION */}
            {adminTab === 'banks' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                    <Plus className="w-4 h-4 text-purple-400" /> Add New Commercial Bank
                  </h3>

                  <form onSubmit={handleAddBank} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1">Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="e.g. Phillip Bank"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1">Short Code</label>
                      <input
                        type="text"
                        value={newBankCode}
                        onChange={(e) => setNewBankCode(e.target.value)}
                        placeholder="e.g. KHM"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-lg shadow-md"
                    >
                      Add Commercial Bank to System
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-white/10 pb-3">
                    <span>Configured Commercial Banks</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{banks.length} Banks</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto">
                    {banks.map((b) => (
                      <div key={b.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5 text-sky-400" /> {b.name}
                          </div>
                          {b.code && <div className="text-slate-400 text-[11px]">Code: {b.code}</div>}
                        </div>
                        <button
                          onClick={() => handleDeleteBank(b.id, b.name)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                          title="Remove Bank"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PADDY VARIETIES & PRICE SPECS */}
            {adminTab === 'prices' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                    <Plus className="w-4 h-4 text-purple-400" /> Add / Update Variety Pricing
                  </h3>

                  <form onSubmit={handleAddPriceSpec} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1">Paddy Variety Name *</label>
                      <input
                        type="text"
                        required
                        value={newSpecVariety}
                        onChange={(e) => setNewSpecVariety(e.target.value)}
                        placeholder="e.g. Phka Rumduol"
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2.5 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Grade</label>
                        <select
                          value={newSpecGrade}
                          onChange={(e) => setNewSpecGrade(e.target.value)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white"
                        >
                          <option>A1</option>
                          <option>A2</option>
                          <option>B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">Base Price (KHR/kg)</label>
                        <input
                          type="number"
                          required
                          value={newSpecBasePrice}
                          onChange={(e) => setNewSpecBasePrice(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Organic Bonus</label>
                        <input
                          type="number"
                          value={newSpecOrganicBonus}
                          onChange={(e) => setNewSpecOrganicBonus(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Max Moisture %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newSpecMaxMoisture}
                          onChange={(e) => setNewSpecMaxMoisture(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Max Foreign %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newSpecMaxForeign}
                          onChange={(e) => setNewSpecMaxForeign(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-lg shadow-md"
                    >
                      Save Variety Price Specification
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-white/10 pb-3">
                    <span>Active Season Paddy Specifications & Prices</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{priceSpecs.length} Varieties</span>
                  </h3>

                  <div className="overflow-x-auto border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                        <tr>
                          <th className="p-2.5">Paddy Variety</th>
                          <th className="p-2.5">Grade</th>
                          <th className="p-2.5 text-right">Base Price</th>
                          <th className="p-2.5 text-right">Organic Bonus</th>
                          <th className="p-2.5 text-center">Max Moisture</th>
                          <th className="p-2.5 text-center">Max Foreign</th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {priceSpecs.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5">
                            <td className="p-2.5 font-bold text-white">{s.variety}</td>
                            <td className="p-2.5 font-extrabold text-purple-400">{s.grade}</td>
                            <td className="p-2.5 text-right font-bold text-amber-400">{s.basePrice.toLocaleString()} KHR</td>
                            <td className="p-2.5 text-right font-bold text-emerald-400">+{s.organicBonus} KHR</td>
                            <td className="p-2.5 text-center">{s.maxMoisture}%</td>
                            <td className="p-2.5 text-center">{s.maxForeignMatter}%</td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => handleDeletePriceSpec(s.id, s.variety, s.grade)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CONFIGURABLE SCALE TOLERANCE */}
            {adminTab === 'tolerance' && (
              <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-extrabold text-purple-400 flex items-center gap-2">
                    <Scale className="w-4 h-4" /> Scale Tolerance & Weighbridge Reconcile Configuration
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure operational scale weight tolerance thresholds based on ABS(Warehouse Net Weight - Total Field Weight).
                  </p>
                </div>

                <form onSubmit={handleSaveScaleToleranceConfig} className="space-y-6 max-w-2xl text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Acceptable Tolerance (±kg) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={scaleToleranceAcceptable}
                        onChange={(e) => setScaleToleranceAcceptable(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 text-emerald-400 font-black text-sm"
                        placeholder="300"
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Default: 300 kg (ABS ≤ 300 kg → 🟢 Acceptable)
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Warning Threshold (±kg) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={scaleToleranceWarning}
                        onChange={(e) => setScaleToleranceWarning(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 text-amber-400 font-black text-sm"
                        placeholder="500"
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Default: 500 kg (301 - 500 kg → 🟡 Warning)
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Critical Threshold (±kg) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={scaleToleranceCritical}
                        onChange={(e) => setScaleToleranceCritical(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 text-red-400 font-black text-sm"
                        placeholder="500"
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Default: Above 500 kg (ABS &gt; 500 kg → 🔴 Critical)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                    <div className="font-extrabold text-xs text-white uppercase tracking-wider">
                      Operational Status Preview
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-extrabold text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        🟢 Green (ABS ≤ {scaleToleranceAcceptable} kg): Within Tolerance ✓
                      </div>
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 font-extrabold text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        🟡 Yellow ({scaleToleranceAcceptable + 1} - {scaleToleranceWarning} kg): Warning Exceeded
                      </div>
                      <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-extrabold text-[11px] flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        🔴 Red (ABS &gt; {scaleToleranceWarning} kg): Critical Exceeded
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Scale Tolerance Configuration
                  </button>
                </form>
              </div>
            )}

            {/* TAB 5: AUDIT LOGS */}
            {adminTab === 'audit' && (
              <div className="bg-[#141c2f] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-purple-400 border-b border-white/10 pb-3">
                  🛡️ Enterprise Security & Admin Configuration Audit Logs
                </h3>

                <div className="space-y-3 max-h-[500px] overflow-y-auto font-mono text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-bold text-purple-400">[{log.action}] {log.entityType}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-white">User: <strong>{log.userName}</strong> ({log.userRole})</div>
                      {log.details && <div className="text-slate-400 text-[11px] break-all">{log.details}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
