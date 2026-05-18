import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Monitor, Users, Truck,
  Warehouse, BarChart3, Settings, X, ChevronRight, Barcode, ShoppingBag, Wallet
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', path: '/', icon: LayoutDashboard, roles: ['admin','cashier','warehouse'] },
  { key: 'products', path: '/products', icon: Package, roles: ['admin','warehouse'] },
  { key: 'barcodes', path: '/barcodes', icon: Barcode, roles: ['admin','warehouse'] },
  { key: 'pos', path: '/pos', icon: Monitor, roles: ['admin','cashier'] },
  { key: 'sales', path: '/sales', icon: ShoppingCart, roles: ['admin','cashier'] },
  { key: 'installments', path: '/installments', icon: Wallet, roles: ['admin','cashier'] },
  { key: 'customers', path: '/customers', icon: Users, roles: ['admin','cashier'] },
  { key: 'suppliers', path: '/suppliers', icon: Truck, roles: ['admin'] },
  { key: 'purchases', path: '/purchases', icon: ShoppingBag, roles: ['admin'] },
  { key: 'inventory', path: '/inventory', icon: Warehouse, roles: ['admin','warehouse'] },
  { key: 'reports', path: '/reports', icon: BarChart3, roles: ['admin'] },
  { key: 'settings', path: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar({ open, onClose }) {
  const { t, isRTL } = useLang();
  const { user } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item => !user || item.roles.includes(user.role));

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: isRTL ? '100%' : '-100%' }
  };

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
        variants={sidebarVariants}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-white p-0.5 rounded-xl shadow-[0_4px_20px_rgba(255,255,255,0.1)] overflow-hidden shrink-0 border border-white/10">
              <img src="/photo_2026-05-12_22-56-52.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="sidebar-logo font-black text-lg tracking-tight leading-none truncate text-white">على بركة الله</div>
              <div className="text-orange-500 text-[10px] font-black mt-1 opacity-80">معرض سيارات وموتسيكلات</div>
            </div>
            <button onClick={onClose} className="lg:hidden text-[var(--text-muted)]">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1">
            <div className="px-3 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50">
                {isRTL ? 'القائمة الرئيسية' : 'Navigation'}
              </span>
            </div>
            
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  onClick={onClose}
                  className={`sidebar-item group ${isActive ? 'active' : ''}`}
                >
                  <div className={`sidebar-icon-bg ${isActive ? 'bg-orange-500 text-white' : 'bg-transparent text-[var(--text-secondary)] group-hover:text-orange-500'}`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-bold">{t(item.key)}</span>
                  {isActive && (
                    <motion.div layoutId="active-pill" className="ms-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 border border-orange-500/20">
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
