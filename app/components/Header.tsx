
import React from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { MenuIcon, PlusCircleIcon } from './shared/Icons';

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
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-card border-b border-gray-200">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="lg:hidden mr-4 text-gray-600 hover:text-primary">
          <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-text-primary hidden md:block">{activeView}</h1>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="hidden sm:flex items-center space-x-2">
            <button onClick={onNewPurchase} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors">
                <PlusCircleIcon className="w-4 h-4 mr-1"/>
                <span>Purchase</span>
            </button>
            <button onClick={onNewOutward} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors">
                <PlusCircleIcon className="w-4 h-4 mr-1"/>
                <span>Outward</span>
            </button>
            {currentUser.role === UserRole.ADMIN && (
               <button onClick={onNewItem} className="flex items-center bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors">
                    <PlusCircleIcon className="w-4 h-4 mr-1"/>
                    <span>New Item</span>
                </button>
            )}
        </div>

        <div className="relative">
          <select
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="pl-3 pr-8 py-2 text-sm font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.MANAGER}>Manager</option>
            <option value={UserRole.STAFF}>Staff</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
            <img src={currentUser.avatar} alt="User Avatar" className="w-10 h-10 rounded-full" />
            <div className='hidden sm:block'>
                <p className="text-sm font-medium text-text-primary">{currentUser.name}</p>
                <p className="text-xs text-text-secondary">{currentUser.role}</p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
