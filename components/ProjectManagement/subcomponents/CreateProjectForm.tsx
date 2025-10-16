

import React, { FC, useState } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import LeistungenSelector from '../../shared/LeistungenSelector';
import { Project, ProjectStatus } from '../../../types';

const CreateProjectForm: FC = () => {
    const { handleCreateProject } = useAppContext();
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [projectNumber, setProjectNumber] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<ProjectStatus>('In Planung');
    const [projectCategory, setProjectCategory] = useState('');
    const [grossFloorArea, setGrossFloorArea] = useState<number | ''>('');
    const [assignedSystems, setAssignedSystems] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition text-sm";

    const resetForm = () => {
        setName('');
        setProjectNumber('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setStatus('In Planung');
        setProjectCategory('');
        setGrossFloorArea('');
        setAssignedSystems([]);
        setIsExpanded(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Bitte geben Sie einen Projektnamen an.');
            return;
        }
        setIsLoading(true);

        const newProject: Partial<Project> = {
            name,
            projectNumber,
            startDate,
            status,
            projectCategory,
            grossFloorArea: grossFloorArea ? Number(grossFloorArea) : undefined,
            assignedSystems,
            // Initialize with empty arrays/objects to prevent DB nulls
            projectLeiterIds: [],
            deputyProjectLeiterIds: [],
            assignedPhases: [],
            representatives: [],
            milestones: [],
            memos: [],
            erlauterungsbericht: [],
            fireProtectionDocs: [],
            todos: { tasks: {}, categories: {
                'todo': { id: 'todo', title: 'To Do', taskIds: [] },
                'inprogress': { id: 'inprogress', title: 'In Bearbeitung', taskIds: [] },
                'done': { id: 'done', title: 'Erledigt', taskIds: [] }
            }, categoryOrder: ['todo', 'inprogress', 'done'] },
            technicalDocuments: [],
            planDocuments: [],
            serviceSpecifications: [],
            stakeholders: [],
            logoUrl: null,
            generalAttachments: [],
        };

        await handleCreateProject(newProject);
        setIsLoading(false);
        resetForm();
    };

    if (!isExpanded) {
        return (
            <div className="mt-8 text-center">
                <button 
                    onClick={() => setIsExpanded(true)}
                    className="py-2 px-6 font-medium rounded-md bg-primary text-white hover:bg-primary-hover transition-transform hover:scale-105"
                >
                    + Neues Projekt anlegen
                </button>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-card p-6 rounded-lg shadow-lg border border-border">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-semibold">Neues Projekt anlegen</h3>
                 <button onClick={() => setIsExpanded(false)} className="text-2xl text-text-light">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Projektname*</label><input value={name} onChange={e => setName(e.target.value)} className={commonInputClasses} required /></div>
                    <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Projektnummer</label><input value={projectNumber} onChange={e => setProjectNumber(e.target.value)} className={commonInputClasses} /></div>
                    <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Startdatum*</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonInputClasses} required /></div>
                    <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Status</label><select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} className={commonInputClasses}><option>In Planung</option><option>In Ausführung</option><option>Pausiert</option><option>Abgeschlossen</option></select></div>
                    <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Projekttyp</label><input value={projectCategory} onChange={e => setProjectCategory(e.target.value)} placeholder="z.B. Wohnbau, Gewerbe" className={commonInputClasses} /></div>
                    <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">BGF (m²)</label><input type="number" value={grossFloorArea} onChange={e => setGrossFloorArea(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Bruttogeschossfläche" className={commonInputClasses} /></div>
                </div>
                
                <LeistungenSelector selectedSystems={assignedSystems} onUpdateSystems={setAssignedSystems} />

                <div className="flex justify-end gap-4 pt-4 border-t border-border">
                    <button type="button" onClick={resetForm} className="py-2 px-4 font-medium rounded-md bg-secondary text-text border">Abbrechen</button>
                    <button type="submit" disabled={isLoading} className="py-2 px-6 font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50">{isLoading ? 'Wird erstellt...' : 'Projekt erstellen'}</button>
                </div>
            </form>
        </div>
    );
};

export default CreateProjectForm;