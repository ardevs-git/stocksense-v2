
import React from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { MenuIcon, PlusCircleIcon, UserCircleIcon } from './shared/Icons';

type HeaderProps = {
  activeView: string;
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  toggleSidebar: () => void;
  onNewPurchase: () => void;
  onNewOutward: () => void;
  onNewItem: () => void;
};

const Header: React.FC<HeaderProps> = ({ activeView, currentUser, onRoleChange, toggleSidebar, onNewPurchase, onNewOutward, onNewItem }) => {
  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="lg:hidden mr-4 p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-primary transition-colors">
          <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight hidden md:block uppercase">{activeView}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Quick Actions */}
        <div className="hidden sm:flex items-center gap-2 mr-2 pr-4 border-r border-slate-100">
            <button onClick={onNewPurchase} className="flex items-center bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-sm">
                <PlusCircleIcon className="w-4 h-4 mr-2"/>
                <span>Purchase</span>
            </button>
            <button onClick={onNewOutward} className="flex items-center bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-sm">
                <PlusCircleIcon className="w-4 h-4 mr-2"/>
                <span>Outward</span>
            </button>
        </div>
        
        {/* Unified Account Profile & Role Switcher */}
        <div className="flex items-center gap-3 pl-3 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-colors">
            {/* User Icon Area */}
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200 shrink-0">
                <UserCircleIcon className="w-6 h-6 text-slate-400" />
            </div>

            {/* Identity & Control Area */}
            <div className="flex flex-col text-left">
                <p className="text-xs font-black text-slate-900 leading-none mb-1">{currentUser.name}</p>
                
                <div className="relative group flex items-center">
                    <select
                        value={currentUser.role}
                        onChange={(e) => onRoleChange(e.target.value as UserRole)}
                        className="appearance-none bg-transparent pr-4 text-[9px] font-bold uppercase tracking-widest text-primary focus:outline-none cursor-pointer transition-all hover:text-primary-dark"
                    >
                        <option value={UserRole.ADMIN}>Administrator</option>
                        <option value={UserRole.MANAGER}>Manager Mode</option>
                        <option value={UserRole.STAFF}>Basic Staff</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
