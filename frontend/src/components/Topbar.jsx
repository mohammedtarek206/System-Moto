import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Globe, LogOut, User, ChevronDown, CheckCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang, isRTL } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/settings/notifications');
      setNotifications(res.data.data || []);
      setUnread(res.data.unread_count || 0);
    } catch {}
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/settings/notifications/read-all');
      setUnread(0);
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    toast.success(isRTL ? 'تم تسجيل الخروج' : 'Logged out');
    navigate('/login');
  };

  const roleLabel = user?.role === 'admin' ? t('admin') : user?.role === 'cashier' ? t('cashier') : t('warehouse');
  const roleColor = user?.role === 'admin' ? 'badge-danger' : user?.role === 'cashier' ? 'badge-info' : 'badge-warning';

  return (
    <header className="topbar flex items-center px-4 lg:px-6 gap-3">
      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="btn btn-ghost btn-sm lg:hidden">
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="font-bold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{title}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">

        {/* Language toggle */}
        <button onClick={toggleLang} className="btn btn-ghost btn-sm gap-1 hide-mobile" title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}>
          <Globe size={16} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{lang === 'ar' ? 'EN' : 'عر'}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={isDark ? (isRTL ? 'الوضع النهاري' : 'Light Mode') : (isRTL ? 'الوضع الليلي' : 'Dark Mode')}
        >
          {isDark ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="btn btn-ghost btn-sm relative">
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center" style={{ fontSize: '10px', fontWeight: 700 }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute end-0 top-12 w-80 dropdown-panel z-50 overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('notifications')}</span>
                  {unread > 0 && (
                    <button onClick={handleMarkAllRead} className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--primary)' }}>
                      <CheckCheck size={12} /> {isRTL ? 'تحديد الكل كمقروء' : 'Mark all read'}
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      {isRTL ? 'لا توجد إشعارات' : 'No notifications'}
                    </div>
                  ) : notifications.slice(0, 8).map(n => (
                    <div key={n.id} className="p-3 transition-colors" style={{
                      borderBottom: '1px solid var(--border)',
                      background: !n.is_read ? 'rgba(37,99,235,0.06)' : 'transparent'
                    }}>
                      <div className="flex items-start gap-2">
                        <span style={{ fontSize: '16px' }}>
                          {n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : n.type === 'success' ? '✅' : 'ℹ️'}
                        </span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {isRTL ? n.title_ar || n.title : n.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {isRTL ? n.message_ar || n.message : n.message}
                          </div>
                        </div>
                        {!n.is_read && <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', marginInlineStart: 'auto', marginTop: '4px', flexShrink: 0 }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors"
            style={{ background: showProfile ? 'var(--bg-card2)' : 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
            onMouseLeave={e => e.currentTarget.style.background = showProfile ? 'var(--bg-card2)' : 'transparent'}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold" style={{ fontSize: '14px' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-start hide-mobile">
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user?.name}</div>
              <span className={`badge ${roleColor}`} style={{ padding: '1px 8px', marginTop: '2px' }}>{roleLabel}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} className="hide-mobile" />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute end-0 top-12 w-56 dropdown-panel z-50 overflow-hidden"
              >
                <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
                <div className="p-2">
                  <button onClick={() => { navigate('/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{ fontSize: '14px', color: 'var(--text-primary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <User size={15} /> {isRTL ? 'الملف الشخصي' : 'Profile'}
                  </button>
                  <button onClick={toggleLang}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{ fontSize: '14px', color: 'var(--text-primary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Globe size={15} /> {lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
                  </button>
                  <button onClick={toggleTheme}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{ fontSize: '14px', color: 'var(--text-primary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {isDark ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} />}
                    {isDark ? (isRTL ? 'الوضع النهاري' : 'Light Mode') : (isRTL ? 'الوضع الليلي' : 'Dark Mode')}
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{ fontSize: '14px', color: '#ef4444' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={15} /> {t('logout')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
