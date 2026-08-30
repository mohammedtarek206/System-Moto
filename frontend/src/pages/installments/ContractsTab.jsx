import { useState } from 'react';
import { useInstallments } from './Context';
import { printContractLayout } from './PrintUtils';
import { Search, Plus, FileText, Printer, Eye, Trash2 } from 'lucide-react';

export default function ContractsTab() {
    const { contracts, setContractModalOpen, selectedContract, setSelectedContract, handleDeleteContract } = useInstallments();
    const [localSearch, setLocalSearch] = useState('');

    const filteredContracts = contracts.filter(c =>
        c.contractNumber?.includes(localSearch) ||
        c.customer?.name.includes(localSearch) ||
        c.motorcycleBrand?.includes(localSearch)
    );

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center glass-card p-4">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute right-4 top-3 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="بحث برقم العقد، اسم العميل، او המותג..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="form-input w-full"
                        style={{ paddingRight: 40 }}
                    />
                </div>
                <button
                    onClick={() => setContractModalOpen(true)}
                    className="btn btn-primary gap-2 w-full sm:w-auto"
                    style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                >
                    <Plus size={18} />
                    إنشاء عقد تقسيط
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContracts.length > 0 ? (
                    filteredContracts.map(contract => (
                        <div key={contract._id} className="glass-card flex flex-col h-full" style={{ borderRadius: 16 }}>
                            <div className="p-5 flex-1 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="badge" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>رقم العقد: {contract.contractNumber}</span>
                                        <h4 className="font-black mt-3 text-lg" style={{ color: 'var(--text-primary)' }}>{contract.customer?.name}</h4>
                                    </div>
                                    <div className="text-left font-bold">
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>المتبقي الكلي</span>
                                        <div className="font-black text-xl" style={{ color: '#F97316' }}>{contract.remainingAmount} ج</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>الدراجة النارية</div>
                                        <div className="font-bold">{contract.motorcycleBrand} {contract.motorcycleModel}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>تاريخ البدء</div>
                                        <div className="font-bold">{new Date(contract.startDate).toLocaleDateString('ar-EG')}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>القسط الشهري</div>
                                        <div className="font-bold text-success">{contract.monthlyInstallment} ج</div>
                                    </div>
                                    <div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>المدة</div>
                                        <div className="font-bold">{contract.monthsCount} شهر</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-5">
                                    <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        <span>المدفوع: {contract.totalAmount - contract.remainingAmount} ج</span>
                                        <span>الإجمالي: {contract.totalAmount} ج</span>
                                    </div>
                                    <div className="progress-bar mt-1" style={{ height: 6, background: 'var(--bg-table-header)', borderRadius: 3 }}>
                                        <div
                                            className="progress-fill"
                                            style={{
                                                height: '100%',
                                                background: 'var(--success)',
                                                borderRadius: 3,
                                                width: `${((contract.totalAmount - contract.remainingAmount) / contract.totalAmount) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
                                <button
                                    onClick={() => setSelectedContract(contract)}
                                    className="btn btn-secondary btn-sm flex-1 gap-1"
                                    style={{ color: 'var(--primary)' }}
                                >
                                    <Eye size={15} /> جدول الأقساط
                                </button>
                                <button
                                    onClick={() => printContractLayout(contract)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: '#8B5CF6' }}
                                    title="طباعة العقد"
                                >
                                    <Printer size={15} />
                                </button>
                                <button
                                    onClick={() => handleDeleteContract(contract._id)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--danger)' }}
                                    title="حذف العقد"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full">
                        <div className="empty-state">
                            <div className="icon"><FileText size={48} /></div>
                            <p>لا توجد عقود تقسيط مسجلة</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Contract Installments Schedule Modal Snippet */}
            {selectedContract && (
                <div className="modal-overlay z-[100]">
                    <div className="modal-box" style={{ maxWidth: 800 }}>
                        <div className="modal-header">
                            <h2 className="font-black text-lg">جدول أقساط العقد #{selectedContract.contractNumber}</h2>
                            <button onClick={() => setSelectedContract(null)} className="btn btn-ghost" style={{ padding: 4 }}>×</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>رقم القسط</th>
                                            <th>تاريخ الاستحقاق</th>
                                            <th>المبلغ</th>
                                            <th>تاريخ السداد</th>
                                            <th>الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedContract.installments.map((inst, i) => (
                                            <tr key={i}>
                                                <td className="font-bold">قسط #{inst.installmentNumber}</td>
                                                <td style={{ fontSize: 13 }}>{new Date(inst.dueDate).toLocaleDateString('ar-EG')}</td>
                                                <td className="font-black" style={{ color: 'var(--primary)' }}>{inst.amount} ج</td>
                                                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                    {inst.paymentDate ? new Date(inst.paymentDate).toLocaleDateString('ar-EG') : '---'}
                                                </td>
                                                <td>
                                                    {inst.status === 'paid' && <span className="badge badge-success">مدفوع</span>}
                                                    {inst.status === 'overdue' && <span className="badge badge-danger">متأخر</span>}
                                                    {inst.status === 'pending' && <span className="badge badge-warning">مستحق</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
