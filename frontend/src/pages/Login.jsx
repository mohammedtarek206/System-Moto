import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const { isRTL } = useLang();
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
    <div className="h-screen w-full flex bg-[#020203] font-['Cairo'] selection:bg-orange-500/30 overflow-hidden" dir="rtl">
      
      {/* 1. LEFT PANEL: Cinematic Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-black border-l border-white/5" dir="ltr">
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
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-black" size={28} />
            </div>
            <span className="text-xl font-black text-white tracking-widest font-['Orbitron']">SECURE ACCESS</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-8xl font-black text-white italic font-['Orbitron'] leading-none">
              MOTO<br />
              <span className="text-orange-500">PARTS</span>
            </h1>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-1 w-24 bg-orange-500" />
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-sm">Management System</p>
            </div>
          </motion.div>

          <div className="flex gap-12 text-slate-500 text-[10px] font-bold tracking-widest uppercase">
            <span>Performance</span>
            <span>Precision</span>
            <span>Power</span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL: Login Portal */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        
        <div className="lg:hidden absolute inset-0 z-0">
            <img src="/motorcycle-bg.png" alt="" className="w-full h-full object-cover opacity-20 blur-sm" />
            <div className="absolute inset-0 bg-black/80" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] z-10"
        >
          {/* Header */}
          <div className="mb-10 text-right">
            <h2 className="text-5xl font-black text-white mb-4 leading-tight">مرحباً بك</h2>
            <p className="text-slate-400 text-lg">سجل دخولك للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-slate-500 mr-1 block">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  style={{ paddingRight: '60px', paddingLeft: '20px' }}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-white text-lg focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-800"
                  placeholder="admin@motoparts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 w-[60px] flex items-center justify-center pointer-events-none text-slate-500">
                  <Mail size={22} />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-slate-500 mr-1 block">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  style={{ paddingRight: '60px', paddingLeft: '60px' }}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-white text-lg focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 w-[60px] flex items-center justify-center pointer-events-none text-slate-500">
                  <Lock size={22} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 w-[60px] flex items-center justify-center text-slate-600 hover:text-white transition-colors z-20"
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
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-orange-600 border-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.4)]' : 'border-white/10 bg-white/5'}`}
                >
                  {rememberMe && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <span className="text-[13px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors">تذكرني</span>
              </label>
              <button type="button" className="text-[13px] font-bold text-orange-500 hover:text-orange-400 transition-colors">
                هل نسيت كلمة المرور؟
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white font-black text-xl rounded-2xl transition-all shadow-[0_10px_30px_rgba(234,88,12,0.3)] flex items-center justify-center gap-4 disabled:opacity-50 group"
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
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
            <div className="flex items-center gap-8 opacity-40">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-orange-500" />
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">SSL Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Operational</span>
              </div>
            </div>
            <p className="text-slate-800 text-[10px] font-bold tracking-[0.4em] uppercase text-center">
               © 2024 Moto Parts Management • v3.0.0
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
