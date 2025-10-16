import React, { FC, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Absence, AbsenceStatus, AbsenceType, User } from '../../types';
import { useOfficeData, useOfficeMutations } from '../../hooks/useOfficeData';
import { v4 as uuidv4 } from 'uuid';

interface AbwesenheitenProps {
    currentUser: User | null;
    users: User[];
}

const ABSENCE_TYPES: AbsenceType[] = ['Urlaub', 'Krankheit', 'Fortbildung', 'Sonstiges'];
const STATUS_COLORS: Record<AbsenceStatus, string> = {
    Beantragt: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Genehmigt: 'bg-green-100 text-green-800 border-green-300',
    Abgelehnt: 'bg-red-100 text-red-800 border-red-300',
};

const absenceSchema = z.object({
    type: z.enum(['Urlaub', 'Krankheit', 'Fortbildung', 'Sonstiges']),
    start_date: z.string().min(1, 'Startdatum ist erforderlich.'),
    end_date: z.string().min(1, 'Enddatum ist erforderlich.'),
    notes: z.string().optional(),
}).refine(data => new Date(data.end_date) >= new Date(data.start_date), {
    message: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    path: ["end_date"],
});

type AbsenceFormInputs = z.infer<typeof absenceSchema>;

const Abwesenheiten: FC<AbwesenheitenProps> = ({ currentUser, users }) => {
    const { data: officeData, isLoading: isDataLoading } = useOfficeData();
    const { createAbsenceMutation, updateAbsenceMutation, deleteAbsenceMutation } = useOfficeMutations();
    const absences = officeData?.absences || [];

    const { register, handleSubmit, formState: { errors }, reset } = useForm<AbsenceFormInputs>({
        resolver: zodResolver(absenceSchema),
        defaultValues: {
            type: 'Urlaub',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            notes: '',
        }
    });
    
    const isManager = useMemo(() => {
        if (!currentUser) return false;
        return ['Admin', 'Geschäftsführung', 'Leitung', 'Büro'].includes(currentUser.role)
    }, [currentUser]);

    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition text-sm";
    
    if (!currentUser) {
        return <div className="p-4 sm:p-6 md:p-8"><p className="text-center text-text-light">Lade Benutzerdaten...</p></div>;
    }

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unbekannt';

    const onSubmit: SubmitHandler<AbsenceFormInputs> = (data) => {
        createAbsenceMutation.mutate({ 
            user_id: currentUser.id,
            type: data.type as AbsenceType, 
            start_date: data.start_date, 
            end_date: data.end_date, 
            notes: data.notes,
            status: 'Beantragt',
        }, {
            onSuccess: () => reset(),
        });
    };

    const handleStatusUpdate = async (absence: Absence, newStatus: AbsenceStatus) => {
        updateAbsenceMutation.mutate({ id: absence.id, status: newStatus, approved_by: currentUser.id });
    };

    const handleDelete = async (absence: Absence) => {
        if(window.confirm(`Möchten Sie den Antrag von ${getUserName(absence.user_id)} wirklich löschen?`)) {
            deleteAbsenceMutation.mutate(absence.id);
        }
    };

    const groupedAbsences = useMemo(() => {
        const grouped: Record<string, Absence[]> = {};
        absences.forEach(absence => {
            const month = new Date(absence.start_date).toLocaleString('de-DE', { year: 'numeric', month: 'long' });
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(absence);
        });
        return Object.entries(grouped).sort(([monthA], [monthB]) => {
            const dateA = new Date(`01 ${monthA.split(' ')[0]} ${monthA.split(' ')[1]}`);
            const dateB = new Date(`01 ${monthB.split(' ')[0]} ${monthB.split(' ')[1]}`);
            return dateB.getTime() - dateA.getTime();
        });
    }, [absences]);
    
    return (
        <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-6 border-b border-border pb-4">Neuen Antrag stellen</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Art der Abwesenheit</label><select {...register('type')} className={commonInputClasses}>{ABSENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-text-light mb-1">Von</label>
                            <input type="date" {...register('start_date')} className={`${commonInputClasses} ${errors.start_date ? 'input-error' : ''}`} />
                            {errors.start_date && <p className="text-danger text-xs mt-1">{errors.start_date.message}</p>}
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-text-light mb-1">Bis</label>
                            <input type="date" {...register('end_date')} className={`${commonInputClasses} ${errors.end_date ? 'input-error' : ''}`} />
                            {errors.end_date && <p className="text-danger text-xs mt-1">{errors.end_date.message}</p>}
                        </div>
                     </div>
                     <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Anmerkungen (optional)</label><textarea {...register('notes')} rows={2} className={commonInputClasses}></textarea></div>
                     <div className="flex justify-end pt-2">
                        <button type="submit" disabled={createAbsenceMutation.isPending} className="py-2 px-6 font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50">{createAbsenceMutation.isPending ? 'Wird gesendet...' : 'Antrag senden'}</button>
                    </div>
                </form>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-4">Abwesenheitskalender</h3>
                {isDataLoading ? <p>Lade Kalender...</p> : 
                <div className="space-y-6">
                    {groupedAbsences.length > 0 ? groupedAbsences.map(([month, monthAbsences]) => (
                        <div key={month}>
                            <h4 className="font-semibold text-text mb-2">{month}</h4>
                            <div className="overflow-x-auto border border-border rounded-lg">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50"><tr>
                                        <th className="p-3 font-semibold">Mitarbeiter</th><th className="p-3 font-semibold">Zeitraum</th><th className="p-3 font-semibold">Art</th><th className="p-3 font-semibold">Status</th><th className="p-3 font-semibold">Aktionen</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {monthAbsences.sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(absence => {
                                            const canManage = isManager || absence.user_id === currentUser.id;
                                            const canDelete = isManager || (absence.user_id === currentUser.id && absence.status === 'Beantragt');
                                            return (
                                            <tr key={absence.id} className="hover:bg-secondary-hover">
                                                <td className="p-3 font-medium">{getUserName(absence.user_id)}</td>
                                                <td className="p-3">{new Date(absence.start_date).toLocaleDateString('de-DE')} - {new Date(absence.end_date).toLocaleDateString('de-DE')}</td>
                                                <td className="p-3">{absence.type}</td>
                                                <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full border ${STATUS_COLORS[absence.status]}`}>{absence.status}</span></td>
                                                <td className="p-3">
                                                    {canManage && (
                                                        <div className="flex gap-2">
                                                            {isManager && absence.status === 'Beantragt' && <>
                                                                <button onClick={() => handleStatusUpdate(absence, 'Genehmigt')} className="text-xs font-medium text-success hover:underline">Genehmigen</button>
                                                                <button onClick={() => handleStatusUpdate(absence, 'Abgelehnt')} className="text-xs font-medium text-danger hover:underline">Ablehnen</button>
                                                            </>}
                                                            {canDelete && <button onClick={() => handleDelete(absence)} className="text-xs font-medium text-danger hover:underline">Löschen</button>}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )) : <p className="text-center p-8 text-text-light">Keine Abwesenheiten erfasst.</p>}
                </div>}
            </div>
        </div>
    );
};

export default Abwesenheiten;