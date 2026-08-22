import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Lock, Edit, Trash2, CheckCircle, XCircle, X, Shield, RefreshCw } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Users() {
    const { t, isRTL } = useLang();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data.data || []);
        } catch {
            toast.error(isRTL ? 'فشل تحميل المستخدمين' : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/auth/users/${id}`);
            toast.success(isRTL ? 'تم حذف المستخدم' : 'User deleted');
            fetchUsers();
        } catch {
            toast.error(isRTL ? 'فشل حذف المستخدم' : 'Failed to delete user');
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await api.put(`/auth/users/${user._id}`, { isActive: !user.isActive });
            toast.success(isRTL ? 'تم تغيير حالة المستخدم' : 'User status changed');
            fetchUsers();
        } catch {
            toast.error(isRTL ? 'فشل التغيير' : 'Failed');
        }
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="page-title">{isRTL ? 'إدارة المستخدمين' : 'Users Management'}</h1>
                    <p className="page-subtitle">{isRTL ? 'التحكم في الموظفين والصلاحيات' : 'Manage staff and roles'}</p>
                </div>
                <button onClick={() => { setEditingUser(null); setShowModal(true); }} className="btn btn-primary h-12 px-6 gap-2">
                    <Plus size={20} /> {isRTL ? 'مستخدم جديد' : 'New User'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-[2rem]" />)
                    : users.map(u => (
                        <div key={u._id} className={`stat-card p-6 flex flex-col gap-4 border ${u.isActive ? 'border-[var(--border)]' : 'border-red-500/20 opacity-70'} rounded-[2rem] hover:border-orange-500/30 transition-all`}>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black ${u.role === 'admin' ? 'bg-red-500' : 'bg-blue-600'
                                        }`}>
                                        {u.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{u.name}</h3>
                                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                                            <Mail size={12} /> {u.email}
                                        </div>
                                    </div>
                                </div>
                                <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                                    {u.role === 'admin' ? 'Admin' : u.role === 'cashier' ? 'Sales / Cashier' : u.role}
                                </span>
                            </div>

                            <div className="flex gap-2 border-t border-[var(--border)] pt-4 mt-auto">
                                <button onClick={() => { setEditingUser(u); setShowModal(true); }} className="btn btn-secondary flex-1 btn-sm">
                                    <Edit size={16} /> {isRTL ? 'تعديل' : 'Edit'}
                                </button>
                                <button onClick={() => handleToggleStatus(u)} className={`btn btn-sm ${u.isActive ? 'btn-secondary text-red-500 hover:bg-red-500/10' : 'btn-secondary text-green-500 hover:bg-green-500/10'}`}>
                                    {u.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                </button>
                                {u.email !== 'admin@motoparts.com' && (
                                    <button onClick={() => handleDelete(u._id)} className="btn btn-secondary btn-sm text-red-500 hover:bg-red-500/10">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
            </div>

            <AnimatePresence>
                {showModal && <UserModal user={editingUser} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchUsers(); }} />}
            </AnimatePresence>
        </div>
    );
}

function UserModal({ user, onClose, onSuccess }) {
    const { isRTL } = useLang();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'cashier',
        phone: user?.phone || '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (user) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password; // Don't send empty password
                await api.put(`/auth/users/${user._id}`, payload);
            } else {
                await api.post('/auth/register', formData);
            }
            toast.success(isRTL ? 'تم حفظ المستخدم' : 'User saved');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-box rounded-[2.5rem] max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{user ? (isRTL ? 'تعديل مستخدم' : 'Edit User') : (isRTL ? 'إضافة مستخدم' : 'Add User')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-card2)] rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">{isRTL ? 'الاسم' : 'Name'}</label>
                        <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                        <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={user && user.email === 'admin@motoparts.com'} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{isRTL ? 'رقم الهاتف' : 'Phone'}</label>
                        <input type="text" className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{isRTL ? 'كلمة المرور' : 'Password'} {user && <span className="text-xs text-[var(--text-muted)]">({isRTL ? 'اتركها فارغة لعدم التغيير' : 'Leave empty to keep'})</span>}</label>
                        <input type="password" className="form-input" required={!user} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{isRTL ? 'الصلاحية (الدور)' : 'Role'}</label>
                        <select className="form-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} disabled={user && user.email === 'admin@motoparts.com'}>
                            <option value="admin">Admin</option>
                            <option value="cashier">Sales / Cashier</option>
                            <option value="warehouse">Warehouse</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-secondary">{isRTL ? 'إلغاء' : 'Cancel'}</button>
                        <button type="submit" disabled={loading} className="btn btn-primary min-w-[100px]">
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : (isRTL ? 'حفظ' : 'Save')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
