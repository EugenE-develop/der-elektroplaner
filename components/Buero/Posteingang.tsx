import React, { FC } from 'react';
import { MailLogEntry, User, Project } from '../../types';
import { useOfficeData } from '../../hooks/useOfficeData';

interface PosteingangProps {
    currentUser: User;
    users: User[];
    projects: Project[];
}

const Posteingang: FC<PosteingangProps> = ({ users, projects }) => {
    const { data: officeData, isLoading, isError } = useOfficeData();
    const mailLog = officeData?.mailLog || [];

    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'N/A';
    const getProjectName = (id: string | null | undefined) => {
        if (!id) return '-';
        return projects.find(p => p.id === id)?.name || 'N/A';
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-text">Digitaler Posteingang & -ausgang</h2>
                <p className="text-text-light">Protokollieren Sie hier den gesamten Postverkehr.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow">
                 <h3 className="font-semibold text-lg mb-4">Protokoll</h3>
                 <p className="text-sm text-text-light mb-4">Hinweis: Das Hinzufügen und Bearbeiten von Einträgen ist in diesem Schritt noch nicht implementiert.</p>
                 
                {isLoading ? <p>Lade Protokoll...</p> : isError ? <p className="text-danger">Fehler beim Laden des Protokolls.</p> :
                 <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-3 font-semibold">Richtung</th>
                                <th className="p-3 font-semibold">Datum (Brief)</th>
                                <th className="p-3 font-semibold">Absender/Empfänger</th>
                                <th className="p-3 font-semibold">Betreff</th>
                                <th className="p-3 font-semibold">Projekt</th>
                                <th className="p-3 font-semibold">Bearbeiter</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {mailLog.map(entry => (
                                <tr key={entry.id} className="hover:bg-secondary-hover">
                                    <td className="p-3">{entry.direction}</td>
                                    <td className="p-3">{new Date(entry.mail_date).toLocaleDateString('de-DE')}</td>
                                    <td className="p-3">{entry.sender_or_recipient}</td>
                                    <td className="p-3">{entry.subject}</td>
                                    <td className="p-3">{getProjectName(entry.related_project_id)}</td>
                                    <td className="p-3">{getUserName(entry.processed_by_user_id)}</td>
                                </tr>
                            ))}
                            {mailLog.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-text-light">Keine Einträge vorhanden.</td></tr>}
                        </tbody>
                    </table>
                 </div>
                }
            </div>
        </div>
    );
}

export default Posteingang;