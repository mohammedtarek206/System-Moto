import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Monitor, Users, Truck,
  Warehouse, BarChart3, Settings, X, Barcode, ShoppingBag, Wallet,
  Bike, ChevronDown, DollarSign, PieChart, Zap, TrendingUp
} from 'lucide-react';

// Groups for collapsible sections
const navGroups = [
  {
    label: null, // no label = top-level
    items: [
      { key: 'dashboard', path: '/', icon: LayoutDashboard, roles: ['admin','cashier','warehouse'] },
    ]
  },
  {
    label: 'المبيعات والكاشير',
    labelEn: 'Sales & POS',
    items: [
      { key: 'pos', path: '/pos', icon: Monitor, roles: ['admin','cashier'] },
      { key: 'sales', path: '/sales', icon: ShoppingCart, roles: ['admin','cashier'] },
      { key: 'installments', path: '/installments', icon: Wallet, roles: ['admin','cashier'] },
    ]
  },
  {
    label: 'المنتجات والمخزن',
    labelEn: 'Products & Inventory',
    items: [
      { key: 'products', path: '/products', icon: Package, roles: ['admin','warehouse'] },
      { key: 'motorcycles', path: '/motorcycles', icon: Bike, roles: ['admin','warehouse'] },
      { key: 'scooters', path: '/scooters', icon: Zap, roles: ['admin','warehouse'] },
      { key: 'barcodes', path: '/barcodes', icon: Barcode, roles: ['admin','warehouse'] },
      { key: 'inventory', path: '/inventory', icon: Warehouse, roles: ['admin','warehouse'] },
    ]
  },
  {
    label: 'العملاء والموردين',
    labelEn: 'Contacts',
    items: [
      { key: 'customers', path: '/customers', icon: Users, roles: ['admin','cashier'] },
      { key: 'suppliers', path: '/suppliers', icon: Truck, roles: ['admin'] },
      { key: 'purchases', path: '/purchases', icon: ShoppingBag, roles: ['admin'] },
    ]
  },
  {
    label: 'التقارير والمالية',
    labelEn: 'Reports & Finance',
    items: [
      { key: 'reports', path: '/reports', icon: BarChart3, roles: ['admin'] },
      { key: 'oilReports', path: '/reports/oils', icon: PieChart, roles: ['admin'] },
      { key: 'sparePartsReports', path: '/reports/spare-parts', icon: TrendingUp, roles: ['admin'] },
      { key: 'motorcycleReports', path: '/reports/motorcycles', icon: Bike, roles: ['admin'] },
      { key: 'scooterReports', path: '/reports/scooters', icon: Zap, roles: ['admin'] },
      { key: 'capital', path: '/capital', icon: DollarSign, roles: ['admin'] },
    ]
  },
  {
    label: null,
    items: [
      { key: 'settings', path: '/settings', icon: Settings, roles: ['admin'] },
    ]
  }
];

function NavGroup({ group, user, isRTL, t, onClose, location }) {
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = group.items.filter(item => !user || item.roles.includes(user.role));
  if (filteredItems.length === 0) return null;

  const hasActiveItem = filteredItems.some(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  return (
    <div className="mb-1">
      {group.label && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-3 py-2 mb-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-60">
            {isRTL ? group.label : group.labelEn}
          </span>
          <ChevronDown
            size={12}
            className={`text-[var(--text-muted)] opacity-40 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
      )}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.path;
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    onClick={onClose}
                    className={`sidebar-item group ${isActive ? 'active' : ''}`}
                  >
                    <div className={`sidebar-icon-bg ${isActive ? 'bg-orange-500 text-white' : 'bg-transparent text-[var(--text-secondary)] group-hover:text-orange-500'}`}>
                      <Icon size={18} />
                    </div>
                    <span className="font-bold text-sm">{t(item.key)}</span>
                    {isActive && (
                      <motion.div layoutId="active-pill" className="ms-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { t, isRTL } = useLang();
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar ${open ? 'open' : ''}`}
        initial={false}
        animate={open ? 'open' : undefined}
        variants={{
          open: { x: 0 },
          closed: { x: isRTL ? '100%' : '-100%' }
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white p-0.5 rounded-xl shadow-[0_4px_20px_rgba(255,255,255,0.1)] overflow-hidden shrink-0 border border-white/10">
              <img src="/photo_2026-05-12_22-56-52.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="sidebar-logo font-black text-base tracking-tight leading-none truncate text-white">على بركة الله</div>
              <div className="text-orange-500 text-[10px] font-black mt-1 opacity-80">معرض سيارات وموتسيكلات</div>
            </div>
            <button onClick={onClose} className="lg:hidden text-[var(--text-muted)]">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <div className="space-y-0">
            {navGroups.map((group, i) => (
              <NavGroup
                key={i}
                group={group}
                user={user}
                isRTL={isRTL}
                t={t}
                onClose={onClose}
                location={location}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto p-5 space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 p-3 border border-orange-500/20">
            <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">{isRTL ? 'تحتاج مساعدة؟' : 'Need Help?'}</div>
            <div className="text-xs text-[var(--text-secondary)]">{isRTL ? 'تواصل مع الدعم الفني' : 'Contact Support'}</div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[var(--text-muted)] opacity-40 font-bold">
              {isRTL ? 'تصميم بواسطة شركة أرقام' : 'Designed by Arqam Company'}
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
