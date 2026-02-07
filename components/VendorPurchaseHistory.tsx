import React, { useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { ArrowLeftIcon, EyeIcon } from './shared/Icons';
import { formatNumber, formatQuantity } from '../utils/formatters';
import { generatePurchasePreviewHTML } from '../utils/previewHelpers';

interface VendorPurchaseHistoryProps {
    vendorId: number | null;
    onClose: () => void;
}

const VendorPurchaseHistory: React.FC<VendorPurchaseHistoryProps> = ({ vendorId, onClose }) => {
    const { purchases, vendors, products, companyDetails } = useInventory();

    const vendor = useMemo(() => vendors.find(v => v.id === vendorId), [vendors, vendorId]);

    const historyData = useMemo(() => {
        if (!vendorId) return [];
        return purchases
            .filter(p => p.vendorId === vendorId)
            .flatMap(p => 
                p.items.map(item => {
                    const product = products.find(prod => prod.id === item.productId);
                    const baseAmount = item.quantity * item.unitCost;
                    const gstAmount = baseAmount * (item.gstRate / 100);
                    const total = baseAmount + gstAmount;
                    return {
                        id: `${p.id}-${item.productId}`,
                        invoiceId: p.id,
                        date: p.date,
                        invoiceNumber: p.invoiceNumber,
                        productName: product?.name || 'N/A',
                        quantity: item.quantity,
                        unit: product?.unit || '',
                        rate: item.unitCost,
                        gstRate: item.gstRate,
                        gstAmount,
                        total
                    };
                })
            )
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [purchases, products, vendorId]);

    const handleViewBill = (invoiceId: string) => {
        const invoice = purchases.find(p => p.id === invoiceId);
        if (!invoice) {
            alert("Invoice not found.");
            return;
        }

        const vendor = vendors.find(v => v.id === invoice.vendorId);
        if (!vendor) {
            alert("Vendor not found for this invoice.");
            return;
        }

        const detailedItems = invoice.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                product: product!,
                quantity: item.quantity,
                unitCost: item.unitCost,
            };
        }).filter(item => item.product);

        const subTotal = detailedItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
        const totalGst = detailedItems.reduce((acc, item) => {
            const baseAmount = item.quantity * item.unitCost;
            return acc + (baseAmount * (item.product.gstRate / 100));
        }, 0);
        const grandTotal = subTotal + totalGst;
        
        const previewData = {
            companyDetails,
            vendor,
            invoiceNumber: invoice.invoiceNumber,
            date: invoice.date.toISOString(),
            items: detailedItems,
            subTotal,
            totalGst,
            grandTotal
        };

        const htmlContent = generatePurchasePreviewHTML(previewData);
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
        }
    };

    if (!vendor) {
        return (
            <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col p-4 items-center justify-center">
                <p className="text-xl text-gray-700">Vendor not found.</p>
                <button onClick={onClose} className="mt-4 flex items-center text-sm font-semibold text-gray-600 hover:text-primary">
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    Back to Accounts
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col p-4 font-sans">
            <header className="flex-shrink-0 bg-white p-3 rounded-md shadow-sm flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-gray-700">Purchase History: {vendor.name}</h1>
                <button onClick={onClose} className="flex items-center text-sm font-semibold text-gray-600 hover:text-primary">
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    Back to Accounts
                </button>
            </header>

            <main className="flex-grow bg-white rounded-md shadow-sm p-4 overflow-y-auto">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Invoice No</th>
                                <th scope="col" className="px-6 py-3">Product Name</th>
                                <th scope="col" className="px-6 py-3 text-right">Quantity</th>
                                <th scope="col" className="px-6 py-3 text-right">Rate</th>
                                <th scope="col" className="px-6 py-3 text-center">GST %</th>
                                <th scope="col" className="px-6 py-3 text-right">GST Amount</th>
                                <th scope="col" className="px-6 py-3 text-right">Total</th>
                                <th scope="col" className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.length > 0 ? historyData.map(item => (
                                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{item.invoiceNumber}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.productName}</td>
                                    <td className="px-6 py-4 text-right">{formatQuantity(item.quantity)} {item.unit}</td>
                                    <td className="px-6 py-4 text-right">{formatNumber(item.rate)}</td>
                                    <td className="px-6 py-4 text-center">{item.gstRate}%</td>
                                    <td className="px-6 py-4 text-right">{formatNumber(item.gstAmount)}</td>
                                    <td className="px-6 py-4 text-right font-bold">{formatNumber(item.total)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleViewBill(item.invoiceId)} className="text-gray-500 hover:text-blue-600 p-1" title="View Bill">
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-10 text-gray-500">No purchase history found for this vendor.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default VendorPurchaseHistory;