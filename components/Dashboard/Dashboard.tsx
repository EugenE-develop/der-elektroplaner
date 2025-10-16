import React, { FC } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useWikiData } from '../../hooks/useWikiData';
import ActivityFeed from './ActivityFeed';

interface DashboardProps {
    onNavigate: (view: string, projectId?: string | null, subView?: string | null, articleId?: number | null) => void;
}

const Dashboard: FC<DashboardProps> = ({ onNavigate }) => {
    const { projects, currentUser, timeEntries, users } = useAppContext();
    const { data: wikiData } = useWikiData();
    const wikiArticles = wikiData?.articles || [];
    
    const activeProjects = projects.filter(p => p.status === 'In Ausführung' || p.status === 'In Planung').length;
    
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-text">Willkommen, {currentUser?.name}!</h2>
                <p className="text-text-light">Hier ist eine Übersicht Ihrer aktuellen Aktivitäten.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                 <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-text-light">Aktive Projekte</h3>
                    <p className="mt-2 text-3xl font-bold text-primary">{activeProjects}</p>
                </div>
                 <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-text-light">Gesamtprojekte</h3>
                    <p className="mt-2 text-3xl font-bold">{projects.length}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-text-light">Offene Aufgaben</h3>
                    <p className="mt-2 text-3xl font-bold">N/A</p>
                </div>
                 <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-text-light">Ihr Status</h3>
                    <p className="mt-2 text-3xl font-bold text-success">{currentUser?.role}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1">
                 <ActivityFeed
                    projects={projects}
                    timeEntries={timeEntries}
                    wikiArticles={wikiArticles}
                    users={users}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );
};

export default Dashboard;