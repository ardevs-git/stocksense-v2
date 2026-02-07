
/* FIX: Added useRef to the React imports to resolve the 'Cannot find name useRef' error in PurchaseForm */
import React, { useState, useMemo, useRef } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { OutwardTransaction, User, Product, Vendor, CompanyDetails } from '../types';
import { UserRole } from '../types';
import { TrashIcon, EyeIcon, PencilIcon, ArrowRightCircleIcon, FileTextIcon } from './shared/Icons';
import ConfirmModal from './shared/ConfirmModal';
import { formatNumber, getLocalDateString, getCurrentMonthRange } from '../utils/formatters';

type SortConfig<T> = {
  key: keyof T;
  direction: 'ascending' | 'descending';
} | null;

function useSortableData<T>(items: T[], config: SortConfig<T> = null) {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
}

const SortableHeader: React.FC<{
  label: string;
  sortKey: any;
  requestSort: (key: any) => void;
  sortConfig: SortConfig<any>;
  className?: string;
}> = ({ label, sortKey, requestSort, sortConfig, className }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction === 'ascending' ? '▲' : '▼';
  return (
    <th scope="col" className={`px-6 py-3 cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
      {label} {isSorted && <span className="ml-1">{direction}</span>}
    </th>
  );
};

const InventoryHistory: React.FC<{ currentUser: User; onEdit: (outwardId: string) => void; }> = ({ currentUser, onEdit }) => {
    const { outwards, departments, deleteOutward } = useInventory();
    
    // Current Month Default Range
    const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
    
    const [outwardToDelete, setOutwardToDelete] = useState<OutwardTransaction | null>(null);
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [departmentFilter, setDepartmentFilter] = useState('');

    const canTakeAction = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

    const filteredOutwards = useMemo(() => {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return outwards.filter(o => {
            const outwardDate = new Date(o.date);
            if (start && outwardDate < start) return false;
            if (end && outwardDate > end) return false;
            if (departmentFilter && o.departmentId.toString() !== departmentFilter) return false;
            return true;
        });
    }, [outwards, startDate, endDate, departmentFilter]);

    const totalFilteredCost = useMemo(() => {
        return filteredOutwards.reduce((sum, o) => sum + o.totalCost, 0);
    }, [filteredOutwards]);

    const { items: sortedOutwards, requestSort: requestOutwardSort, sortConfig: outwardSortConfig } = useSortableData(filteredOutwards, { key: 'date', direction: 'descending' });

    const getDepartmentName = (id: number) => departments.find(d => d.id === id)?.name || 'N/A';
    
    const handleConfirmDelete = () => {
        if(outwardToDelete) {
            deleteOutward(outwardToDelete.id);
            setOutwardToDelete(null);
        }
    };
    
    const commonInputStyle = "w-full sm:w-auto px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm";

    return (
        <>
        <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg shadow-md">
                 <h2 className="text-2xl font-bold text-text-primary mb-4">Stock Outward History</h2>
                 <div className="flex flex-col md:flex-row justify-start items-center mb-6 gap-4 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Period:</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonInputStyle} />
                        <span className="text-gray-400">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={commonInputStyle} />
                    </div>
                    <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className={commonInputStyle}>
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <SortableHeader label="Date" sortKey="date" requestSort={requestOutwardSort} sortConfig={outwardSortConfig} />
                                <th scope="col" className="px-6 py-3">Transaction ID</th>
                                <th scope="col" className="px-6 py-3">Req. No</th>
                                <th scope="col" className="px-6 py-3">Department</th>
                                <SortableHeader label="Total Cost" sortKey="totalCost" requestSort={requestOutwardSort} sortConfig={outwardSortConfig} className="text-right" />
                                {canTakeAction && <th scope="col" className="px-6 py-3 text-center">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                           {sortedOutwards.map(o => (
                                <tr key={o.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(o.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{o.id}</td>
                                    <td className="px-6 py-4">{o.requisitionNumber || '-'}</td>
                                    <td className="px-6 py-4">{getDepartmentName(o.departmentId)}</td>
                                    <td className="px-6 py-4 text-right">{formatNumber(o.totalCost)}</td>
                                    {canTakeAction && (
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-x-2">
                                                <button
                                                    onClick={() => onEdit(o.id)}
                                                    className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-blue-100"
                                                    aria-label={`Edit transaction ${o.id}`}
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                {currentUser.role === UserRole.ADMIN && (
                                                    <button
                                                        onClick={() => setOutwardToDelete(o)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                                                        aria-label={`Delete transaction ${o.id}`}
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr className="font-semibold text-gray-900">
                                <td colSpan={canTakeAction ? 6 : 5} className="px-6 py-3 text-center text-base">
                                    Total for Period: {formatNumber(totalFilteredCost)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                 </div>
            </div>
        </div>
        {outwardToDelete && (
            <ConfirmModal
                isOpen={!!outwardToDelete}
                onClose={() => setOutwardToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Outward Transaction"
                message={`Are you sure you want to permanently delete transaction ${outwardToDelete.id}? This will update stock levels.`}
                confirmButtonText="Delete"
            />
        )}
        </>
    );
};

export default InventoryHistory;
