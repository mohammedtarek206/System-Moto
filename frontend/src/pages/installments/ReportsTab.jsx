import { useInstallments } from './Context';
import { Printer } from 'lucide-react';

export default function ReportsTab() {
    const { reportType, setReportType, fetchReports, reportData, loading, stats } = useInstallments();

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-wrap gap-2 glass-card p-2" style={{ borderRadius: 16 }}>
                {[
                    { id: 'summary', label: 'ملخص المحفظة' },
                    { id: 'overdue', label: 'الأقساط المتأخرة' },
                    { id: 'collection', label: 'التحصيل اليومي' },
                    { id: 'active', label: 'العقود النشطة' },
                    { id: 'completed', label: 'العقود المكتملة' },
                ].map(rep => (
                    <button
                        key={rep.id}
                        onClick={() => {
                            setReportType(rep.id);
                            if (rep.id !== 'summary') fetchReports(rep.id);
                        }}
                        className={`btn ${reportType === rep.id ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ borderRadius: 12, flex: 1, minWidth: 120 }}
                    >
                        {rep.label}
                    </button>
                ))}
            </div>

            <div className="glass-card p-5 sm:p-6" style={{ borderRadius: 16 }}>
                <div className="flex justify-between items-center border-b pb-5 mb-6" style={{ borderColor: 'var(--border)' }}>
                    <div>
                        <h3 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
                            {reportType === 'summary' && 'تقرير ملخص محفظة التقسيط'}
                            {reportType === 'overdue' && 'تقرير أقساط العملاء المتأخرة'}
                            {reportType === 'collection' && 'تقرير تحصيل الأقساط والمقبوضات اليومية'}
                            {reportType === 'active' && 'تقرير عقود التقسيط النشطة الحالية'}
                            {reportType === 'completed' && 'تقرير عقود التقسيط المكتملة بالكامل'}
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>توليد تلقائي للبيانات والتحليلات بالسيستم</p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="btn btn-secondary gap-2"
                    >
                        <Printer size={16} /> طباعة التقرير
                    </button>
                </div>

                {reportType === 'summary' ? (
                    <div className="space-y-6 fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="p-5 border rounded-xl" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
                                <p className="font-bold text-muted mb-1" style={{ fontSize: 12 }}>إجمالي عملاء التقسيط</p>
                                <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.customersCount} عميل</h3>
                            </div>
                            <div className="p-5 border rounded-xl" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
                                <p className="font-bold text-muted mb-1" style={{ fontSize: 12 }}>إجمالي الأرباح المتوقعة (الفوائد)</p>
                                <h3 className="text-2xl font-black" style={{ color: 'var(--success)' }}>{stats.totalProfits} ج</h3>
                            </div>
                            <div className="p-5 border rounded-xl" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
                                <p className="font-bold text-muted mb-1" style={{ fontSize: 12 }}>إجمالي مبالغ الأقساط القائمة</p>
                                <h3 className="text-2xl font-black" style={{ color: 'var(--danger)' }}>{stats.totalRemaining} ج</h3>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>رقم العقد</th>
                                    <th>العميل المستفيد</th>
                                    {reportType === 'overdue' && <th>القسط المتأخر</th>}
                                    {reportType === 'overdue' && <th>تاريخ الاستحقاق</th>}
                                    {reportType === 'overdue' && <th>أيام التأخير</th>}
                                    {reportType === 'collection' && <th>تاريخ السداد</th>}
                                    {reportType === 'collection' && <th>طريقة السداد</th>}
                                    {(reportType === 'active' || reportType === 'completed') && <th>المركبة</th>}
                                    {(reportType === 'active' || reportType === 'completed') && <th>تاريخ الانتهاء</th>}
                                    <th>المبلغ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center p-8 text-muted font-bold">جاري تحميل وتلخيص بيانات التقرير...</td></tr>
                                ) : reportData.length > 0 ? (
                                    reportData.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="font-black" style={{ color: 'var(--primary)' }}>{row.contractNumber || row.contract?.contractNumber}</td>
                                            <td className="font-bold">{row.customerName || row.customer?.name}</td>
                                            {reportType === 'overdue' && <td className="font-bold" style={{ color: 'var(--warning)' }}>قسط رقم {row.installmentNumber}</td>}
                                            {reportType === 'overdue' && <td style={{ fontSize: 13 }}>{new Date(row.dueDate).toLocaleDateString('ar-EG')}</td>}
                                            {reportType === 'overdue' && <td className="font-black" style={{ color: 'var(--danger)' }}>{row.delayDays} يوم تأخير</td>}
                                            {reportType === 'collection' && <td style={{ fontSize: 13 }}>{new Date(row.paymentDate).toLocaleDateString('ar-EG')}</td>}
                                            {reportType === 'collection' && <td style={{ fontSize: 13 }}>{row.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة/تحويل'}</td>}
                                            {(reportType === 'active' || reportType === 'completed') && <td style={{ fontSize: 13 }}>{row.motorcycleBrand} {row.motorcycleModel}</td>}
                                            {(reportType === 'active' || reportType === 'completed') && <td style={{ fontSize: 13 }}>{new Date(row.endDate).toLocaleDateString('ar-EG')}</td>}
                                            <td className="font-black text-success">
                                                {row.amount || row.remainingAmount || row.monthlyInstallment} ج
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="text-center p-12 text-muted font-bold">لا توجد بيانات مسجلة مطابقة لشروط التقرير</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
