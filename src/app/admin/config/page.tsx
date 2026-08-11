'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: string })?.role;

  const [activeTab, setActiveTab] = useState<'master' | 'locations' | 'banks' | 'system' | 'users'>('master');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Settings State
  const [seedInterestRate, setSeedInterestRate] = useState<number>(1.10);
  const [scaleTolerancePercent, setScaleTolerancePercent] = useState<number>(1.5);
  const [orgName, setOrgName] = useState<string>('IBIS RICE Cambodia');
  const [defaultCurrency, setDefaultCurrency] = useState<string>('KHR');
  const [measurementUnit, setMeasurementUnit] = useState<string>('kg');
  const [offlineSyncDays, setOfflineSyncDays] = useState<number>(30);

  // Master Data Lists
  const [paddySpecs, setPaddySpecs] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Modal / Editing States
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [editingSpec, setEditingSpec] = useState<any | null>(null);
  const [specForm, setSpecForm] = useState({
    variety: 'Phka Rumduol',
    grade: 'A1',
    basePrice: 1650,
    maxMoisture: 14.0,
    maxForeignMatter: 5.0,
    minWholeGrain: 70.0,
    maxBrokenRice: 30.0,
    status: 'ACTIVE',
  });

  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any | null>(null);
  const [locForm, setLocForm] = useState({
    name: '',
    type: 'BUYING_STATION',
    code: '',
    address: '',
    status: 'ACTIVE',
  });

  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<any | null>(null);
  const [bankForm, setBankForm] = useState({ name: '', code: '', status: 'ACTIVE' });

  const [showVillageModal, setShowVillageModal] = useState(false);
  const [editingVillage, setEditingVillage] = useState<any | null>(null);
  const [villageForm, setVillageForm] = useState({ name: '', code: '', district: 'Chhaeb', province: 'Preah Vihear', status: 'ACTIVE' });

  // User Management Form State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FIELD',
    status: 'ACTIVE',
    assignedProvinces: ['Preah Vihear'],
  });

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ show: false, title: '', description: '', onConfirm: () => {} });

  const availableProvinces = ['Preah Vihear', 'Stung Treng', 'Ratanakiri', 'Mondulkiri'];

  useEffect(() => {
    fetchConfig();
    fetchUsers();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSeedInterestRate(data.settings.seedInterestRate ?? 1.10);
          setScaleTolerancePercent(data.settings.scaleTolerancePercent ?? 1.5);
          setOrgName(data.settings.orgName ?? 'IBIS RICE Cambodia');
          setDefaultCurrency(data.settings.defaultCurrency ?? 'KHR');
          setMeasurementUnit(data.settings.measurementUnit ?? 'kg');
          setOfflineSyncDays(data.settings.offlineSyncPeriodDays ?? 30);
        }
        if (data.paddySpecs) setPaddySpecs(data.paddySpecs);
        if (data.rawVillages || data.allVillages) setVillages(data.allVillages || data.rawVillages);
        if (data.rawBanks) setBanks(data.rawBanks);
        if (data.locations) setLocations(data.locations);
      }
    } catch (e) {
      console.error('Failed to load config:', e);
      showMessage('❌ Error loading configuration data from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        showMessage(`✅ System parameter "${key}" saved directly to database!`, 'success');
      } else {
        showMessage('❌ Failed to update system parameter.', 'error');
      }
    } catch (e) {
      showMessage('❌ Error saving system parameter.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- CRUD: PADDY PRICE SPECS ---
  const handleOpenSpecModal = (spec?: any) => {
    if (spec) {
      setEditingSpec(spec);
      setSpecForm({
        variety: spec.variety,
        grade: spec.grade,
        basePrice: spec.basePrice,
        maxMoisture: spec.maxMoisture,
        maxForeignMatter: spec.maxForeignMatter,
        minWholeGrain: spec.minWholeGrain ?? 70.0,
        maxBrokenRice: spec.maxBrokenRice ?? 30.0,
        status: spec.status || 'ACTIVE',
      });
    } else {
      setEditingSpec(null);
      setSpecForm({
        variety: 'Phka Rumduol',
        grade: 'A1',
        basePrice: 1650,
        maxMoisture: 14.0,
        maxForeignMatter: 5.0,
        minWholeGrain: 70.0,
        maxBrokenRice: 30.0,
        status: 'ACTIVE',
      });
    }
    setShowSpecModal(true);
  };

  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...specForm, id: editingSpec?.id };
      const res = await fetch('/api/admin/price-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showMessage(editingSpec ? '✅ Paddy Spec updated successfully!' : '✅ New Paddy Spec added!', 'success');
        setShowSpecModal(false);
        fetchConfig();
      } else {
        const err = await res.json();
        showMessage(`❌ ${err.error || 'Failed to save spec.'}`, 'error');
      }
    } catch (e) {
      showMessage('❌ Error saving spec.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpec = (spec: any) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Paddy Price Specification',
      description: `Are you sure you want to delete "${spec.variety} (${spec.grade})"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/price-specs?id=${spec.id}`, { method: 'DELETE' });
          if (res.ok) {
            showMessage('✅ Price spec deleted.', 'success');
            fetchConfig();
          } else {
            showMessage('❌ Failed to delete price spec.', 'error');
          }
        } catch (e) {
          showMessage('❌ Error deleting price spec.', 'error');
        }
        setDeleteConfirm((prev) => ({ ...prev, show: false }));
      },
    });
  };

  // --- CRUD: LOCATIONS ---
  const handleOpenLocModal = (loc?: any) => {
    if (loc) {
      setEditingLoc(loc);
      setLocForm({
        name: loc.name,
        type: loc.type,
        code: loc.code || '',
        address: loc.address || '',
        status: loc.status || 'ACTIVE',
      });
    } else {
      setEditingLoc(null);
      setLocForm({ name: '', type: 'BUYING_STATION', code: '', address: '', status: 'ACTIVE' });
    }
    setShowLocModal(true);
  };

  const handleSaveLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...locForm, id: editingLoc?.id };
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showMessage(editingLoc ? '✅ Location updated!' : '✅ New Location added!', 'success');
        setShowLocModal(false);
        fetchConfig();
      } else {
        showMessage('❌ Failed to save location.', 'error');
      }
    } catch (e) {
      showMessage('❌ Error saving location.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLoc = (loc: any) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Location Registry',
      description: `Are you sure you want to delete "${loc.name}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/locations?id=${loc.id}`, { method: 'DELETE' });
          if (res.ok) {
            showMessage('✅ Location deleted.', 'success');
            fetchConfig();
          } else {
            showMessage('❌ Failed to delete location.', 'error');
          }
        } catch (e) {
          showMessage('❌ Error deleting location.', 'error');
        }
        setDeleteConfirm((prev) => ({ ...prev, show: false }));
      },
    });
  };

  // --- CRUD: BANKS ---
  const handleOpenBankModal = (bank?: any) => {
    if (bank) {
      setEditingBank(bank);
      setBankForm({ name: bank.name, code: bank.code || '', status: bank.status || 'ACTIVE' });
    } else {
      setEditingBank(null);
      setBankForm({ name: '', code: '', status: 'ACTIVE' });
    }
    setShowBankModal(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...bankForm, id: editingBank?.id };
      const res = await fetch('/api/admin/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showMessage(editingBank ? '✅ Bank updated!' : '✅ New Bank added!', 'success');
        setShowBankModal(false);
        fetchConfig();
      } else {
        showMessage('❌ Failed to save bank.', 'error');
      }
    } catch (e) {
      showMessage('❌ Error saving bank.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBank = (bank: any) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Commercial Bank',
      description: `Are you sure you want to delete bank "${bank.name}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/banks?id=${bank.id}`, { method: 'DELETE' });
          if (res.ok) {
            showMessage('✅ Bank deleted.', 'success');
            fetchConfig();
          } else {
            showMessage('❌ Failed to delete bank.', 'error');
          }
        } catch (e) {
          showMessage('❌ Error deleting bank.', 'error');
        }
        setDeleteConfirm((prev) => ({ ...prev, show: false }));
      },
    });
  };

  // --- CRUD: VILLAGES ---
  const handleOpenVillageModal = (village?: any) => {
    if (village) {
      setEditingVillage(village);
      setVillageForm({
        name: village.name,
        code: village.code || '',
        district: village.district || 'Chhaeb',
        province: village.province || 'Preah Vihear',
        status: village.status || 'ACTIVE',
      });
    } else {
      setEditingVillage(null);
      setVillageForm({ name: '', code: '', district: 'Chhaeb', province: 'Preah Vihear', status: 'ACTIVE' });
    }
    setShowVillageModal(true);
  };

  const handleSaveVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...villageForm, id: editingVillage?.id };
      const res = await fetch('/api/admin/villages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showMessage(editingVillage ? '✅ Village updated!' : '✅ New Village added!', 'success');
        setShowVillageModal(false);
        fetchConfig();
      } else {
        showMessage('❌ Failed to save village.', 'error');
      }
    } catch (e) {
      showMessage('❌ Error saving village.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVillage = (village: any) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Registered Village',
      description: `Are you sure you want to delete village "${village.name}" (${village.province})?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/villages?id=${village.id}`, { method: 'DELETE' });
          if (res.ok) {
            showMessage('✅ Village deleted.', 'success');
            fetchConfig();
          } else {
            showMessage('❌ Failed to delete village.', 'error');
          }
        } catch (e) {
          showMessage('❌ Error deleting village.', 'error');
        }
        setDeleteConfirm((prev) => ({ ...prev, show: false }));
      },
    });
  };

  // --- CRUD: USERS & PROVINCE ASSIGNMENTS ---
  const handleOpenUserModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      const provs = user.assignedProvinces
        ? user.assignedProvinces.split(',').map((p: string) => p.trim())
        : ['Preah Vihear'];
      setUserForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role || 'FIELD',
        status: user.status || 'ACTIVE',
        assignedProvinces: provs,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'FIELD',
        status: 'ACTIVE',
        assignedProvinces: ['Preah Vihear'],
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });

      if (res.ok) {
        showMessage(editingUser ? '✅ User updated & province assignment saved!' : '✅ New User created!', 'success');
        setShowUserModal(false);
        fetchUsers();
      } else {
        const err = await res.json();
        showMessage(`❌ ${err.error || 'Failed to save user account.'}`, 'error');
      }
    } catch (e) {
      showMessage('❌ Error saving user account.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (user: any) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete User Account',
      description: `Are you sure you want to delete user account "${user.name}" (${user.email})?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
          if (res.ok) {
            showMessage('✅ User account deleted.', 'success');
            fetchUsers();
          } else {
            const err = await res.json();
            showMessage(`❌ ${err.error || 'Failed to delete user.'}`, 'error');
          }
        } catch (e) {
          showMessage('❌ Error deleting user.', 'error');
        }
        setDeleteConfirm((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const toggleProvinceSelection = (prov: string) => {
    setUserForm((prev) => {
      const exists = prev.assignedProvinces.includes(prov);
      if (exists) {
        return { ...prev, assignedProvinces: prev.assignedProvinces.filter((p) => p !== prov) };
      } else {
        return { ...prev, assignedProvinces: [...prev.assignedProvinces, prov] };
      }
    });
  };

  if (status === 'loading') {
    return (
      <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#0F172A', color: '#94A3B8', minHeight: '100vh' }}>
        Verifying System Admin authorization...
      </div>
    );
  }

  if (userRole !== 'ADMIN') {
    return (
      <div style={{ padding: '40px 20px', backgroundColor: '#0F172A', color: '#FFF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '32px', backgroundColor: '#1E293B', border: '1px solid #EF4444', borderRadius: '16px', maxWidth: '450px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F87171', marginBottom: '8px' }}>Access Restricted — System Admin Only</h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>
            Your account ({session?.user?.name || 'User'} · <strong>{userRole || 'FIELD'}</strong>) does not have authorization to view or edit System Master Configuration settings.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{ padding: '12px 24px', backgroundColor: '#10B981', color: '#0F172A', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Return to Operations Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#0F172A', color: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B', margin: 0 }}>⚙️ Administration & Master Configuration</h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
              Central administration panel for purchasing prices, user accounts, province assignments, locations, banking options, and villages.
            </p>
          </div>
          <button
            onClick={() => {
              fetchConfig();
              fetchUsers();
            }}
            style={{ padding: '10px 18px', backgroundColor: '#1E293B', color: '#38BDF8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            🔄 Refresh Settings
          </button>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div style={{ padding: '12px 16px', backgroundColor: message.type === 'success' ? '#065F46' : '#7F1D1D', color: '#FFFFFF', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { id: 'master', label: '🌾 Master Data & Thresholds' },
            { id: 'locations', label: '📍 Stations & Warehouses' },
            { id: 'banks', label: '💳 Commercial Banks & Villages' },
            { id: 'users', label: '👥 User & Field Staff Management' },
            { id: 'system', label: '🏢 System Info & Currency' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 18px',
                backgroundColor: activeTab === tab.id ? '#1E293B' : 'transparent',
                color: activeTab === tab.id ? '#F59E0B' : '#94A3B8',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #F59E0B' : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Loading master configuration data from database...</div>
        ) : (
          <div>
            {/* TAB 1: MASTER DATA & THRESHOLDS */}
            {activeTab === 'master' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Seed & Scale Settings */}
                <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981', marginBottom: '16px' }}>💰 Seed Return & Scale Tolerance Thresholds</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #334155' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Seed Repayment Interest Multiplier</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={seedInterestRate}
                          onChange={(e) => setSeedInterestRate(parseFloat(e.target.value) || 1.10)}
                          style={{ width: '100%', padding: '8px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}
                        />
                        <button
                          onClick={() => handleSaveSetting('seedInterestRate', seedInterestRate)}
                          disabled={saving}
                          style={{ padding: '8px 16px', backgroundColor: '#10B981', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                      </div>
                      <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>Current: 1.10 = 10% Interest charged on seed repayment.</p>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #334155' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Scale Discrepancy Tolerance (%)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={scaleTolerancePercent}
                          onChange={(e) => setScaleTolerancePercent(parseFloat(e.target.value) || 1.5)}
                          style={{ width: '100%', padding: '8px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}
                        />
                        <button
                          onClick={() => handleSaveSetting('scaleTolerancePercent', scaleTolerancePercent)}
                          disabled={saving}
                          style={{ padding: '8px 16px', backgroundColor: '#10B981', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                      </div>
                      <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>Current: 1.5% max weight difference between field total and mill intake.</p>
                    </div>
                  </div>
                </div>

                {/* Paddy Price Specifications */}
                <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F59E0B', margin: 0 }}>🌾 Master Paddy Varieties & Quality Price Specifications</h3>
                    <button
                      onClick={() => handleOpenSpecModal()}
                      style={{ padding: '8px 14px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                    >
                      + Add New Price Spec
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                          <th style={{ padding: '10px' }}>Variety</th>
                          <th style={{ padding: '10px' }}>Grade</th>
                          <th style={{ padding: '10px' }}>Base Price (KHR/kg)</th>
                          <th style={{ padding: '10px' }}>Max Moisture %</th>
                          <th style={{ padding: '10px' }}>Max Foreign Matter %</th>
                          <th style={{ padding: '10px' }}>Status</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paddySpecs.map((spec) => (
                          <tr key={spec.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#FFF' }}>{spec.variety}</td>
                            <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', backgroundColor: '#3B82F620', color: '#60A5FA', borderRadius: '4px', fontWeight: 'bold' }}>{spec.grade}</span></td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#F59E0B' }}>{spec.basePrice?.toLocaleString()} KHR</td>
                            <td style={{ padding: '10px' }}>{spec.maxMoisture}%</td>
                            <td style={{ padding: '10px' }}>{spec.maxForeignMatter}%</td>
                            <td style={{ padding: '10px' }}><span style={{ color: spec.status === 'ACTIVE' ? '#34D399' : '#F87171', fontWeight: 'bold' }}>{spec.status}</span></td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>
                              <button onClick={() => handleOpenSpecModal(spec)} style={{ padding: '4px 10px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>Edit</button>
                              <button onClick={() => handleDeleteSpec(spec)} style={{ padding: '4px 10px', backgroundColor: '#7F1D1D', color: '#F87171', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STATIONS & WAREHOUSES */}
            {activeTab === 'locations' && (
              <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#38BDF8', margin: 0 }}>📍 Buying Stations & Destination Warehouses</h3>
                  <button
                    onClick={() => handleOpenLocModal()}
                    style={{ padding: '8px 14px', backgroundColor: '#38BDF8', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add New Location
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px' }}>Location Name</th>
                        <th style={{ padding: '10px' }}>Type</th>
                        <th style={{ padding: '10px' }}>Code</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((loc) => (
                        <tr key={loc.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#FFF' }}>{loc.name}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ padding: '2px 8px', backgroundColor: loc.type === 'WAREHOUSE' ? '#8B5CF620' : '#10B98120', color: loc.type === 'WAREHOUSE' ? '#C084FC' : '#34D399', borderRadius: '4px', fontWeight: 'bold' }}>
                              {loc.type === 'WAREHOUSE' ? 'Central Warehouse' : 'Buying Station'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: '#94A3B8' }}>{loc.code || '—'}</td>
                          <td style={{ padding: '10px' }}><span style={{ color: loc.status === 'ACTIVE' ? '#34D399' : '#F87171', fontWeight: 'bold' }}>{loc.status}</span></td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <button onClick={() => handleOpenLocModal(loc)} style={{ padding: '4px 10px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>Edit</button>
                            <button onClick={() => handleDeleteLoc(loc)} style={{ padding: '4px 10px', backgroundColor: '#7F1D1D', color: '#F87171', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: BANKS & VILLAGES */}
            {activeTab === 'banks' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                {/* Villages Card */}
                <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981', margin: 0 }}>🏡 Registered Target Villages</h3>
                    <button
                      onClick={() => handleOpenVillageModal()}
                      style={{ padding: '6px 12px', backgroundColor: '#10B981', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                    >
                      + Add Village
                    </button>
                  </div>

                  <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Village Name</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Province</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {villages.map((v) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px', color: '#FFF', fontWeight: 'bold' }}>{v.name}</td>
                            <td style={{ padding: '8px', color: '#38BDF8' }}>{v.province || 'Preah Vihear'}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              <button onClick={() => handleOpenVillageModal(v)} style={{ padding: '3px 8px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                              <button onClick={() => handleDeleteVillage(v)} style={{ padding: '3px 8px', backgroundColor: '#7F1D1D', color: '#F87171', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Banks Card */}
                <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#38BDF8', margin: 0 }}>💳 Commercial Banks</h3>
                    <button
                      onClick={() => handleOpenBankModal()}
                      style={{ padding: '6px 12px', backgroundColor: '#38BDF8', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                    >
                      + Add Bank
                    </button>
                  </div>

                  <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Bank Name</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Code</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {banks.map((b) => (
                          <tr key={b.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px', color: '#FFF', fontWeight: 'bold' }}>{b.name}</td>
                            <td style={{ padding: '8px', color: '#94A3B8' }}>{b.code || '—'}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              <button onClick={() => handleOpenBankModal(b)} style={{ padding: '3px 8px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                              <button onClick={() => handleDeleteBank(b)} style={{ padding: '3px 8px', backgroundColor: '#7F1D1D', color: '#F87171', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: USER & FIELD STAFF MANAGEMENT */}
            {activeTab === 'users' && (
              <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F59E0B', margin: 0 }}>👥 User Accounts & Field Staff Province Assignments</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Manage 24 field staff and assign specific provinces to restrict inspector village lists.</p>
                  </div>
                  <button
                    onClick={() => handleOpenUserModal()}
                    style={{ padding: '8px 14px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add New User Account
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px' }}>Full Name</th>
                        <th style={{ padding: '10px' }}>Email / Username</th>
                        <th style={{ padding: '10px' }}>Role</th>
                        <th style={{ padding: '10px' }}>Assigned Provinces</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#FFF' }}>{u.name}</td>
                          <td style={{ padding: '10px', color: '#38BDF8' }}>{u.email}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ padding: '2px 8px', backgroundColor: u.role === 'ADMIN' ? '#EF444420' : u.role === 'FIELD' ? '#10B98120' : '#F59E0B20', color: u.role === 'ADMIN' ? '#F87171' : u.role === 'FIELD' ? '#34D399' : '#FBBF24', borderRadius: '4px', fontWeight: 'bold' }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '10px' }}>
                            {u.assignedProvinces ? (
                              <span style={{ color: '#C084FC', fontWeight: 'bold' }}>{u.assignedProvinces}</span>
                            ) : (
                              <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>All Provinces</span>
                            )}
                          </td>
                          <td style={{ padding: '10px' }}><span style={{ color: u.status === 'ACTIVE' ? '#34D399' : '#F87171', fontWeight: 'bold' }}>{u.status}</span></td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <button onClick={() => handleOpenUserModal(u)} style={{ padding: '4px 10px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>Edit / Reassign</button>
                            <button onClick={() => handleDeleteUser(u)} style={{ padding: '4px 10px', backgroundColor: '#7F1D1D', color: '#F87171', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: SYSTEM INFO & CURRENCY */}
            {activeTab === 'system' && (
              <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#EC4899', marginBottom: '16px' }}>🏢 System Organization & Parameters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #334155' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Organization Name</label>
                    <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#FFF', borderRadius: '6px', fontWeight: 'bold' }} />
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #334155' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Default Currency Symbol</label>
                    <input type="text" value={defaultCurrency} readOnly style={{ width: '100%', padding: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#F59E0B', borderRadius: '6px', fontWeight: 'bold' }} />
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #334155' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Weight Unit</label>
                    <input type="text" value={measurementUnit} readOnly style={{ width: '100%', padding: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#10B981', borderRadius: '6px', fontWeight: 'bold' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: Price Spec Form */}
        {showSpecModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '450px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#F59E0B', margin: '0 0 16px 0' }}>{editingSpec ? 'Edit Paddy Price Spec' : 'Add New Paddy Price Spec'}</h3>
              <form onSubmit={handleSaveSpec}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Paddy Variety *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phka Rumduol"
                    value={specForm.variety}
                    onChange={(e) => setSpecForm({ ...specForm, variety: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Grade *</label>
                    <select
                      value={specForm.grade}
                      onChange={(e) => setSpecForm({ ...specForm, grade: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Base Price (KHR/kg) *</label>
                    <input
                      type="number"
                      required
                      value={specForm.basePrice}
                      onChange={(e) => setSpecForm({ ...specForm, basePrice: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowSpecModal(false)} style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Spec</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Location Form */}
        {showLocModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '450px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#38BDF8', margin: '0 0 16px 0' }}>{editingLoc ? 'Edit Location' : 'Add New Location Registry'}</h3>
              <form onSubmit={handleSaveLoc}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Location Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CACC (KPT)"
                    value={locForm.name}
                    onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Location Type *</label>
                  <select
                    value={locForm.type}
                    onChange={(e) => setLocForm({ ...locForm, type: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  >
                    <option value="BUYING_STATION">Buying Station (Field Loading)</option>
                    <option value="WAREHOUSE">Central Destination Warehouse</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowLocModal(false)} style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#38BDF8', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Location</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Bank Form */}
        {showBankModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#38BDF8', margin: '0 0 16px 0' }}>{editingBank ? 'Edit Commercial Bank' : 'Add Commercial Bank'}</h3>
              <form onSubmit={handleSaveBank}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACLEDA Bank"
                    value={bankForm.name}
                    onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowBankModal(false)} style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#38BDF8', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Bank</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Village Form with Province Selection */}
        {showVillageModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#10B981', margin: '0 0 16px 0' }}>{editingVillage ? 'Edit Registered Village' : 'Add Target Village'}</h3>
              <form onSubmit={handleSaveVillage}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Village Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sangkae"
                    value={villageForm.name}
                    onChange={(e) => setVillageForm({ ...villageForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Province *</label>
                  <select
                    value={villageForm.province}
                    onChange={(e) => setVillageForm({ ...villageForm, province: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  >
                    {availableProvinces.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>District</label>
                  <input
                    type="text"
                    value={villageForm.district}
                    onChange={(e) => setVillageForm({ ...villageForm, district: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowVillageModal(false)} style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#10B981', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Village</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: User & Field Staff Province Assignment Form */}
        {showUserModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '480px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#F59E0B', margin: '0 0 16px 0' }}>{editingUser ? 'Edit Staff Account & Provinces' : 'Add New Staff Account'}</h3>
              <form onSubmit={handleSaveUser}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sokha Inspector"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Username / Email *</label>
                    <input
                      type="text"
                      required
                      placeholder="field1@ibisrice.org"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Password {editingUser ? '(Leave blank to keep)' : '*'}</label>
                    <input
                      type="password"
                      required={!editingUser}
                      placeholder={editingUser ? '••••••••' : 'Password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Role *</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    >
                      <option value="FIELD">FIELD (Inspector)</option>
                      <option value="WAREHOUSE">WAREHOUSE (Scale Operator)</option>
                      <option value="FINANCE">FINANCE (Treasury)</option>
                      <option value="ADMIN">ADMIN (Full Access)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Account Status</label>
                    <select
                      value={userForm.status}
                      onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* Assigned Provinces Section */}
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #334155' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#F59E0B', fontWeight: 'bold', marginBottom: '6px' }}>
                    📍 Assigned Provinces for Inspector Village Filter:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {availableProvinces.map((prov) => {
                      const checked = userForm.assignedProvinces.includes(prov);
                      return (
                        <label key={prov} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#FFF', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProvinceSelection(prov)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{prov}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowUserModal(false)} style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRMATION DIALOG FOR DELETE */}
        {deleteConfirm.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '420px', border: '1px solid #7F1D1D' }}>
              <h3 style={{ color: '#EF4444', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>⚠️ {deleteConfirm.title}</h3>
              <p style={{ color: '#F8FAFC', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>{deleteConfirm.description}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setDeleteConfirm((prev) => ({ ...prev, show: false }))}
                  style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteConfirm.onConfirm}
                  style={{ padding: '8px 16px', backgroundColor: '#DC2626', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
