import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-layout flex flex-col min-h-screen">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="page-content flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
