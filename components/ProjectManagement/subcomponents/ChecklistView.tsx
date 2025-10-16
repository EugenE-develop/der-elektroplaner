import React, { FC, useState, useMemo } from 'react';
import { Project, AssignedPhase, ChecklistItem } from '../../../types';
import { initialLeistungsphasen, LEISTUNGSPHASEN_COLORS } from '../../../constants';
import { v4 as uuidv4 } from 'uuid';

interface ChecklistViewProps {
    project: Project;
    onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
}

const ProgressBar: FC<{ value: number; color: string }> = ({ value, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
        <div className="h-1.5 rounded-full" style={{ width: `${value}%`, backgroundColor: color }}></div>
    </div>
);

const ChecklistView: FC<ChecklistViewProps> = ({ project, onUpdateProject }) => {
    const [newChecklistItems, setNewChecklistItems] = useState<Record<number, string>>({});

    const assignedPhasesMap = useMemo(() => {
        const map = new Map<number, AssignedPhase>();
        (project.assignedPhases || []).forEach(p => map.set(p.phaseId, p));
        return map;
    }, [project.assignedPhases]);
    
    const updateAssignedPhases = (updatedPhases: AssignedPhase[]) => {
        onUpdateProject(project.id, { assignedPhases: updatedPhases });
    };

    const handleChecklistItemToggle = (phaseId: number, itemId: string) => {
        const phase = assignedPhasesMap.get(phaseId);
        if (!phase) return;

        const updatedChecklist = (phase.checklist || []).map(item => 
            item.id === itemId ? { ...item, isDone: !item.isDone } : item
        );
        
        const updatedPhases = (project.assignedPhases || []).map(p => 
            p.phaseId === phaseId ? { ...p, checklist: updatedChecklist } : p
        );

        updateAssignedPhases(updatedPhases);
    };
    
    const handleAddChecklistItem = (phaseId: number) => {
        const text = newChecklistItems[phaseId]?.trim();
        if (!text) return;

        const newItem: ChecklistItem = { id: uuidv4(), text, isDone: false };
        const phase = assignedPhasesMap.get(phaseId);
        const updatedChecklist = [...(phase?.checklist || []), newItem];
        
        const updatedPhases = (project.assignedPhases || []).map(p => 
            p.phaseId === phaseId ? { ...p, checklist: updatedChecklist } : p
        );
        updateAssignedPhases(updatedPhases);

        setNewChecklistItems(prev => ({ ...prev, [phaseId]: '' }));
    };

    const handleRemoveChecklistItem = (phaseId: number, itemId: string) => {
        if (!window.confirm("Soll der Punkt wirklich entfernt werden?")) return;
        const phase = assignedPhasesMap.get(phaseId);
        if (!phase) return;

        const updatedChecklist = (phase.checklist || []).filter(item => item.id !== itemId);
        
        const updatedPhases = (project.assignedPhases || []).map(p => 
            p.phaseId === phaseId ? { ...p, checklist: updatedChecklist } : p
        );
        updateAssignedPhases(updatedPhases);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold pb-4 border-b border-border">Checklisten der Leistungsphasen</h3>
            
            <div className="space-y-4">
                {initialLeistungsphasen.map(lp => {
                    const assigned = assignedPhasesMap.get(lp.id);
                    if (!assigned) return null;

                    const checklist = assigned.checklist || [];
                    const doneCount = checklist.filter(item => item.isDone).length;
                    const totalCount = checklist.length;
                    const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
                    
                    return (
                        <div key={lp.id} className="bg-card border border-border rounded-lg shadow-sm">
                            <div className="p-4 border-b border-border">
                                <h4 className="font-semibold">{lp.name}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex-grow">
                                        <ProgressBar value={progress} color={LEISTUNGSPHASEN_COLORS[lp.id]} />
                                    </div>
                                    <span className="text-xs font-medium text-text-light flex-shrink-0">
                                        {doneCount} von {totalCount} erledigt
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                {checklist.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 group">
                                        <input 
                                            type="checkbox" 
                                            id={`item-view-${item.id}`} 
                                            checked={item.isDone} 
                                            onChange={() => handleChecklistItemToggle(lp.id, item.id)} 
                                            className="h-4 w-4 accent-primary flex-shrink-0"
                                        />
                                        <label 
                                            htmlFor={`item-view-${item.id}`} 
                                            className={`text-sm flex-grow cursor-pointer ${item.isDone ? 'line-through text-text-light' : ''}`}
                                        >
                                            {item.text}
                                        </label>
                                        <button onClick={() => handleRemoveChecklistItem(lp.id, item.id)} className="text-xs text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                            Löschen
                                        </button>
                                    </div>
                                ))}
                                {checklist.length === 0 && <p className="text-sm text-text-light italic text-center py-2">Keine Aufgaben für diese Phase.</p>}
                                <div className="flex gap-2 pt-3 border-t border-border">
                                    <input 
                                        value={newChecklistItems[lp.id] || ''} 
                                        onChange={e => setNewChecklistItems(p => ({...p, [lp.id]: e.target.value}))}
                                        onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem(lp.id)}
                                        placeholder="Neuer Checklistenpunkt..." 
                                        className="w-full p-1.5 border rounded-md text-sm" 
                                    />
                                    <button onClick={() => handleAddChecklistItem(lp.id)} className="py-1 px-3 text-sm font-medium rounded-md bg-secondary border hover:bg-secondary-hover flex-shrink-0">
                                        Hinzufügen
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChecklistView;