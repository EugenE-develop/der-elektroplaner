import React, { FC } from 'react';
import { Project, User } from '../../../types';

interface ConstructionDiaryProps {
    project: Project;
    onUpdateProject: (id: string, updates: Partial<Project>) => void;
    users: User[];
}

const ConstructionDiary: FC<ConstructionDiaryProps> = ({ project, onUpdateProject, users }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold pb-4 border-b border-border mb-4">Bautagebuch</h3>
            <div className="bg-card p-6 rounded-lg shadow-sm">
                <p>Funktionalität für Bautagebuch ist in Entwicklung.</p>
            </div>
        </div>
    );
};

export default ConstructionDiary;