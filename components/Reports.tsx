
import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { formatNumber, formatQuantity, getCurrentMonthRange } from '../utils/formatters';
import { generatePurchaseInvoiceSummaryPDF, generateDetailedPurchaseReportPDF } from '../utils/previewHelpers';
import { FileTextIcon } from './shared/Icons';
import ExcelJS from 'exceljs';

const commonSelectStyle = "w-full sm:w-auto px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm";

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
        const valA = (a as any)[sortConfig.key];
        const valB = (b as any)[sortConfig.key];
        
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
    purchases: { date: 'Date', invoiceNumber: 'Invoice #', vendor: 'Vendor', product: 'Product', quantity: 'Quantity', unitCost: 'Rate', gstRate: 'GST %', gstAmount: 'GST Amount', totalCost: 'Total' },
    department_consumption: { department: 'Department', totalItemsConsumed: 'Total Items Consumed', totalConsumptionCost: 'Total Consumption Cost' },
    detailed_department_consumption: { productName: 'Product Name', category: 'Category', unit: 'Unit', totalQuantityConsumed: 'Total Quantity Consumed', averageCost: 'Average Cost', totalCost: 'Total Cost' },
    invoice_purchases_summary: { sr: 'Sr. No.', date: 'Date', invoiceNumber: 'Invoice #', vendorName: 'Vendor Name', totalAmount: 'Amount' },
    item_purchase_history: { date: 'Date', productName: 'Item Name', category: 'Category', vendor: 'Purchased From (Vendor)', invoiceNumber: 'Invoice #', purchasedQty: 'Purchased Qty', unitCost: 'Rate', currentStock: 'Current System Stock' },
    item_purchase_matrix: { sr: 'SR no.', productName: 'Item Name' }, 
    item_stock_flow: { productName: 'Item Name', openingQty: 'Opening Qty', openingCost: 'Opening Cost', purchasedQty: 'Purchased Qty', purchasedCost: 'Purchased Cost', closingQty: 'Closing Qty', closingCost: 'Closing Cost' },
    activity_log: { timestamp: 'Time', entity: 'Entity', action: 'Action', details: 'Details' },
    dept_cat_consumption: { department: 'Department', category: 'Category', totalConsumed: 'Total Consumed (Val)', deptTotal: 'Dept. Total Cost' }
};

const Reports: React.FC = () => {
    const { products, outwards, purchases, vendors, categories, departments, companyDetails, activityLogs } = useInventory();
    const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
    
    const [reportType, setReportType] = useState('stock');
    const [primaryFilter, setPrimaryFilter] = useState('');
    const [secondaryFilter, setSecondaryFilter] = useState('');
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [isExportingExcel, setIsExportingExcel] = useState(false);

    // Date range filter helpers
    const getFilteredOutwards = useMemo(() => {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return outwards.filter(o => {
            const outwardDate = new Date(o.date);
            if (start && outwardDate < start) return false;
            if (end && outwardDate > end) return false;
            return true;
        });
    }, [outwards, startDate, endDate]);

    const getFilteredPurchases = useMemo(() => {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return purchases.filter(p => {
            const purchaseDate = new Date(p.date);
            if (start && purchaseDate < start) return false;
            if (end && purchaseDate > end) return false;
            return true;
        });
    }, [purchases, startDate, endDate]);

    // Unique Purchase Dates for Matrix Report
    const uniquePurchaseDates = useMemo(() => {
        if (reportType !== 'item_purchase_matrix') return [];
        const dates = new Set<string>();
        getFilteredPurchases.forEach(p => {
            dates.add(new Date(p.date).toISOString().split('T')[0]);
        });
        return Array.from(dates).sort();
    }, [getFilteredPurchases, reportType]);

    // Data generation for different report types
    const generatedData = useMemo((): any[] => {
        const searchLower = itemSearchTerm.trim().toLowerCase();

        switch (reportType) {
            case 'item_purchase_matrix': {
                const dates = uniquePurchaseDates;
                return products.map((p, idx) => {
                    if (searchLower && !p.name.toLowerCase().includes(searchLower)) return null;
                    if (primaryFilter && p.categoryId.toString() !== primaryFilter) return null;
                    if (secondaryFilter && p.id.toString() !== secondaryFilter) return null;

                    const row: any = {
                        sr: idx + 1,
                        productName: p.name,
                        totalPurchasedQty: 0
                    };

                    dates.forEach(date => {
                        let dateQty = 0;
                        getFilteredPurchases.forEach(purchase => {
                            if (new Date(purchase.date).toISOString().split('T')[0] === date) {
                                purchase.items.forEach(item => {
                                    if (item.productId === p.id) dateQty += item.quantity;
                                });
                            }
                        });
                        row[date] = dateQty || ''; 
                        row.totalPurchasedQty += dateQty;
                    });

                    if (row.totalPurchasedQty === 0) return null;
                    return row;
                }).filter(Boolean);
            }
            case 'dept_cat_consumption': {
                if (!startDate || !endDate) return [];
                const deptMap = new Map<number, Map<number, number>>();
                getFilteredOutwards.forEach(o => {
                    if (!deptMap.has(o.departmentId)) deptMap.set(o.departmentId, new Map());
                    const catMap = deptMap.get(o.departmentId)!;
                    o.items.forEach(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (product) {
                            const catId = product.categoryId;
                            const amount = item.quantity * item.costAtTime;
                            catMap.set(catId, (catMap.get(catId) || 0) + amount);
                        }
                    });
                });
                const finalRows: any[] = [];
                Array.from(deptMap.entries()).forEach(([deptId, catMap]) => {
                    const deptName = departments.find(d => d.id === deptId)?.name || 'Unknown';
                    const catEntries = Array.from(catMap.entries());
                    const deptTotal = catEntries.reduce((sum, [_, amt]) => sum + amt, 0);
                    catEntries.forEach(([catId, amount], idx) => {
                        finalRows.push({
                            departmentId: deptId,
                            department: deptName,
                            categoryId: catId,
                            category: categories.find(c => c.id === catId)?.name || 'Unknown',
                            totalConsumed: amount,
                            deptTotal: deptTotal,
                            isFirstInDept: idx === 0,
                            rowCountInDept: catEntries.length
                        });
                    });
                });
                return finalRows;
            }
            case 'item_stock_flow': {
                const start = startDate ? new Date(startDate) : new Date(0);
                const end = endDate ? new Date(endDate) : new Date();
                if (endDate) end.setHours(23, 59, 59, 999);
                return products.map(product => {
                    if (primaryFilter && product.categoryId.toString() !== primaryFilter) return null;
                    if (searchLower && !product.name.toLowerCase().includes(searchLower)) return null;
                    let postPeriodPurchasedQty = 0;
                    purchases.forEach(p => { if (new Date(p.date) > end) p.items.forEach(item => { if (item.productId === product.id) postPeriodPurchasedQty += item.quantity; }); });
                    let postPeriodOutwardQty = 0;
                    outwards.forEach(o => { if (new Date(o.date) > end) o.items.forEach(item => { if (item.productId === product.id) postPeriodOutwardQty += item.quantity; }); });
                    const closingQtyAtEndDate = product.quantity - postPeriodPurchasedQty + postPeriodOutwardQty;
                    let periodPurchasedQty = 0;
                    let periodPurchasedCost = 0;
                    purchases.forEach(p => {
                        const d = new Date(p.date);
                        if (d >= start && d <= end) p.items.forEach(item => { if (item.productId === product.id) { periodPurchasedQty += item.quantity; periodPurchasedCost += (item.quantity * item.unitCost); } });
                    });
                    let periodOutwardQty = 0;
                    outwards.forEach(o => { const d = new Date(o.date); if (d >= start && d <= end) o.items.forEach(item => { if (item.productId === product.id) periodOutwardQty += item.quantity; }); });
                    const openingQtyAtStartDate = closingQtyAtEndDate - periodPurchasedQty + periodOutwardQty;
                    const openingCost = openingQtyAtStartDate * product.purchasePrice;
                    const closingCost = closingQtyAtEndDate * product.purchasePrice;
                    return { productName: product.name, openingQty: `${formatQuantity(openingQtyAtStartDate)} ${product.unit}`, openingCost: formatNumber(openingCost), purchasedQty: `${formatQuantity(periodPurchasedQty)} ${product.unit}`, purchasedCost: formatNumber(periodPurchasedCost), closingQty: `${formatQuantity(closingQtyAtEndDate)} ${product.unit}`, closingCost: formatNumber(closingCost), categoryId: product.categoryId };
                }).filter(Boolean);
            }
            case 'stock_ledger': {
                if (!startDate || !endDate) return [];
                const report = products.map(product => {
                    if (searchLower && !product.name.toLowerCase().includes(searchLower)) return null;
                    let inwardedQty = 0;
                    let inwardedValue = 0;
                    getFilteredPurchases.forEach(p => p.items.forEach(item => { if (item.productId === product.id) { inwardedQty += item.quantity; inwardedValue += item.quantity * item.unitCost; } }));
                    let outwardedQty = 0;
                    let outwardedValue = 0;
                    getFilteredOutwards.forEach(o => o.items.forEach(item => { if (item.productId === product.id) { outwardedQty += item.quantity; outwardedValue += item.quantity * item.costAtTime; } }));
                    const closingQty = product.quantity;
                    const closingValue = closingQty * product.purchasePrice;
                    const openingQty = closingQty - inwardedQty + outwardedQty;
                    const openingValue = openingQty * product.purchasePrice; 
                    if (openingQty === 0 && inwardedQty === 0 && outwardedQty === 0 && closingQty === 0) return null;
                    return { productName: product.name, openingStock: `${openingQty} ${product.unit}`, openingValue: formatNumber(openingValue), inward: `${inwardedQty} ${product.unit}`, inwardValue: formatNumber(inwardedValue), outward: `${outwardedQty} ${product.unit}`, outwardValue: formatNumber(outwardedValue), closingStock: `${closingQty} ${product.unit}`, closingValue: formatNumber(closingValue), categoryId: product.categoryId };
                }).filter(Boolean);
                return primaryFilter ? report.filter(item => item && item.categoryId === parseInt(primaryFilter, 10)) : report;
            }
            case 'detailed_department_consumption': {
                if (!primaryFilter) return [];
                const deptId = parseInt(primaryFilter, 10);
                const consumption = new Map<number, { productId: number, totalQuantity: number, totalCost: number }>();
                getFilteredOutwards.filter(o => o.departmentId === deptId).forEach(o => o.items.forEach(item => {
                    const existing = consumption.get(item.productId) || { productId: item.productId, totalQuantity: 0, totalCost: 0 };
                    existing.totalQuantity += item.quantity;
                    existing.totalCost += item.quantity * item.costAtTime;
                    consumption.set(item.productId, existing);
                }));
                let detailedReport = Array.from(consumption.values()).map(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    if (searchLower && !product.name.toLowerCase().includes(searchLower)) return null;
                    return { productName: product.name, category: categories.find(c => c.id === product.categoryId)?.name || 'N/A', unit: product.unit, totalQuantityConsumed: item.totalQuantity, averageCost: formatNumber(item.totalCost / item.totalQuantity), totalCost: formatNumber(item.totalCost), categoryId: product.categoryId };
                }).filter(Boolean);
                return secondaryFilter ? detailedReport.filter(item => item && item.categoryId === parseInt(secondaryFilter, 10)) : detailedReport;
            }
            case 'department_consumption': {
                const consumptionByDept = new Map<number, { name: string; totalItems: number; totalCost: number }>();
                departments.forEach(dept => consumptionByDept.set(dept.id, { name: dept.name, totalItems: 0, totalCost: 0 }));
                getFilteredOutwards.forEach(outward => {
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
                return getFilteredOutwards.filter(o => primaryFilter ? o.departmentId.toString() === primaryFilter : true).flatMap(o => {
                    const department = departments.find(d => d.id === o.departmentId)?.name || 'N/A';
                    return o.items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return { date: o.date.toLocaleDateString(), department, product: product?.name || 'N/A', quantity: item.quantity, costAtTime: formatNumber(item.costAtTime), totalCost: formatNumber(item.quantity * item.costAtTime) };
                    });
                });
            case 'purchases': 
                 return getFilteredPurchases.filter(p => primaryFilter ? p.vendorId.toString() === primaryFilter : true).flatMap(p => {
                    const vendor = vendors.find(v => v.id === p.vendorId)?.name || 'N/A';
                    return p.items.map(item => {
                        const product = products.find(prod => prod.id === item.productId);
                        const baseAmount = item.quantity * item.unitCost;
                        const gstAmount = baseAmount * (item.gstRate / 100);
                        const totalCost = baseAmount + gstAmount;
                        return { date: p.date.toLocaleDateString(), invoiceNumber: p.invoiceNumber, vendor, product: product?.name || 'N/A', quantity: `${item.quantity} ${product?.unit || ''}`, unitCost: formatNumber(item.unitCost), gstRate: `${item.gstRate}%`, gstAmount: formatNumber(gstAmount), totalCost: formatNumber(totalCost) };
                    });
                });
            case 'invoice_purchases_summary':
                return getFilteredPurchases.map((p, index) => ({ sr: index + 1, date: new Date(p.date).toLocaleDateString('en-IN', { timeZone: 'UTC' }), invoiceNumber: p.invoiceNumber, vendorName: vendors.find(v => v.id === p.vendorId)?.name || 'N/A', totalAmount: formatNumber(p.totalAmount) }));
            case 'item_purchase_history':
                return getFilteredPurchases.flatMap(p => {
                    const vendor = vendors.find(v => v.id === p.vendorId);
                    return p.items.map(item => {
                        const product = products.find(prod => prod.id === item.productId);
                        if (primaryFilter && product?.categoryId.toString() !== primaryFilter) return null;
                        if (!product) return null;
                        if (searchLower && !product.name.toLowerCase().includes(searchLower)) return null;
                        return { date: new Date(p.date).toLocaleDateString('en-IN', { timeZone: 'UTC' }), productName: product.name, category: categories.find(c => c.id === product.categoryId)?.name || 'N/A', vendor: vendor?.name || 'N/A', invoiceNumber: p.invoiceNumber, purchasedQty: `${formatQuantity(item.quantity)} ${product.unit}`, unitCost: formatNumber(item.unitCost), currentStock: `${formatQuantity(product.quantity)} ${product.unit}` };
                    }).filter(Boolean);
                });
            case 'activity_log':
                return activityLogs.map(log => ({ timestamp: new Date(log.timestamp).toLocaleString(), entity: log.entity, action: log.action, details: log.details }));
            case 'stock':
            default:
                return products.filter(p => {
                    const matchesCategory = primaryFilter ? p.categoryId.toString() === primaryFilter : true;
                    const matchesSearch = searchLower ? p.name.toLowerCase().includes(searchLower) : true;
                    return matchesCategory && matchesSearch;
                }).map(p => ({ productName: p.name, category: categories.find(c=>c.id === p.categoryId)?.name || 'N/A', quantity: `${p.quantity} ${p.unit}`, stockValue: formatNumber(p.quantity * p.purchasePrice) }));
        }
    }, [reportType, primaryFilter, secondaryFilter, itemSearchTerm, startDate, endDate, products, categories, departments, vendors, getFilteredOutwards, getFilteredPurchases, activityLogs, uniquePurchaseDates]);
    
    // Matrix Grand Total Calculation
    const matrixGrandTotals = useMemo(() => {
        if (reportType !== 'item_purchase_matrix' || generatedData.length === 0) return null;
        const totals: Record<string, number> = { totalPurchasedQty: 0 };
        uniquePurchaseDates.forEach(date => totals[date] = 0);

        generatedData.forEach(row => {
            uniquePurchaseDates.forEach(date => {
                totals[date] += Number(row[date] || 0);
            });
            totals.totalPurchasedQty += Number(row.totalPurchasedQty || 0);
        });
        return totals;
    }, [reportType, generatedData, uniquePurchaseDates]);

    // Logic for Department vs Category Consumption Summary Highlights and Grand Summary
    const consumptionSummaryData = useMemo(() => {
        if (reportType !== 'dept_cat_consumption' || generatedData.length === 0) return null;
        
        const deptTotals = new Map<string, number>();
        const catTotals = new Map<string, number>();
        let totalConsumption = 0;

        generatedData.forEach(row => {
            const val = row.totalConsumed;
            totalConsumption += val;
            catTotals.set(row.category, (catTotals.get(row.category) || 0) + val);
            deptTotals.set(row.department, (deptTotals.get(row.department) || 0) + (row.isFirstInDept ? row.deptTotal : 0));
        });

        const sortedDepts = Array.from(deptTotals.entries()).sort((a, b) => b[1] - a[1]);
        const sortedCats = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1]);

        return {
            highestDept: sortedDepts[0],
            lowestDept: sortedDepts[sortedDepts.length - 1],
            highestCat: sortedCats[0],
            lowestCat: sortedCats[sortedCats.length - 1],
            catGrandSummary: Array.from(catTotals.entries()).map(([name, val]) => ({ name, val })),
            totalConsumption
        };
    }, [reportType, generatedData]);

    const { items: sortedData, requestSort, sortConfig } = useSortableData(generatedData);
    
    const currentHeaders = useMemo(() => {
        if (reportType === 'item_purchase_matrix') {
            const base: Record<string, string> = { sr: 'SR no.', productName: 'Item Name' };
            uniquePurchaseDates.forEach((date) => {
                const d = new Date(date);
                const displayDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
                base[date] = displayDate;
            });
            base['totalPurchasedQty'] = 'Total Purchased Qty';
            return base;
        }
        return reportHeaders[reportType] || {};
    }, [reportType, uniquePurchaseDates]);

    const handleExportExcel = async () => {
        if (sortedData.length === 0) {
            alert("No data available to export.");
            return;
        }
        setIsExportingExcel(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');
            const columns = Object.entries(currentHeaders).map(([key, label]) => ({
                header: label,
                key: key,
                width: 20
            }));
            worksheet.columns = columns;
            sortedData.forEach(item => { worksheet.addRow(item); });
            
            if (reportType === 'item_purchase_matrix' && matrixGrandTotals) {
               worksheet.addRow({
                   productName: 'GRAND TOTAL',
                   ...matrixGrandTotals
               });
            }

            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 25;
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                if (column.header) maxLength = column.header.length;
                column.eachCell && column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) maxLength = columnLength;
                });
                column.width = Math.min(maxLength + 2, 50);
            });
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    row.eachCell((cell) => {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        cell.font = { name: 'Calibri', size: 11 };
                        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                    });
                }
            });
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            const datePart = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
            anchor.download = `${reportType}_report${datePart}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Excel Export Failed", error);
            alert("Failed to export Excel file. Please try again.");
        } finally {
            setIsExportingExcel(false);
        }
    };

    const handleExportPdf = () => {
        if (sortedData.length === 0) {
            alert("No data available to export.");
            return;
        }
        if (reportType === 'invoice_purchases_summary') {
            generatePurchaseInvoiceSummaryPDF({ purchases: getFilteredPurchases, companyDetails, vendors, dateRange: { start: startDate, end: endDate } });
        } else if (reportType === 'purchases') {
             generateDetailedPurchaseReportPDF({ purchases: getFilteredPurchases, companyDetails, products, vendors, dateRange: { start: startDate, end: endDate } });
        } else {
             alert("PDF export for this specific structured report is coming soon. Please use Excel export for now.");
        }
    };

    const getFilterOptions = () => {
        switch (reportType) {
            case 'stock_ledger':
            case 'stock':
            case 'item_purchase_history':
            case 'item_stock_flow':
                return <select value={primaryFilter} onChange={e => setPrimaryFilter(e.target.value)} className={commonSelectStyle}><option value="">All Categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>;
            case 'item_purchase_matrix':
                return (
                    <>
                        <select value={primaryFilter} onChange={e => { setPrimaryFilter(e.target.value); setSecondaryFilter(''); }} className={commonSelectStyle}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={secondaryFilter} onChange={e => setSecondaryFilter(e.target.value)} className={commonSelectStyle}>
                            <option value="">All Particular Items</option>
                            {products
                                .filter(p => !primaryFilter || p.categoryId.toString() === primaryFilter)
                                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                            }
                        </select>
                    </>
                );
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
            case 'purchases':
                 return <select value={primaryFilter} onChange={e => setPrimaryFilter(e.target.value)} className={commonSelectStyle}><option value="">All Vendors</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>;
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Reports</h2>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-wrap">
                    <select value={reportType} onChange={e => { setReportType(e.target.value); setPrimaryFilter(''); setSecondaryFilter(''); setItemSearchTerm(''); setStartDate(defaultStart); setEndDate(defaultEnd); }} className={commonSelectStyle}>
                        <option value="stock">Stock Level Report</option>
                        <option value="item_purchase_matrix">Item Purchase (Matrix View)</option>
                        <option value="dept_cat_consumption">Dept. vs Category Consumption</option>
                        <option value="item_stock_flow">Item Stock Flow & Valuation</option>
                        <option value="stock_ledger">Stock Ledger Report</option>
                        <option value="outwards">Stock Outward Report</option>
                        <option value="purchases">Purchase Report (Detailed Items)</option>
                        <option value="invoice_purchases_summary">Purchase Invoices Summary</option>
                        <option value="item_purchase_history">Item Purchase History (Provenance)</option> 
                        <option value="department_consumption">Department Consumption Summary</option>
                        <option value="detailed_department_consumption">Detailed Department Consumption</option>
                        <option value="activity_log">System Activity Log</option>
                    </select>
                    {getFilterOptions()}
                    <input type="text" placeholder="Search Item..." value={itemSearchTerm} onChange={e => setItemSearchTerm(e.target.value)} className={commonSelectStyle} />
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Period:</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonSelectStyle} />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={commonSelectStyle} />
                    </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={handleExportExcel} disabled={sortedData.length === 0 || isExportingExcel} className="w-full md:w-auto bg-secondary hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                        {isExportingExcel ? 'Exporting...' : 'Export to Excel'}
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                {sortedData.length > 0 ? (
                    <div className="space-y-12">
                        {reportType === 'dept_cat_consumption' && consumptionSummaryData && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                {/* Highlights Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Highest Consumption</h4>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-700">Dept: <span className="text-indigo-700">{consumptionSummaryData.highestDept?.[0]} (₹{formatNumber(consumptionSummaryData.highestDept?.[1])})</span></p>
                                            <p className="text-sm font-bold text-slate-700">Cat: <span className="text-indigo-700">{consumptionSummaryData.highestCat?.[0]} (₹{formatNumber(consumptionSummaryData.highestCat?.[1])})</span></p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                                        <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Lowest Consumption</h4>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-700">Dept: <span className="text-rose-700">{consumptionSummaryData.lowestDept?.[0]} (₹{formatNumber(consumptionSummaryData.lowestDept?.[1])})</span></p>
                                            <p className="text-sm font-bold text-slate-700">Cat: <span className="text-rose-700">{consumptionSummaryData.lowestCat?.[0]} (₹{formatNumber(consumptionSummaryData.lowestCat?.[1])})</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Detailed Table */}
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight uppercase">Department-wise Consumption Breakdown</h3>
                                    <table className="w-full text-sm border-collapse border border-slate-200">
                                        <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                            <tr>
                                                <th className="p-3 border border-slate-200 text-left">Department</th>
                                                <th className="p-3 border border-slate-200 text-left">Category</th>
                                                <th className="p-3 border border-slate-200 text-right">Total Consumed (Val)</th>
                                                <th className="p-3 border border-slate-200 text-right">Dept. Total Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sortedData.map((row, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    {row.isFirstInDept ? (
                                                        <td className="p-3 border border-slate-200 font-bold bg-white" rowSpan={row.rowCountInDept}>
                                                            {row.department}
                                                        </td>
                                                    ) : null}
                                                    <td className="p-3 border border-slate-200">{row.category}</td>
                                                    <td className="p-3 border border-slate-200 text-right font-mono">{formatNumber(row.totalConsumed)}</td>
                                                    {row.isFirstInDept ? (
                                                        <td className="p-3 border border-slate-200 font-black text-slate-900 text-right font-mono" rowSpan={row.rowCountInDept}>
                                                            ₹ {formatNumber(row.deptTotal)}
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Grand Summary Table */}
                                <div className="max-w-md ml-auto">
                                    <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight uppercase">Category-wise Grand Summary</h3>
                                    <table className="w-full text-sm border-collapse border border-slate-200">
                                        <thead className="bg-slate-800 text-[10px] font-black uppercase text-white tracking-widest">
                                            <tr>
                                                <th className="p-3 border border-slate-700 text-left">Category</th>
                                                <th className="p-3 border border-slate-700 text-right">Grand Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consumptionSummaryData.catGrandSummary.sort((a, b) => b.val - a.val).map((cat, idx) => (
                                                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                                    <td className="p-3 border border-slate-200 font-bold">{cat.name}</td>
                                                    <td className="p-3 border border-slate-200 text-right font-mono font-black text-slate-700">₹ {formatNumber(cat.val)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-100">
                                            <tr>
                                                <td className="p-4 border border-slate-200 font-black uppercase tracking-widest">Total Consumption</td>
                                                <td className="p-4 border border-slate-200 text-right font-black text-lg text-primary font-mono">₹ {formatNumber(consumptionSummaryData.totalConsumption)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        {reportType !== 'dept_cat_consumption' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-primary rounded-full"></span>
                                    {reportType === 'item_purchase_matrix' ? 'Purchase Quantity Matrix' : 'Generated Report Data'}
                                </h3>
                                <table className="w-full text-sm text-left text-gray-500 border-collapse">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                        <tr>
                                            {Object.entries(currentHeaders).map(([key, label]) => {
                                                const isDateCol = uniquePurchaseDates.includes(key);
                                                return <SortableHeader key={key} label={label} sortKey={key} requestSort={requestSort} sortConfig={sortConfig} className={`whitespace-nowrap py-3 px-6 ${isDateCol ? 'text-blue-600 bg-blue-50/50' : ''}`}/>
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {sortedData.map((row, index) => (
                                            <tr key={index} className="bg-white hover:bg-gray-50 transition-colors">
                                                {Object.keys(currentHeaders).map(key => {
                                                    const isDateCol = uniquePurchaseDates.includes(key);
                                                    const isTotalCol = key === 'totalPurchasedQty';
                                                    return (
                                                        <td key={key} className={`px-6 py-4 whitespace-nowrap ${isDateCol || isTotalCol ? 'text-right' : ''} ${isTotalCol ? 'font-black bg-slate-50 text-slate-900 border-l' : ''}`}>
                                                            {isDateCol ? formatQuantity(row[key]) : (row as any)[key]}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                    {reportType === 'item_purchase_matrix' && matrixGrandTotals && (
                                        <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                            <tr className="font-black text-slate-900">
                                                <td colSpan={2} className="px-6 py-4 text-right uppercase tracking-widest text-[10px]">Grand Total Purchases</td>
                                                {uniquePurchaseDates.map(date => (
                                                    <td key={date} className="px-6 py-4 text-right bg-blue-50/50">
                                                        {formatQuantity(matrixGrandTotals[date])}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 text-right bg-slate-900 text-white">
                                                    {formatQuantity(matrixGrandTotals.totalPurchasedQty)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-center py-8 text-text-secondary">No data available for the selected filters.</p>
                )}
            </div>
        </div>
    );
};

export default Reports;
