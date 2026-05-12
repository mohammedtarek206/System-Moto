import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, Settings, Cpu } from 'lucide-react';
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0d0d12] relative overflow-hidden font-['Cairo'] selection:bg-[#ff5e00]/30">
      
      {/* 1. LAYERED BACKGROUND EFFECTS */}
      {/* Motorcycle Silhouette (Subtle) */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-center bg-[length:60%] opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}
      />
      
      {/* Animated Gears (Subtle & Transparent) */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -left-20 text-white/[0.02] pointer-events-none"
      >
        <Settings size={400} />
      </motion.div>
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-20 -right-20 text-white/[0.02] pointer-events-none"
      >
        <Cpu size={350} />
      </motion.div>

      {/* Neon Streaks */}
      <div className="absolute top-1/4 -left-20 w-96 h-[2px] bg-gradient-to-r from-transparent via-[#ff5e00]/20 to-transparent rotate-45 blur-sm" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-[2px] bg-gradient-to-r from-transparent via-[#ff2d55]/20 to-transparent -rotate-45 blur-sm" />

      {/* 2. MAIN CONTAINER */}
      <div className="w-full max-w-[480px] flex flex-col items-center gap-8 z-10">
        
        {/* LOGO & BRANDING */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-[#ff5e00] to-[#ff2d55] rounded-2xl flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(255,94,0,0.3)] border border-white/10">
              🏍️
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-lg ring-4 ring-[#0d0d12]">
              <ShieldCheck size={16} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter italic font-['Orbitron']">
              MOTO <span className="text-[#ff5e00]">PARTS</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold tracking-[0.4em] uppercase mt-1">Management System</p>
          </div>
        </motion.div>

        {/* 3. LOGIN CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-[#1a1a22]/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative"
        >
          {/* Subtle Glow Header */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#ff5e00]/50 to-transparent" />

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">{isRTL ? 'تسجيل الدخول' : 'Sign In'}</h2>
            <div className="h-1 w-10 bg-[#ff5e00] rounded-full mx-auto" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 px-1 text-end">البريد الإلكتروني</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-[#ff5e00] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  dir="ltr"
                  className="w-full h-14 bg-[#0d0d12]/50 border border-white/5 rounded-xl pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-[#ff5e00]/40 focus:ring-4 focus:ring-[#ff5e00]/5 transition-all text-sm"
                  placeholder="admin@motoparts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 px-1 text-end">كلمة المرور</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-[#ff2d55] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  className="w-full h-14 bg-[#0d0d12]/50 border border-white/5 rounded-xl pl-12 pr-12 text-white placeholder:text-slate-700 focus:outline-none focus:border-[#ff2d55]/40 focus:ring-4 focus:ring-[#ff2d55]/5 transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-[11px] font-bold px-1">
              <button type="button" className="text-[#ff5e00] hover:text-[#ff2d55] transition-colors">
                نسيت كلمة المرور؟
              </button>
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className="text-slate-500 group-hover:text-slate-300">تذكرني</span>
                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 accent-[#ff5e00] cursor-pointer" />
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-[#ff5e00] to-[#ff2d55] hover:shadow-[0_8px_25px_rgba(255,94,0,0.4)] active:scale-[0.98] text-white font-black text-base rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>دخول للنظام</span>
                  <LogIn size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer Card Info */}
          <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between opacity-40">
             <div className="flex items-center gap-2 text-emerald-500">
                <ShieldCheck size={12} />
                <span className="text-[8px] font-bold tracking-widest uppercase">System Secure</span>
             </div>
             <div className="text-[8px] font-bold text-slate-500 tracking-widest uppercase">Encryption 256-Bit</div>
          </div>
        </motion.div>

        {/* 4. FOOTER CREDITS */}
        <div className="text-center">
           <p className="text-slate-700 text-[9px] font-bold tracking-[0.4em] uppercase">
             Powered by AntiGravity &bull; © 2024 Moto Inc
           </p>
        </div>
      </div>
    </div>
  );
}
