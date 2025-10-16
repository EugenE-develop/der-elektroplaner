import React, { FC, useState, useEffect } from 'react';
// FIX: Import AppearanceSettings from types.ts where it is defined, not from utils.ts
import { User, Theme, AppearanceSettings } from '../../types';
import { applyTheme, applyAppearanceSettings } from '../../utils';
import './Settings.css';
import { useAppContext } from '../../contexts/AppContext';

const THEMES: Theme[] = [
    { name: 'Klassisch Blau', primary: '#0052cc', hover: '#0041a3' },
    { name: 'Waldgrün', primary: '#00875a', hover: '#006644' },
    { name: 'Modern Violett', primary: '#6554C0', hover: '#5243AA' },
    { name: 'Sonnenuntergang Orange', primary: '#FF742E', hover: '#D95A1D' },
];

interface SettingsProps {
    onUpdatePassword: (newPassword: string) => Promise<boolean>;
}

// --- Sub-Components ---
const SettingsCard: FC<{ title: string; children: React.ReactNode; description?: string }> = ({ title, children, description }) => (
    <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-4 sm:p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-text">{title}</h3>
            {description && <p className="text-sm text-text-light mt-1">{description}</p>}
        </div>
        <div className="p-4 sm:p-6 space-y-4">
            {children}
        </div>
    </div>
);

const SegmentedControl: FC<{ options: { label: string; value: string }[]; value: string; onChange: (value: string) => void; }> = ({ options, value, onChange }) => (
    <div className="segmented-control">
        {options.map(opt => (
            <button key={opt.value} onClick={() => onChange(opt.value)} className={value === opt.value ? 'active' : ''}>
                {opt.label}
            </button>
        ))}
    </div>
);

// --- Main Component ---
// FIX: Use named export for Settings component
export const Settings: FC<SettingsProps> = ({ onUpdatePassword }) => {
    const { currentUser, handleUpdateUser } = useAppContext();

    // State
    const [name, setName] = useState(currentUser?.name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [outlookConnection, setOutlookConnection] = useState({ connected: false, email: '' });
    
    // Appearance State
    const [appearance, setAppearance] = useState<AppearanceSettings>({
        mode: (localStorage.getItem('app-theme-mode') as AppearanceSettings['mode']) || 'system',
        fontSize: (localStorage.getItem('app-theme-fontSize') as AppearanceSettings['fontSize']) || 'md',
        density: (localStorage.getItem('app-theme-density') as AppearanceSettings['density']) || 'comfortable',
    });

    useEffect(() => {
        const savedOutlookStatus = localStorage.getItem('outlook_connection');
        if (savedOutlookStatus) {
            setOutlookConnection(JSON.parse(savedOutlookStatus));
        }
    }, []);

    const handleAppearanceChange = (key: keyof AppearanceSettings, value: string) => {
        const newSettings = { ...appearance, [key]: value };
        setAppearance(newSettings);
        applyAppearanceSettings({ [key]: value } as Partial<AppearanceSettings>);
    };

    const handleOutlookConnect = () => {
        console.log('Starting Outlook connection process...');
        const mockConnection = { connected: true, email: currentUser?.email || 'user@example.com' };
        setOutlookConnection(mockConnection);
        localStorage.setItem('outlook_connection', JSON.stringify(mockConnection));
        setMessage({ type: 'success', text: 'Outlook-Kalender erfolgreich verbunden.' });
    };

    const handleOutlookDisconnect = () => {
        console.log('Disconnecting Outlook...');
        const disconnectedState = { connected: false, email: '' };
        setOutlookConnection(disconnectedState);
        localStorage.removeItem('outlook_connection');
        setMessage({ type: 'success', text: 'Verbindung zum Outlook-Kalender wurde getrennt.' });
    };
    
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 transition";

    const handleNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!currentUser || name.trim() === currentUser.name) return;
        try {
            await handleUpdateUser(currentUser.id, { name: name.trim() });
            setMessage({ type: 'success', text: 'Name erfolgreich aktualisiert.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Fehler beim Aktualisieren des Namens.' });
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Die Passwörter stimmen nicht überein.' });
            return;
        }
        const success = await onUpdatePassword(newPassword);
        if (success) {
            setNewPassword('');
            setConfirmPassword('');
            setMessage({ type: 'success', text: 'Passwort erfolgreich geändert.' });
        } else {
             setMessage({ type: 'error', text: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
        }
    };
    
    if (!currentUser) return null;

    return (
        <div className="settings-container p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-text mb-8">Einstellungen</h2>
            
            {message && <div className={`p-4 rounded-md mb-6 text-sm ${message.type === 'success' ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'}`}>{message.text}</div>}

            <div className="settings-grid">
                <SettingsCard title="Profil">
                    <form onSubmit={handleNameUpdate} className="space-y-4">
                        <div className="form-group"><label htmlFor="email" className="form-label">E-Mail</label><input type="email" id="email" value={currentUser.email} readOnly disabled className={`${commonInputClasses} bg-secondary cursor-not-allowed`} /></div>
                        <div className="form-group"><label htmlFor="name" className="form-label">Name</label><input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={commonInputClasses} required /></div>
                        <button type="submit" className="btn-primary mt-2">Namen speichern</button>
                    </form>
                </SettingsCard>
                
                <SettingsCard title="Erscheinungsbild" description="Passen Sie das Aussehen der Anwendung an.">
                    <div className="space-y-4">
                        <div><label className="form-label">Farbschema</label><div className="theme-selector">{THEMES.map(theme => (<div key={theme.name} className="theme-option" onClick={() => applyTheme(theme)}><div className="theme-swatch" style={{ backgroundColor: theme.primary }}></div><span className="theme-name">{theme.name}</span></div>))}</div></div>
                        <div><label className="form-label">Modus</label><SegmentedControl options={[{label: 'Hell', value: 'light'}, {label: 'Dunkel', value: 'dark'}, {label: 'System', value: 'system'}]} value={appearance.mode} onChange={(v) => handleAppearanceChange('mode', v)} /></div>
                        <div><label className="form-label">Schriftgröße</label><SegmentedControl options={[{label: 'Klein', value: 'sm'}, {label: 'Normal', value: 'md'}, {label: 'Groß', value: 'lg'}]} value={appearance.fontSize} onChange={(v) => handleAppearanceChange('fontSize', v)} /></div>
                        <div><label className="form-label">Layout-Dichte</label><SegmentedControl options={[{label: 'Komfortabel', value: 'comfortable'}, {label: 'Kompakt', value: 'compact'}]} value={appearance.density} onChange={(v) => handleAppearanceChange('density', v)} /></div>
                    </div>
                </SettingsCard>

                <SettingsCard title="Passwort ändern">
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div className="form-group"><label htmlFor="new-password">Neues Passwort</label><input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={commonInputClasses} placeholder="Mind. 6 Zeichen" required /></div>
                        <div className="form-group"><label htmlFor="confirm-password">Passwort bestätigen</label><input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={commonInputClasses} required /></div>
                        <button type="submit" className="btn-primary mt-2">Passwort speichern</button>
                    </form>
                </SettingsCard>

                <SettingsCard title="Sicherheit & Datenschutz">
                     <div className="space-y-4">
                         <div><h4 className="font-semibold text-base mb-2">Zwei-Faktor-Authentifizierung (2FA)</h4><p className="text-sm text-text-light mb-3">Schützen Sie Ihr Konto zusätzlich mit einer Authenticator-App.</p><button className="btn-secondary text-sm">2FA einrichten</button></div>
                         <div className="pt-4 border-t border-border"><h4 className="font-semibold text-base mb-2">Aktive Sitzungen</h4><ul className="text-sm space-y-2"><li className="session-item"><div><strong>Dieses Gerät</strong><p className="text-xs text-text-light">Chrome, Windows</p></div></li><li className="session-item"><div><strong>iPhone 14 Pro</strong><p className="text-xs text-text-light">Safari, Gestern</p></div><button className="text-danger text-xs font-medium hover:underline">Abmelden</button></li></ul></div>
                         <div className="pt-4 border-t border-border"><h4 className="font-semibold text-base mb-2">Datenexport</h4><button className="btn-secondary text-sm">Meine Daten exportieren</button></div>
                    </div>
                </SettingsCard>

                <SettingsCard title="Benachrichtigungen">
                    <div className="notification-row"><span className="font-medium text-sm">Neue Aufgabe</span><div className="checkbox-group"><label><input type="checkbox" className="h-4 w-4 accent-primary"/> In-App</label><label><input type="checkbox" className="h-4 w-4 accent-primary"/> E-Mail</label></div></div>
                    <div className="notification-row"><span className="font-medium text-sm">Fällige Frist</span><div className="checkbox-group"><label><input type="checkbox" className="h-4 w-4 accent-primary"/> In-App</label><label><input type="checkbox" className="h-4 w-4 accent-primary"/> E-Mail</label></div></div>
                    <div className="notification-row"><span className="font-medium text-sm">Wöchentliche Zusammenfassung</span><div className="checkbox-group"><label><input type="checkbox" className="h-4 w-4 accent-primary" disabled/> In-App</label><label><input type="checkbox" className="h-4 w-4 accent-primary"/> E-Mail</label></div></div>
                     <div className="pt-4 border-t border-border"><h4 className="font-semibold text-base mb-2">Bitte nicht stören</h4><div className="flex items-center gap-2 text-sm text-text-light">Von <input type="time" className={`${commonInputClasses} w-28`}/> bis <input type="time" className={`${commonInputClasses} w-28`}/></div></div>
                </SettingsCard>
                
                <SettingsCard title="Verbundene Konten">
                    <div className="space-y-4">
                        <div className="bg-secondary p-4 rounded-md">
                             <h4 className="font-semibold text-base mb-1">Outlook Kalender</h4>
                             {outlookConnection.connected ? (<div className="flex justify-between items-center"><div><p className="text-sm text-success font-medium">Verbunden</p><p className="text-xs text-text-light">{outlookConnection.email}</p></div><button onClick={handleOutlookDisconnect} className="btn-secondary !bg-red-50 !border-red-200 !text-danger hover:!bg-red-100 text-sm">Trennen</button></div>) : (<div className="flex justify-between items-center"><div><p className="text-sm text-text-light font-medium">Nicht verbunden</p></div><button onClick={handleOutlookConnect} className="btn-primary text-sm">Verbinden</button></div>)}
                        </div>
                        <div className="bg-secondary p-4 rounded-md">
                             <h4 className="font-semibold text-base mb-1">Google Kalender</h4>
                             <div className="flex justify-between items-center"><div><p className="text-sm text-text-light font-medium">Nicht verbunden</p></div><button onClick={() => {}} className="btn-primary text-sm">Verbinden</button></div>
                        </div>
                    </div>
                </SettingsCard>

            </div>
        </div>
    );
};