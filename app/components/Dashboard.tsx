
import React, { useMemo, useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product } from '../types';
import { getPurchaseSuggestion } from '../services/geminiService';
import Modal from './shared/Modal';
import { SparklesIcon } from './shared/Icons';

const formatNumber = (num: number) => num.toFixed(2);

type DashboardProps = {
  setActiveView: (view: string) => void;
};

const KPICard: React.FC<{ title: string; value: string; subtext: string; }> = ({ title, value, subtext }) => (
    <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
        <p className="text-xs text-text-secondary mt-2">{subtext}</p>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const { products, outwards, purchases, departments } = useInventory();

  // State for AI suggestions
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestion?: number; justification?: string; error?: string } | null>(null);
  const [loadingAiProductId, setLoadingAiProductId] = useState<number | null>(null);
  const [selectedProductForAi, setSelectedProductForAi] = useState<Product | null>(null);

  const handleGetAiSuggestion = async (product: Product) => {
    setLoadingAiProductId(product.id);
    setSelectedProductForAi(product);
    setAiSuggestion(null);
    try {
      const responseText = await getPurchaseSuggestion(product);
      const parsedResponse = JSON.parse(responseText);
      setAiSuggestion(parsedResponse);
    } catch (error) {
      console.error("Failed to parse AI suggestion:", error);
      setAiSuggestion({ error: "Received an invalid suggestion from the AI." });
    }
    setLoadingAiProductId(null);
    setAiModalOpen(true);
  };

  const totalStockValue = products.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
  const lowStockProducts = products.filter(p => p.quantity <= p.reorderLevel);
  const distinctProducts = products.length;
  const totalPayable = purchases.reduce((acc, p) => acc + (p.totalAmount - p.paidAmount), 0);

  const purchaseData = purchases.map(p => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Purchases: parseFloat(p.totalAmount.toFixed(2)),
  })).slice(0, 15).reverse();

  const outwardCostByDept = outwards.reduce((acc, outward) => {
    const dept = departments.find(d => d.id === outward.departmentId);
    const deptName = dept ? dept.name : 'Unknown Dept';
    acc[deptName] = (acc[deptName] || 0) + outward.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const deptChartData = Object.entries(outwardCostByDept).map(([name, cost]) => ({
      name,
      Cost: parseFloat(cost.toFixed(2)),
  }));

  const topConsumedItems = useMemo(() => {
    const consumption = new Map<number, { name: string; quantity: number, unit: string }>();
    outwards.forEach(outward => {
        outward.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const current = consumption.get(item.productId) || { name: product.name, quantity: 0, unit: product.unit };
                current.quantity += item.quantity;
                consumption.set(item.productId, current);
            }
        });
    });
    return Array.from(consumption.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [outwards, products]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Stock Value" value={formatNumber(totalStockValue)} subtext="Based on purchase price" />
        <KPICard title="Total Payable" value={formatNumber(totalPayable)} subtext="Amount owed to vendors" />
        <KPICard title="Low Stock Items" value={lowStockProducts.length.toString()} subtext="Items below reorder level" />
        <KPICard title="Distinct Products" value={distinctProducts.toString()} subtext="Total HSNs in inventory" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-4 text-text-primary">Outward Cost by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                    <Bar dataKey="Cost" fill="#3B82F6" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-card p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-4 text-text-primary">Recent Purchase Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={purchaseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                    <Bar dataKey="Purchases" fill="#10B981" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-4 text-text-primary">Low Stock Alerts</h3>
            {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Product Name</th>
                            <th scope="col" className="px-6 py-3">HSN</th>
                            <th scope="col" className="px-6 py-3 text-center">Current Qty</th>
                            <th scope="col" className="px-6 py-3 text-center">Reorder Level</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lowStockProducts.map((product: Product) => (
                            <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{product.name}</th>
                                <td className="px-6 py-4">{product.hsn}</td>
                                <td className="px-6 py-4 text-center text-red-600 font-bold">{product.quantity} {product.unit}</td>
                                <td className="px-6 py-4 text-center">{product.reorderLevel} {product.unit}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => setActiveView('Inventory')} className="font-medium text-primary hover:underline">Restock</button>
                                        <button 
                                            onClick={() => handleGetAiSuggestion(product)} 
                                            disabled={loadingAiProductId === product.id}
                                            className="px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-wait flex items-center gap-1 transition-all"
                                            aria-label={`Get AI suggestion for ${product.name}`}
                                        >
                                        {loadingAiProductId === product.id ? 'Thinking...' : <><SparklesIcon className="w-4 h-4"/> Suggest</>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            ) : (
                <p className="text-text-secondary">All products are adequately stocked.</p>
            )}
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-4 text-text-primary">Top 5 Most Consumed Items</h3>
            {topConsumedItems.length > 0 ? (
                <ul className="space-y-3">
                    {topConsumedItems.map(item => (
                        <li key={item.name} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-text-primary">{item.name}</span>
                            <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{item.quantity} {item.unit}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                 <p className="text-text-secondary">No consumption data available.</p>
            )}
        </div>
      </div>
        <Modal 
            title={`AI Suggestion for ${selectedProductForAi?.name}`}
            isOpen={isAiModalOpen}
            onClose={() => setAiModalOpen(false)}
        >
            {aiSuggestion ? (
                <div className="space-y-4">
                    {aiSuggestion.error ? (
                        <p className="text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">{aiSuggestion.error}</p>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-gray-500">Suggested Purchase Quantity</p>
                                <p className="text-4xl font-bold text-primary">{aiSuggestion.suggestion} <span className="text-2xl font-normal text-gray-600">{selectedProductForAi?.unit}</span></p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Justification</p>
                                <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-lg border">{aiSuggestion.justification}</p>
                            </div>
                        </>
                    )}
                    <div className="flex justify-end pt-4 gap-2">
                        <button 
                            onClick={() => setAiModalOpen(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                        >
                          Close
                        </button>
                        {!aiSuggestion.error && (
                             <button 
                                onClick={() => { setAiModalOpen(false); setActiveView('Inventory'); }}
                                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg"
                            >
                            Create Purchase
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <p>Thinking...</p>
            )}
        </Modal>
    </div>
  );
};

export default Dashboard;