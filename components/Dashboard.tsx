
import React, { useMemo, useState, useRef } from 'react';
import { useInventory } from '../hooks/useInventory';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product } from '../types';
import { getPurchaseSuggestion } from '../services/geminiService';
import Modal from './shared/Modal';
import { SparklesIcon, CalendarIcon, PrinterIcon, CheckCircleIcon, DollarSignIcon, ProductIcon, AlertTriangleIcon } from './shared/Icons';
import { getLocalDateString } from '../utils/formatters';

type DashboardProps = {
  setActiveView: (view: string) => void;
};

/**
 * Local helper to format numbers as integers (no decimals) 
 * using Indian numbering system for Dashboard display.
 */
const formatInt = (num: number | string | null | undefined): string => {
    const number = Math.round(Number(num));
    if (isNaN(number) || !isFinite(number)) return '0';
    return number.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const KPICard: React.FC<{ title: string; value: string; subtext: string; icon: React.ReactNode; color: string; onClick?: () => void; }> = ({ title, value, subtext, icon, color, onClick }) => (
    <div className={`bg-card p-6 rounded-[2rem] shadow-premium hover:shadow-elevated transition-all duration-500 hover:-translate-y-2 group cursor-pointer border border-slate-100 flex flex-col justify-between h-full`} onClick={onClick}>
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform shrink-0`}>
            {icon}
          </div>
          <div className="text-right min-w-0 flex-1">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] truncate">{title}</p>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black text-text-primary mt-1 tracking-tighter break-words leading-none">
              {value}
            </p>
          </div>
        </div>
        <div>
          <div className="h-px bg-slate-100 w-full mb-3"></div>
          <p className="text-[10px] text-text-secondary font-bold flex items-center gap-1.5 italic">
            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}></span>
            {subtext}
          </p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const { products, categories, outwards, departments, purchases, companyDetails, dailySales, getAccountingStock } = useInventory();
  
  const [startDate, setStartDate] = useState(() => {
      const now = new Date();
      return getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
      const now = new Date();
      return getLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  });

  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestion?: number; justification?: string; error?: string } | null>(null);
  const [loadingAiProductId, setLoadingAiProductId] = useState<number | null>(null);
  const [selectedProductForAi, setSelectedProductForAi] = useState<Product | null>(null);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  const activePeriodLabel = useMemo(() => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startMonth = start.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      const endMonth = end.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      if (startMonth === endMonth) return startMonth;
      return `${start.toLocaleDateString('en-IN', { timeZone: 'UTC' })} - ${end.toLocaleDateString('en-IN', { timeZone: 'UTC' })}`;
  }, [startDate, endDate]);

  const handleQuickFilter = (type: 'current' | 'last') => {
      const now = new Date();
      if (type === 'current') {
          setStartDate(getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1)));
          setEndDate(getLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
      } else if (type === 'last') {
          setStartDate(getLocalDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
          setEndDate(getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 0)));
      }
  };

  const periodStockValue = useMemo(() => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return products.reduce((acc, p) => {
          const audit = getAccountingStock(p.id, start, end);
          return acc + (audit.closingStock * p.purchasePrice);
      }, 0);
  }, [products, startDate, endDate, getAccountingStock]);

  const filteredPurchases = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return purchases.filter(p => new Date(p.date) >= start && new Date(p.date) <= end);
  }, [purchases, startDate, endDate]);

  const totalPayable = useMemo(() => filteredPurchases.reduce((acc, p) => acc + (p.totalAmount - p.paidAmount), 0), [filteredPurchases]);
  const lowStockCount = useMemo(() => products.filter(p => p.quantity <= p.reorderLevel).length, [products]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
  
  const dailyConsumptionData = useMemo(() => {
    const dataMap = new Map<string, any>();
    const start = new Date(startDate);
    const end = new Date(endDate);
    outwards.filter(o => new Date(o.date) >= start && new Date(o.date) <= end).forEach(outward => {
        const dateStr = getLocalDateString(outward.date);
        const department = departments.find(d => d.id === outward.departmentId);
        if (department) {
            if (!dataMap.has(dateStr)) {
                const [year, month, day] = dateStr.split('-').map(Number);
                const displayDate = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                const newEntry: { [key: string]: any } = { date: dateStr, displayDate, total: 0 };
                departments.forEach(d => { newEntry[d.name] = 0; });
                dataMap.set(dateStr, newEntry);
            }
            const entry = dataMap.get(dateStr);
            entry[department.name] = (entry[department.name] || 0) + outward.totalCost;
            entry.total += outward.totalCost;
        }
    });
    return Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [outwards, departments, startDate, endDate]);

  const handleGetAiSuggestion = async (product: Product) => {
    setLoadingAiProductId(product.id);
    setSelectedProductForAi(product);
    setAiSuggestion(null);
    try {
        const consumptionHistory = outwards.flatMap(o => 
            o.items.filter(i => i.productId === product.id).map(i => ({ date: o.date, quantity: i.quantity }))
        );
        const responseText = await getPurchaseSuggestion(product, consumptionHistory);
        const parsedResponse = JSON.parse(responseText);
        setAiSuggestion(parsedResponse);
    } catch (error) {
        console.error("Failed to parse AI suggestion:", error);
        setAiSuggestion({ error: "Received an invalid suggestion from the AI." });
    }
    setLoadingAiProductId(null);
    setAiModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Header Toolbar */}
      <div className="bg-card p-6 rounded-[2.5rem] shadow-premium border border-slate-100">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-black text-text-primary tracking-tighter">{companyDetails.dashboardTitle || 'Business Intelligence'}</h2>
                <div className="text-xs font-bold text-primary mt-1 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                   Reporting Period: {activePeriodLabel}
                </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                    <button onClick={() => handleQuickFilter('current')} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-xl hover:bg-white hover:shadow-sm transition-all">Current</button>
                    <button onClick={() => handleQuickFilter('last')} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-xl hover:bg-white hover:shadow-sm transition-all">Previous</button>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none px-2 text-[11px] font-black text-slate-600 focus:outline-none" />
                    <span className="text-slate-300 font-bold">/</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none px-2 text-[11px] font-black text-slate-600 focus:outline-none" />
                </div>
                <button onClick={() => window.print()} className="bg-slate-900 hover:bg-black text-white p-3 rounded-2xl shadow-lg transition-all active:scale-95">
                    <PrinterIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-8 pb-10">
        {/* Modern KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard title="Projected Stock" value={`₹${formatInt(periodStockValue)}`} subtext="Period Valuation" icon={<DollarSignIcon className="w-6 h-6 text-primary"/>} color="text-primary" onClick={() => setActiveView('Stock')} />
            <KPICard title="Unpaid Dues" value={`₹${formatInt(totalPayable)}`} subtext="Awaiting Clearance" icon={<DollarSignIcon className="w-6 h-6 text-rose-600"/>} color="text-rose-600" onClick={() => setActiveView('Accounts')} />
            <KPICard title="Critical Reorder" value={formatInt(lowStockCount)} subtext="Items below limit" icon={<AlertTriangleIcon className="w-6 h-6 text-amber-500"/>} color="text-amber-500" onClick={() => setActiveView('Stock')} />
            <KPICard title="Active Ledger" value={formatInt(products.length)} subtext="Total System SKUs" icon={<ProductIcon className="w-6 h-6 text-emerald-600"/>} color="text-emerald-600" onClick={() => setActiveView('Stock')} />
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-[2.5rem] shadow-premium border border-slate-100">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 text-text-secondary border-l-4 border-primary pl-4">Consumption Flow by Dept</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyConsumptionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                            <YAxis tickFormatter={(v) => `₹${formatInt(v)}`} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <Tooltip 
                                formatter={(value: any) => [`₹${formatInt(value)}`, '']}
                                contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '15px'}}
                                cursor={{fill: '#f8fafc', radius: 10}} 
                            />
                            <Legend iconType="circle" wrapperStyle={{paddingTop: '30px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px'}} />
                            {departments.map((dept, idx) => (
                                <Bar key={dept.id} dataKey={dept.name} stackId="a" fill={COLORS[idx % COLORS.length]} radius={idx === departments.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-card p-8 rounded-[2.5rem] shadow-premium border border-slate-100">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 text-text-secondary border-l-4 border-emerald-500 pl-4">Stock Inflow Analysis</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyConsumptionData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <YAxis tickFormatter={(v) => formatInt(v)} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <Tooltip 
                        formatter={(value: any) => [formatInt(value), 'Value']}
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} 
                      />
                      <Area type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Procurement Table */}
        <div className="bg-card p-8 rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary border-l-4 border-rose-500 pl-4">Immediate Procurement Required</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>Auto-refresh active</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
            {products.filter(p => p.quantity <= p.reorderLevel).length > 0 ? (
            <div className="overflow-x-auto -mx-8">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50">
                        <tr>
                            <th className="px-10 py-5">Product Master</th>
                            <th className="px-6 py-5 text-center">In Hand</th>
                            <th className="px-6 py-5 text-center">Safety Level</th>
                            <th className="px-6 py-5 text-right">Valuation</th>
                            <th className="px-10 py-5 text-right">AI Planning</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.filter(p => p.quantity <= p.reorderLevel).map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-10 py-6">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{product.name}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">HSN: {product.hsn || 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-6 text-center text-rose-600 font-black text-lg">{formatInt(product.quantity)} <span className="text-[10px] font-normal text-slate-400">{product.unit}</span></td>
                                <td className="px-6 py-6 text-center font-bold text-slate-400">{formatInt(product.reorderLevel)}</td>
                                <td className="px-6 py-6 text-right font-bold text-slate-900">₹{formatInt(product.quantity * product.purchasePrice)}</td>
                                <td className="px-10 py-6 text-right">
                                    <button 
                                        onClick={() => handleGetAiSuggestion(product)} 
                                        disabled={loadingAiProductId === product.id}
                                        className="inline-flex items-center gap-2 px-5 py-2 text-[10px] font-black text-white bg-indigo-600 rounded-xl uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <SparklesIcon className="w-3.5 h-3.5"/> {loadingAiProductId === product.id ? 'Optimizing...' : 'Optimized Plan'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            ) : (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
                    </div>
                    <p className="text-xl font-black text-slate-900 tracking-tight italic">Inventory Health is Optimal</p>
                    <p className="text-sm text-slate-500 mt-2">All items are above defined safety thresholds.</p>
                </div>
            )}
        </div>
      </div>
      
      <Modal 
        title={`AI Suggestion: ${selectedProductForAi?.name}`}
        isOpen={isAiModalOpen}
        onClose={() => setAiModalOpen(false)}
      >
          {aiSuggestion ? (
              <div className="space-y-6">
                  {aiSuggestion.error ? (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-rose-600">
                          <AlertTriangleIcon className="w-5 h-5 shrink-0" />
                          <p className="text-sm font-medium">{aiSuggestion.error}</p>
                      </div>
                  ) : (
                      <>
                          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] text-center">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Recommended Replenishment</p>
                              <p className="text-5xl font-black text-indigo-900 tracking-tighter">
                                  {formatInt(aiSuggestion.suggestion || 0)} <span className="text-xl font-bold opacity-40">{selectedProductForAi?.unit}</span>
                              </p>
                          </div>
                          <div className="space-y-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Intelligence Reason</p>
                              <p className="text-sm text-slate-600 bg-slate-50 p-5 rounded-2xl border border-slate-100 leading-relaxed italic">
                                  "{aiSuggestion.justification}"
                              </p>
                          </div>
                      </>
                  )}
                  <div className="flex gap-3 pt-4">
                      <button 
                          onClick={() => setAiModalOpen(false)}
                          className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest"
                      >
                        Dismiss
                      </button>
                      {!aiSuggestion.error && (
                        <button 
                            onClick={() => { setAiModalOpen(false); setActiveView('New Purchase'); }}
                            className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase text-[10px] tracking-widest"
                        >
                            Draft Purchase
                        </button>
                      )}
                  </div>
              </div>
          ) : (
              <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Consulting Gemini-3 Core...</p>
              </div>
          )}
      </Modal>
    </div>
  );
};

export default Dashboard;
