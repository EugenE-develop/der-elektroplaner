import React, { FC, useState, useMemo } from 'react';
import { TimeEntry, User, Project } from '../../types';

interface TimeEntryImportModalProps {
    onClose: () => void;
    onImport: (selectedEntries: TimeEntry[]) => void;
    projectId: string;
    allUsers: User[];
    timeEntries: TimeEntry[];
}

const TimeEntryImportModal: FC<TimeEntryImportModalProps> = ({ onClose, onImport, projectId, allUsers, timeEntries }) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const billableEntries = useMemo(() => {
        return timeEntries
            .filter(entry => entry.project_id === projectId && !entry.invoice_id)
            .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
    }, [timeEntries, projectId]);

    const handleToggle = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleToggleAll = () => {
        if (selectedIds.size === billableEntries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(billableEntries.map(e => e.id)));
        }
    };
    
    const handleImportClick = () => {
        const selectedEntries = billableEntries.filter(entry => selectedIds.has(entry.id));
        onImport(selectedEntries);
    };

    const getUserName = (id: string) => allUsers.find(u => u.id === id)?.name || 'Unbekannt';
    const totalSelectedHours = useMemo(() => {
        return billableEntries
            .filter(e => selectedIds.has(e.id))
            .reduce((sum, e) => sum + e.duration_hours, 0);
    }, [selectedIds, billableEntries]);

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex-shrink-0">
                    <h3 className="text-xl font-semibold">Zeiteinträge importieren</h3>
                </header>
                <main className="flex-grow p-4 overflow-y-auto">
                    {billableEntries.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="p-2 w-10"><input type="checkbox" onChange={handleToggleAll} checked={selectedIds.size === billableEntries.length && billableEntries.length > 0} className="h-4 w-4 rounded accent-primary"/></th>
                                    <th className="p-2 font-semibold">Datum</th>
                                    <th className="p-2 font-semibold">Mitarbeiter</th>
                                    <th className="p-2 font-semibold">Beschreibung</th>
                                    <th className="p-2 font-semibold text-right">Stunden</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {billableEntries.map(entry => (
                                    <tr key={entry.id} className={`hover:bg-secondary-hover ${selectedIds.has(entry.id) ? 'bg-blue-50' : ''}`} onClick={() => handleToggle(entry.id)}>
                                        <td className="p-2"><input type="checkbox" checked={selectedIds.has(entry.id)} readOnly className="h-4 w-4 rounded accent-primary"/></td>
                                        <td className="p-2">{new Date(entry.entry_date).toLocaleDateString('de-DE')}</td>
                                        <td className="p-2">{getUserName(entry.user_id)}</td>
                                        <td className="p-2 truncate max-w-xs">{entry.description}</td>
                                        <td className="p-2 text-right font-medium">{entry.duration_hours.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center p-8 text-text-light">Für dieses Projekt gibt es keine abrechenbaren Zeiteinträge.</p>
                    )}
                </main>
                <footer className="flex-shrink-0 p-4 border-t border-border flex justify-between items-center">
                    <div>
                        <span className="font-semibold">{selectedIds.size} Einträge ausgewählt</span>
                        <span className="ml-4 text-text-light">({totalSelectedHours.toFixed(2)} Stunden)</span>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover" onClick={onClose}>Abbrechen</button>
                        <button type="button" onClick={handleImportClick} disabled={selectedIds.size === 0} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50">Importieren</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default TimeEntryImportModal;