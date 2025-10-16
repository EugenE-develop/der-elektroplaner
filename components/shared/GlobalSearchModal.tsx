import React, { FC, useState, useEffect, useRef } from 'react';
// FIX: Import TodoItem to correctly type task objects.
import { Project, Contact, WikiArticle, TodoItem } from '../../types';
import { useWikiData } from '../../hooks/useWikiData';
import { useContacts } from '../../hooks/useContacts';
import Icon from './Icon';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string, projectId?: string | null, subView?: string | null, articleId?: number | null) => void;
    projects: Project[];
}

type SearchResult = {
    projects: Project[];
    contacts: Contact[];
    // FIX: Use the specific TodoItem type for better type safety.
    todos: { task: TodoItem; project: Project }[];
    wiki: WikiArticle[];
}

const GlobalSearchModal: FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate, projects }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: contacts = [] } = useContacts();
    const { data: wikiData } = useWikiData();
    const wikiArticles = wikiData?.articles || [];

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults(null);
        }
    }, [isOpen]);

    // Debounced search effect
    useEffect(() => {
        if (!query.trim()) {
            setResults(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const handler = setTimeout(() => {
            const lowerQuery = query.toLowerCase();
            const newResults: SearchResult = {
                projects: [],
                contacts: [],
                todos: [],
                wiki: [],
            };

            // Search Projects
            newResults.projects = projects.filter(p => 
                p.name.toLowerCase().includes(lowerQuery) ||
                p.projectNumber?.toLowerCase().includes(lowerQuery)
            );

            // Search Contacts
            newResults.contacts = contacts.filter(c => 
                c.name.toLowerCase().includes(lowerQuery) ||
                c.company?.toLowerCase().includes(lowerQuery)
            );

            // Search Todos
            projects.forEach(p => {
                if (p.todos && p.todos.tasks) {
                    // FIX: Explicitly type 'task' as 'TodoItem' to resolve the 'unknown' type error.
                    Object.values(p.todos.tasks).forEach((task: TodoItem) => {
                        if (task && task.title && task.title.toLowerCase().includes(lowerQuery)) {
                            newResults.todos.push({ task, project: p });
                        }
                    });
                }
            });

            // Search Wiki
            newResults.wiki = wikiArticles.filter(a => 
                a.title.toLowerCase().includes(lowerQuery) ||
                a.content.toLowerCase().includes(lowerQuery)
            );

            setResults(newResults);
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(handler);
    }, [query, projects, contacts, wikiArticles]);
    
     // Keyboard listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    const totalResults = results ? results.projects.length + results.contacts.length + results.todos.length + results.wiki.length : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-auto mt-[10vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex items-center gap-3">
                    <div className="w-6 h-6 text-text-light flex-shrink-0"><Icon name="Search" /></div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Projekte, Kontakte, Aufgaben, Wiki durchsuchen..."
                        className="w-full bg-transparent text-lg focus:outline-none"
                    />
                     <button onClick={onClose} className="text-xs font-semibold text-text-light border border-border rounded px-2 py-1">ESC</button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {isLoading && <p className="p-6 text-center text-text-light">Suche...</p>}
                    {!isLoading && query && results && totalResults > 0 && (
                        <div className="p-2 space-y-2">
                            {results.projects.length > 0 && <div className="result-group"><div className="result-group-title">Projekte</div>{results.projects.map(p => <button key={p.id} onClick={() => { onNavigate('projekte', p.id); onClose(); }} className="result-item"><span>{p.name}</span> <span className="text-text-light text-xs">{p.projectNumber}</span></button>)}</div>}
                            {results.contacts.length > 0 && <div className="result-group"><div className="result-group-title">Kontakte</div>{results.contacts.map(c => <button key={c.id} onClick={() => { onNavigate('kontakte'); onClose(); }} className="result-item"><span>{c.name}</span> <span className="text-text-light text-xs">{c.company}</span></button>)}</div>}
                            {results.todos.length > 0 && <div className="result-group"><div className="result-group-title">Aufgaben</div>{results.todos.map(t => <button key={t.task.id} onClick={() => { onNavigate('projekte', t.project.id, 'todo'); onClose(); }} className="result-item"><span>{t.task.title}</span> <span className="text-text-light text-xs">in: {t.project.name}</span></button>)}</div>}
                            {results.wiki.length > 0 && <div className="result-group"><div className="result-group-title">Wiki</div>{results.wiki.map(w => <button key={w.id} onClick={() => { onNavigate('wiki', null, null, w.id); onClose(); }} className="result-item"><span>{w.title}</span></button>)}</div>}
                        </div>
                    )}
                     {!isLoading && query && (!results || totalResults === 0) && <p className="p-6 text-center text-text-light">Keine Ergebnisse für "{query}" gefunden.</p>}
                     {!query && <p className="p-6 text-center text-text-light">Beginnen Sie mit der Eingabe, um zu suchen.</p>}
                </div>
            </div>
            <style>{`
                .result-group { padding: 0.5rem; }
                .result-group-title { font-size: 0.75rem; font-weight: 600; color: var(--text-light-color); padding: 0.25rem 0.75rem; margin-bottom: 0.25rem; text-transform: uppercase; }
                .result-item { display: flex; justify-content: space-between; align-items: center; width: 100%; text-align: left; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.9rem; }
                .result-item:hover, .result-item:focus { background-color: var(--secondary); outline: none; }
            `}</style>
        </div>
    );
};

export default GlobalSearchModal;