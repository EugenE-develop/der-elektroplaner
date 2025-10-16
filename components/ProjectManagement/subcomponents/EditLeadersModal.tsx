import React, { FC, useState, useMemo } from 'react';
import { Project, User } from '../../../types';

interface EditLeadersModalProps {
    project: Project;
    users: User[];
    roleType: 'projectLeiterIds' | 'deputyProjectLeiterIds';
    onClose: () => void;
    onSave: (updates: Partial<Project>) => void;
}

const EditLeadersModal: FC<EditLeadersModalProps> = ({ project, users, roleType, onClose, onSave }) => {
    const currentIds = project[roleType] || [];
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentIds));

    const eligibleUsers = useMemo(() => {
        if (roleType === 'projectLeiterIds') {
            return users.filter(u => ['Projektleiter', 'Leitung', 'Geschäftsführung'].includes(u.role));
        }
        return users;
    }, [users, roleType]);

    const handleToggle = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const handleSaveClick = () => {
        onSave({ [roleType]: Array.from(selectedIds) });
        onClose();
    };
    
    const title = roleType === 'projectLeiterIds' ? 'Projektleiter bearbeiten' : 'Stellv. Projektleiter ernennen/bearbeiten';
    const label = roleType === 'projectLeiterIds' ? 'Wählen Sie die Projektleiter aus:' : 'Wählen Sie die Stellvertreter aus:';

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-8">
                    <h3 className="text-xl font-semibold mb-6">{title}</h3>
                    <div className="flex flex-col">
                        <label className="mb-2 font-medium text-text-light text-sm">{label}</label>
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto bg-slate-50 p-3 rounded-md border border-border">
                            {eligibleUsers.map(user => (
                                <div key={user.id} className="flex items-center p-1 rounded hover:bg-secondary-hover">
                                    <input 
                                        type="checkbox" 
                                        id={`user-${user.id}`} 
                                        checked={selectedIds.has(user.id)} 
                                        onChange={() => handleToggle(user.id)} 
                                        className="h-4 w-4 rounded mr-3 accent-primary" 
                                    />
                                    <label htmlFor={`user-${user.id}`} className="flex-grow cursor-pointer">{user.name} <span className="text-xs text-text-light">({user.role})</span></label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover" onClick={onClose}>Abbrechen</button>
                        <button type="button" onClick={handleSaveClick} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">Speichern</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditLeadersModal;