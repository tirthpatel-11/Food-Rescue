import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  HeartHandshake,
  Building2,
  Users,
  UtensilsCrossed,
  PackagePlus,
  Inbox,
  Truck,
  Bike,
  Warehouse,
  ShieldCheck,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Donations', href: '/donations', icon: PackagePlus, highlight: true },
  { name: 'Deliveries', href: '/deliveries', icon: Truck, highlight: true },
  { name: 'Food Requests', href: '/requests', icon: Inbox },
  { name: 'Donors', href: '/donors', icon: HeartHandshake },
  { name: 'NGOs', href: '/ngos', icon: Building2 },
  { name: 'Beneficiaries', href: '/beneficiaries', icon: Users },
  { name: 'Food Items', href: '/food-items', icon: UtensilsCrossed },
  { name: 'Partners & Fleet', href: '/partners', icon: Bike },
  { name: 'Storage Units', href: '/storage-units', icon: Warehouse },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-slate-900 text-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-xl`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-lg tracking-tight text-white leading-none">
                Food Rescue
              </span>
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                Network
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Operations & Catalog
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Academic project footer badge */}
        <div className="p-4 m-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>IIIT Surat • 3rd Sem</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            DBMS Coursework Project<br />
            MySQL Relational Schema
          </p>
        </div>
      </aside>
    </>
  );
}
