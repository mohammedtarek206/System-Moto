import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, ChevronLeft, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const { isRTL } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || (isRTL ? 'بيانات الدخول غير صحيحة' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex font-['Cairo'] selection:bg-blue-500/30 overflow-hidden" dir="rtl" style={{ background: 'var(--bg-dark)' }}>
      
      {/* 1. LEFT PANEL: Cinematic Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-500 border-l border-blue-600" dir="ltr">
        <div className="absolute inset-0">
          <img 
            src="/motorcycle-bg.png" 
            alt="Motorcycle" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" />
        </div>

        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full text-left">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white p-1 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] overflow-hidden">
              <img src="/photo_2026-05-12_22-56-52.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black text-white tracking-widest font-['Orbitron']">PREMIUM ACCESS</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-8xl font-black text-white italic font-['Cairo'] leading-tight">
              على بركة<br />
              <span className="text-blue-200">الله</span>
            </h1>
            <div className="mt-6 flex items-center gap-4 text-left">
              <div className="h-1 w-24 bg-white/60" />
              <p className="text-blue-100 font-bold text-xl">معرض سيارات وموتسيكلات</p>
            </div>
          </motion.div>

          <div className="flex gap-12 text-blue-200 text-[10px] font-bold tracking-widest uppercase">
            <span>Performance</span>
            <span>Precision</span>
            <span>Power</span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL: Login Portal */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-y-auto" style={{ background: 'var(--bg-card)' }}>
        
        {/* Theme toggle on login page */}
        <button onClick={toggleTheme} className="absolute top-4 end-4 z-20" style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {isDark ? <Sun size={17} style={{ color: '#fbbf24' }} /> : <Moon size={17} style={{ color: 'var(--text-muted)' }} />}
        </button>

        <div className="lg:hidden absolute inset-0 z-0">
            <img src="/motorcycle-bg.png" alt="" className="w-full h-full object-cover opacity-5 blur-sm" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] z-10"
        >
          {/* Header with Logo */}
          <div className="mb-10 text-right">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex justify-start"
            >
              <div className="w-24 h-24 bg-white p-1 rounded-3xl shadow-2xl overflow-hidden border-4 border-white/5">
                <img src="/photo_2026-05-12_22-56-52.jpg" alt="على بركة الله" className="w-full h-full object-contain" />
              </div>
            </motion.div>
            <h2 className="text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--text-primary)' }}>مرحباً بك</h2>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>سجل دخولك للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold mr-1 block" style={{ color: 'var(--text-secondary)' }}>البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  style={{ paddingRight: '60px', paddingLeft: '20px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '16px', height: '56px', width: '100%', fontSize: '16px', outline: 'none', transition: 'all 0.2s' }}
                  className="focus:ring-4 focus:ring-blue-500/10"
                  placeholder="admin@motoparts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 w-[60px] flex items-center justify-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={22} />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold mr-1 block" style={{ color: 'var(--text-secondary)' }}>كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  style={{ paddingRight: '60px', paddingLeft: '60px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '16px', height: '56px', width: '100%', fontSize: '16px', outline: 'none', transition: 'all 0.2s' }}
                  className="focus:ring-4 focus:ring-blue-500/10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 w-[60px] flex items-center justify-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <Lock size={22} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 w-[60px] flex items-center justify-center transition-colors z-20"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{ width: '24px', height: '24px', borderRadius: '8px', border: `2px solid ${rememberMe ? '#2563eb' : 'var(--border)'}`, background: rememberMe ? '#2563eb' : 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {rememberMe && <div style={{ width: '10px', height: '10px', background: 'white', borderRadius: '50%' }} />}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>تذكرني</span>
              </label>
              <button type="button" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                هل نسيت كلمة المرور؟
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-xl rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-4 disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  <span>دخول للنظام</span>
                  <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-8 flex flex-col items-center gap-6" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-8" style={{ opacity: 0.7 }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SSL Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Operational</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <p style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                © 2024 معرض سيارات وموتسيكلات • v3.0.0
              </p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', opacity: 0.7 }}>
                تصميم بواسطة شركة أرقام
              </p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
