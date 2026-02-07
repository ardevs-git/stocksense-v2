
import type { Product, Category, Vendor, Warehouse, User, Department, OutwardTransaction, PurchaseInvoice, VendorPayment, PaymentStatus, TaxRate, AdditionalCharge, BillingPreferences, DailySale, BanquetSale } from './types';
import { UserRole, PaymentMode } from './types';

export const USERS: User[] = [
  { id: 1, name: 'Admin User', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 2, name: 'Manager User', role: UserRole.MANAGER, avatar: 'https://i.pravatar.cc/150?u=manager' },
  { id: 3, name: 'Staff User', role: UserRole.STAFF, avatar: 'https://i.pravatar.cc/150?u=staff' },
];

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Beverages' },
  { id: 2, name: 'Dairy' },
  { id: 3, name: 'Bakery' },
  { id: 4, name: 'Groceries' },
];

export const VENDORS: Vendor[] = [
  { id: 1, name: 'Global Foods Inc.', contact: 'john@globalfoods.com' },
  { id: 2, name: 'Farm Fresh Co.', contact: 'jane@farmfresh.com' },
  { id: 3, name: 'Bakery Supplies Ltd.', contact: 'bob@bakerysupplies.com' },
];

export const WAREHOUSES: Warehouse[] = [
  { id: 1, name: 'Main Warehouse', location: 'New York, USA' },
  { id: 2, name: 'West Coast Hub', location: 'Los Angeles, USA' },
];

export const DEPARTMENTS: Department[] = [
  { id: 1, name: 'Kitchen' },
  { id: 2, name: 'Bar' },
  { id: 3, name: 'Service Floor' },
];

// FIX: Added openingQuantity to all product records as it is a required property in the Product interface
export const PRODUCTS: Product[] = [
  { id: 1, name: 'Organic Milk', hsn: '0401', unit: 'L', barcode: '8901234567890', categoryId: 2, vendorId: 2, warehouseId: 1, purchasePrice: 2.5, gstRate: 5, quantity: 80, openingQuantity: 80, reorderLevel: 20 },
  { id: 2, name: 'Artisan Bread', hsn: '1905', unit: 'pcs', barcode: '9876543210987', categoryId: 3, vendorId: 3, warehouseId: 1, purchasePrice: 1.8, gstRate: 5, quantity: 15, openingQuantity: 15, reorderLevel: 25 },
  { id: 3, name: 'Espresso Beans', hsn: '0901', unit: 'kg', barcode: '1122334455667', categoryId: 1, vendorId: 1, warehouseId: 2, purchasePrice: 15, gstRate: 18, quantity: 150, openingQuantity: 150, reorderLevel: 50 },
  { id: 4, name: 'Basmati Rice 1kg', hsn: '1006', unit: 'kg', categoryId: 4, vendorId: 1, warehouseId: 1, purchasePrice: 5, gstRate: 12, quantity: 200, openingQuantity: 200, reorderLevel: 100 },
  { id: 5, name: 'Cheddar Cheese', hsn: '0406', unit: 'kg', barcode: '5566778899001', categoryId: 2, vendorId: 2, warehouseId: 2, purchasePrice: 4, gstRate: 12, quantity: 45, openingQuantity: 45, reorderLevel: 30 },
  { id: 6, name: 'Cold Brew Coffee', hsn: '2101', unit: 'L', categoryId: 1, vendorId: 1, warehouseId: 1, purchasePrice: 3, gstRate: 18, quantity: 90, openingQuantity: 90, reorderLevel: 40 },
];

export const PURCHASES: PurchaseInvoice[] = [
  {
    id: `P2024001`,
    vendorId: 1,
    invoiceNumber: 'INV-2024-001',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    items: [
      { productId: 3, quantity: 50, unitCost: 14.5, gstRate: 18 },
      { productId: 4, quantity: 100, unitCost: 4.8, gstRate: 12 },
    ],
    totalAmount: (50 * 14.5) + (100 * 4.8),
    paidAmount: 1205,
    paymentStatus: 'Paid',
  },
  {
    id: `P2024002`,
    vendorId: 2,
    invoiceNumber: 'INV-2024-002',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    items: [
        { productId: 1, quantity: 40, unitCost: 2.5, gstRate: 5 },
        { productId: 5, quantity: 20, unitCost: 4.0, gstRate: 12 },
    ],
    totalAmount: (40 * 2.5) + (20 * 4.0),
    paidAmount: 100,
    paymentStatus: 'Partial',
  },
   {
    id: `P2024003`,
    vendorId: 3,
    invoiceNumber: 'INV-2024-003',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    items: [
        { productId: 2, quantity: 50, unitCost: 1.8, gstRate: 5 },
    ],
    totalAmount: 50 * 1.8,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
  },
];

export const OUTWARDS: OutwardTransaction[] = [
    {
        id: 'O2024001',
        departmentId: 1,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        items: [
            { productId: 4, quantity: 10, costAtTime: 4.8 },
            { productId: 5, quantity: 5, costAtTime: 4.0 },
        ],
        totalCost: (10 * 4.8) + (5 * 4.0),
    },
    {
        id: 'O2024002',
        departmentId: 2,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        items: [
            { productId: 3, quantity: 5, costAtTime: 15.0 },
            { productId: 1, quantity: 12, costAtTime: 2.5 },
        ],
        totalCost: (5 * 15.0) + (12 * 2.5),
    },
     {
        id: 'O2024003',
        departmentId: 1,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        items: [
            { productId: 2, quantity: 20, costAtTime: 1.8 },
        ],
        totalCost: 20 * 1.8,
    },
];

export const VENDOR_PAYMENTS: VendorPayment[] = [
    {
        id: 'VP2024001',
        purchaseInvoiceId: 'P2024001',
        vendorId: 1,
        amount: 1205,
        date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        mode: PaymentMode.BANK_TRANSFER,
    },
    {
        id: 'VP2024002',
        purchaseInvoiceId: 'P2024002',
        vendorId: 2,
        amount: 100,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        mode: PaymentMode.CASH,
    }
];

export const DAILY_SALES: DailySale[] = [
    { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1500 },
    { date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2200 },
    { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1800 },
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2500 },
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2300 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2800 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 3100 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2900 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 3500 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 3200 },
];

export const BANQUET_SALES: BanquetSale[] = [];

export const DEFAULT_TAX_RATES: TaxRate[] = [
  { id: 1, name: 'GST 0%', rate: 0, type: 'CGST_SGST' },
  { id: 2, name: 'GST 5%', rate: 5, type: 'CGST_SGST' },
  { id: 3, name: 'GST 12%', rate: 12, type: 'CGST_SGST' },
  { id: 4, name: 'GST 18%', rate: 18, type: 'CGST_SGST' },
  { id: 5, name: 'GST 28%', rate: 28, type: 'CGST_SGST' },
  { id: 6, name: 'IGST 18%', rate: 18, type: 'IGST' },
];

export const DEFAULT_ADDITIONAL_CHARGES: AdditionalCharge[] = [
  { id: 1, name: 'Packing Charge', type: 'FIXED', value: 20, isApplied: true },
  { id: 2, name: 'Delivery Charge', type: 'FIXED', value: 50, isApplied: true },
  { id: 3, name: 'Service Charge', type: 'PERCENTAGE', value: 5, isApplied: false },
];

export const DEFAULT_BILLING_PREFS: BillingPreferences = {
  roundOff: true,
  isInclusiveTax: false,
};