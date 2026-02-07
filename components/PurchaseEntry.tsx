
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { Product, PurchaseInvoice, GstType } from '../types';
import { CloseIcon, TrashIcon, CheckCircleIcon, EyeIcon } from './shared/Icons';
import { getLocalDateString, formatNumber } from '../utils/formatters';
import { generatePurchasePreviewHTML } from '../utils/previewHelpers';

interface PurchaseEntryProps {
    onClose: () => void;
    purchaseToEditId?: string;
}

const commonInputStyle = "w-full bg-white border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-gray-700 text-sm h-8 rounded-sm transition-all";

const PurchaseEntry: React.FC<PurchaseEntryProps> = ({ onClose, purchaseToEditId }) => {
    const { vendors, products, purchases, recordPurchase, updatePurchase, companyDetails } = useInventory();
    
    const purchaseToEdit = useMemo(() => 
        purchaseToEditId ? purchases.find(p => p.id === purchaseToEditId) : undefined
    , [purchaseToEditId, purchases]);

    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(getLocalDateString());
    const [vendorId, setVendorId] = useState<string>('');
    const [gstType, setGstType] = useState<GstType>('INTRA');
    const [rows, setRows] = useState<any[]>([{ id: Date.now().toString(), productId: '', name: '', hsn: '', qty: '', unit: '', rate: '', gst: 0, amount: 0, searchQuery: '' }]);
    const [narration, setNarration] = useState('');
    const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);
    const [highlightedItemIdx, setHighlightedItemIdx] = useState<number>(0);

    const inputRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [rows.length]);

    useEffect(() => {
        if (activeSuggestionIdx !== null && scrollContainerRef.current) {
            const inputEl = inputRefs.current.get(`${activeSuggestionIdx}-searchQuery`);
            if (inputEl) {
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeSuggestionIdx, rows[activeSuggestionIdx || 0]?.searchQuery]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ctrl + A shortcut removed as per request
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (purchaseToEdit) {
            setInvoiceNo(purchaseToEdit.invoiceNumber);
            setInvoiceDate(getLocalDateString(purchaseToEdit.date));
            setVendorId(purchaseToEdit.vendorId.toString());
            setGstType(purchaseToEdit.gstType || 'INTRA');
            setRows(purchaseToEdit.items.map((i, idx) => {
                const p = products.find(prod => prod.id === i.productId);
                return {
                    id: `edit-${idx}`,
                    productId: i.productId.toString(),
                    name: p?.name || '',
                    searchQuery: p?.name || '',
                    hsn: p?.hsn || '',
                    qty: i.quantity,
                    unit: p?.unit || '',
                    rate: i.unitCost,
                    gst: i.gstRate,
                    amount: i.quantity * i.unitCost
                };
            }));
        }
    }, [purchaseToEdit, products]);

    const totals = useMemo(() => {
        const sub = rows.reduce((a, r) => a + (Number(r.qty || 0) * Number(r.rate || 0)), 0);
        const tax = rows.reduce((a, r) => a + (Number(r.qty || 0) * Number(r.rate || 0) * (r.gst / 100)), 0);
        const rawTotal = sub + tax;
        const total = Math.round(rawTotal);
        const roundOff = total - rawTotal;
        
        return { 
            sub, 
            tax, 
            cgst: gstType === 'INTRA' ? tax / 2 : 0,
            sgst: gstType === 'INTRA' ? tax / 2 : 0,
            igst: gstType === 'INTER' ? tax : 0,
            roundOff,
            total 
        };
    }, [rows, gstType]);

    const handleRowChange = (idx: number, field: string, value: any) => {
        const newRows = [...rows];
        const row = { ...newRows[idx] };
        
        if (field === 'searchQuery') {
            setHighlightedItemIdx(0);
            row.searchQuery = value;
            // CORE FIX: If user starts typing and it doesn't match current selection name, clear product ID
            if (row.productId && value !== row.name) {
                row.productId = '';
                row.name = '';
                row.hsn = '';
                row.unit = '';
            }
        } else if (field === 'productId') {
            const p = products.find(prod => prod.id === parseInt(value));
            row.productId = value;
            row.name = p?.name || '';
            row.searchQuery = p?.name || '';
            row.hsn = p?.hsn || '';
            row.unit = p?.unit || '';
            row.rate = p?.purchasePrice || 0;
            row.gst = p?.gstRate || 0;
            if (!row.qty) row.qty = '';
            setActiveSuggestionIdx(null);
        } else {
            row[field] = value;
        }
        
        row.amount = Number(row.qty || 0) * Number(row.rate || 0);
        newRows[idx] = row;
        setRows(newRows);
    };

    const addRow = () => {
        const newId = Date.now().toString();
        setRows(prev => [...prev, { id: newId, productId: '', name: '', hsn: '', qty: '', unit: '', rate: '', gst: 0, amount: 0, searchQuery: '' }]);
        setTimeout(() => {
            const nextIdx = rows.length;
            inputRefs.current.get(`${nextIdx}-searchQuery`)?.focus();
        }, 50);
    };

    const deleteRow = (idx: number) => {
        if (rows.length > 1) setRows(rows.filter((_, i) => i !== idx));
    };

    const handlePreview = () => {
        if (!vendorId) return alert("Select Vendor first to see preview");
        const vendor = vendors.find(v => v.id === parseInt(vendorId));
        if (!vendor) return;

        const validItems = rows.filter(r => r.productId && Number(r.qty) > 0);
        if (!validItems.length) return alert("Add at least one item to preview");

        const previewItems = validItems.map(r => {
            const product = products.find(p => p.id === parseInt(r.productId));
            return {
                product: product!,
                quantity: Number(r.qty),
                unitCost: Number(r.rate)
            };
        });

        const htmlContent = generatePurchasePreviewHTML({
            companyDetails,
            vendor,
            invoiceNumber: invoiceNo || 'DRAFT',
            date: invoiceDate,
            items: previewItems,
            subTotal: totals.sub,
            totalGst: totals.tax,
            grandTotal: totals.total
        });

        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
        }
    };

    const handleSave = () => {
        if (!vendorId) return alert("Select Vendor");
        if (!invoiceNo) return alert("Enter Invoice No.");
        const validItems = rows.filter(r => r.productId && Number(r.qty) > 0);
        if (!validItems.length) return alert("No items added");

        const itemsData = validItems.map(r => ({
            productId: parseInt(r.productId),
            quantity: Number(r.qty),
            unitCost: Number(r.rate),
            gstRate: r.gst
        }));

        if (purchaseToEdit) {
            const currentPaid = purchaseToEdit.paidAmount || 0;
            const newTotal = totals.total;
            let newStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
            
            if (currentPaid >= newTotal && newTotal > 0) newStatus = 'Paid';
            else if (currentPaid > 0) newStatus = 'Partial';

            updatePurchase({
                ...purchaseToEdit,
                vendorId: parseInt(vendorId),
                invoiceNumber: invoiceNo,
                date: new Date(invoiceDate),
                gstType,
                items: itemsData,
                totalAmount: newTotal,
                paymentStatus: newStatus
            });
        } else {
            recordPurchase({
                vendorId: parseInt(vendorId),
                invoiceNumber: invoiceNo,
                date: new Date(invoiceDate),
                gstType,
                items: itemsData
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#f1f5f9] flex flex-col h-screen w-screen overflow-hidden select-none font-sans text-xs">
            <div className="bg-[#0f172a] text-white flex-none flex items-center justify-between px-6 h-10 shadow-lg z-30">
                <h1 className="text-sm font-black tracking-widest uppercase">{purchaseToEdit ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}</h1>
                <button onClick={onClose} className="hover:bg-red-500 p-1 rounded transition-colors" title="Close (Esc)">
                    <CloseIcon className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="p-3 grid grid-cols-12 gap-4 bg-[#f8fafc] border-b border-gray-200">
                    <div className="col-span-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Invoice No.</label>
                        <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className={commonInputStyle} autoFocus />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Date</label>
                        <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={commonInputStyle} />
                    </div>
                    <div className="col-span-4">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">Vendor</label>
                        <select value={vendorId} onChange={e => setVendorId(e.target.value)} className={commonInputStyle}>
                            <option value="">-- Select Vendor --</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-4">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block">GST Type</label>
                        <select value={gstType} onChange={e => setGstType(e.target.value as GstType)} className={commonInputStyle}>
                            <option value="INTRA">Intra-State (CGST+SGST)</option>
                            <option value="INTER">Inter-State (IGST)</option>
                        </select>
                    </div>
                </div>

                <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-[#e2e8f0] text-gray-700 font-black text-[9px] uppercase tracking-wider z-20 border-b border-gray-300 shadow-sm">
                            <tr>
                                <th className="py-2 px-3 w-10 text-center border-r">#</th>
                                <th className="py-2 px-3 text-left border-r">Name of Item</th>
                                <th className="py-2 px-3 w-28 text-right border-r">Qty</th>
                                <th className="py-2 px-3 w-20 text-center border-r">Unit</th>
                                <th className="py-2 px-3 w-32 text-right border-r">Rate</th>
                                <th className="py-2 px-3 w-20 text-center border-r">GST %</th>
                                <th className="py-2 px-3 w-36 text-right">Amount</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const filtered = products.filter(p => 
                                    p.name.toLowerCase().includes(row.searchQuery?.toLowerCase() || '')
                                ).slice(0, 10);

                                return (
                                    <tr key={row.id} className="group border-b border-gray-100 hover:bg-blue-50/30">
                                        <td className="py-1 px-3 text-center text-gray-400 font-mono border-r">{idx + 1}</td>
                                        <td className="p-0 border-r relative h-10">
                                            <input 
                                                type="text"
                                                ref={el => el && inputRefs.current.set(`${idx}-searchQuery`, el)}
                                                value={row.searchQuery}
                                                onChange={e => { handleRowChange(idx, 'searchQuery', e.target.value); setActiveSuggestionIdx(idx); }}
                                                onFocus={() => { setActiveSuggestionIdx(idx); setHighlightedItemIdx(0); }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        if (filtered.length > 0 && !row.productId) {
                                                            const itemToSelect = filtered[highlightedItemIdx] || filtered[0];
                                                            handleRowChange(idx, 'productId', itemToSelect.id.toString());
                                                            setTimeout(() => inputRefs.current.get(`${idx}-qty`)?.focus(), 10);
                                                        } else if (row.productId) {
                                                            inputRefs.current.get(`${idx}-qty`)?.focus();
                                                        }
                                                    } else if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setHighlightedItemIdx(prev => Math.min(prev + 1, filtered.length - 1));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setHighlightedItemIdx(prev => Math.max(prev - 1, 0));
                                                    }
                                                }}
                                                className="w-full h-full border-none bg-transparent px-3 font-bold text-gray-900 outline-none h-10"
                                                placeholder=""
                                            />
                                            {activeSuggestionIdx === idx && row.searchQuery && (
                                                <div className="absolute left-0 right-0 top-full bg-white border border-blue-200 shadow-2xl z-50 max-h-48 overflow-y-auto rounded-b-md">
                                                    {filtered.map((p, pIdx) => (
                                                        <div 
                                                            key={p.id}
                                                            onMouseDown={() => handleRowChange(idx, 'productId', p.id.toString())}
                                                            onMouseEnter={() => setHighlightedItemIdx(pIdx)}
                                                            className={`px-3 py-1.5 cursor-pointer border-b border-gray-50 flex justify-between items-center transition-colors ${highlightedItemIdx === pIdx ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                                                        >
                                                            <span className="font-bold text-xs">{p.name}</span>
                                                            <span className="text-[9px] opacity-70">Stock: {p.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-0 border-r h-10">
                                            <input 
                                                type="number" 
                                                ref={el => el && inputRefs.current.set(`${idx}-qty`, el)}
                                                value={row.qty} 
                                                onChange={e => handleRowChange(idx, 'qty', e.target.value)} 
                                                onKeyDown={e => { if (e.key === 'Enter') inputRefs.current.get(`${idx}-rate`)?.focus(); }}
                                                className="w-full h-full border-none bg-transparent px-3 text-right focus:ring-0 font-mono font-bold h-10" 
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-center text-gray-400 border-r uppercase font-black text-[9px] h-10">{row.unit || '-'}</td>
                                        <td className="p-0 border-r h-10">
                                            <input 
                                                type="number" 
                                                ref={el => el && inputRefs.current.set(`${idx}-rate`, el)}
                                                value={row.rate} 
                                                onChange={e => handleRowChange(idx, 'rate', e.target.value)} 
                                                onKeyDown={e => { 
                                                    if (e.key === 'Enter') {
                                                        if (idx === rows.length - 1 && row.productId) {
                                                            e.preventDefault();
                                                            addRow();
                                                        }
                                                    }
                                                }}
                                                className="w-full h-full border-none bg-transparent px-3 text-right focus:ring-0 font-mono h-10" 
                                            />
                                        </td>
                                        <td className="p-0 border-r h-10">
                                            <input type="number" value={row.gst} onChange={e => handleRowChange(idx, 'gst', e.target.value)} className="w-full h-full border-none bg-transparent px-3 text-center focus:ring-0 font-mono text-gray-500 h-10" />
                                        </td>
                                        <td className="py-2 px-3 text-right font-black text-gray-800 font-mono h-10">
                                            {formatNumber(row.amount)}
                                        </td>
                                        <td className="py-2 px-1 text-center h-10">
                                            <button onClick={() => deleteRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="bg-[#f1f5f9] border-t border-gray-300 p-4 flex flex-col md:flex-row gap-6 items-start flex-none">
                    <div className="flex-1 w-full md:w-auto">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Narration</label>
                        <textarea 
                            value={narration} 
                            onChange={e => setNarration(e.target.value)}
                            className="w-full h-20 bg-white border border-gray-300 p-2 rounded-sm resize-none text-xs focus:border-blue-500 outline-none shadow-inner"
                            placeholder="Type voucher remarks here..."
                        ></textarea>
                    </div>

                    <div className="w-full md:w-72 space-y-1.5 border-r border-gray-300 pr-6">
                        <div className="flex justify-between text-gray-600 font-semibold text-[11px]">
                            <span>Subtotal:</span>
                            <span className="font-mono">{formatNumber(totals.sub)}</span>
                        </div>
                        {gstType === 'INTRA' ? (
                            <>
                                <div className="flex justify-between text-gray-500 text-[10px]">
                                    <span>CGST:</span>
                                    <span className="font-mono">{formatNumber(totals.cgst)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 text-[10px]">
                                    <span>SGST:</span>
                                    <span className="font-mono">{formatNumber(totals.sgst)}</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-between text-gray-500 text-[10px]">
                                <span>IGST:</span>
                                <span className="font-mono">{formatNumber(totals.igst)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-blue-600 font-bold text-[11px]">
                            <span>Total Tax:</span>
                            <span className="font-mono">{formatNumber(totals.tax)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400 text-[10px] italic">
                            <span>Round Off:</span>
                            <span className="font-mono">{totals.roundOff.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="w-full md:w-80 flex flex-col gap-3">
                        <div className="bg-[#dbeafe] p-4 rounded-md border border-blue-200 flex justify-between items-center shadow-sm">
                            <span className="font-black text-blue-900 uppercase text-[10px]">Grand Total</span>
                            <span className="text-3xl font-black text-blue-900 tracking-tighter">₹ {formatNumber(totals.total)}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-600 font-black rounded-md hover:bg-gray-50 transition-all uppercase text-[9px] tracking-widest">
                                Cancel (Esc)
                            </button>
                            <button 
                                onClick={handlePreview}
                                className="flex-1 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-black rounded-md hover:bg-emerald-100 transition-all uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5"
                            >
                                <EyeIcon className="w-3.5 h-3.5" /> Preview
                            </button>
                            <button onClick={handleSave} className="flex-[2] py-2.5 bg-blue-600 text-white font-black rounded-md hover:bg-blue-700 shadow-md shadow-blue-200 transition-all uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5">
                                <CheckCircleIcon className="w-3.5 h-3.5" /> Save Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseEntry;
