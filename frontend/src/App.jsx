import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import BarcodePrint from './pages/BarcodePrint';
import Installments from './pages/Installments';
import Motorcycles from './pages/Motorcycles';
import Scooters from './pages/Scooters';
import Capital from './pages/Capital';
import AdvancedReport from './pages/AdvancedReport';
import { Package, Droplet, Bike, Zap, Battery, CircleDashed, Link, Sparkles, BarChart3 } from 'lucide-react';

function ToasterWithTheme() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: isDark
          ? { background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', borderRadius: '16px' }
          : { background: '#FFFFFF', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <Router>
            <ToasterWithTheme />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout title="على بركة الله" />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/barcodes" element={<BarcodePrint />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/installments" element={<Installments />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/reports" element={<AdvancedReport type="all" title="تقرير جميع المبيعات" icon={BarChart3} color="#2563EB" />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/motorcycles" element={<Motorcycles />} />
                  <Route path="/scooters" element={<Scooters />} />
                  <Route path="/capital" element={<Capital />} />
                  
                  {/* Category Reports */}
                  <Route path="/reports/oils" element={<AdvancedReport type="oils" title="تقارير الزيوت" icon={Droplet} color="#10B981" />} />
                  <Route path="/reports/spare-parts" element={<AdvancedReport type="spare_parts" title="تقارير قطع الغيار" icon={Package} color="#F59E0B" />} />
                  <Route path="/reports/motorcycles" element={<AdvancedReport type="motorcycles" title="تقارير الموتسيكلات" icon={Bike} color="#F97316" />} />
                  <Route path="/reports/scooters" element={<AdvancedReport type="scooters" title="تقارير السكوترات" icon={Zap} color="#6366F1" />} />
                  <Route path="/reports/batteries" element={<AdvancedReport type="batteries" title="تقارير البطاريات" icon={Battery} color="#EF4444" />} />
                  <Route path="/reports/tires" element={<AdvancedReport type="tires" title="تقارير الإطارات" icon={CircleDashed} color="#8B5CF6" />} />
                  <Route path="/reports/accessories" element={<AdvancedReport type="accessories" title="تقارير الإكسسوارات" icon={Link} color="#06B6D4" />} />
                  <Route path="/reports/extras" element={<AdvancedReport type="extras" title="تقارير الكماليات" icon={Sparkles} color="#EC4899" />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
