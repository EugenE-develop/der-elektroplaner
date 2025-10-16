
import React, { FC, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// FIX: Changed import to be a relative path.
import { Contact } from '../../types';
import './Contacts.css';
import { useContacts, useContactMutations } from '../../hooks/useContacts';

const contactSchema = z.object({
    name: z.string().min(1, "Name ist ein Pflichtfeld."),
    company: z.string().optional(),
    role: z.string().optional(),
    email: z.string().email({ message: "Ungültige E-Mail-Adresse." }).optional().or(z.literal('')),
    phone: z.string().optional(),
    notes: z.string().optional(),
});
type ContactFormInputs = z.infer<typeof contactSchema>;

interface ContactModalProps {
    contact?: Contact | null;
    onClose: () => void;
    onSave: (data: ContactFormInputs) => void;
    isSaving: boolean;
}

const ContactModal: FC<ContactModalProps> = ({ contact, onClose, onSave, isSaving }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<ContactFormInputs>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: contact?.name || '',
            company: contact?.company || '',
            role: contact?.role || '',
            email: contact?.email || '',
            phone: contact?.phone || '',
            notes: contact?.notes || '',
        },
    });

    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition";

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit(onSave)} className="p-8">
                    <h3 className="text-xl font-semibold mb-6">{contact?.id ? 'Kontakt bearbeiten' : 'Neuen Kontakt anlegen'}</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Name *</label>
                                <input {...register("name")} className={`${commonInputClasses} ${errors.name ? 'input-error' : ''}`} />
                                {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Firma</label>
                                <input {...register("company")} className={commonInputClasses} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Rolle/Position</label>
                                <input {...register("role")} className={commonInputClasses} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">E-Mail</label>
                                <input type="email" {...register("email")} className={`${commonInputClasses} ${errors.email ? 'input-error' : ''}`} />
                                {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Telefon</label>
                                <input type="tel" {...register("phone")} className={commonInputClasses} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-light mb-1 block">Notizen</label>
                            <textarea {...register("notes")} rows={3} className={commonInputClasses}></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover" onClick={onClose}>Abbrechen</button>
                        <button type="submit" className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover" disabled={isSaving}>{isSaving ? 'Speichert...' : 'Speichern'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Contacts: FC = () => {
    const { data: contacts = [], isLoading: isContactsLoading, isError } = useContacts();
    const { createContactMutation, updateContactMutation, deleteContactMutation } = useContactMutations();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const handleSave: SubmitHandler<ContactFormInputs> = async (data) => {
        if (editingContact?.id) {
            updateContactMutation.mutate({ ...data, id: editingContact.id }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingContact(null);
                }
            });
        } else {
            createContactMutation.mutate(data, {
                 onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingContact(null);
                }
            });
        }
    };

    const handleDelete = async (contact: Contact) => {
        if (window.confirm(`Möchten Sie den Kontakt "${contact.name}" wirklich löschen?`)) {
            deleteContactMutation.mutate(contact.id);
        }
    };

    const isMutating = createContactMutation.isPending || updateContactMutation.isPending || deleteContactMutation.isPending;

    return (
        <div className="p-4 sm:p-6 md:p-8">
            {isModalOpen && <ContactModal contact={editingContact} onClose={() => { setIsModalOpen(false); setEditingContact(null); }} onSave={handleSave} isSaving={isMutating} />}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-text">Kontaktverwaltung</h2>
                    <p className="text-text-light">Verwalten Sie hier alle externen Projektkontakte.</p>
                </div>
                <button className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover" onClick={() => { setEditingContact(null); setIsModalOpen(true); }}>+ Neuer Kontakt</button>
            </div>
            
            <div className="mb-4">
                <input 
                    type="text"
                    placeholder="Kontakte durchsuchen (Name, Firma, E-Mail)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-md p-2 border border-border rounded-md bg-white"
                />
            </div>

            {isContactsLoading && <p className="text-center p-8">Lade Kontakte...</p>}
            {isError && <p className="text-center p-8 text-danger">Fehler beim Laden der Kontakte.</p>}

            {!isContactsLoading && !isError && (
                 <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-3 font-semibold">Name</th>
                                <th className="p-3 font-semibold">Firma</th>
                                <th className="p-3 font-semibold">Rolle</th>
                                <th className="p-3 font-semibold">E-Mail</th>
                                <th className="p-3 font-semibold">Telefon</th>
                                <th className="p-3 font-semibold">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                                <tr key={contact.id} className="hover:bg-secondary-hover">
                                    <td className="p-3 font-medium">{contact.name}</td>
                                    <td className="p-3">{contact.company || '-'}</td>
                                    <td className="p-3">{contact.role || '-'}</td>
                                    <td className="p-3"><a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a></td>
                                    <td className="p-3">{contact.phone || '-'}</td>
                                    <td className="p-3">
                                        <div className="flex gap-4">
                                            <button className="text-primary hover:underline" onClick={() => { setEditingContact(contact); setIsModalOpen(true); }}>Bearbeiten</button>
                                            <button className="text-danger hover:underline" onClick={() => handleDelete(contact)}>Löschen</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center p-6 text-text-light">
                                        {contacts.length === 0 ? 'Keine Kontakte vorhanden.' : 'Keine Kontakte für Ihre Suche gefunden.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Contacts;
