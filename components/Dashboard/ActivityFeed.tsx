import React, { FC, useMemo } from 'react';
import { Project, TimeEntry, WikiArticle, User } from '../../types';
import { formatDistanceToNow } from '../../utils';
import Icon from '../shared/Icon';

interface ActivityFeedProps {
    projects: Project[];
    timeEntries: TimeEntry[];
    wikiArticles: WikiArticle[];
    users: User[];
    onNavigate: (view: string, projectId?: string | null, subView?: string | null, articleId?: number | null) => void;
}

type FeedItem = {
    id: string;
    type: 'project' | 'wiki' | 'time';
    date: string;
    title: string;
    description: string;
    icon: React.ComponentProps<typeof Icon>['name'];
    onClick?: () => void;
};

const ActivityFeed: FC<ActivityFeedProps> = ({ projects, timeEntries, wikiArticles, users, onNavigate }) => {
    
    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unbekannt';

    const feedItems = useMemo(() => {
        const projectItems: FeedItem[] = projects
            .filter(p => p.createdAt)
            .map(p => ({
                id: `p-${p.id}`,
                type: 'project',
                date: p.createdAt!,
                title: `Neues Projekt: ${p.name}`,
                description: `Projekt #${p.projectNumber || 'N/A'} wurde gestartet.`,
                icon: 'FolderKanban',
                onClick: () => onNavigate('projekte', p.id),
            }));

        const wikiItems: FeedItem[] = wikiArticles
            .map(a => ({
                id: `w-${a.id}`,
                type: 'wiki',
                date: a.created_at,
                title: `Neuer Wiki-Artikel: ${a.title}`,
                description: `Verfasst von ${a.author_name}.`,
                icon: 'BookOpen',
                onClick: () => onNavigate('wiki', null, null, a.id),
            }));

        const timeItems: FeedItem[] = timeEntries
            .filter(t => t.created_at)
            .map(t => {
                const project = projects.find(p => p.id === t.project_id);
                return {
                    id: `t-${t.id}`,
                    type: 'time',
                    date: t.created_at!,
                    title: `${t.duration_hours}h für ${project?.name || 'Projekt'}`,
                    description: `Gebucht von ${getUserName(t.user_id)}: ${t.description}`,
                    icon: 'Clock',
                    onClick: project ? () => onNavigate('projekte', t.project_id, 'budget') : undefined,
                }
            });

        return [...projectItems, ...wikiItems, ...timeItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 15); // Limit to latest 15 items
    }, [projects, timeEntries, wikiArticles, users, onNavigate]);

    return (
        <div className="bg-card rounded-lg border border-border shadow-sm">
            <h3 className="text-lg font-semibold p-4 border-b border-border">Letzte Aktivitäten</h3>
            <div className="p-4 space-y-4">
                {feedItems.length > 0 ? feedItems.map(item => (
                    <div key={item.id} className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <Icon name={item.icon} className="w-4 h-4 text-text-light" />
                            </span>
                        </div>
                        <div className="flex-grow min-w-0">
                            <button 
                                onClick={item.onClick} 
                                className={`font-medium text-sm text-left truncate w-full ${item.onClick ? 'hover:underline' : 'cursor-default'}`}
                                disabled={!item.onClick}
                                title={item.title}
                            >
                                {item.title}
                            </button>
                            <p className="text-sm text-text-light truncate" title={item.description}>{item.description}</p>
                            <p className="text-xs text-text-light mt-1">{formatDistanceToNow(item.date)}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-text-light text-center py-8">Keine aktuellen Aktivitäten vorhanden.</p>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
