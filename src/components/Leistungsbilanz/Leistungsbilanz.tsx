

import React, { FC } from 'react';

const Leistungsbilanz: FC = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-text">Leistungsbilanz</h2>
            <p className="text-text-light mb-8">Erfassen Sie hier die Leistungsbilanz für ein Projekt.</p>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <p>Der Inhalt für die Leistungsbilanz wird hier implementiert.</p>
            </div>
        </div>
    );
};

export default Leistungsbilanz;