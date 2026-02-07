
import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { Product } from '../types';

const commonInputStyle = "bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary block w-full p-2.5";

const AddProduct: React.FC = () => {
    const { addProduct, addMultipleProducts, categories, vendors, warehouses } = useInventory();
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [quantity, setQuantity] = useState<number | string>('');
    const [categoryId, setCategoryId] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [warehouseId, setWarehouseId] = useState('1');
    const [purchasePrice, setPurchasePrice] = useState<number | string>('');
    const [reorderLevel, setReorderLevel] = useState<number | string>(10);
    const [gstRate, setGstRate] = useState<number | string>('');

    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setName('');
        setUnit('');
        setQuantity('');
        setCategoryId('');
        setVendorId('');
        setWarehouseId('1');
        setPurchasePrice('');
        setReorderLevel(10);
        setGstRate('');
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim()) {
            alert("Product Name is required.");
            return;
        }
        // FIX: Changed openingQuantity to initialQuantity to match Omit<Product, 'id' | 'initialQuantity' | 'quantity'> & { initialQuantity: number }
        addProduct({ 
            name, 
            unit, 
            categoryId: parseInt(categoryId) || 0, 
            vendorId: parseInt(vendorId) || 0, 
            warehouseId: parseInt(warehouseId) || 0, 
            purchasePrice: Number(purchasePrice), 
            initialQuantity: Number(quantity), 
            reorderLevel: Number(reorderLevel), 
            gstRate: Number(gstRate) 
        });
        alert(`Product "${name}" has been added successfully!`);
        resetForm();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImportFile(e.target.files[0]);
        }
    };

    const handleImport = () => {
        if (!importFile) {
            alert("Please select a CSV file to import.");
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                parseAndImportCSV(text);
            }
            setIsImporting(false);
            setImportFile(null);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };
        reader.onerror = () => {
            alert("Error reading file.");
            setIsImporting(false);
        };
        reader.readAsText(importFile);
    };

    const parseAndImportCSV = (csvText: string) => {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            alert("CSV file is empty or contains only a header.");
            return;
        }

        const header = lines[0].split(',').map(h => h.trim());
        if (!header.includes('name')) {
            alert(`CSV is missing required header: name`);
            return;
        }

        const productsToImport: (Omit<Product, 'id' | 'initialQuantity' | 'quantity'> & { initialQuantity: number })[] = [];
        let errors = 0;

        for (let i = 1; i < lines.length; i++) {
            const data = lines[i].split(',');
            const row: any = {};
            header.forEach((h, index) => {
                row[h] = data[index] ? data[index].trim() : '';
            });

            if (!row.name) {
                console.warn(`Skipping row ${i + 1} due to missing required name.`);
                errors++;
                continue;
            }

            try {
                const qty = parseFloat(row.quantity) || 0;
                // FIX: Changed openingQuantity to initialQuantity
                const product: Omit<Product, 'id' | 'initialQuantity' | 'quantity'> & { initialQuantity: number } = {
                    name: String(row.name),
                    unit: String(row.unit || ''),
                    initialQuantity: qty,
                    categoryId: parseInt(row.categoryId, 10) || 0,
                    vendorId: parseInt(row.vendorId, 10) || 0,
                    warehouseId: parseInt(row.warehouseId, 10) || 1, 
                    purchasePrice: parseFloat(row.purchasePrice) || 0,
                    reorderLevel: parseFloat(row.reorderLevel) || 10,
                    gstRate: parseFloat(row.gstRate) || 0,
                };
                productsToImport.push(product);
            } catch (e) {
                console.warn(`Skipping row ${i + 1} due to parsing error.`);
                errors++;
            }
        }

        if (productsToImport.length > 0) {
            addMultipleProducts(productsToImport);
        }
        
        let message = '';
        if (productsToImport.length > 0) {
            message += `${productsToImport.length} products successfully imported. `;
        }
        if (errors > 0) {
            message += `${errors} rows were skipped due to errors.`;
        }
        if (message) {
            alert(message);
        }
    };

    return (
         <div className="bg-card p-6 rounded-lg shadow-md max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Add New Product</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">Product Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Organic Milk" required className={commonInputStyle} />
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Unit of Measurement</label>
                        <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g., kg, L, pcs" className={commonInputStyle} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Opening Quantity</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g., 100" min="0" className={commonInputStyle} />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={commonInputStyle}>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="text-sm font-medium text-gray-700">Default Vendor</label>
                        <select value={vendorId} onChange={e => setVendorId(e.target.value)} className={commonInputStyle}>
                            <option value="">Select Vendor</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Purchase Price</label>
                        <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="e.g., 2.50" min="0" step="0.01" className={commonInputStyle} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Reorder Level</label>
                        <input type="number" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} placeholder="e.g., 20" min="0" className={commonInputStyle} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">GST Rate (%)</label>
                        <input type="number" value={gstRate} onChange={e => setGstRate(e.target.value)} placeholder="e.g., 5" min="0" step="0.01" className={commonInputStyle} />
                    </div>
                 </div>

                 <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={resetForm} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">Clear</button>
                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg">Add Product</button>
                </div>
            </form>

            <div className="flex items-center my-8">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 font-semibold">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-text-primary mb-4">Import Products from CSV</h3>
                <div className="border border-dashed border-gray-300 p-4 rounded-lg space-y-4">
                    <div>
                        <label htmlFor="csv-import" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/80 file:text-white hover:file:bg-primary">Select CSV File</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            id="csv-import"
                            accept=".csv, text/csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                    <button
                        onClick={handleImport}
                        disabled={!importFile || isImporting}
                        className="w-full bg-secondary hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isImporting ? 'Importing...' : 'Import Products from File'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
