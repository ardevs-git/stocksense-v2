
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Product, Vendor, Department, CompanyDetails, BanquetSale, PurchaseInvoice } from '../types';
import { formatNumber, formatQuantity } from './formatters';

export const generatePurchasePreviewHTML = (data: {
    companyDetails: CompanyDetails;
    vendor: Vendor;
    invoiceNumber: string;
    date: string;
    items: { product: Product; quantity: number; unitCost: number }[];
    subTotal: number;
    totalGst: number;
    grandTotal: number;
}) => {
    const { companyDetails, vendor, invoiceNumber, date, items, subTotal, totalGst, grandTotal } = data;
    const itemsHtml = items.map((item, index) => `
        <tr class="border-b border-gray-200">
            <td class="py-3 px-1 text-center text-gray-600">${index + 1}</td>
            <td class="py-3 px-4">
                <p class="font-semibold text-gray-800">${item.product.name}</p>
            </td>
            <td class="py-3 px-4 text-center">${formatQuantity(item.quantity)} ${item.product.unit}</td>
            <td class="py-3 px-4 text-right">${formatNumber(item.unitCost)}</td>
            <td class="py-3 px-4 text-center">${item.product.gstRate}%</td>
            <td class="py-3 px-4 text-right font-medium text-gray-800">${formatNumber(item.quantity * item.unitCost)}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Receipt - ${invoiceNumber}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            @page { size: A4; margin: 0; }
            @media print {
                html, body {
                    width: 210mm;
                    height: 297mm;
                    background: #fff !important;
                }
                .no-print, .no-print * { display: none !important; }
                .printable-area {
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 1.5rem !important; /* 24px */
                    box-shadow: none !important;
                    border: none !important;
                    border-radius: 0 !important;
                }
            }
        </style>
    </head>
    <body class="bg-gray-100 p-4 sm:p-8">
        <div class="max-w-4xl mx-auto">
            <div class="no-print bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
                <p class="text-sm text-gray-600">This is a preview. The toolbar will not be printed.</p>
                <button onclick="window.print()" class="bg-blue-600 text-white py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print / Save as PDF
                </button>
            </div>
            <div class="printable-area bg-white p-8 sm:p-12 rounded-lg shadow-lg border border-gray-200">
                <header class="flex justify-between items-start pb-6 border-b border-gray-200">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">${companyDetails.name}</h1>
                        <p class="text-sm text-gray-500 mt-1 max-w-xs">${companyDetails.address}</p>
                        <p class="text-sm text-gray-500 mt-1">GSTIN: ${companyDetails.gstin}</p>
                    </div>
                    <div class="text-right">
                        <h2 class="text-2xl font-semibold text-gray-700 uppercase tracking-wider">Purchase Receipt</h2>
                        <p class="text-sm text-gray-500 mt-2"><span class="font-semibold text-gray-600">Invoice #:</span> ${invoiceNumber}</p>
                        <p class="text-sm text-gray-500"><span class="font-semibold text-gray-600">Date:</span> ${new Date(date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</p>
                    </div>
                </header>
                
                <section class="mt-8 mb-10">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-sm font-semibold text-gray-600 uppercase">Vendor</h3>
                        <p class="text-lg font-semibold text-gray-800 mt-1">${vendor.name}</p>
                        ${vendor.address ? `<p class="text-sm text-gray-500">${vendor.address}</p>` : ''}
                        <p class="text-sm text-gray-500">${vendor.email}${vendor.phone ? ` | ${vendor.phone}` : ''}</p>
                        ${vendor.gstin ? `<p class="text-sm text-gray-500">GSTIN: ${vendor.gstin}</p>` : ''}
                    </div>
                </section>

                <table class="w-full text-sm">
                    <thead class="border-b border-gray-300">
                        <tr class="text-left text-gray-500 uppercase text-xs tracking-wider">
                            <th class="py-3 px-1 text-center font-semibold">#</th>
                            <th class="py-3 px-4 font-semibold">Item Description</th>
                            <th class="py-3 px-4 text-center font-semibold">Qty</th>
                            <th class="py-3 px-4 text-right font-semibold">Rate</th>
                            <th class="py-3 px-4 text-center font-semibold">GST</th>
                            <th class="py-3 px-4 text-right font-semibold">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div class="flex justify-end mt-8">
                    <div class="w-full max-w-xs space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotal</span>
                            <span class="font-medium text-gray-800">${formatNumber(subTotal)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Total GST</span>
                            <span class="font-medium text-gray-800">${formatNumber(totalGst)}</span>
                        </div>
                        <div class="border-t border-gray-200 my-2"></div>
                        <div class="flex justify-between font-bold text-base">
                            <span class="text-gray-900">Grand Total</span>
                            <span class="text-gray-900">${formatNumber(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                <footer class="mt-12 text-center text-xs text-gray-400 border-t border-gray-200 pt-6">
                    <p>This is a system-generated document and does not require a signature.</p>
                </footer>
            </div>
        </div>
    </body>
    </html>
    `;
};


export const generateOutwardPreviewHTML = (data: {
    companyDetails: CompanyDetails;
    department: Department;
    date: string;
    items: { product: Product; quantity: number; }[];
    requisitionNumber?: string;
}) => {
    const { companyDetails, department, date, items, requisitionNumber } = data;
    const itemsHtml = items.map((item, index) => `
        <tr class="border-b border-gray-200">
            <td class="py-3 px-1 text-center text-gray-600">${index + 1}</td>
            <td class="py-3 px-4">
                <p class="font-semibold text-gray-800">${item.product.name}</p>
            </td>
            <td class="py-3 px-4 text-center">${formatQuantity(item.quantity)} ${item.product.unit}</td>
            <td class="py-3 px-4 text-right">${formatNumber(item.product.purchasePrice)}</td>
            <td class="py-3 px-4 text-right font-medium text-gray-800">${formatNumber(item.quantity * item.product.purchasePrice)}</td>
        </tr>
    `).join('');

    const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.product.purchasePrice), 0);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Stock Outward Slip</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            @page { size: A4; margin: 0; }
            @media print {
                html, body {
                    width: 210mm;
                    height: 297mm;
                    background: #fff !important;
                }
                .no-print, .no-print * { display: none !important; }
                .printable-area {
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 1.5rem !important; /* 24px */
                    box-shadow: none !important;
                    border: none !important;
                    border-radius: 0 !important;
                }
            }
        </style>
    </head>
    <body class="bg-gray-100 p-4 sm:p-8">
        <div class="max-w-4xl mx-auto">
             <div class="no-print bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
                <p class="text-sm text-gray-600">This is a preview. The toolbar will not be printed.</p>
                <button onclick="window.print()" class="bg-blue-600 text-white py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print / Save as PDF
                </button>
            </div>
            <div class="printable-area bg-white p-8 sm:p-12 rounded-lg shadow-lg border border-gray-200">
                <header class="flex justify-between items-start pb-6 border-b border-gray-200">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">${companyDetails.name}</h1>
                        <p class="text-sm text-gray-500 mt-1 max-w-xs">${companyDetails.address}</p>
                    </div>
                    <div class="text-right">
                        <h2 class="text-2xl font-semibold text-gray-700 uppercase tracking-wider">Stock Outward Slip</h2>
                        <p class="text-sm text-gray-500 mt-2"><span class="font-semibold text-gray-600">Date:</span> ${new Date(date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</p>
                        ${requisitionNumber ? `<p class="text-sm text-gray-500 mt-1"><span class="font-semibold text-gray-600">Req. No:</span> ${requisitionNumber}</p>` : ''}
                    </div>
                </header>

                <section class="mt-8 mb-10">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-sm font-semibold text-gray-600 uppercase">Issued to Department</h3>
                        <p class="text-lg font-semibold text-gray-800 mt-1">${department.name}</p>
                    </div>
                </section>

                <table class="w-full text-sm">
                    <thead class="border-b border-gray-300">
                        <tr class="text-left text-gray-500 uppercase text-xs tracking-wider">
                            <th class="py-3 px-1 text-center font-semibold">#</th>
                            <th class="py-3 px-4 font-semibold">Item Description</th>
                            <th class="py-3 px-4 text-center font-semibold">Qty</th>
                            <th class="py-3 px-4 text-right font-semibold">Rate</th>
                            <th class="py-3 px-4 text-right font-semibold">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div class="flex justify-end mt-8">
                    <div class="w-full max-w-xs space-y-2 text-sm">
                        <div class="border-t border-gray-200 my-2"></div>
                        <div class="flex justify-between font-bold text-base">
                            <span class="text-gray-900">Total Value</span>
                            <span class="text-gray-900">${formatNumber(totalValue)}</span>
                        </div>
                    </div>
                </div>

                <footer class="mt-20 grid grid-cols-2 gap-12 text-sm text-gray-600 border-t border-gray-200 pt-6">
                    <div class="text-center">
                        <div class="w-4/5 h-12 border-b border-gray-400 mx-auto"></div>
                        <p class="mt-2">Issued By (Name & Signature)</p>
                    </div>
                    <div class="text-center">
                        <div class="w-4/5 h-12 border-b border-gray-400 mx-auto"></div>
                        <p class="mt-2">Received By (Name & Signature)</p>
                    </div>
                </footer>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const generateBanquetSalesReportPDF = (data: { banquetSales: BanquetSale[], companyDetails: CompanyDetails, dateRange: { start: string, end: string } }) => {
    const { banquetSales, companyDetails, dateRange } = data;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    let lastY = 0;

    // Header
    doc.setFontSize(20);
    doc.setTextColor('#111827');
    doc.setFont('helvetica', 'bold');
    doc.text(companyDetails.name, 14, 22);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Banquet Sales Report', 14, 30);

    if (dateRange.start || dateRange.end) {
        doc.setFontSize(10);
        doc.setTextColor('#6B7280');
        doc.text(`Period: ${dateRange.start ? new Date(dateRange.start).toLocaleDateString('en-IN') : '...'} to ${dateRange.end ? new Date(dateRange.end).toLocaleDateString('en-IN') : '...'}`, 14, 36);
    }

    const head = [['Date', 'Customer Name', 'Event Type', 'Pax', 'Rate', 'Total Amount']];
    // FIX: Explicitly type `body` as `any[]` to allow both strings and cell definition objects for the table footer.
    const body: any[] = banquetSales.map(sale => [
        new Date(sale.date).toLocaleDateString('en-IN', { timeZone: 'UTC' }),
        sale.customerName,
        sale.eventType,
        sale.pax.toString(),
        formatNumber(sale.rate),
        formatNumber(sale.totalAmount)
    ]);
    const totalAmount = banquetSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    body.push([
        { content: 'Total', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatNumber(totalAmount), styles: { halign: 'right', fontStyle: 'bold' } }
    ]);

    autoTable(doc, {
        startY: lastY + 5,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: '#3B82F6' },
        footStyles: { fillColor: '#F3F4F6', textColor: '#111827', fontStyle: 'bold' },
        didDrawPage: (data) => {
            if (lastY === 0) { // Only for the first page
              lastY = data.cursor?.y || 45;
            }
        },
        willDrawCell: (data) => {
            if (data.section === 'foot') {
                // ...
            }
        }
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(companyDetails.name, 14, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 14, pageHeight - 10, { align: 'right' });
    }

    doc.output('pdfobjectnewwindow');
};

export const generateDetailedPurchaseReportPDF = (data: {
    purchases: PurchaseInvoice[];
    companyDetails: CompanyDetails;
    products: Product[];
    vendors: Vendor[];
    dateRange: { start: string; end: string };
}) => {
    const { purchases, companyDetails, products, vendors, dateRange } = data;
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

    let totalGrandTotal = 0;

    const tableData: any[] = [];

    purchases.forEach(p => {
        const vendor = vendors.find(v => v.id === p.vendorId);
        const vendorName = vendor?.name || 'N/A';
        const purchaseDate = new Date(p.date).toLocaleDateString('en-IN', { timeZone: 'UTC' });

        p.items.forEach(item => {
            const product = products.find(prod => prod.id === item.productId);
            const baseAmount = item.unitCost * item.quantity;
            const gstAmount = baseAmount * (item.gstRate / 100);
            const itemTotal = baseAmount + gstAmount;
            totalGrandTotal += itemTotal;

            tableData.push([
                purchaseDate,
                p.invoiceNumber,
                vendorName,
                product?.name || 'N/A',
                product?.unit || 'N/A',
                formatQuantity(item.quantity),
                formatNumber(item.unitCost),
                `${item.gstRate}%`,
                formatNumber(gstAmount),
                formatNumber(itemTotal),
            ]);
        });
    });

    const head = [['Date', 'Invoice #', 'Vendor', 'Product', 'Unit', 'Qty', 'Rate', 'GST %', 'GST Amt', 'Total']];

    const foot = [
        [
            { content: 'Grand Total', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
            { content: formatNumber(totalGrandTotal), styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } }
        ]
    ];

    autoTable(doc, {
        head: head,
        body: tableData,
        foot: foot,
        startY: 50, // Start below the main header
        theme: 'grid',
        headStyles: {
            fillColor: '#3B82F6',
            textColor: '#FFFFFF',
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            valign: 'middle',
            cellPadding: 2
        },
        bodyStyles: {
            fontSize: 7,
            halign: 'center',
            valign: 'middle',
            cellPadding: 1
        },
        footStyles: {
            fillColor: '#F3F4F6',
            textColor: '#111827',
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            valign: 'middle',
            cellPadding: 2
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 18 }, // Date
            1: { halign: 'left', cellWidth: 25 }, // Invoice #
            2: { halign: 'left', cellWidth: 35 }, // Vendor
            3: { halign: 'left', cellWidth: 40 }, // Product
            4: { halign: 'center', cellWidth: 15 }, // Unit
            5: { halign: 'right', cellWidth: 15 }, // Qty
            6: { halign: 'right', cellWidth: 20 }, // Rate
            7: { halign: 'center', cellWidth: 15 }, // GST %
            8: { halign: 'right', cellWidth: 20 }, // GST Amt
            9: { halign: 'right', cellWidth: 25 }, // Total
        },
        didDrawPage: (data) => {
            // Company Header
            doc.setFontSize(14);
            doc.setTextColor('#111827');
            doc.setFont('helvetica', 'bold');
            doc.text(companyDetails.name, data.settings.margin.left, 15);
            
            doc.setFontSize(9);
            doc.setTextColor('#6B7280');
            doc.setFont('helvetica', 'normal');
            doc.text(`${companyDetails.address}`, data.settings.margin.left, 20);
            doc.text(`GSTIN: ${companyDetails.gstin}`, data.settings.margin.left, 24);

            // Report Title
            doc.setFontSize(16);
            doc.setTextColor('#111827');
            doc.setFont('helvetica', 'bold');
            doc.text('Detailed Purchase Report', pageWidth / 2, 35, { align: 'center' });

            // Date Range
            if (dateRange.start || dateRange.end) {
                const start = dateRange.start ? new Date(dateRange.start).toLocaleDateString('en-IN') : 'Start';
                const end = dateRange.end ? new Date(dateRange.end).toLocaleDateString('en-IN') : 'End';
                doc.setFontSize(10);
                doc.setTextColor('#6B7280');
                doc.setFont('helvetica', 'normal');
                doc.text(`Period: ${start} to ${end}`, pageWidth / 2, 42, { align: 'center' });
            }


            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`${companyDetails.name}`, data.settings.margin.left, pageHeight - 10);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - data.settings.margin.right, pageHeight - 10, { align: 'right' });
        }
    });

    doc.output('pdfobjectnewwindow');
};

export const generatePurchaseInvoiceSummaryPDF = (data: {
    purchases: PurchaseInvoice[];
    companyDetails: CompanyDetails;
    vendors: Vendor[];
    dateRange: { start: string; end: string };
}) => {
    const { purchases, companyDetails, vendors, dateRange } = data;
    const doc = new jsPDF(); // Default orientation is portrait
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

    let totalAmountForAllInvoices = 0;

    const tableData: any[] = purchases.map((p, index) => {
        const vendorName = vendors.find(v => v.id === p.vendorId)?.name || 'N/A';
        const purchaseDate = new Date(p.date).toLocaleDateString('en-IN', { timeZone: 'UTC' });
        totalAmountForAllInvoices += p.totalAmount;

        return [
            index + 1, // Sr. No.
            purchaseDate,
            p.invoiceNumber,
            vendorName,
            formatNumber(p.totalAmount),
        ];
    });

    const head = [['Sr. No.', 'Date', 'Invoice #', 'Vendor Name', 'Amount']];

    const foot = [
        [
            { content: 'Grand Total', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
            { content: formatNumber(totalAmountForAllInvoices), styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } }
        ]
    ];

    autoTable(doc, {
        head: head,
        body: tableData,
        foot: foot,
        startY: 50, // Start below the main header
        theme: 'grid',
        headStyles: {
            fillColor: '#3B82F6',
            textColor: '#FFFFFF',
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            valign: 'middle',
            cellPadding: 2
        },
        bodyStyles: {
            fontSize: 7,
            halign: 'center',
            valign: 'middle',
            cellPadding: 1
        },
        footStyles: {
            fillColor: '#F3F4F6',
            textColor: '#111827',
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            valign: 'middle',
            cellPadding: 2
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 }, // Sr. No.
            1: { halign: 'left', cellWidth: 25 }, // Date
            2: { halign: 'left', cellWidth: 40 }, // Invoice #
            3: { halign: 'left', cellWidth: 60 }, // Vendor Name
            4: { halign: 'right', cellWidth: 30 }, // Amount
        },
        didDrawPage: (data) => {
            // Company Header
            doc.setFontSize(14);
            doc.setTextColor('#111827');
            doc.setFont('helvetica', 'bold');
            doc.text(companyDetails.name, data.settings.margin.left, 15);
            
            doc.setFontSize(9);
            doc.setTextColor('#6B7280');
            doc.setFont('helvetica', 'normal');
            doc.text(`${companyDetails.address}`, data.settings.margin.left, 20);
            doc.text(`GSTIN: ${companyDetails.gstin}`, data.settings.margin.left, 24);

            // Report Title
            doc.setFontSize(16);
            doc.setTextColor('#111827');
            doc.setFont('helvetica', 'bold');
            doc.text('Purchase Invoices Summary', pageWidth / 2, 35, { align: 'center' });

            // Date Range
            if (dateRange.start || dateRange.end) {
                const start = dateRange.start ? new Date(dateRange.start).toLocaleDateString('en-IN') : 'Start';
                const end = dateRange.end ? new Date(dateRange.end).toLocaleDateString('en-IN') : 'End';
                doc.setFontSize(10);
                doc.setTextColor('#6B7280');
                doc.setFont('helvetica', 'normal');
                doc.text(`Period: ${start} to ${end}`, pageWidth / 2, 42, { align: 'center' });
            }

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`${companyDetails.name}`, data.settings.margin.left, pageHeight - 10);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - data.settings.margin.right, pageHeight - 10, { align: 'right' });
        }
    });

    doc.output('pdfobjectnewwindow');
};
