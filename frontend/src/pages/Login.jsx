import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2, LockKeyhole } from 'lucide-react';
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
      toast.success(isRTL ? 'مرحباً بك في النظام!' : 'Welcome back!');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c] relative overflow-hidden font-['Cairo']">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop")' }}
      />
      
      {/* Sparks/Particles Effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: '110%', x: Math.random() * 100 + '%', opacity: 0 }}
            animate={{ y: '-10%', opacity: [0, 1, 0] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 5 }}
            className="absolute w-1 h-1 bg-orange-500 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/40 via-[#0a0a0c]/80 to-[#0a0a0c]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-[0_15px_40px_rgba(249,115,22,0.4)] border border-white/10">
               🏍️
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg ring-4 ring-[#0a0a0c]">
              <ShieldCheck size={18} />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
            MOTO <span className="text-orange-500">PARTS</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
             <span className="h-[1px] w-10 bg-slate-700" />
             <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">Management Pro v2.0</p>
             <span className="h-[1px] w-10 bg-slate-700" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#121218]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative">
          <div className="absolute -top-[2px] left-10 w-20 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent blur-[1px]" />
          
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              ✨ مرحباً بك في النظام ✨
            </h2>
            <p className="text-slate-400 text-xs">{isRTL ? 'أهلاً بك في نظام الإدارة الذكي' : 'Welcome to smart management system'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 text-end block px-2">البريد الإلكتروني</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-orange-500">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                    <Mail size={18} />
                  </div>
                </div>
                <input
                  type="email"
                  dir="ltr"
                  className="w-full h-14 bg-[#1a1a24] border border-white/5 rounded-2xl pl-14 pr-12 text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/30 focus:bg-[#1f1f2e] transition-all"
                  placeholder="admin@motoparts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-4 flex items-center text-emerald-500">
                   <CheckCircle2 size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 text-end block px-2">كلمة المرور</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-orange-500">
                   <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-red-500/70">
                    <LockKeyhole size={18} />
                  </div>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  className="w-full h-14 bg-[#1a1a24] border border-white/5 rounded-2xl pl-14 pr-12 text-white placeholder:text-slate-700 focus:outline-none focus:border-orange-500/30 focus:bg-[#1f1f2e] transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
               <button type="button" className="text-orange-500 font-bold hover:text-orange-400">
                نسيت كلمة المرور؟
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-slate-400">تذكرني</span>
                <input type="checkbox" className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-orange-500" />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] active:scale-[0.98] text-white font-black text-lg rounded-3xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-6"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>دخول للنظام</span>
                  <LogIn size={22} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between px-2">
             <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-bold tracking-widest uppercase">System Secure</span>
             </div>
             <div className="flex items-center gap-2 text-slate-500">
                <Lock size={14} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Encryption 256-bit</span>
             </div>
          </div>
        </div>
        
        <div className="text-center mt-10">
           <p className="text-slate-600 text-[10px] font-bold tracking-[0.3em] uppercase mb-2">
             Powered by AntiGravity &bull; &copy; 2024 Moto Inc.
           </p>
        </div>
      </motion.div>
    </div>
  );
}
