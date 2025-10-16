

import React, { FC, useState, useMemo } from 'react';
import { Invoice, DunningProcess, DunningStatus } from '../../types';
import { formatCurrency } from '../../utils';
import { useFinanceData } from '../../hooks/useFinanceData';
import { useOfficeData, useOfficeMutations } from '../../hooks/useOfficeData';
import { useAppContext } from '../../contexts/AppContext';

const STATUS_COLORS: Record<DunningStatus, string> = {
    Aktiv: 'bg-yellow-100 text-yellow-800',
    Pausiert: 'bg-gray-100 text-gray-800',
    Abgeschlossen: 'bg-green-100 text-green-800',
};

const Mahnwesen: FC = () => {
    const { currentUser } = useAppContext();
    const { data: financeData, isLoading: isFinanceLoading } = useFinanceData();
    const { data: officeData, isLoading: isOfficeLoading } = useOfficeData();
    const { createDunningProcessMutation, updateDunningProcessMutation } = useOfficeMutations();
    
    const invoices = financeData?.invoices || [];
    const dunningProcesses = officeData?.dunningProcesses || [];

    const overdueInvoices = useMemo(() => {
        const processesInvoiceIds = new Set(dunningProcesses.map(p => p.invoice_id));
        return invoices.filter(i => 
            i.status === 'Überfällig' && 
            !processesInvoiceIds.has(i.id)
        );
    }, [invoices, dunningProcesses]);

    const activeProcesses = useMemo(() => {
        return dunningProcesses.map(process => {
            const invoice = invoices.find(i => i.id === process.invoice_id);
            return { ...process, invoice };
        }).filter(p => p.invoice); // Filter out processes where invoice is not found
    }, [dunningProcesses, invoices]);
    
    if (!currentUser) return null;

    const handleStartProcess = (invoiceId: string) => {
        createDunningProcessMutation.mutate({
            invoice_id: invoiceId,
            dunning_level: 0,
            status: 'Aktiv',
            history: [{
                date: new Date().toISOString(),
                level: 0,
                action: 'Mahnprozess gestartet',
                user_name: currentUser.name,
            }]
        });
    };
    
    const handleUpdateProcess = (processId: string, updates: Partial<DunningProcess>) => {
        updateDunningProcessMutation.mutate({ id: processId, ...updates });
    };
    
    const handleNextLevel = (process: DunningProcess & { invoice?: Invoice }) => {
        if (!process.invoice) return;
        const newLevel = process.dunning_level + 1;
        const today = new Date();
        const nextDate = new Date(today.setDate(today.getDate() + 14));
        
        handleUpdateProcess(process.id, {
            dunning_level: newLevel,
            last_dunning_date: today.toISOString(),
            next_dunning_date: nextDate.toISOString(),
            history: [
                ...(process.history || []),
                {
                    date: today.toISOString(),
                    level: newLevel,
                    action: `Mahnstufe ${newLevel} ausgelöst`,
                    user_name: currentUser.name
                }
            ]
        });
    };

    if (isFinanceLoading || isOfficeLoading) {
        return <div className="p-4 sm:p-6 md:p-8"><p className="text-center">Lade Daten für das Mahnwesen...</p></div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-text">Mahnwesen</h2>
                <p className="text-text-light">Verwalten Sie offene Posten und Mahnprozesse.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-4">Überfällige Rechnungen ohne Mahnprozess</h3>
                {overdueInvoices.length > 0 ? (
                    <div className="overflow-x-auto border border-border rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50"><tr>
                                <th className="p-3 font-semibold">Rechnungs-Nr.</th><th className="p-3 font-semibold">Fällig am</th><th className="p-3 font-semibold">Offener Betrag</th><th className="p-3 font-semibold">Aktion</th>
                            </tr></thead>
                            <tbody className="divide-y divide-border">
                                {overdueInvoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td className="p-3 font-medium">{invoice.invoiceNumber}</td>
                                        <td className="p-3 text-danger">{new Date(invoice.dueDate).toLocaleDateString('de-DE')}</td>
                                        <td className="p-3">{formatCurrency(invoice.grossAmount - invoice.amountPaid)}</td>
                                        <td className="p-3">
                                            <button onClick={() => handleStartProcess(invoice.id)} className="py-1 px-3 text-xs font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600">
                                                Mahnprozess starten
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-sm text-text-light">Aktuell keine überfälligen Rechnungen ohne Mahnprozess.</p>}
            </div>

            <div className="bg-card p-6 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-4">Laufende Mahnprozesse</h3>
                 {activeProcesses.length > 0 ? (
                    <div className="overflow-x-auto border border-border rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50"><tr>
                                <th className="p-3 font-semibold">Rechnungs-Nr.</th><th className="p-3 font-semibold">Mahnstufe</th><th className="p-3 font-semibold">Status</th><th className="p-3 font-semibold">Letzte Mahnung</th><th className="p-3 font-semibold">Nächste Fälligkeit</th><th className="p-3 font-semibold">Aktionen</th>
                            </tr></thead>
                            <tbody className="divide-y divide-border">
                                {activeProcesses.map(process => (
                                    <tr key={process.id}>
                                        <td className="p-3 font-medium">{process.invoice?.invoiceNumber}</td>
                                        <td className="p-3 font-bold text-center">{process.dunning_level}</td>
                                        <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full ${STATUS_COLORS[process.status]}`}>{process.status}</span></td>
                                        <td className="p-3">{process.last_dunning_date ? new Date(process.last_dunning_date).toLocaleDateString('de-DE') : '-'}</td>
                                        <td className="p-3">{process.next_dunning_date ? new Date(process.next_dunning_date).toLocaleDateString('de-DE') : '-'}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleNextLevel(process)} disabled={process.status !== 'Aktiv'} className="py-1 px-2 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-50">Nächste Stufe</button>
                                                {process.status === 'Aktiv' 
                                                    ? <button onClick={() => handleUpdateProcess(process.id, { status: 'Pausiert' })} className="text-xs text-yellow-600">Pausieren</button> 
                                                    : <button onClick={() => handleUpdateProcess(process.id, { status: 'Aktiv' })} className="text-xs text-green-600">Fortsetzen</button>
                                                }
                                                <button onClick={() => handleUpdateProcess(process.id, { status: 'Abgeschlossen' })} className="text-xs text-text-light">Abschließen</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-sm text-text-light">Keine aktiven Mahnprozesse.</p>}
            </div>
        </div>
    );
};

export default Mahnwesen;