

import React, { FC } from 'react';
// FIX: Import the `User` type to resolve the type error.
import { Project, User } from '../../../types';
import ProjectSidebar from './ProjectSidebar';
import ProjectDetailOverview from './ProjectDetailOverview';
import Erlauterungsbericht from '../../Erlauterungsbericht/Erlauterungsbericht';
import Brandschutz from '../../Brandschutz/Brandschutz';
import Projektbeteiligten from '../../Projektbeteiligten/Projektbeteiligten';
import Todo from '../../Todo/Todo';
import Angebote from '../../Angebote/Angebote';
import MemosComponent from './MemosComponent';
import TechnicalDocuments from '../../TechnicalDocuments/TechnicalDocuments';
import PlanDocuments from '../../PlanDocuments/PlanDocuments';
import ServiceSpecifications from '../../ServiceSpecifications/ServiceSpecifications';
import ProjectAttachments from './ProjectAttachments';
import { useAppContext } from '../../../contexts/AppContext';
import ChecklistView from './ChecklistView';
import ConstructionDiary from './ConstructionDiary';
import BudgetControlling from './BudgetControlling';
import Schematics from '../../Schematics/Schematics';
import EChartsGanttView from './EChartsGanttView';


interface ProjectDetailProps {
    project: Project;
    onBack: () => void;
    activeView: string;
    onNavigate: (subView: string) => void;
}

const ProjectDetail: FC<ProjectDetailProps> = ({ project, onBack, activeView, onNavigate }) => {
    const { users, contacts, handleUpdateProject, timeEntries, financeData } = useAppContext();
    
    const renderContent = () => {
        switch (activeView) {
            case 'overview':
                return <ProjectDetailOverview project={project} users={users} onUpdate={handleUpdateProject} />;
            case 'gantt-echarts':
                return <EChartsGanttView project={project} />;
            case 'checklist':
                return <ChecklistView project={project} onUpdateProject={handleUpdateProject} />;
            case 'report':
                return <Erlauterungsbericht />;
            case 'fire':
                return <Brandschutz />;
            case 'stakeholders':
                return <Projektbeteiligten project={project} contacts={contacts} onUpdateProject={handleUpdateProject} />;
            case 'todo':
                const teamMembers = [...(project.projectLeiterIds || []), ...(project.deputyProjectLeiterIds || [])].map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
                return <Todo project={project} teamMembers={teamMembers} onUpdateTodos={(updateFn) => handleUpdateProject(project.id, { todos: updateFn(project.todos) })} />;
            case 'diary':
                return <ConstructionDiary project={project} onUpdateProject={handleUpdateProject} users={users} />;
            case 'budget':
                return <BudgetControlling project={project} onUpdateProject={handleUpdateProject} users={users} timeEntries={timeEntries} supplierInvoices={financeData.supplierInvoices} />;
            case 'angebote':
                return <Angebote project={project} offers={[]} contacts={[]} onAction={() => {}} />;
            case 'memos':
                return <MemosComponent project={project} onUpdate={handleUpdateProject} />;
            case 'documents':
                return <TechnicalDocuments />;
            case 'plans':
                return <PlanDocuments project={project} onUpdateProject={handleUpdateProject} />;
            case 'schematics':
                return <Schematics project={project} onUpdateProject={handleUpdateProject} />;
            case 'specifications':
                return <ServiceSpecifications />;
            case 'attachments':
                return <ProjectAttachments project={project} onUpdateProject={handleUpdateProject} />;
            default:
                return <div>Wählen Sie eine Ansicht</div>;
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <button onClick={onBack} className="text-primary hover:underline mb-4 self-start">
                &larr; Zurück zur Projektübersicht
            </button>
            <div className="bg-card p-4 rounded-lg shadow-sm border border-border flex-shrink-0">
                 <h2 className="text-2xl font-semibold">{project.name}</h2>
                 <p className="text-text-light">{project.projectNumber}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="md:col-span-1">
                     <ProjectSidebar activeView={activeView} onNavigate={onNavigate} />
                </div>
                <div className="md:col-span-3 bg-card p-4 sm:p-6 rounded-lg shadow-sm border border-border">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
