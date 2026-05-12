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
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      
      {/* Animated Gears */}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute -top-40 -left-40 text-white/[0.02] pointer-events-none">
        <Settings size={500} />
      </motion.div>
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute -bottom-40 -right-40 text-white/[0.02] pointer-events-none">
        <Cpu size={500} />
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="w-full max-w-[460px] flex flex-col items-center gap-10 z-10">
        
        {/* BRANDING */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#ff5e00] to-[#ff2d55] rounded-3xl flex items-center justify-center text-4xl shadow-[0_20px_50px_rgba(255,94,0,0.3)] border border-white/10">
              🏍️
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-xl ring-4 ring-[#0d0d12]">
              <ShieldCheck size={16} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter italic font-['Orbitron'] mb-1">
            MOTO <span className="text-[#ff5e00]">PARTS</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold tracking-[0.5em] uppercase opacity-60">Management System</p>
        </motion.div>

        {/* LOGIN CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-[#1a1a22]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-2xl relative"
        >
          {/* Top Glow Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-[#ff5e00] to-transparent" />

          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h2>
            <div className="h-1 w-12 bg-gradient-to-r from-[#ff5e00] to-[#ff2d55] rounded-full mx-auto" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 px-2 text-right">البريد الإلكتروني</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-[#ff5e00] transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  dir="ltr"
                  className="w-full h-16 bg-[#0d0d12]/60 border border-white/5 rounded-2xl pr-14 pl-6 text-white placeholder:text-slate-800 focus:outline-none focus:border-[#ff5e00]/40 focus:ring-4 focus:ring-[#ff5e00]/5 transition-all text-base"
                  placeholder="admin@motoparts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 px-2 text-right">كلمة المرور</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-[#ff2d55] transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  className="w-full h-16 bg-[#0d0d12]/60 border border-white/5 rounded-2xl pr-14 pl-14 text-white placeholder:text-slate-800 focus:outline-none focus:border-[#ff2d55]/40 focus:ring-4 focus:ring-[#ff2d55]/5 transition-all text-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border border-white/10 bg-white/5 checked:bg-[#ff5e00] checked:border-[#ff5e00] transition-all cursor-pointer" />
                  <div className="absolute text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <LogIn size={12} strokeWidth={4} />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300">تذكرني</span>
              </label>
              <button type="button" className="text-xs font-bold text-[#ff5e00] hover:text-[#ff2d55] transition-colors">
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-[#ff5e00] to-[#ff2d55] hover:shadow-[0_15px_40px_rgba(255,94,0,0.3)] active:scale-[0.99] text-white font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>دخول للنظام</span>
                  <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Icons */}
          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-2 text-emerald-500/60">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-bold tracking-widest uppercase">System Secure</span>
             </div>
             <div className="text-[9px] font-bold text-slate-600 tracking-widest uppercase">Encryption 256-Bit</div>
          </div>
        </motion.div>

        {/* CREDITS */}
        <p className="text-slate-800 text-[10px] font-bold tracking-[0.5em] uppercase opacity-40">
           Powered by AntiGravity &bull; © 2024
        </p>
      </div>
    </div>
  );
}
