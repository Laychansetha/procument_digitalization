'use client';

import React, { useState, useEffect } from 'react';

export default function AdminConfigPage() {
  const [activeTab, setActiveTab] = useState<'master' | 'locations' | 'banks' | 'system'>('master');
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

  // Modal / Editing States
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [editingSpec, setEditingSpec] = useState<any | null>(null);
  const [specForm, setSpecForm] = useState({
    variety: 'Phka Rumduol',
    grade: 'A1',
    basePrice: 1750,
    organicBonus: 100,
    maxMoisture: 14.0,
    maxForeignMatter: 5.0,
    minWholeGrain: 75.0,
    maxBrokenRice: 25.0,
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

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ show: false, title: '', description: '', onConfirm: () => {} });

  useEffect(() => {
    fetchConfig();
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
        if (data.rawVillages) setVillages(data.rawVillages);
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
        organicBonus: spec.organicBonus,
        maxMoisture: spec.maxMoisture,
        maxForeignMatter: spec.maxForeignMatter,
        minWholeGrain: spec.minWholeGrain ?? 75.0,
        maxBrokenRice: spec.maxBrokenRice ?? 25.0,
        status: spec.status || 'ACTIVE',
      });
    } else {
      setEditingSpec(null);
      setSpecForm({
        variety: '',
        grade: 'A1',
        basePrice: 1750,
        organicBonus: 100,
        maxMoisture: 14.0,
        maxForeignMatter: 5.0,
        minWholeGrain: 75.0,
        maxBrokenRice: 25.0,
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

  // --- CRUD: LOCATIONS & WAREHOUSES ---
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
      description: `Are you sure you want to delete location "${loc.name}"?`,
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

  // --- CRUD: COMMERCIAL BANKS ---
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
      description: `Are you sure you want to delete village "${village.name}"?`,
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#0F172A', color: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B', margin: 0 }}>⚙️ Administration & Master Configuration</h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
              Central administration panel for purchasing prices, seed interest rates, locations, banking options, and villages.
            </p>
          </div>
          <button
            onClick={fetchConfig}
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
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', marginBottom: '20px' }}>
          {[
            { id: 'master', label: '🌾 Master Data & Thresholds' },
            { id: 'locations', label: '📍 Stations & Warehouses' },
            { id: 'banks', label: '💳 Commercial Banks & Villages' },
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Seed Return Multiplier (Interest Rate)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={seedInterestRate}
                          onChange={(e) => setSeedInterestRate(parseFloat(e.target.value) || 1.10)}
                          style={{ width: '100%', padding: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                        />
                        <button
                          onClick={() => handleSaveSetting('seedInterestRate', seedInterestRate)}
                          style={{ padding: '10px 18px', backgroundColor: '#10B981', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                        1.10 = 10% Interest Rate (e.g. 10 kg borrowed seed → 11 kg returned)
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Max Scale Intake Variance Tolerance (%)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={scaleTolerancePercent}
                          onChange={(e) => setScaleTolerancePercent(parseFloat(e.target.value) || 1.5)}
                          style={{ width: '100%', padding: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                        />
                        <button
                          onClick={() => handleSaveSetting('scaleTolerancePercent', scaleTolerancePercent)}
                          style={{ padding: '10px 18px', backgroundColor: '#10B981', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                        Alerts warehouse if intake weight differs by more than {scaleTolerancePercent}% from field weight.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Paddy Specs Table */}
                <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F59E0B', margin: 0 }}>🌾 Master Paddy Varieties & Quality Price Specifications</h3>
                    <button
                      onClick={() => handleOpenSpecModal()}
                      style={{ padding: '8px 16px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                    >
                      + Add New Paddy Price Spec
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Variety</th>
                        <th style={{ padding: '12px' }}>Grade</th>
                        <th style={{ padding: '12px' }}>Base Price (KHR/kg)</th>
                        <th style={{ padding: '12px' }}>Organic Bonus (KHR)</th>
                        <th style={{ padding: '12px' }}>Max Moisture</th>
                        <th style={{ padding: '12px' }}>Max Foreign Matter</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paddySpecs.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#10B981' }}>{item.variety}</td>
                          <td style={{ padding: '12px' }}>{item.grade}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#38BDF8' }}>{item.basePrice} KHR</td>
                          <td style={{ padding: '12px' }}>+{item.organicBonus} KHR</td>
                          <td style={{ padding: '12px' }}>{item.maxMoisture}%</td>
                          <td style={{ padding: '12px' }}>{item.maxForeignMatter}%</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: item.status === 'ACTIVE' ? '#065F46' : '#7F1D1D', color: '#FFF', fontSize: '10px', fontWeight: 'bold' }}>
                              {item.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenSpecModal(item)}
                              style={{ padding: '4px 10px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '6px', fontSize: '11px' }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSpec(item)}
                              style={{ padding: '4px 10px', backgroundColor: '#7F1D1D', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: LOCATIONS & WAREHOUSES */}
            {activeTab === 'locations' && (
              <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#38BDF8', margin: 0 }}>📍 Loading Stations & Destination Warehouses</h3>
                  <button
                    onClick={() => handleOpenLocModal()}
                    style={{ padding: '8px 16px', backgroundColor: '#38BDF8', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                  >
                    + Add New Location
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Buying Stations */}
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#F59E0B', marginBottom: '12px' }}>Buying Stations (Loading Points)</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Station Name</th>
                          <th style={{ padding: '8px' }}>Code</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations
                          .filter((l) => l.type === 'BUYING_STATION')
                          .map((loc) => (
                            <tr key={loc.id} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '8px', fontWeight: 'bold' }}>🏢 {loc.name}</td>
                              <td style={{ padding: '8px', color: '#94A3B8' }}>{loc.code || '-'}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleOpenLocModal(loc)}
                                  style={{ padding: '2px 8px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '10px' }}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteLoc(loc)}
                                  style={{ padding: '2px 8px', backgroundColor: '#7F1D1D', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Warehouses */}
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#10B981', marginBottom: '12px' }}>Destination Warehouses</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Warehouse Name</th>
                          <th style={{ padding: '8px' }}>Code</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations
                          .filter((l) => l.type === 'WAREHOUSE')
                          .map((loc) => (
                            <tr key={loc.id} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '8px', fontWeight: 'bold' }}>🏭 {loc.name}</td>
                              <td style={{ padding: '8px', color: '#94A3B8' }}>{loc.code || '-'}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleOpenLocModal(loc)}
                                  style={{ padding: '2px 8px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '10px' }}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteLoc(loc)}
                                  style={{ padding: '2px 8px', backgroundColor: '#7F1D1D', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                >
                                  🗑️
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

            {/* TAB 3: BANKS & VILLAGES */}
            {activeTab === 'banks' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Banks Section */}
                <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#38BDF8', margin: 0 }}>💳 Commercial Banks</h3>
                    <button
                      onClick={() => handleOpenBankModal()}
                      style={{ padding: '6px 14px', backgroundColor: '#38BDF8', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                    >
                      + Add Bank
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Bank Name</th>
                        <th style={{ padding: '8px' }}>Code</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banks.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>🏦 {b.name}</td>
                          <td style={{ padding: '8px', color: '#94A3B8' }}>{b.code || '-'}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenBankModal(b)}
                              style={{ padding: '2px 8px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '10px' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteBank(b)}
                              style={{ padding: '2px 8px', backgroundColor: '#7F1D1D', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Villages Section */}
                <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981', margin: 0 }}>🏡 Target Villages</h3>
                    <button
                      onClick={() => handleOpenVillageModal()}
                      style={{ padding: '6px 14px', backgroundColor: '#10B981', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                    >
                      + Add Village
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Village Name</th>
                        <th style={{ padding: '8px' }}>District</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {villages.map((v) => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: '#10B981' }}>📍 {v.name}</td>
                          <td style={{ padding: '8px', color: '#94A3B8' }}>{v.district || 'Chhaeb'} ({v.province || 'PVH'})</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenVillageModal(v)}
                              style={{ padding: '2px 8px', backgroundColor: '#334155', color: '#38BDF8', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '10px' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteVillage(v)}
                              style={{ padding: '2px 8px', backgroundColor: '#7F1D1D', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM INFO & CURRENCY */}
            {activeTab === 'system' && (
              <div style={{ padding: '20px', backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F59E0B', marginBottom: '16px' }}>🏢 System Information & Currency Parameters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Organization Name</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        style={{ width: '100%', padding: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                      />
                      <button
                        onClick={() => handleSaveSetting('orgName', orgName)}
                        style={{ padding: '10px 16px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Default Currency Symbol</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        style={{ width: '100%', padding: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                      />
                      <button
                        onClick={() => handleSaveSetting('defaultCurrency', defaultCurrency)}
                        style={{ padding: '10px 16px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Measurement Unit</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={measurementUnit}
                        onChange={(e) => setMeasurementUnit(e.target.value)}
                        style={{ width: '100%', padding: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                      />
                      <button
                        onClick={() => handleSaveSetting('measurementUnit', measurementUnit)}
                        style={{ padding: '10px 16px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Offline Mobile Sync Retention (Days)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        value={offlineSyncDays}
                        onChange={(e) => setOfflineSyncDays(parseInt(e.target.value) || 30)}
                        style={{ width: '100%', padding: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                      />
                      <button
                        onClick={() => handleSaveSetting('offlineSyncPeriodDays', offlineSyncDays)}
                        style={{ padding: '10px 16px', backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: Paddy Price Spec Form */}
        {showSpecModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#F59E0B', margin: '0 0 16px 0' }}>{editingSpec ? 'Edit Paddy Price Specification' : 'Add New Paddy Price Specification'}</h3>
              <form onSubmit={handleSaveSpec}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Variety Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Phka Rumduol"
                      value={specForm.variety}
                      onChange={(e) => setSpecForm({ ...specForm, variety: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Grade *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A1"
                      value={specForm.grade}
                      onChange={(e) => setSpecForm({ ...specForm, grade: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Organic Bonus (KHR)</label>
                    <input
                      type="number"
                      value={specForm.organicBonus}
                      onChange={(e) => setSpecForm({ ...specForm, organicBonus: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Max Moisture (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={specForm.maxMoisture}
                      onChange={(e) => setSpecForm({ ...specForm, maxMoisture: parseFloat(e.target.value) || 14.0 })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Max Foreign Matter (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={specForm.maxForeignMatter}
                      onChange={(e) => setSpecForm({ ...specForm, maxForeignMatter: parseFloat(e.target.value) || 5.0 })}
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
                    placeholder="e.g. Choam Ksant Station"
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Location Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. STN-CKS"
                    value={locForm.code}
                    onChange={(e) => setLocForm({ ...locForm, code: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '6px' }}
                  />
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Bank Short Code (e.g. ACL)</label>
                  <input
                    type="text"
                    value={bankForm.code}
                    onChange={(e) => setBankForm({ ...bankForm, code: e.target.value })}
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

        {/* MODAL 4: Village Form */}
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
