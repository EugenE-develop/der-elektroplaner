


import React, { useState, FC } from 'react';
// FIX: Changed import to be a relative path.
import { User, UserRole } from '../../types';
import { USER_ROLES } from '../../constants';
import UserEditModal from './UserEditModal';
import { useAppContext } from '../../contexts/AppContext';

interface UserManagementProps {}

const UserManagement: FC<UserManagementProps> = () => {
    const { users, currentUser, handleCreateUser, handleUpdateUser, handleDeleteUser } = useAppContext();
    
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('Systemplaner');
    const [isLoading, setIsLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newEmail.trim()) {
            alert('Bitte füllen Sie Name und E-Mail aus.');
            return;
        }
        if (newPassword.length < 6) {
            alert('Das Passwort muss mindestens 6 Zeichen lang sein.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('Die Passwörter stimmen nicht überein.');
            return;
        }
        setIsLoading(true);
        await handleCreateUser({ name: newName, email: newEmail, password: newPassword, role: newRole });
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setNewRole('Systemplaner');
        setIsLoading(false);
    };

    const handleDelete = async (userId: string, userName: string) => {
        if (window.confirm(`Möchten Sie den Benutzer "${userName}" wirklich löschen? Der Auth-Eintrag bleibt aus Sicherheitsgründen bestehen, das Profil wird aber entfernt.`)) {
            await handleDeleteUser(userId);
        }
    };
    
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition";

    if (!currentUser) return null;

    return (
        <div className="bg-card md:rounded-lg md:shadow-lg p-4 sm:p-6 md:p-10 w-full max-w-5xl mx-auto">
            {editingUser && <UserEditModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdateUser} />}
            
            <h2 className="text-center text-2xl font-semibold text-text mb-2">Benutzerverwaltung</h2>
            <p className="text-center text-text-light mb-10">Hier können Sie neue Benutzer anlegen und deren Rollen verwalten.</p>

            <div className="bg-slate-50 border border-border rounded-lg p-6 mb-10">
                <h3 className="font-semibold text-lg mb-6">Neuen Benutzer erstellen</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col">
                            <label htmlFor="new-name" className="mb-2 font-medium text-text-light text-sm">Vollständiger Name</label>
                            <input type="text" id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="z.B. Max Mustermann" className={commonInputClasses} required />
                        </div>
                         <div className="flex flex-col">
                            <label htmlFor="new-email" className="mb-2 font-medium text-text-light text-sm">E-Mail (Login)</label>
                            <input type="email" id="new-email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="z.B. max@firma.de" className={commonInputClasses} required />
                        </div>
                         <div className="flex flex-col">
                            <label htmlFor="new-password" className="mb-2 font-medium text-text-light text-sm">Passwort</label>
                            <input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mind. 6 Zeichen" className={commonInputClasses} required />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="confirm-password" className="mb-2 font-medium text-text-light text-sm">Passwort bestätigen</label>
                            <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Passwort wiederholen" className={commonInputClasses} required />
                        </div>
                         <div className="flex flex-col md:col-span-2">
                            <label htmlFor="new-role" className="mb-2 font-medium text-text-light text-sm">Rolle</label>
                            <select id="new-role" value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className={commonInputClasses}>{USER_ROLES.map(role => (<option key={role} value={role}>{role}</option>))}</select>
                        </div>
                    </div>
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-md">
                        <p><strong>Wichtiger Hinweis:</strong> Damit die Benutzererstellung funktioniert, muss die E-Mail-Bestätigung in den Supabase-Projekteinstellungen deaktiviert sein.</p>
                    </div>
                     <div className="flex justify-start mt-6">
                        <button type="submit" className="py-2 px-6 font-medium rounded-md cursor-pointer transition-all bg-primary text-white hover:enabled:bg-primary-hover hover:enabled:-translate-y-0.5 hover:enabled:shadow-lg disabled:opacity-70" disabled={isLoading}>
                            {isLoading ? 'Wird erstellt...' : 'Benutzer erstellen'}
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4">Bestehende Benutzer</h3>
                <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">E-Mail</th>
                                <th className="p-4 font-semibold">Rolle</th>
                                <th className="p-4 font-semibold">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-secondary-hover transition-colors">
                                    <td className="p-4">{user.name}</td>
                                    <td className="p-4 text-text-light">{user.email}</td>
                                    <td className="p-4 text-text-light italic">{user.role}</td>
                                    <td className="p-4">
                                        <div className="flex gap-4">
                                            <button onClick={() => setEditingUser(user)} className="text-sm font-medium text-primary hover:underline">Bearbeiten</button>
                                            <button 
                                                onClick={() => handleDelete(user.id, user.name)} 
                                                className="text-sm font-medium text-danger hover:underline disabled:text-text-light disabled:cursor-not-allowed disabled:no-underline"
                                                disabled={user.id === currentUser.id}
                                                title={user.id === currentUser.id ? "Sie können sich nicht selbst löschen." : ""}
                                            >
                                                Löschen
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
