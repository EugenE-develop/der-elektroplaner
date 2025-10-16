import React, { FC } from 'react';
import { Project, User, ProjectRisk } from '../../../types';
import { LEISTUNGSPHASEN_COLORS, KOSTENGRUPPEN_DATA } from '../../../constants';

const ProjectCard: FC<{ project: Project; users: User[]; onSelectProject: (id: string) => void; projectRisks: Record<string, ProjectRisk>, onUpdateProject: (projectId: string, updates: Partial<Project>) => void; }> = ({ project, users, onSelectProject, projectRisks, onUpdateProject }) => {
    const getLeiterNames = (ids: string[]) => (ids || []).map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
    
    const risk = projectRisks[project.id];
    const riskColorMap: Record<ProjectRisk['level'], string> = {
        'Niedrig': 'bg-teal-400',
        'Mittel': 'bg-yellow-400',
        'Hoch': 'bg-red-400',
    };
    
    const allLeistungen = KOSTENGRUPPEN_DATA.flatMap(group => 
        group.items.flatMap(subgroup => 
            subgroup.items.map(item => ({...item, groupTitle: group.title, subgroupTitle: subgroup.title }))
        )
    );
    
    const handleArchiveToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click which would navigate to project detail
        const isArchived = !!project.isArchived;
        const actionText = isArchived ? 'wiederherstellen' : 'archivieren';
        if (window.confirm(`Möchten Sie das Projekt "${project.name}" wirklich ${actionText}?`)) {
            onUpdateProject(project.id, { isArchived: !isArchived });
        }
    };


    return (
        <div onClick={() => onSelectProject(project.id)} className="bg-card p-3 sm:p-4 rounded-lg border border-border cursor-pointer hover:border-primary hover:shadow-lg transition-all flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    {project.logoUrl ? (
                        <img src={project.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-md bg-white p-0.5 shadow-sm flex-shrink-0" />
                    ) : (
                        <div className="h-10 w-10 flex-shrink-0 bg-secondary rounded-md flex items-center justify-center text-text-light font-bold text-lg">
                            {project.name.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        {risk && <div className={`w-2.5 h-2.5 rounded-full absolute top-2 left-2 ${riskColorMap[risk.level]}`} title={`AI-Risiko: ${risk.level} - ${risk.reason}`} />}
                        <h4 className="font-semibold leading-tight truncate" title={String(project.name)}>{project.name}</h4>
                        {project.projectNumber && <p className="text-sm text-text-light">PNR: {project.projectNumber}</p>}
                    </div>
                </div>
                <span className={`text-xs font-medium py-1 px-2.5 rounded-full text-white whitespace-nowrap ${ { 'In Planung': 'bg-primary', 'In Ausführung': 'bg-success', 'Abgeschlossen': 'bg-text-light', 'Pausiert': 'bg-yellow-500' }[project.status] }`}>
                    {project.status}
                </span>
            </div>
            
            <div className="flex-grow space-y-4 mt-2">
                <div>
                    <h5 className="text-xs font-semibold text-text-light mb-1 uppercase">Projektleiter</h5>
                    <p className="text-sm truncate">{getLeiterNames(project.projectLeiterIds)}</p>
                </div>

                <div>
                     <h5 className="text-xs font-semibold text-text-light mb-2 uppercase">Leistungsphasen</h5>
                     <div className="flex flex-wrap gap-1.5">
                        {(project.assignedPhases || []).length > 0 ? (project.assignedPhases || [])
                            .filter(phase => phase && typeof phase.phaseId === 'number')
                            .sort((a,b) => a.phaseId - b.phaseId)
                            .map(phase => {
                            const phaseTasks = phase.checklist || [];
                            
                            const tasksText = phaseTasks
                                .map(task => `• ${task?.text || 'Unbenannter Punkt'}`)
                                .join('\n');
                            
                            const tooltipText = phaseTasks.length > 0
                                ? `Checkliste für LP${phase.phaseId}:\n${tasksText}`
                                : `LP${phase.phaseId}: Keine Checklistenpunkte definiert.`;

                            return (
                                <span
                                    key={phase.phaseId}
                                    className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: LEISTUNGSPHASEN_COLORS[phase.phaseId] || '#ccc' }}
                                    title={String(tooltipText)}
                                >
                                    LP{phase.phaseId}
                                </span>
                            );
                        }) : (
                            <span className="text-xs italic text-text-light">Keine zugewiesen</span>
                        )}
                     </div>
                </div>

                {(project.assignedSystems || []).length > 0 && (
                    <div>
                        <h5 className="text-xs font-semibold text-text-light mb-2 uppercase">Leistungen</h5>
                        <div className="flex flex-wrap gap-1.5">
                            {project.assignedSystems.slice(0, 5).map(systemId => {
                                const leistung = allLeistungen.find(l => l.id === systemId);
                                const leistungTitle = leistung?.title || systemId;
                                const tooltipText = leistung ? `KG ${leistung.id} (${leistung.subgroupTitle})` : systemId;
                                return (
                                    <span key={systemId} className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full" title={tooltipText}>
                                        {leistungTitle}
                                    </span>
                                );
                            })}
                            {project.assignedSystems.length > 5 && (
                                 <span className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                    +{project.assignedSystems.length - 5}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {(project.status === 'Abgeschlossen' || project.isArchived) && (
                <div className="mt-4 pt-3 border-t border-border flex justify-end">
                    <button 
                        onClick={handleArchiveToggle}
                        className={`text-xs font-medium py-1 px-2.5 rounded transition-colors ${project.isArchived ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                    >
                        {project.isArchived ? 'Wiederherstellen' : 'Archivieren'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectCard;