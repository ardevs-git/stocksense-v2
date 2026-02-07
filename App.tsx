
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProductList, { AddItemForm } from './components/ProductList';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Sales from './components/Sales';
import InventoryHistory from './components/Inventory';
import Accounts from './components/Accounts';
import { Purchases } from './components/Purchase';
import PurchaseEntry from './components/PurchaseEntry';
import OutwardEntry from './components/OutwardEntry';
import VendorPurchaseHistory from './components/VendorPurchaseHistory';
import { InventoryProvider } from './hooks/useInventory';
import { UserRole } from './types';
import type { User } from './types';
import { USERS } from './constants';
import Modal from './components/shared/Modal';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('Dashboard');
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchaseToEditId, setPurchaseToEditId] = useState<string | null>(null);
  const [outwardToEditId, setOutwardToEditId] = useState<string | null>(null);
  const [vendorForHistoryId, setVendorForHistoryId] = useState<number | null>(null);
  const [isItemModalOpen, setItemModalOpen] = useState(false);

  const handleViewChange = (view: string) => { setActiveView(view); if(sidebarOpen) setSidebarOpen(false); };
  const handleRoleChange = (role: UserRole) => {
    const user = USERS.find(u => u.role === role);
    if (user) { setCurrentUser(user); setActiveView('Dashboard'); }
  };

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard': return <Dashboard setActiveView={handleViewChange} />;
      case 'Stock': return <ProductList onNewItem={() => setItemModalOpen(true)} />;
      case 'Purchases': return <Purchases currentUser={currentUser} setActiveView={handleViewChange} onEdit={id => { setPurchaseToEditId(id); setActiveView('Edit Purchase'); }} />;
      case 'Sales': return <Sales />;
      case 'Outward': return <InventoryHistory currentUser={currentUser} onEdit={id => { setOutwardToEditId(id); setActiveView('Edit Outward'); }} />;
      case 'Reports': return <Reports />;
      case 'Settings': return <Settings />;
      case 'Accounts': return <Accounts onShowHistory={id => { setVendorForHistoryId(id); setActiveView('Vendor Purchase History'); }} />;
      case 'New Purchase': return <PurchaseEntry onClose={() => handleViewChange('Purchases')} />;
      case 'New Outward': return <OutwardEntry onClose={() => handleViewChange('Outward')} />;
      case 'Edit Purchase': return <PurchaseEntry purchaseToEditId={purchaseToEditId || undefined} onClose={() => { setPurchaseToEditId(null); handleViewChange('Purchases'); }} />;
      case 'Edit Outward': return <OutwardEntry outwardToEditId={outwardToEditId || undefined} onClose={() => { setOutwardToEditId(null); handleViewChange('Outward'); }} />;
      case 'Vendor Purchase History': return <VendorPurchaseHistory vendorId={vendorForHistoryId} onClose={() => handleViewChange('Accounts')} />;
      default: return <Dashboard setActiveView={handleViewChange} />;
    }
  };

  const showLayout = !['New Purchase', 'New Outward', 'Edit Purchase', 'Edit Outward', 'Vendor Purchase History'].includes(activeView);

  return (
    <InventoryProvider userRole={currentUser.role}>
      {showLayout ? (
        <div className="flex h-screen bg-background text-text-primary">
          <Sidebar activeView={activeView} onViewChange={handleViewChange} userRole={currentUser.role} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header activeView={activeView} currentUser={currentUser} onRoleChange={handleRoleChange} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNewPurchase={() => handleViewChange('New Purchase')} onNewOutward={() => handleViewChange('New Outward')} onNewItem={() => setItemModalOpen(true)} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">{renderView()}</div>
            </main>
          </div>
        </div>
      ) : renderView()}
      <Modal title="Add New Item" isOpen={isItemModalOpen} onClose={() => setItemModalOpen(false)}>
          <AddItemForm onClose={() => setItemModalOpen(false)} />
      </Modal>
    </InventoryProvider>
  );
};

export default App;
