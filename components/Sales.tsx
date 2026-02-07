import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { formatNumber, getLocalDateString } from '../utils/formatters';
import { CalendarIcon, TrashIcon, DollarSignIcon, UsersIcon, FileTextIcon } from './shared/Icons';
import { BanquetEventType } from '../types';
import type { BanquetSale } from '../types';
import { generateBanquetSalesReportPDF } from '../utils/previewHelpers';
import ConfirmModal from './shared/ConfirmModal';

const DailySalesSummary: React.FC = () => {
    // Helper function to get the first and last day of the current month
    const getCurrentMonthDateRange = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
            start: getLocalDateString(firstDay),
            end: getLocalDateString(lastDay),
        };
    };

    const { start: defaultStartDate, end: defaultEndDate } = getCurrentMonthDateRange();

    const { dailySales, addDailySale, deleteDailySale } = useInventory();
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [saleDate, setSaleDate] = useState(getLocalDateString());
    const [saleAmount, setSaleAmount] = useState<number | string>('');
  
    const filteredDailySales = useMemo(() => {
      return dailySales.filter(sale => {
        if (startDate && sale.date < startDate) return false;
        if (endDate && sale.date > endDate) return false;
        return true;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dailySales, startDate, endDate]);
  
    const totalSales = useMemo(() => {
      return filteredDailySales.reduce((sum, sale) => sum + sale.amount, 0);
    }, [filteredDailySales]);
  
    const handleAddOrUpdateSale = (e: React.FormEvent) => {
      e.preventDefault();
      if (!saleDate || Number(saleAmount) <= 0) {
          alert('Please enter a valid date and a positive amount.');
          return;
      }
      addDailySale({ date: saleDate, amount: Number(saleAmount) });
      setSaleAmount('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-card p-4 rounded-lg shadow-md space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <label htmlFor="start-date-daily" className="flex items-center text-sm font-medium text-gray-700 whitespace-nowrap">
                            <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" /> Start Date:
                        </label>
                        <input type="date" id="start-date-daily" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        <label htmlFor="end-date-daily" className="flex items-center text-sm font-medium text-gray-700 whitespace-nowrap">
                            <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" /> End Date:
                        </label>
                        <input type="date" id="end-date-daily" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                </div>
                
                <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-lg flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-primary uppercase tracking-wider">Total Daily Sales</h3>
                        <p className="text-4xl font-extrabold text-text-primary mt-1">{formatNumber(totalSales)}</p>
                        <p className="text-xs text-text-secondary mt-2">
                            {startDate || endDate ? "For the selected period" : "For all recorded dates"}
                        </p>
                    </div>
                    <DollarSignIcon className="w-16 h-16 text-primary/50" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4 text-text-primary">Daily Sales History</h3>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredDailySales.length > 0 ? (
                            filteredDailySales.map(sale => (
                                <div key={sale.date} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                                    <div>
                                        <span className="font-medium text-text-primary">{new Date(sale.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-bold text-lg text-gray-800 mr-4">{formatNumber(sale.amount)}</span>
                                        <button onClick={() => deleteDailySale(sale.date)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100" aria-label={`Delete sale for ${sale.date}`}>
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-text-secondary text-center py-10">No sales data found for the selected period.</p>
                        )}
                    </div>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4 text-text-primary">Add/Update Daily Sale</h3>
                    <form onSubmit={handleAddOrUpdateSale} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="sale-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input id="sale-date" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} required className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label htmlFor="sale-amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input id="sale-amount" type="number" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} placeholder="Enter total sale amount" min="0" step="any" required className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                        </div>
                        <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors mt-2">Save Sale</button>
                    </form>
                    <p className="text-xs text-text-secondary mt-4 text-center">Note: Adding a sale for a date that already exists will update the amount.</p>
                </div>
            </div>
        </div>
    );
};

const BanquetSales: React.FC = () => {
    const { banquetSales, addBanquetSale, deleteBanquetSale, companyDetails } = useInventory();
    const [formState, setFormState] = useState({
        date: getLocalDateString(),
        customerName: '',
        pax: '',
        packageDetails: '',
        eventType: BanquetEventType.OTHER,
        rate: '',
    });
    const [total, setTotal] = useState(0);
    const [saleToDelete, setSaleToDelete] = useState<BanquetSale | null>(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState('');
    const [customerNameFilter, setCustomerNameFilter] = useState('');
    
    const commonInputStyle = "w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm";
    
    React.useEffect(() => {
        const pax = parseFloat(formState.pax);
        const rate = parseFloat(formState.rate);
        if (!isNaN(pax) && !isNaN(rate)) {
            setTotal(pax * rate);
        } else {
            setTotal(0);
        }
    }, [formState.pax, formState.rate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pax = parseInt(formState.pax, 10);
        const rate = parseFloat(formState.rate);
        if (isNaN(pax) || isNaN(rate) || pax <= 0 || rate < 0 || !formState.date || !formState.customerName) {
            alert('Please fill all required fields with valid numbers.');
            return;
        }
        addBanquetSale({ ...formState, pax, rate });
        // Reset form
        setFormState({
            date: getLocalDateString(),
            customerName: '',
            pax: '',
            packageDetails: '',
            eventType: BanquetEventType.OTHER,
            rate: '',
        });
    };
    
    const filteredBanquetSales = useMemo(() => {
        return banquetSales.filter(sale => {
            if (startDate && sale.date < startDate) return false;
            if (endDate && sale.date > endDate) return false;
            if (eventTypeFilter && sale.eventType !== eventTypeFilter) return false;
            if (customerNameFilter && !sale.customerName.toLowerCase().includes(customerNameFilter.toLowerCase())) return false;
            return true;
        })
    }, [banquetSales, startDate, endDate, eventTypeFilter, customerNameFilter]);

    const handleExport = () => {
        if (filteredBanquetSales.length === 0) {
            alert("No data to export for the selected filters.");
            return;
        }
        generateBanquetSalesReportPDF({ banquetSales: filteredBanquetSales, companyDetails, dateRange: { start: startDate, end: endDate } });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 bg-card p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4 text-text-primary">Record Banquet Sale</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input name="date" type="date" value={formState.date} onChange={handleInputChange} required className={commonInputStyle} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                                <select name="eventType" value={formState.eventType} onChange={handleInputChange} className={commonInputStyle}>
                                    {Object.values(BanquetEventType).map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                            <input name="customerName" type="text" value={formState.customerName} onChange={handleInputChange} required placeholder="e.g., John Doe" className={commonInputStyle} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Package Details</label>
                            <textarea name="packageDetails" value={formState.packageDetails} onChange={handleInputChange} rows={2} placeholder="e.g., Gold Package, Lunch Buffet" className={commonInputStyle}></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No. of Guests (Pax)</label>
                                <input name="pax" type="number" value={formState.pax} onChange={handleInputChange} required min="1" placeholder="e.g., 50" className={commonInputStyle} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                                <input name="rate" type="number" value={formState.rate} onChange={handleInputChange} required min="0" placeholder="e.g., 1200" className={commonInputStyle} />
                            </div>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-lg text-center">
                            <label className="block text-sm font-medium text-primary uppercase tracking-wider">Total Amount</label>
                            <p className="text-3xl font-bold text-text-primary">{formatNumber(total)}</p>
                        </div>
                        <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors">Save Banquet Sale</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h3 className="font-semibold text-lg text-text-primary">Banquet Sales History</h3>
                        <button onClick={handleExport} className="flex items-center bg-secondary hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors w-full md:w-auto">
                            <FileTextIcon className="w-4 h-4 mr-2" /> Export to PDF
                        </button>
                    </div>
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b">
                         <input type="text" placeholder="Search by customer..." value={customerNameFilter} onChange={e => setCustomerNameFilter(e.target.value)} className={commonInputStyle} />
                        <select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} className={commonInputStyle}>
                            <option value="">All Event Types</option>
                             {Object.values(BanquetEventType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonInputStyle} />
                             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={commonInputStyle} />
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Customer</th>
                                    <th className="px-4 py-2">Event</th>
                                    <th className="px-4 py-2 text-center">Pax</th>
                                    <th className="px-4 py-2 text-right">Rate</th>
                                    <th className="px-4 py-2 text-right">Total</th>
                                    <th className="px-4 py-2 text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBanquetSales.length > 0 ? (
                                    filteredBanquetSales.map(sale => (
                                         <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-2">{new Date(sale.date).toLocaleDateString('en-CA', { timeZone: 'UTC' })}</td>
                                            <td className="px-4 py-2 font-medium text-gray-900">{sale.customerName}</td>
                                            <td className="px-4 py-2">{sale.eventType}</td>
                                            <td className="px-4 py-2 text-center">{sale.pax}</td>
                                            <td className="px-4 py-2 text-right">{formatNumber(sale.rate)}</td>
                                            <td className="px-4 py-2 text-right font-bold">{formatNumber(sale.totalAmount)}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => setSaleToDelete(sale)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100" aria-label={`Delete sale for ${sale.customerName}`}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={7} className="text-center py-10 text-text-secondary">No banquet sales found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {saleToDelete && (
                <ConfirmModal 
                    isOpen={!!saleToDelete}
                    onClose={() => setSaleToDelete(null)}
                    onConfirm={() => {
                        deleteBanquetSale(saleToDelete.id);
                        setSaleToDelete(null);
                    }}
                    title="Delete Banquet Sale"
                    message={`Are you sure you want to delete the sale for "${saleToDelete.customerName}" on ${new Date(saleToDelete.date).toLocaleDateString()}? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

const Sales: React.FC = () => {
    const [activeTab, setActiveTab] = useState('daily');

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'daily':
                return <DailySalesSummary />;
            case 'banquet':
                return <BanquetSales />;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-text-primary">Sales Management</h2>
            </div>
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                            ${activeTab === 'daily' 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}`
                        }
                    >
                       <DollarSignIcon className="mr-2 w-5 h-5" />
                       <span>Daily Sales Summary</span>
                    </button>
                     <button
                        onClick={() => setActiveTab('banquet')}
                        className={`group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                            ${activeTab === 'banquet' 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}`
                        }
                    >
                        <UsersIcon className="mr-2 w-5 h-5" />
                       <span>Banquet Sales</span>
                    </button>
                </nav>
            </div>

            {renderActiveTab()}
        </div>
    );
};

export default Sales;