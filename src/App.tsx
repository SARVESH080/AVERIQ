import React from 'react';
import { Layout } from './components/Layout';
import { AveriqProvider, useAveriq } from './context/AveriqContext';
import { AgentMonitoringPage } from './pages/AgentMonitoringPage';
import { AmbulanceFleetPage } from './pages/AmbulanceFleetPage';
import { DispatchHistoryPage } from './pages/DispatchHistoryPage';
import { EmergencyManagementPage } from './pages/EmergencyManagementPage';
import { HospitalNetworkPage } from './pages/HospitalNetworkPage';
import { OverviewPage } from './pages/OverviewPage';
import { SystemAlertsPage } from './pages/SystemAlertsPage';

const ActiveView: React.FC = () => {
  const { activeSection } = useAveriq();

  switch (activeSection) {
    case 'overview':
      return <OverviewPage />;
    case 'emergency-management':
      return <EmergencyManagementPage />;
    case 'ambulance-fleet':
      return <AmbulanceFleetPage />;
    case 'hospital-network':
      return <HospitalNetworkPage />;
    case 'agent-monitoring':
      return <AgentMonitoringPage />;
    case 'dispatch-history':
      return <DispatchHistoryPage />;
    case 'system-alerts':
      return <SystemAlertsPage />;
    default:
      return <OverviewPage />;
  }
};

export function App() {
  return (
    <AveriqProvider>
      <Layout>
        <ActiveView />
      </Layout>
    </AveriqProvider>
  );
}

export default App;
