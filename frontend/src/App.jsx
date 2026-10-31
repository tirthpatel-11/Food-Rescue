import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import Donors from './pages/Donors';
import NGOs from './pages/NGOs';
import Beneficiaries from './pages/Beneficiaries';
import FoodItems from './pages/FoodItems';
import Donations from './pages/Donations';
import Requests from './pages/Requests';
import Deliveries from './pages/Deliveries';
import Partners from './pages/Partners';
import StorageUnits from './pages/StorageUnits';

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGlobalRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Persistent Sidebar */}
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
          <Navbar
            setMobileOpen={setMobileOpen}
            onRefresh={handleGlobalRefresh}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" key={refreshKey}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/donors" element={<Donors />} />
              <Route path="/ngos" element={<NGOs />} />
              <Route path="/beneficiaries" element={<Beneficiaries />} />
              <Route path="/food-items" element={<FoodItems />} />
              <Route path="/donations" element={<Donations />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/deliveries" element={<Deliveries />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/storage-units" element={<StorageUnits />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
