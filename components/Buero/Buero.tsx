

import React, { FC, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import Abwesenheiten from './Abwesenheiten';
import Posteingang from './Posteingang';
import FristenVertraege from './FristenVertraege';
import Inventarverwaltung from './Inventarverwaltung';
import Mahnwesen from './Mahnwesen';

type BueroView = 'abwesenheiten' | 'post' | 'fristen' | 'inventar' | 'mahnwesen';

const Buero: FC = () => {
    const { currentUser, users, projects } = useAppContext();
    const [activeView, setActiveView] = useState<BueroView>('abwesenheiten');

    const sidebarItems = [
        { id: 'abwesenheiten', label: 'Abwesenheiten' },
        { id: 'post', label: 'Posteingang/-ausgang' },
        { id: 'fristen', label: 'Fristen & Verträge' },
        { id: 'inventar', label: 'Inventarverwaltung' },
        { id: 'mahnwesen', label: 'Mahnwesen' },
    ];
    
    if (!currentUser) return null;

    const renderContent = () => {
        switch (activeView) {
            case 'abwesenheiten':
                return <Abwesenheiten currentUser={currentUser} users={users} />;
            case 'post':
                return <Posteingang currentUser={currentUser} users={users} projects={projects} />;
            case 'fristen':
                return <FristenVertraege currentUser={currentUser} users={users} />;
            case 'inventar':
                return <Inventarverwaltung currentUser={currentUser} users={users} />;
            case 'mahnwesen':
                return <Mahnwesen />;
            default:
                return null;
        }
    };
    
    return (
         <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-text">Büroorganisation</h2>
            <p className="text-text-light mb-6">Zentrale Verwaltung für interne Prozesse.</p>
            <div className="md:grid md:grid-cols-4 md:gap-8">
                <aside className="border-b md:border-b-0 md:border-r border-border pb-4 mb-4 md:pb-0 md:mb-0 md:pr-6">
                    <nav><ul className="flex flex-row flex-wrap md:flex-col gap-2">
                        {sidebarItems.map(item => (
                            <li key={item.id}>
                                <button onClick={() => setActiveView(item.id as BueroView)} className={`w-full text-left p-2.5 rounded-md font-medium text-sm transition-colors ${activeView === item.id ? 'bg-primary text-white' : 'hover:bg-secondary'}`}>
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul></nav>
                </aside>
                <main className="md:col-span-3">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Buero;