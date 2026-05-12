import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Phone, User, Trash2, Edit, X, MapPin, Mail, CreditCard, RefreshCw } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Customers() {
  const { t, isRTL } = useLang();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contacts/customers?search=${search}`);
      setCustomers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      toast.error(isRTL ? 'فشل تحميل العملاء' : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      await api.delete(`/contacts/customers/${id}`);
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
      fetchCustomers();
    } catch {
      toast.error(isRTL ? 'فشل الحذف' : 'Failed');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('customers')}</h1>
          <p className="page-subtitle">{isRTL ? 'إدارة بيانات العملاء والديون السابقة' : 'Manage customer data and previous debts'}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn btn-primary gap-2 h-12 px-6">
          <Plus size={20} /> {isRTL ? 'إضافة عميل جديد' : 'Add Customer'}
        </button>
      </div>

      <div className="relative form-icon-group max-w-md">
        <Search className="input-icon" size={18} />
        <input 
          type="text" className="form-input" placeholder={isRTL ? 'بحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-48 skeleton rounded-[2rem]" />)
        ) : customers.length === 0 ? (
          <div className="col-span-full text-center py-20 opacity-20 flex flex-col items-center">
            <User size={64} />
            <p className="mt-4 font-black">{t('noData')}</p>
          </div>
        ) : customers.map(c => (
          <div key={c._id} className="stat-card p-6 flex flex-col gap-4 border border-[var(--border)] rounded-[2rem] hover:border-orange-500/30 transition-all group">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-500/20">
                {c.name ? c.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg leading-tight">{c.name || '---'}</h3>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1 font-mono">
                  <Phone size={12} /> {c.phone || '---'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-3 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-tighter mb-1">{isRTL ? 'المديونية' : 'Debt'}</div>
                <div className={`text-sm font-black ${Number(c.balance) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {Number(c.balance || 0).toFixed(2)} <span className="text-[10px] opacity-50">EGP</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-card2)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-tighter mb-1">{isRTL ? 'الحالة' : 'Status'}</div>
                <span className="badge badge-success text-[10px]">{isRTL ? 'نشط' : 'Active'}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-2 pt-4 border-t border-[var(--border)] opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditing(c); setShowModal(true); }} className="btn btn-secondary btn-sm flex-1 h-10 rounded-xl gap-2 font-bold"><Edit size={14} /> {isRTL ? 'تعديل' : 'Edit'}</button>
              <button onClick={() => handleDelete(c._id)} className="btn btn-secondary btn-sm h-10 w-10 p-0 rounded-xl text-red-500 hover:bg-red-500/10"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <CustomerModal 
            customer={editing} 
            onClose={() => setShowModal(false)} 
            onSuccess={() => { setShowModal(false); fetchCustomers(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerModal({ customer, onClose, onSuccess }) {
  const { isRTL } = useLang();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    balance: customer?.balance || 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (customer) {
        await api.put(`/contacts/customers/${customer._id}`, formData);
      } else {
        await api.post('/contacts/customers', formData);
      }
      toast.success(isRTL ? 'تم حفظ البيانات' : 'Customer saved');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-box max-w-lg rounded-[2.5rem]">
        <div className="modal-header border-none pb-0">
          <h2 className="text-2xl font-black italic">{customer ? (isRTL ? 'تعديل بيانات عميل' : 'Edit Customer') : (isRTL ? 'إضافة عميل جديد' : 'New Customer')}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm h-10 w-10 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="form-group">
            <label className="form-label">{isRTL ? 'اسم العميل الكامل' : 'Full Name'}</label>
            <div className="form-icon-group">
              <User className="input-icon" size={18} />
              <input type="text" className="form-input h-12" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
              <div className="form-icon-group">
                <Phone className="input-icon" size={18} />
                <input type="text" className="form-input h-12" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{isRTL ? 'المديونية الحالية (إن وجد)' : 'Current Debt (Balance)'}</label>
              <div className="form-icon-group">
                <CreditCard className="input-icon" size={18} />
                <input type="number" className="form-input h-12 font-bold text-red-500" value={formData.balance} onChange={e => setFormData({...formData, balance: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{isRTL ? 'العنوان' : 'Address'}</label>
            <div className="form-icon-group">
              <MapPin className="input-icon" size={18} />
              <input type="text" className="form-input h-12" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>
          <div className="modal-footer border-none pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary h-12 px-6 rounded-2xl font-bold">{isRTL ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" disabled={loading} className="btn btn-primary h-12 px-8 rounded-2xl font-black shadow-lg shadow-orange-500/20 min-w-[140px]">
              {loading ? <RefreshCw className="loading-spin" size={20} /> : (isRTL ? 'حفظ العميل' : 'SAVE CUSTOMER')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
