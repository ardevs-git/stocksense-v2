
export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  STAFF = 'Staff',
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
}

export interface Category {
  id: number;
  name: string;
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gstin?: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface StockAdjustment {
  id: string;
  productId: number;
  quantity: number; // The difference (+/-)
  date: Date;
  reason: string;
}

export interface Product {
  id: number;
  name: string;
  unit: string;
  categoryId: number;
  vendorId: number;
  warehouseId: number;
  purchasePrice: number;
  gstRate: number; 
  initialQuantity: number; // Immutable Day 0 baseline
  quantity: number; // Live current stock cached
  reorderLevel: number;
  hsn?: string;
  barcode?: string;
}

export interface ProductStock {
  initialOpening: number;
  monthOpening: number;
  inward: number;
  outward: number;
  adjustment: number;
  closingStock: number; // Renamed from available
  liveStock: number;
}

export interface OutwardItem {
    productId: number;
    quantity: number;
    costAtTime: number;
}

export interface OutwardTransaction {
    id: string;
    departmentId: number;
    requisitionNumber?: string;
    date: Date;
    items: OutwardItem[];
    totalCost: number;
}

export interface PurchaseInvoiceItem {
    productId: number;
    quantity: number;
    unitCost: number;
    gstRate: number;
}

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';
export type GstType = 'INTRA' | 'INTER';

export interface PurchaseInvoice {
    id: string;
    vendorId: number;
    invoiceNumber: string;
    date: Date;
    items: PurchaseInvoiceItem[];
    totalAmount: number;
    paidAmount: number;
    paymentStatus: PaymentStatus;
    gstType: GstType; 
    isOutwarded?: boolean;
}

export enum PaymentMode {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  CREDIT_CARD = 'CREDIT_CARD',
  UPI = 'UPI',
}

export interface VendorPayment {
  id: string;
  purchaseInvoiceId: string;
  vendorId: number;
  amount: number;
  date: Date;
  mode: PaymentMode;
}

export interface CompanyDetails {
  name: string;
  address: string;
  gstin: string;
  email: string;
  dashboardTitle?: string;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: number;
  type: 'IGST' | 'CGST_SGST' | 'NONE'; 
}

export interface AdditionalCharge {
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  isApplied: boolean;
}

export interface BillingPreferences {
  roundOff: boolean;
  isInclusiveTax: boolean;
}

export interface DailySale {
  date: string;
  amount: number;
}

export enum BanquetEventType {
  WEDDING = 'Wedding',
  BIRTHDAY = 'Birthday',
  CORPORATE = 'Corporate Event',
  CONFERENCE = 'Conference',
  SOCIAL = 'Social Gathering',
  OTHER = 'Other',
}

export interface BanquetSale {
  id: string;
  date: string;
  customerName: string;
  pax: number;
  packageDetails: string;
  eventType: BanquetEventType;
  rate: number;
  totalAmount: number;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  entity: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESET' | 'ADJUST';
  details: string;
  userRole: UserRole;
}

export interface InventoryContextType {
  products: Product[];
  categories: Category[];
  vendors: Vendor[];
  departments: Department[];
  outwards: OutwardTransaction[];
  purchases: PurchaseInvoice[];
  vendorPayments: VendorPayment[];
  companyDetails: CompanyDetails;
  dailySales: DailySale[];
  banquetSales: BanquetSale[];
  stockAdjustments: StockAdjustment[];
  activityLogs: ActivityLog[];
  taxRates: TaxRate[];
  additionalCharges: AdditionalCharge[];
  billingPreferences: BillingPreferences;
  
  getAccountingStock: (productId: number, periodStart: Date, periodEnd: Date) => ProductStock;
  getCurrentStock: (productId: number, date?: Date) => ProductStock;
  addProduct: (product: Omit<Product, 'id' | 'initialQuantity' | 'quantity'> & { initialQuantity: number }) => Product;
  addMultipleProducts: (products: (Omit<Product, 'id' | 'initialQuantity' | 'quantity'> & { initialQuantity: number })[]) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: number) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: number) => void;
  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (vendorId: number) => void;
  addDepartment: (department: Omit<Department, 'id'>) => void;
  updateDepartment: (department: Department) => void;
  deleteDepartment: (departmentId: number) => void;
  recordOutward: (items: { productId: number; quantity: number, costAtTime?: number }[], departmentId: number, date: Date, requisitionNumber?: string, purchaseId?: string) => void;
  recordPurchase: (invoice: Omit<PurchaseInvoice, 'id' | 'totalAmount' | 'paidAmount' | 'paymentStatus'>) => void;
  updatePurchase: (invoice: PurchaseInvoice) => void;
  recordPayment: (paymentData: Omit<VendorPayment, 'id' | 'date' | 'vendorId'>) => void;
  updateCompanyDetails: (details: CompanyDetails) => void;
  deletePurchase: (purchaseId: string) => void;
  updateOutward: (outward: OutwardTransaction) => void;
  deleteOutward: (outwardId: string) => void;
  addDailySale: (sale: DailySale) => void;
  deleteDailySale: (date: string) => void;
  addBanquetSale: (sale: Omit<BanquetSale, 'id' | 'totalAmount'>) => void;
  deleteBanquetSale: (saleId: string) => void;
  adjustStock: (productId: number, newQuantity: number, reason: string, customDate?: Date) => void;
  factoryReset: () => void;
  addTaxRate: (tax: Omit<TaxRate, 'id'>) => void;
  deleteTaxRate: (id: number) => void;
  addAdditionalCharge: (charge: Omit<AdditionalCharge, 'id'>) => void;
  updateAdditionalCharge: (charge: AdditionalCharge) => void;
  deleteAdditionalCharge: (id: number) => void;
  updateBillingPreferences: (prefs: Partial<BillingPreferences>) => void;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}
