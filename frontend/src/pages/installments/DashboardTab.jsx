import { useInstallments } from './Context';
import { FileText, Coins, AlertTriangle, TrendingUp, ArrowRightLeft, FileCode, ShieldAlert, CheckSquare, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function DashboardTab() {
    const { stats, setActiveTab, setContractModalOpen, setReportType } = useInstallments();

    return (
        <div className="space-y-6 fade-in">
            {/* Stat Cards - Design system standard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'إجمالي العقود', value: `${stats.totalContracts}`, desc: 'عقد مسجل', icon: FileText, color: 'var(--primary)' },
                    { label: 'المبالغ المتبقية', value: `${stats.totalRemaining} ج`, desc: 'إجمالي الديون القائمة', icon: Coins, color: 'var(--danger)' },
                    { label: 'أقساط متأخرة', value: `${stats.overdueCount}`, desc: 'قسط מתأخر', icon: AlertTriangle, color: 'var(--warning)', glow: stats.overdueCount > 0 },
                    { label: 'مقبوضات اليوم', value: `${stats.paidToday} ج`, desc: 'إجمالي التحصيل اليوم', icon: TrendingUp, color: 'var(--success)' },
                ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="stat-card" style={{ borderTopWidth: 3, borderTopColor: card.color }}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 44, height: 44, borderRadius: 12 }}>
                                    <Icon size={22} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black mt-2">{card.value}</h3>
                            <p className="form-label mt-1 mb-0">{card.label}</p>
                            <p className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{card.desc}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="lg:col-span-2 glass-card p-5" style={{ borderRadius: 16 }}>
                    <div className="mb-4">
                        <h3 className="font-black text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                            مؤشر التحصيل (6 أشهر)
                        </h3>
                    </div>
                    <div style={{ height: 260 }}>
                        {stats.chartData && stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="collections" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCollections)" name="التحصيل" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted" style={{ fontSize: 13 }}>لا توجد بيانات بيانية متاحة</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions & Feed */}
                <div className="space-y-6">
                    <div className="glass-card p-5" style={{ borderRadius: 16 }}>
                        <h3 className="font-black text-sm mb-4 border-b pb-3" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>إجراءات سريعة</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setActiveTab('collection')} className="btn btn-secondary flex-col h-auto py-3 gap-2" style={{ borderRadius: 12 }}>
                                <ArrowRightLeft size={20} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: 11 }}>تحصيل سريع</span>
                            </button>
                            <button onClick={() => setContractModalOpen(true)} className="btn btn-secondary flex-col h-auto py-3 gap-2" style={{ borderRadius: 12 }}>
                                <FileCode size={20} style={{ color: '#8B5CF6' }} />
                                <span style={{ fontSize: 11 }}>جدولة عقد</span>
                            </button>
                            <button onClick={() => { setActiveTab('reports'); setReportType('overdue'); }} className="btn btn-secondary flex-col h-auto py-3 gap-2" style={{ borderRadius: 12 }}>
                                <ShieldAlert size={20} style={{ color: 'var(--warning)' }} />
                                <span style={{ fontSize: 11 }}>المتأخرات</span>
                            </button>
                            <button onClick={() => { setActiveTab('reports'); setReportType('collection'); }} className="btn btn-secondary flex-col h-auto py-3 gap-2" style={{ borderRadius: 12 }}>
                                <CheckSquare size={20} style={{ color: 'var(--success)' }} />
                                <span style={{ fontSize: 11 }}>المقبوضات</span>
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-5 flex-1" style={{ borderRadius: 16 }}>
                        <h3 className="font-black text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                            تحصيلات اليوم
                        </h3>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {stats.recentPayments && stats.recentPayments.length > 0 ? (
                                stats.recentPayments.map((pay, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
                                        <div>
                                            <div className="font-bold" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{pay.customerName}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>عقد #{pay.contractNumber} | قسط {pay.installmentNumber}</div>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black" style={{ fontSize: 12, color: 'var(--success)' }}>+{pay.amount} ج</div>
                                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{new Date(pay.paymentDate).toLocaleTimeString('ar-EG')}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-muted" style={{ fontSize: 12 }}>لا توجد مقبوضات لليوم حتى الآن</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
