
import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { formatNumber } from '../utils/formatters';

const commonSelectStyle = "w-full sm:w-auto px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

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
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
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
  sortKey: string;
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

const reportHeaders: Record<string, Record<string, string>> = {
    stock: { productName: 'Product Name', category: 'Category', quantity: 'Quantity', stockValue: 'Stock Value' },
    stock_ledger: { productName: 'Product Name', openingStock: 'Opening Stock', openingValue: 'Opening Value', inward: 'Inward', inwardValue: 'Inward Value', outward: 'Outward', outwardValue: 'Outward Value', closingStock: 'Closing Stock', closingValue: 'Closing Value' },
    outwards: { date: 'Date', department: 'Department', product: 'Product', quantity: 'Quantity', costAtTime: 'Cost At Time', totalCost: 'Total Cost' },
    department_consumption: { department: 'Department', totalItemsConsumed: 'Total Items Consumed', totalConsumptionCost: 'Total Consumption Cost' },
    detailed_department_consumption: { productName: 'Product Name', category: 'Category', unit: 'Unit', totalQuantityConsumed: 'Total Quantity Consumed', averageCost: 'Average Cost', totalCost: 'Total Cost' },
};


const Reports: React.FC = () => {
    const { products, outwards, purchases, categories, departments } = useInventory();
    const [reportType, setReportType] = useState('stock');
    const [primaryFilter, setPrimaryFilter] = useState('');
    const [secondaryFilter, setSecondaryFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');


    const generatedData = useMemo((): any[] => {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const dateFilter = (itemDate: Date) => {
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        };
        
        const filteredOutwards = outwards.filter(o => dateFilter(o.date));
        const filteredPurchases = purchases.filter(p => dateFilter(p.date));

        switch (reportType) {
            case 'stock_ledger': {
                if (!start || !end) return [];
                
                const report = products.map(product => {
                    let inwardedQty = 0;
                    let inwardedValue = 0;
                    filteredPurchases.forEach(p => p.items.forEach(item => {
                        if (item.productId === product.id) {
                            inwardedQty += item.quantity;
                            inwardedValue += item.quantity * item.unitCost;
                        }
                    }));

                    let outwardedQty = 0;
                    let outwardedValue = 0;
                    filteredOutwards.forEach(o => o.items.forEach(item => {
                        if (item.productId === product.id) {
                            outwardedQty += item.quantity;
                            outwardedValue += item.quantity * item.costAtTime;
                        }
                    }));

                    const closingQty = product.quantity;
                    const closingValue = closingQty * product.purchasePrice;
                    const openingQty = closingQty - inwardedQty + outwardedQty;
                    const openingValue = openingQty * product.purchasePrice; 

                    if (openingQty === 0 && inwardedQty === 0 && outwardedQty === 0 && closingQty === 0) return null;

                    return {
                        productName: product.name,
                        openingStock: `${openingQty} ${product.unit}`,
                        openingValue: formatNumber(openingValue),
                        inward: `${inwardedQty} ${product.unit}`,
                        inwardValue: formatNumber(inwardedValue),
                        outward: `${outwardedQty} ${product.unit}`,
                        outwardValue: formatNumber(outwardedValue),
                        closingStock: `${closingQty} ${product.unit}`,
                        closingValue: formatNumber(closingValue),
                        categoryId: product.categoryId,
                    };
                }).filter(Boolean);
                
                return primaryFilter ? report.filter(item => item && item.categoryId === parseInt(primaryFilter, 10)) : report;
            }
            case 'detailed_department_consumption': {
                if (!primaryFilter) return [];
                const deptId = parseInt(primaryFilter, 10);
                const consumption = new Map<number, { productId: number, totalQuantity: number, totalCost: number }>();
                filteredOutwards.filter(o => o.departmentId === deptId).forEach(o => o.items.forEach(item => {
                    const existing = consumption.get(item.productId) || { productId: item.productId, totalQuantity: 0, totalCost: 0 };
                    existing.totalQuantity += item.quantity;
                    existing.totalCost += item.quantity * item.costAtTime;
                    consumption.set(item.productId, existing);
                }));

                let detailedReport = Array.from(consumption.values()).map(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    return {
                        productName: product.name,
                        category: categories.find(c => c.id === product.categoryId)?.name || 'N/A',
                        unit: product.unit,
                        totalQuantityConsumed: item.totalQuantity,
                        averageCost: formatNumber(item.totalCost / item.totalQuantity),
                        totalCost: formatNumber(item.totalCost),
                        categoryId: product.categoryId,
                    };
                }).filter(Boolean);

                return secondaryFilter ? detailedReport.filter(item => item && item.categoryId === parseInt(secondaryFilter, 10)) : detailedReport;
            }
            case 'department_consumption': {
                const consumptionByDept = new Map<number, { name: string; totalItems: number; totalCost: number }>();
                departments.forEach(dept => consumptionByDept.set(dept.id, { name: dept.name, totalItems: 0, totalCost: 0 }));
                filteredOutwards.forEach(outward => {
                    const dept = consumptionByDept.get(outward.departmentId);
                    if (dept) {
                        dept.totalCost += outward.totalCost;
                        dept.totalItems += outward.items.reduce((sum, item) => sum + item.quantity, 0);
                    }
                });
                return Array.from(consumptionByDept.values()).map(d => ({
                    department: d.name,
                    totalItemsConsumed: d.totalItems,
                    totalConsumptionCost: formatNumber(d.totalCost),
                }));
            }
            case 'outwards':
                return filteredOutwards.filter(o => primaryFilter ? o.departmentId.toString() === primaryFilter : true).flatMap(o => {
                    const department = departments.find(d => d.id === o.departmentId)?.name || 'N/A';
                    return o.items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return {
                            date: o.date.toLocaleDateString(),
                            department,
                            product: product?.name || 'N/A',
                            quantity: item.quantity,
                            costAtTime: formatNumber(item.costAtTime),
                            totalCost: formatNumber(item.quantity * item.costAtTime),
                        };
                    });
                });
            case 'stock':
            default:
                return products.filter(p => primaryFilter ? p.categoryId.toString() === primaryFilter : true).map(p => ({ 
                    productName: p.name, 
                    category: categories.find(c=>c.id === p.categoryId)?.name || 'N/A',
                    quantity: `${p.quantity} ${p.unit}`,
                    stockValue: formatNumber(p.quantity * p.purchasePrice)
                }));
        }
    }, [reportType, primaryFilter, secondaryFilter, startDate, endDate, products, outwards, purchases, categories, departments]);
    
    const { items: sortedData, requestSort, sortConfig } = useSortableData(generatedData);
    const currentHeaders = reportHeaders[reportType] || {};

    const handleExportCSV = () => {
        if (sortedData.length === 0) {
            alert("No data available to export.");
            return;
        }
        
        const headersLabels = Object.values(currentHeaders);
        const keys = Object.keys(currentHeaders);

        // Correct CSV Mapping logic
        const rows = sortedData.map(row => 
            keys.map(key => {
                const val = (row as any)[key];
                // Handle missing values and escape double quotes
                const escaped = String(val ?? "").replace(/"/g, '""'); 
                return `"${escaped}"`;
            }).join(",")
        );

        const csvContent = [headersLabels.join(","), ...rows].join("\n");
        
        // Use Blob for robust file generation (fixes the 'empty CSV' issue caused by encodeURI truncation)
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        const datePart = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
        link.setAttribute("download", `${reportType}_report${datePart}.csv`);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const needsDateFilter = ['outwards', 'department_consumption', 'detailed_department_consumption', 'stock_ledger'].includes(reportType);

    const getFilterOptions = () => {
        switch (reportType) {
            case 'stock_ledger':
            case 'stock':
                return <select value={primaryFilter} onChange={e => setPrimaryFilter(e.target.value)} className={commonSelectStyle}><option value="">All Categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>;
             case 'detailed_department_consumption':
                return (
                    <>
                        <select value={primaryFilter} onChange={e => setPrimaryFilter(e.target.value)} className={commonSelectStyle}>
                            <option value="">-- Select Department --</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={secondaryFilter} onChange={e => setSecondaryFilter(e.target.value)} className={commonSelectStyle} disabled={!primaryFilter}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </>
                );
            case 'outwards':
                 return <select value={primaryFilter} onChange={e => setPrimaryFilter(e.target.value)} className={commonSelectStyle}><option value="">All Departments</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>;
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Reports</h2>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-wrap">
                    <select value={reportType} onChange={e => { setReportType(e.target.value); setPrimaryFilter(''); setSecondaryFilter(''); setStartDate(''); setEndDate(''); }} className={commonSelectStyle}>
                        <option value="stock">Stock Level Report</option>
                        <option value="stock_ledger">Stock Ledger Report</option>
                        <option value="outwards">Stock Outward Report</option>
                        <option value="department_consumption">Department Consumption Summary</option>
                        <option value="detailed_department_consumption">Detailed Department Consumption</option>
                    </select>
                    {getFilterOptions()}
                    {needsDateFilter && (
                        <>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonSelectStyle} />
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={commonSelectStyle} />
                        </>
                    )}
                </div>
                <button onClick={handleExportCSV} disabled={sortedData.length === 0} className="w-full md:w-auto bg-secondary hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">Export to CSV</button>
            </div>
            
            <div className="overflow-x-auto">
                {sortedData.length > 0 ? (
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            {Object.entries(currentHeaders).map(([key, label]) => <SortableHeader key={key} label={label} sortKey={key} requestSort={requestSort} sortConfig={sortConfig} className="whitespace-nowrap"/>)}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                {Object.keys(currentHeaders).map(key => <td key={key} className="px-6 py-4 whitespace-nowrap">{(row as any)[key]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
                ) : (
                    <p className="text-center py-8 text-text-secondary">
                        {reportType === 'detailed_department_consumption' && !primaryFilter
                            ? "Please select a department to view the report."
                            : (reportType === 'stock_ledger' && (!startDate || !endDate))
                            ? "Please select a start and end date to generate the stock ledger."
                            : "No data available for the selected filters."
                        }
                    </p>
                )}
            </div>
        </div>
    );
};

export default Reports;
