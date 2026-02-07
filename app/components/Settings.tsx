
import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { TrashIcon, PlusCircleIcon, AlertTriangleIcon } from './shared/Icons';
import Modal from './shared/Modal';
import ConfirmModal from './shared/ConfirmModal';
import { TaxRate, AdditionalCharge } from '../types';

const SettingsCard: React.FC<{ title: string; description: string; children: React.ReactNode; action?: React.ReactNode; borderColor?: string }> = ({ title, description, children, action, borderColor = 'border-gray-100' }) => (
    <div className={`bg-card p-6 rounded-lg shadow-md border ${borderColor}`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-xl font-bold text-text-primary">{title}</h3>
                <p className="text-text-secondary mt-1 text-sm">{description}</p>
            </div>
            {action && <div>{action}</div>}
        </div>
        <div>{children}</div>
    </div>
);

const commonInputStyle = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary block w-full p-2.5 transition-colors";

// --- Sub-Components for General Settings ---

const ManageCompanyDetails: React.FC = () => {
    const { companyDetails, updateCompanyDetails } = useInventory();
    const [details, setDetails] = useState(companyDetails);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateCompanyDetails(details);
        alert("Company details updated successfully!");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" name="name" id="name" value={details.name} onChange={handleChange} required className={`${commonInputStyle} mt-1`} />
            </div>
             <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" name="address" id="address" value={details.address} onChange={handleChange} required className={`${commonInputStyle} mt-1`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="gstin" className="block text-sm font-medium text-gray-700">GSTIN</label>
                    <input type="text" name="gstin" id="gstin" value={details.gstin} onChange={handleChange} required className={`${commonInputStyle} mt-1`} />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="email" value={details.email} onChange={handleChange} required className={`${commonInputStyle} mt-1`} />
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm">Save Changes</button>
            </div>
        </form>
    );
}

const ManageVendors: React.FC = () => {
    const { vendors, addVendor, deleteVendor } = useInventory();
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addVendor({ name, contact });
        alert(`Vendor ${name} added.`);
        setName('');
        setContact('');
    }
    
    const handleDelete = (vendorId: number, vendorName: string) => {
        if(window.confirm(`Are you sure you want to delete vendor: ${vendorName}?`)){
            deleteVendor(vendorId);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-end">
                <div className="flex-grow">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Global Foods Inc." required className={commonInputStyle} />
                </div>
                <div className="flex-grow">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Contact/Email</label>
                    <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="e.g., john@globalfoods.com" required className={commonInputStyle} />
                </div>
                <button type="submit" className="bg-secondary text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 mb-[1px]">Add</button>
            </form>
            <div className="border rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200 max-h-40 overflow-y-auto bg-white">
                    {vendors.map(v => (
                        <li key={v.id} className="text-sm p-3 hover:bg-gray-50 flex justify-between items-center transition-colors">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{v.name}</span>
                                <span className="text-xs text-gray-500">{v.contact}</span>
                            </div>
                            <button onClick={() => handleDelete(v.id, v.name)} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

const ManageDepartments: React.FC = () => {
    const { departments, addDepartment } = useInventory();
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addDepartment({ name });
        alert(`Department ${name} added.`);
        setName('');
    }
    return (
        <div>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Kitchen" required className={`flex-grow ${commonInputStyle}`} />
                <button type="submit" className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">Add</button>
            </form>
             <ul className="space-y-2 max-h-40 overflow-y-auto">
                {departments.map(d => <li key={d.id} className="text-sm p-2.5 bg-gray-50 border border-gray-100 rounded-md text-gray-700">{d.name}</li>)}
            </ul>
        </div>
    );
}

// --- Sub-Components for Billing & Tax Settings ---

const GSTSettings: React.FC = () => {
    const { taxRates, addTaxRate, deleteTaxRate } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTax, setNewTax] = useState({ name: '', rate: '', type: 'CGST_SGST' });

    const handleAddTax = (e: React.FormEvent) => {
        e.preventDefault();
        addTaxRate({
            name: newTax.name,
            rate: Number(newTax.rate),
            type: newTax.type as 'CGST_SGST' | 'IGST' | 'NONE'
        });
        setIsModalOpen(false);
        setNewTax({ name: '', rate: '', type: 'CGST_SGST' });
    };

    return (
        <>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Tax Name</th>
                            <th className="px-6 py-3 text-center">Rate (%)</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {taxRates.map((tax) => (
                            <tr key={tax.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{tax.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{tax.rate}%</span>
                                </td>
                                <td className="px-6 py-4">
                                    {tax.type === 'CGST_SGST' ? 'CGST + SGST' : tax.type}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => deleteTaxRate(tax.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-4">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center text-sm font-medium text-primary hover:text-primary-dark">
                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                    Add New Tax Slab
                </button>
            </div>

            <Modal title="Add Tax Slab" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleAddTax} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
                        <input type="text" value={newTax.name} onChange={e => setNewTax({...newTax, name: e.target.value})} placeholder="e.g. GST 18%" required className={commonInputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
                            <input type="number" value={newTax.rate} onChange={e => setNewTax({...newTax, rate: e.target.value})} placeholder="18" required className={commonInputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
                            <select value={newTax.type} onChange={e => setNewTax({...newTax, type: e.target.value})} className={commonInputStyle}>
                                <option value="CGST_SGST">CGST + SGST</option>
                                <option value="IGST">IGST</option>
                                <option value="NONE">No Tax</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

const ChargesSettings: React.FC = () => {
    const { additionalCharges, addAdditionalCharge, deleteAdditionalCharge, updateAdditionalCharge } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCharge, setNewCharge] = useState({ name: '', value: '', type: 'FIXED' });

    const handleAddCharge = (e: React.FormEvent) => {
        e.preventDefault();
        addAdditionalCharge({
            name: newCharge.name,
            value: Number(newCharge.value),
            type: newCharge.type as 'FIXED' | 'PERCENTAGE',
            isApplied: true
        });
        setIsModalOpen(false);
        setNewCharge({ name: '', value: '', type: 'FIXED' });
    };

    const toggleCharge = (charge: AdditionalCharge) => {
        updateAdditionalCharge({ ...charge, isApplied: !charge.isApplied });
    };

    return (
        <>
            <div className="space-y-3">
                {additionalCharges.map(charge => (
                    <div key={charge.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div 
                                onClick={() => toggleCharge(charge)}
                                className={`w-10 h-6 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer duration-300 ease-in-out ${charge.isApplied ? 'bg-green-500' : ''}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${charge.isApplied ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <div>
                                <p className={`font-medium ${charge.isApplied ? 'text-gray-900' : 'text-gray-400'}`}>{charge.name}</p>
                                <p className="text-xs text-gray-500">
                                    {charge.type === 'PERCENTAGE' ? `${charge.value}% on Subtotal` : `₹${charge.value} Fixed Amount`}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => deleteAdditionalCharge(charge.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                
                {additionalCharges.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">No additional charges configured.</p>
                )}
            </div>

            <div className="mt-4">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center text-sm font-medium text-primary hover:text-primary-dark">
                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                    Add Extra Charge
                </button>
            </div>

            <Modal title="Add Extra Charge" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleAddCharge} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Charge Name</label>
                        <input type="text" value={newCharge.name} onChange={e => setNewCharge({...newCharge, name: e.target.value})} placeholder="e.g. Packing Charges" required className={commonInputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount / Rate</label>
                            <input type="number" value={newCharge.value} onChange={e => setNewCharge({...newCharge, value: e.target.value})} placeholder="20" required className={commonInputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type</label>
                            <select value={newCharge.type} onChange={e => setNewCharge({...newCharge, type: e.target.value})} className={commonInputStyle}>
                                <option value="FIXED">Fixed Amount (₹)</option>
                                <option value="PERCENTAGE">Percentage (%)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

const BillingPreferences: React.FC = () => {
    const { billingPreferences, updateBillingPreferences } = useInventory();

    const ToggleRow = ({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: () => void }) => (
        <div className="flex items-center justify-between p-3">
            <div>
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
            <div 
                onClick={onChange}
                className={`w-11 h-6 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer duration-300 ease-in-out ${checked ? 'bg-primary' : ''}`}
            >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? 'translate-x-5' : ''}`}></div>
            </div>
        </div>
    );

    return (
        <div className="divide-y divide-gray-100">
            <ToggleRow 
                label="Round Off Total" 
                description="Automatically round off the final invoice amount to the nearest whole number."
                checked={billingPreferences.roundOff}
                onChange={() => updateBillingPreferences({ roundOff: !billingPreferences.roundOff })}
            />
            <ToggleRow 
                label="Tax Inclusive Billing" 
                description="If enabled, product prices entered are considered to include GST."
                checked={billingPreferences.isInclusiveTax}
                onChange={() => updateBillingPreferences({ isInclusiveTax: !billingPreferences.isInclusiveTax })}
            />
        </div>
    );
}

const SystemManagement: React.FC = () => {
    const { factoryReset } = useInventory();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleReset = () => {
        factoryReset();
        alert('System successfully restored to factory defaults.');
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-red-800">Factory Reset / Restore Database</h4>
                        <p className="text-sm text-red-700 mt-1">
                            This action will <strong>permanently delete</strong> all transactional data including:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                            <li>All Purchase Orders & Invoices</li>
                            <li>All Stock Movements (Inward/Outward)</li>
                            <li>All Sales Records & Logs</li>
                            <li>All Payment History</li>
                        </ul>
                        <p className="text-sm text-red-700 mt-2 font-semibold">
                            Master data (Products, Vendors, Categories, Settings) will be preserved, but stock levels will be reset to zero.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button 
                        onClick={() => setIsConfirmOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2"
                    >
                        <TrashIcon className="w-5 h-5" />
                        Restore Database
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleReset}
                title="Confirm Factory Reset"
                message="Are you absolutely sure you want to restore the database? This action CANNOT be undone and all your transactional data will be lost."
                confirmButtonText="Yes, Restore Database"
            />
        </>
    );
};

// --- Main Settings Component ---

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'system'>('general');

    const TabButton = ({ id, label }: { id: 'general' | 'billing' | 'system', label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`pb-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
                <h2 className="text-3xl font-bold text-text-primary">Settings</h2>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 flex space-x-2 overflow-x-auto">
                <TabButton id="general" label="General Settings" />
                <TabButton id="billing" label="GST & Charges" />
                <TabButton id="system" label="System Management" />
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="space-y-8">
                            <SettingsCard title="Company Details" description="Manage your company's information for invoices and reports.">
                                <ManageCompanyDetails />
                            </SettingsCard>
                            <SettingsCard title="UI Customization" description="Upload custom icons or logos for the application.">
                                <div>
                                    <label htmlFor="file-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors inline-block text-sm border border-gray-300">
                                        Upload Custom Buttons
                                    </label>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                    <p className="text-xs text-gray-500 mt-2">This is a placeholder for future functionality.</p>
                                </div>
                            </SettingsCard>
                        </div>
                        <div className="space-y-8">
                            <SettingsCard title="Manage Vendors" description="Add, view, or delete company vendors.">
                                <ManageVendors />
                            </SettingsCard>
                            <SettingsCard title="Manage Departments" description="Add or view internal departments for stock issuance.">
                                <ManageDepartments />
                            </SettingsCard>
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="space-y-8">
                            <SettingsCard title="GST Configuration" description="Define GST tax slabs applicable to your products.">
                                <GSTSettings />
                            </SettingsCard>
                            <SettingsCard title="Billing Preferences" description="Configure global billing behavior.">
                                <BillingPreferences />
                            </SettingsCard>
                        </div>
                        <div className="space-y-8">
                            <SettingsCard title="Additional Charges" description="Enable extra charges like Packing, Delivery, etc.">
                                <ChargesSettings />
                            </SettingsCard>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="max-w-3xl mx-auto">
                        <SettingsCard title="System Management" description="Danger Zone: Manage critical system data and resets." borderColor="border-red-200">
                            <SystemManagement />
                        </SettingsCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
