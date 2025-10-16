import React, { FC, useState, useMemo } from 'react';
import { Project, AssignedPhase, ChecklistItem } from '../../../types';
import { initialLeistungsphasen, DEFAULT_CHECKLIST_ITEMS } from '../../../constants';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../../../contexts/AppContext';

interface EditPhasesModalProps {
    project: Project;
    onClose: () => void;
    onSave: (updates: Partial<Project>) => void;
}

const EditPhasesModal: FC<EditPhasesModalProps> = ({ project, onClose, onSave }) => {
    const { checklistTemplates } = useAppContext();
    const [assignedPhases, setAssignedPhases] = useState<AssignedPhase[]>(JSON.parse(JSON.stringify(project.assignedPhases || [])));
    const [newChecklistItems, setNewChecklistItems] = useState<Record<number, string>>({});

    const assignedPhasesMap = useMemo(() => {
        const map = new Map<number, AssignedPhase>();
        assignedPhases.forEach(p => map.set(p.phaseId, p));
        return map;
    }, [assignedPhases]);

    const handlePhaseToggle = (phaseId: number) => {
        setAssignedPhases(prev => {
            if (assignedPhasesMap.has(phaseId)) {
                return prev.filter(p => p.phaseId !== phaseId);
            } else {
                const template = checklistTemplates.find(t => t.applicable_phase === phaseId);
                let defaultChecklist: ChecklistItem[] = [];

                if (template && template.items.length > 0) {
                    // Use database template if available
                    defaultChecklist = template.items.map(item => ({
                        id: uuidv4(),
                        text: item.text,
                        isDone: false,
                    }));
                } else if (DEFAULT_CHECKLIST_ITEMS[phaseId]) {
                    // Fallback to hardcoded default items from constants.ts
                    defaultChecklist = DEFAULT_CHECKLIST_ITEMS[phaseId].map(item => ({
                        id: uuidv4(),
                        text: item.text,
                        isDone: false,
                    }));
                }
                
                return [...prev, { phaseId, note: '', interimUpdates: [], checklist: defaultChecklist }];
            }
        });
    };

    const handleUpdateField = (phaseId: number, field: keyof AssignedPhase, value: any) => {
        setAssignedPhases(prev => prev.map(p => p.phaseId === phaseId ? { ...p, [field]: value } : p));
    };
    
    const handleChecklistItemToggle = (phaseId: number, itemId: string) => {
        const phase = assignedPhasesMap.get(phaseId);
        if (!phase) return;
        const updatedChecklist = (phase.checklist || []).map(item => item.id === itemId ? {...item, isDone: !item.isDone} : item);
        handleUpdateField(phaseId, 'checklist', updatedChecklist);
    };

    const handleAddChecklistItem = (phaseId: number) => {
        const text = newChecklistItems[phaseId]?.trim();
        if (!text) return;

        const newItem: ChecklistItem = { id: uuidv4(), text, isDone: false };
        const phase = assignedPhasesMap.get(phaseId);
        const updatedChecklist = [...(phase?.checklist || []), newItem];
        handleUpdateField(phaseId, 'checklist', updatedChecklist);

        setNewChecklistItems(prev => ({...prev, [phaseId]: ''}));
    };
    
    const handleRemoveChecklistItem = (phaseId: number, itemId: string) => {
        const phase = assignedPhasesMap.get(phaseId);
        if (!phase) return;
        const updatedChecklist = (phase.checklist || []).filter(item => item.id !== itemId);
        handleUpdateField(phaseId, 'checklist', updatedChecklist);
    };


    const handleSaveClick = () => {
        onSave({ assignedPhases });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex-shrink-0"><h3 className="text-xl font-semibold">Leistungsphasen & Checklisten bearbeiten</h3></header>
                <main className="flex-grow p-6 overflow-y-auto space-y-4">
                    {initialLeistungsphasen.map(lp => {
                        const assigned = assignedPhasesMap.get(lp.id);
                        return (
                            <div key={lp.id} className="bg-slate-50 border border-border rounded-lg p-4">
                                <div className="flex items-center">
                                    <input type="checkbox" id={`lp-check-${lp.id}`} checked={!!assigned} onChange={() => handlePhaseToggle(lp.id)} className="h-5 w-5 rounded mr-3 accent-primary" />
                                    <label htmlFor={`lp-check-${lp.id}`} className="font-semibold text-lg flex-grow cursor-pointer">{lp.name}</label>
                                </div>
                                {assigned && (
                                    <div className="pl-8 pt-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Startdatum</label><input type="date" value={assigned.startDate || ''} onChange={(e) => handleUpdateField(lp.id, 'startDate', e.target.value)} className="w-full p-2 border rounded-md text-sm" /></div>
                                            <div className="flex flex-col"><label className="text-xs font-medium text-text-light mb-1">Gepl. Fertigstellung</label><input type="date" value={assigned.completionDate || ''} onChange={(e) => handleUpdateField(lp.id, 'completionDate', e.target.value)} className="w-full p-2 border rounded-md text-sm" /></div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Checkliste</h4>
                                            <div className="space-y-2">
                                                {(assigned.checklist || []).map(item => (
                                                    <div key={item.id} className="flex items-center gap-2 group">
                                                        <input type="checkbox" id={`item-${item.id}`} checked={item.isDone} onChange={() => handleChecklistItemToggle(lp.id, item.id)} className="h-4 w-4 accent-primary" />
                                                        <label htmlFor={`item-${item.id}`} className={`text-sm flex-grow ${item.isDone ? 'line-through text-text-light' : ''}`}>{item.text}</label>
                                                        <button onClick={() => handleRemoveChecklistItem(lp.id, item.id)} className="text-xs text-danger opacity-0 group-hover:opacity-100">Löschen</button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                <input value={newChecklistItems[lp.id] || ''} onChange={e => setNewChecklistItems(p => ({...p, [lp.id]: e.target.value}))} placeholder="Neuer Checklistenpunkt..." className="w-full p-1.5 border rounded-md text-sm" />
                                                <button onClick={() => handleAddChecklistItem(lp.id)} className="py-1 px-3 text-sm font-medium rounded-md bg-secondary border">Hinzufügen</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </main>
                <footer className="p-4 border-t border-border flex-shrink-0 flex justify-end gap-4">
                    <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border" onClick={onClose}>Abbrechen</button>
                    <button type="button" onClick={handleSaveClick} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">Speichern</button>
                </footer>
            </div>
        </div>
    );
};

export default EditPhasesModal;