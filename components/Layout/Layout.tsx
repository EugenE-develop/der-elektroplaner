import React, { FC, ReactNode, useState } from 'react';
import { User, Project, RecentItem } from '../../types';
import Header from './Header';
import Footer from './Footer';
import Breadcrumb from './Breadcrumb';
import FABs from '../FABs/FABs';
import { Sidebar } from './Sidebar';
import AIChat from '../AIChat/AIChat';
import ErrorToast from '../shared/ErrorToast';
import MobileBottomNav from './MobileBottomNav';
import SuggestedActionToast from '../shared/SuggestedActionToast';
import GlobalSearchModal from '../shared/GlobalSearchModal';

const DbErrorBanner = () => (
    <div className="bg-red-100 border-b-2 border-danger text-danger p-4 text-sm z-30 print:hidden">
        <div className="max-w-7xl mx-auto flex items-start gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
                <h3 className="font-bold text-base">Datenbank-Konfigurationsfehler</h3>
                <p className="mt-1">
                    Die kritische Tabelle 'users' konnte nicht gefunden werden. Die Anwendung läuft in einem eingeschränkten Modus.
                    Ein Administrator muss die Tabelle in der Supabase-Datenbank erstellen, um die volle Funktionalität wiederherzustellen.
                </p>
                <details className="mt-2 text-xs">
                    <summary className="font-medium cursor-pointer hover:underline">SQL zur Tabellenerstellung anzeigen</summary>
                    <pre className="bg-red-200 text-red-900 p-3 rounded mt-2 overflow-auto font-mono text-[11px]">
{`-- Benötigte Tabelle 'users' erstellen
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text NULL,
  email text NULL,
  role text NULL,
  hourly_rate numeric NULL,
  created_at timestamptz NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS-Richtlinien für die 'users' Tabelle aktivieren
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Richtlinie, die es Benutzern erlaubt, ihr eigenes Profil zu sehen
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);

-- Richtlinie, die es Benutzern erlaubt, ihr eigenes Profil zu aktualisieren
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Richtlinie, die es allen authentifizierten Benutzern erlaubt, die Profile anderer zu lesen (für Namensanzeige etc.)
CREATE POLICY "Authenticated users can view all user profiles." ON public.users FOR SELECT TO authenticated USING (true);`}
                    </pre>
                </details>
            </div>
        </div>
    </div>
);

interface LayoutProps {
    children: ReactNode; 
    currentUser: User | null; 
    activeView: string; 
    setActiveView: (view: string, projectId?: string | null, subView?: string | null, articleId?: number | null) => void; 
    selectedProject: Project | null; 
    activeProjectSubView: string; 
    users: User[]; 
    projects: Project[]; 
    onToggleMobileMenu: () => void; 
    isDbMisconfigured: boolean; 
    getRecentItems: () => RecentItem[];
}


const Layout: FC<LayoutProps> = ({ children, onToggleMobileMenu, isDbMisconfigured, getRecentItems, setActiveView, ...props }) => {
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Render a restricted view if DB is misconfigured but we need to show the error
    if (isDbMisconfigured && !props.currentUser) {
         return (
             <div className="flex h-screen bg-background font-sans text-text">
                 <div className="flex flex-1 flex-col overflow-hidden">
                     <DbErrorBanner />
                     <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-8 text-center text-text-light">
                         <p>Bitte kontaktieren Sie den Systemadministrator.</p>
                     </main>
                 </div>
             </div>
         );
    }
    
    if (!props.currentUser) {
        // This case should ideally not be hit if the routing in App.tsx is correct,
        // but as a fallback, we render nothing to avoid crashes.
        return null;
    }

    return (
        <div className="flex h-screen bg-background font-sans text-text">
            <Sidebar activeView={props.activeView} setActiveView={setActiveView} currentUser={props.currentUser} className="hidden md:flex" />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header 
                    currentUser={props.currentUser} 
                    onNavigate={setActiveView} 
                    onToggleMobileMenu={onToggleMobileMenu}
                    getRecentItems={getRecentItems}
                    onToggleSearch={() => setIsSearchOpen(p => !p)}
                />
                {isDbMisconfigured && <DbErrorBanner />}
                <Breadcrumb 
                    activeView={props.activeView} 
                    selectedProject={props.selectedProject} 
                    activeProjectSubView={props.activeProjectSubView}
                    onNavigate={setActiveView}
                />
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background md:pb-0 pb-16">
                    {children}
                </main>
                <Footer />
                <ErrorToast />
                <FABs 
                    currentUser={props.currentUser} 
                    users={props.users} 
                    projects={props.projects} 
                    onOpenAiChat={() => setIsAiChatOpen(true)}
                />
                {isAiChatOpen && <AIChat 
                    onClose={() => setIsAiChatOpen(false)} 
                    projects={props.projects} 
                    users={props.users} 
                />}
                <GlobalSearchModal 
                    isOpen={isSearchOpen} 
                    onClose={() => setIsSearchOpen(false)}
                    onNavigate={setActiveView}
                    projects={props.projects}
                />
                <MobileBottomNav 
                    activeView={props.activeView} 
                    setActiveView={setActiveView}
                    onOpenMenu={onToggleMobileMenu}
                />
                <SuggestedActionToast />
            </div>
        </div>
    );
};

export default Layout;