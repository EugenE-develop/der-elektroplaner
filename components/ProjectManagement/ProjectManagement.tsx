import React, { FC, useMemo, useState } from 'react';
// FIX: Changed import to be a relative path.
import { Project, User, ProjectRisk, ProjectStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import ProjectCard from './subcomponents/ProjectCard';
// FIX: Changed import to be a relative path.
import ProjectDetail from './subcomponents/ProjectDetail';
import CreateProjectForm from './subcomponents/CreateProjectForm';

interface ProjectManagementProps {
    selectedProjectId: string | null;
    onSelectProject: (id: string) => void;
    onClearSelection: () => void;
    activeSubView: string;
    onNavigateSubView: (subView: string) => void;
}

const ProjectManagement: FC<ProjectManagementProps> = ({ selectedProjectId, onSelectProject, onClearSelection, activeSubView, onNavigateSubView }) => {
    const { projects, users, projectRisks, handleUpdateProject, currentUser } = useAppContext();
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'Alle'>('Alle');
    const [showArchived, setShowArchived] = useState(false);
    
    const isManager = useMemo(() => {
        if (!currentUser) return false;
        // Defines which roles can see all projects
        return ['Geschäftsführung', 'Leitung', 'Admin', 'Büro'].includes(currentUser.role);
    }, [currentUser]);
    
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);

    const filteredProjects = useMemo(() => {
        let baseProjects = projects;

        // First, filter by user role if not a manager
        if (!isManager && currentUser) {
            baseProjects = projects.filter(p =>
                (p.projectLeiterIds || []).includes(currentUser.id) ||
                (p.deputyProjectLeiterIds || []).includes(currentUser.id)
            );
        }

        // Then, filter by archive status
        const tempProjects = showArchived
            ? baseProjects
            : baseProjects.filter(p => !p.isArchived);

        // Finally, filter by status
        if (statusFilter === 'Alle') {
            return tempProjects;
        }
        return tempProjects.filter(p => p.status === statusFilter);
    }, [projects, statusFilter, showArchived, isManager, currentUser]);

    const handleCsvExport = () => {
        const headers = [
            "Projektnummer", "Projektname", "Status", "Startdatum", "Enddatum", 
            "Projekttyp", "BGF (m²)", "Projektleiter", "Stellv. Projektleiter", "Leistungsphasen"
        ];
    
        const rows = filteredProjects.map(p => {
            const getNames = (ids: string[] = []) => ids.map(id => users.find(u => u.id === id)?.name || id).join('; ');
            const lps = (p.assignedPhases || []).map(ph => ph.phaseId).sort((a,b) => a-b).join(', ');
    
            const rowData = [
                p.projectNumber,
                p.name,
                p.status,
                p.startDate,
                p.endDate,
                p.projectCategory,
                p.grossFloorArea,
                getNames(p.projectLeiterIds),
                getNames(p.deputyProjectLeiterIds),
                lps
            ];
    
            return rowData.map(field => {
                const stringField = String(field ?? '');
                // Escape double quotes by doubling them and wrap the whole field in double quotes.
                return `"${stringField.replace(/"/g, '""')}"`;
            }).join(',');
        });
    
        const csvContent = [headers.join(','), ...rows].join('\n');
        // Add BOM for correct UTF-8 encoding in Excel
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `projekte_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (selectedProjectId && selectedProject) {
        return (
            <ProjectDetail 
                project={selectedProject} 
                onBack={onClearSelection}
                activeView={activeSubView}
                onNavigate={onNavigateSubView}
            />
        );
    }
    
    const filterStatuses: (ProjectStatus | 'Alle')[] = ['Alle', 'In Planung', 'In Ausführung', 'Abgeschlossen', 'Pausiert'];

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-text">Projektübersicht</h2>
                    <p className="text-text-light">Hier finden Sie alle Projekte. Klicken Sie auf ein Projekt für Details.</p>
                </div>
                 <button onClick={handleCsvExport} className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover">
                    CSV Export
                </button>
            </div>
            
             <CreateProjectForm />

            <div className="my-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-4">
                <span className="text-sm font-medium mr-2 text-text-light">Status:</span>
                {filterStatuses.map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors ${
                            statusFilter === status
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-secondary text-text-light hover:bg-secondary-hover hover:text-text'
                        }`}
                    >
                        {status}
                    </button>
                ))}
                <div className="flex items-center sm:ml-auto">
                    <input 
                        type="checkbox" 
                        id="showArchived"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="h-4 w-4 rounded accent-primary cursor-pointer"
                    />
                    <label htmlFor="showArchived" className="ml-2 text-sm font-medium text-text-light cursor-pointer">
                        Archivierte anzeigen
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map(project => (
                    <ProjectCard 
                        key={project.id}
                        project={project}
                        users={users}
                        onSelectProject={onSelectProject}
                        projectRisks={projectRisks}
                        onUpdateProject={handleUpdateProject}
                    />
                ))}
                 {filteredProjects.length === 0 && (
                    <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 bg-card rounded-lg border border-border">
                        <p className="text-text-light">Keine Projekte für die aktuellen Filter gefunden.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectManagement;