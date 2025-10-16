import React, { FC, useState, useMemo, ChangeEvent } from 'react';
import { InventoryItem, InventoryCategory, InventoryStatus, User } from '../../types';
import { useOfficeData, useOfficeMutations } from '../../hooks/useOfficeData';

interface InventarverwaltungProps {
    currentUser: User;
    users: User[];
}

const ITEM_CATEGORIES: InventoryCategory[] = ['Computer', 'Monitor', 'Softwarelizenz', 'Firmenfahrzeug', 'Sonstiges'];
const ITEM_STATUSES: InventoryStatus[] = ['Im Lager', 'In Benutzung', 'Defekt', 'Ausgemustert'];

// Item Modal Component
const InventoryItemModal: FC<{
    item?: Partial<InventoryItem> | null;
    onClose: () => void;
    onSave: (data: Partial<InventoryItem>) => void;
    users: User[];
    isSaving: boolean;
}> = ({ item, onClose, onSave, users, isSaving }) => {
    const [data, setData] = useState<Partial<InventoryItem>>(item || { status: 'Im Lager', category: 'Sonstiges' });
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition text-sm";

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                    <h3 className="text-xl font-semibold">{item?.id ? 'Inventar bearbeiten' : 'Neues Inventar anlegen'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Bezeichnung*</label><input name="item_name" value={data.item_name || ''} onChange={handleChange} className={commonInputClasses} required /></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Inventarnummer</label><input name="inventory_number" value={data.inventory_number || ''} onChange={handleChange} className={commonInputClasses} /></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Kategorie</label><select name="category" value={data.category} onChange={handleChange} className={commonInputClasses}>{ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Status</label><select name="status" value={data.status} onChange={handleChange} className={commonInputClasses}>{ITEM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Anschaffungsdatum</label><input type="date" name="purchase_date" value={data.purchase_date?.split('T')[0] || ''} onChange={handleChange} className={commonInputClasses} /></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Anschaffungspreis (€)</label><input type="number" step="0.01" name="purchase_price" value={data.purchase_price || ''} onChange={handleChange} className={commonInputClasses} /></div>
                        <div className="flex flex-col md:col-span-2"><label className="text-xs font-medium text-text-light mb-1">Zugewiesen an</label><select name="assigned_to_user_id" value={data.assigned_to_user_id || ''} onChange={handleChange} className={commonInputClasses}><option value="">Niemand (im Lager)</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    </div>
                    <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Beschreibung</label><textarea name="description" value={data.description || ''} onChange={handleChange} rows={2} className={commonInputClasses}></textarea></div>
                    <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Notizen</label><textarea name="notes" value={data.notes || ''} onChange={handleChange} rows={2} className={commonInputClasses}></textarea></div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-border mt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 font-medium rounded-md bg-secondary text-text border">Abbrechen</button>
                        <button type="submit" disabled={isSaving} className="py-2 px-4 font-medium rounded-md bg-primary text-white disabled:opacity-50">{isSaving ? 'Speichert...' : 'Speichern'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Component
const Inventarverwaltung: FC<InventarverwaltungProps> = ({ users, currentUser }) => {
    const { data: officeData, isLoading, isError } = useOfficeData();
    const { createInventoryItemMutation, updateInventoryItemMutation, deleteInventoryItemMutation } = useOfficeMutations();
    const inventoryItems = officeData?.inventoryItems || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);

    const getUserName = (id: string | null | undefined) => users.find(u => u.id === id)?.name || '-';
    const isManager = useMemo(() => ['Admin', 'Geschäftsführung', 'Leitung', 'Büro'].includes(currentUser.role), [currentUser.role]);

    const handleSave = (data: Partial<InventoryItem>) => {
        if (data.id) {
            updateInventoryItemMutation.mutate(data as Partial<InventoryItem> & { id: string }, {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            createInventoryItemMutation.mutate(data, {
                onSuccess: () => setIsModalOpen(false)
            });
        }
        setEditingItem(null);
    };

    const handleDelete = (item: InventoryItem) => {
        if (window.confirm(`Soll "${item.item_name}" wirklich aus dem Inventar gelöscht werden?`)) {
            deleteInventoryItemMutation.mutate(item.id);
        }
    };
    
    const isMutating = createInventoryItemMutation.isPending || updateInventoryItemMutation.isPending || deleteInventoryItemMutation.isPending;

    return (
        <div className="space-y-8">
            {isModalOpen && <InventoryItemModal item={editingItem} onClose={() => setIsModalOpen(false)} onSave={handleSave} users={users} isSaving={isMutating} />}
            <div>
                <h2 className="text-2xl font-semibold text-text">Inventarverwaltung</h2>
                <p className="text-text-light">Verwalten Sie das gesamte Inventar des Büros.</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Inventarliste</h3>
                    {isManager && <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">+ Neues Inventar</button>}
                </div>
                {isLoading ? <p>Lade Inventar...</p> : isError ? <p className="text-danger">Fehler beim Laden des Inventars.</p> :
                <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-3 font-semibold">Bezeichnung</th>
                                <th className="p-3 font-semibold">Inventar-Nr.</th>
                                <th className="p-3 font-semibold">Kategorie</th>
                                <th className="p-3 font-semibold">Zugewiesen an</th>
                                <th className="p-3 font-semibold">Status</th>
                                {isManager && <th className="p-3 font-semibold">Aktionen</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {inventoryItems.map(item => (
                                <tr key={item.id} className="hover:bg-secondary-hover">
                                    <td className="p-3 font-medium">{item.item_name}</td>
                                    <td className="p-3">{item.inventory_number || '-'}</td>
                                    <td className="p-3">{item.category}</td>
                                    <td className="p-3">{getUserName(item.assigned_to_user_id)}</td>
                                    <td className="p-3">{item.status}</td>
                                    {isManager && (
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-primary hover:underline text-xs">Bearbeiten</button>
                                                <button onClick={() => handleDelete(item)} className="text-danger hover:underline text-xs">Löschen</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {inventoryItems.length === 0 && <tr><td colSpan={isManager ? 6 : 5} className="p-6 text-center text-text-light">Kein Inventar vorhanden.</td></tr>}
                        </tbody>
                    </table>
                </div>}
            </div>
        </div>
    );
};

export default Inventarverwaltung;