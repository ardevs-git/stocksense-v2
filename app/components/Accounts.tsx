
import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { Vendor, PurchaseInvoice } from '../types';
import { PaymentMode } from '../types';
import Modal from './shared/Modal';

type VendorStats = {
    totalPurchase: number;
    totalPaid: number;
    balance: number;
}
const commonInputStyle = "bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary block w-full p-2.5";
const formatNumber = (num: number) => num.toFixed(2);

const RecordPaymentForm: React.FC<{ invoice: PurchaseInvoice; onClose: () => void; }> = ({ invoice, onClose }) => {
    const { recordPayment } = useInventory();
    const [amount, setAmount] = useState(invoice.totalAmount - invoice.paidAmount);
    const [mode, setMode] = useState<PaymentMode>(PaymentMode.BANK_TRANSFER);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || amount > (invoice.totalAmount - invoice.paidAmount)) {
            alert('Invalid payment amount.');
            return;
        }
        recordPayment({
            purchaseInvoiceId: invoice.id,
            amount,
            mode,
        });
        alert('Payment recorded successfully!');
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Invoice #</label>
                <p className="mt-1 text-lg font-semibold">{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-500">Balance Due: {formatNumber(invoice.totalAmount - invoice.paidAmount)}</p>
            </div>
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Payment Amount</label>
                <input type="number" id="amount" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} max={invoice.totalAmount - invoice.paidAmount} min="0.01" step="0.01" required className={`mt-1 ${commonInputStyle}`} />
            </div>
            <div>
                <label htmlFor="mode" className="block text-sm font-medium text-gray-700">Payment Mode</label>
                <select id="mode" value={mode} onChange={e => setMode(e.target.value as PaymentMode)} required className={`mt-1 ${commonInputStyle}`}>
                    {Object.values(PaymentMode).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
             <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Record Payment</button>
            </div>
        </form>
    );
};

const Accounts: React.FC = () => {
    const { vendors, purchases } = useInventory();
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [invoiceToPay, setInvoiceToPay] = useState<PurchaseInvoice | null>(null);

    const vendorStats = useMemo(() => {
        const stats = new Map<number, VendorStats>();
        vendors.forEach(v => stats.set(v.id, { totalPurchase: 0, totalPaid: 0, balance: 0 }));
        purchases.forEach(p => {
            const stat = stats.get(p.vendorId);
            if (stat) {
                stat.totalPurchase += p.totalAmount;
                stat.totalPaid += p.paidAmount;
                stat.balance = stat.totalPurchase - stat.totalPaid;
            }
        });
        return stats;
    }, [vendors, purchases]);

    const selectedVendorInvoices = useMemo(() => {
        if (!selectedVendor) return [];
        return purchases.filter(p => p.vendorId === selectedVendor.id).sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [selectedVendor, purchases]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-text-primary">Vendor Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-card p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Vendors</h3>
                    <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {vendors.map(vendor => (
                            <li key={vendor.id}>
                                <button onClick={() => setSelectedVendor(vendor)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedVendor?.id === vendor.id ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
                                    <p className="font-semibold">{vendor.name}</p>
                                    <p className={`text-sm ${selectedVendor?.id === vendor.id ? 'text-blue-200' : 'text-text-secondary'}`}>
                                        Balance: {formatNumber(vendorStats.get(vendor.id)?.balance ?? 0)}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="md:col-span-2 bg-card p-6 rounded-lg shadow-md">
                    {selectedVendor ? (
                        <div>
                            <h3 className="text-2xl font-bold text-text-primary mb-1">{selectedVendor.name}</h3>
                            <div className="flex space-x-6 text-sm text-text-secondary mb-6 border-b pb-4">
                                <span>Total Business: <span className="font-bold text-text-primary">{formatNumber(vendorStats.get(selectedVendor.id)?.totalPurchase ?? 0)}</span></span>
                                <span>Amount Paid: <span className="font-bold text-green-600">{formatNumber(vendorStats.get(selectedVendor.id)?.totalPaid ?? 0)}</span></span>
                                <span>Balance Due: <span className="font-bold text-red-600">{formatNumber(vendorStats.get(selectedVendor.id)?.balance ?? 0)}</span></span>
                            </div>
                            <h4 className="text-lg font-semibold mb-4">Invoices</h4>
                            <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Date</th>
                                            <th scope="col" className="px-6 py-3">Invoice #</th>
                                            <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                            <th scope="col" className="px-6 py-3 text-center">Status</th>
                                            <th scope="col" className="px-6 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedVendorInvoices.map(invoice => (
                                            <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">{new Date(invoice.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-medium">{invoice.invoiceNumber}</td>
                                                <td className="px-6 py-4 text-right">{formatNumber(invoice.totalAmount)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : invoice.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {invoice.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {invoice.paymentStatus !== 'Paid' && (
                                                        <button onClick={() => setInvoiceToPay(invoice)} className="font-medium text-primary hover:underline">Pay</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-text-secondary">Select a vendor to see details</p>
                        </div>
                    )}
                </div>
            </div>

            {invoiceToPay && (
                <Modal title="Record Payment" isOpen={!!invoiceToPay} onClose={() => setInvoiceToPay(null)}>
                    <RecordPaymentForm invoice={invoiceToPay} onClose={() => setInvoiceToPay(null)} />
                </Modal>
            )}
        </div>
    );
};

export default Accounts;