
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProductList, { AddItemForm } from './components/ProductList';
import Reports from './components/Reports';
import Settings from './components/Settings';
import InventoryHistory, { PurchaseForm, OutwardForm } from './components/Inventory';
import Accounts from './components/Accounts';
import { InventoryProvider } from './hooks/useInventory';
import { UserRole } from './types';
import type { User } from './types';
import { USERS } from './constants';
import Modal from './components/shared/Modal';


const App: React.FC = () => {
  const [activeView, setActiveView] = useState('Dashboard');
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); // Default to Admin
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [isOutwardModalOpen, setOutwardModalOpen] = useState(false);
  const [isItemModalOpen, setItemModalOpen] = useState(false);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if(sidebarOpen) setSidebarOpen(false);
  };

  const handleRoleChange = (role: UserRole) => {
    const user = USERS.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      setActiveView('Dashboard'); 
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard setActiveView={handleViewChange} />;
      case 'Stock':
        return <ProductList />;
      case 'Outward':
        return <InventoryHistory />;
      case 'Reports':
        return <Reports />;
      case 'Settings':
        return <Settings />;
      case 'Accounts':
        return <Accounts />;
      default:
        return <Dashboard setActiveView={handleViewChange} />;
    }
  };

  const allowedViews = useMemo(() => {
    const allViews = ['Dashboard', 'Stock', 'Outward', 'Reports', 'Settings', 'Accounts'];
    if (currentUser.role === UserRole.STAFF) {
      return ['Dashboard', 'Stock', 'Outward'];
    }
    if (currentUser.role === UserRole.MANAGER) {
      return ['Dashboard', 'Stock', 'Outward', 'Reports', 'Accounts'];
    }
    return allViews; // Admin
  }, [currentUser.role]);

  return (
    <InventoryProvider>
      <div className="flex h-screen bg-background text-text-primary">
        <Sidebar 
          activeView={activeView} 
          onViewChange={handleViewChange} 
          userRole={currentUser.role}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            activeView={activeView}
            currentUser={currentUser} 
            onRoleChange={handleRoleChange} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onNewPurchase={() => setPurchaseModalOpen(true)}
            onNewOutward={() => setOutwardModalOpen(true)}
            onNewItem={() => setItemModalOpen(true)}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {allowedViews.includes(activeView) ? renderView() : <div className="text-center p-8 bg-card rounded-lg shadow-md">You do not have permission to view this page.</div>}
            </div>
          </main>
        </div>
      </div>
       <Modal title="New Stock Inward (Purchase)" isOpen={isPurchaseModalOpen} onClose={() => setPurchaseModalOpen(false)}>
          <PurchaseForm onClose={() => setPurchaseModalOpen(false)} />
        </Modal>
        <Modal title="New Stock Outward" isOpen={isOutwardModalOpen} onClose={() => setOutwardModalOpen(false)}>
          <OutwardForm onClose={() => setOutwardModalOpen(false)} />
        </Modal>
        <Modal title="Add New Item" isOpen={isItemModalOpen} onClose={() => setItemModalOpen(false)}>
          <AddItemForm onClose={() => setItemModalOpen(false)} />
        </Modal>
    </InventoryProvider>
  );
};

export default App;
