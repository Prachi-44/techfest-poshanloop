import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import ChildRegistryPage from './pages/ChildRegistryPage';
import ChildDetailPage from './pages/ChildDetailPage';
import TrustGatePage from './pages/TrustGatePage';
import BlindSpotPage from './pages/BlindSpotPage';
import ReferralWorklistPage from './pages/ReferralWorklistPage';
import CaseDetailPage from './pages/CaseDetailPage';
import FacilityDeskPage from './pages/FacilityDeskPage';
import OfflineQueuePage from './pages/OfflineQueuePage';
import CauseFinderPage from './pages/CauseFinderPage';
import SupervisorViewPage from './pages/SupervisorViewPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="children" element={<ChildRegistryPage />} />
        <Route path="children/:id" element={<ChildDetailPage />} />
        <Route path="trust-gate" element={<TrustGatePage />} />
        <Route path="blindspot" element={<BlindSpotPage />} />
        <Route path="referrals" element={<ReferralWorklistPage />} />
        <Route path="referrals/:id" element={<CaseDetailPage />} />
        <Route path="facility" element={<FacilityDeskPage />} />
        <Route path="offline" element={<OfflineQueuePage />} />
        <Route path="cause-finder" element={<CauseFinderPage />} />
        <Route path="supervisor" element={<SupervisorViewPage />} />
      </Route>
    </Routes>
  );
}

