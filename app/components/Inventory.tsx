
/* FIX: Added useRef to the React imports to resolve the 'Cannot find name useRef' error in PurchaseForm */
import React, { useState, useMemo, useRef } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { PurchaseInvoice, OutwardTransaction, Product, Vendor, CompanyDetails } from '../types';
import { TrashIcon, EyeIcon, PencilIcon, ArrowRightCircleIcon, FileTextIcon } from './shared/Icons';

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

interface FormProps {
    onClose: () => void;
}

const commonInputStyle = "bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary block w-full p-2.5";
const formatNumber = (num: number) => num.toFixed(2);


const generatePurchasePreviewHTML = (data: {
    companyDetails: CompanyDetails;
    vendor: Vendor;
    invoiceNumber: string;
    date: Date;
    items: { product: Product; quantity: number; unitCost: number, unit: string }[];
    subTotal: number;
    totalGst: number;
    grandTotal: number;
}) => {
    const { companyDetails, vendor, invoiceNumber, date, items, subTotal, totalGst, grandTotal } = data;
    const itemsHtml = items.map((item, index) => `
        <tr class="border-b">
            <td class="py-2 px-2 text-center">${index + 1}</td>
            <td class="py-2 px-2">${item.product.name}</td>
            <td class="py-2 px-2 text-center">${item.product.hsn}</td>
            <td class="py-2 px-2 text-center">${item.quantity} ${item.unit}</td>
            <td class="py-2 px-2 text-right">${formatNumber(item.unitCost)}</td>
            <td class="py-2 px-2 text-center">${item.product.gstRate}%</td>
            <td class="py-2 px-2 text-right">${formatNumber(item.quantity * item.unitCost)}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Receipt - ${invoiceNumber}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body class="bg-gray-100 p-8">
        <div class="max-w-4xl mx-auto bg-white p-10 rounded shadow-lg">
            <div class="flex justify-end mb-4 no-print">
                <button onclick="window.print()" class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">Print / Save as PDF</button>
            </div>
            
            <header class="flex justify-between items-start border-b pb-4 mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">${companyDetails.name}</h1>
                    <p class="text-sm text-gray-500">${companyDetails.address}</p>
                    <p class="text-sm text-gray-500">Email: ${companyDetails.email} | GSTIN: ${companyDetails.gstin}</p>
                </div>
                <h2 class="text-2xl font-semibold text-gray-700 uppercase tracking-wider">Purchase Receipt</h2>
            </header>

            <div class="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <h3 class="font-semibold text-gray-700 mb-1">Vendor:</h3>
                    <p class="font-bold text-lg text-gray-800">${vendor.name}</p>
                    <p class="text-sm text-gray-600">${vendor.contact}</p>
                </div>
                <div class="text-right">
                    <p><span class="font-semibold text-gray-600">Invoice #:</span> ${invoiceNumber}</p>
                    <p><span class="font-semibold text-gray-600">Date:</span> ${new Date(date).toLocaleDateString()}</p>
                </div>
            </div>

            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-100 text-left text-gray-600 uppercase">
                        <th class="py-2 px-2 text-center w-10">S.No</th>
                        <th class="py-2 px-2">Item Description</th>
                        <th class="py-2 px-2 text-center">HSN</th>
                        <th class="py-2 px-2 text-center">Quantity</th>
                        <th class="py-2 px-2 text-right">Rate</th>
                        <th class="py-2 px-2 text-center">GST</th>
                        <th class="py-2 px-2 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="flex justify-end mt-8">
                <div class="w-full max-w-sm">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Subtotal:</span>
                        <span class="font-medium text-gray-800">${formatNumber(subTotal)}</span>
                    </div>
                    <div class="flex justify-between text-sm mt-2">
                        <span class="text-gray-600">Total GST:</span>
                        <span class="font-medium text-gray-800">${formatNumber(totalGst)}</span>
                    </div>
                    <div class="border-t my-2"></div>
                    <div class="flex justify-between font-bold text-lg">
                        <span class="text-gray-800">Grand Total:</span>
                        <span class="text-gray-900">${formatNumber(grandTotal)}</span>
                    </div>
                </div>
            </div>

            <footer class="mt-12 text-center text-xs text-gray-400 border-t pt-4">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated document.</p>
            </footer>
        </div>
    </body>
    </html>
    `;
};

export const PurchaseForm: React.FC<FormProps> = ({ onClose }) => {
    const { vendors, products, recordPurchase, companyDetails } = useInventory();
    const [vendorId, setVendorId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: number; unit: string; gstRate: number }[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);

    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        const lowercasedTerm = searchTerm.toLowerCase();
        const addedProductIds = new Set(items.map(item => item.productId));
        return products.filter(p => 
            !addedProductIds.has(String(p.id)) &&
            (p.name.toLowerCase().includes(lowercasedTerm) || p.hsn.toLowerCase().includes(lowercasedTerm))
        );
    }, [searchTerm, products, items]);

    const handleItemChange = (index: number, field: 'quantity' | 'unitCost' | 'gstRate', value: string) => {
        const newItems = [...items];
        const numValue = parseFloat(value);
        newItems[index] = { ...newItems[index], [field]: Math.max(0, isNaN(numValue) ? 0 : numValue) };
        setItems(newItems);
    };

    const handleAddProduct = (product: Product) => {
        setItems(prevItems => [
            ...prevItems,
            { productId: String(product.id), quantity: 1, unitCost: product.purchasePrice, unit: product.unit, gstRate: product.gstRate }
        ]);
        setSearchTerm('');
        setShowResults(false);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const focusField = (index: number, field: string) => {
        const ref = inputRefs.current.get(`${index}-${field}`);
        if (ref) {
            ref.focus();
            ref.select();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (field === 'quantity') {
                focusField(index, 'unitCost');
            } else if (field === 'unitCost') {
                focusField(index, 'gstRate'); // Next tab logic (Rate to GST)
            } else if (field === 'gstRate') {
                // Focus back to search for next item
                document.getElementById('product-search')?.focus();
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorId || !invoiceNumber) {
            alert("Please select a vendor and enter an invoice number.");
            return;
        }
        if (items.length === 0) {
            alert("Please add at least one item to the purchase.");
            return;
        }
        if (items.some(i => i.quantity <= 0 || i.unitCost < 0)) {
            alert("Please ensure item quantities and costs are valid.");
            return;
        }

        recordPurchase({
            vendorId: parseInt(vendorId),
            invoiceNumber,
            date: new Date(),
            items: items.map(i => ({ productId: parseInt(i.productId), quantity: i.quantity, unitCost: i.unitCost, gstRate: i.gstRate }))
        });
        alert("Purchase recorded successfully!");
        onClose();
    };
    
    const handlePreview = () => {
        if (!vendorId || !invoiceNumber) {
            alert("Please select a vendor and enter an invoice number to generate a preview.");
            return;
        }
        const vendor = vendors.find(v => v.id === parseInt(vendorId));
        if (!vendor) {
             alert("Selected vendor not found.");
            return;
        }

        const previewItems = items.map(item => {
            const product = products.find(p => p.id === parseInt(item.productId));
            return {
                product,
                quantity: item.quantity,
                unitCost: item.unitCost,
                unit: item.unit
            };
        }).filter(item => !!item.product) as { product: Product; quantity: number; unitCost: number, unit: string }[];
        
        const previewData = {
            companyDetails,
            vendor,
            invoiceNumber,
            date: new Date(),
            items: previewItems,
            subTotal,
            totalGst,
            grandTotal
        };

        const htmlContent = generatePurchasePreviewHTML(previewData);
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
            previewWindow.focus();
        }
    };

    const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
    const totalGst = items.reduce((acc, item) => acc + (item.quantity * item.unitCost * (item.gstRate / 100)), 0);
    const grandTotal = subTotal + totalGst;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={vendorId} onChange={e => setVendorId(e.target.value)} required className={commonInputStyle}>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Invoice Number / GRN" required className={commonInputStyle} />
            </div>

            <div className="relative">
                <label htmlFor="product-search" className="block text-sm font-medium text-gray-700 mb-1">Search and Add Item</label>
                <input
                    id="product-search"
                    type="text"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)} // Delay to allow click on results
                    placeholder="Search by name or HSN..."
                    autoComplete="off"
                    className={commonInputStyle}
                />
                {showResults && searchTerm && (
                    <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {searchResults.length > 0 ? (
                            searchResults.map(p => (
                                <div key={p.id} onMouseDown={() => handleAddProduct(p)} className="p-3 hover:bg-gray-100 cursor-pointer text-sm">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Stock: {p.quantity} {p.unit}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-gray-500">No products found.</div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="space-y-2 border-t pt-2 max-h-64 overflow-y-auto">
                {items.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No items added yet.</p>
                ) : (
                    items.map((item, index) => {
                        const product = products.find(p => p.id === parseInt(item.productId));
                        if (!product) return null;
                        const itemTotal = item.quantity * item.unitCost;
                        return (
                             <div key={item.productId} className="grid grid-cols-12 gap-2 items-center text-sm">
                                <div className="col-span-4 p-2.5 bg-gray-50 rounded-lg border">
                                    <p className="font-medium text-gray-800 truncate" title={product.name}>{product.name}</p>
                                </div>
                                <div className="col-span-2 flex items-baseline">
                                    <input 
                                        ref={el => { if(el) inputRefs.current.set(`${index}-quantity`, el); }}
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                                        onKeyDown={e => handleKeyDown(e, index, 'quantity')}
                                        min="1" 
                                        required 
                                        className={`${commonInputStyle} text-center w-full`} 
                                    />
                                    <span className="ml-1.5 text-xs text-gray-500 font-semibold">{item.unit}</span>
                                </div>
                                <input 
                                    ref={el => { if(el) inputRefs.current.set(`${index}-unitCost`, el); }}
                                    type="number" 
                                    value={item.unitCost} 
                                    onChange={e => handleItemChange(index, 'unitCost', e.target.value)} 
                                    onKeyDown={e => handleKeyDown(e, index, 'unitCost')}
                                    min="0" 
                                    step="0.01" 
                                    required 
                                    className={`${commonInputStyle} col-span-2 text-center`} 
                                />
                                <input 
                                    ref={el => { if(el) inputRefs.current.set(`${index}-gstRate`, el); }}
                                    type="number" 
                                    value={item.gstRate} 
                                    onChange={e => handleItemChange(index, 'gstRate', e.target.value)} 
                                    onKeyDown={e => handleKeyDown(e, index, 'gstRate')}
                                    min="0" 
                                    max="100" 
                                    required 
                                    className={`${commonInputStyle} col-span-1 text-center`} 
                                />
                                <div className="col-span-2 text-center font-medium text-gray-800">{formatNumber(itemTotal)}</div>
                                <button type="button" onClick={() => removeItem(index)} className="col-span-1 bg-red-100 text-red-600 rounded-lg p-2 hover:bg-red-200 flex items-center justify-center h-full transition-colors" aria-label={`Remove ${product.name}`}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
            
             <div className="text-right space-y-1 border-t pt-2 mt-2">
                <div className="flex justify-end items-center gap-4">
                    <span className="font-semibold text-gray-600">Subtotal:</span>
                    <span className="font-bold text-lg w-32 text-right">{formatNumber(subTotal)}</span>
                </div>
                <div className="flex justify-end items-center gap-4">
                    <span className="font-semibold text-gray-600">Total GST:</span>
                    <span className="font-bold text-lg w-32 text-right">{formatNumber(totalGst)}</span>
                </div>
                <div className="flex justify-end items-center gap-4 border-t mt-1 pt-1">
                    <span className="font-bold text-gray-800">Grand Total:</span>
                    <span className="font-bold text-xl w-32 text-right">{formatNumber(grandTotal)}</span>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                 <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                 <button type="button" onClick={handlePreview} className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded-lg">Preview</button>
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Record Purchase</button>
            </div>
        </form>
    );
};

export const OutwardForm: React.FC<FormProps> = ({onClose}) => {
    const { departments, products, recordOutward } = useInventory();
    const [departmentId, setDepartmentId] = useState('');
    const [items, setItems] = useState<{ productId: string; quantity: number }[]>([{ productId: '', quantity: 1 }]);

    const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: field === 'quantity' ? Math.max(1, parseInt(value)) : value };
        setItems(newItems);
    };
    
    const addItem = () => setItems([...items, { productId: '', quantity: 1 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!departmentId || items.some(i => !i.productId || i.quantity <= 0)) {
            alert("Please select a department and fill all item details.");
            return;
        }
        recordOutward(
            items.map(i => ({ productId: parseInt(i.productId), quantity: i.quantity })),
            parseInt(departmentId),
            new Date()
        );
        alert("Stock outward recorded successfully!");
        onClose();
    };
    
    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} required className={commonInputStyle}><option value="">Select Department</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold text-sm">Items to Issue</h3>
                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} required className={`${commonInputStyle} col-span-7`}>
                            <option value="">Select Product</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Avail: {p.quantity} {p.unit})</option>)}
                        </select>
                        <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} min="1" placeholder="Qty" required className={`${commonInputStyle} col-span-3`} />
                        <button type="button" onClick={() => removeItem(index)} className="col-span-2 bg-red-500 text-white rounded p-2 hover:bg-red-600">-</button>
                    </div>
                ))}
                <button type="button" onClick={addItem} className="w-full mt-2 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 text-sm">Add Item</button>
            </div>
             <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Record Outward</button>
            </div>
        </form>
    );
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

const InventoryHistory: React.FC = () => {
    const { purchases, outwards, vendors, departments } = useInventory();
    
    const { items: sortedPurchases, requestSort: requestPurchaseSort, sortConfig: purchaseSortConfig } = useSortableData(purchases);
    const { items: sortedOutwards, requestSort: requestOutwardSort, sortConfig: outwardSortConfig } = useSortableData(outwards);

    const getVendorName = (id: number) => vendors.find(v => v.id === id)?.name || 'N/A';
    const getDepartmentName = (id: number) => departments.find(d => d.id === id)?.name || 'N/A';

    return (
        <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg shadow-md">
                 <h2 className="text-2xl font-bold text-text-primary mb-4">Stock Inward History (Purchases)</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <SortableHeader label="Date" sortKey="date" requestSort={requestPurchaseSort} sortConfig={purchaseSortConfig} />
                                <th scope="col" className="px-6 py-3">Invoice #</th>
                                <th scope="col" className="px-6 py-3">Vendor</th>
                                <SortableHeader label="Amount" sortKey="totalAmount" requestSort={requestPurchaseSort} sortConfig={purchaseSortConfig} className="text-right" />
                                <th scope="col" className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPurchases.map(p => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{p.invoiceNumber}</td>
                                    <td className="px-6 py-4">{getVendorName(p.vendorId)}</td>
                                    <td className="px-6 py-4 text-right">{formatNumber(p.totalAmount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : p.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {p.paymentStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md">
                 <h2 className="text-2xl font-bold text-text-primary mb-4">Stock Outward History</h2>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <SortableHeader label="Date" sortKey="date" requestSort={requestOutwardSort} sortConfig={outwardSortConfig} />
                                <th scope="col" className="px-6 py-3">Transaction ID</th>
                                <th scope="col" className="px-6 py-3">Department</th>
                                <SortableHeader label="Total Cost" sortKey="totalCost" requestSort={requestOutwardSort} sortConfig={outwardSortConfig} className="text-right" />
                            </tr>
                        </thead>
                        <tbody>
                           {sortedOutwards.map(o => (
                                <tr key={o.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(o.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{o.id}</td>
                                    <td className="px-6 py-4">{getDepartmentName(o.departmentId)}</td>
                                    <td className="px-6 py-4 text-right">{formatNumber(o.totalCost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default InventoryHistory;
