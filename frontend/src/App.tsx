import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { SourcesPage } from './pages/SourcesPage';
import { ExposPage } from './pages/ExposPage';
import { ExpoDetailPage } from './pages/ExpoDetailPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        {/* Top Navbar with React Router NavLinks */}
        <Navbar />

        {/* Main Routed Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </BrowserRouter>
  );
}
