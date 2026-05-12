import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      toast.success(isRTL ? 'مرحباً بك في موتو بارتس!' : 'Welcome back!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || (isRTL ? 'بيانات الدخول غير صحيحة' : 'Login failed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#020205] relative overflow-hidden font-['Cairo']">
      {/* Dynamic Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, cubicBezier: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[460px] z-10"
      >
        {/* Premium Branding Section */}
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative inline-block mb-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 via-red-500 to-red-700 rounded-3xl flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(249,115,22,0.4)] border border-white/20 relative overflow-hidden group">
               <span className="group-hover:scale-125 transition-transform duration-500">🏍️</span>
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              delay={0.5}
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-xl ring-4 ring-[#020205] flex items-center justify-center"
            >
              <ShieldCheck size={20} />
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
              MOTO <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">PARTS</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-700" />
              <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Management Pro v2.0</p>
              <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-700" />
            </div>
          </motion.div>
        </div>

        {/* Main Card with Glassmorphism */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              {isRTL ? 'تسجيل الدخول' : 'Secure Login'}
              <Sparkles size={18} className="text-orange-500" />
            </h2>
            <p className="text-slate-400 text-sm">{isRTL ? 'أهلاً بك في نظام الإدارة الذكي' : 'Welcome to the smart management system'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 block">
                {t('email')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  dir="ltr"
                  className="w-full h-14 bg-white/[0.05] border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-base font-medium"
                  placeholder="admin@motoparts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2 block">
                {t('password')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  className="w-full h-14 bg-white/[0.05] border border-white/5 rounded-2xl pl-12 pr-12 text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-base font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer accent-orange-500" />
                <span className="text-slate-400 group-hover:text-slate-300">{isRTL ? 'تذكرني' : 'Keep me signed in'}</span>
              </label>
              <button type="button" className="text-orange-500 font-bold hover:text-orange-400">
                {t('forgotPassword')}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs flex items-center gap-2"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:shadow-[0_10px_30px_rgba(249,115,22,0.4)] active:scale-[0.98] text-white font-black text-base rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-4 overflow-hidden relative group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>
                  <span className="relative z-10">{isRTL ? 'دخول للنظام' : 'Access Dashboard'}</span>
                  <LogIn size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-black text-emerald-500 tracking-widest uppercase">System Secure</span>
             </div>
             <div className="text-[9px] font-bold text-slate-600 tracking-widest uppercase">Encryption 256-bit</div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-700 text-[9px] font-bold tracking-[0.2em] uppercase">
          Powered by AntiGravity &bull; &copy; 2024 Moto Inc.
        </p>
      </motion.div>
    </div>
  );
}
