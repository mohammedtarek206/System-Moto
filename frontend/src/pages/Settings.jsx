import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Store, Globe, Bell, 
  Shield, Database, Languages, Palette, Save, Upload
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

  const tabs = [
    { id: 'general', label: isRTL ? 'إعدادات المتجر' : 'Shop Settings', icon: Store },
    { id: 'localization', label: isRTL ? 'اللغة' : 'Localization', icon: Languages },
    { id: 'notifications', label: isRTL ? 'التنبيهات' : 'Notifications', icon: Bell },
    { id: 'security', label: isRTL ? 'الأمان' : 'Security', icon: Shield },
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
                    <label className="form-label">{isRTL ? 'رمز الجنيه المصري' : 'Currency Symbol'}</label>
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
