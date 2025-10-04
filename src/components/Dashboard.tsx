
import { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from './Sidebar';
import DashboardPage from './pages/DashboardPage';
import PropertyManagement from './pages/PropertyManagement';
import TenantManagement from './pages/TenantManagement';
import LeaseManagement from './pages/LeaseManagement';
import RentTracking from './pages/RentTracking';
import BillingReports from './pages/BillingReports';
import ProblemReporting from './pages/ProblemReporting';
import { DocumentManager } from './DocumentManager';
import ExpenseTracking from './pages/ExpenseTracking';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavigateToSection = (section: string) => {
    setActiveTab(section);
  };

  const renderContent = () => {

    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigateToSection={handleNavigateToSection} user={user} />;
      case 'properties':
        return <PropertyManagement />;
      case 'tenants':
        return <TenantManagement />;
      case 'leases':
        return <LeaseManagement onNavigateToRentTracking={() => setActiveTab('rent-tracking')} />;
      case 'rent-tracking':
        return <RentTracking user={user} />;
      case 'expense-tracking':
        return <ExpenseTracking />;
      case 'billing':
        return <BillingReports />;
      case 'problems':
        return <ProblemReporting />;
      case 'documents':
        return <DocumentManager />;
      default:
        return <DashboardPage onNavigateToSection={handleNavigateToSection} user={user} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user}
          onLogout={onLogout}
        />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-y-auto p-8 bg-background">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
