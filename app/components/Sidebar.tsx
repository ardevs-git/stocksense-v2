
import React from 'react';
import { UserRole } from '../types';
import { DashboardIcon, ProductIcon, InventoryIcon, ReportIcon, SettingsIcon, AccountsIcon, CloseIcon } from './shared/Icons';

type SidebarProps = {
  activeView: string;
  onViewChange: (view: string) => void;
  userRole: UserRole;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const navItems = [
  { name: 'Dashboard', icon: DashboardIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
  { name: 'Stock', icon: ProductIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
  { name: 'Outward', icon: InventoryIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
  { name: 'Accounts', icon: AccountsIcon, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: 'Reports', icon: ReportIcon, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: 'Settings', icon: SettingsIcon, roles: [UserRole.ADMIN] },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, userRole, isOpen, setIsOpen }) => {
  const SidebarLink: React.FC<{ name: string; Icon: React.ElementType }> = ({ name, Icon }) => {
    const isActive = activeView === name;
    return (
      <button
        onClick={() => onViewChange(name)}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-sidebar-active text-white'
            : 'text-sidebar-text hover:bg-gray-700 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span>{name}</span>
      </button>
    );
  };
  
  const sidebarContent = (
    <>
       <div className="flex items-center justify-between px-4 h-16">
          <span className="text-2xl font-bold text-white">StockSense</span>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-sidebar-text hover:text-white">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map(item =>
            item.roles.includes(userRole) && (
              <SidebarLink key={item.name} name={item.name} Icon={item.icon} />
            )
          )}
        </nav>
        <div className="px-4 py-2 mt-auto">
          <p className="text-xs text-gray-500">© 2024 StockSense Inc.</p>
        </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-30 bg-gray-900 bg-opacity-50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar flex flex-col transform transition-transform lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 bg-sidebar text-white">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
