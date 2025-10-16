import React, { useState, FC } from 'react';
import { User, UserRole } from '../../types';
import { USER_ROLES } from '../../constants';

interface UserEditModalProps {
    user: User;
    onClose: () => void;
    onSave: (userId: string, updates: Partial<Pick<User, 'name' | 'role' | 'hourly_rate'>>) => Promise<{ success: boolean; error?: any }>;
}

const UserEditModal: FC<UserEditModalProps> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [role, setRole] = useState<UserRole>(user.role);
    const [hourlyRate, setHourlyRate] = useState(user.hourly_rate || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition";

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        
        const result = await onSave(user.id, { name, role, hourly_rate: hourlyRate });

        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: 'Änderungen erfolgreich gespeichert!' });
            setTimeout(() => {
                onClose();
            }, 1500);
        } else {
            setMessage({ type: 'error', text: 'Fehler beim Speichern. Bitte versuchen Sie es erneut.' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSave} className="p-8">
                    <h3 className="text-xl font-semibold mb-6">Benutzer bearbeiten: {user.name}</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <label htmlFor="edit-name" className="mb-2 font-medium text-text-light text-sm">Vollständiger Name</label>
                            <input type="text" id="edit-name" value={name} onChange={e => setName(e.target.value)} className={commonInputClasses} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label htmlFor="edit-role" className="mb-2 font-medium text-text-light text-sm">Rolle</label>
                                <select id="edit-role" value={role} onChange={e => setRole(e.target.value as UserRole)} className={commonInputClasses}>
                                    {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="edit-hourly_rate" className="mb-2 font-medium text-text-light text-sm">Stundensatz (€)</label>
                                <input type="number" step="0.01" id="edit-hourly_rate" value={hourlyRate} onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)} className={commonInputClasses} />
                            </div>
                        </div>
                        <p className="text-xs text-text-light bg-secondary p-3 rounded-md">Aus Sicherheitsgründen können E-Mail und Passwort hier nicht geändert werden.</p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-md mt-6 text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover" onClick={onClose} disabled={isLoading}>Abbrechen</button>
                        <button type="submit" className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50" disabled={isLoading}>
                            {isLoading ? 'Speichert...' : 'Änderungen speichern'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;