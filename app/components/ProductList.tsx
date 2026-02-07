
import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import Modal from './shared/Modal';
import BarcodeScanner from './shared/BarcodeScanner';
import { BarcodeIcon } from './shared/Icons';
import type { Product } from '../types';

const commonInputStyle = "bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary block w-full p-2.5";

const EditProductForm: React.FC<{ product: Product; onClose: () => void; }> = ({ product, onClose }) => {
    const { updateProduct, categories, vendors, warehouses } = useInventory();
    const [formData, setFormData] = useState(product);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['purchasePrice', 'gstRate', 'quantity', 'reorderLevel', 'categoryId', 'vendorId', 'warehouseId'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProduct(formData);
        alert("Product updated successfully!");
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                    <label className="text-sm font-medium text-gray-700">Product Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">HSN</label>
                    <input type="text" name="hsn" value={formData.hsn} onChange={handleChange} required className={commonInputStyle} />
                 </div>
             </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Barcode</label>
                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="e.g., 8901234567890" className={commonInputStyle} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                    <label className="text-sm font-medium text-gray-700">Unit</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g., kg, L, pcs" required className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">Reorder Level</label>
                    <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} min="0" required className={commonInputStyle} />
                 </div>
             </div>
             <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} required className={commonInputStyle}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-gray-700">Purchase Price</label>
                    <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} min="0" step="0.01" required className={commonInputStyle} />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">GST Rate (%)</label>
                    <input type="number" name="gstRate" value={formData.gstRate} onChange={handleChange} min="0" step="0.01" required className={commonInputStyle} />
                </div>
             </div>
             
             <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Save Changes</button>
            </div>
        </form>
    );
};

export const AddItemForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addProduct, categories, vendors } = useInventory();
    const [formData, setFormData] = useState({
        name: '',
        hsn: '',
        barcode: '',
        unit: '',
        categoryId: '',
        vendorId: '',
        purchasePrice: '',
        gstRate: '',
        quantity: '',
        reorderLevel: '10'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert("Product Name is required.");
            return;
        }
        // FIX: Added openingQuantity property which is required by the Product interface and its Omit counterpart.
        addProduct({
            name: formData.name,
            hsn: formData.hsn,
            barcode: formData.barcode,
            unit: formData.unit,
            categoryId: Number(formData.categoryId) || 0,
            vendorId: Number(formData.vendorId) || 0,
            warehouseId: 1,
            purchasePrice: Number(formData.purchasePrice) || 0,
            gstRate: Number(formData.gstRate) || 0,
            quantity: Number(formData.quantity) || 0,
            openingQuantity: Number(formData.quantity) || 0,
            reorderLevel: Number(formData.reorderLevel) || 0
        });
        alert("Product added successfully!");
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                    <label className="text-sm font-medium text-gray-700">Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">HSN</label>
                    <input type="text" name="hsn" value={formData.hsn} onChange={handleChange} className={commonInputStyle} />
                 </div>
             </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Barcode</label>
                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="e.g., 8901234567890" className={commonInputStyle} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                    <label className="text-sm font-medium text-gray-700">Unit *</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g., kg, L, pcs" required className={commonInputStyle} />
                 </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">Reorder Level</label>
                    <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} min="0" className={commonInputStyle} />
                 </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-gray-700">Category *</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} required className={commonInputStyle}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">Vendor</label>
                    <select name="vendorId" value={formData.vendorId} onChange={handleChange} className={commonInputStyle}>
                        <option value="">Select Vendor (Optional)</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-gray-700">Purchase Price</label>
                    <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} min="0" step="0.01" className={commonInputStyle} />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">GST Rate (%)</label>
                    <input type="number" name="gstRate" value={formData.gstRate} onChange={handleChange} min="0" step="0.01" className={commonInputStyle} />
                </div>
             </div>
             <div>
                <label className="text-sm font-medium text-gray-700">Opening Stock</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" className={commonInputStyle} />
             </div>
             
             <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Add Product</button>
            </div>
        </form>
    );
};

const ProductList: React.FC = () => {
    const { products, categories, vendors } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    
    const formatNumber = (num: number) => num.toFixed(2);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const lowercasedTerm = searchTerm.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(lowercasedTerm) || 
                                  product.hsn.toLowerCase().includes(lowercasedTerm) ||
                                  (product.barcode && product.barcode.includes(lowercasedTerm));
            const matchesCategory = categoryFilter ? product.categoryId.toString() === categoryFilter : true;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, categoryFilter]);
    
    const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'N/A';
    const getVendorName = (id: number) => vendors.find(v => v.id === id)?.name || 'N/A';

    const handleScanSuccess = (scannedCode: string) => {
        setSearchTerm(scannedCode);
        setIsScannerOpen(false);
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-text-primary">Product Catalog</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                         <input
                            type="text"
                            placeholder="Search by name, HSN, barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                         <button onClick={() => setIsScannerOpen(true)} className="p-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors" aria-label="Scan barcode">
                            <BarcodeIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Product Name</th>
                            <th scope="col" className="px-6 py-3">HSN</th>
                            <th scope="col" className="px-6 py-3">Barcode</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3 text-right">Stock Qty</th>
                            <th scope="col" className="px-6 py-3 text-right">Purchase Price</th>
                            <th scope="col" className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{product.name}</th>
                                <td className="px-6 py-4">{product.hsn}</td>
                                <td className="px-6 py-4">{product.barcode || 'N/A'}</td>
                                <td className="px-6 py-4">{getCategoryName(product.categoryId)}</td>
                                <td className={`px-6 py-4 text-right font-bold ${product.quantity <= product.reorderLevel ? 'text-red-500' : 'text-green-600'}`}>
                                    {product.quantity} {product.unit}
                                </td>
                                <td className="px-6 py-4 text-right">{formatNumber(product.purchasePrice)}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                      onClick={() => { setSelectedProduct(product); setIsEditModalOpen(true); }} 
                                      className="font-medium text-primary hover:underline"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProducts.length === 0 && <p className="text-center py-8 text-text-secondary">No products found.</p>}
            </div>

            {isScannerOpen && (
                <Modal title="Scan Barcode" isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)}>
                    <BarcodeScanner onScan={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
                </Modal>
            )}

            {selectedProduct && (
                <Modal title="Edit Product" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                    <EditProductForm product={selectedProduct} onClose={() => { setIsEditModalOpen(false); setSelectedProduct(null); }} />
                </Modal>
            )}
        </div>
    );
};

export default ProductList;