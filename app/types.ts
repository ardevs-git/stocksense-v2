
export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  STAFF = 'Staff',
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Vendor {
  id: number;
  name: string;
  contact: string;
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

export interface Product {
  id: number;
  name:string;
  hsn: string;
  unit: string;
  barcode?: string;
  categoryId: number;
  vendorId: number;
  warehouseId: number;
  purchasePrice: number;
  gstRate: number; // in percentage
  openingQuantity: number;
  quantity: number;
  reorderLevel: number;
}

export interface OutwardItem {
    productId: number;
    quantity: number;
    costAtTime: number; // purchasePrice of the product at the time of outward
}

export interface OutwardTransaction {
    id: string;
    departmentId: number;
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

export interface PurchaseInvoice {
    id: string;
    vendorId: number;
    invoiceNumber: string;
    date: Date;
    items: PurchaseInvoiceItem[];
    totalAmount: number;
    paidAmount: number;
    paymentStatus: PaymentStatus;
}

export enum PaymentMode {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  CREDIT_CARD = 'Credit Card',
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
}

// --- New Types for Settings ---

export interface TaxRate {
  id: number;
  name: string; // e.g. "GST 18%"
  rate: number; // 18
  type: 'IGST' | 'CGST_SGST' | 'NONE'; 
}

export interface AdditionalCharge {
  id: number;
  name: string; // e.g. "Packing Charge"
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  isApplied: boolean; // Is currently enabled
}

export interface BillingPreferences {
  roundOff: boolean;
  isInclusiveTax: boolean;
}

export interface DailySale {
  date: string; // YYYY-MM-DD
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
  date: string; // YYYY-MM-DD
  customerName: string;
  pax: number;
  packageDetails: string;
  eventType: BanquetEventType;
  rate: number;
  totalAmount: number;
}

export interface InventoryContextType {
  products: Product[];
  categories: Category[];
  vendors: Vendor[];
  warehouses: Warehouse[];
  departments: Department[];
  outwards: OutwardTransaction[];
  purchases: PurchaseInvoice[];
  vendorPayments: VendorPayment[];
  companyDetails: CompanyDetails;
  dailySales: DailySale[];
  banquetSales: BanquetSale[];
  // New Context Properties
  taxRates: TaxRate[];
  additionalCharges: AdditionalCharge[];
  billingPreferences: BillingPreferences;
  
  addProduct: (product: Omit<Product, 'id'>) => Product;
  addMultipleProducts: (products: Omit<Product, 'id'>[]) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: number) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: number) => void;
  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (vendor: Vendor) => void;
  addDepartment: (department: Omit<Department, 'id'>) => void;
  updateDepartment: (department: Department) => void;
  deleteDepartment: (departmentId: number) => void;
  deleteVendor: (vendorId: number) => void;
  recordOutward: (items: { productId: number; quantity: number, costAtTime?: number }[], departmentId: number, date: Date) => void;
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
  adjustStock: (productId: number, newQuantity: number) => void;
  
  // New Context Methods
  addTaxRate: (tax: Omit<TaxRate, 'id'>) => void;
  deleteTaxRate: (id: number) => void;
  addAdditionalCharge: (charge: Omit<AdditionalCharge, 'id'>) => void;
  updateAdditionalCharge: (charge: AdditionalCharge) => void;
  deleteAdditionalCharge: (id: number) => void;
  updateBillingPreferences: (prefs: Partial<BillingPreferences>) => void;
  factoryReset: () => void;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}
