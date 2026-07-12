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
import OilReports from './pages/OilReports';
import SparePartsReports from './pages/SparePartsReports';
import MotorcycleReports from './pages/MotorcycleReports';
import ScooterReports from './pages/ScooterReports';

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
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/motorcycles" element={<Motorcycles />} />
                  <Route path="/scooters" element={<Scooters />} />
                  <Route path="/capital" element={<Capital />} />
                  <Route path="/reports/oils" element={<OilReports />} />
                  <Route path="/reports/spare-parts" element={<SparePartsReports />} />
                  <Route path="/reports/motorcycles" element={<MotorcycleReports />} />
                  <Route path="/reports/scooters" element={<ScooterReports />} />
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
