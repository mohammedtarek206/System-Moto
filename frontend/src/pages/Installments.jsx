import { InstallmentsProvider, useInstallments } from './installments/Context';
import { Home, Users, FileText, Banknote, BarChart3 } from 'lucide-react';
import DashboardTab from './installments/DashboardTab';
import CustomersTab from './installments/CustomersTab';
import ContractsTab from './installments/ContractsTab';
import CollectionTab from './installments/CollectionTab';
import ReportsTab from './installments/ReportsTab';
import Modals from './installments/Modals';

function InstallmentsContent() {
  const { activeTab, setActiveTab } = useInstallments();

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: Home, color: 'var(--primary)' },
    { id: 'customers', label: 'عملاء التقسيط', icon: Users, color: '#3B82F6' },
    { id: 'contracts', label: 'العقود ومتابعتها', icon: FileText, color: '#F97316' },
    { id: 'collection', label: 'التحصيل والسداد', icon: Banknote, color: '#10B981' },
    { id: 'reports', label: 'التقارير المالية', icon: BarChart3, color: '#8B5CF6' }
  ];

  return (
    <div className="space-y-6 fade-in h-full flex flex-col">
      {/* Module Header */}
      <div>
        <h1 className="page-title flex items-center gap-3">
          <span style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            نظام التقسيط والمحصلات
          </span>
        </h1>
        <p className="page-subtitle mt-1">إدارة شاملة لعقود التقسيط، جدولات السداد، ومتابعة متأخرات العملاء</p>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card p-2" style={{ borderRadius: 16 }}>
        <div className="flex flex-wrap md:flex-nowrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl transition-all font-bold duration-300 text-sm`}
                style={{
                  background: isActive ? tab.color : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: isActive ? 'none' : '1px solid transparent',
                  boxShadow: isActive ? `0 8px 16px ${tab.color}33` : 'none'
                }}
              >
                <Icon size={16} />
                <span className={isActive ? 'font-black' : 'font-semibold'}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Nested Current Tab Context */}
      <div className="flex-1">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'contracts' && <ContractsTab />}
        {activeTab === 'collection' && <CollectionTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>

      {/* Independent Modals injected at root level Context */}
      <Modals />
    </div >
  );
}

// Ensure contextual Wrapper
export default function Installments() {
  return (
    <InstallmentsProvider>
      <InstallmentsContent />
    </InstallmentsProvider>
  );
}
