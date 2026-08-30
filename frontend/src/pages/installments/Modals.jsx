import { useInstallments } from './Context';
import { Users, FileText, CheckCircle, X, Sparkles, ChevronRight, ChevronLeft, Upload, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modals() {
    const {
        customerModalOpen, setCustomerModalOpen, customerForm, setCustomerForm,
        handleCustomerSubmit, isSubmitting, customerFiles, handleFileChange,
        nationalIdPreview, contractDocPreview,
        contractModalOpen, setContractModalOpen, contractStep, setContractStep,
        contractForm, setContractForm, customers, handleContractSubmit, contractPreview,
        paymentModalOpen, setPaymentModalOpen, paymentForm, setPaymentForm, handlePaymentSubmit
    } = useInstallments();

    return (
        <AnimatePresence>
            {/* 1. Add Customer Modal */}
            {customerModalOpen && (
                <div className="modal-overlay z-[100]">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box" style={{ maxWidth: 800 }}>
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="stat-icon" style={{ width: 40, height: 40, background: 'rgba(59,130,246,0.1)', color: 'var(--primary)' }}>
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="font-black text-lg">تسجيل عميل تقسيط جديد</h2>
                                    <p className="text-muted" style={{ fontSize: 12 }}>تعبئة البيانات الشخصية ورفع المستندات الرسمية للعميل</p>
                                </div>
                            </div>
                            <button onClick={() => setCustomerModalOpen(false)} className="btn btn-ghost" style={{ padding: 6 }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCustomerSubmit} className="modal-body space-y-5" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">الاسم بالكامل <span className="text-danger">*</span></label>
                                    <input type="text" required className="form-input" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رقم الهاتف الجوال <span className="text-danger">*</span></label>
                                    <input type="text" required className="form-input" style={{ fontFamily: 'monospace' }} value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                <div className="form-group">
                                    <label className="form-label">الرقم القومي (14 رقم) <span className="text-danger">*</span></label>
                                    <input type="text" required maxLength={14} className="form-input" style={{ fontFamily: 'monospace' }} value={customerForm.nationalId} onChange={e => setCustomerForm({ ...customerForm, nationalId: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الوظيفة أو العمل</label>
                                    <input type="text" className="form-input" value={customerForm.job} onChange={e => setCustomerForm({ ...customerForm, job: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                <label className="form-label">محل الإقامة والسكن الحالي بالتفصيل</label>
                                <input type="text" className="form-input" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                <div className="form-group">
                                    <label className="form-label">الضامن الكفيل للعميل</label>
                                    <input type="text" className="form-input" value={customerForm.guarantor} onChange={e => setCustomerForm({ ...customerForm, guarantor: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رقم هاتف الضامن الجوال</label>
                                    <input type="text" className="form-input" style={{ fontFamily: 'monospace' }} value={customerForm.guarantorPhone} onChange={e => setCustomerForm({ ...customerForm, guarantorPhone: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                <div>
                                    <label className="form-label">صورة بطاقة الرقم القومي</label>
                                    <label className="border dashed rounded-xl p-4 flex gap-2 items-center justify-center cursor-pointer mb-2 text-muted" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
                                        <Upload size={16} /><span style={{ fontSize: 13 }}>{customerFiles.nationalIdImage ? customerFiles.nationalIdImage.name : 'اسحب أو اختر صورة'}</span>
                                        <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'nationalIdImage')} hidden />
                                    </label>
                                    {nationalIdPreview && <div className="h-24 w-full rounded-xl overflow-hidden border"><img src={nationalIdPreview} className="w-full h-full object-cover" alt="Preview" /></div>}
                                </div>
                                <div>
                                    <label className="form-label">صورة إيصال الضمان / الوصل الموقّع</label>
                                    <label className="border dashed rounded-xl p-4 flex gap-2 items-center justify-center cursor-pointer mb-2 text-muted" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
                                        <Upload size={16} /><span style={{ fontSize: 13 }}>{customerFiles.contractImage ? customerFiles.contractImage.name : 'اسحب أو اختر صورة'}</span>
                                        <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'contractImage')} hidden />
                                    </label>
                                    {contractDocPreview && <div className="h-24 w-full rounded-xl overflow-hidden border"><img src={contractDocPreview} className="w-full h-full object-cover" alt="Preview" /></div>}
                                </div>
                            </div>
                            <div className="modal-footer flex gap-3">
                                <button type="button" onClick={() => setCustomerModalOpen(false)} className="btn btn-secondary flex-1">إلغاء</button>
                                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                                    {isSubmitting ? <RefreshCw className="loading-spin" size={16} /> : 'تأكيد وحفظ العميل'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* 2. Create Contract Modal */}
            {contractModalOpen && (
                <div className="modal-overlay z-[100]">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box" style={{ maxWidth: 860 }}>
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="stat-icon" style={{ width: 40, height: 40, background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="font-black text-lg">إنشاء عقد تقسيط جديد</h2>
                                    <p className="text-muted" style={{ fontSize: 12 }}>إعداد الشروط والأقساط خطوة بخطوة</p>
                                </div>
                            </div>
                            <button onClick={() => { setContractModalOpen(false); setContractStep(1); }} className="btn btn-ghost" style={{ padding: 6 }}><X size={20} /></button>
                        </div>

                        <div className="p-4 bg-muted border-b flex justify-between" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}>
                            {[
                                { step: 1, label: 'بيانات العميل' },
                                { step: 2, label: 'المركبة وتفاصيلها' },
                                { step: 3, label: 'الجدولة والفائدة' }
                            ].map(s => (
                                <div key={s.step} className="flex items-center gap-2" style={{ opacity: contractStep === s.step ? 1 : 0.5 }}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: contractStep === s.step ? '#F97316' : 'var(--bg-card)', color: contractStep === s.step ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)' }}>{s.step}</div>
                                    <span className="font-bold hidden sm:inline" style={{ fontSize: 13 }}>{s.label}</span>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleContractSubmit} className="modal-body space-y-6" style={{ minHeight: 300 }}>
                            {contractStep === 1 && (
                                <div className="space-y-4 fade-in">
                                    <div className="form-group">
                                        <label className="form-label">اختر العميل</label>
                                        <select required value={contractForm.customerId} onChange={(e) => setContractForm({ ...contractForm, customerId: e.target.value })} className="form-input focus:border-red-600">
                                            <option value="">-- اختر العميل --</option>
                                            {customers.map(c => (
                                                <option key={c._id} value={c._id}>{c.name} - رقم قومي: {c.nationalId}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">تاريخ بدء سريان العقد واستحقاق أول قسط</label>
                                        <input type="date" required value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} className="form-input" />
                                    </div>
                                </div>
                            )}

                            {contractStep === 2 && (
                                <div className="space-y-4 fade-in">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">ماركة / شركة الموتوسيكل</label>
                                            <input type="text" required placeholder="دايون، حلاوة..." value={contractForm.motorcycleBrand} onChange={e => setContractForm({ ...contractForm, motorcycleBrand: e.target.value })} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">طراز وموديل الموتوسيكل</label>
                                            <input type="text" required placeholder="مثال: 4, 3..." value={contractForm.motorcycleModel} onChange={e => setContractForm({ ...contractForm, motorcycleModel: e.target.value })} className="form-input" />
                                        </div>
                                    </div>
                                    <div className="form-group border-t pt-4 mt-2" style={{ borderColor: 'var(--border)' }}>
                                        <label className="form-label">سعر الكاش الفعلي للموتوسيكل</label>
                                        <input type="number" required placeholder="السعر قبل الفوائد" value={contractForm.cashPrice} onChange={e => setContractForm({ ...contractForm, cashPrice: e.target.value })} className="form-input" style={{ color: 'var(--primary)', fontWeight: 'bold' }} />
                                    </div>
                                </div>
                            )}

                            {contractStep === 3 && (
                                <div className="space-y-6 fade-in">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">المقدم المدفوع</label>
                                            <input type="number" required value={contractForm.downPayment} onChange={e => setContractForm({ ...contractForm, downPayment: e.target.value })} className="form-input font-bold" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">عدد شهور التقسيط</label>
                                            <select value={contractForm.monthsCount} onChange={e => setContractForm({ ...contractForm, monthsCount: e.target.value })} className="form-input font-bold">
                                                <option value="6">6 شهور</option>
                                                <option value="12">12 شهر</option>
                                                <option value="18">18 شهر</option>
                                                <option value="24">24 شهر</option>
                                                <option value="36">36 شهر</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">نسبة الفائدة الكلية</label>
                                            <div className="relative">
                                                <input type="number" required value={contractForm.interestRate} onChange={e => setContractForm({ ...contractForm, interestRate: e.target.value })} className="form-input font-bold" />
                                                <span className="absolute left-4 top-3 text-muted">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
                                        <h4 className="font-black text-sm mb-4 pb-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                                            <Sparkles size={16} style={{ color: 'var(--warning)' }} /> ملخص التدقيق للجدولة
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div><div className="text-muted" style={{ fontSize: 11 }}>المبلغ المتبقي للتقسيط</div><div className="font-black mt-1" style={{ fontSize: 16 }}>{contractPreview().principal} ج</div></div>
                                            <div><div className="text-muted" style={{ fontSize: 11 }}>مجموع الفائدة الإجمالي</div><div className="font-black mt-1 text-danger">+{contractPreview().interestAmt} ج</div></div>
                                            <div><div className="text-muted" style={{ fontSize: 11 }}>إجمالي المتبقي المجدول</div><div className="font-black mt-1 text-success">{contractPreview().totalRemaining} ج</div></div>
                                            <div><div className="text-muted" style={{ fontSize: 11 }}>قيمة القسط الشهري</div><div className="font-black mt-1 text-primary" style={{ fontSize: 18 }}>{contractPreview().monthly} ج</div></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="modal-footer flex gap-2 pt-4">
                                {contractStep > 1 && (
                                    <button type="button" onClick={() => setContractStep(p => p - 1)} className="btn btn-ghost gap-2">
                                        <ChevronRight size={16} /> العودة
                                    </button>
                                )}
                                <div style={{ flex: 1 }}></div>
                                <button type="button" onClick={() => { setContractModalOpen(false); setContractStep(1); }} className="btn btn-secondary">إلغاء</button>
                                {contractStep < 3 ? (
                                    <button type="button" onClick={() => setContractStep(p => p + 1)} className="btn btn-primary gap-2" style={{ background: '#F97316' }}>
                                        التالي <ChevronLeft size={16} />
                                    </button>
                                ) : (
                                    <button type="submit" disabled={isSubmitting} className="btn btn-primary gap-2" style={{ background: '#F97316' }}>
                                        {isSubmitting ? <RefreshCw className="loading-spin" size={16} /> : 'تسجيل وتوقيع العقد'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* 3. Payment Collection Modal */}
            {paymentModalOpen && (
                <div className="modal-overlay z-[100]">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-box" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="stat-icon" style={{ width: 40, height: 40, background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <h2 className="font-black text-lg">إثبات تحصيل قسط</h2>
                                    <p className="text-muted" style={{ fontSize: 12 }}>تسجيل المقبوضات النقدية وتحديث حساب العميل</p>
                                </div>
                            </div>
                            <button onClick={() => setPaymentModalOpen(false)} className="btn btn-ghost" style={{ padding: 6 }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="modal-body space-y-4">
                            <div className="form-group">
                                <label className="form-label">طريقة السداد واستلام النقدية</label>
                                <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} className="form-input">
                                    <option value="cash">نقداً (كاش المحل)</option>
                                    <option value="card">بطاقة دفع (فيزا / ماستركارد)</option>
                                    <option value="transfer">تحويل محفظة (فودافون كاش / إنستاباي)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">ملاحظات إضافية (اختياري)</label>
                                <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="form-input" style={{ minHeight: 80 }} placeholder="فروقات التحصيل أو التواريخ..." />
                            </div>
                            <div className="modal-footer flex gap-2 pt-4 border-t mt-6" style={{ borderColor: 'var(--border)' }}>
                                <button type="button" onClick={() => setPaymentModalOpen(false)} className="btn btn-secondary flex-1">إلغاء</button>
                                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                                    {isSubmitting ? <RefreshCw className="loading-spin" size={16} /> : 'تأكيد السداد والتحصيل'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
