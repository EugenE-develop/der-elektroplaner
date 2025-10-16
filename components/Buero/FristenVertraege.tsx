import React, { FC, useState, useMemo, ChangeEvent, useEffect } from 'react';
import { Contract, ContractCategory, ContractStatus, User } from '../../types';
import { useOfficeData, useOfficeMutations } from '../../hooks/useOfficeData';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../supabaseClient';
import './FristenVertraege.css';

interface FristenVertraegeProps {
    currentUser: User;
    users: User[];
}

const CONTRACT_CATEGORIES: ContractCategory[] = ['Mietvertrag', 'Softwarelizenz', 'Versicherung', 'Wartungsvertrag', 'Sonstiges'];
const CONTRACT_STATUSES: ContractStatus[] = ['Aktiv', 'Gekündigt', 'Abgelaufen'];

// Contract Modal Component
const ContractModal: FC<{
    contract?: Partial<Contract> | null;
    onClose: () => void;
    onSave: (data: Partial<Contract>, file?: File) => void;
    users: User[];
    isSaving: boolean;
}> = ({ contract, onClose, onSave, users, isSaving }) => {
    const [data, setData] = useState<Partial<Contract>>(contract || { status: 'Aktiv', category: 'Sonstiges', start_date: new Date().toISOString().split('T')[0] });
    const [file, setFile] = useState<File | undefined>();
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition text-sm";

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data, file);
    };
    
    useEffect(() => {
        if (data.end_date && data.notice_period_days) {
            const endDate = new Date(data.end_date);
            endDate.setDate(endDate.getDate() - data.notice_period_days);
            setData(prev => ({...prev, termination_date: endDate.toISOString().split('T')[0]}));
        }
    }, [data.end_date, data.notice_period_days]);

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                    <h3 className="text-xl font-semibold">{contract?.id ? 'Vertrag bearbeiten' : 'Neuen Vertrag anlegen'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Vertragsname*</label><input name="contract_name" value={data.contract_name || ''} onChange={handleChange} className={commonInputClasses} required /></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Vertragspartner*</label><input name="contract_partner" value={data.contract_partner || ''} onChange={handleChange} className={commonInputClasses} required /></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Kategorie</label><select name="category" value={data.category} onChange={handleChange} className={commonInputClasses}>{CONTRACT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Status</label><select name="status" value={data.status} onChange={handleChange} className={commonInputClasses}>{CONTRACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Beginn*</label><input type="date" name="start_date" value={data.start_date?.split('T')[0]} onChange={handleChange} className={commonInputClasses} required /></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Ende (leer lassen für unbefristet)</label><input type="date" name="end_date" value={data.end_date?.split('T')[0] || ''} onChange={handleChange} className={commonInputClasses} /></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Kündigungsfrist (in Tagen)</label><input type="number" name="notice_period_days" value={data.notice_period_days || ''} onChange={handleChange} className={commonInputClasses} /></div>
                        <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Kündigungsdatum (automatisch berechnet)</label><input type="date" name="termination_date" value={data.termination_date?.split('T')[0] || ''} readOnly className={`${commonInputClasses} bg-secondary`} /></div>
                    </div>
                     <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Verantwortlicher Mitarbeiter</label><select name="responsible_user_id" value={data.responsible_user_id || ''} onChange={handleChange} className={commonInputClasses}><option value="">Niemand</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                     <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Notizen</label><textarea name="notes" value={data.notes || ''} onChange={handleChange} rows={2} className={commonInputClasses}></textarea></div>
                     <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Vertragsdokument</label><input type="file" onChange={e => setFile(e.target.files?.[0])} className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" /></div>

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
const FristenVertraege: FC<FristenVertraegeProps> = ({ currentUser, users }) => {
    const { data: officeData, isLoading, isError } = useOfficeData();
    const { createContractMutation, updateContractMutation, deleteContractMutation } = useOfficeMutations();
    const contracts = officeData?.contracts || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Partial<Contract> | null>(null);

    const isManager = useMemo(() => ['Admin', 'Geschäftsführung', 'Leitung', 'Büro'].includes(currentUser.role), [currentUser.role]);
    
    const handleSave = (data: Partial<Contract>, file?: File) => {
        if (data.id) {
            updateContractMutation.mutate({ updateData: data as Partial<Contract> & {id: string}, file, userId: currentUser.id }, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            createContractMutation.mutate({ newData: data, file, userId: currentUser.id }, {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };
    
    const handleDelete = (contract: Contract) => {
        if (window.confirm(`Soll der Vertrag "${contract.contract_name}" wirklich gelöscht werden?`)) {
            deleteContractMutation.mutate(contract);
        }
    };

    const isMutating = createContractMutation.isPending || updateContractMutation.isPending || deleteContractMutation.isPending;

    return (
        <div className="space-y-8">
            {isModalOpen && <ContractModal contract={editingContract} onClose={() => setIsModalOpen(false)} onSave={handleSave} users={users} isSaving={isMutating} />}
            <div>
                <h2 className="text-2xl font-semibold text-text">Fristen & Verträge</h2>
                <p className="text-text-light">Verwalten Sie hier alle laufenden Verträge und deren Fristen.</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Vertragsliste</h3>
                    {isManager && <button onClick={() => { setEditingContract(null); setIsModalOpen(true); }} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">+ Neuer Vertrag</button>}
                </div>

                {isLoading ? <p>Lade Verträge...</p> : isError ? <p className="text-danger">Fehler beim Laden der Verträge.</p> :
                 <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50"><tr>
                            <th className="p-3 font-semibold">Vertrag</th><th className="p-3 font-semibold">Partner</th><th className="p-3 font-semibold">Kategorie</th><th className="p-3 font-semibold">Kündigungsdatum</th><th className="p-3 font-semibold">Status</th>{isManager && <th className="p-3 font-semibold">Aktionen</th>}
                        </tr></thead>
                        <tbody className="divide-y divide-border">
                            {contracts.map(contract => (
                                <tr key={contract.id} className="hover:bg-secondary-hover">
                                    <td className="p-3 font-medium">{contract.contract_name}</td>
                                    <td className="p-3">{contract.contract_partner}</td>
                                    <td className="p-3">{contract.category}</td>
                                    <td className="p-3">{contract.termination_date ? new Date(contract.termination_date).toLocaleDateString('de-DE') : '-'}</td>
                                    <td className="p-3">{contract.status}</td>
                                    {isManager && <td className="p-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingContract(contract); setIsModalOpen(true); }} className="text-primary hover:underline text-xs">Bearbeiten</button>
                                            <button onClick={() => handleDelete(contract)} className="text-danger hover:underline text-xs">Löschen</button>
                                        </div>
                                    </td>}
                                </tr>
                            ))}
                            {contracts.length === 0 && <tr><td colSpan={isManager ? 6 : 5} className="p-6 text-center text-text-light">Keine Verträge vorhanden.</td></tr>}
                        </tbody>
                    </table>
                 </div>
                }
            </div>
        </div>
    );
};

export default FristenVertraege;