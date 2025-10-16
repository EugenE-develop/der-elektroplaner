
import React, { FC } from 'react';
import { useAdminData } from '../../hooks/useAdminData';

const Systemprotokoll: FC = () => {
    const { data, isLoading } = useAdminData();
    const auditLog = data?.auditLog || [];

    return (
        <div className="p-8">
            <h2 className="text-2xl font-semibold">Systemprotokoll</h2>
            <p className="text-text-light mb-6">Zeigt die letzten 100 Aktionen im System an.</p>
            {isLoading ? <p>Lade Protokoll...</p> : (
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 font-semibold">Zeitpunkt</th>
                            <th className="p-3 font-semibold">Benutzer</th>
                            <th className="p-3 font-semibold">Aktion</th>
                            <th className="p-3 font-semibold">Ziel</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {auditLog.map(entry => (
                            <tr key={entry.id}>
                                <td className="p-3">{new Date(entry.created_at).toLocaleString('de-DE')}</td>
                                <td className="p-3">{entry.user_name || 'System'}</td>
                                <td className="p-3">{entry.action}</td>
                                <td className="p-3">{entry.target_type} ({entry.target_id})</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    );
};

export default Systemprotokoll;
