import React, { FC, useState, useEffect, useMemo } from 'react';
import { Project, Contact, Offer, Order, Invoice, FinanceItem, OfferStatus, OrderStatus, InvoiceStatus, InvoiceType, SupplierInvoice, SupplierInvoiceStatus, TimeEntry, User } from '../../types';
import { formatCurrency } from '../../utils';
import { v4 as uuidv4 } from 'uuid';
import { KOSTENGRUPPEN_DATA, initialLeistungsphasen } from '../../constants';
import TimeEntryImportModal from './TimeEntryImportModal';

type DocType = 'offer' | 'order' | 'invoice' | 'supplierInvoice';
type DocData = Offer | Order | Invoice | SupplierInvoice;

interface FinanceDocumentModalProps {
    docType: DocType;
    initialData?: DocData | null;
    onClose: () => void;
    onSave: (docData: Omit<DocData, 'id'>, timeEntryIdsToBill?: number[]) => void;
    projects: Project[];
    contacts: Contact[];
    timeEntries: TimeEntry[];
    users: User[];
}

const getInitialData = (docType: DocType, projects: Project[]): Omit<DocData, 'id'> => {
    const common = {
        projectId: projects[0]?.id || '',
        items: [{ id: uuidv4(), description: '', quantity: 1, unit: 'Stk', unitPrice: 0, total: 0, kostengruppe: '' }],
        netAmount: 0,
        taxAmount: 0,
        grossAmount: 0,
    };
    if (docType === 'offer') {
        const offerData: Omit<Offer, 'id'> = {
            ...common,
            contactId: 0,
            date: new Date().toISOString().split('T')[0],
            offerNumber: '',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Entwurf' as OfferStatus,
        };
        return offerData;
    }
    if (docType === 'order') {
        const orderData: Omit<Order, 'id'> = {
            ...common,
            contactId: 0,
            date: new Date().toISOString().split('T')[0],
            orderNumber: '',
            offerId: '',
            status: 'In Bearbeitung' as OrderStatus,
        };
        return orderData;
    }
    if (docType === 'invoice') {
        const invoiceData: Omit<Invoice, 'id'> = {
            ...common,
            contactId: 0,
            date: new Date().toISOString().split('T')[0],
            invoiceNumber: '',
            orderId: '',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            performanceDate: new Date().toISOString().split('T')[0],
            status: 'Entwurf' as InvoiceStatus,
            type: 'Rechnung' as InvoiceType,
            amountPaid: 0,
        };
        return invoiceData;
    }
    // supplierInvoice
    const supplierInvoiceData: Omit<SupplierInvoice, 'id'> = {
        ...common,
        supplierContactId: 0,
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Entwurf' as SupplierInvoiceStatus,
        amountPaid: 0,
        createdAt: new Date().toISOString(),
    };
    return supplierInvoiceData;
};

const FinanceDocumentModal: FC<FinanceDocumentModalProps> = ({ docType, initialData, onClose, onSave, projects, contacts, timeEntries, users }) => {
    const [doc, setDoc] = useState(initialData || getInitialData(docType, projects));
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [timeEntryIdsToBill, setTimeEntryIdsToBill] = useState<Set<number>>(new Set());
    
    useEffect(() => {
        // FIX: Explicitly type accumulator in reduce to avoid type inference issues.
        const netAmount = doc.items.reduce((sum: number, item) => sum + (item.total || 0), 0);
        const taxRate = 0.19;
        const taxAmount = netAmount * taxRate;
        const grossAmount = netAmount + taxAmount;
        setDoc(prev => ({ ...prev, netAmount, taxAmount, grossAmount }));
    }, [doc.items]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDoc(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (itemId: string, field: keyof FinanceItem, value: string | number) => {
        setDoc(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'quantity' || field === 'unitPrice') {
                        updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0);
                    }
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    const addItem = () => {
        setDoc(prev => ({
            ...prev,
            items: [...prev.items, { id: uuidv4(), description: '', quantity: 1, unit: 'Stk', unitPrice: 0, total: 0 }]
        }));
    };
    
    const removeItem = (itemId: string) => {
        if (doc.items.length <= 1) return;
        setDoc(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
    };

    const handleImportTimeEntries = (entriesToImport: TimeEntry[]) => {
        const newItems: FinanceItem[] = [];
        const newBilledIds = new Set(timeEntryIdsToBill);

        // Group by user and service phase
        const grouped: Record<string, TimeEntry[]> = {};
        entriesToImport.forEach(entry => {
            const key = `${entry.user_id}-${entry.service_phase_id}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(entry);
            newBilledIds.add(entry.id);
        });

        for (const key in grouped) {
            const entries = grouped[key];
            const firstEntry = entries[0];
            const user = users.find(u => u.id === firstEntry.user_id);
            const phase = initialLeistungsphasen.find(lp => lp.id === firstEntry.service_phase_id);
            const totalHours = entries.reduce((sum, e) => sum + e.duration_hours, 0);

            newItems.push({
                id: uuidv4(),
                description: `Regieleistungen nach Aufwand - ${phase?.name || `LP ${firstEntry.service_phase_id}`} (${user?.name || 'Unbekannt'})`,
                quantity: totalHours,
                unit: 'Std.',
                unitPrice: user?.hourly_rate || 0,
                total: totalHours * (user?.hourly_rate || 0),
                isImported: true,
            });
        }
        
        // Remove placeholder if it's empty
        const existingItems = doc.items.length === 1 && !doc.items[0].description ? [] : doc.items;

        setDoc(prev => ({ ...prev, items: [...existingItems, ...newItems] }));
        setTimeEntryIdsToBill(newBilledIds);
        setIsImportModalOpen(false);
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(doc as Omit<DocData, 'id'>, Array.from(timeEntryIdsToBill));
    };

    const docTitles = { offer: 'Angebot', order: 'Auftrag', invoice: 'Ausgangsrechnung', supplierInvoice: 'Eingangsrechnung' };
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition text-sm";
    // FIX: Use 'items' property which exists on the data structure, instead of 'subgroups'.
    const allKostengruppen = useMemo(() => KOSTENGRUPPEN_DATA.flatMap(g => [{id: g.id, name: g.title}, ...(g.items || []).flatMap(sg => (sg.items || []).map(i => ({id: i.id, name: `${sg.id} - ${i.title}`}))) ]), []);

    return (
        <>
        {isImportModalOpen && doc.projectId && (
            <TimeEntryImportModal
                projectId={doc.projectId}
                allUsers={users}
                timeEntries={timeEntries}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportTimeEntries}
            />
        )}
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">{initialData?.id ? docTitles[docType] + ' bearbeiten' : 'Neues ' + docTitles[docType]}</h3>
                        {docType === 'invoice' && doc.projectId && <button type="button" onClick={() => setIsImportModalOpen(true)} className="py-2 px-3 text-sm font-medium rounded-md bg-secondary text-text border">Zeiteinträge importieren</button>}
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {docType === 'offer' && <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Angebots-Nr.</label><input name="offerNumber" value={(doc as Offer).offerNumber} onChange={handleChange} className={commonInputClasses} required /></div>}
                            {docType === 'order' && <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Auftrags-Nr.</label><input name="orderNumber" value={(doc as Order).orderNumber} onChange={handleChange} className={commonInputClasses} required /></div>}
                            {docType === 'invoice' && <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Rechnungs-Nr.</label><input name="invoiceNumber" value={(doc as Invoice).invoiceNumber} onChange={handleChange} className={commonInputClasses} required /></div>}
                            {docType === 'supplierInvoice' && <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Rechnungs-Nr. Lieferant</label><input name="invoiceNumber" value={(doc as SupplierInvoice).invoiceNumber} onChange={handleChange} className={commonInputClasses} required /></div>}

                            <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Projekt</label><select name="projectId" value={doc.projectId} onChange={handleChange} className={commonInputClasses} required><option value="" disabled>Wählen...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            
                            {docType === 'supplierInvoice' 
                                ? <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Lieferant</label><select name="supplierContactId" value={(doc as SupplierInvoice).supplierContactId} onChange={handleChange} className={commonInputClasses} required><option value={0} disabled>Wählen...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                : <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Kunde</label><select name="contactId" value={(doc as Offer | Order | Invoice).contactId} onChange={handleChange} className={commonInputClasses} required><option value={0} disabled>Wählen...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            }
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">{docType === 'supplierInvoice' ? 'Rechnungsdatum' : 'Datum'}</label><input type="date" name={docType === 'supplierInvoice' ? 'invoiceDate' : 'date'} value={(docType === 'supplierInvoice' ? (doc as SupplierInvoice).invoiceDate : (doc as Offer).date)?.split('T')[0]} onChange={handleChange} className={commonInputClasses} required /></div>
                            {docType === 'offer' && <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Gültig bis</label><input type="date" name="validUntil" value={(doc as Offer).validUntil?.split('T')[0]} onChange={handleChange} className={commonInputClasses} /></div>}
                            {(docType === 'invoice' || docType === 'supplierInvoice') && <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Fällig am</label><input type="date" name="dueDate" value={(doc as Invoice | SupplierInvoice).dueDate?.split('T')[0]} onChange={handleChange} className={commonInputClasses} /></div>}
                            {docType === 'invoice' && <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Leistungsdatum</label><input type="date" name="performanceDate" value={(doc as Invoice).performanceDate?.split('T')[0]} onChange={handleChange} className={commonInputClasses} /></div>}
                        </div>

                        <h4 className="font-semibold text-sm pt-4 border-t border-border">Positionen</h4>
                        <div className="space-y-2">
                            {doc.items.map((item, index) => (
                                <div key={item.id} className={`grid grid-cols-12 gap-2 items-center ${item.isImported ? 'bg-blue-50 p-2 rounded-md' : ''}`}>
                                    <input value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder="Beschreibung" className={`${commonInputClasses} col-span-4`} readOnly={item.isImported} />
                                    <input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className={`${commonInputClasses} col-span-1`} readOnly={item.isImported} />
                                    <input value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)} className={`${commonInputClasses} col-span-1`} readOnly={item.isImported} />
                                    <input type="number" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={`${commonInputClasses} col-span-2`} readOnly={item.isImported} />
                                    <select value={item.kostengruppe || ''} onChange={e => handleItemChange(item.id, 'kostengruppe', e.target.value)} className={`${commonInputClasses} col-span-2`}><option value="">KG...</option>{allKostengruppen.map(kg => <option key={kg.id} value={kg.id}>{kg.id} - {kg.name}</option>)}</select>
                                    <span className="col-span-1 text-right text-sm">{formatCurrency(item.total)}</span>
                                    <button type="button" onClick={() => removeItem(item.id)} className="col-span-1 text-danger hover:bg-danger/10 rounded-full h-6 w-6 disabled:opacity-50" disabled={doc.items.length <= 1 || item.isImported}>×</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addItem} className="text-sm text-primary hover:underline">+ Manuelle Position hinzufügen</button>

                    </div>
                    <div className="flex-shrink-0 mt-auto pt-4 border-t border-border flex justify-between items-center">
                        <div className="text-right">
                           <div className="text-sm">Netto: {formatCurrency(doc.netAmount)}</div>
                           <div className="text-sm">MwSt (19%): {formatCurrency(doc.taxAmount)}</div>
                           <div className="font-bold">Brutto: {formatCurrency(doc.grossAmount)}</div>
                        </div>
                        <div className="flex gap-4">
                            <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover" onClick={onClose}>Abbrechen</button>
                            <button type="submit" className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">Speichern</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};

export default FinanceDocumentModal;