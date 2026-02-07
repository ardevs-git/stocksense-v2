
import React from 'react';
import { UserRole } from '../types';
import { DashboardIcon, ProductIcon, InventoryIcon, ReportIcon, SettingsIcon, AccountsIcon, CloseIcon, PurchaseIcon, PlusCircleIcon, DollarSignIcon, UserCircleIcon } from './shared/Icons';

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
  { name: 'Purchases', icon: PurchaseIcon, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: 'Sales', icon: DollarSignIcon, roles: [UserRole.ADMIN, UserRole.MANAGER] },
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
        className={`flex items-center w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 group ${
          isActive
            ? 'bg-primary text-white shadow-lg shadow-primary/30'
            : 'text-sidebar-text hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-sidebar-active'}`} />
        <span>{name}</span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
      </button>
    );
  };
  
  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar">
       <div className="flex items-center justify-between px-6 h-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black italic">S</div>
            <span className="text-xl font-black text-white tracking-tighter uppercase">StockSense</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-sidebar-text hover:text-white">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-4 py-6 space-y-8 flex-grow">
          <div>
            <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Core Management</p>
            <nav className="space-y-1.5">
              {navItems.slice(0, 5).map(item =>
                item.roles.includes(userRole) && (
                  <SidebarLink key={item.name} name={item.name} Icon={item.icon} />
                )
              )}
            </nav>
          </div>

          <div>
             <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Reporting & Admin</p>
             <nav className="space-y-1.5">
              {navItems.slice(5).map(item =>
                item.roles.includes(userRole) && (
                  <SidebarLink key={item.name} name={item.name} Icon={item.icon} />
                )
              )}
            </nav>
          </div>
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="bg-slate-800/50 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Mode</p>
            <p className="text-xs text-white/60 mt-1">v6.4.2 Enterprise</p>
          </div>
        </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <div className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 border-r border-slate-200">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
