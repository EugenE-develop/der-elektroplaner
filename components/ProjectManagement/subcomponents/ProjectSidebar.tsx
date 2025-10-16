import React, { FC } from 'react';

interface ProjectSidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

const ProjectSidebar: FC<ProjectSidebarProps> = ({ activeView, onNavigate }) => {

    const navItems = [
        { id: 'overview', label: 'Übersicht' },
        { id: 'gantt-echarts', label: 'Gantt (ECharts)' },
        { id: 'checklist', label: 'Checklisten' },
        { id: 'todo', label: 'Aufgaben (ToDo)' },
        { id: 'diary', label: 'Bautagebuch' },
        { id: 'budget', label: 'Budget & Controlling' },
        { id: 'stakeholders', label: 'Projektbeteiligte' },
        { type: 'divider' },
        { id: 'memos', label: 'Aktennotizen' },
        { id: 'plans', label: 'Planunterlagen' },
        { id: 'schematics', label: 'Strangschemen & Details' },
        { id: 'documents', label: 'Technische Unterlagen' },
        { id: 'specifications', label: 'Leistungsverzeichnis' },
        { id: 'attachments', label: 'Allg. Anhänge' },
        { type: 'divider' },
        { id: 'report', label: 'Erläuterungsbericht' },
        { id: 'fire', label: 'Brandschutz' },
        { type: 'divider' },
        { id: 'angebote', label: 'Angebote' },
    ];

    return (
        <aside className="bg-card p-2 rounded-lg border border-border h-full">
            <nav>
                <ul className="space-y-1">
                    {navItems.map((item, index) => {
                        if (item.type === 'divider') {
                            return <hr key={`divider-${index}`} className="my-2 border-border" />;
                        }
                        return (
                             <li key={item.id}>
                                <button
                                    onClick={() => onNavigate(item.id)}
                                    className={`w-full text-left p-2.5 rounded-md font-medium text-sm transition-colors ${
                                        activeView === item.id ? 'bg-primary text-white' : 'hover:bg-secondary'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default ProjectSidebar;