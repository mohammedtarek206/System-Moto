import { useInstallments } from './Context';
import { printReceipt } from './PrintUtils';
import { Search, Calendar, CheckCircle2, Printer } from 'lucide-react';

export default function CollectionTab() {
    const {
        collectionSearch, setCollectionSearch, handleCollectionSearch, searchResults,
        setPaymentForm, setPaymentModalOpen, receiptData
    } = useInstallments();

    return (
        <div className="space-y-6 fade-in">
            {/* Quick Collection search bar */}
            <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center mb-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="البحث بالهاتف، اسم العميل، أو رقم العقد للتحصيل الفوري..."
                        value={collectionSearch}
                        onChange={(e) => setCollectionSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCollectionSearch()}
                        className="form-input w-full"
                        style={{ paddingRight: 45, height: 48, fontSize: 14 }}
                    />
                </div>
                <button
                    onClick={handleCollectionSearch}
                    className="btn btn-primary px-8 w-full sm:w-auto h-[48px]"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                    البحث وتحصيل القسط
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {searchResults.length > 0 ? (
                        searchResults.map(contract => (
                            <div key={contract._id} className="glass-card p-5 sm:p-6" style={{ borderRadius: 16 }}>
                                <div className="flex justify-between items-start border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
                                    <div>
                                        <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)' }}>عقد نشط: {contract.contractNumber}</span>
                                        <h4 className="font-black text-lg mt-3" style={{ color: 'var(--text-primary)' }}>{contract.customer?.name}</h4>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                                            هاتف: {contract.customer?.phone} | موتوسيكل: {contract.motorcycleBrand} {contract.motorcycleModel}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>المتبقي الكلي بالعقد</span>
                                        <h3 className="font-black text-2xl mt-1" style={{ color: '#F97316' }}>{contract.remainingAmount} ج</h3>
                                    </div>
                                </div>

                                {/* Timeline of payments */}
                                <div className="space-y-4">
                                    <h4 className="font-black text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Calendar size={16} style={{ color: 'var(--primary)' }} /> مخطط واستحقاق الأقساط
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {contract.installments.map((inst, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
                                                <div>
                                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>القسط رقم {inst.installmentNumber}</p>
                                                    <p className="font-black text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{inst.amount} ج</p>
                                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>الاستحقاق: {new Date(inst.dueDate).toLocaleDateString('ar-EG')}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 text-left">
                                                    <span className={`badge ${inst.status === 'paid' ? 'badge-success' :
                                                            inst.status === 'overdue' ? 'badge-danger animate-pulse' : 'badge-warning'
                                                        }`}
                                                    >
                                                        {inst.status === 'paid' ? 'مدفوع' : inst.status === 'overdue' ? 'متأخر' : 'مستحق'}
                                                    </span>
                                                    {inst.status !== 'paid' && (
                                                        <button
                                                            onClick={() => {
                                                                setPaymentForm({
                                                                    contractId: contract._id,
                                                                    installmentNumber: inst.installmentNumber,
                                                                    paymentMethod: 'cash',
                                                                    notes: ''
                                                                });
                                                                setPaymentModalOpen(true);
                                                            }}
                                                            className="btn btn-primary btn-sm text-xs font-bold px-3 py-1.5"
                                                            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 8 }}
                                                        >
                                                            تحصيل فوري
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>قم بالبحث أعلاه عن رقم العقد، اسم العميل، أو الهاتف للتحصيل</p>
                        </div>
                    )}
                </div>

                {/* Generated collection receipt */}
                <div className="lg:col-span-1">
                    {receiptData ? (
                        <div className="glass-card p-6" style={{ borderRadius: 16, position: 'sticky', top: 24 }}>
                            <div className="text-center border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
                                <CheckCircle2 size={40} className="mx-auto animate-bounce mb-3" style={{ color: 'var(--success)' }} />
                                <h3 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>تم إثبات السداد</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>إيصال دفع آمن</p>
                            </div>

                            <div className="space-y-3 font-bold" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                <div className="flex justify-between"><span className="text-muted">رقم العقد:</span><span style={{ color: 'var(--text-primary)' }}>{receiptData.contractNumber}</span></div>
                                <div className="flex justify-between"><span className="text-muted">العميل:</span><span style={{ color: 'var(--text-primary)' }}>{receiptData.customerName}</span></div>
                                <div className="flex justify-between"><span className="text-muted">المركبة:</span><span style={{ color: 'var(--text-primary)' }}>{receiptData.brand} {receiptData.model}</span></div>
                                <div className="flex justify-between border-t pt-2 mt-2" style={{ borderColor: 'var(--border)' }}><span className="text-muted">المبلغ المدفوع:</span><span className="font-black" style={{ color: 'var(--success)' }}>{receiptData.amount} ج</span></div>
                                <div className="flex justify-between"><span className="text-muted">المتبقي الكلي بالعقد:</span><span className="font-bold">{receiptData.remainingAmount} ج</span></div>
                            </div>

                            <button
                                onClick={() => printReceipt(receiptData)}
                                className="btn btn-secondary w-full gap-2 mt-6"
                                style={{ color: '#8B5CF6' }}
                            >
                                <Printer size={18} />
                                طباعة إيصال التحصيل
                            </button>
                        </div>
                    ) : (
                        <div className="glass-card border-dashed p-8 h-96 flex flex-col items-center justify-center text-center text-muted" style={{ borderRadius: 16, borderColor: 'var(--border)' }}>
                            <Printer size={48} className="mb-4 opacity-50" />
                            <p className="font-bold" style={{ fontSize: 13, lineHeight: 1.6 }}>بمجرد تحصيل قسط بنجاح، سيظهر إيصال استلام النقدية المنسق هنا للطباعة.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
