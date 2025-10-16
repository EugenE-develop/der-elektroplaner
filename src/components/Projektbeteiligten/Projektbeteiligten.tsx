import React, { FC, useState } from 'react';
import { Project, Contact, Stakeholder } from '../../types';
import { useContactMutations } from '../../hooks/useContacts';

interface ProjektbeteiligtenProps {
    project: Project;
    contacts: Contact[];
    onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
}

const Projektbeteiligten: FC<ProjektbeteiligtenProps> = ({ project, contacts, onUpdateProject }) => {
    const { createContactMutation } = useContactMutations();

    const [isAdding, setIsAdding] = useState(false);
    const [addMode, setAddMode] = useState<'select' | 'manual'>('select');

    // State for select mode
    const [selectedContactId, setSelectedContactId] = useState<number | ''>('');
    const [projectRole, setProjectRole] = useState('');

    // State for manual mode
    const [manualName, setManualName] = useState('');
    const [manualCompany, setManualCompany] = useState('');
    const [manualProjectRole, setManualProjectRole] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [manualPhone, setManualPhone] = useState('');

    if (!project) return <div>Lade Projekt...</div>;

    const projectStakeholders = (project.stakeholders || []).map(stakeholder => {
        const contact = contacts.find(c => c.id === stakeholder.contact_id);
        return { ...stakeholder, ...contact };
    });

    const availableContacts = contacts.filter(c => 
        !(project.stakeholders || []).some(s => s.contact_id === c.id)
    );

    const resetAndCloseForm = () => {
        setIsAdding(false);
        setAddMode('select');
        setSelectedContactId('');
        setProjectRole('');
        setManualName('');
        setManualCompany('');
        setManualProjectRole('');
        setManualEmail('');
        setManualPhone('');
    };

    const handleAddFromContacts = () => {
        if (!selectedContactId || !projectRole.trim()) {
            alert("Bitte wählen Sie einen Kontakt und geben Sie eine Rolle an.");
            return;
        }
        const newStakeholder: Stakeholder = {
            contact_id: Number(selectedContactId),
            project_role: projectRole.trim(),
        };
        const updatedStakeholders = [...(project.stakeholders || []), newStakeholder];
        onUpdateProject(project.id, { stakeholders: updatedStakeholders });
        
        resetAndCloseForm();
    };

    const handleAddManual = () => {
        if (!manualName.trim() || !manualProjectRole.trim()) {
            alert('Name und Rolle im Projekt sind Pflichtfelder.');
            return;
        }

        createContactMutation.mutate({
            name: manualName,
            company: manualCompany,
            role: manualProjectRole, // Using project role as general role for new contact
            email: manualEmail,
            phone: manualPhone,
        }, {
            onSuccess: (newContact) => {
                if (newContact) {
                    const newStakeholder: Stakeholder = {
                        contact_id: newContact.id,
                        project_role: manualProjectRole.trim(),
                    };
                    const updatedStakeholders = [...(project.stakeholders || []), newStakeholder];
                    onUpdateProject(project.id, { stakeholders: updatedStakeholders });
                    resetAndCloseForm();
                }
            },
        });
    };
    
    const handleRemoveStakeholder = (contactId: number) => {
        if(window.confirm("Möchten Sie diesen Beteiligten wirklich aus dem Projekt entfernen?")) {
            const updatedStakeholders = (project.stakeholders || []).filter(s => s.contact_id !== contactId);
            onUpdateProject(project.id, { stakeholders: updatedStakeholders });
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center pb-4 border-b border-border mb-4">
                <h3 className="text-xl font-semibold">Projektbeteiligte</h3>
                {!isAdding && <button onClick={() => setIsAdding(true)} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">+ Beteiligten hinzufügen</button>}
            </div>

            {isAdding && (
                <div className="bg-slate-50 p-4 rounded-lg border border-border mb-6 space-y-4">
                    <div className="flex border-b border-border">
                        <button 
                            onClick={() => setAddMode('select')}
                            className={`px-4 py-2 text-sm font-medium ${addMode === 'select' ? 'border-b-2 border-primary text-primary' : 'text-text-light'}`}
                        >
                            Aus Kontakten wählen
                        </button>
                        <button 
                            onClick={() => setAddMode('manual')}
                            className={`px-4 py-2 text-sm font-medium ${addMode === 'manual' ? 'border-b-2 border-primary text-primary' : 'text-text-light'}`}
                        >
                            Manuell hinzufügen
                        </button>
                    </div>

                    {addMode === 'select' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-text-light mb-1">Kontakt auswählen</label>
                                <select value={selectedContactId} onChange={e => setSelectedContactId(Number(e.target.value))} className="w-full p-2 border rounded">
                                    <option value="" disabled>Bitte wählen...</option>
                                    {availableContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-text-light mb-1">Rolle im Projekt</label>
                                <input value={projectRole} onChange={e => setProjectRole(e.target.value)} placeholder="z.B. Bauherr, Statiker" className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    )}

                    {addMode === 'manual' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-text-light mb-1">Name*</label>
                                <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Max Mustermann" className="w-full p-2 border rounded" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-text-light mb-1">Rolle im Projekt*</label>
                                <input value={manualProjectRole} onChange={e => setManualProjectRole(e.target.value)} placeholder="z.B. Bauherr, Statiker" className="w-full p-2 border rounded" required/>
                            </div>
                             <div className="flex flex-col">
                                <label className="text-sm font-medium text-text-light mb-1">Firma</label>
                                <input value={manualCompany} onChange={e => setManualCompany(e.target.value)} placeholder="Musterfirma GmbH" className="w-full p-2 border rounded" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-text-light mb-1">E-Mail</label>
                                <input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="max@muster.de" className="w-full p-2 border rounded" />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-sm font-medium text-text-light mb-1">Telefon</label>
                                <input type="tel" value={manualPhone} onChange={e => setManualPhone(e.target.value)} placeholder="0123 456789" className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <button type="button" onClick={resetAndCloseForm} className="py-1 px-3 font-medium rounded-md bg-secondary text-text border">Abbrechen</button>
                        <button 
                            type="button"
                            onClick={addMode === 'select' ? handleAddFromContacts : handleAddManual} 
                            className="py-1 px-3 font-medium rounded-md bg-primary text-white disabled:opacity-50"
                            disabled={createContactMutation.isPending}
                        >
                            {createContactMutation.isPending ? 'Speichert...' : 'Hinzufügen'}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 font-semibold">Name</th>
                            <th className="p-3 font-semibold">Firma</th>
                            <th className="p-3 font-semibold">Projekt-Rolle</th>
                            <th className="p-3 font-semibold">E-Mail</th>
                            <th className="p-3 font-semibold">Telefon</th>
                            <th className="p-3 font-semibold">Aktion</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {projectStakeholders.map(s => (
                            <tr key={s.contact_id} className="hover:bg-secondary-hover">
                                <td className="p-3 font-medium">{s.name}</td>
                                <td className="p-3">{s.company}</td>
                                <td className="p-3 font-semibold">{s.project_role}</td>
                                <td className="p-3"><a href={`mailto:${s.email}`} className="text-primary hover:underline">{s.email}</a></td>
                                <td className="p-3">{s.phone}</td>
                                <td className="p-3">
                                    <button onClick={() => handleRemoveStakeholder(s.contact_id)} className="text-danger hover:underline text-xs font-medium">Entfernen</button>
                                </td>
                            </tr>
                        ))}
                        {projectStakeholders.length === 0 && (
                            <tr><td colSpan={6} className="text-center p-6 text-text-light">Keine Projektbeteiligten zugewiesen.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Projektbeteiligten;