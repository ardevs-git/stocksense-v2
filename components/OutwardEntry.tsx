
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { Product, OutwardTransaction } from '../types';
import { CloseIcon, TrashIcon, CheckCircleIcon, EyeIcon } from './shared/Icons';
import { getLocalDateString, formatNumber, formatQuantity } from '../utils/formatters';
import { generateOutwardPreviewHTML } from '../utils/previewHelpers';

interface OutwardEntryProps {
    onClose: () => void;
    outwardToEditId?: string;
}

const commonInputStyle = "w-full bg-white border border-gray-300 px-2 py-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-semibold text-gray-700 text-sm h-9 rounded-sm transition-all";

const OutwardEntry: React.FC<OutwardEntryProps> = ({ onClose, outwardToEditId }) => {
    const { departments, products, outwards, recordOutward, updateOutward, companyDetails } = useInventory();

    const outwardToEdit = useMemo(() => 
        outwardToEditId ? outwards.find(o => o.id === outwardToEditId) : undefined
    , [outwardToEditId, outwards]);

    const [date, setDate] = useState(getLocalDateString());
    const [departmentId, setDepartmentId] = useState<string>('');
    const [requisitionNumber, setRequisitionNumber] = useState('');
    const [rows, setRows] = useState<any[]>([{ id: Date.now().toString(), productId: '', name: '', available: 0, qty: '', rate: 0, amount: 0, unit: '', searchQuery: '' }]);
    const [narration, setNarration] = useState('');
    const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);
    const [highlightedItemIdx, setHighlightedItemIdx] = useState<number>(0);

    const inputRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when rows are added
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [rows.length]);

    // Ensure search suggestions are visible in viewport
    useEffect(() => {
        if (activeSuggestionIdx !== null && scrollContainerRef.current) {
            const inputEl = inputRefs.current.get(`${activeSuggestionIdx}-searchQuery`);
            if (inputEl) {
                // Scroll input to center so suggestions have room below
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeSuggestionIdx, rows[activeSuggestionIdx || 0]?.searchQuery]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSave();
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [rows, departmentId, date, requisitionNumber]);

    useEffect(() => {
        if (outwardToEdit) {
            setDate(getLocalDateString(outwardToEdit.date));
            setDepartmentId(outwardToEdit.departmentId.toString());
            setRequisitionNumber(outwardToEdit.requisitionNumber || '');
            setRows(outwardToEdit.items.map((i, idx) => {
                const p = products.find(prod => prod.id === i.productId);
                return {
                    id: `edit-${idx}`,
                    productId: i.productId.toString(),
                    name: p?.name || '',
                    searchQuery: p?.name || '',
                    available: (p?.quantity || 0) + i.quantity,
                    qty: i.quantity,
                    rate: i.costAtTime,
                    amount: i.quantity * i.costAtTime,
                    unit: p?.unit || ''
                };
            }));
        }
    }, [outwardToEdit, products]);

    const totals = useMemo(() => {
        const qty = rows.reduce((a, r) => a + (Number(r.qty) || 0), 0);
        const value = rows.reduce((a, r) => a + (Number(r.amount) || 0), 0);
        return { qty, value };
    }, [rows]);

    const handleRowChange = (idx: number, field: string, value: any) => {
        const newRows = [...rows];
        const row = { ...newRows[idx], [field]: value };
        
        if (field === 'searchQuery') {
            setHighlightedItemIdx(0);
        }

        if (field === 'productId') {
            const p = products.find(prod => prod.id === parseInt(value));
            row.productId = value;
            row.name = p?.name || '';
            row.searchQuery = p?.name || '';
            row.available = (p?.quantity || 0);
            row.rate = p?.purchasePrice || 0;
            row.unit = p?.unit || '';
            
            if (value && (!row.qty || row.qty === 0)) {
                row.qty = 1;
            }
            
            setActiveSuggestionIdx(null);
        }
        
        row.amount = Number(row.qty || 0) * Number(row.rate || 0);
        newRows[idx] = row;
        setRows(newRows);
    };

    const addRow = () => {
        const newId = Date.now().toString();
        setRows(prev => [...prev, { id: newId, productId: '', name: '', available: 0, qty: '', rate: 0, amount: 0, unit: '', searchQuery: '' }]);
        setTimeout(() => {
            const nextIdx = rows.length;
            inputRefs.current.get(`${nextIdx}-searchQuery`)?.focus();
        }, 50);
    };

    const deleteRow = (idx: number) => {
        if (rows.length > 1) setRows(rows.filter((_, i) => i !== idx));
    };

    const handlePreview = () => {
        if (!departmentId) return alert("Select Department first to see preview");
        const dept = departments.find(d => d.id === parseInt(departmentId));
        if (!dept) return;

        const validItems = rows.filter(r => r.productId && Number(r.qty) > 0);
        if (!validItems.length) return alert("Add at least one item to preview");

        const previewItems = validItems.map(r => {
            const product = products.find(p => p.id === parseInt(r.productId));
            return {
                product: product!,
                quantity: Number(r.qty)
            };
        });

        const htmlContent = generateOutwardPreviewHTML({
            companyDetails,
            department: dept,
            date: date,
            requisitionNumber: requisitionNumber || 'DRAFT',
            items: previewItems
        });

        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
        }
    };

    const handleSave = () => {
        if (!departmentId) return alert("Select Dept");
        const validItems = rows.filter(r => r.productId && Number(r.qty) > 0);
        if (!validItems.length) return alert("No items added");

        for (const item of validItems) {
            if (Number(item.qty) > item.available) {
                alert(`Insufficient stock for ${item.name}`);
                return;
            }
        }

        const dataItems = validItems.map(r => ({
            productId: parseInt(r.productId),
            quantity: Number(r.qty),
            costAtTime: r.rate
        }));

        if (outwardToEdit) {
            updateOutward({
                id: outwardToEdit.id,
                departmentId: parseInt(departmentId),
                requisitionNumber,
                date: new Date(date),
                items: dataItems,
                totalCost: totals.value
            });
        } else {
            recordOutward(dataItems, parseInt(departmentId), new Date(date), requisitionNumber);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#f1f5f9] flex flex-col h-screen w-screen overflow-hidden select-none font-sans text-xs">
            <div className="bg-[#1e293b] text-white flex-none flex items-center justify-between px-6 h-12 shadow-lg z-30">
                <h1 className="text-lg font-black tracking-tight uppercase">{outwardToEdit ? 'Edit Stock Outward' : 'Stock Outward Entry'}</h1>
                <button onClick={onClose} className="hover:bg-red-500 p-2 rounded transition-colors">
                    <CloseIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="p-4 grid grid-cols-12 gap-6 bg-[#f8fafc] border-b border-gray-200">
                    <div className="col-span-5">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Recipient Department</label>
                        <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className={commonInputStyle} autoFocus>
                            <option value="">-- Select Department --</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Voucher No.</label>
                        <input type="text" value={requisitionNumber} onChange={e => setRequisitionNumber(e.target.value)} className={commonInputStyle} placeholder="AUTO" />
                    </div>
                    <div className="col-span-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={commonInputStyle} />
                    </div>
                </div>

                <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-[#f1f5f9] text-gray-700 font-black text-[10px] uppercase tracking-wider z-20 border-b border-gray-300">
                            <tr>
                                <th className="p-3 w-12 text-center border-r">#</th>
                                <th className="p-3 text-left border-r">Item Description</th>
                                <th className="p-3 w-32 text-right border-r">In Hand</th>
                                <th className="p-3 w-32 text-right border-r">Quantity</th>
                                <th className="p-3 w-24 text-center border-r">Unit</th>
                                <th className="p-3 w-40 text-right border-r">Cost Rate</th>
                                <th className="p-3 w-44 text-right">Value</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const filteredSuggestions = products.filter(p => 
                                    p.name.toLowerCase().includes(row.searchQuery?.toLowerCase() || '')
                                ).slice(0, 10);

                                return (
                                    <tr key={row.id} className="group border-b border-gray-100 hover:bg-emerald-50/30">
                                        <td className="p-3 text-center text-gray-400 font-mono border-r">{idx + 1}</td>
                                        <td className="p-0 border-r relative">
                                            <input 
                                                type="text"
                                                ref={el => el && inputRefs.current.set(`${idx}-searchQuery`, el)}
                                                value={row.searchQuery}
                                                onChange={e => { handleRowChange(idx, 'searchQuery', e.target.value); setActiveSuggestionIdx(idx); }}
                                                onFocus={() => { setActiveSuggestionIdx(idx); setHighlightedItemIdx(0); }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        if (filteredSuggestions.length > 0 && !row.productId) {
                                                            const itemToSelect = filteredSuggestions[highlightedItemIdx] || filteredSuggestions[0];
                                                            handleRowChange(idx, 'productId', itemToSelect.id.toString());
                                                            setTimeout(() => inputRefs.current.get(`${idx}-qty`)?.focus(), 10);
                                                        } else if (row.productId) {
                                                            inputRefs.current.get(`${idx}-qty`)?.focus();
                                                        }
                                                    } else if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setHighlightedItemIdx(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setHighlightedItemIdx(prev => Math.max(prev - 1, 0));
                                                    }
                                                }}
                                                className="w-full h-full border-none bg-transparent px-3 py-3 focus:ring-0 font-bold text-gray-900 outline-none"
                                            />
                                            {activeSuggestionIdx === idx && row.searchQuery && !row.productId && (
                                                <div className="absolute left-0 right-0 top-full bg-white border border-emerald-200 shadow-2xl z-50 max-h-60 overflow-y-auto rounded-b-md">
                                                    {filteredSuggestions.map((p, pIdx) => (
                                                        <div 
                                                            key={p.id} 
                                                            onMouseDown={() => handleRowChange(idx, 'productId', p.id.toString())} 
                                                            onMouseEnter={() => setHighlightedItemIdx(pIdx)}
                                                            className={`px-4 py-2 cursor-pointer border-b border-gray-50 flex justify-between items-center transition-colors ${highlightedItemIdx === pIdx ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50'}`}
                                                        >
                                                            <span className="font-bold">{p.name}</span>
                                                            <span className="text-[10px] opacity-70">Avail: {p.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-right text-gray-400 font-mono border-r">{formatQuantity(row.available)}</td>
                                        <td className="p-0 border-r">
                                            <input 
                                                type="number" 
                                                ref={el => el && inputRefs.current.set(`${idx}-qty`, el)}
                                                value={row.qty} 
                                                onChange={e => handleRowChange(idx, 'qty', e.target.value)}
                                                onKeyDown={e => { 
                                                    if (e.key === 'Enter') {
                                                        if (idx === rows.length - 1 && row.productId) {
                                                            e.preventDefault();
                                                            addRow();
                                                        }
                                                    }
                                                }}
                                                className={`w-full border-none bg-transparent px-3 py-3 text-right focus:ring-0 font-mono font-bold ${Number(row.qty) > row.available ? 'text-red-600' : 'text-gray-900'}`} 
                                            />
                                        </td>
                                        <td className="p-3 text-center text-gray-400 border-r uppercase font-black text-[10px]">{row.unit || '-'}</td>
                                        <td className="p-3 text-right text-gray-500 border-r font-mono">{formatNumber(row.rate)}</td>
                                        <td className="p-3 text-right font-black text-gray-800 font-mono">{formatNumber(row.amount)}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => deleteRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="bg-[#f1f5f9] border-t border-gray-300 p-6 flex flex-col md:flex-row gap-6 items-start flex-none">
                    <div className="flex-1 w-full md:w-auto">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Narration / Purpose</label>
                        <textarea 
                            value={narration} 
                            onChange={e => setNarration(e.target.value)}
                            className="w-full h-24 bg-white border border-gray-300 p-3 rounded-sm resize-none text-sm focus:border-emerald-500 outline-none shadow-inner"
                            placeholder="Reason for issuance..."
                        ></textarea>
                    </div>

                    <div className="w-full md:w-80 space-y-2 border-r border-gray-300 pr-6">
                        <div className="flex justify-between text-gray-500 uppercase font-black text-[10px] tracking-widest">
                            <span>Total Quantity:</span>
                            <span className="font-mono text-gray-900 text-sm">{formatQuantity(totals.qty)}</span>
                        </div>
                        <div className="h-px bg-gray-300 my-1"></div>
                        <div className="flex justify-between text-emerald-700 font-bold uppercase text-[10px] tracking-widest">
                            <span>Movement Value:</span>
                            <span className="font-mono text-sm">{formatNumber(totals.value)}</span>
                        </div>
                    </div>

                    <div className="w-full md:w-96 flex flex-col gap-4">
                        <div className="bg-[#ecfdf5] p-5 rounded-md border border-emerald-200 flex justify-between items-center shadow-sm">
                            <span className="font-black text-emerald-900 uppercase text-xs tracking-tighter">Total Issuance Value</span>
                            <span className="text-4xl font-black text-emerald-900 tracking-tighter">₹ {formatNumber(totals.value)}</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 font-black rounded-md hover:bg-gray-50 transition-all uppercase text-[10px] tracking-widest">
                                Quit (Esc)
                            </button>
                            <button 
                                onClick={handlePreview}
                                className="flex-1 py-3 bg-emerald-50 border border-indigo-200 text-indigo-700 font-black rounded-md hover:bg-emerald-100 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                            >
                                <EyeIcon className="w-4 h-4" /> Slip Preview
                            </button>
                            <button onClick={handleSave} className="flex-[2] py-3 bg-emerald-600 text-white font-black rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" /> Save Voucher (Ctrl+A)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutwardEntry;
