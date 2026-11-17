import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { SourcesPage } from './pages/SourcesPage';
import { ExposPage } from './pages/ExposPage';
import { ExpoDetailPage } from './pages/ExpoDetailPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
        {/* Modern Clean Sidebar Navigation */}
        <Sidebar
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        {/* Content Area with Standard Left Padding for Sidebar */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Sticky Header with Dynamic Page Info & Status */}
          <Header onMenuClick={() => setIsMobileOpen(true)} />

          {/* Main Routed Page Content */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/expos" element={<ExposPage />} />
              <Route path="/expos/:id" element={<ExpoDetailPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
