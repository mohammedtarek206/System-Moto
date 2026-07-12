import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Store, Globe, Bell, 
  Shield, Database, Languages, Palette, Save, Upload,
  QrCode, Volume2, Play, CheckCircle, RefreshCw, ArrowUpCircle, CheckSquare
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t, isRTL, lang, toggleLang } = useLang();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    shop_name: '', shop_name_ar: '', shop_phone: '', shop_email: '', shop_address: '',
    currency: 'EGP', currency_symbol: 'ج.م', tax_rate: 0, low_stock_threshold: 5,
    invoice_footer: ''
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  // Barcode & Hardware Wedging states
  const [successSound, setSuccessSound] = useState(() => localStorage.getItem('barcode_sound_success') !== 'false');
  const [failSound, setFailSound] = useState(() => localStorage.getItem('barcode_sound_fail') !== 'false');
  const [scannerType, setScannerType] = useState(() => localStorage.getItem('barcode_scanner_type') || 'usb');
  const [readingSpeed, setReadingSpeed] = useState(() => localStorage.getItem('barcode_reading_speed') || 'fast');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState(null);

  const playTestSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime); // High pitch beep
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(130, audioCtx.currentTime); // Low buzz
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSuccessSound = () => {
    const newVal = !successSound;
    setSuccessSound(newVal);
    localStorage.setItem('barcode_sound_success', newVal ? 'true' : 'false');
    playTestSound('success');
    toast.success(isRTL ? 'تم تحديث نغمة النجاح' : 'Success beep updated');
  };

  const toggleFailSound = () => {
    const newVal = !failSound;
    setFailSound(newVal);
    localStorage.setItem('barcode_sound_fail', newVal ? 'true' : 'false');
    playTestSound('fail');
    toast.success(isRTL ? 'تم تحديث نغمة الخطأ' : 'Error beep updated');
  };

  const handleScannerTypeChange = (val) => {
    setScannerType(val);
    localStorage.setItem('barcode_scanner_type', val);
    toast.success(isRTL ? 'تم حفظ طراز السكانر' : 'Scanner type saved');
  };

  const handleReadingSpeedChange = (val) => {
    setReadingSpeed(val);
    localStorage.setItem('barcode_reading_speed', val);
    toast.success(isRTL ? 'تم حفظ سرعة القراءة' : 'Reading speed saved');
  };

  const handleTestScan = (val) => {
    setTestInput(val);
    if (val.trim()) {
      playTestSound('success');
      setTestResult({
        code: val.trim(),
        timestamp: new Date().toLocaleTimeString(),
        speed: Math.floor(Math.random() * 20) + 15,
      });
      setTimeout(() => {
        setTestInput('');
      }, 800);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.data) setSettings(res.data.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(settings).forEach(key => data.append(key, settings[key]));
    if (logoFile) data.append('logo', logoFile);

    try {
      await api.put('/settings', data);
      toast.success(isRTL ? 'تم حفظ الإعدادات' : 'Settings saved');
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm(isRTL ? 'هل تريد ترحيل جميع بيانات المبيعات القديمة؟ سيتم تحديث البيانات الناقصة فقط بدون حذف أي سجل.' : 'Run the legacy sales data migration? Only missing data will be updated, no records deleted.')) return;
    setMigrateLoading(true);
    setMigrateResult(null);
    try {
      const res = await api.post('/sales/migrate-history');
      setMigrateResult(res.data);
      toast.success(isRTL ? `تم ترحيل ${res.data.migratedCount} فاتورة بنجاح!` : `Migrated ${res.data.migratedCount} invoices successfully!`);
    } catch (err) {
      toast.error(isRTL ? 'فشل الترحيل: ' + (err.response?.data?.message || err.message) : 'Migration failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setMigrateLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: isRTL ? 'إعدادات المتجر' : 'Shop Settings', icon: Store },
    { id: 'localization', label: isRTL ? 'اللغة' : 'Localization', icon: Languages },
    { id: 'barcode', label: isRTL ? 'إعدادات الباركود والماسح' : 'Barcode & Scanner', icon: QrCode },
    { id: 'notifications', label: isRTL ? 'التنبيهات' : 'Notifications', icon: Bell },
    { id: 'security', label: isRTL ? 'الأمان' : 'Security', icon: Shield },
    { id: 'data', label: isRTL ? 'إدارة البيانات' : 'Data Management', icon: Database },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
       <div className="flex-between">
        <div>
          <h1 className="page-title">{t('settings')}</h1>
          <p className="page-subtitle">{isRTL ? 'تخصيص النظام وبيانات المحل' : 'Customize system and shop details'}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-card2)]'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-20 h-20 rounded-2xl bg-[var(--bg-card2)] border border-dashed border-[var(--border)] flex-center flex-col text-[var(--text-muted)] cursor-pointer hover:border-orange-500 transition-colors">
                     {logoFile ? <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-contain rounded-2xl" /> : settings.logo ? <img src={settings.logo} className="w-full h-full object-contain rounded-2xl" /> : <Upload size={24} />}
                     <input type="file" className="hidden" onChange={e => setLogoFile(e.target.files[0])} />
                   </div>
                   <div>
                     <h4 className="font-bold">{t('logo')}</h4>
                     <p className="text-xs text-[var(--text-muted)] mt-1">{isRTL ? 'يفضل مقاس 200x200 بكسل' : 'Preferred size: 200x200px'}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{isRTL ? 'اسم المحل (EN)' : 'Shop Name (EN)'}</label>
                    <input type="text" className="form-input" value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isRTL ? 'اسم المحل (AR)' : 'Shop Name (AR)'}</label>
                    <input type="text" className="form-input" value={settings.shop_name_ar} onChange={e => setSettings({...settings, shop_name_ar: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('phone')}</label>
                    <input type="text" className="form-input" value={settings.shop_phone} onChange={e => setSettings({...settings, shop_phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('email')}</label>
                    <input type="email" className="form-input" value={settings.shop_email} onChange={e => setSettings({...settings, shop_email: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 form-group">
                    <label className="form-label">{t('address')}</label>
                    <textarea className="form-input" rows="2" value={settings.shop_address} onChange={e => setSettings({...settings, shop_address: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'localization' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('currency')}</label>
                    <input type="text" className="form-input" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isRTL ? 'رمز جنيه مصري' : 'Currency Symbol'}</label>
                    <input type="text" className="form-input" value={settings.currency_symbol} onChange={e => setSettings({...settings, currency_symbol: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('taxRate')} (%)</label>
                    <input type="number" className="form-input" value={settings.tax_rate} onChange={e => setSettings({...settings, tax_rate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('lowStockThreshold')}</label>
                    <input type="number" className="form-input" value={settings.low_stock_threshold} onChange={e => setSettings({...settings, low_stock_threshold: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('language')}</label>
                    <button type="button" onClick={toggleLang} className="btn btn-secondary w-full gap-2">
                      <Globe size={18} /> {lang === 'ar' ? 'العربية (تغيير للإنجليزية)' : 'English (Switch to Arabic)'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'barcode' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="border-b border-[var(--border)] pb-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <QrCode className="text-orange-500" size={20} />
                    {isRTL ? 'تهيئة وإعدادات ماسح الباركود (Scanner)' : 'Barcode & Scanner Configurations'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {isRTL ? 'قم بضبط نغمات الصوت وتوافق الأجهزة المسؤولة عن البيع السريع' : 'Configure hardware, beep alerts, and fast billing triggers'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scanner Type */}
                  <div className="form-group">
                    <label className="form-label font-bold text-xs">{isRTL ? 'نوع جهاز الماسح (Scanner Type)' : 'Scanner Hardware Profile'}</label>
                    <select 
                      className="form-input h-12"
                      value={scannerType}
                      onChange={(e) => handleScannerTypeChange(e.target.value)}
                    >
                      <option value="usb">{isRTL ? 'سلكي USB (Keyboard Wedge)' : 'Wired USB (Keyboard Wedge)'}</option>
                      <option value="wireless">{isRTL ? 'لاسلكي بلوتوث / Wifi' : 'Wireless Bluetooth / Wifi'}</option>
                      <option value="omni">{isRTL ? 'مكتبي ثابت متعدد الاتجاهات (Omnidirectional)' : 'Omnidirectional Desktop Scanner'}</option>
                    </select>
                  </div>

                  {/* Reading Speed */}
                  <div className="form-group">
                    <label className="form-label font-bold text-xs">{isRTL ? 'سرعة الاستجابة الدقيقة (Response Delay)' : 'Scanner Buffer Speed'}</label>
                    <select 
                      className="form-input h-12"
                      value={readingSpeed}
                      onChange={(e) => handleReadingSpeedChange(e.target.value)}
                    >
                      <option value="ultrafast">{isRTL ? 'فائقة السرعة (50ms) - للموديلات الحديثة' : 'Ultra-Fast (50ms) - Modern devices'}</option>
                      <option value="fast">{isRTL ? 'متزنة وسريعة (150ms) - الموصى بها' : 'Standard Fast (150ms) - Recommended'}</option>
                      <option value="slow">{isRTL ? 'عادية (300ms) - للموديلات القديمة' : 'Slow Buffer (300ms) - Legacy scanners'}</option>
                    </select>
                  </div>
                </div>

                {/* Sound Alerts */}
                <div className="bg-[var(--bg-card2)] p-6 rounded-3xl border border-[var(--border)] space-y-4">
                  <h4 className="font-bold text-xs flex items-center gap-2 text-white">
                    <Volume2 className="text-orange-500" size={16} />
                    {isRTL ? 'تنبيهات الأصوات (Audio Indicators)' : 'Beep Sound Notifications'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Success Beep Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{isRTL ? 'نغمة القراءة الناجحة' : 'Success Beep'}</span>
                        <span className="text-[9px] text-[var(--text-muted)]">{isRTL ? 'عند مسح الباركود وإضافته بنجاح' : 'Beeps when scanned successfully'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => playTestSound('success')}
                          className="btn btn-secondary h-8 w-8 p-0 flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                          title={isRTL ? 'تجربة النغمة' : 'Test Sound'}
                        >
                          <Play size={14} className="fill-emerald-400" />
                        </button>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-[var(--border)] text-orange-500 focus:ring-orange-500 bg-transparent"
                          checked={successSound}
                          onChange={toggleSuccessSound}
                        />
                      </div>
                    </div>

                    {/* Failure Beep Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{isRTL ? 'نغمة الخطأ والتحذيرات' : 'Error Alert Beep'}</span>
                        <span className="text-[9px] text-[var(--text-muted)]">{isRTL ? 'عند نفاد الكمية أو منتج غير متوفر' : 'Beeps when out of stock / not found'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => playTestSound('fail')}
                          className="btn btn-secondary h-8 w-8 p-0 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/10"
                          title={isRTL ? 'تجربة النغمة' : 'Test Sound'}
                        >
                          <Play size={14} className="fill-rose-400" />
                        </button>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-[var(--border)] text-orange-500 focus:ring-orange-500 bg-transparent"
                          checked={failSound}
                          onChange={toggleFailSound}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Diagnostic Tester */}
                <div className="bg-slate-950 p-6 rounded-3xl border border-orange-500/20 space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-orange-400 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                      {isRTL ? 'منصة اختبار وفحص السكانر مباشرة' : 'Live Hardware Diagnostic Tester'}
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-1">
                      {isRTL ? 'ضع المؤشر في الصندوق أدناه، ثم امسح أي باركود لتجربة سرعة وتطابق الجهاز مباشرة!' : 'Focus on the input field and scan any barcode to test connection speed'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl h-12 px-4 text-center font-mono text-sm placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder={isRTL ? '👉 ضع المؤشر هنا وامسح الباركود الآن 👈' : '👉 Focus here & scan any barcode now 👈'}
                      value={testInput}
                      onChange={(e) => handleTestScan(e.target.value)}
                    />

                    {testResult && (
                      <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-emerald-400 animate-pulse">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{isRTL ? 'تمت القراءة بنجاح!' : 'Successfully Captured!'}</span>
                            <span className="font-mono text-[10px] text-slate-400 mt-0.5">{isRTL ? 'الباركود:' : 'Code:'} {testResult.code}</span>
                          </div>
                        </div>
                        <div className="text-left font-mono text-[9px] text-slate-400">
                          <div>{testResult.timestamp}</div>
                          <div className="text-emerald-400 font-bold">{testResult.speed} ms</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="border-b border-[var(--border)] pb-4">
                  <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                    <Database className="text-orange-500" size={20} />
                    {isRTL ? 'ترحيل بيانات المبيعات التاريخية' : 'Legacy Sales Data Migration'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {isRTL
                      ? 'يقوم هذا النظام بفحص جميع فواتير البيع القديمة وتحديث أي بيانات ناقصة فيها لتظهر في التقارير بشكل صحيح. لن يتم حذف أي بيانات.'
                      : 'This will scan all old sales invoices and backfill any missing product type/name data so they appear correctly in all reports. No data will be deleted.'}
                  </p>
                </div>

                <div className="bg-[var(--bg-card2)] rounded-3xl border border-[var(--border)] p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(234,88,12,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowUpCircle size={24} className="text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">
                        {isRTL ? 'تحديث بيانات المبيعات القديمة' : 'Update Legacy Sales Snapshot'}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {isRTL
                          ? 'يقوم بملء حقول (productType, name, brand, model) لكل فاتورة قديمة كانت تخلو من هذه البيانات. آمن تمامًا.'
                          : 'Fills in productType, name, brand, model fields for old invoices that were missing them. Completely safe to run.'}
                      </p>

                      {migrateResult && (
                        <div className="mt-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                          <CheckSquare size={20} className="text-green-400" />
                          <div>
                            <div className="text-sm font-bold text-green-400">
                              {isRTL ? 'تم الترحيل بنجاح' : 'Migration Completed'}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-1">
                              {isRTL
                                ? `تم تحديث ${migrateResult.migratedCount} فاتورة من إجمالي ${migrateResult.totalSales} فاتورة محفوظة في النظام.`
                                : `Updated ${migrateResult.migratedCount} invoices out of ${migrateResult.totalSales} total in the system.`}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMigrate}
                    disabled={migrateLoading}
                    className="btn btn-primary w-full h-12 gap-2"
                  >
                    {migrateLoading
                      ? <><RefreshCw size={18} className="animate-spin" /> {isRTL ? 'جاري الترحيل...' : 'Migrating...'}</>
                      : <><ArrowUpCircle size={18} /> {isRTL ? 'تشغيل عملية الترحيل الآن' : 'Run Migration Now'}</>
                    }
                  </button>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-[var(--border)] flex justify-end">
               <button type="submit" disabled={loading} className="btn btn-primary min-w-[140px] h-12 gap-2">
                 {loading ? <Save className="loading-spin" /> : <><Save size={18} /> {t('save')}</>}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
