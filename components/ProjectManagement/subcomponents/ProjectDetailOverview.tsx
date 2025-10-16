import React, { FC, useState, ChangeEvent, useMemo } from 'react';
import { Project, User, AssignedPhase, ChecklistItem, ProjectStatus, Milestone } from '../../../types';
import { supabase } from '../../../supabaseClient';
import EditLeadersModal from './EditLeadersModal';
import LeistungenSelector from '../../shared/LeistungenSelector';
import EditPhasesModal from './EditPhasesModal';
import { initialLeistungsphasen, LEISTUNGSPHASEN_COLORS } from '../../../constants';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../../../contexts/AppContext';


interface ProjectDetailOverviewProps {
    project: Project;
    users: User[];
    onUpdate: (projectId: string, updates: Partial<Project>) => void;
}

const ProgressBar: FC<{ value: number; color: string }> = ({ value, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="h-2.5 rounded-full" style={{ width: `${value}%`, backgroundColor: color }}></div>
    </div>
);

const projectStatuses: ProjectStatus[] = ['In Planung', 'In Ausführung', 'Abgeschlossen', 'Pausiert'];


const ProjectDetailOverview: FC<ProjectDetailOverviewProps> = ({ project, users, onUpdate }) => {
    const { currentUser } = useAppContext();
    const [isEditingLeaders, setIsEditingLeaders] = useState<'projectLeiterIds' | 'deputyProjectLeiterIds' | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isEditingPhases, setIsEditingPhases] = useState(false);

    // State for new milestone form
    const [newMilestoneName, setNewMilestoneName] = useState('');
    const [newMilestoneDate, setNewMilestoneDate] = useState('');
    
    const { openMilestones, completedMilestones } = useMemo(() => {
        const open: Milestone[] = [];
        const completed: Milestone[] = [];
        (project.milestones || []).forEach(m => {
            if (m.completed) {
                completed.push(m);
            } else {
                open.push(m);
            }
        });
        // Sort both lists by date
        open.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { openMilestones: open, completedMilestones: completed };
    }, [project.milestones]);


    const getLeaderNames = (ids: string[]) => {
        return (ids || []).map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || 'Nicht zugewiesen';
    }
    
    const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!currentUser) {
            alert('Fehler: Sie sind nicht angemeldet.');
            return;
        }
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        // Correct the path to start with the user ID and project ID folder to comply with RLS policy.
        const filePath = `public/${currentUser.id}/${project.id}/logo-${uuidv4()}.${fileExt}`;

        setIsUploadingLogo(true);
        
        // Robustly remove old logo if it exists
        if (project.logoUrl) {
            try {
                const url = new URL(project.logoUrl);
                const pathParts = url.pathname.split('/');
                const bucketName = 'project_files';
                // Find the bucket name in the path and slice everything after it
                const bucketIndex = pathParts.indexOf(bucketName);
                if (bucketIndex > -1) {
                    const oldPath = pathParts.slice(bucketIndex + 1).join('/');
                    if (oldPath) {
                        await supabase.storage.from('project_files').remove([decodeURIComponent(oldPath)]);
                    }
                }
            } catch (e) {
                console.error("Could not parse or remove old logo. This may be safe to ignore if the file doesn't exist.", e);
                // Continue with upload anyway
            }
        }

        // Upload new logo without upsert. This simplifies RLS policy requirements
        // as it avoids needing UPDATE permissions on storage.objects.
        const { error } = await supabase.storage
            .from('project_files')
            .upload(filePath, file);

        if (error) {
            // Provide a more informative error message to the user and console.
            console.error('Error uploading logo:', error.message);
            alert(`Fehler beim Hochladen des Logos: ${error.message}`);
        } else {
            const { data } = supabase.storage.from('project_files').getPublicUrl(filePath);
            // Add a timestamp to bust the cache when the logo is updated
            const newLogoUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
            onUpdate(project.id, { logoUrl: newLogoUrl });
        }
        setIsUploadingLogo(false);
    };

    const handleRemoveLogo = async () => {
        if (!project.logoUrl) return;
        if (window.confirm("Möchten Sie das Projektlogo wirklich entfernen?")) {
            try {
                const url = new URL(project.logoUrl);
                const pathParts = url.pathname.split('/');
                const bucketName = 'project_files';
                const bucketIndex = pathParts.indexOf(bucketName);
                if (bucketIndex > -1) {
                    const pathToDelete = pathParts.slice(bucketIndex + 1).join('/');
                    if (pathToDelete) {
                        const { error } = await supabase.storage.from('project_files').remove([decodeURIComponent(pathToDelete)]);
                        if (error) throw error;
                        onUpdate(project.id, { logoUrl: null });
                    }
                }
            } catch (e: any) {
                console.error("Error removing logo:", e);
                alert("Fehler beim Entfernen des Logos: " + e.message);
            }
        }
    };
    
    const assignedPhasesMap = useMemo(() => {
        const map = new Map<number, AssignedPhase>();
        (project.assignedPhases || []).forEach(p => map.set(p.phaseId, p));
        return map;
    }, [project.assignedPhases]);

    const calculateProgress = (checklist: ChecklistItem[] = []) => {
        if (checklist.length === 0) return 0;
        const done = checklist.filter(item => item.isDone).length;
        return (done / checklist.length) * 100;
    };

    const assignedPhaseElements = useMemo(() => 
        initialLeistungsphasen
            .filter(lp => assignedPhasesMap.has(lp.id))
            .map(lp => {
                const assigned = assignedPhasesMap.get(lp.id)!;
                const progress = calculateProgress(assigned.checklist);
                const completionDate = assigned.completionDate ? new Date(assigned.completionDate).toLocaleDateString('de-DE') : 'Offen';
                
                return (
                    <div key={lp.id}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{lp.name}</span>
                            <span className="text-xs text-text-light">Abschluss: {completionDate}</span>
                        </div>
                        <ProgressBar value={progress} color={LEISTUNGSPHASEN_COLORS[lp.id]} />
                    </div>
                );
            })
    , [assignedPhasesMap, project.assignedPhases]);

    const handleAddMilestone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMilestoneName || !newMilestoneDate) return;
        const newMilestone: Milestone = {
            id: uuidv4(),
            name: newMilestoneName,
            date: newMilestoneDate,
            completed: false,
        };
        const updatedMilestones = [...(project.milestones || []), newMilestone];
        onUpdate(project.id, { milestones: updatedMilestones });
        setNewMilestoneName('');
        setNewMilestoneDate('');
    };

    const handleToggleMilestone = (id: string) => {
        const updatedMilestones = (project.milestones || []).map(m =>
            m.id === id ? { ...m, completed: !m.completed } : m
        );
        onUpdate(project.id, { milestones: updatedMilestones });
    };

    const handleDeleteMilestone = (id: string) => {
        if (window.confirm("Meilenstein wirklich löschen?")) {
            const updatedMilestones = (project.milestones || []).filter(m => m.id !== id);
            onUpdate(project.id, { milestones: updatedMilestones });
        }
    };


    return (
        <div className="space-y-6">
             {isEditingLeaders && (
                <EditLeadersModal
                    project={project}
                    users={users}
                    roleType={isEditingLeaders}
                    onClose={() => setIsEditingLeaders(null)}
                    onSave={(updates) => onUpdate(project.id, updates)}
                />
            )}
            {isEditingPhases && (
                <EditPhasesModal
                    project={project}
                    onClose={() => setIsEditingPhases(false)}
                    onSave={(updates) => onUpdate(project.id, updates)}
                />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-text-light uppercase">Projektleiter</h4>
                        <button onClick={() => setIsEditingLeaders('projectLeiterIds')} className="text-xs font-medium text-primary hover:underline">Bearbeiten</button>
                    </div>
                    <p className="mt-2 text-base font-medium">{getLeaderNames(project.projectLeiterIds)}</p>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                     <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-text-light uppercase">Stellvertreter</h4>
                         <button onClick={() => setIsEditingLeaders('deputyProjectLeiterIds')} className="text-xs font-medium text-primary hover:underline">Bearbeiten</button>
                    </div>
                    <p className="mt-2 text-base font-medium">{getLeaderNames(project.deputyProjectLeiterIds)}</p>
                </div>
                 <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                    <h4 className="text-sm font-semibold text-text-light uppercase">Status</h4>
                     <div className="relative mt-1">
                        <select
                            value={project.status}
                            onChange={(e) => onUpdate(project.id, { status: e.target.value as ProjectStatus })}
                            className="w-full appearance-none bg-card p-0 text-base font-medium border-0 focus:ring-0 focus:outline-none cursor-pointer"
                        >
                            {projectStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-text-light">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-text-light uppercase">Leistungsphasen</h4>
                    <button onClick={() => setIsEditingPhases(true)} className="text-xs font-medium text-primary hover:underline">Bearbeiten</button>
                </div>
                <div className="space-y-4">
                    {assignedPhaseElements.length > 0 
                        ? assignedPhaseElements 
                        : <p className="text-sm text-text-light text-center py-4">Keine Leistungsphasen zugewiesen.</p>
                    }
                </div>
            </div>

             <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h4 className="text-sm font-semibold text-text-light uppercase">Meilensteine</h4>
                
                <div className="mt-4 space-y-3">
                    <details open>
                        <summary className="font-semibold cursor-pointer flex justify-between items-center">
                            Offene Meilensteine
                            <span className="text-xs font-bold bg-secondary text-text-light px-2 py-0.5 rounded-full">{openMilestones.length}</span>
                        </summary>
                        <div className="pt-2 space-y-2">
                             {openMilestones.length > 0 ? openMilestones.map(milestone => (
                                <div key={milestone.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                                    <button onClick={() => handleToggleMilestone(milestone.id)} className="w-6 h-6 rounded-full border-2 border-primary flex-shrink-0"></button>
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium">{milestone.name}</p>
                                        <p className="text-xs text-text-light">{new Date(milestone.date).toLocaleDateString('de-DE')}</p>
                                    </div>
                                    <button onClick={() => handleDeleteMilestone(milestone.id)} className="w-6 h-6 text-danger/70 hover:text-danger">&times;</button>
                                </div>
                            )) : <p className="text-sm text-text-light text-center py-2 italic">Alle Meilensteine erledigt!</p>}
                        </div>
                    </details>
                    
                    {completedMilestones.length > 0 && (
                        <details>
                            <summary className="font-semibold cursor-pointer flex justify-between items-center">
                                Erledigte Meilensteine
                                <span className="text-xs font-bold bg-secondary text-text-light px-2 py-0.5 rounded-full">{completedMilestones.length}</span>
                            </summary>
                            <div className="pt-2 space-y-2">
                                {completedMilestones.map(milestone => (
                                    <div key={milestone.id} className="flex items-center gap-3 p-2 rounded">
                                        <button onClick={() => handleToggleMilestone(milestone.id)} className="w-6 h-6 rounded-full border-2 border-success bg-success flex-shrink-0 flex items-center justify-center text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </button>
                                        <div className="flex-grow">
                                            <p className="text-sm font-medium line-through text-text-light">{milestone.name}</p>
                                            <p className="text-xs text-text-light">{new Date(milestone.date).toLocaleDateString('de-DE')}</p>
                                        </div>
                                         <button onClick={() => handleDeleteMilestone(milestone.id)} className="w-6 h-6 text-danger/70 hover:text-danger">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>

                <form onSubmit={handleAddMilestone} className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-end gap-2">
                    <div className="flex-grow w-full sm:w-auto"><label className="text-xs font-medium">Neuer Meilenstein</label><input type="text" value={newMilestoneName} onChange={e => setNewMilestoneName(e.target.value)} placeholder="Name des Meilensteins" className="w-full p-1.5 border rounded-md text-sm" required /></div>
                    <div className="w-full sm:w-auto"><label className="text-xs font-medium">Datum</label><input type="date" value={newMilestoneDate} onChange={e => setNewMilestoneDate(e.target.value)} className="w-full p-1.5 border rounded-md text-sm" required /></div>
                    <button type="submit" className="py-1.5 px-3 text-sm font-medium rounded-md bg-secondary border w-full sm:w-auto">Hinzufügen</button>
                </form>
            </div>


             <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h4 className="text-sm font-semibold text-text-light uppercase mb-4">Projektlogo</h4>
                <div className="flex items-center gap-6">
                    {project.logoUrl ? (
                         <img src={project.logoUrl} alt="Projektlogo" className="h-20 w-auto max-w-xs object-contain bg-slate-100 p-2 rounded-md border" />
                    ) : (
                        <div className="h-20 w-20 flex items-center justify-center bg-secondary rounded-md text-text-light">
                            <span>Kein Logo</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="logo-upload" className={`py-2 px-4 text-sm font-medium rounded-md cursor-pointer transition-colors ${isUploadingLogo ? 'bg-secondary' : 'bg-primary text-white hover:bg-primary-hover'}`}>
                             {isUploadingLogo ? 'Wird hochgeladen...' : 'Logo ändern'}
                            <input id="logo-upload" type="file" className="sr-only" onChange={handleLogoUpload} accept="image/png, image/jpeg, image/svg+xml, image/webp" disabled={isUploadingLogo} />
                        </label>
                        {project.logoUrl && <button onClick={handleRemoveLogo} className="text-xs font-medium text-danger hover:underline">Entfernen</button>}
                    </div>
                </div>
            </div>

             <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <LeistungenSelector 
                    selectedSystems={project.assignedSystems || []} 
                    onUpdateSystems={(systems) => onUpdate(project.id, { assignedSystems: systems })}
                />
            </div>
        </div>
    );
};

export default ProjectDetailOverview;