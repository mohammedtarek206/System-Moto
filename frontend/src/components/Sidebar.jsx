import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Monitor, Users, Truck,
  Warehouse, BarChart3, Settings, X, Barcode, ShoppingBag, Wallet,
  Bike, ChevronDown, DollarSign, PieChart, Zap, TrendingUp, Gauge, Battery, CircleDashed, Link, Sparkles
} from 'lucide-react';

const navGroups = [
  {
    label: null,
    items: [
      { key: 'dashboard', path: '/', icon: LayoutDashboard, roles: ['admin','cashier','warehouse'] },
    ]
  },
  {
    label: 'المبيعات والكاشير',
    labelEn: 'Sales & POS',
    items: [
      { key: 'pos',          path: '/pos',          icon: Monitor,       roles: ['admin','cashier'] },
      { key: 'sales',        path: '/sales',        icon: ShoppingCart,  roles: ['admin','cashier'] },
      { key: 'installments', path: '/installments', icon: Wallet,        roles: ['admin','cashier'] },
    ]
  },
  {
    label: 'المنتجات والمخزن',
    labelEn: 'Products & Inventory',
    items: [
      { key: 'products',    path: '/products',    icon: Package,   roles: ['admin','warehouse'] },
      { key: 'motorcycles', path: '/motorcycles', icon: Bike,      roles: ['admin','warehouse'] },
      { key: 'scooters',    path: '/scooters',    icon: Gauge,     roles: ['admin','warehouse'] },
      { key: 'barcodes',    path: '/barcodes',    icon: Barcode,   roles: ['admin','warehouse'] },
      { key: 'inventory',   path: '/inventory',   icon: Warehouse, roles: ['admin','warehouse'] },
    ]
  },
  {
    label: 'العملاء والموردين',
    labelEn: 'Contacts',
    items: [
      { key: 'customers', path: '/customers', icon: Users,       roles: ['admin','cashier'] },
      { key: 'suppliers', path: '/suppliers', icon: Truck,       roles: ['admin'] },
      { key: 'purchases', path: '/purchases', icon: ShoppingBag, roles: ['admin'] },
    ]
  },
  {
    label: 'التقارير والمالية',
    labelEn: 'Reports & Finance',
    items: [
      { key: 'reports',            path: '/reports',               icon: BarChart3,  roles: ['admin'] },
      { key: 'oilReports',         path: '/reports/oils',          icon: PieChart,   roles: ['admin'] },
      { key: 'sparePartsReports',  path: '/reports/spare-parts',   icon: TrendingUp, roles: ['admin'] },
      { key: 'motorcycleReports',  path: '/reports/motorcycles',   icon: Bike,       roles: ['admin'] },
      { key: 'scooterReports',     path: '/reports/scooters',      icon: Zap,        roles: ['admin'] },
      { key: 'batteryReports',     path: '/reports/batteries',     icon: Battery,    roles: ['admin'] },
      { key: 'tireReports',        path: '/reports/tires',         icon: CircleDashed,roles: ['admin'] },
      { key: 'accessoryReports',   path: '/reports/accessories',   icon: Link,       roles: ['admin'] },
      { key: 'extrasReports',      path: '/reports/extras',        icon: Sparkles,   roles: ['admin'] },
      { key: 'capital',            path: '/capital',               icon: DollarSign, roles: ['admin'] },
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

  return (
    <div style={{ marginBottom: '4px' }}>
      {group.label && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-3 py-2 mb-1 rounded-lg transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', opacity: 0.7 }}>
            {isRTL ? group.label : group.labelEn}
          </span>
          <ChevronDown
            size={12}
            style={{ color: 'var(--text-muted)', opacity: 0.5, transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
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
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                    <div className="sidebar-icon-bg" style={{
                      background: isActive ? 'var(--primary)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                    }}>
                      <Icon size={17} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {t(item.key)}
                    </span>
                    {isActive && (
                      <div style={{ marginInlineStart: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
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
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div style={{ padding: '20px' }}>
          {/* Logo */}
          <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
            <div style={{
              width: '46px', height: '46px',
              background: 'var(--bg-card2)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37,99,235,0.1)'
            }}>
              <img src="/photo_2026-05-12_22-56-52.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-logo" style={{ fontWeight: 900, fontSize: '15px' }}>على بركة الله</div>
              <div style={{ color: 'var(--primary)', fontSize: '10px', fontWeight: 700, marginTop: '2px', opacity: 0.8 }}>
                معرض سيارات وموتسيكلات
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <div>
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

        {/* Footer */}
        <div style={{ marginTop: 'auto', padding: '16px 20px' }}>
          <div style={{
            borderRadius: '16px',
            background: 'rgba(37,99,235,0.06)',
            border: '1px solid rgba(37,99,235,0.12)',
            padding: '12px'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              {isRTL ? 'تحتاج مساعدة؟' : 'Need Help?'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isRTL ? 'تواصل مع الدعم الفني' : 'Contact Support'}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.5, fontWeight: 700 }}>
              {isRTL ? 'تصميم بواسطة شركة أرقام' : 'Designed by Arqam Company'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
