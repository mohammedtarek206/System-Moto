import { useState } from 'react';
import { useInstallments } from './Context';
import { Search, Plus, Users, UserCircle, Phone, FileText } from 'lucide-react';

export default function CustomersTab() {
    const { customers, setCustomerModalOpen, searchQuery, setSearchQuery, handleCustomerSearch, selectedCustomer, setSelectedCustomer } = useInstallments();
    const [localSearch, setLocalSearch] = useState('');

    const filteredCustomers = customers.filter(c =>
        c.name.includes(localSearch) ||
        c.phone.includes(localSearch) ||
        c.nationalId.includes(localSearch)
    );

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center glass-card p-4">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute right-4 top-3 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="بحث عن عميل تقسيط ساري..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="form-input w-full"
                        style={{ paddingRight: 40 }}
                    />
                </div>
                <button
                    onClick={() => setCustomerModalOpen(true)}
                    className="btn btn-primary gap-2 w-full sm:w-auto"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}
                >
                    <Plus size={18} />
                    تسجيل عميل جديد
                </button>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>اسم العميل الرباعي</th>
                            <th>الهاتف المحمول</th>
                            <th>الرقم القومي / الهوية</th>
                            <th>الضامن الكفيل</th>
                            <th>العنوان الوصفي</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                                <tr key={customer._id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="stat-icon" style={{ width: 36, height: 36, background: 'rgba(59,130,246,0.1)', color: 'var(--primary)' }}>
                                                <UserCircle size={20} />
                                            </div>
                                            <span className="font-bold">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="font-bold" style={{ fontFamily: 'monospace' }}>{customer.phone}</td>
                                    <td><code style={{ fontSize: 13, color: 'var(--text-muted)' }}>{customer.nationalId}</code></td>
                                    <td>{customer.guarantor || '---'}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customer.address || '---'}</td>
                                    <td>
                                        <button
                                            onClick={() => setSelectedCustomer(customer)}
                                            className="btn btn-secondary btn-sm"
                                            style={{ color: 'var(--primary)' }}
                                            title="عرض بطاقة العميل والمستندات"
                                        >
                                            <FileText size={16} /> المستندات
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <div className="icon"><Users size={48} /></div>
                                        <p>لا يوجد عملاء مسجلين بنظام التقسيط</p>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>أضف أول عميل وابدأ تسجيل العقود</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Customer Document Preview Modal Snippet (Can be moved to Modals if needed, but keeping it scoped is fine) */}
            {selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2 className="font-black text-lg">مستندات العميل: {selectedCustomer.name}</h2>
                            <button onClick={() => setSelectedCustomer(null)} className="btn btn-ghost" style={{ padding: 4 }}>×</button>
                        </div>
                        <div className="modal-body space-y-4">
                            {selectedCustomer.documents?.nationalIdImage ? (
                                <div>
                                    <h4 className="font-bold text-sm mb-2 text-muted">صورة الرقم القومي</h4>
                                    <img src={selectedCustomer.documents.nationalIdImage} alt="National ID" className="w-full rounded-xl border" style={{ borderColor: 'var(--border)' }} />
                                </div>
                            ) : (
                                <div className="p-4 text-center border dashed text-muted rounded-xl" style={{ borderColor: 'var(--border)' }}>لا توجد صورة للبطاقة</div>
                            )}
                            {selectedCustomer.documents?.contractImage ? (
                                <div>
                                    <h4 className="font-bold text-sm mb-2 text-muted">صورة إيصال الضمان</h4>
                                    <img src={selectedCustomer.documents.contractImage} alt="Contract" className="w-full rounded-xl border" style={{ borderColor: 'var(--border)' }} />
                                </div>
                            ) : (
                                <div className="p-4 text-center border dashed text-muted rounded-xl" style={{ borderColor: 'var(--border)' }}>لا توجد صورة لإيصال الضمان</div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setSelectedCustomer(null)} className="btn btn-secondary w-full">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
