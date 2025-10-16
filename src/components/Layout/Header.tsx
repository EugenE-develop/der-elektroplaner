import React, { FC, useState, useEffect, useRef } from 'react';
// FIX: Changed import to be a relative path.
import { User, RecentItem } from '../../types';
import { supabase } from '../../supabaseClient';
import Icon from '../shared/Icon';

interface HeaderProps {
    currentUser: User | null;
    onNavigate: (view: string, projectId?: string | null, subView?: string | null) => void;
    onToggleMobileMenu: () => void;
    getRecentItems: () => RecentItem[];
    onToggleSearch: () => void;
}

const Header: FC<HeaderProps> = ({ currentUser, onNavigate, onToggleMobileMenu, getRecentItems, onToggleSearch }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRecentMenuOpen, setIsRecentMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const recentMenuRef = useRef<HTMLDivElement>(null);
    const recentItems = getRecentItems();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (recentMenuRef.current && !recentMenuRef.current.contains(event.target as Node)) {
                setIsRecentMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        setIsMenuOpen(false); // Ensure menu closes
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            // In a real app, you might want to show a toast notification to the user
        }
        // The onAuthStateChange listener in App.tsx will handle redirecting to the login screen.
    };

    return (
        <header className="sticky top-0 z-20 border-b border-border bg-card px-4 sm:px-6 lg:px-8 print:hidden">
            <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onToggleMobileMenu}
                        className="rounded-full p-2 hover:bg-secondary md:hidden"
                        aria-label="Menü öffnen"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <button onClick={() => onNavigate('dashboard')} className="flex flex-shrink-0 items-center gap-2">
                        <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <span className="text-lg font-semibold text-text">HOAI Planer Pro</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Global Search Button */}
                    <button 
                        onClick={onToggleSearch} 
                        className="rounded-full p-2 hover:bg-secondary"
                        title="Globale Suche"
                        aria-label="Globale Suche"
                    >
                        <div className="w-6 h-6 text-text-light">
                            <Icon name="Search" />
                        </div>
                    </button>
                    
                    {/* Recent Items Button */}
                    <div className="relative" ref={recentMenuRef}>
                        <button 
                            onClick={() => setIsRecentMenuOpen(p => !p)} 
                            className="rounded-full p-2 hover:bg-secondary"
                            title="Zuletzt besucht"
                        >
                            <div className="w-6 h-6 text-text-light">
                                <Icon name="History" />
                            </div>
                        </button>
                        {isRecentMenuOpen && (
                            <div className="absolute right-0 z-30 mt-2 w-72 origin-top-right rounded-md border border-border bg-card py-1 shadow-lg">
                                <div className="border-b border-border px-4 py-2 text-sm font-semibold text-text">Zuletzt besucht</div>
                                <div className="py-1">
                                    {recentItems.length > 0 ? (
                                        recentItems.map(item => (
                                            <button 
                                                key={item.id} 
                                                onClick={() => { onNavigate(item.view, item.projectId, item.subView); setIsRecentMenuOpen(false); }}
                                                className="block w-full px-4 py-2 text-left text-sm text-text hover:bg-secondary truncate"
                                                title={item.label}
                                            >
                                                {item.type === 'project' ? <span className="font-semibold text-primary">Projekt:</span> : <span className="font-semibold text-indigo-500">Seite:</span>} {item.label}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-text-light italic">Keine Einträge</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(prev => !prev)} className="flex items-center gap-2 rounded-md p-2 hover:bg-secondary">
                            <div className="min-w-0 text-right sm:block hidden">
                                <p className="truncate text-sm font-medium text-text">{currentUser?.name}</p>
                                <p className="truncate text-xs text-text-light">{currentUser?.role}</p>
                            </div>
                            <svg className={`h-5 w-5 text-text-light transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        
                        {isMenuOpen && (
                             <div className="absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-md border border-border bg-card py-1 shadow-lg">
                                <div className="border-b border-border px-4 py-2 sm:hidden">
                                    <p className="text-sm font-medium text-text">{currentUser?.name}</p>
                                    <p className="text-xs text-text-light">{currentUser?.role}</p>
                                </div>
                                <button
                                    onClick={() => { onNavigate('einstellungen'); setIsMenuOpen(false); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-text hover:bg-secondary"
                                >
                                    Einstellungen
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="block w-full px-4 py-2 text-left text-sm text-text hover:bg-secondary"
                                >
                                    Abmelden
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;