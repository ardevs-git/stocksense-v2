
import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import Modal from './shared/Modal';
import ConfirmModal from './shared/ConfirmModal';
import { TrashIcon, ProductIcon, CalendarIcon, PencilIcon, InfoIcon, EyeIcon, DollarSignIcon, PurchaseIcon, InventoryIcon, AlertTriangleIcon, CheckCircleIcon, PlusCircleIcon } from './shared/Icons';
import type { Product } from '../types';
import { formatNumber, formatQuantity, getCurrentMonthRange } from '../utils/formatters';

const commonInputStyle = "bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary block w-full p-3 transition-all font-medium";

// --- Sub-Component: Opening Adjustment Form ---
const OpeningAdjustmentForm: React.FC<{ 
    product: any; 
    periodStart: string; 
    onClose: () => void 
}> = ({ product, periodStart, onClose }) => {
    const { adjustStock } = useInventory();
    const [newValue, setNewValue] = useState(product.monthOpening.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numValue = parseFloat(newValue);
        if (isNaN(numValue)) return;

        // Record adjustment exactly at the start of the period to fix the "Opening"
        const adjDate = new Date(periodStart);
        adjDate.setHours(0, 0, 0, 1); // Just after midnight of start date

        adjustStock(
            product.id, 
            numValue, 
            `Opening Balance Correction (Manual Entry)`, 
            adjDate
        );
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                <InfoIcon className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Adjusting opening for <strong>{new Date(periodStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong> creates a discrepancy correction entry in the ledger.
                </p>
            </div>
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">New Opening Quantity ({product.unit})</label>
                <input 
                    type="number" 
                    step="any"
                    value={newValue} 
                    onChange={e => setNewValue(e.target.value)} 
                    required 
                    className={commonInputStyle} 
                    autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-2 italic text-right">Current calculated: {formatQuantity(product.monthOpening)}</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all active:scale-95 text-[11px]">Save Correction</button>
            </div>
        </form>
    );
};

// --- Sub-Component: Edit Product Form ---
const EditProductForm: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
    const { updateProduct, categories, vendors } = useInventory();
    const [formData, setFormData] = useState({ ...product });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: ['purchasePrice', 'gstRate', 'reorderLevel', 'categoryId', 'vendorId'].includes(name) 
                ? Number(value) 
                : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProduct(formData);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Product Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">HSN Code</label>
                    <input type="text" name="hsn" value={formData.hsn || ''} onChange={handleChange} className={commonInputStyle} />
                 </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Unit</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleChange} required className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Category</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} required className={commonInputStyle}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Purchase Price</label>
                    <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} step="0.01" className={commonInputStyle} />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Reorder Level</label>
                    <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} className={commonInputStyle} />
                </div>
             </div>
             
             <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 text-[11px]">Update Master</button>
            </div>
        </form>
    );
};

// --- Sub-Component: Product Audit Trail ---
const ProductAuditTrail: React.FC<{ productId: number }> = ({ productId }) => {
    const { purchases, outwards, stockAdjustments, products } = useInventory();
    const product = products.find(p => p.id === productId);

    const history = useMemo(() => {
        const logs: any[] = [];
        
        // Add Baseline
        if (product) {
            logs.push({
                date: new Date(0), // Represents start of time
                type: 'INITIAL',
                qty: product.initialQuantity,
                ref: 'System Entry',
                label: 'Opening Balance'
            });
        }

        purchases.forEach(p => {
            const item = p.items.find(i => i.productId === productId);
            if (item) {
                logs.push({
                    date: new Date(p.date),
                    type: 'INWARD',
                    qty: item.quantity,
                    ref: p.invoiceNumber,
                    label: 'Purchase'
                });
            }
        });

        outwards.forEach(o => {
            const item = o.items.find(i => i.productId === productId);
            if (item) {
                logs.push({
                    date: new Date(o.date),
                    type: 'OUTWARD',
                    qty: -item.quantity,
                    ref: o.requisitionNumber || o.id,
                    label: 'Issued'
                });
            }
        });

        stockAdjustments.forEach(a => {
            if (a.productId === productId) {
                logs.push({
                    date: new Date(a.date),
                    type: 'ADJUST',
                    qty: a.quantity,
                    ref: a.reason,
                    label: 'Correction'
                });
            }
        });

        return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [productId, purchases, outwards, stockAdjustments, product]);

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Audit for {product?.name}</p>
                    <p className="text-sm font-black text-slate-900">Current: {formatQuantity(product?.quantity)} {product?.unit}</p>
                </div>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {history.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                                log.type === 'INWARD' ? 'bg-emerald-50 text-emerald-600' :
                                log.type === 'OUTWARD' ? 'bg-rose-50 text-rose-600' :
                                log.type === 'INITIAL' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                                {log.type === 'INWARD' ? <PurchaseIcon className="w-4 h-4" /> : 
                                 log.type === 'OUTWARD' ? <InventoryIcon className="w-4 h-4" /> : 
                                 log.type === 'INITIAL' ? <CheckCircleIcon className="w-4 h-4" /> : <AlertTriangleIcon className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-900">{log.label} ({log.ref})</p>
                                <p className="text-[10px] font-medium text-slate-400">{log.date.getTime() === 0 ? 'Day 0' : log.date.toLocaleDateString('en-IN')}</p>
                            </div>
                        </div>
                        <p className={`font-mono font-bold ${log.qty > 0 ? 'text-emerald-600' : log.qty < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {log.qty > 0 ? '+' : ''}{formatQuantity(log.qty)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AddItemForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addProduct, categories, vendors } = useInventory();
    const [formData, setFormData] = useState({
        name: '',
        hsn: '',
        barcode: '',
        unit: '',
        categoryId: '',
        vendorId: '',
        purchasePrice: '',
        gstRate: '',
        quantity: '',
        reorderLevel: '10'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert("Product Name is required.");
            return;
        }
        
        addProduct({
            name: formData.name,
            hsn: formData.hsn,
            barcode: formData.barcode,
            unit: formData.unit,
            categoryId: Number(formData.categoryId) || 0,
            vendorId: Number(formData.vendorId) || 0,
            warehouseId: 1,
            purchasePrice: Number(formData.purchasePrice) || 0,
            gstRate: Number(formData.gstRate) || 0,
            initialQuantity: Number(formData.quantity) || 0,
            reorderLevel: Number(formData.reorderLevel) || 0
        });
        
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">HSN Code</label>
                    <input type="text" name="hsn" value={formData.hsn} onChange={handleChange} className={commonInputStyle} />
                 </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Unit (e.g. kg, L) *</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleChange} required className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Category *</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} required className={commonInputStyle}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Initial Quantity</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Reorder Level</label>
                    <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} className={commonInputStyle} />
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Purchase Price</label>
                    <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} step="0.01" className={commonInputStyle} />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">GST Rate (%)</label>
                    <input type="number" name="gstRate" value={formData.gstRate} onChange={handleChange} className={commonInputStyle} />
                </div>
             </div>

             <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Default Vendor</label>
                <select name="vendorId" value={formData.vendorId} onChange={handleChange} className={commonInputStyle}>
                    <option value="">Select Vendor (Optional)</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
            </div>
             
             <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all active:scale-95 text-[11px]">Save Product</button>
            </div>
        </form>
    );
};

const ProductList: React.FC<{ onNewItem?: () => void }> = ({ onNewItem }) => {
    const { products, categories, getAccountingStock } = useInventory();
    const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // State for modals
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [auditProductId, setAuditProductId] = useState<number | null>(null);
    const [adjustingOpeningProduct, setAdjustingOpeningProduct] = useState<any | null>(null);

    const processedProducts = useMemo(() => {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);

        return products.map(p => {
            const audit = getAccountingStock(p.id, start, end);
            const categoryName = categories.find(c => c.id === p.categoryId)?.name || 'N/A';
            return {
                ...p,
                ...audit,
                categoryName
            };
        });
    }, [products, getAccountingStock, startDate, endDate, categories]);

    const filtered = processedProducts.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = categoryFilter ? p.categoryId.toString() === categoryFilter : true;
        return matchSearch && matchCat;
    });

    const totalValuation = useMemo(() => {
        return filtered.reduce((acc, p) => acc + (p.closingStock * p.purchasePrice), 0);
    }, [filtered]);

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-card p-8 rounded-[2.5rem] shadow-premium border border-slate-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Stock Ledger</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                               Movement Analysis & Period Audit
                            </p>
                        </div>
                        <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
                        <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-[1.5rem] flex items-center gap-4">
                            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                                <DollarSignIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">Period Closing Value</p>
                                <p className="text-xl font-black text-indigo-900 tracking-tighter leading-none">₹{formatNumber(totalValuation)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {onNewItem && (
                            <button 
                                onClick={onNewItem}
                                className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                New Item
                            </button>
                        )}
                        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 shadow-inner w-full sm:w-auto">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none px-2 text-[10px] font-black text-slate-600 focus:outline-none" />
                            <span className="text-slate-300 font-bold">→</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none px-2 text-[10px] font-black text-slate-600 focus:outline-none" />
                        </div>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-primary shadow-sm outline-none">
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input type="text" placeholder="Filter items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-primary shadow-sm outline-none sm:min-w-[240px]" />
                    </div>
                </div>

                <div className="overflow-x-auto -mx-8">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 border-y border-slate-100">
                            <tr>
                                <th className="px-10 py-6">Product Master</th>
                                <th className="px-4 py-6 text-right" title="Stock at time of system creation">Initial Op.</th>
                                <th className="px-4 py-6 text-right" title="Calculated derived stock at start of selected period">Month Op.</th>
                                <th className="px-4 py-6 text-center" title="Quantity added or removed within selected period">Period Movement (In/Out)</th>
                                <th className="px-4 py-6 text-right font-black text-slate-900" title="Opening + Inward - Outward = Closing">Closing Stock</th>
                                <th className="px-10 py-6 text-right bg-slate-900/5" title="Actual real-time system total stock">Live Stock</th>
                                <th className="px-6 py-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-primary/[0.02] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">{p.name}</span>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-tighter mt-1.5 w-fit group-hover:bg-primary/10 group-hover:text-primary transition-colors">{p.categoryName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 text-right">
                                        <span className="font-mono text-slate-400 font-medium">{formatQuantity(p.initialOpening)}</span>
                                    </td>
                                    <td className="px-4 py-6 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-mono text-indigo-600 font-bold">{formatQuantity(p.monthOpening)}</span>
                                            <button 
                                                onClick={() => setAdjustingOpeningProduct(p)}
                                                className="text-[9px] font-black uppercase tracking-tighter text-indigo-400 hover:text-indigo-600 border border-indigo-100 hover:border-indigo-300 px-2 py-0.5 rounded-md bg-white shadow-sm transition-all active:scale-95"
                                            >
                                                Adjust
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm text-[10px] font-black tracking-tighter">
                                            <span className="text-emerald-600">+{formatQuantity(p.inward)}</span>
                                            <div className="w-px h-3 bg-slate-200 mx-1"></div>
                                            <span className="text-rose-500">-{formatQuantity(p.outward)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 text-right font-black text-slate-900">
                                        <span className="font-mono text-lg tracking-tighter">{formatQuantity(p.closingStock)}</span>
                                    </td>
                                    <td className="px-10 py-6 text-right bg-slate-900/[0.02]">
                                        <div className="flex flex-col items-end">
                                            <span className={`font-mono text-xl font-black tracking-tighter ${p.liveStock <= p.reorderLevel ? 'text-rose-600' : 'text-slate-900'}`}>
                                                {formatQuantity(p.liveStock)}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">₹{formatNumber(p.liveStock * p.purchasePrice)} Val.</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setAuditProductId(p.id)}
                                                className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-900 hover:text-white shadow-sm transition-all" 
                                                title="View Audit Logs"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setEditingProduct(p)}
                                                className="p-2.5 bg-white text-indigo-600 rounded-xl border border-slate-200 hover:bg-indigo-600 hover:text-white shadow-sm transition-all" 
                                                title="Edit Master Record"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filtered.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <ProductIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold italic tracking-tight">No records matching your filters.</p>
                  </div>
                )}
            </div>

            {/* Modals */}
            <Modal 
                title="Edit Product Master" 
                isOpen={!!editingProduct} 
                onClose={() => setEditingProduct(null)}
            >
                {editingProduct && <EditProductForm product={editingProduct} onClose={() => setEditingProduct(null)} />}
            </Modal>

            <Modal 
                title="Inventory Audit Trail" 
                isOpen={!!auditProductId} 
                onClose={() => setAuditProductId(null)}
            >
                {auditProductId && <ProductAuditTrail productId={auditProductId} />}
            </Modal>

            <Modal 
                title="Reconcile Opening Balance" 
                isOpen={!!adjustingOpeningProduct} 
                onClose={() => setAdjustingOpeningProduct(null)}
            >
                {adjustingOpeningProduct && (
                    <OpeningAdjustmentForm 
                        product={adjustingOpeningProduct} 
                        periodStart={startDate}
                        onClose={() => setAdjustingOpeningProduct(null)} 
                    />
                )}
            </Modal>
        </div>
    );
};

export default ProductList;
