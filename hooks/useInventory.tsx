
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { 
  InventoryContextType, Product, Vendor, Department, PurchaseInvoice, 
  OutwardTransaction, VendorPayment, CompanyDetails, Category, 
  DailySale, BanquetSale, ActivityLog, UserRole, StockAdjustment, GstType,
  TaxRate, AdditionalCharge, BillingPreferences, ProductStock, PaymentStatus
} from '../types';
import { PRODUCTS, CATEGORIES, VENDORS, DEPARTMENTS, DEFAULT_TAX_RATES, DEFAULT_ADDITIONAL_CHARGES, DEFAULT_BILLING_PREFS } from '../constants';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const KEYS = {
  PRODUCTS: 'ss_v6_products',
  PURCHASES: 'ss_v6_purchases',
  OUTWARDS: 'ss_v6_outwards',
  META: 'ss_v6_meta',
  SALES: 'ss_v6_sales',
  LOGS: 'ss_v6_logs',
  ADJUSTMENTS: 'ss_v6_adjustments',
  VENDORS: 'ss_v6_vendors',
  CATEGORIES: 'ss_v6_categories',
  DEPARTMENTS: 'ss_v6_departments',
  COMPANY: 'ss_v6_company',
  BANQUET: 'ss_v6_banquet',
  TAX: 'ss_v6_tax',
  CHARGES: 'ss_v6_charges',
  PREFS: 'ss_v6_prefs',
  PAYMENTS: 'ss_v6_payments'
};

const dateReviver = (key: string, value: any) => {
  const isISO8601 = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);
  return isISO8601 ? new Date(value) : value;
};

export const InventoryProvider: React.FC<{ children: ReactNode; userRole: UserRole }> = ({ children, userRole }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data, dateReviver) : PRODUCTS.map(p => ({ ...p, initialQuantity: p.quantity }));
  });
  
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() => {
    const data = localStorage.getItem(KEYS.PURCHASES);
    return data ? JSON.parse(data, dateReviver) : [];
  });

  const [outwards, setOutwards] = useState<OutwardTransaction[]>(() => {
    const data = localStorage.getItem(KEYS.OUTWARDS);
    return data ? JSON.parse(data, dateReviver) : [];
  });

  const [dailySales, setDailySales] = useState<DailySale[]>(() => {
    const data = localStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data, dateReviver) : [];
  });

  const [banquetSales, setBanquetSales] = useState<BanquetSale[]>(() => {
    const data = localStorage.getItem(KEYS.BANQUET);
    return data ? JSON.parse(data, dateReviver) : [];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data, dateReviver) : [];
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const data = localStorage.getItem(KEYS.ADJUSTMENTS);
    return data ? JSON.parse(data, dateReviver) : [];
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const data = localStorage.getItem(KEYS.VENDORS);
    return data ? JSON.parse(data, dateReviver) : VENDORS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data, dateReviver) : CATEGORIES;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const data = localStorage.getItem(KEYS.DEPARTMENTS);
    return data ? JSON.parse(data, dateReviver) : DEPARTMENTS;
  });

  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>(() => {
    const data = localStorage.getItem(KEYS.PAYMENTS);
    return data ? JSON.parse(data, dateReviver) : [];
  });

  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(() => {
    const data = localStorage.getItem(KEYS.COMPANY);
    return data ? JSON.parse(data, dateReviver) : {
      name: 'StockSense Solutions',
      address: '123 Tech Park, Silicon Valley',
      gstin: '27AAAAA0000A1Z5',
      email: 'admin@stocksense.com',
      dashboardTitle: 'Business Intelligence'
    };
  });

  const [taxRates, setTaxRates] = useState<TaxRate[]>(() => {
    const data = localStorage.getItem(KEYS.TAX);
    return data ? JSON.parse(data, dateReviver) : DEFAULT_TAX_RATES;
  });

  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(() => {
    const data = localStorage.getItem(KEYS.CHARGES);
    return data ? JSON.parse(data, dateReviver) : DEFAULT_ADDITIONAL_CHARGES;
  });

  const [billingPreferences, setBillingPreferences] = useState<BillingPreferences>(() => {
    const data = localStorage.getItem(KEYS.PREFS);
    return data ? JSON.parse(data, dateReviver) : DEFAULT_BILLING_PREFS;
  });

  /**
   * CORE FIX: derived live stock calculation.
   * Ensures product.quantity is always correctly calculated from source tables.
   */
  const syncLiveStock = useCallback(() => {
    setProducts(currentProducts => {
      return currentProducts.map(product => {
        let inwardTotal = 0;
        purchases.forEach(p => {
          p.items.forEach(i => { if (i.productId === product.id) inwardTotal += i.quantity; });
        });

        let outwardTotal = 0;
        outwards.forEach(o => {
          o.items.forEach(i => { if (i.productId === product.id) outwardTotal += i.quantity; });
        });

        let adjustmentTotal = 0;
        stockAdjustments.forEach(a => {
          if (a.productId === product.id) adjustmentTotal += a.quantity;
        });

        return {
          ...product,
          quantity: product.initialQuantity + inwardTotal - outwardTotal + adjustmentTotal
        };
      });
    });
  }, [purchases, outwards, stockAdjustments]);

  // Trigger recalculation whenever transaction data changes
  useEffect(() => {
    syncLiveStock();
  }, [purchases, outwards, stockAdjustments, syncLiveStock]);

  useEffect(() => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
    localStorage.setItem(KEYS.OUTWARDS, JSON.stringify(outwards));
    localStorage.setItem(KEYS.SALES, JSON.stringify(dailySales));
    localStorage.setItem(KEYS.BANQUET, JSON.stringify(banquetSales));
    localStorage.setItem(KEYS.LOGS, JSON.stringify(activityLogs));
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(stockAdjustments));
    localStorage.setItem(KEYS.VENDORS, JSON.stringify(vendors));
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(departments));
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(vendorPayments));
    localStorage.setItem(KEYS.COMPANY, JSON.stringify(companyDetails));
    localStorage.setItem(KEYS.TAX, JSON.stringify(taxRates));
    localStorage.setItem(KEYS.CHARGES, JSON.stringify(additionalCharges));
    localStorage.setItem(KEYS.PREFS, JSON.stringify(billingPreferences));
  }, [products, purchases, outwards, dailySales, banquetSales, activityLogs, stockAdjustments, vendors, categories, departments, vendorPayments, companyDetails, taxRates, additionalCharges, billingPreferences]);

  const addLog = useCallback((entity: string, action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESET' | 'ADJUST', details: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      entity,
      action,
      details,
      userRole
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 100));
  }, [userRole]);

  const getAccountingStock = useCallback((productId: number, periodStart: Date, periodEnd: Date): ProductStock => {
    const product = products.find(p => p.id === productId);
    if (!product) return { initialOpening: 0, monthOpening: 0, inward: 0, outward: 0, adjustment: 0, closingStock: 0, liveStock: 0 };

    const startTime = periodStart.getTime();
    const endTime = periodEnd.getTime();

    // 1. Calculate opening at periodStart (Prior History)
    let inwardBefore = 0;
    purchases.forEach(p => { 
      if (new Date(p.date).getTime() < startTime) {
        p.items.forEach(i => { if (i.productId === productId) inwardBefore += i.quantity; });
      }
    });
    
    let outwardBefore = 0;
    outwards.forEach(o => { 
      if (new Date(o.date).getTime() < startTime) {
        o.items.forEach(i => { if (i.productId === productId) outwardBefore += i.quantity; });
      }
    });
    
    let adjustmentBefore = 0;
    stockAdjustments.forEach(a => { 
      if (new Date(a.date).getTime() < startTime && a.productId === productId) adjustmentBefore += a.quantity; 
    });

    const openingAtStart = product.initialQuantity + inwardBefore - outwardBefore + adjustmentBefore;

    // 2. Movements WITHIN the current reporting period
    let inwardDuring = 0;
    purchases.forEach(p => {
      const d = new Date(p.date).getTime();
      if (d >= startTime && d <= endTime) {
        p.items.forEach(i => { if (i.productId === productId) inwardDuring += i.quantity; });
      }
    });

    let outwardDuring = 0;
    outwards.forEach(o => {
      const d = new Date(o.date).getTime();
      if (d >= startTime && d <= endTime) {
        o.items.forEach(i => { if (i.productId === productId) outwardDuring += i.quantity; });
      }
    });

    let adjustmentDuring = 0;
    stockAdjustments.forEach(a => {
      const d = new Date(a.date).getTime();
      if (d >= startTime && d <= endTime && a.productId === productId) {
        adjustmentDuring += a.quantity;
      }
    });

    // Month Opening + Inward - Outward = Closing Stock
    const closingAtEnd = openingAtStart + inwardDuring - outwardDuring + adjustmentDuring;

    return { 
      initialOpening: product.initialQuantity, 
      monthOpening: openingAtStart, 
      inward: inwardDuring, 
      outward: outwardDuring, 
      adjustment: adjustmentDuring, 
      closingStock: closingAtEnd, 
      liveStock: product.quantity 
    };
  }, [products, purchases, outwards, stockAdjustments]);

  const getCurrentStock = useCallback((productId: number, date?: Date): ProductStock => {
    return getAccountingStock(productId, new Date(0), date || new Date());
  }, [getAccountingStock]);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'initialQuantity' | 'quantity'> & { initialQuantity: number }): Product => {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct: Product = { ...productData, id: newId, quantity: productData.initialQuantity };
    setProducts(prev => [...prev, newProduct]);
    addLog('Product', 'CREATE', `Added ${newProduct.name}`);
    return newProduct;
  }, [products, addLog]);

  const addMultipleProducts = useCallback((productsData: (Omit<Product, 'id' | 'initialQuantity' | 'quantity'> & { initialQuantity: number })[]) => {
    const newProducts = productsData.map((p, idx) => ({
      ...p,
      id: products.length + idx + 1,
      quantity: p.initialQuantity
    }));
    setProducts(prev => [...prev, ...newProducts]);
    addLog('Product', 'CREATE', `Imported ${newProducts.length} products`);
  }, [products.length, addLog]);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    addLog('Product', 'UPDATE', `Updated ${updatedProduct.name}`);
  }, [addLog]);

  const deleteProduct = useCallback((productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    addLog('Product', 'DELETE', `Deleted product ID ${productId}`);
  }, [addLog]);

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    setCategories(prev => [...prev, { ...category, id: newId }]);
    addLog('Category', 'CREATE', `Added category ${category.name}`);
  }, [categories, addLog]);

  const updateCategory = useCallback((category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
    addLog('Category', 'UPDATE', `Updated category ${category.name}`);
  }, [addLog]);

  const deleteCategory = useCallback((categoryId: number) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    addLog('Category', 'DELETE', `Deleted category ID ${categoryId}`);
  }, [addLog]);

  const addVendor = useCallback((vendor: Omit<Vendor, 'id'>) => {
    const newId = vendors.length > 0 ? Math.max(...vendors.map(v => v.id)) + 1 : 1;
    setVendors(prev => [...prev, { ...vendor, id: newId }]);
    addLog('Vendor', 'CREATE', `Added vendor ${vendor.name}`);
  }, [vendors, addLog]);

  const updateVendor = useCallback((vendor: Vendor) => {
    setVendors(prev => prev.map(v => v.id === vendor.id ? vendor : v));
    addLog('Vendor', 'UPDATE', `Updated vendor ${vendor.name}`);
  }, [addLog]);

  const deleteVendor = useCallback((vendorId: number) => {
    setVendors(prev => prev.filter(v => v.id !== vendorId));
    addLog('Vendor', 'DELETE', `Deleted vendor ID ${vendorId}`);
  }, [addLog]);

  const addDepartment = useCallback((department: Omit<Department, 'id'>) => {
    const newId = departments.length > 0 ? Math.max(...departments.map(d => d.id)) + 1 : 1;
    setDepartments(prev => [...prev, { ...department, id: newId }]);
    addLog('Department', 'CREATE', `Added department ${department.name}`);
  }, [departments, addLog]);

  const updateDepartment = useCallback((department: Department) => {
    setDepartments(prev => prev.map(d => d.id === department.id ? department : d));
    addLog('Department', 'UPDATE', `Updated department ${department.name}`);
  }, [addLog]);

  const deleteDepartment = useCallback((departmentId: number) => {
    setDepartments(prev => prev.filter(d => d.id !== departmentId));
    addLog('Department', 'DELETE', `Deleted department ID ${departmentId}`);
  }, [addLog]);

  // Transaction handlers now strictly manage the ledger. Sync happens via useEffect.
  const recordOutward = useCallback((items: { productId: number; quantity: number, costAtTime?: number }[], departmentId: number, date: Date, requisitionNumber?: string, purchaseId?: string) => {
    const newOutward: OutwardTransaction = {
      id: Date.now().toString(),
      departmentId,
      requisitionNumber,
      date,
      items: items.map(i => {
        const p = products.find(prod => prod.id === i.productId);
        return { ...i, costAtTime: i.costAtTime || p?.purchasePrice || 0 };
      }),
      totalCost: items.reduce((acc, i) => acc + (i.quantity * (i.costAtTime || products.find(p => p.id === i.productId)?.purchasePrice || 0)), 0)
    };
    
    setOutwards(prev => [newOutward, ...prev]);
    if (purchaseId) {
      setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, isOutwarded: true } : p));
    }
    addLog('Outward', 'CREATE', `Recorded outward for department ID ${departmentId}`);
  }, [products, addLog]);

  const recordPurchase = useCallback((invoice: Omit<PurchaseInvoice, 'id' | 'totalAmount' | 'paidAmount' | 'paymentStatus'>) => {
    const totalAmount = invoice.items.reduce((acc, i) => acc + (i.quantity * i.unitCost * (1 + i.gstRate / 100)), 0);
    const newPurchase: PurchaseInvoice = {
      ...invoice,
      id: Date.now().toString(),
      totalAmount,
      paidAmount: 0,
      paymentStatus: 'Unpaid'
    };

    setPurchases(prev => [newPurchase, ...prev]);
    // Optionally update price reference in master
    setProducts(prev => prev.map(p => {
      const item = invoice.items.find(i => i.productId === p.id);
      return item ? { ...p, purchasePrice: item.unitCost } : p;
    }));
    addLog('Purchase', 'CREATE', `Recorded purchase ${invoice.invoiceNumber}`);
  }, [addLog]);

  const updatePurchase = useCallback((invoice: PurchaseInvoice) => {
    setPurchases(prev => prev.map(p => p.id === invoice.id ? invoice : p));
    addLog('Purchase', 'UPDATE', `Updated purchase ${invoice.invoiceNumber}`);
  }, [addLog]);

  const deletePurchase = useCallback((purchaseId: string) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    addLog('Purchase', 'DELETE', `Deleted purchase ${purchase.invoiceNumber}`);
  }, [purchases, addLog]);

  const updateOutward = useCallback((outward: OutwardTransaction) => {
    setOutwards(prev => prev.map(o => o.id === outward.id ? outward : o));
    addLog('Outward', 'UPDATE', `Updated outward ID ${outward.id}`);
  }, [addLog]);

  const deleteOutward = useCallback((outwardId: string) => {
    const outward = outwards.find(o => o.id === outwardId);
    if (!outward) return;
    setOutwards(prev => prev.filter(o => o.id !== outwardId));
    addLog('Outward', 'DELETE', `Deleted outward ID ${outwardId}`);
  }, [outwards, addLog]);

  const recordPayment = useCallback((paymentData: Omit<VendorPayment, 'id' | 'date' | 'vendorId'>) => {
    const purchase = purchases.find(p => p.id === paymentData.purchaseInvoiceId);
    if (!purchase) return;

    const newPayment: VendorPayment = {
      ...paymentData,
      id: Date.now().toString(),
      date: new Date(),
      vendorId: purchase.vendorId
    };

    setVendorPayments(prev => [newPayment, ...prev]);
    setPurchases(prev => prev.map(p => {
      if (p.id === paymentData.purchaseInvoiceId) {
        const newPaid = p.paidAmount + paymentData.amount;
        return {
          ...p,
          paidAmount: newPaid,
          paymentStatus: newPaid >= p.totalAmount ? 'Paid' : 'Partial'
        };
      }
      return p;
    }));

    addLog('Payment', 'CREATE', `Recorded payment for invoice ${purchase.invoiceNumber}`);
  }, [purchases, addLog]);

  const updateCompanyDetails = useCallback((details: CompanyDetails) => {
    setCompanyDetails(details);
    addLog('Company', 'UPDATE', `Updated company details`);
  }, [addLog]);

  const addDailySale = useCallback((sale: DailySale) => {
    setDailySales(prev => [...prev.filter(s => s.date !== sale.date), sale]);
    addLog('Sale', 'CREATE', `Added daily sale for ${sale.date}`);
  }, [addLog]);

  const deleteDailySale = useCallback((date: string) => {
    setDailySales(prev => prev.filter(s => s.date !== date));
    addLog('Sale', 'DELETE', `Deleted daily sale for ${date}`);
  }, [addLog]);

  const addBanquetSale = useCallback((sale: Omit<BanquetSale, 'id' | 'totalAmount'>) => {
    const totalAmount = sale.pax * sale.rate;
    setBanquetSales(prev => [...prev, { ...sale, id: Date.now().toString(), totalAmount }]);
    addLog('Banquet', 'CREATE', `Added banquet sale for ${sale.customerName}`);
  }, [addLog]);

  const deleteBanquetSale = useCallback((saleId: string) => {
    setBanquetSales(prev => prev.filter(s => s.id !== saleId));
    addLog('Banquet', 'DELETE', `Deleted banquet sale ID ${saleId}`);
  }, [addLog]);

  const adjustStock = useCallback((productId: number, newQuantity: number, reason: string, customDate?: Date) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Calculate the difference required to reach the target quantity from derived ledger
    const currentDerived = (getAccountingStock(productId, new Date(0), new Date())).liveStock;
    const diff = newQuantity - currentDerived;

    const newAdjustment: StockAdjustment = {
      id: Date.now().toString(),
      productId,
      quantity: diff,
      date: customDate || new Date(),
      reason
    };

    setStockAdjustments(prev => [...prev, newAdjustment]);
    addLog('Stock', 'ADJUST', `Adjusted ${product.name} to target ${newQuantity}. (Diff: ${diff}). Reason: ${reason}`);
  }, [products, addLog, getAccountingStock]);

  const factoryReset = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const addTaxRate = useCallback((tax: Omit<TaxRate, 'id'>) => {
    setTaxRates(prev => [...prev, { ...tax, id: Date.now() }]);
  }, []);

  const deleteTaxRate = useCallback((id: number) => {
    setTaxRates(prev => prev.filter(t => t.id !== id));
  }, []);

  const addAdditionalCharge = useCallback((charge: Omit<AdditionalCharge, 'id'>) => {
    setAdditionalCharges(prev => [...prev, { ...charge, id: Date.now() }]);
  }, []);

  const updateAdditionalCharge = useCallback((charge: AdditionalCharge) => {
    setAdditionalCharges(prev => prev.map(c => c.id === charge.id ? charge : c));
  }, []);

  const deleteAdditionalCharge = useCallback((id: number) => {
    setAdditionalCharges(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateBillingPreferences = useCallback((prefs: Partial<BillingPreferences>) => {
    setBillingPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  const value: InventoryContextType = {
    products, categories, vendors, departments, outwards, purchases, vendorPayments,
    companyDetails, dailySales, banquetSales, stockAdjustments, activityLogs,
    taxRates, additionalCharges, billingPreferences,
    getAccountingStock, getCurrentStock, addProduct, addMultipleProducts, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory, addVendor, updateVendor, deleteVendor,
    addDepartment, updateDepartment, deleteDepartment, recordOutward, recordPurchase, updatePurchase,
    recordPayment, updateCompanyDetails, deletePurchase, updateOutward, deleteOutward,
    addDailySale, deleteDailySale, addBanquetSale, deleteBanquetSale, adjustStock, factoryReset,
    addTaxRate, deleteTaxRate, addAdditionalCharge, updateAdditionalCharge, deleteAdditionalCharge, updateBillingPreferences
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
