import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
      toast.success(isRTL ? 'مرحباً بك في موتو بارتس!' : 'Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || (isRTL ? 'بيانات الدخول غير صحيحة' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050508] relative overflow-hidden font-['Cairo']">
      {/* Background Effects */}
      <div className="absolute top-[-20%] start-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] end-[-10%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] z-10"
      >
        {/* Branding */}
        <div className="text-center mb-12">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-[0_20px_50px_rgba(249,115,22,0.3)] mx-auto mb-6 border border-white/10 relative"
          >
            🏍️
            <div className="absolute -bottom-1 -end-1 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg ring-4 ring-[#050508]">
              <ShieldCheck size={18} />
            </div>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2 italic">MOTO <span className="text-orange-500">PARTS</span></h1>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase opacity-60">Management System v1.4</p>
        </div>

        {/* Card */}
        <div className="bg-[#11111a]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-2xl relative">
          <div className="absolute top-0 start-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full" />
          
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">{isRTL ? 'تسجيل الدخول' : 'Sign In'}</h2>
            <p className="text-slate-400 text-sm font-medium">{isRTL ? 'أدخل بياناتك للوصول إلى لوحة التحكم' : 'Enter your details to access dashboard'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block ms-2">{t('email')}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  dir="ltr"
                  className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl ps-12 pe-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-base"
                  placeholder="admin@motoparts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block ms-2">{t('password')}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl ps-12 pe-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border border-white/10 bg-white/5 checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer" />
                  <div className="absolute text-white opacity-0 peer-checked:opacity-100 start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <LogIn size={12} strokeWidth={4} />
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-300 transition-colors">{isRTL ? 'تذكرني' : 'Remember me'}</span>
              </label>
              <button type="button" className="text-orange-500 font-bold hover:text-orange-400 transition-colors">
                {t('forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-600 hover:scale-[1.01] active:scale-[0.99] text-white font-black text-lg rounded-2xl shadow-[0_15px_30px_rgba(249,115,22,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-4 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {isRTL ? 'دخول للنظام' : 'Access System'}
                  <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between px-2">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">Server Online</span>
             </div>
             <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase opacity-40">Version 1.4.0 PRO</div>
          </div>
        </div>
        
        <p className="text-center mt-10 text-slate-600 text-[10px] font-bold tracking-[0.2em] uppercase opacity-50">
          &copy; 2024 Moto Parts Inc. &bull; Secure Access Layer
        </p>
      </motion.div>
    </div>
  );
}
