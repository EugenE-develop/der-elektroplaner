import React, { FC } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimeEntry, Project } from '../../types';
import { initialLeistungsphasen } from '../../constants';

const timeEntrySchema = z.object({
    project_id: z.string().min(1, "Projekt ist ein Pflichtfeld."),
    service_phase_id: z.coerce.number().min(1, "Leistungsphase ist ein Pflichtfeld."),
    duration_hours: z.coerce.number().gt(0, "Dauer muss größer als 0 sein."),
    description: z.string().optional(),
});

type TimeEntryFormInputs = z.infer<typeof timeEntrySchema>;

interface TimeEntryModalProps {
    entry: TimeEntry | null;
    selectedDate: Date;
    onClose: () => void;
    onSave: (entry: Omit<TimeEntry, 'id'>) => void;
    projects: Project[];
}

const TimeEntryModal: FC<TimeEntryModalProps> = ({ entry, selectedDate, onClose, onSave, projects }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TimeEntryFormInputs>({
        resolver: zodResolver(timeEntrySchema),
        defaultValues: {
            project_id: entry?.project_id || '',
            service_phase_id: entry?.service_phase_id,
            duration_hours: entry?.duration_hours || undefined,
            description: entry?.description || '',
        },
    });

    const onSubmit: SubmitHandler<TimeEntryFormInputs> = (data) => {
        const entryData = {
            ...data,
            entry_date: selectedDate.toISOString().split('T')[0],
        };
        onSave(entryData);
    };
    
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition";

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                    <h3 className="text-xl font-semibold mb-2">{entry ? 'Zeiteintrag bearbeiten' : 'Neuer Zeiteintrag'}</h3>
                    <p className="text-sm text-text-light mb-6">für den {selectedDate.toLocaleDateString('de-DE')}</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-text-light mb-1 block">Projekt</label>
                            <select {...register("project_id")} className={`${commonInputClasses} ${errors.project_id ? 'input-error' : ''}`}>
                                <option value="" disabled>Projekt auswählen...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {errors.project_id && <p className="text-danger text-xs mt-1">{errors.project_id.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Leistungsphase</label>
                                <select {...register("service_phase_id")} className={`${commonInputClasses} ${errors.service_phase_id ? 'input-error' : ''}`}>
                                     <option value="" disabled>LP auswählen...</option>
                                    {initialLeistungsphasen.map(lp => <option key={lp.id} value={lp.id}>{lp.name}</option>)}
                                </select>
                                {errors.service_phase_id && <p className="text-danger text-xs mt-1">{errors.service_phase_id.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-light mb-1 block">Dauer (in Stunden)</label>
                                <input type="number" step="0.25" {...register("duration_hours")} className={`${commonInputClasses} ${errors.duration_hours ? 'input-error' : ''}`} placeholder="z.B. 1.5"/>
                                {errors.duration_hours && <p className="text-danger text-xs mt-1">{errors.duration_hours.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-text-light mb-1 block">Beschreibung (optional)</label>
                            <textarea {...register("description")} rows={3} className={commonInputClasses}></textarea>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover" onClick={onClose}>Abbrechen</button>
                        <button type="submit" className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover" disabled={isSubmitting}>{isSubmitting ? 'Speichert...' : 'Speichern'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TimeEntryModal;
