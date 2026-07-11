import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import { Plus, Search, Edit, Trash2, X, Zap, QrCode, Image } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CONDITIONS = [
  { value: 'new', ar: 'جديد' },
  { value: 'used', ar: 'مستعمل' },
];

const SCOOTER_BRANDS = ['Honda', 'Yamaha', 'Suzuki', 'Piaggio', 'Vespa', 'Kymco', 'SYM', 'Lifan', 'Znen', 'أخرى'];

function ScooterForm({ vehicle, onSave, onClose, token }) {
  const isEdit = !!vehicle;
  const [form, setForm] = useState({
    name: vehicle?.name || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    color: vehicle?.color || '',
    engineCC: vehicle?.engineCC || '',
    chassisNo: vehicle?.chassisNo || '',
    engineNo: vehicle?.engineNo || '',
    condition: vehicle?.condition || 'new',
    sku: vehicle?.sku || '',
    barcode: vehicle?.barcode || '',
    buyPrice: vehicle?.buyPrice || '',
    sellPrice: vehicle?.sellPrice || '',
    quantity: vehicle?.quantity || 1,
    minQuantity: vehicle?.minQuantity || 1,
    description: vehicle?.description || '',
    supplier: vehicle?.supplier?._id || vehicle?.supplier || '',
    purchaseDate: vehicle?.purchaseDate ? vehicle.purchaseDate.slice(0, 10) : '',
    productType: 'scooters',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(vehicle?.image || null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/contacts?type=supplier`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setSuppliers(r.data?.data || []))
      .catch(() => {});
  }, [token]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleImage = e => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
      if (imageFile) fd.append('images', imageFile);
      if (isEdit) {
        await axios.put(`${API}/products/${vehicle._id}`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
        toast.success('تم التحديث ✅');
      } else {
        await axios.post(`${API}/products`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
        toast.success('تم إضافة السكوتر ✅');
      }
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Zap className="text-indigo-400" size={22} />
            {isEdit ? 'تعديل سكوتر' : 'إضافة سكوتر جديد'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)]"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="col-span-3">
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الاسم <span className="opacity-50">(اختياري)</span></label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="مثال: Honda PCX 125" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الماركة *</label>
              <input list="scooter-brands" name="brand" value={form.brand} onChange={handleChange} className="input-field" required />
              <datalist id="scooter-brands">{SCOOTER_BRANDS.map(b => <option key={b} value={b} />)}</datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الموديل *</label>
              <input name="model" value={form.model} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">السنة</label>
              <input type="number" name="year" value={form.year} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">اللون</label>
              <input name="color" value={form.color} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">السعة (CC)</label>
              <input type="number" name="engineCC" value={form.engineCC} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الحالة</label>
              <select name="condition" value={form.condition} onChange={handleChange} className="input-field">
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.ar}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">رقم الشاسيه</label>
              <input name="chassisNo" value={form.chassisNo} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">رقم الموتور</label>
              <input name="engineNo" value={form.engineNo} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">SKU</label>
              <input name="sku" value={form.sku} onChange={handleChange} className="input-field" placeholder="تلقائي" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الباركود</label>
              <input name="barcode" value={form.barcode} onChange={handleChange} className="input-field" placeholder="تلقائي" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">سعر الشراء *</label>
              <input type="number" name="buyPrice" value={form.buyPrice} onChange={handleChange} className="input-field" required min="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">سعر البيع *</label>
              <input type="number" name="sellPrice" value={form.sellPrice} onChange={handleChange} className="input-field" required min="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الكمية</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">المورد</label>
              <select name="supplier" value={form.supplier} onChange={handleChange} className="input-field">
                <option value="">-- اختر --</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">تاريخ الشراء</label>
              <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الوصف</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="input-field h-24 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">الصورة</label>
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-indigo-500/50 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="h-full w-full object-contain rounded-xl" />
                ) : (
                  <><Image size={20} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-muted)] mt-1">اختر صورة</span></>
                )}
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'جاري...' : isEdit ? 'تحديث' : 'إضافة'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Scooters() {
  const token = localStorage.getItem('moto_token');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showQR, setShowQR] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ product_type: 'scooters' });
      if (search) params.set('search', search);
      if (filterBrand) params.set('brand', filterBrand);
      if (filterCondition) params.set('condition', filterCondition);
      const res = await axios.get(`${API}/products?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setVehicles(res.data?.data || []);
    } catch { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  }, [token, search, filterBrand, filterCondition]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('تم الحذف');
      setDeleteConfirm(null);
      fetchVehicles();
    } catch (err) { toast.error(err.response?.data?.message || 'فشل'); }
  };

  const totalCount = vehicles.length;
  const totalValue = vehicles.reduce((a, v) => a + (v.sellPrice * v.quantity), 0);
  const availableCount = vehicles.filter(v => v.quantity > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="text-indigo-400" size={28} /> السكوترات 🛵
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">إدارة مخزون السكوترات</p>
        </div>
        <button onClick={() => { setEditVehicle(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> إضافة سكوتر
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'إجمالي السكوترات', value: totalCount, color: 'from-indigo-500 to-purple-600' },
          { label: 'متاح بالمخزن', value: availableCount, color: 'from-green-500 to-emerald-600' },
          { label: 'قيمة المخزون', value: `${totalValue.toLocaleString('ar-EG')} ج`, color: 'from-orange-500 to-red-500' },
        ].map((s, i) => (
          <div key={i} className={`card bg-gradient-to-br ${s.color} border-0`}>
            <div className="text-white/70 text-xs font-bold mb-1">{s.label}</div>
            <div className="text-white text-2xl font-black">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالماركة أو الموديل..." className="input-field ps-9" />
          </div>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="input-field w-full sm:w-40">
            <option value="">كل الماركات</option>
            {SCOOTER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)} className="input-field w-full sm:w-36">
            <option value="">الكل</option>
            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.ar}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
            جاري التحميل...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16">
            <Zap size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-30" />
            <p className="text-[var(--text-muted)]">لا توجد سكوترات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['#','الصورة','الماركة / الموديل','السنة','الحالة','CC','الكمية','سعر الشراء','سعر البيع','إجراءات'].map(h => (
                    <th key={h} className="px-3 py-3 text-start text-xs font-bold text-[var(--text-muted)] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <motion.tr key={v._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-3 py-3 text-[var(--text-muted)] text-sm">{i+1}</td>
                    <td className="px-3 py-3">
                      {v.image ? (
                        <img src={`${API.replace('/api','')}${v.image}`} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Zap size={14} className="text-indigo-400" /></div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-white">{v.brand} {v.model}</div>
                      {v.color && <div className="text-xs text-[var(--text-muted)]">{v.color}</div>}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{v.year || '-'}</td>
                    <td className="px-3 py-3">
                      <span className={`badge text-xs ${v.condition === 'new' ? 'badge-success' : 'badge-warning'}`}>
                        {v.condition === 'new' ? 'جديد' : 'مستعمل'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-muted)]">{v.engineCC || '-'}</td>
                    <td className="px-3 py-3">
                      <span className={`badge ${v.quantity > 0 ? 'badge-success' : 'badge-danger'}`}>{v.quantity}</span>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{(v.buyPrice||0).toLocaleString('ar-EG')} ج</td>
                    <td className="px-3 py-3 font-bold text-indigo-400">{(v.sellPrice||0).toLocaleString('ar-EG')} ج</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowQR(v)} className="p-1.5 rounded-lg hover:bg-white/10 text-purple-400"><QrCode size={16} /></button>
                        <button onClick={() => { setEditVehicle(v); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-blue-400"><Edit size={16} /></button>
                        <button onClick={() => setDeleteConfirm(v._id)} className="p-1.5 rounded-lg hover:bg-white/10 text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <ScooterForm vehicle={editVehicle} token={token}
            onSave={() => { setShowForm(false); setEditVehicle(null); fetchVehicles(); }}
            onClose={() => { setShowForm(false); setEditVehicle(null); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQR(null)}>
            <motion.div className="card text-center p-8" initial={{ scale: 0.8 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-white mb-4">{showQR.brand} {showQR.model}</h3>
              <QRCodeSVG value={showQR.barcode || showQR.sku || showQR._id} size={200} />
              <p className="text-[var(--text-muted)] text-xs mt-3 font-mono">{showQR.barcode}</p>
              <button onClick={() => setShowQR(null)} className="btn-secondary mt-4">إغلاق</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="card p-6 max-w-sm w-full text-center" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-400" size={24} />
              </div>
              <h3 className="text-white font-black mb-2">تأكيد الحذف</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">هل أنت متأكد من حذف هذا السكوتر؟</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">إلغاء</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">حذف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
