
import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { PurchaseInvoice, User, Product } from '../types';
import { UserRole } from '../types';
import Modal from './shared/Modal';
import ConfirmModal from './shared/ConfirmModal';
import { PlusCircleIcon, TrashIcon, ArrowRightCircleIcon, PencilIcon, FileTextIcon, EyeIcon, CalendarIcon, CheckCircleIcon } from './shared/Icons';
import { formatNumber, formatQuantity, getLocalDateString } from '../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generatePurchasePreviewHTML } from '../utils/previewHelpers';

const commonInputStyle = "w-full sm:w-auto px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm";

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

const OutwardFromPurchaseForm: React.FC<{ purchaseInvoice: PurchaseInvoice; onClose: () => void; }> = ({ purchaseInvoice, onClose }) => {
    const { products, departments, recordOutward } = useInventory();
    const [departmentId, setDepartmentId] = useState('');
    const [outwardDate, setOutwardDate] = useState(getLocalDateString());

    const [outwardItems, setOutwardItems] = useState(() =>
        purchaseInvoice.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                productId: item.productId,
                purchaseQuantity: item.quantity,
                unitCost: item.unitCost,
                productName: product?.name || 'Unknown Product',
                unit: product?.unit || '',
                availableStock: product?.quantity || 0,
                outwardQuantity: item.quantity,
                isSelected: true,
            };
        })
    );
    
    const handleSelectAll = (checked: boolean) => {
        setOutwardItems(prev => prev.map(item => ({ ...item, isSelected: checked })));
    };

    const handleItemSelect = (productId: number, checked: boolean) => {
        setOutwardItems(prev => prev.map(item => item.productId === productId ? { ...item, isSelected: checked } : item));
    };

    const handleQuantityChange = (productId: number, quantity: string) => {
        const numQuantity = parseFloat(quantity);
        setOutwardItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, outwardQuantity: isNaN(numQuantity) ? 0 : numQuantity } : item
        ));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!departmentId) {
            alert('Please select a department.');
            return;
        }

        const itemsToOutward = outwardItems.filter(item => item.isSelected && item.outwardQuantity > 0);

        if (itemsToOutward.length === 0) {
            alert('No items selected for outward.');
            return;
        }

        for (const item of itemsToOutward) {
            if (item.outwardQuantity > item.availableStock) {
                alert(`Cannot outward "${item.productName}": Quantity (${item.outwardQuantity}) exceeds available stock (${item.availableStock}).`);
                return;
            }
        }

        const outwardData = itemsToOutward.map(item => ({
            productId: item.productId,
            quantity: item.outwardQuantity,
            costAtTime: item.unitCost,
        }));

        recordOutward(outwardData, parseInt(departmentId, 10), new Date(outwardDate), '', purchaseInvoice.id); // Pass purchaseId
        onClose();
    };
    
    const areAllSelected = outwardItems.length > 0 && outwardItems.every(item => item.isSelected);
    const formSpecificInputStyle = "bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary block w-full p-2.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outward Date *</label>
                    <input 
                        type="date" 
                        value={outwardDate} 
                        onChange={e => setOutwardDate(e.target.value)} 
                        required 
                        className={formSpecificInputStyle} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue to Department *</label>
                    <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} required className={formSpecificInputStyle}>
                        <option value="">-- Select a Department --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto max-h-80 border rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th scope="col" className="p-2">
                                <input type="checkbox" checked={areAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} />
                            </th>
                            <th scope="col" className="px-4 py-2">Product</th>
                            <th scope="col" className="px-4 py-2 text-center">Purchased Qty</th>
                            <th scope="col" className="px-4 py-2 text-center">Available Stock</th>
                            <th scope="col" className="px-4 py-2 text-center">Outward Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {outwardItems.map(item => (
                            <tr key={item.productId} className="bg-white border-b hover:bg-gray-50">
                                <td className="p-2">
                                    <input type="checkbox" checked={item.isSelected} onChange={(e) => handleItemSelect(item.productId, e.target.checked)} />
                                </td>
                                <td className="px-4 py-2 font-medium text-gray-900">{item.productName}</td>
                                <td className="px-4 py-2 text-center">{item.purchaseQuantity} {item.unit}</td>
                                <td className={`px-4 py-2 text-center font-semibold ${item.availableStock < item.outwardQuantity ? 'text-red-500' : 'text-gray-600'}`}>
                                    {item.availableStock} {item.unit}
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={item.outwardQuantity}
                                        onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                        max={item.availableStock}
                                        min="0"
                                        step="any"
                                        className={`${formSpecificInputStyle} text-center py-1 w-24 mx-auto`}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Confirm Outward</button>
            </div>
        </form>
    );
};


export const Purchases: React.FC<{ currentUser: User; setActiveView: (view: string) => void; onEdit: (purchaseId: string) => void; }> = ({ currentUser, setActiveView, onEdit }) => {
    const { purchases, vendors, deletePurchase, products, companyDetails } = useInventory();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('');

    const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseInvoice | null>(null);
    const [purchaseToOutward, setPurchaseToOutward] = useState<PurchaseInvoice | null>(null);

    const filteredPurchases = useMemo(() => {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);
        const lowercasedTerm = searchTerm.toLowerCase();

        return purchases.filter(p => {
            const purchaseDate = new Date(p.date);
            if (start && purchaseDate < start) return false;
            if (end && purchaseDate > end) return false;
            if (searchTerm && !p.invoiceNumber.toLowerCase().includes(lowercasedTerm)) return false;
            if (vendorFilter && p.vendorId.toString() !== vendorFilter) return false;
            return true;
        });
    }, [purchases, startDate, endDate, searchTerm, vendorFilter]);
    
    const { items: sortedPurchases, requestSort, sortConfig } = useSortableData(filteredPurchases, { key: 'date', direction: 'descending' });

    const totalFilteredAmount = useMemo(() => {
        return filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    }, [filteredPurchases]);
    
    const getVendorName = (id: number) => vendors.find(v => v.id === id)?.name || 'N/A';

    const handleExport = () => {
        if (sortedPurchases.length === 0) {
            alert("No data to export for the selected filters.");
            return;
        }
    
        const doc = new jsPDF({ orientation: 'landscape' });
        
        const tableData: any[] = sortedPurchases.flatMap(p => {
            const vendorName = getVendorName(p.vendorId);
            return p.items.map(item => {
                const product = products.find(prod => prod.id === item.productId);
                const baseAmount = item.unitCost * item.quantity;
                const gstAmount = baseAmount * (item.gstRate / 100);
                const totalAmount = baseAmount + gstAmount;
                
                return [
                    new Date(p.date).toLocaleDateString('en-CA'),
                    p.invoiceNumber,
                    vendorName,
                    product?.name || 'N/A',
                    `${formatQuantity(item.quantity)} ${product?.unit || ''}`,
                    formatNumber(item.unitCost),
                    `${item.gstRate}%`,
                    formatNumber(gstAmount),
                    formatNumber(totalAmount)
                ];
            });
        });
    
        const totalExportAmount = sortedPurchases.reduce((acc, p) => {
            const purchaseTotal = p.items.reduce((itemAcc, item) => {
                const baseAmount = item.unitCost * item.quantity;
                const gstAmount = baseAmount * (item.gstRate / 100);
                return itemAcc + baseAmount + gstAmount;
            }, 0);
            return acc + purchaseTotal;
        }, 0);
    
        tableData.push([
            { content: 'Grand Total', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatNumber(totalExportAmount), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
    
        autoTable(doc, {
            head: [['Date', 'Invoice #', 'Vendor', 'Product', 'Quantity', 'Rate', 'GST %', 'GST Amt', 'Total']],
            body: tableData,
            startY: 20,
            didDrawPage: (data) => {
                doc.setFontSize(16);
                doc.setTextColor(40);
                doc.text("Purchase Report", data.settings.margin.left, 15);
            },
            columnStyles: {
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'center' },
                7: { halign: 'right' },
                8: { halign: 'right' },
            }
        });
    
        doc.save('purchase_report.pdf');
    };

    const handleDeleteRequest = (purchase: PurchaseInvoice) => {
        setPurchaseToDelete(purchase);
    };
    
    const handleConfirmDelete = () => {
        if (purchaseToDelete) {
            deletePurchase(purchaseToDelete.id);
            setPurchaseToDelete(null);
        }
    }
    
    const handleViewBill = (purchaseId: string) => {
        const invoice = purchases.find(p => p.id === purchaseId);
        if (!invoice) {
            alert("Invoice not found.");
            return;
        }

        const vendor = vendors.find(v => v.id === invoice.vendorId);
        if (!vendor) {
            alert("Vendor not found for this invoice.");
            return;
        }

        const detailedItems = invoice.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                product: product!,
                quantity: item.quantity,
                unitCost: item.unitCost,
            };
        }).filter(item => item.product);

        const subTotal = detailedItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
        const totalGst = detailedItems.reduce((acc, item) => {
            const baseAmount = item.quantity * item.unitCost;
            return acc + (baseAmount * (item.product.gstRate / 100));
        }, 0);
        const grandTotal = subTotal + totalGst;
        
        const previewData = {
            companyDetails,
            vendor,
            invoiceNumber: invoice.invoiceNumber,
            date: invoice.date.toISOString(),
            items: detailedItems,
            subTotal,
            totalGst,
            grandTotal
        };

        const htmlContent = generatePurchasePreviewHTML(previewData);
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
        }
    };

    const handleOutwardRequest = (purchase: PurchaseInvoice) => {
        if (purchase.isOutwarded) {
            alert("This bill is already outwarded.");
            return;
        }
        setPurchaseToOutward(purchase);
    };

    return (
        <>
        <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-text-primary">Purchase History</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-wrap">
                     <input type="text" placeholder="Search Invoice #" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={commonInputStyle} />
                     <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className={commonInputStyle}>
                        <option value="">All Vendors</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonInputStyle} />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={commonInputStyle} />
                    <button onClick={() => setActiveView('New Purchase')} className="flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors">
                        <PlusCircleIcon className="w-4 h-4 mr-1"/>
                        <span>New Purchase</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center justify-center bg-secondary hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors" disabled={sortedPurchases.length === 0}>
                        <FileTextIcon className="w-4 h-4 mr-1"/>
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>
            
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <SortableHeader label="Date" sortKey="date" requestSort={requestSort} sortConfig={sortConfig} />
                            <th scope="col" className="px-6 py-3">Invoice #</th>
                            <th scope="col" className="px-6 py-3">Vendor</th>
                            <SortableHeader label="Amount" sortKey="totalAmount" requestSort={requestSort} sortConfig={sortConfig} className="text-right" />
                            <th scope="col" className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPurchases.map(p => (
                            <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">{new Date(p.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium">
                                    <div className="flex items-center gap-2">
                                        {p.invoiceNumber}
                                        {p.isOutwarded && (
                                            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase" title="Outward entry already exists for this bill">Outwarded</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{getVendorName(p.vendorId)}</td>
                                <td className="px-6 py-4 text-right">{formatNumber(p.totalAmount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-x-2">
                                        <button onClick={() => handleViewBill(p.id)} className="text-gray-500 hover:text-blue-600 p-1" title="View Bill">
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => onEdit(p.id)} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-blue-100" aria-label={`Edit invoice ${p.invoiceNumber}`} title="Edit">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleOutwardRequest(p)} 
                                            className={`p-1 rounded-full transition-colors ${p.isOutwarded ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-100'}`} 
                                            aria-label={`Create outward for ${p.invoiceNumber}`} 
                                            title={p.isOutwarded ? "Already outwarded" : "Create Outward"}
                                        >
                                            <ArrowRightCircleIcon className="w-5 h-5" />
                                        </button>
                                        {currentUser.role === UserRole.ADMIN && (
                                            <button onClick={() => handleDeleteRequest(p)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100" aria-label={`Delete invoice ${p.invoiceNumber}`} title="Delete">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                     <tfoot className="bg-gray-50">
                        <tr className="font-semibold text-gray-900">
                            <th scope="row" colSpan={3} className="px-6 py-3 text-base text-right">Total for Period</th>
                            <td className="px-6 py-3 text-right text-base">{formatNumber(totalFilteredAmount)}</td>
                            <td colSpan={1}></td>
                        </tr>
                    </tfoot>
                </table>
             </div>
        </div>

        {purchaseToDelete && (
            <ConfirmModal
                isOpen={!!purchaseToDelete}
                onClose={() => setPurchaseToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Purchase"
                message={`Are you sure you want to delete invoice ${purchaseToDelete.invoiceNumber}? This will also remove associated payments and update stock levels.`}
                confirmButtonText="Delete"
            />
        )}

        {purchaseToOutward && (
             <Modal title={`Create Outward from Invoice ${purchaseToOutward.invoiceNumber}`} isOpen={!!purchaseToOutward} onClose={() => setPurchaseToOutward(null)}>
                <OutwardFromPurchaseForm purchaseInvoice={purchaseToOutward} onClose={() => setPurchaseToOutward(null)} />
            </Modal>
        )}
        </>
    );
};
