import React, { FC, useState } from 'react';
// FIX: Changed import to be a relative path.
import { Project } from '../../types';
import { VIEW_LABELS, SUBVIEW_LABELS } from '../../constants';

interface BreadcrumbProps {
    activeView: string;
    activeProjectSubView: string;
    selectedProject: Project | null;
    onNavigate: (view: string, projectId?: string | null, subView?: string | null) => void;
}

const Breadcrumb: FC<BreadcrumbProps> = ({ activeView, activeProjectSubView, selectedProject, onNavigate }) => {
    const [copyStatus, setCopyStatus] = useState('');

    type Crumb = {
        label: string;
        onClick?: () => void;
    };

    const crumbs: Crumb[] = [];

    // Home is always first
    crumbs.push({ label: 'Home', onClick: () => onNavigate('dashboard') });

    const viewLabel = VIEW_LABELS[activeView] || activeView;
    if (activeView !== 'dashboard') {
        crumbs.push({ label: viewLabel, onClick: () => onNavigate(activeView) });
    }

    if (selectedProject) {
        crumbs.push({ label: selectedProject.name, onClick: () => onNavigate('projekte', selectedProject.id, 'overview') });
    }

    if (selectedProject && activeProjectSubView !== 'overview') {
        const subViewLabel = SUBVIEW_LABELS[activeProjectSubView] || activeProjectSubView;
        crumbs.push({ label: subViewLabel, onClick: () => onNavigate('projekte', selectedProject.id, activeProjectSubView) });
    }

    // The last crumb should not be clickable.
    if (crumbs.length > 0) {
        delete crumbs[crumbs.length - 1].onClick;
    }


    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopyStatus('Kopiert!');
            setTimeout(() => setCopyStatus(''), 2000);
        }, () => {
            setCopyStatus('Fehler!');
            setTimeout(() => setCopyStatus(''), 2000);
        });
    };

    return (
        <div className="bg-secondary border-b border-border px-4 sm:px-6 lg:px-8 py-2 text-sm flex justify-between items-center print:hidden">
            <nav aria-label="breadcrumb">
                <ol className="flex items-center space-x-2 text-text-light flex-wrap">
                    {crumbs.map((crumb, index) => (
                        <li key={index} className="flex items-center">
                            {index > 0 && (
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                            )}
                            {crumb.onClick ? (
                                <button onClick={crumb.onClick} className="hover:underline hover:text-primary bg-transparent border-none p-0 m-0 cursor-pointer font-inherit text-current">
                                    {crumb.label}
                                </button>
                            ) : (
                                <span className="font-medium text-text truncate max-w-[150px] sm:max-w-none">{crumb.label}</span>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>
            <button onClick={handleCopyLink} className="flex items-center gap-2 text-xs font-medium text-text-light hover:text-primary p-1 rounded-md transition-colors flex-shrink-0">
                 {copyStatus ? (
                    <span className="text-primary">{copyStatus}</span>
                 ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                        <span className="hidden sm:inline">Link teilen</span>
                    </>
                 )}
            </button>
        </div>
    );
};

export default Breadcrumb;