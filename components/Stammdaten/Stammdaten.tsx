

import React, { FC } from 'react';
import LeistungsphasenEditor from './LeistungsphasenEditor';
import FirmendatenEditor from './FirmendatenEditor';
import ChecklistTemplateEditor from './ChecklistTemplateEditor';
import './Stammdaten.css';

const Stammdaten: FC = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl font-semibold">Stammdaten</h2>
            <p className="text-text-light mb-8">Verwalten Sie hier die zentralen Daten der Anwendung.</p>
            <div className="space-y-8 max-w-6xl mx-auto">
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                    <FirmendatenEditor />
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                    <ChecklistTemplateEditor />
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                    <LeistungsphasenEditor />
                </div>
            </div>
        </div>
    );
};

export default Stammdaten;