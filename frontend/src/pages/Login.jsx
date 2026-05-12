import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, Settings, Cpu, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const { t, isRTL } = useLang();
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
      toast.success(isRTL ? 'مرحباً بك في النظام' : 'Welcome to the system');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || (isRTL ? 'بيانات الدخول غير صحيحة' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0a0a0f] relative overflow-hidden font-['Cairo'] selection:bg-[#ff5e00]/30">
      
      {/* 1. LAYERED BACKGROUND (Refined & Balanced) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
      
      {/* Background Gears (Better Distribution) */}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[10%] left-[5%] text-white/[0.015] pointer-events-none">
        <Settings size={300} />
      </motion.div>
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute bottom-[10%] right-[5%] text-white/[0.015] pointer-events-none">
        <Cpu size={250} />
      </motion.div>

      {/* Subtle Neon Streaks */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#ff5e00]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[#ff2d55]/5 blur-[120px] rounded-full" />

      {/* 2. MAIN CONTENT AREA */}
      <div className="w-full max-w-[440px] flex flex-col items-center z-10">
        
        {/* BRANDING (Correct Spacing) */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#ff5e00] to-[#ff2d55] rounded-[2rem] flex items-center justify-center text-5xl shadow-[0_20px_60px_rgba(255,94,0,0.25)] border border-white/10 relative overflow-hidden group">
              <span className="relative z-10">🏍️</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-2 rounded-xl ring-4 ring-[#0a0a0f] shadow-lg">
              <ShieldCheck size={18} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black text-white tracking-tighter italic font-['Orbitron'] leading-none">
              MOTO <span className="text-[#ff5e00]">PARTS</span>
            </h1>
            <p className="text-slate-600 text-[11px] font-bold tracking-[0.6em] uppercase mt-3 opacity-80">Management System</p>
          </div>
        </motion.div>

        {/* 3. LOGIN CARD (Enhanced Depth) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-[#16161e]/90 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 md:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative"
        >
          {/* Top Decorative Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[3px] bg-gradient-to-r from-transparent via-[#ff5e00] to-transparent rounded-full shadow-[0_0_10px_#ff5e00]" />

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">تسجيل الدخول</h2>
            <div className="h-1 w-12 bg-gradient-to-r from-[#ff5e00] to-[#ff2d55] rounded-full mx-auto opacity-50" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Email Field (Precise Alignment) */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-500 px-1 text-right">البريد الإلكتروني</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#ff5e00] transition-colors duration-300">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  dir="ltr"
                  className="w-full h-16 bg-[#0a0a0f]/80 border border-white/5 rounded-[1.25rem] pr-14 pl-6 text-white placeholder:text-slate-800 focus:outline-none focus:border-[#ff5e00]/30 focus:ring-4 focus:ring-[#ff5e00]/5 transition-all text-base font-medium"
                  placeholder="admin@motoparts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field (Symmetrical Icons) */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-500 px-1 text-right">كلمة المرور</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#ff2d55] transition-colors duration-300">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  className="w-full h-16 bg-[#0a0a0f]/80 border border-white/5 rounded-[1.25rem] pr-14 pl-14 text-white placeholder:text-slate-800 focus:outline-none focus:border-[#ff2d55]/30 focus:ring-4 focus:ring-[#ff2d55]/5 transition-all text-base font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Actions (Custom Checkbox) */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-[#ff5e00] border-[#ff5e00] shadow-[0_0_15px_rgba(255,94,0,0.4)]' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                >
                  {rememberMe && <Check size={16} className="text-white" strokeWidth={4} />}
                </div>
                <span className="text-[13px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors">تذكرني</span>
              </label>
              <button type="button" className="text-[13px] font-bold text-[#ff5e00] hover:text-[#ff2d55] transition-colors underline-offset-4 hover:underline">
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* Submit Button (Soft & Premium) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-br from-[#ff5e00] via-[#ff5e00] to-[#ff2d55] hover:shadow-[0_20px_40px_rgba(255,94,0,0.3)] active:scale-[0.98] text-white font-black text-lg rounded-[1.25rem] transition-all flex items-center justify-center gap-3 mt-6 disabled:opacity-70 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span className="relative z-10">دخول للنظام</span>
                  <LogIn size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Security Footer (Properly Spaced) */}
          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between px-2">
             <div className="flex items-center gap-2 text-emerald-500/50">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-bold tracking-widest uppercase">System Secure</span>
             </div>
             <div className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Encryption 256-Bit</div>
          </div>
        </motion.div>

        {/* CREDITS (Properly Margin) */}
        <p className="mt-12 text-slate-800 text-[10px] font-bold tracking-[0.6em] uppercase opacity-40 text-center">
           © 2024 Moto Parts Management
        </p>
      </div>
    </div>
  );
}
