import React, { useState, useEffect, FC, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import './index.css';

import { supabase } from './supabaseClient';
import { User, Project, RecentItem } from './types';
import { DataProvider } from './contexts/DataProvider';
import { useAppContext } from './contexts/AppContext';
import { loadAndApplyInitialAppearance } from './utils';
import { useProjectRealtimeData } from './hooks/useProjectRealtimeData';
import { VIEW_LABELS, SUBVIEW_LABELS, USER_ROLES } from './constants';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';

// Components
import LoginScreen from './components/LoginScreen/LoginScreen';
import Layout from './components/Layout/Layout';
import { MobileSidebar, Sidebar } from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import HOAIRechner from './components/HOAIRechner/HOAIRechner';
import Leistungsbilanz from './components/Leistungsbilanz/Leistungsbilanz';
import Fragenkatalog from './components/Fragenkatalog/Fragenkatalog';
import ProjectManagement from './components/ProjectManagement/ProjectManagement';
import ProjectTimeline from './components/ProjectTimeline/ProjectTimeline';
import Wiki from './components/Wiki/Wiki';
import UserManagement from './components/UserManagement/UserManagement';
import { Settings } from './components/Settings/Settings';
import Contacts from './components/Contacts/Contacts';
import DocumentTemplates from './components/DocumentTemplates/DocumentTemplates';
import Finance from './components/Finance/Finance';
import Berichte from './components/Berichte/Berichte';
import Stammdaten from './components/Stammdaten/Stammdaten';
import Systemeinstellungen from './components/Systemeinstellungen/Systemeinstellungen';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import ErrorFallback from './components/shared/ErrorFallback';
import AnalyseCenter from './components/AnalyseCenter/AnalyseCenter';
import Zeiterfassung from './components/Zeiterfassung/Zeiterfassung';
import Buero from './components/Buero/Buero';
import Systemprotokoll from './components/Systemprotokoll/Systemprotokoll';
import Integrationen from './components/Integrationen/Integrationen';
import Rollenverwaltung from './components/Rollenverwaltung/Rollenverwaltung';
import CostAnalysis from './components/CostAnalysis/CostAnalysis';

const queryClient = new QueryClient();

// This component holds the main view logic and can access the data context
const AppContent: FC<{isDbMisconfigured: boolean}> = ({ isDbMisconfigured }) => {
    const { projects, users, currentUser } = useAppContext();
    const { addRecentItem, getRecentItems } = useRecentlyViewed();

    // State for navigation
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [activeProjectSubView, setActiveProjectSubView] = useState('overview');
    const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Enable realtime data sync for projects
    useProjectRealtimeData();

    const handleNavigation = (view: string, projectId: string | null = null, subView: string | null = null, articleId: number | null = null) => {
        setActiveView(view);
        setSelectedProjectId(projectId);
        const effectiveSubView = subView || 'overview';
        setActiveProjectSubView(effectiveSubView);
        setSelectedArticleId(articleId); // Set the article ID for the Wiki
        setIsMobileMenuOpen(false);

        // Don't add dashboard to recent items
        if (view === 'dashboard') return;

        let newItem: RecentItem;

        if (view === 'projekte' && projectId) {
            const project = projects.find(p => p.id === projectId);
            if (project) {
                const subViewLabel = SUBVIEW_LABELS[effectiveSubView] || effectiveSubView;
                newItem = {
                    type: 'project',
                    id: `project-${project.id}-${effectiveSubView}`,
                    label: `${project.name} > ${subViewLabel}`,
                    view: 'projekte',
                    projectId: project.id,
                    subView: effectiveSubView,
                };
                addRecentItem(newItem);
            }
        } else {
            const viewLabel = VIEW_LABELS[view] || view;
            newItem = {
                type: 'page',
                id: `page-${view}`,
                label: viewLabel,
                view: view,
            };
            addRecentItem(newItem);
        }
    };
    
    const handleUpdatePassword = async (newPassword: string): Promise<boolean> => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            console.error("Error updating password:", error);
            // Ideally, use the context's addError function here
            return false;
        }
        return true;
    };
    
    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard onNavigate={handleNavigation} />;
            case 'hoai': return <HOAIRechner />;
            case 'leistungsbilanz': return <Leistungsbilanz />;
            case 'fragenkatalog': return <Fragenkatalog />;
            case 'projekte': return <ProjectManagement selectedProjectId={selectedProjectId} onSelectProject={(id) => handleNavigation('projekte', id)} onClearSelection={() => handleNavigation('projekte')} activeSubView={activeProjectSubView} onNavigateSubView={(subView) => handleNavigation('projekte', selectedProjectId, subView)} />;
            case 'projektauslastung': return <ProjectTimeline />;
            case 'wiki': return <Wiki selectedArticleId={selectedArticleId} />;
            case 'benutzer': return <UserManagement />;
            case 'einstellungen': return <Settings onUpdatePassword={handleUpdatePassword} />;
            case 'kontakte': return <Contacts />;
            case 'dokumentvorlagen': return <DocumentTemplates />;
            case 'finanzen': return <Finance />;
            case 'berichte': return <Berichte />;
            case 'stammdaten': return <Stammdaten />;
            case 'systemeinstellungen': return <Systemeinstellungen />;
            case 'admin-dashboard': return <AdminDashboard />;
            case 'analyse': return <AnalyseCenter />;
            case 'zeiterfassung': return <Zeiterfassung />;
            case 'buero': return <Buero />;
            case 'systemprotokoll': return <Systemprotokoll />;
            case 'integrationen': return <Integrationen />;
            case 'rollen': return <Rollenverwaltung />;
            case 'kostenanalyse': return <CostAnalysis projects={projects} />;
            default: return <Dashboard onNavigate={handleNavigation} />;
        }
    };

    return (
        <>
            <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
                 <Sidebar activeView={activeView} setActiveView={handleNavigation} currentUser={currentUser} />
            </MobileSidebar>
            <Layout 
                currentUser={currentUser} 
                activeView={activeView}
                setActiveView={handleNavigation}
                selectedProject={projects.find(p => p.id === selectedProjectId) || null}
                activeProjectSubView={activeProjectSubView}
                users={users}
                projects={projects}
                onToggleMobileMenu={() => setIsMobileMenuOpen(p => !p)}
                isDbMisconfigured={isDbMisconfigured}
                getRecentItems={getRecentItems}
            >
                {renderActiveView()}
            </Layout>
        </>
    );
};


const App: FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDbMisconfigured, setIsDbMisconfigured] = useState(false);

    useEffect(() => {
        loadAndApplyInitialAppearance();
        let isMounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) {
                setSession(session);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isMounted) {
                setSession(session);
            }
        });
        
        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        if (session) {
            supabase
                .from('users')
                .select('id, name, email, role, hourly_rate')
                .eq('id', session.user.id)
                .maybeSingle()
                .then(({ data, error }) => {
                    if (!isMounted) return;
                    
                    if (error) {
                        console.error("Error fetching user profile on session change:", error);
                        if (error.code === '42P01') setIsDbMisconfigured(true);
                        setCurrentUser({
                            id: session.user.id,
                            name: session.user.email || 'Error User',
                            email: session.user.email || '',
                            role: 'Systemplaner',
                        });
                    } else if (data) {
                         setCurrentUser({
                            id: data.id,
                            name: data.name || 'Unbenannter Benutzer',
                            email: data.email || '',
                            role: USER_ROLES.includes(data.role) ? data.role : 'Systemplaner',
                            hourly_rate: data.hourly_rate
                        });
                    } else {
                        console.warn(`No profile found in 'public.users' for auth user ${session.user.id} on session change.`);
                        setCurrentUser({
                            id: session.user.id,
                            name: session.user.email || 'Profil nicht gefunden',
                            email: session.user.email || '',
                            role: 'Systemplaner',
                        });
                    }
                    setIsLoading(false);
                });
        } else {
            setCurrentUser(null);
            setIsLoading(false);
        }

        return () => { isMounted = false; };
    }, [session]);


    if (isLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-text">
                <div className="animate-pulse-slow mb-4 h-16 w-16 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <p className="text-lg font-medium text-text-light">Lade Anwendung...</p>
            </div>
        );
    }

    if (!session || !currentUser) {
        return <LoginScreen />;
    }

    return (
        <DataProvider currentUser={currentUser}>
            <AppContent isDbMisconfigured={isDbMisconfigured}/>
        </DataProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <App />
            </ErrorBoundary>
        </QueryClientProvider>
    </React.StrictMode>
);
