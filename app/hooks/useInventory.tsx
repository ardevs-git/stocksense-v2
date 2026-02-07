
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { InventoryContextType, Product, Vendor, Department, PurchaseInvoice, OutwardTransaction, OutwardItem, VendorPayment, CompanyDetails, Category, DailySale, BanquetSale, TaxRate, AdditionalCharge, BillingPreferences } from '../types';
import { PRODUCTS, CATEGORIES, VENDORS, WAREHOUSES, DEPARTMENTS, PURCHASES as MOCK_PURCHASES, OUTWARDS as MOCK_OUTWARDS, VENDOR_PAYMENTS as MOCK_VENDOR_PAYMENTS, DAILY_SALES as MOCK_DAILY_SALES, BANQUET_SALES, DEFAULT_TAX_RATES, DEFAULT_ADDITIONAL_CHARGES, DEFAULT_BILLING_PREFS } from '../constants';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INITIAL_COMPANY_DETAILS: CompanyDetails = {
  name: 'StockSense Solutions',
  address: '123 Inventory Lane, Suite 100, Tech City, 12345',
  gstin: '29ABCDE1234F1Z5',
  email: 'contact@stocksense.com',
};

const INVENTORY_STORAGE_KEY = 'stockSenseInventoryData';

const dateReviver = (key: string, value: any) => {
  const isISO8601 = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);
  if (isISO8601) {
    return new Date(value);
  }
  return value;
};

const getInitialState = () => {
  try {
    const item = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (item) {
      const parsed = JSON.parse(item, dateReviver);
      if (parsed.products && parsed.vendors && parsed.purchases && parsed.categories) {
        return {
            ...parsed,
            taxRates: parsed.taxRates || DEFAULT_TAX_RATES,
            additionalCharges: parsed.additionalCharges || DEFAULT_ADDITIONAL_CHARGES,
            billingPreferences: parsed.billingPreferences || DEFAULT_BILLING_PREFS
        };
      }
    }
  } catch (error) {
    console.warn(`Error reading localStorage key "${INVENTORY_STORAGE_KEY}":`, error);
  }

  return {
    products: PRODUCTS,
    categories: CATEGORIES,
    vendors: VENDORS,
    departments: DEPARTMENTS,
    purchases: MOCK_PURCHASES,
    outwards: MOCK_OUTWARDS,
    vendorPayments: MOCK_VENDOR_PAYMENTS,
    companyDetails: INITIAL_COMPANY_DETAILS,
    dailySales: MOCK_DAILY_SALES,
    banquetSales: BANQUET_SALES,
    taxRates: DEFAULT_TAX_RATES,
    additionalCharges: DEFAULT_ADDITIONAL_CHARGES,
    billingPreferences: DEFAULT_BILLING_PREFS,
  };
};

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialState = getInitialState();
  const [products, setProducts] = useState<Product[]>(initialState.products);
  const [categories, setCategories] = useState<Category[]>(initialState.categories);
  const [vendors, setVendors] = useState<Vendor[]>(initialState.vendors);
  const [departments, setDepartments] = useState<Department[]>(initialState.departments);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(initialState.purchases);
  const [outwards, setOutwards] = useState<OutwardTransaction[]>(initialState.outwards);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>(initialState.vendorPayments);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(initialState.companyDetails);
  const [dailySales, setDailySales] = useState<DailySale[]>(initialState.dailySales || []);
  const [banquetSales, setBanquetSales] = useState<BanquetSale[]>(initialState.banquetSales || []);
  
  const [taxRates, setTaxRates] = useState<TaxRate[]>(initialState.taxRates);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(initialState.additionalCharges);
  const [billingPreferences, setBillingPreferences] = useState<BillingPreferences>(initialState.billingPreferences);
  
  useEffect(() => {
    try {
      const stateToSave = {
        products,
        categories,
        vendors,
        departments,
        purchases,
        outwards,
        vendorPayments,
        companyDetails,
        dailySales,
        banquetSales,
        taxRates,
        additionalCharges,
        billingPreferences,
      };
      window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${INVENTORY_STORAGE_KEY}":`, error);
    }
  }, [products, categories, vendors, departments, purchases, outwards, vendorPayments, companyDetails, dailySales, banquetSales, taxRates, additionalCharges, billingPreferences]);


  const addProduct = useCallback((productData: Omit<Product, 'id'>): Product => {
    let newProduct: Product | null = null;
    setProducts(prev => {
        const newId = (prev.reduce((maxId, p) => Math.max(p.id, maxId), 0)) + 1;
        newProduct = { ...productData, id: newId };
        return [...prev, newProduct];
    });

    if (!newProduct) {
        throw new Error("Failed to create the new product.");
    }
    return newProduct;
  }, []);

  const addMultipleProducts = useCallback((productsData: Omit<Product, 'id'>[]) => {
    setProducts(prev => {
        let lastId = prev.reduce((maxId, p) => Math.max(p.id, maxId), 0);
        const newProducts = productsData.map(productData => {
            lastId++;
            return { ...productData, id: lastId };
        });
        return [...prev, ...newProducts];
    });
  }, []);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prevProducts =>
      prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  }, []);

  const deleteProduct = useCallback((productId: number) => {
    const isProductInUse = purchases.some(p => p.items.some(i => i.productId === productId)) || outwards.some(o => o.items.some(i => i.productId === productId));
    if (isProductInUse) {
        alert("Cannot delete product: It is associated with existing transactions.");
        return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
    alert("Product deleted successfully.");
  }, [purchases, outwards]);

  const addCategory = useCallback((categoryData: Omit<Category, 'id'>) => {
    const newCategory = { ...categoryData, id: Date.now() };
    setCategories(prev => [...prev, newCategory]);
    alert(`Category "${newCategory.name}" added.`);
  }, []);

  const updateCategory = useCallback((updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    alert(`Category "${updatedCategory.name}" updated.`);
  }, []);

  const deleteCategory = useCallback((categoryId: number) => {
    const isCategoryInUse = products.some(p => p.categoryId === categoryId);
    if (isCategoryInUse) {
        alert("Cannot delete category. It is associated with existing products.");
        return;
    }
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    alert("Category deleted successfully.");
  }, [products]);

  const addVendor = useCallback((vendorData: Omit<Vendor, 'id'>) => {
    setVendors(prev => [...prev, { ...vendorData, id: Date.now() }]);
    alert(`Vendor "${vendorData.name}" added.`);
  }, []);
  
  const updateVendor = useCallback((updatedVendor: Vendor) => {
    setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
    alert(`Vendor "${updatedVendor.name}" updated.`);
  }, []);

  const deleteVendor = useCallback((vendorId: number) => {
    const isVendorInUse = products.some(p => p.vendorId === vendorId) || purchases.some(p => p.vendorId === vendorId);
    if(isVendorInUse) {
      alert("Cannot delete vendor. They are associated with products or purchases.");
      return;
    }
    setVendors(prev => prev.filter(v => v.id !== vendorId));
    alert("Vendor deleted successfully.");
  }, [products, purchases]);

  const addDepartment = useCallback((departmentData: Omit<Department, 'id'>) => {
    setDepartments(prev => [...prev, { ...departmentData, id: Date.now() }]);
    alert(`Department "${departmentData.name}" added.`);
  }, []);

  const updateDepartment = useCallback((updatedDepartment: Department) => {
    setDepartments(prev => prev.map(d => d.id === updatedDepartment.id ? updatedDepartment : d));
    alert(`Department "${updatedDepartment.name}" updated.`);
  }, []);

  const deleteDepartment = useCallback((departmentId: number) => {
    const isDepartmentInUse = outwards.some(o => o.departmentId === departmentId);
    if (isDepartmentInUse) {
        alert("Cannot delete department. It is associated with existing outward transactions.");
        return;
    }
    setDepartments(prev => prev.filter(d => d.id !== departmentId));
    alert("Department deleted successfully.");
  }, [outwards]);

  const recordPurchase = useCallback((invoiceData: Omit<PurchaseInvoice, 'id' | 'totalAmount' | 'paidAmount' | 'paymentStatus'>) => {
    const totalAmount = invoiceData.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
    const newInvoice: PurchaseInvoice = { ...invoiceData, id: `P${Date.now()}`, totalAmount, paidAmount: 0, paymentStatus: 'Unpaid' };
    
    setPurchases(prev => [newInvoice, ...prev]);
    
    setProducts(prevProducts => {
        const updatedProducts = [...prevProducts];
        newInvoice.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                updatedProducts[productIndex].quantity += item.quantity;
                updatedProducts[productIndex].purchasePrice = item.unitCost;
            }
        });
        return updatedProducts;
    });
    alert(`Purchase invoice ${newInvoice.invoiceNumber} recorded.`);
  }, []);
  
  const updatePurchase = useCallback((updatedInvoice: PurchaseInvoice) => {
    const originalInvoice = purchases.find(p => p.id === updatedInvoice.id);
    if (!originalInvoice) {
        alert("Original invoice not found for update.");
        return;
    }

    const stockChanges = new Map<number, number>();
    originalInvoice.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) - item.quantity);
    });
    updatedInvoice.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) + item.quantity);
    });

    for (const [productId, change] of stockChanges.entries()) {
        const product = products.find(p => p.id === productId);
        if (product && (product.quantity + change < 0)) {
            alert(`Update would result in negative stock for "${product.name}".`);
            return;
        }
    }

    setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        stockChanges.forEach((change, productId) => {
            const productIndex = newProducts.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                newProducts[productIndex].quantity += change;
                const latestPurchaseItem = updatedInvoice.items.find(i => i.productId === productId);
                if (latestPurchaseItem) {
                    newProducts[productIndex].purchasePrice = latestPurchaseItem.unitCost;
                }
            }
        });
        return newProducts;
    });

    setPurchases(prevPurchases =>
        prevPurchases.map(p => p.id === updatedInvoice.id ? updatedInvoice : p)
    );
    alert(`Purchase invoice ${updatedInvoice.invoiceNumber} updated.`);
}, [products, purchases]);

  const recordOutward = useCallback((items: { productId: number; quantity: number, costAtTime?: number }[], departmentId: number, date: Date) => {
    let canProceed = true;
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product || product.quantity < item.quantity) {
            canProceed = false;
            alert(`Insufficient stock for ${product?.name || 'unknown item'}. Required: ${item.quantity}, Available: ${product?.quantity || 0}`);
            break;
        }
    }
    
    if (!canProceed) return;
    
    const transactionItems: OutwardItem[] = [];
    let totalCost = 0;

    setProducts(prevProducts => {
        const updatedProducts = [...prevProducts];
        items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                const product = updatedProducts[productIndex];
                const costPerItem = item.costAtTime ?? product.purchasePrice;
                const cost = item.quantity * costPerItem;
                transactionItems.push({ productId: item.productId, quantity: item.quantity, costAtTime: costPerItem });
                totalCost += cost;
                updatedProducts[productIndex].quantity -= item.quantity;
            }
        });
        return updatedProducts;
    });

    const newOutward: OutwardTransaction = {
        id: `O${Date.now()}`,
        departmentId,
        date: date,
        items: transactionItems,
        totalCost,
    };
    setOutwards(prev => [newOutward, ...prev]);
    alert('Stock outward recorded successfully.');
  }, [products]);

  const updateOutward = useCallback((updatedOutward: OutwardTransaction) => {
    const originalOutward = outwards.find(o => o.id === updatedOutward.id);
    if (!originalOutward) {
        alert("Original outward transaction not found for update.");
        return;
    }

    const stockChanges = new Map<number, number>();

    // Add back original quantities
    originalOutward.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) + item.quantity);
    });

    // Subtract new quantities
    updatedOutward.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) - item.quantity);
    });

    // Pre-flight check: ensure no product goes into negative stock
    for (const [productId, change] of stockChanges.entries()) {
        const product = products.find(p => p.id === productId);
        if (product && (product.quantity + change < 0)) {
            alert(`Update would result in negative stock for "${product.name}". The maximum you can add is ${product.quantity + (originalOutward.items.find(i => i.productId === productId)?.quantity || 0)}.`);
            return;
        }
    }

    // If check passes, apply changes
    setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        stockChanges.forEach((change, productId) => {
            const productIndex = newProducts.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                newProducts[productIndex].quantity += change;
            }
        });
        return newProducts;
    });

    setOutwards(prevOutwards =>
        prevOutwards.map(o => o.id === updatedOutward.id ? updatedOutward : o)
    );
    alert(`Outward transaction ${updatedOutward.id} updated successfully.`);
  }, [products, outwards]);

  const recordPayment = useCallback((paymentData: Omit<VendorPayment, 'id' | 'date' | 'vendorId'>) => {
    const invoiceIndex = purchases.findIndex(p => p.id === paymentData.purchaseInvoiceId);
    if (invoiceIndex === -1) {
        alert("Invoice not found!");
        return;
    }

    const updatedPurchases = [...purchases];
    const invoice = updatedPurchases[invoiceIndex];
    const newPaidAmount = invoice.paidAmount + paymentData.amount;
    
    if (newPaidAmount > invoice.totalAmount) {
        alert("Payment amount cannot exceed the balance due.");
        return;
    }

    invoice.paidAmount = newPaidAmount;
    if (invoice.paidAmount >= invoice.totalAmount) {
        invoice.paymentStatus = 'Paid';
    } else if (invoice.paidAmount > 0) {
        invoice.paymentStatus = 'Partial';
    } else {
        invoice.paymentStatus = 'Unpaid';
    }

    const newPayment: VendorPayment = {
      ...paymentData,
      id: `VP${Date.now()}`,
      date: new Date(),
      vendorId: invoice.vendorId
    };

    setPurchases(updatedPurchases);
    setVendorPayments(prev => [newPayment, ...prev]);
    alert('Payment recorded successfully.');
  }, [purchases]);

  const updateCompanyDetails = useCallback((details: CompanyDetails) => {
    setCompanyDetails(details);
    alert('Company details updated.');
  }, []);

  const deletePurchase = useCallback((purchaseId: string) => {
    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    if (!purchaseToDelete) return;

    const stockChanges = new Map<number, number>();
    purchaseToDelete.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) - item.quantity);
    });

    setProducts(prevProducts =>
        prevProducts.map(p => {
            const change = stockChanges.get(p.id);
            if (change) {
                return { ...p, quantity: p.quantity + change };
            }
            return p;
        })
    );

    setVendorPayments(prev => prev.filter(p => p.purchaseInvoiceId !== purchaseId));
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    alert("Purchase and associated payments deleted.");

  }, [purchases, products]);

  const deleteOutward = useCallback((outwardId: string) => {
    const outwardToDelete = outwards.find(o => o.id === outwardId);
    if (!outwardToDelete) return;
    
    const stockChanges = new Map<number, number>();
    outwardToDelete.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) + item.quantity);
    });

    setProducts(prevProducts =>
        prevProducts.map(p => {
            const change = stockChanges.get(p.id);
            if (change) {
                return { ...p, quantity: p.quantity + change };
            }
            return p;
        })
    );

    setOutwards(prev => prev.filter(o => o.id !== outwardId));
    alert("Outward transaction deleted.");
  }, [outwards, products]);

  const addDailySale = useCallback((saleData: DailySale) => {
    setDailySales(prev => {
        const existingSaleIndex = prev.findIndex(s => s.date === saleData.date);
        if (existingSaleIndex > -1) {
            const updatedSales = [...prev];
            updatedSales[existingSaleIndex] = saleData;
            return updatedSales;
        } else {
            return [...prev, saleData].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
    });
  }, []);

  const deleteDailySale = useCallback((date: string) => {
      setDailySales(prev => prev.filter(s => s.date !== date));
  }, []);
  
  const addBanquetSale = useCallback((saleData: Omit<BanquetSale, 'id' | 'totalAmount'>) => {
    const totalAmount = saleData.pax * saleData.rate;
    const newSale: BanquetSale = {
        ...saleData,
        id: `B${Date.now()}`,
        totalAmount,
    };
    setBanquetSales(prev => [...prev, newSale].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    alert('Banquet sale recorded successfully.');
  }, []);

  const deleteBanquetSale = useCallback((saleId: string) => {
    setBanquetSales(prev => prev.filter(s => s.id !== saleId));
    alert('Banquet sale deleted.');
  }, []);

  const adjustStock = useCallback((productId: number, newQuantity: number) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
    alert('Stock quantity updated successfully.');
  }, []);

  // --- GST and Charges Handlers ---

  const addTaxRate = useCallback((tax: Omit<TaxRate, 'id'>) => {
    setTaxRates(prev => [...prev, { ...tax, id: Date.now() }]);
  }, []);

  const deleteTaxRate = useCallback((id: number) => {
    setTaxRates(prev => prev.filter(t => t.id !== id));
  }, []);

  const addAdditionalCharge = useCallback((charge: Omit<AdditionalCharge, 'id'>) => {
    setAdditionalCharges(prev => [...prev, { ...charge, id: Date.now() }]);
  }, []);

  const updateAdditionalCharge = useCallback((updatedCharge: AdditionalCharge) => {
    setAdditionalCharges(prev => prev.map(c => c.id === updatedCharge.id ? updatedCharge : c));
  }, []);

  const deleteAdditionalCharge = useCallback((id: number) => {
    setAdditionalCharges(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateBillingPreferences = useCallback((prefs: Partial<BillingPreferences>) => {
    setBillingPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  const factoryReset = useCallback(() => {
    // 1. Clear Transactional Data
    setPurchases([]);
    setOutwards([]);
    setVendorPayments([]);
    setDailySales([]);
    setBanquetSales([]);

    // 2. Reset Stock Levels (Keep Master Data)
    setProducts(prevProducts => 
        prevProducts.map(product => ({
            ...product,
            quantity: 0,
            // We keep purchasePrice as it's part of the master definition, 
            // but the valuation effectively becomes 0 because quantity is 0.
        }))
    );

    // Note: We deliberately do NOT reset:
    // - Products (Master definitions)
    // - Categories
    // - Vendors
    // - Departments
    // - Company Details
    // - Tax Rates & Charges (Settings)
    
    // The localStorage will be automatically updated by the useEffect hook
  }, []);


  const value = {
    products,
    categories,
    vendors,
    warehouses: WAREHOUSES,
    departments,
    purchases,
    outwards,
    vendorPayments,
    companyDetails,
    dailySales,
    banquetSales,
    taxRates,
    additionalCharges,
    billingPreferences,
    addProduct,
    addMultipleProducts,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addVendor,
    updateVendor,
    deleteVendor,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    recordPurchase,
    updatePurchase,
    recordOutward,
    updateOutward,
    recordPayment,
    updateCompanyDetails,
    deletePurchase,
    deleteOutward,
    addDailySale,
    deleteDailySale,
    addBanquetSale,
    deleteBanquetSale,
    adjustStock,
    addTaxRate,
    deleteTaxRate,
    addAdditionalCharge,
    updateAdditionalCharge,
    deleteAdditionalCharge,
    updateBillingPreferences,
    factoryReset,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
