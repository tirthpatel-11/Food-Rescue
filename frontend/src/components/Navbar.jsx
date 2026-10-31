import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const routeTitles = {
  '/': 'Dashboard Overview',
  '/donors': 'Donor Management',
  '/ngos': 'NGO Management',
  '/beneficiaries': 'Beneficiary Directory',
  '/food-items': 'Food Item Catalog',
  '/donations': 'Food Donations Management',
  '/requests': 'Food Requests Management',
  '/deliveries': 'Dispatch & Delivery Tracking',
  '/partners': 'Delivery Partners & Vehicles',
  '/storage-units': 'Storage Units & Warehouses',
};

export default function Navbar({ setMobileOpen, onRefresh }) {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || 'Food Rescue Network';
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      if (res.database === 'connected') {
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
    } catch {
      setDbStatus('disconnected');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkHealth();
    if (onRefresh) onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {currentTitle}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500">
            Real-time MySQL Database Management System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* DB Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            dbStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : dbStatus === 'disconnected'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={
            dbStatus === 'connected'
              ? 'MySQL 8.0 connected'
              : 'Database connection offline - check backend/.env'
          }
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden md:inline font-semibold">MySQL:</span>
          {dbStatus === 'connected' ? (
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
            </span>
          ) : dbStatus === 'disconnected' ? (
            <span className="flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Disconnected
            </span>
          ) : (
            <span>Connecting...</span>
          )}
        </div>

        {/* Global refresh button */}
        <button
          onClick={handleRefresh}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>
    </header>
  );
}
